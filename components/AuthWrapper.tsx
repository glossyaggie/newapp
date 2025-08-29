import React from 'react'
import { View, StyleSheet } from 'react-native'
import { useAuth } from '@/hooks/useAuth'
import { AuthForm } from '@/components/AuthForm'
import { WaiverForm } from '@/components/WaiverForm'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Colors } from '@/constants/colors'

interface AuthWrapperProps {
  children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, profile, loading, hasSignedWaiver, refetchProfile } = useAuth()

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
      </View>
    )
  }

  // Not authenticated - show auth form
  if (!user) {
    return <AuthForm onSuccess={refetchProfile} />
  }

  // Authenticated but no waiver signed - show waiver form
  if (user && profile && !hasSignedWaiver) {
    return (
      <WaiverForm 
        userProfile={{
          first_name: profile.first_name || undefined,
          last_name: profile.last_name || undefined,
          fullname: profile.fullname || undefined,
        }}
        onSuccess={refetchProfile}
      />
    )
  }

  // Authenticated but profile still loading - show loading
  if (user && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
      </View>
    )
  }

  // Authenticated and waiver signed - show main app
  return <>{children}</>
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.background,
  },
})