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