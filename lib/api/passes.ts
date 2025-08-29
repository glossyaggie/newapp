import { supabase } from '../supabase'
import { Platform } from 'react-native'

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

export async function createStripeCheckout(priceId: string, passTypeId: string) {
  console.log('🔄 Creating Stripe checkout session...')
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      priceId,
      passTypeId,
      userId: user.id,
      userEmail: user.email,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create checkout session: ${error}`)
  }

  const { url } = await response.json()
  return url
}