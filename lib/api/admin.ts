import { supabase } from '../supabase'

export async function adminUpsertClass(classData: {
  id?: string
  title: string
  instructor: string
  date: string
  start_time: string
  end_time: string
  capacity: number
  duration_min: number
  heat_c?: number
  level?: string
  notes?: string
}) {
  console.log('🔄 Admin upserting class:', classData.title)
  
  const { data, error } = await (supabase as any).rpc('admin_upsert_class', {
    p_id: classData.id || null,
    p_title: classData.title,
    p_instructor: classData.instructor,
    p_date: classData.date,
    p_start_time: classData.start_time,
    p_end_time: classData.end_time,
    p_capacity: classData.capacity,
    p_duration_min: classData.duration_min,
    p_heat_c: classData.heat_c || null,
    p_level: classData.level || null,
    p_notes: classData.notes || null
  })
  
  if (error) {
    console.error('❌ Error upserting class:', error)
    throw error
  }
  
  console.log('✅ Class upserted:', data)
  return data
}

export async function adminCancelClass(classId: string, reason?: string) {
  console.log('🔄 Admin cancelling class:', classId)
  
  const { data, error } = await (supabase as any).rpc('admin_cancel_class', {
    p_class_id: classId,
    p_reason: reason || 'Class cancelled'
  })
  
  if (error) {
    console.error('❌ Error cancelling class:', error)
    throw error
  }
  
  console.log('✅ Class cancelled:', data)
  return data
}

export async function adminMarkAttendance(bookingId: string, status: 'attended' | 'no_show') {
  console.log('🔄 Admin marking attendance:', bookingId, status)
  
  const { data, error } = await (supabase as any).rpc('admin_mark_attendance', {
    p_booking_id: bookingId,
    p_status: status
  })
  
  if (error) {
    console.error('❌ Error marking attendance:', error)
    throw error
  }
  
  console.log('✅ Attendance marked:', data)
  return data
}

export async function importScheduleFromCSV(csvData: string, userEmail: string) {
  console.log('🔄 Importing schedule from CSV...')
  
  const { data, error } = await supabase.functions.invoke('schedule_import', {
    body: {
      csv_data: csvData,
      user_email: userEmail
    }
  })
  
  if (error) {
    console.error('❌ Error importing schedule:', error)
    throw error
  }
  
  console.log('✅ Schedule imported:', data)
  return data
}

// Waiver Document Management
export interface WaiverDocument {
  id: string
  title: string
  content: string
  file_url?: string | null
  is_active: boolean
  version: number
  created_by: string
  created_at: string
}

export const waiverApi = {
  // Get active waiver
  async getActiveWaiver(): Promise<WaiverDocument | null> {
    const { data, error } = await (supabase as any)
      .from('waiver_documents')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching active waiver:', error)
      throw error
    }
    
    return data || null
  },

  // Get all waivers (admin only)
  async getAllWaivers(): Promise<WaiverDocument[]> {
    const { data, error } = await (supabase as any)
      .from('waiver_documents')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching waivers:', error)
      throw error
    }
    
    return data || []
  },

  // Create new waiver (admin only)
  async createWaiver(waiver: Omit<WaiverDocument, 'id' | 'created_by' | 'created_at'>): Promise<WaiverDocument> {
    const user = await supabase.auth.getUser()
    if (!user.data.user) throw new Error('User not authenticated')

    const { data, error } = await (supabase as any)
      .from('waiver_documents')
      .insert({
        ...waiver,
        created_by: user.data.user.id
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating waiver:', error)
      throw error
    }
    
    return data
  },

  // Update waiver (admin only)
  async updateWaiver(id: string, updates: Partial<Omit<WaiverDocument, 'id' | 'created_by' | 'created_at'>>): Promise<WaiverDocument> {
    const { data, error } = await (supabase as any)
      .from('waiver_documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating waiver:', error)
      throw error
    }
    
    return data
  },

  // Set waiver as active (deactivates others)
  async setActiveWaiver(id: string): Promise<void> {
    // First deactivate all waivers
    const { error: deactivateError } = await (supabase as any)
      .from('waiver_documents')
      .update({ is_active: false })
      .neq('id', '00000000-0000-0000-0000-000000000000') // Update all
    
    if (deactivateError) {
      console.error('Error deactivating waivers:', deactivateError)
      throw deactivateError
    }

    // Then activate the selected one
    const { error: activateError } = await (supabase as any)
      .from('waiver_documents')
      .update({ is_active: true })
      .eq('id', id)
    
    if (activateError) {
      console.error('Error activating waiver:', activateError)
      throw activateError
    }
  },

  // Delete waiver (admin only)
  async deleteWaiver(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('waiver_documents')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting waiver:', error)
      throw error
    }
  }
}