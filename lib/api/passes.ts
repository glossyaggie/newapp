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

export interface PassType {
  id: string
  name: string
  kind: string
  credits: number | null
  duration_days: number
  stripe_price_id: string
  price_amount_cents: number
  currency: string
  is_subscription: boolean
  interval: string | null
  interval_count: number | null
  sort_order: number
  active: boolean
}

export async function getPassTypes(): Promise<PassType[]> {
  console.log('🔄 Fetching pass types from database...')
  
  const { data, error } = await supabase
    .from('pass_types')
    .select('id,name,kind,credits,duration_days,stripe_price_id,price_amount_cents,currency,is_subscription,interval,interval_count,sort_order,active')
    .eq('active', true)
    .order('sort_order', { ascending: true })
  
  if (error) {
    console.error('❌ Error fetching pass types:', error)
    throw new Error(`Failed to fetch pass types: ${error.message}`)
  }
  
  console.log('✅ Pass types fetched:', data?.length, 'types')
  return data || []
}





export async function createStripeCheckout(passType: PassType) {
  console.log('🔄 Creating Stripe checkout session...')
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase.functions.invoke('create_checkout_session', {
    body: {
      priceId: passType.stripe_price_id,
      passTypeId: passType.id,
      userId: user.id,
      userEmail: user.email,
      mode: passType.is_subscription ? 'subscription' : 'payment',
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