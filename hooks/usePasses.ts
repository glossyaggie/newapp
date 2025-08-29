import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { useEffect, useRef } from 'react'
import { syncStripePrices } from '@/lib/api/passes'
import type { Database } from '@/types/supabase'

type PassType = Database['public']['Tables']['pass_types']['Row']
type ActivePass = {
  remaining_credits: number
  valid_until: string
  is_unlimited: boolean
  pass_name: string
} | null

export function usePasses() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const hasSyncedPrices = useRef(false)

  // Get active pass
  const activePassQuery = useQuery({
    queryKey: ['active-pass', user?.id] as const,
    queryFn: async (): Promise<ActivePass> => {
      if (!user) return null
      
      const { data, error } = await supabase.rpc('get_active_pass')
      
      if (error) {
        console.error('Error fetching active pass:', error)
        return null
      }
      
      return data
    },
    enabled: !!user,
  })

  // Sync prices from Stripe
  const syncPricesMutation = useMutation({
    mutationFn: syncStripePrices,
    onSuccess: () => {
      console.log('✅ Prices synced, refreshing pass types...')
      queryClient.invalidateQueries({ queryKey: ['pass-types'] })
    },
    onError: (error) => {
      console.error('❌ Failed to sync prices:', error)
    },
  })

  // Get pass types for purchase
  const passTypesQuery = useQuery({
    queryKey: ['pass-types'] as const,
    queryFn: async (): Promise<PassType[]> => {
      const { data, error } = await supabase
        .from('pass_types')
        .select('*')
        .eq('active', true)
        .order('sort_order')
      
      if (error) {
        console.error('Error fetching pass types:', error)
        throw error
      }
      
      return data || []
    },
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  })

  // Auto-sync prices from Stripe once per session
  useEffect(() => {
    if (!hasSyncedPrices.current) {
      hasSyncedPrices.current = true
      console.log('🔄 Auto-syncing prices from Stripe...')
      
      syncStripePrices()
        .then(() => {
          console.log('✅ Auto-sync completed, refreshing pass types...')
          queryClient.invalidateQueries({ queryKey: ['pass-types'] })
        })
        .catch((error) => {
          console.warn('⚠️ Auto-sync failed, using cached prices:', error)
        })
    }
  }, [queryClient])

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
    syncPrices: syncPricesMutation.mutate,
    isSyncingPrices: syncPricesMutation.isPending,
  }
}