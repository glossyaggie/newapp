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
    const { priceId, passTypeId, userId, userEmail, mode } = await req.json()

    if (!priceId || !passTypeId || !userId || !userEmail) {
      throw new Error('Missing required parameters')
    }

    // Initialize Stripe
    const stripe = await import('https://esm.sh/stripe@14.21.0')
    const stripeClient = new stripe.default(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    })

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Create Stripe checkout session
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode || 'payment',
      success_url: `${req.headers.get('origin') || 'http://localhost:8081'}/wallet?success=true`,
      cancel_url: `${req.headers.get('origin') || 'http://localhost:8081'}/wallet?canceled=true`,
      client_reference_id: userId,
      customer_email: userEmail,
      metadata: {
        user_id: userId,
        pass_type_id: passTypeId,
        price_id: priceId,
      },
    })

    console.log('✅ Checkout session created:', session.id)

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})