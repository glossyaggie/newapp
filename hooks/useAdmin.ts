import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminUpsertClass, adminCancelClass, adminMarkAttendance, importScheduleFromCSV } from '@/lib/api/admin'

export function useAdminUpsertClass() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: adminUpsertClass,
    onSuccess: () => {
      console.log('✅ Class upserted successfully')
      // Invalidate schedule queries
      queryClient.invalidateQueries({ queryKey: ['schedule'] })
    },
    onError: (error) => {
      console.error('❌ Failed to upsert class:', error)
    }
  })
}

export function useAdminCancelClass() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ classId, reason }: { classId: string; reason?: string }) => 
      adminCancelClass(classId, reason),
    onSuccess: () => {
      console.log('✅ Class cancelled successfully')
      // Invalidate schedule and booking queries
      queryClient.invalidateQueries({ queryKey: ['schedule'] })
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] })
    },
    onError: (error) => {
      console.error('❌ Failed to cancel class:', error)
    }
  })
}

export function useAdminMarkAttendance() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: string; status: 'attended' | 'no_show' }) => 
      adminMarkAttendance(bookingId, status),
    onSuccess: () => {
      console.log('✅ Attendance marked successfully')
      // Invalidate booking queries
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['schedule'] })
    },
    onError: (error) => {
      console.error('❌ Failed to mark attendance:', error)
    }
  })
}

export function useImportSchedule() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ csvData, userEmail }: { csvData: string; userEmail: string }) => 
      importScheduleFromCSV(csvData, userEmail),
    onSuccess: (data) => {
      console.log('✅ Schedule imported successfully:', data)
      // Invalidate schedule queries
      queryClient.invalidateQueries({ queryKey: ['schedule'] })
    },
    onError: (error) => {
      console.error('❌ Failed to import schedule:', error)
    }
  })
}