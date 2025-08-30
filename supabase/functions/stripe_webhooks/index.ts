// @ts-nocheck
// This is a Supabase Edge Function that runs in Deno, not Node.js
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔔 Webhook received:', req.method, req.url)
    
    const signature = req.headers.get('stripe-signature')
    const body = await req.text()
    
    console.log('📝 Webhook body length:', body.length)
    console.log('🔑 Signature present:', !!signature)
    
    if (!signature) {
      throw new Error('No Stripe signature found')
    }

    // Verify webhook signature
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    console.log('🔐 Webhook secret present:', !!webhookSecret)
    
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured')
    }
    
    const { default: Stripe } = await import('https://esm.sh/stripe@14.21.0')
    const stripeClient = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    })

    let event
    try {
      event = await stripeClient.webhooks.constructEventAsync(body, signature, webhookSecret)
      console.log('✅ Webhook signature verified, event type:', event.type)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('❌ Webhook signature verification failed:', errorMessage)
      return new Response(`Webhook Error: ${errorMessage}`, { status: 400 })
    }

    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    console.log('✅ Supabase client initialized')

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        console.log('🎯 Processing checkout session:', session.id)
        console.log('🏷️ Session metadata:', session.metadata)

        // Get pass type ID and user ID from metadata
        const passTypeId = session.metadata?.passTypeId
        const userId = session.metadata?.userId
        
        console.log('🎫 Pass type ID from metadata:', passTypeId)
        console.log('👤 User ID from metadata:', userId)

        if (!passTypeId) {
          throw new Error('No pass type ID found in session metadata')
        }

        if (!userId) {
          throw new Error('No user ID found in session metadata')
        }

        // Get pass type details
        const { data: passType, error: passTypeError } = await supabase
          .from('pass_types')
          .select('*')
          .eq('id', passTypeId)
          .single()

        if (passTypeError || !passType) {
          throw new Error(`Pass type not found for ID: ${passTypeId}`)
        }

        console.log('✅ Found pass type:', passType.name)

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

        console.log('✅ Purchase recorded')

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
          console.log('✅ Updated existing pack pass')
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
          console.log('✅ Extended unlimited pass')
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
          console.log('✅ Created new pass')
        }

        // Broadcast wallet update via Realtime
        const channel = supabase.channel(`wallet:user:${userId}`)
        await channel.send({
          type: 'broadcast',
          event: 'wallet_updated',
          payload: { user_id: userId, trigger: 'purchase_completed' }
        })

        console.log('✅ Successfully processed checkout session:', session.id)
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})