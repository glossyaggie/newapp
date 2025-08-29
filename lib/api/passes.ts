import { supabase } from '../supabase'

export interface ActivePass {
  remaining_credits: number
  valid_until: string
  is_unlimited: boolean
  pass_name: string
}

export async function getActivePass(): Promise<ActivePass | null> {
  console.log('🔄 Fetching active pass...')
  
  const { data, error } = await supabase.rpc('get_active_pass')
  
  if (error) {
    console.error('❌ Error fetching active pass:', error)
    throw error
  }
  
  console.log('✅ Active pass fetched:', data)
  return data
}

export interface CatalogPrice {
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

export async function getCatalogPrices(): Promise<CatalogPrice[]> {
  console.log('🔄 Fetching catalog prices from Stripe...')
  
  const { data, error } = await supabase.functions.invoke('catalog_prices')
  
  if (error) {
    console.error('❌ Error fetching catalog prices:', error)
    throw new Error(`Failed to fetch catalog prices: ${error.message}`)
  }
  
  if (!data?.prices) {
    console.warn('⚠️ No prices returned from catalog_prices function')
    return []
  }
  
  console.log('✅ Catalog prices fetched:', data.prices.length, 'prices')
  return data.prices
}

export async function getPassTypes() {
  console.log('🔄 Fetching pass types...')
  
  const { data, error } = await supabase
    .from('pass_types')
    .select('*')
    .eq('active', true)
    .order('sort_order')
  
  if (error) {
    console.error('❌ Error fetching pass types:', error)
    throw error
  }
  
  console.log('✅ Pass types fetched:', data?.length, 'types')
  return data
}



export async function createStripeCheckout(catalogPrice: CatalogPrice) {
  console.log('🔄 Creating Stripe checkout session...')
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase.functions.invoke('create_checkout_session', {
    body: {
      priceId: catalogPrice.stripe_price_id,
      passTypeId: catalogPrice.id,
      userId: user.id,
      userEmail: user.email,
      mode: catalogPrice.recurring ? 'subscription' : 'payment',
    },
  })

  if (error) {
    console.error('❌ Error creating checkout session:', error)
    throw new Error(`Failed to create checkout session: ${error.message}`)
  }

  if (!data?.url) {
    throw new Error('No checkout URL returned')
  }

  console.log('✅ Checkout session created successfully')
  return data.url
}