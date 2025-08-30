import { supabase } from '../supabase'

export interface ActivePass {
  remaining_credits: number
  valid_until: string
  is_unlimited: boolean
  pass_name: string
}

export async function getActivePass(): Promise<ActivePass | null> {
  const { data, error } = await supabase.rpc('get_active_pass')
  
  if (error) {
    console.error('Error fetching active pass:', error)
    throw error
  }
  
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
  sort_order: number
  active: boolean
}

export async function getPassTypes(): Promise<PassType[]> {
  console.log('🔍 getPassTypes: Starting database query...')
  const { data, error } = await supabase
    .from('pass_types')
    .select('id,name,kind,credits,duration_days,stripe_price_id,price_amount_cents,currency,sort_order,active')
    .eq('active', true)
    .order('sort_order', { ascending: true })
  
  console.log('🔍 getPassTypes: Database response:', { data, error })
  
  if (error) {
    console.error('❌ Error fetching pass types:', error)
    throw new Error(`Failed to fetch pass types: ${error.message}`)
  }

  // Return the data directly since it matches our interface
  console.log('🔍 getPassTypes: Returning data:', data || [])
  return data || []
}

export async function createStripeCheckout(passType: PassType) {
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
      mode: passType.kind === 'unlimited' ? 'subscription' : 'payment',
    },
  })

  if (error) {
    console.error('Error creating checkout session:', error)
    throw new Error(`Failed to create checkout session: ${error.message}`)
  }

  if (!data?.url) {
    throw new Error('No checkout URL returned')
  }

  return data.url
}