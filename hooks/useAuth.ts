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
      console.log('Auth initialization timeout - setting loading to false')
      setLoading(false)
      setError('Connection timeout. Please check your internet connection.')
    }, 10000) // 10 second timeout

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }: { data: { session: Session | null } }) => {
        clearTimeout(timeoutId)
        console.log('Initial session loaded:', !!session)
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfile(session.user.id)
        } else {
          setLoading(false)
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId)
        console.error('Error getting initial session:', err)
        setError('Failed to connect. Please check your internet connection.')
        setLoading(false)
      })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('Auth state changed:', event, session?.user?.id)
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
    console.log('Fetching profile for user:', userId)
    try {
      setError(null)
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
        
        console.log('Creating profile with data:', profileData)
        
        // Try to insert the profile
        let { data: newProfile, error: createError } = await (supabase as any)
          .from('profiles')
          .insert([profileData])
          .select()
          .single()

        // If insert fails due to schema cache issues, try using RPC
        if (createError && createError.code === 'PGRST204') {
          console.log('Schema cache issue detected, trying RPC approach...')
          const { error: rpcError } = await (supabase as any).rpc('create_profile_manual', {
            user_id: userId,
            first_name_param: userMetadata.first_name || null,
            last_name_param: userMetadata.last_name || null,
            fullname_param: userMetadata.full_name || null,
            phone_param: userMetadata.phone || null
          })
          
          if (rpcError) {
            console.error('RPC profile creation failed:', rpcError)
            // As a last resort, just set a minimal profile
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
            // Fetch the created profile
            const { data: fetchedProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .single()
            setProfile(fetchedProfile)
          }
        } else if (createError) {
          console.error('Error creating profile:', createError)
          throw new Error(`Failed to create profile: ${createError.message}`)
        } else {
          setProfile(newProfile)
        }
      } else if (error) {
        console.error('Error fetching profile:', error)
        throw new Error(`Failed to fetch profile: ${error.message}`)
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error)
      setError('Failed to load profile. Please try again.')
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
      
      console.log('Successfully signed out')
    } catch (error) {
      console.error('Error in signOut:', error)
      throw error
    }
  }

  const forceRefresh = async () => {
    setLoading(true)
    try {
      // Clear current state
      setUser(null)
      setProfile(null)
      setSession(null)
      
      // Get fresh session
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Error getting session:', error)
        return
      }
      
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchProfile(session.user.id)
      }
    } catch (error) {
      console.error('Error in forceRefresh:', error)
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
  }
}