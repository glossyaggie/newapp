import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { bookClass, cancelBooking, getUserBookings } from '@/lib/api/bookings'
import { useAuth } from './useAuth'

export function useBookClass() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: bookClass,
    onSuccess: (data, classId) => {
      console.log('✅ Class booked successfully:', data)
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['active-pass', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['schedule'] })
      queryClient.invalidateQueries({ queryKey: ['class', classId] })
      queryClient.invalidateQueries({ queryKey: ['user-bookings', user?.id] })
    },
    onError: (error) => {
      console.error('❌ Failed to book class:', error)
    }
  })
}

export function useCancelBooking() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: cancelBooking,
    onSuccess: (data, bookingId) => {
      console.log('✅ Booking cancelled successfully:', data)
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['active-pass', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['schedule'] })
      queryClient.invalidateQueries({ queryKey: ['user-bookings', user?.id] })
    },
    onError: (error) => {
      console.error('❌ Failed to cancel booking:', error)
    }
  })
}

export function useUserBookings() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['user-bookings', user?.id],
    queryFn: getUserBookings,
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}