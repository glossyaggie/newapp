import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getCurrentSpecial, 
  getAllSpecials, 
  createSpecial, 
  updateSpecial, 
  toggleSpecialStatus, 
  deleteSpecial,
  type WeeklySpecial,
  type CreateSpecialData 
} from '@/lib/api/specials'

// Hook for getting current special (for home page)
export function useCurrentSpecial() {
  return useQuery({
    queryKey: ['current-special'],
    queryFn: getCurrentSpecial,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook for admin to manage all specials
export function useSpecials() {
  return useQuery({
    queryKey: ['specials'],
    queryFn: getAllSpecials,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook for creating specials
export function useCreateSpecial() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createSpecial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specials'] })
      queryClient.invalidateQueries({ queryKey: ['current-special'] })
    },
  })
}

// Hook for updating specials
export function useUpdateSpecial() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreateSpecialData> }) =>
      updateSpecial(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specials'] })
      queryClient.invalidateQueries({ queryKey: ['current-special'] })
    },
  })
}

// Hook for toggling special status
export function useToggleSpecialStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleSpecialStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specials'] })
      queryClient.invalidateQueries({ queryKey: ['current-special'] })
    },
  })
}

// Hook for deleting specials
export function useDeleteSpecial() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteSpecial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specials'] })
      queryClient.invalidateQueries({ queryKey: ['current-special'] })
    },
  })
}
