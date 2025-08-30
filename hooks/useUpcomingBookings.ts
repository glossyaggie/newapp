import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface UpcomingBooking {
  id: string
  class_title: string
  instructor: string
  date: string
  start_time: string
  end_time: string
  status: string
  class_id: string
}

interface BookingRecord {
  id: string
  status: string
  class_id: string
}

interface ClassRecord {
  id: string
  title: string
  instructor: string
  date: string
  start_time: string
  end_time: string
}

export function useUpcomingBookings() {
  const { user } = useAuth()

  const upcomingBookingsQuery = useQuery({
    queryKey: ['upcoming-bookings', user?.id],
    queryFn: async (): Promise<UpcomingBooking[]> => {
      if (!user) return []

      console.log('Fetching bookings for user:', user.id)

      // First get the bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('class_bookings')
        .select('id, status, class_id')
        .eq('user_id', user.id)
        .in('status', ['booked', 'waitlist'])
        .neq('status', 'cancelled') // Exclude cancelled bookings

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError)
        throw bookingsError
      }

      if (!bookings || bookings.length === 0) {
        return []
      }

      // Get the class IDs
      const classIds = (bookings as BookingRecord[]).map(b => b.class_id)

      // Then get the class details
      const { data: classes, error: classesError } = await supabase
        .from('class_schedule')
        .select('id, title, instructor, date, start_time, end_time')
        .in('id', classIds)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date')
        .order('start_time')

      if (classesError) {
        console.error('Error fetching classes:', classesError)
        throw classesError
      }

      // Combine the data and filter out past classes
      const now = new Date()
      const currentTime = now.toTimeString().split(' ')[0] // Get current time as HH:MM:SS
      const today = now.toISOString().split('T')[0] // Get current date as YYYY-MM-DD
      
      const transformedData: UpcomingBooking[] = (bookings as BookingRecord[]).map(booking => {
        const classData = (classes as ClassRecord[])?.find(c => c.id === booking.class_id)
        if (!classData) return null

        // Filter out classes that have already started
        if (classData.date < today || (classData.date === today && classData.start_time <= currentTime)) {
          return null
        }

        return {
          id: booking.id,
          class_title: classData.title,
          instructor: classData.instructor,
          date: classData.date,
          start_time: classData.start_time,
          end_time: classData.end_time,
          status: booking.status,
          class_id: booking.class_id,
        }
      }).filter(Boolean) as UpcomingBooking[]

      console.log('Transformed booking data:', transformedData)
      return transformedData
    },
    enabled: !!user,
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  })

  return {
    upcomingBookings: upcomingBookingsQuery.data || [],
    isLoading: upcomingBookingsQuery.isLoading,
    error: upcomingBookingsQuery.error,
  }
}
