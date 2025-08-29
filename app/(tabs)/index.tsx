import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Calendar, Wallet, Flame, ArrowRight } from 'lucide-react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Card } from '@/components/ui/Card'
import { WalletCard } from '@/components/WalletCard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { AuthForm } from '@/components/AuthForm'
import { Colors } from '@/constants/colors'
import { useAuth } from '@/hooks/useAuth'
import { usePasses } from '@/hooks/usePasses'

export default function HomeScreen() {
  const { user, profile, loading: authLoading, error: authError } = useAuth()
  const { activePass, hasLowCredits, isLoading: passesLoading } = usePasses()

  if (authLoading || (user && passesLoading)) {
    return <LoadingSpinner />
  }

  if (authError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to connect. Please check your internet connection and try again.</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={Colors.backgroundGradient}
          style={styles.gradient}
        >
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.authHeader}>
              <Text style={styles.welcomeTitle}>Welcome to The Hot Temple</Text>
              <Text style={styles.welcomeText}>
                Your journey to wellness starts here 🔥
              </Text>
            </View>
            <AuthForm />
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    )
  }

  const handleTopUp = () => {
    router.push('/wallet')
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={Colors.backgroundGradient}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.greeting}>
              Hello, {profile?.fullname || 'Yogi'}! 🧘‍♀️
            </Text>
            <Text style={styles.subtitle}>Ready for your next class?</Text>
          </View>

          <WalletCard
            activePass={activePass || null}
            hasLowCredits={hasLowCredits || false}
            onTopUp={handleTopUp}
          />

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/schedule')}
            >
              <Card style={styles.actionCardInner}>
                <Calendar size={32} color={Colors.primary} />
                <Text style={styles.actionTitle}>Browse Schedule</Text>
                <Text style={styles.actionSubtitle}>Find your perfect class</Text>
                <ArrowRight size={20} color={Colors.textLight} style={styles.actionArrow} />
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/wallet')}
            >
              <Card style={styles.actionCardInner}>
                <Wallet size={32} color={Colors.secondary} />
                <Text style={styles.actionTitle}>Manage Passes</Text>
                <Text style={styles.actionSubtitle}>View credits & purchase</Text>
                <ArrowRight size={20} color={Colors.textLight} style={styles.actionArrow} />
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/streaks')}
            >
              <Card style={styles.actionCardInner}>
                <Flame size={32} color={Colors.warning} />
                <Text style={styles.actionTitle}>Hot Streaks</Text>
                <Text style={styles.actionSubtitle}>Track your progress</Text>
                <ArrowRight size={20} color={Colors.textLight} style={styles.actionArrow} />
              </Card>
            </TouchableOpacity>
          </View>

          {!profile?.waiver_signed_at && (
            <Card style={styles.waiverCard}>
              <Text style={styles.waiverTitle}>Complete Your Waiver</Text>
              <Text style={styles.waiverText}>
                You'll need to sign our waiver before booking your first class.
              </Text>
              <TouchableOpacity style={styles.waiverButton}>
                <Text style={styles.waiverButtonText}>Sign Waiver</Text>
              </TouchableOpacity>
            </Card>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  quickActions: {
    gap: 12,
  },
  actionCard: {
    marginBottom: 8,
  },
  actionCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    position: 'relative',
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginLeft: 16,
    flex: 1,
  },
  actionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    position: 'absolute',
    left: 68,
    top: 45,
  },
  actionArrow: {
    position: 'absolute',
    right: 20,
  },
  waiverCard: {
    backgroundColor: Colors.warning + '10',
    borderColor: Colors.warning,
    borderWidth: 1,
    marginTop: 20,
  },
  waiverTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  waiverText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  waiverButton: {
    backgroundColor: Colors.warning,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  waiverButtonText: {
    color: Colors.white,
    fontWeight: '600' as const,
    fontSize: 14,
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 40,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'center' as const,
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 24,
  },
})