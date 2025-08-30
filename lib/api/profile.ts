import { supabase } from '@/lib/supabase'

export interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  fullname: string | null
  phone: string | null
  role: 'user' | 'admin'
  waiver_signed_at: string | null
  waiver_signature_data: string | null
  monthly_goal: number
  created_at: string
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data
}

export async function updateMonthlyGoal(userId: string, monthlyGoal: number): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update({ monthly_goal: monthlyGoal })
    .eq('id', userId)

  if (error) {
    console.error('Error updating monthly goal:', error)
    return false
  }

  return true
}
