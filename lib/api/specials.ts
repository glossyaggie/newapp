import { supabase } from '@/lib/supabase'

export interface WeeklySpecial {
  id: string
  title: string
  description?: string
  discount_percentage?: number
  valid_from: string
  valid_until: string
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string
}

export interface CreateSpecialData {
  title: string
  description?: string
  discount_percentage?: number
  valid_from: string
  valid_until: string
}

// Get current active special
export async function getCurrentSpecial(): Promise<WeeklySpecial | null> {
  const { data, error } = await supabase
    .from('weekly_specials')
    .select('*')
    .eq('is_active', true)
    .gte('valid_until', new Date().toISOString().split('T')[0])
    .lte('valid_from', new Date().toISOString().split('T')[0])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error('Error fetching current special:', error)
    return null
  }

  return data
}

// Get all specials (admin only)
export async function getAllSpecials(): Promise<WeeklySpecial[]> {
  const { data, error } = await supabase
    .from('weekly_specials')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching all specials:', error)
    throw error
  }

  return data || []
}

// Create new special (admin only)
export async function createSpecial(specialData: CreateSpecialData): Promise<WeeklySpecial> {
  const { data, error } = await supabase
    .from('weekly_specials')
    .insert([specialData])
    .select()
    .single()

  if (error) {
    console.error('Error creating special:', error)
    throw error
  }

  return data
}

// Update special (admin only)
export async function updateSpecial(id: string, updates: Partial<CreateSpecialData>): Promise<WeeklySpecial> {
  const { data, error } = await supabase
    .from('weekly_specials')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating special:', error)
    throw error
  }

  return data
}

// Toggle special active status (admin only)
export async function toggleSpecialStatus(id: string, isActive: boolean): Promise<WeeklySpecial> {
  const { data, error } = await supabase
    .from('weekly_specials')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error toggling special status:', error)
    throw error
  }

  return data
}

// Delete special (admin only)
export async function deleteSpecial(id: string): Promise<void> {
  const { error } = await supabase
    .from('weekly_specials')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting special:', error)
    throw error
  }
}
