import { supabase } from '@/lib/supabase'

export interface ClassRoster {
  booking_id: string
  user_name: string
  user_email: string
  checked_in: boolean
  check_in_time: string | null
  check_in_method: string | null
}

export interface QRCodeResponse {
  success: boolean
  qr_code?: string
  expires_at?: string
  error?: string
}

export interface CheckInResponse {
  success: boolean
  message?: string
  error?: string
}

// QR Code Check-in
export async function checkInWithQR(qrCode: string, userId: string): Promise<CheckInResponse> {
  try {
    const { data, error } = await supabase.rpc('check_in_with_qr', {
      qr_code_text: qrCode,
      user_id: userId
    })

    if (error) {
      console.error('QR check-in error:', error)
      return { success: false, error: error.message }
    }

    return data
  } catch (error) {
    console.error('QR check-in error:', error)
    return { success: false, error: 'Failed to check in' }
  }
}

// Manual check-in for teachers
export async function manualCheckIn(bookingId: string, checkInStatus: boolean): Promise<CheckInResponse> {
  try {
    const { data, error } = await supabase.rpc('manual_check_in', {
      booking_id: bookingId,
      check_in_status: checkInStatus
    })

    if (error) {
      console.error('Manual check-in error:', error)
      return { success: false, error: error.message }
    }

    return data
  } catch (error) {
    console.error('Manual check-in error:', error)
    return { success: false, error: 'Failed to update check-in status' }
  }
}

// Generate QR code for a class
export async function generateClassQR(classId: string): Promise<QRCodeResponse> {
  try {
    const { data, error } = await supabase.rpc('generate_class_qr', {
      class_id: classId
    })

    if (error) {
      console.error('Generate QR error:', error)
      return { success: false, error: error.message }
    }

    return data
  } catch (error) {
    console.error('Generate QR error:', error)
    return { success: false, error: 'Failed to generate QR code' }
  }
}

// Get class roster for check-in
export async function getClassRoster(classId: string): Promise<ClassRoster[]> {
  try {
    console.log('🔍 Debug getClassRoster:', { classId })
    
    const { data, error } = await supabase.rpc('get_class_roster', {
      class_id: classId
    })

    if (error) {
      console.error('Get roster error:', error)
      return []
    }

    console.log('👥 Roster data:', data)
    return data || []
  } catch (error) {
    console.error('Get roster error:', error)
    return []
  }
}

// Get upcoming classes for the next few days (for teachers to select)
export async function getTodayClasses(): Promise<any[]> {
  try {
    const today = new Date().toISOString().split('T')[0]
    const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false })
    
    console.log('🔍 Debug getTodayClasses:', { today, currentTime })
    
    // Get classes for today and the next 7 days
    const { data, error } = await supabase
      .from('class_schedule')
      .select('id, title, instructor, date, start_time, end_time')
      .gte('date', today)
      .lte('date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('date')
      .order('start_time')

    if (error) {
      console.error('Get today classes error:', error)
      return []
    }

    // Filter out classes that have finished (end_time has passed)
    const now = new Date()
    const filteredClasses = data?.filter(classItem => {
      const classEndTime = new Date(`${classItem.date}T${classItem.end_time}`)
      return classEndTime > now // Only show classes that haven't finished yet
    }) || []

    console.log('📅 Found classes for next 7 days (filtered):', filteredClasses)
    return filteredClasses
  } catch (error) {
    console.error('Get today classes error:', error)
    return []
  }
}
