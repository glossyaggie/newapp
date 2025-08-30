import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProfile, updateMonthlyGoal, Profile } from '@/lib/api/profile'
import { useAuth } from './useAuth'

export function useProfile() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => getProfile(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useUpdateMonthlyGoal() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (monthlyGoal: number) => updateMonthlyGoal(user!.id, monthlyGoal),
    onSuccess: () => {
      // Force refetch both profile and streaks data
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['streaks', user?.id] })
    },
  })
}
