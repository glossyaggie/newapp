import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Flame, Calendar, Trophy, Target } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Card } from '@/components/ui/Card'
import { Colors } from '@/constants/colors'
import { useAuth } from '@/hooks/useAuth'

export default function StreaksScreen() {
  const { user } = useAuth()

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authContainer}>
          <Text style={styles.authTitle}>Sign In Required</Text>
          <Text style={styles.authText}>
            Please sign in to view your hot streaks and progress.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Hot Streaks 🔥</Text>
          <Text style={styles.subtitle}>Track your yoga journey</Text>
        </View>

        {/* Current Streak */}
        <Card style={styles.streakCard} padding={0}>
          <LinearGradient
            colors={['#FF6B35', '#FF8E53']}
            style={styles.streakGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.streakHeader}>
              <Flame size={32} color={Colors.white} />
              <Text style={styles.streakTitle}>Current Streak</Text>
            </View>
            <Text style={styles.streakNumber}>7</Text>
            <Text style={styles.streakLabel}>Days in a row</Text>
            <Text style={styles.streakSubtext}>Keep it up! You're on fire 🔥</Text>
          </LinearGradient>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Calendar size={24} color={Colors.primary} />
            <Text style={styles.statNumber}>23</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </Card>

          <Card style={styles.statCard}>
            <Trophy size={24} color={Colors.warning} />
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </Card>

          <Card style={styles.statCard}>
            <Target size={24} color={Colors.success} />
            <Text style={styles.statNumber}>156</Text>
            <Text style={styles.statLabel}>Total Classes</Text>
          </Card>

          <Card style={styles.statCard}>
            <Flame size={24} color={Colors.error} />
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Streak Count</Text>
          </Card>
        </View>

        {/* Monthly Progress */}
        <Card style={styles.progressCard}>
          <Text style={styles.progressTitle}>December Progress</Text>
          <Text style={styles.progressSubtitle}>23 classes • Goal: 25</Text>
          
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '92%' }]} />
          </View>
          
          <Text style={styles.progressText}>
            You're 2 classes away from your monthly goal! 🎯
          </Text>
        </Card>

        {/* Calendar Heatmap Placeholder */}
        <Card style={styles.heatmapCard}>
          <Text style={styles.heatmapTitle}>Activity Calendar</Text>
          <Text style={styles.heatmapSubtitle}>Your practice over the last 3 months</Text>
          
          <View style={styles.heatmapGrid}>
            {Array.from({ length: 90 }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.heatmapDay,
                  {
                    backgroundColor: Math.random() > 0.7 
                      ? Colors.primary 
                      : Math.random() > 0.5 
                        ? Colors.primaryLight 
                        : Colors.border
                  }
                ]}
              />
            ))}
          </View>
          
          <View style={styles.heatmapLegend}>
            <Text style={styles.legendText}>Less</Text>
            <View style={styles.legendDots}>
              <View style={[styles.legendDot, { backgroundColor: Colors.border }]} />
              <View style={[styles.legendDot, { backgroundColor: Colors.primaryLight }]} />
              <View style={[styles.legendDot, { backgroundColor: Colors.primaryMedium }]} />
              <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
            </View>
            <Text style={styles.legendText}>More</Text>
          </View>
        </Card>

        {/* Achievements */}
        <Card style={styles.achievementsCard}>
          <Text style={styles.achievementsTitle}>Recent Achievements</Text>
          
          <View style={styles.achievement}>
            <View style={styles.achievementIcon}>
              <Flame size={20} color={Colors.primary} />
            </View>
            <View style={styles.achievementContent}>
              <Text style={styles.achievementName}>Week Warrior</Text>
              <Text style={styles.achievementDesc}>Completed 7 classes in a week</Text>
            </View>
            <Text style={styles.achievementDate}>Dec 15</Text>
          </View>

          <View style={styles.achievement}>
            <View style={styles.achievementIcon}>
              <Trophy size={20} color={Colors.warning} />
            </View>
            <View style={styles.achievementContent}>
              <Text style={styles.achievementName}>Consistency King</Text>
              <Text style={styles.achievementDesc}>10-day streak achieved</Text>
            </View>
            <Text style={styles.achievementDate}>Dec 10</Text>
          </View>

          <View style={styles.achievement}>
            <View style={styles.achievementIcon}>
              <Target size={20} color={Colors.success} />
            </View>
            <View style={styles.achievementContent}>
              <Text style={styles.achievementName}>Century Club</Text>
              <Text style={styles.achievementDesc}>Completed 100 total classes</Text>
            </View>
            <Text style={styles.achievementDate}>Dec 1</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  streakCard: {
    marginBottom: 20,
  },
  streakGradient: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: '800' as const,
    color: Colors.white,
    lineHeight: 52,
  },
  streakLabel: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: 8,
  },
  streakSubtext: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    alignItems: 'center',
    padding: 20,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
  },
  progressCard: {
    marginBottom: 20,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  heatmapCard: {
    marginBottom: 20,
  },
  heatmapTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  heatmapSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    marginBottom: 12,
  },
  heatmapDay: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  legendDots: {
    flexDirection: 'row',
    gap: 2,
    marginHorizontal: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  achievementsCard: {
    marginBottom: 40,
  },
  achievementsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  achievement: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  achievementContent: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  achievementDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  achievementDate: {
    fontSize: 12,
    color: Colors.textLight,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'center' as const,
    marginBottom: 12,
  },
  authText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 24,
  },
})