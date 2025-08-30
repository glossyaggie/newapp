import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>
    
    // Set a timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      setLoading(false)
      setError('Connection timeout. Please check your internet connection.')
    }, 10000) // 10 seconds

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        clearTimeout(timeoutId)
        
        if (error) {
          console.error('Error getting initial session:', error)
          setError('Failed to connect. Please check your internet connection.')
          setLoading(false)
          return
        }
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setLoading(false)
        }
      } catch (err) {
        clearTimeout(timeoutId)
        console.error('Error getting initial session:', err)
        setError('Failed to connect. Please check your internet connection.')
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('Auth state changed:', event, session?.user?.id)
        
        // Clear any existing errors when auth state changes
        setError(null)
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      setError(null)
      
      // First, verify the session is still valid
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        console.log('Session invalid during profile fetch, clearing auth state')
        setUser(null)
        setProfile(null)
        setSession(null)
        setLoading(false)
        return
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create one
        const { data: userData } = await supabase.auth.getUser()
        const userMetadata = userData.user?.user_metadata || {}
        
        const profileData = {
          id: userId,
          first_name: userMetadata.first_name || null,
          last_name: userMetadata.last_name || null,
          fullname: userMetadata.full_name || null,
          phone: userMetadata.phone || null,
          role: 'user' as const,
        }
        
        // Try to insert the profile
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([profileData])
          .select()
          .single()

        if (createError) {
          console.error('Error creating profile:', createError)
          // Don't throw error, just set a minimal profile
          setProfile({
            id: userId,
            first_name: userMetadata.first_name || null,
            last_name: userMetadata.last_name || null,
            fullname: userMetadata.full_name || null,
            phone: userMetadata.phone || null,
            role: 'user',
            waiver_signed_at: null,
            waiver_signature_data: null,
            created_at: new Date().toISOString()
          } as Profile)
        } else {
          setProfile(newProfile)
        }
      } else if (error) {
        console.error('Error fetching profile:', error)
        // Don't throw error, just set loading to false
        setProfile(null)
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error)
      // Don't set error, just set loading to false
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      // Clear local state first
      setUser(null)
      setProfile(null)
      setSession(null)
      setLoading(false)
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in signOut:', error)
      throw error
    }
  }

  const forceRefresh = async () => {
    setLoading(true)
    setError(null)
    try {
      // Clear current state
      setUser(null)
      setProfile(null)
      setSession(null)
      
      // Get fresh session
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Error getting session:', error)
        setError('Failed to refresh session. Please try again.')
        return
      }
      
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Error in forceRefresh:', error)
      setError('Failed to refresh. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = profile?.role === 'admin'
  const hasSignedWaiver = !!profile?.waiver_signed_at

  return {
    user,
    profile,
    session,
    loading,
    error,
    signOut,
    forceRefresh,
    isAdmin,
    hasSignedWaiver,
    refetchProfile: () => user && fetchProfile(user.id),
    // Add a method to check if user is authenticated
    isAuthenticated: !!user && !!session,
  }
}