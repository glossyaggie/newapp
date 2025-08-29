import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const signature = req.headers.get('stripe-signature')
    const body = await req.text()
    
    if (!signature) {
      throw new Error('No Stripe signature found')
    }

    // Verify webhook signature
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    const stripe = await import('https://esm.sh/stripe@14.21.0')
    const stripeClient = new stripe.default(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    })

    let event
    try {
      event = stripeClient.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message)
      return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Log webhook for idempotency
    const { error: logError } = await supabase
      .from('stripe_webhooks')
      .insert({
        type: event.type,
        payload: event,
      })

    if (logError && !logError.message.includes('duplicate key')) {
      throw logError
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        console.log('Processing checkout session:', session.id)

        // Get price ID from session metadata first, then try to expand line items if needed
        let priceId = session.metadata?.price_id
        
        if (!priceId) {
          // If no price ID in metadata, expand the session to get line items
          const expandedSession = await stripeClient.checkout.sessions.retrieve(session.id, {
            expand: ['line_items']
          })
          priceId = expandedSession.line_items?.data?.[0]?.price?.id
        }
        
        console.log('Session metadata:', session.metadata)
        console.log('Price ID found:', priceId)

        if (!priceId) {
          throw new Error('No price ID found in session')
        }

        // Find matching pass type
        const { data: passType, error: passTypeError } = await supabase
          .from('pass_types')
          .select('*')
          .eq('stripe_price_id', priceId)
          .single()

        if (passTypeError || !passType) {
          throw new Error(`Pass type not found for price ID: ${priceId}`)
        }

        const userId = session.client_reference_id || session.metadata?.user_id
        if (!userId) {
          throw new Error('No user ID found in session')
        }

        // Record purchase
        const { error: purchaseError } = await supabase
          .from('pass_purchases')
          .insert({
            user_id: userId,
            pass_type_id: passType.id,
            stripe_session_id: session.id,
          })

        if (purchaseError && !purchaseError.message.includes('duplicate key')) {
          throw purchaseError
        }

        // Create or update user pass
        const validFrom = new Date()
        const validUntil = new Date()
        validUntil.setDate(validUntil.getDate() + passType.duration_days)

        // Check if user has existing active pass of same type
        const { data: existingPass } = await supabase
          .from('user_passes')
          .select('*')
          .eq('user_id', userId)
          .eq('pass_type_id', passType.id)
          .eq('is_active', true)
          .single()

        if (existingPass && passType.kind === 'pack') {
          // Add credits to existing pack
          const { error: updateError } = await supabase
            .from('user_passes')
            .update({
              remaining_credits: existingPass.remaining_credits + (passType.credits || 0),
              valid_until: validUntil.toISOString(),
              status: 'active'
            })
            .eq('id', existingPass.id)

          if (updateError) throw updateError
        } else if (existingPass && passType.kind === 'unlimited') {
          // Extend unlimited pass
          const newValidUntil = new Date(Math.max(
            new Date(existingPass.valid_until).getTime(),
            validFrom.getTime()
          ))
          newValidUntil.setDate(newValidUntil.getDate() + passType.duration_days)

          const { error: updateError } = await supabase
            .from('user_passes')
            .update({
              valid_until: newValidUntil.toISOString(),
              status: 'active'
            })
            .eq('id', existingPass.id)

          if (updateError) throw updateError
        } else {
          // Create new pass
          const { error: insertError } = await supabase
            .from('user_passes')
            .insert({
              user_id: userId,
              pass_type_id: passType.id,
              remaining_credits: passType.credits || 0,
              valid_from: validFrom.toISOString(),
              valid_until: validUntil.toISOString(),
              is_active: true,
              status: 'active'
            })

          if (insertError) throw insertError
        }

        // Broadcast wallet update via Realtime
        const channel = supabase.channel(`wallet:user:${userId}`)
        await channel.send({
          type: 'broadcast',
          event: 'wallet_updated',
          payload: { user_id: userId, trigger: 'purchase_completed' }
        })

        console.log('Successfully processed checkout session:', session.id)
        break
      }

      case 'invoice.payment_succeeded': {
        // Handle subscription renewals (future feature)
        console.log('Invoice payment succeeded:', event.data.object.id)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})