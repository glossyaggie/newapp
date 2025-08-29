import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { useEffect } from 'react'

export function usePasses() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Get active pass (simplified for now - will use RPC later)
  const activePassQuery = useQuery({
    queryKey: ['active-pass', user?.id],
    queryFn: async () => {
      if (!user) return null
      
      // For now, return null until we set up the database
      // TODO: Replace with supabase.rpc('get_active_pass') once DB is set up
      return null
    },
    enabled: !!user,
  })

  // Get pass types for purchase (simplified for now)
  const passTypesQuery = useQuery({
    queryKey: ['pass-types'],
    queryFn: async () => {
      // For now, return empty array until we set up the database
      // TODO: Replace with actual query once DB is set up
      return []
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
  const hasLowCredits = false // Will implement once we have active pass data

  return {
    activePass,
    passTypes,
    isLoading,
    hasLowCredits,
    refetch: activePassQuery.refetch,
  }
}