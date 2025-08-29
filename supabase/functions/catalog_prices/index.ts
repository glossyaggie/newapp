import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CatalogPrice {
  id: string
  name: string
  stripe_price_id: string
  unit_amount: number
  currency: string
  recurring: boolean
  per_class?: number
  classes_count?: number
  validity_days: number
  pass_type: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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

    // Get active pass types from database
    const { data: passTypes, error: passTypesError } = await supabase
      .from('pass_types')
      .select('id, name, credits, duration_days, kind, stripe_price_id, active')
      .eq('active', true)
      .order('sort_order')

    if (passTypesError) {
      throw new Error(`Failed to fetch pass types: ${passTypesError.message}`)
    }

    if (!passTypes || passTypes.length === 0) {
      return new Response(
        JSON.stringify({ prices: [] }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Fetch prices from Stripe for each pass type
    const catalogPrices: CatalogPrice[] = []

    for (const passType of passTypes) {
      if (!passType.stripe_price_id) {
        console.warn(`⚠️ No Stripe price ID for pass type: ${passType.name}`)
        continue
      }

      try {
        const stripePrice = await stripeClient.prices.retrieve(passType.stripe_price_id)
        
        const catalogPrice: CatalogPrice = {
          id: passType.id,
          name: passType.name,
          stripe_price_id: passType.stripe_price_id,
          unit_amount: stripePrice.unit_amount || 0,
          currency: stripePrice.currency,
          recurring: stripePrice.type === 'recurring',
          classes_count: passType.credits,
          validity_days: passType.duration_days,
          pass_type: passType.kind,
        }

        // Calculate per-class price for pack types
        if (passType.kind === 'pack' && passType.credits && stripePrice.unit_amount) {
          catalogPrice.per_class = stripePrice.unit_amount / passType.credits
        }

        catalogPrices.push(catalogPrice)
        console.log(`✅ Fetched price for ${passType.name}: ${stripePrice.unit_amount} ${stripePrice.currency}`)
      } catch (stripeError) {
        console.error(`❌ Failed to fetch Stripe price for ${passType.name}:`, stripeError)
        // Continue with other prices even if one fails
      }
    }

    console.log(`✅ Successfully fetched ${catalogPrices.length} prices from Stripe`)

    return new Response(
      JSON.stringify({ prices: catalogPrices }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Error fetching catalog prices:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})