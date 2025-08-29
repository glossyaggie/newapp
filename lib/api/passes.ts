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

export async function syncStripePrices() {
  console.log('🔄 Syncing prices from Stripe...')
  
  const { data, error } = await supabase.functions.invoke('sync_stripe_prices')
  
  if (error) {
    console.error('❌ Error syncing Stripe prices:', error)
    throw new Error(`Failed to sync prices: ${error.message}`)
  }
  
  console.log('✅ Prices synced successfully:', data)
  return data
}

export async function createStripeCheckout(priceId: string, passTypeId: string) {
  console.log('🔄 Creating Stripe checkout session...')
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase.functions.invoke('create_checkout_session', {
    body: {
      priceId,
      passTypeId,
      userId: user.id,
      userEmail: user.email,
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