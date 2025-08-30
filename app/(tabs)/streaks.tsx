import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Flame, Calendar, Trophy, Target, Star, Edit3 } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Colors } from '@/constants/colors'
import { useAuth } from '@/hooks/useAuth'
import { useStreaks } from '@/hooks/useStreaks'
import { useUpdateMonthlyGoal } from '@/hooks/useProfile'

export default function StreaksScreen() {
  const { user } = useAuth()
  const [calendarTimeframe, setCalendarTimeframe] = useState<'weekly' | 'monthly' | '3_months' | 'yearly'>('3_months')
  const { data: streakData, isLoading, error } = useStreaks(calendarTimeframe)
  const updateMonthlyGoal = useUpdateMonthlyGoal()
  const [isEditingGoal, setIsEditingGoal] = useState(false)
  const [newGoal, setNewGoal] = useState('')

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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner />
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to Load Streaks</Text>
          <Text style={styles.errorText}>
            Please try again later.
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
            <Text style={styles.streakNumber}>{streakData?.currentStreak || 0}</Text>
            <Text style={styles.streakLabel}>Days in a row</Text>
            <Text style={styles.streakSubtext}>
              {streakData?.currentStreak === 0 
                ? "Start your streak today! 🔥" 
                : streakData?.currentStreak >= 7 
                  ? "You're on fire! 🔥" 
                  : "Keep it up! 🔥"
              }
            </Text>
          </LinearGradient>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Calendar size={24} color={Colors.primary} />
            <Text style={styles.statNumber}>{streakData?.thisMonthClasses || 0}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </Card>

          <Card style={styles.statCard}>
            <Trophy size={24} color={Colors.warning} />
            <Text style={styles.statNumber}>{streakData?.bestStreak || 0}</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </Card>

          <Card style={styles.statCard}>
            <Target size={24} color={Colors.success} />
            <Text style={styles.statNumber}>{streakData?.totalClasses || 0}</Text>
            <Text style={styles.statLabel}>Total Classes</Text>
          </Card>

          <Card style={styles.statCard}>
            <Flame size={24} color={Colors.error} />
            <Text style={styles.statNumber}>{streakData?.currentStreak || 0}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </Card>
        </View>

        {/* Monthly Progress */}
        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Monthly Progress</Text>
            <TouchableOpacity
              style={styles.editGoalButton}
              onPress={() => {
                setNewGoal(streakData?.monthlyGoal?.toString() || '25')
                setIsEditingGoal(true)
              }}
            >
              <Edit3 size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          
                     {isEditingGoal ? (
             <View style={styles.goalEditContainer}>
               {updateMonthlyGoal.isPending && (
                 <Text style={styles.savingText}>Saving...</Text>
               )}
               <Text style={styles.goalEditLabel}>Set your monthly goal:</Text>
               <View style={styles.goalEditRow}>
                 <TextInput
                   style={styles.goalInput}
                   value={newGoal}
                   onChangeText={setNewGoal}
                   keyboardType="numeric"
                   placeholder="25"
                   maxLength={3}
                   autoFocus={true}
                 />
                 <Text style={styles.goalEditText}>classes</Text>
               </View>
               <View style={styles.goalEditButtons}>
                 <TouchableOpacity
                   style={styles.goalEditButton}
                   onPress={() => setIsEditingGoal(false)}
                   disabled={updateMonthlyGoal.isPending}
                 >
                   <Text style={styles.goalEditButtonText}>Cancel</Text>
                 </TouchableOpacity>
                 <TouchableOpacity
                   style={[
                     styles.goalEditButton, 
                     styles.goalEditButtonSave,
                     updateMonthlyGoal.isPending && styles.goalEditButtonDisabled
                   ]}
                   onPress={() => {
                     const goal = parseInt(newGoal)
                     if (goal >= 1 && goal <= 100) {
                       updateMonthlyGoal.mutate(goal, {
                         onSuccess: () => {
                           setIsEditingGoal(false)
                           setNewGoal('')
                         },
                         onError: (error) => {
                           Alert.alert('Error', 'Failed to update goal. Please try again.')
                         }
                       })
                     } else {
                       Alert.alert('Invalid Goal', 'Please enter a number between 1 and 100.')
                     }
                   }}
                   disabled={updateMonthlyGoal.isPending}
                 >
                   <Text style={[
                     styles.goalEditButtonText, 
                     styles.goalEditButtonTextSave,
                     updateMonthlyGoal.isPending && styles.goalEditButtonTextDisabled
                   ]}>
                     {updateMonthlyGoal.isPending ? 'Saving...' : 'Save'}
                   </Text>
                 </TouchableOpacity>
               </View>
             </View>
           ) : (
            <Text style={styles.progressSubtitle}>
              {streakData?.thisMonthClasses || 0} classes • Goal: {streakData?.monthlyGoal || 25}
            </Text>
          )}
          
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min(
                    ((streakData?.thisMonthClasses || 0) / (streakData?.monthlyGoal || 25)) * 100, 
                    100
                  )}%` 
                }
              ]} 
            />
          </View>
          
          <Text style={styles.progressText}>
            {(() => {
              const remaining = (streakData?.monthlyGoal || 25) - (streakData?.thisMonthClasses || 0)
              if (remaining <= 0) {
                return "You've reached your monthly goal! 🎉"
              } else if (remaining === 1) {
                return "You're 1 class away from your monthly goal! 🎯"
              } else {
                return `You're ${remaining} classes away from your monthly goal! 🎯`
              }
            })()}
          </Text>
        </Card>

        {/* Calendar Heatmap Placeholder */}
        <Card style={styles.heatmapCard}>
          <Text style={styles.heatmapTitle}>Activity Calendar</Text>
          
          {/* Time Frame Filter */}
          <View style={styles.timeframeFilter}>
            <TouchableOpacity
              style={[
                styles.timeframeButton,
                calendarTimeframe === 'weekly' && styles.timeframeButtonActive
              ]}
              onPress={() => setCalendarTimeframe('weekly')}
            >
              <Text style={[
                styles.timeframeButtonText,
                calendarTimeframe === 'weekly' && styles.timeframeButtonTextActive
              ]}>
                Weekly
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.timeframeButton,
                calendarTimeframe === 'monthly' && styles.timeframeButtonActive
              ]}
              onPress={() => setCalendarTimeframe('monthly')}
            >
              <Text style={[
                styles.timeframeButtonText,
                calendarTimeframe === 'monthly' && styles.timeframeButtonTextActive
              ]}>
                Monthly
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.timeframeButton,
                calendarTimeframe === '3_months' && styles.timeframeButtonActive
              ]}
              onPress={() => setCalendarTimeframe('3_months')}
            >
              <Text style={[
                styles.timeframeButtonText,
                calendarTimeframe === '3_months' && styles.timeframeButtonTextActive
              ]}>
                3 Months
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.timeframeButton,
                calendarTimeframe === 'yearly' && styles.timeframeButtonActive
              ]}
              onPress={() => setCalendarTimeframe('yearly')}
            >
              <Text style={[
                styles.timeframeButtonText,
                calendarTimeframe === 'yearly' && styles.timeframeButtonTextActive
              ]}>
                Yearly
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.heatmapSubtitle}>
            {calendarTimeframe === 'weekly' && 'Your practice this week'}
            {calendarTimeframe === 'monthly' && 'Your practice this month'}
            {calendarTimeframe === '3_months' && 'Your practice over the last 3 months'}
            {calendarTimeframe === 'yearly' && 'Your practice this year'}
          </Text>
          
                     <View style={styles.heatmapGrid}>
             {streakData?.activityCalendar.map((day, i) => (
               <View
                 key={i}
                 style={[
                   styles.heatmapDay,
                   { backgroundColor: day.count > 0 ? Colors.primary : Colors.border }
                 ]}
               />
             ))}
           </View>
          
          
        </Card>

        {/* Achievements */}
        <Card style={styles.achievementsCard}>
          <Text style={styles.achievementsTitle}>Recent Achievements</Text>
          
          {streakData?.achievements && streakData.achievements.length > 0 ? (
            streakData.achievements.map((achievement) => {
              const getIcon = () => {
                switch (achievement.icon) {
                  case 'flame':
                    return <Flame size={20} color={Colors.primary} />
                  case 'trophy':
                    return <Trophy size={20} color={Colors.warning} />
                  case 'target':
                    return <Target size={20} color={Colors.success} />
                  case 'star':
                    return <Star size={20} color={Colors.primary} />
                  default:
                    return <Trophy size={20} color={Colors.primary} />
                }
              }

              return (
                <View key={achievement.id} style={styles.achievement}>
                  <View style={styles.achievementIcon}>
                    {getIcon()}
                  </View>
                  <View style={styles.achievementContent}>
                    <Text style={styles.achievementName}>{achievement.name}</Text>
                    <Text style={styles.achievementDesc}>{achievement.description}</Text>
                  </View>
                  <Text style={styles.achievementDate}>{achievement.date}</Text>
                </View>
              )
            })
          ) : (
            <View style={styles.noAchievements}>
              <Text style={styles.noAchievementsText}>
                No achievements yet. Keep attending classes to unlock achievements! 🎯
              </Text>
            </View>
          )}
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
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  editGoalButton: {
    padding: 4,
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
    marginBottom: 12,
  },
  timeframeFilter: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  timeframeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeframeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeframeButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  timeframeButtonTextActive: {
    color: Colors.white,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'center' as const,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 24,
  },
  noAchievements: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noAchievementsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  goalEditContainer: {
    marginBottom: 16,
  },
  goalEditLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  goalEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.surface,
    width: 80,
    marginRight: 8,
  },
  goalEditText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  goalEditButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  goalEditButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  goalEditButtonSave: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  goalEditButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
     goalEditButtonTextSave: {
     color: Colors.white,
   },
   goalEditButtonDisabled: {
     opacity: 0.5,
   },
   goalEditButtonTextDisabled: {
     opacity: 0.7,
   },
   savingText: {
     fontSize: 14,
     color: Colors.primary,
     fontWeight: '600' as const,
     textAlign: 'center' as const,
     marginBottom: 8,
   },
})