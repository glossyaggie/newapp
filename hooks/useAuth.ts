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

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
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

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
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
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  const isAdmin = profile?.role === 'admin'
  const hasSignedWaiver = !!profile?.waiver_signed_at

  return {
    user,
    profile,
    session,
    loading,
    signOut,
    isAdmin,
    hasSignedWaiver,
    refetchProfile: () => user && fetchProfile(user.id),
  }
}