import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { format, startOfDay, endOfDay } from 'date-fns'

export interface ClassWithBooking {
  id: string
  title: string
  instructor: string
  date: string
  start_time: string
  end_time: string
  capacity: number
  duration_min: number
  heat_c: number | null
  level: string | null
  notes: string | null
  booking_count: number
  user_booking: {
    id: string
    status: string
  } | null
  is_favorite: boolean
}

export function useSchedule(selectedDate: Date) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const scheduleQuery = useQuery({
    queryKey: ['schedule', format(selectedDate, 'yyyy-MM-dd'), user?.id],
    queryFn: async () => {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      
      let query = supabase
        .from('class_schedule')
        .select(`
          *,
          class_bookings!inner(count),
          class_bookings!left(id, status, user_id),
          favorites!left(id, user_id)
        `)
        .eq('date', dateStr)
        .order('start_time')

      const { data, error } = await query

      if (error) {
        console.error('Error fetching schedule:', error)
        throw error
      }

      // Transform the data to include booking counts and user bookings
      const transformedData: ClassWithBooking[] = data?.map((classItem: any) => {
        const bookings = classItem.class_bookings || []
        const activeBookings = bookings.filter((b: any) => b.status === 'booked')
        const userBooking = user ? bookings.find((b: any) => b.user_id === user.id && b.status === 'booked') : null
        const isFavorite = user ? (classItem.favorites || []).some((f: any) => f.user_id === user.id) : false

        return {
          ...classItem,
          booking_count: activeBookings.length,
          user_booking: userBooking || null,
          is_favorite: isFavorite,
        }
      }) || []

      return transformedData
    },
    enabled: !!selectedDate,
  })

  const bookClassMutation = useMutation({
    mutationFn: async (classId: string) => {
      const { data, error } = await supabase.rpc('book_class', {
        p_class_id: classId
      })

      if (error) {
        console.error('Error booking class:', error)
        throw error
      }

      return data
    },
    onSuccess: (data, classId) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['schedule'] })
      queryClient.invalidateQueries({ queryKey: ['active-pass'] })
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] })
      
      console.log('Class booked successfully:', data)
    },
  })

  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const { data, error } = await supabase.rpc('cancel_booking', {
        p_booking_id: bookingId
      })

      if (error) {
        console.error('Error cancelling booking:', error)
        throw error
      }

      return data
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['schedule'] })
      queryClient.invalidateQueries({ queryKey: ['active-pass'] })
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] })
      
      console.log('Booking cancelled successfully')
    },
  })

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ classId, isFavorite }: { classId: string; isFavorite: boolean }) => {
      if (!user) throw new Error('User not authenticated')

      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('class_id', classId)

        if (error) throw error
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            class_id: classId,
          })

        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] })
    },
  })

  return {
    classes: scheduleQuery.data || [],
    isLoading: scheduleQuery.isLoading,
    error: scheduleQuery.error,
    bookClass: bookClassMutation.mutate,
    cancelBooking: cancelBookingMutation.mutate,
    toggleFavorite: toggleFavoriteMutation.mutate,
    isBooking: bookClassMutation.isPending,
    isCancelling: cancelBookingMutation.isPending,
    isTogglingFavorite: toggleFavoriteMutation.isPending,
  }
}