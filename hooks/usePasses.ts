import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { useEffect } from 'react'

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


  // Get active pass
  const activePassQuery = useQuery({
    queryKey: ['active-pass', user?.id],
    queryFn: async (): Promise<ActivePass> => {
      if (!user) return null
      
      console.log('🔄 Fetching active pass for user:', user.id)
      const { data, error } = await supabase.rpc('get_active_pass')
      
      if (error) {
        console.error('Error fetching active pass:', error)
        return null
      }
      
      console.log('🔄 Active pass data:', data)
      return data
    },
    enabled: !!user,
    staleTime: 0, // Always consider data stale
    refetchOnWindowFocus: true,
  })



  // Get pass types for purchase
  const passTypesQuery = useQuery({
    queryKey: ['pass-types'] as const,
    queryFn: async (): Promise<PassType[]> => {
      const { data, error } = await supabase
        .from('pass_types')
        .select('id,name,kind,credits,duration_days,stripe_price_id,price_amount_cents,currency,is_subscription,interval,interval_count,sort_order,active')
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