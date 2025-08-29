import React from 'react'
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native'
import { useAuth } from '@/hooks/useAuth'
import { AuthForm } from '@/components/AuthForm'
import { WaiverForm } from '@/components/WaiverForm'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Colors } from '@/constants/colors'
import { RefreshCw } from 'lucide-react-native'

interface AuthWrapperProps {
  children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, profile, loading, error, hasSignedWaiver, refetchProfile, forceRefresh } = useAuth()

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  // Show error state with retry option
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Connection Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={forceRefresh}>
          <RefreshCw size={20} color={Colors.white} />
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.background,
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center' as const,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
})