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
  
  const { data, error } = await supabase.rpc('admin_upsert_class', {
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
  
  const { data, error } = await supabase.rpc('admin_cancel_class', {
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
  
  const { data, error } = await supabase.rpc('admin_mark_attendance', {
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