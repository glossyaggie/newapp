import { supabase } from '../supabase'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import type { Database } from '@/types/supabase'

type ClassWithBookings = Database['public']['Tables']['class_schedule']['Row'] & {
  class_bookings: Database['public']['Tables']['class_bookings']['Row'][]
}

export interface ScheduleFilters {
  date?: string
  instructor?: string
  level?: string
  duration?: number
}

export async function fetchWeekSchedule(startDate: Date, filters: ScheduleFilters = {}) {
  console.log('🔄 Fetching week schedule for:', format(startDate, 'yyyy-MM-dd'))
  
  const weekStart = startOfWeek(startDate, { weekStartsOn: 1 }) // Monday
  const weekEnd = endOfWeek(startDate, { weekStartsOn: 1 }) // Sunday
  
  let query = supabase
    .from('class_schedule')
    .select(`
      *,
      class_bookings (
        id,
        user_id,
        status
      )
    `)
    .gte('date', format(weekStart, 'yyyy-MM-dd'))
    .lte('date', format(weekEnd, 'yyyy-MM-dd'))
    .order('date')
    .order('start_time')
  
  // Apply filters
  if (filters.instructor) {
    query = query.ilike('instructor', `%${filters.instructor}%`)
  }
  
  if (filters.level) {
    query = query.eq('level', filters.level)
  }
  
  if (filters.duration) {
    query = query.eq('duration_min', filters.duration)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('❌ Error fetching schedule:', error)
    throw error
  }
  
  console.log('✅ Schedule fetched:', data?.length, 'classes')
  return data
}

export async function fetchDaySchedule(date: Date, filters: ScheduleFilters = {}) {
  console.log('🔄 Fetching day schedule for:', format(date, 'yyyy-MM-dd'))
  
  let query = supabase
    .from('class_schedule')
    .select(`
      *,
      class_bookings (
        id,
        user_id,
        status
      )
    `)
    .eq('date', format(date, 'yyyy-MM-dd'))
    .order('start_time')
  
  // Apply filters
  if (filters.instructor) {
    query = query.ilike('instructor', `%${filters.instructor}%`)
  }
  
  if (filters.level) {
    query = query.eq('level', filters.level)
  }
  
  if (filters.duration) {
    query = query.eq('duration_min', filters.duration)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('❌ Error fetching day schedule:', error)
    throw error
  }
  
  console.log('✅ Day schedule fetched:', data?.length, 'classes')
  return data
}

export async function getClassWithBookings(classId: string) {
  console.log('🔄 Fetching class details:', classId)
  
  const { data, error } = await supabase
    .from('class_schedule')
    .select(`
      *,
      class_bookings (
        id,
        user_id,
        status,
        booked_at
      )
    `)
    .eq('id', classId)
    .single()
  
  if (error) {
    console.error('❌ Error fetching class details:', error)
    throw error
  }
  
  console.log('✅ Class details fetched:', (data as ClassWithBookings)?.title)
  return data as ClassWithBookings
}