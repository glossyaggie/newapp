import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { useProfile } from './useProfile'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subDays, startOfDay, endOfDay } from 'date-fns'

interface StreakData {
  currentStreak: number
  bestStreak: number
  totalClasses: number
  thisMonthClasses: number
  monthlyGoal: number
  activityCalendar: Array<{ date: string; count: number }>
  achievements: Array<{
    id: string
    name: string
    description: string
    date: string
    icon: string
  }>
}

export function useStreaks(timeframe: 'weekly' | 'monthly' | '3_months' | 'yearly' = '3_months') {
  const { user } = useAuth()
  const { data: profile } = useProfile()

  return useQuery({
    queryKey: ['streaks', user?.id, timeframe, profile?.monthly_goal],
    queryFn: async (): Promise<StreakData> => {
      if (!user) throw new Error('User not authenticated')

      // Get all attended classes for the user
      const { data: bookings, error } = await supabase
        .from('class_bookings')
        .select(`
          id,
          created_at,
          checked_in,
          check_in_time,
          class_schedule!inner(
            date,
            start_time
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'booked')
        .eq('checked_in', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Calculate current streak
      const today = startOfDay(new Date())
      let currentStreak = 0
      let bestStreak = 0
      let tempStreak = 0
      let lastDate: Date | null = null

      // Sort bookings by date (most recent first)
      const sortedBookings = bookings?.sort((a, b) => {
        const dateA = new Date(a.class_schedule.date + ' ' + a.class_schedule.start_time)
        const dateB = new Date(b.class_schedule.date + ' ' + b.class_schedule.start_time)
        return dateB.getTime() - dateA.getTime()
      }) || []

      // Calculate streaks
      for (let i = 0; i < 365; i++) { // Check last 365 days
        const checkDate = subDays(today, i)
        const hasClassOnDate = sortedBookings.some(booking => {
          const classDate = new Date(booking.class_schedule.date)
          return isSameDay(classDate, checkDate)
        })

        if (hasClassOnDate) {
          tempStreak++
          if (i === 0) { // Today
            currentStreak = tempStreak
          }
        } else {
          if (tempStreak > bestStreak) {
            bestStreak = tempStreak
          }
          tempStreak = 0
        }
      }

      // Update best streak if current streak is better
      if (currentStreak > bestStreak) {
        bestStreak = currentStreak
      }

      // Calculate this month's classes
      const monthStart = startOfMonth(today)
      const monthEnd = endOfMonth(today)
      const thisMonthClasses = sortedBookings.filter(booking => {
        const classDate = new Date(booking.class_schedule.date)
        return classDate >= monthStart && classDate <= monthEnd
      }).length

      // Generate activity calendar data based on timeframe
      const calendarData = []
      let daysToShow = 90 // default 3 months
      
      switch (timeframe) {
        case 'weekly':
          daysToShow = 7
          break
        case 'monthly':
          daysToShow = 30
          break
        case '3_months':
          daysToShow = 90
          break
        case 'yearly':
          daysToShow = 365
          break
      }
      
      for (let i = daysToShow - 1; i >= 0; i--) {
        const date = subDays(today, i)
        const classCount = sortedBookings.filter(booking => {
          const classDate = new Date(booking.class_schedule.date)
          return isSameDay(classDate, date)
        }).length

        calendarData.push({
          date: format(date, 'yyyy-MM-dd'),
          count: classCount
        })
      }

      // Calculate achievements
      const achievements = []
      const totalClasses = sortedBookings.length

      // Week Warrior (7 classes in a week)
      const weekAgo = subDays(today, 7)
      const weekClasses = sortedBookings.filter(booking => {
        const classDate = new Date(booking.class_schedule.date)
        return classDate >= weekAgo
      }).length

      if (weekClasses >= 7) {
        achievements.push({
          id: 'week_warrior',
          name: 'Week Warrior',
          description: 'Completed 7 classes in a week',
          date: format(today, 'MMM d'),
          icon: 'flame'
        })
      }

      // Consistency King (10-day streak)
      if (currentStreak >= 10) {
        achievements.push({
          id: 'consistency_king',
          name: 'Consistency King',
          description: `${currentStreak}-day streak achieved`,
          date: format(today, 'MMM d'),
          icon: 'trophy'
        })
      }

      // Century Club (100 total classes)
      if (totalClasses >= 100) {
        achievements.push({
          id: 'century_club',
          name: 'Century Club',
          description: 'Completed 100 total classes',
          date: format(today, 'MMM d'),
          icon: 'target'
        })
      }

      // First Timer (first class)
      if (totalClasses === 1) {
        achievements.push({
          id: 'first_timer',
          name: 'First Timer',
          description: 'Completed your first class',
          date: format(new Date(sortedBookings[0]?.class_schedule.date || ''), 'MMM d'),
          icon: 'star'
        })
      }

      // Monthly Goal (25 classes in a month)
      if (thisMonthClasses >= 25) {
        achievements.push({
          id: 'monthly_goal',
          name: 'Monthly Goal',
          description: 'Completed 25 classes this month',
          date: format(today, 'MMM d'),
          icon: 'target'
        })
      }

      return {
        currentStreak,
        bestStreak,
        totalClasses,
        thisMonthClasses,
        monthlyGoal: profile?.monthly_goal || 25, // Use user's goal or default
        activityCalendar: calendarData,
        achievements: achievements.slice(0, 3) // Show top 3 achievements
      }
    },
    enabled: !!user && !!profile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
