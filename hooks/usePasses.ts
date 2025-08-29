import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { useEffect } from 'react'

export function usePasses() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Get active pass
  const activePassQuery = useQuery({
    queryKey: ['active-pass', user?.id],
    queryFn: async () => {
      if (!user) return null
      
      const { data, error } = await supabase.rpc('get_active_pass')
      
      if (error) {
        console.error('Error fetching active pass:', error)
        throw error
      }
      
      return data
    },
    enabled: !!user,
  })

  // Get pass types for purchase
  const passTypesQuery = useQuery({
    queryKey: ['pass-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pass_types')
        .select('*')
        .eq('active', true)
        .order('sort_order')
      
      if (error) {
        console.error('Error fetching pass types:', error)
        throw error
      }
      
      return data
    },
  })

  // Subscribe to wallet updates via Realtime
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`wallet:user:${user.id}`)
      .on('broadcast', { event: 'wallet_updated' }, () => {
        console.log('Wallet updated via realtime')
        queryClient.invalidateQueries({ queryKey: ['active-pass', user.id] })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, queryClient])

  const activePass = activePassQuery.data
  const passTypes = passTypesQuery.data || []
  const isLoading = activePassQuery.isLoading || passTypesQuery.isLoading
  const hasLowCredits = activePass && !activePass.is_unlimited && activePass.remaining_credits <= 2

  return {
    activePass,
    passTypes,
    isLoading,
    hasLowCredits,
    refetch: activePassQuery.refetch,
  }
}