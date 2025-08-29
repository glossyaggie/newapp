import { supabase } from '../supabase'

export interface BookingResult {
  success: boolean
  booking_id?: string
  new_balance?: number
  status?: string
  error?: string
}

export interface CancelResult {
  success: boolean
  new_balance?: number
  error?: string
}

export async function bookClass(classId: string): Promise<BookingResult> {
  console.log('🔄 Booking class:', classId)
  
  const { data, error } = await supabase.rpc('book_class', {
    p_class_id: classId
  })
  
  if (error) {
    console.error('❌ Error booking class:', error)
    throw error
  }
  
  console.log('✅ Class booking result:', data)
  return data
}

export async function cancelBooking(bookingId: string): Promise<CancelResult> {
  console.log('🔄 Cancelling booking:', bookingId)
  
  const { data, error } = await supabase.rpc('cancel_booking', {
    p_booking_id: bookingId
  })
  
  if (error) {
    console.error('❌ Error cancelling booking:', error)
    throw error
  }
  
  console.log('✅ Booking cancellation result:', data)
  return data
}

export async function getUserBookings() {
  console.log('🔄 Fetching user bookings...')
  
  const { data, error } = await supabase
    .from('class_bookings')
    .select(`
      *,
      class_schedule (
        id,
        title,
        instructor,
        date,
        start_time,
        end_time,
        capacity,
        duration_min,
        heat_c,
        level,
        notes
      )
    `)
    .order('booked_at', { ascending: false })
  
  if (error) {
    console.error('❌ Error fetching user bookings:', error)
    throw error
  }
  
  console.log('✅ User bookings fetched:', data?.length, 'bookings')
  return data
}