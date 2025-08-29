import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Global declarations for Deno runtime
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Price ID to pass type mapping - matches exact names from database
const PRICE_MAPPINGS = {
  'price_1S0r9bARpqh0Ut1y4lHGGuAT': {
    pass_type: 'Single Class',
    credits: 1,
    mode: 'payment'
  },
  'price_1S0vfBARpqh0Ut1ybKjeqehJ': {
    pass_type: '5-Class Pack',
    credits: 5,
    mode: 'payment'
  },
  'price_1S0rHLARpqh0Ut1ybWGa3ocf': {
    pass_type: '10-Class Pack',
    credits: 10,
    mode: 'payment'
  },
  'price_1S0rHqARpqh0Ut1ygGGaoqac': {
    pass_type: '25-Class Pack',
    credits: 25,
    mode: 'payment'
  },
  // subscriptions
  'price_1S0rIRARpqh0Ut1yQkmz18xc': {
    pass_type: 'Weekly Unlimited',
    durationDays: 7,
    mode: 'subscription'
  },
  'price_1S0rJlARpqh0Ut1yaeBEQVRf': {
    pass_type: 'Monthly Unlimited',
    durationDays: 30,
    mode: 'subscription'
  },
  'price_1S0rKbARpqh0Ut1ydYwnH2Zy': {
    pass_type: 'VIP Monthly',
    durationDays: 30,
    mode: 'subscription'
  },
  'price_1S0rLOARpqh0Ut1y2lbJ17g7': {
    pass_type: 'VIP Yearly',
    durationDays: 365,
    mode: 'subscription'
  },
} as const

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔄 Starting Stripe price sync...')

    // Initialize Stripe
    const { default: Stripe } = await import('https://esm.sh/stripe@14.21.0')
    const stripeClient = new (Stripe as any)(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    })

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Fetch all prices from Stripe
    const prices = await stripeClient.prices.list({
      active: true,
      expand: ['data.product'],
    })

    console.log(`📊 Found ${prices.data.length} active prices in Stripe`)

    const updates = []

    // Process each price
    for (const price of prices.data) {
      const mapping = PRICE_MAPPINGS[price.id as keyof typeof PRICE_MAPPINGS]
      if (!mapping) {
        console.log(`⚠️ No mapping found for price ${price.id}, skipping`)
        continue
      }

      const priceInDollars = price.unit_amount ? price.unit_amount / 100 : 0
      
      console.log(`💰 Processing ${price.id}: ${priceInDollars} (${mapping.pass_type})`)

      // Update pass type in database
      const { error } = await supabase
        .from('pass_types')
        .update({
          price: priceInDollars,
          stripe_price_id: price.id,
          updated_at: new Date().toISOString(),
        })
        .eq('name', mapping.pass_type)

      if (error) {
        console.error(`❌ Error updating ${mapping.pass_type}:`, error)
        updates.push({ pass_type: mapping.pass_type, status: 'error', error: error.message })
      } else {
        console.log(`✅ Updated ${mapping.pass_type} to ${priceInDollars}`)
        updates.push({ pass_type: mapping.pass_type, status: 'success', price: priceInDollars })
      }
    }

    console.log('🎉 Stripe price sync completed!')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Prices synced successfully',
        updates 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Error syncing Stripe prices:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})