import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          fullname: string | null
          phone: string | null
          role: 'user' | 'admin'
          waiver_signed_at: string | null
          created_at: string
        }
        Insert: {
          id: string
          fullname?: string | null
          phone?: string | null
          role?: 'user' | 'admin'
          waiver_signed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          fullname?: string | null
          phone?: string | null
          role?: 'user' | 'admin'
          waiver_signed_at?: string | null
          created_at?: string
        }
      }
      pass_types: {
        Row: {
          id: string
          name: string
          kind: 'pack' | 'unlimited'
          credits: number | null
          duration_days: number
          stripe_price_id: string
          active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          kind: 'pack' | 'unlimited'
          credits?: number | null
          duration_days: number
          stripe_price_id: string
          active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          kind?: 'pack' | 'unlimited'
          credits?: number | null
          duration_days?: number
          stripe_price_id?: string
          active?: boolean
          sort_order?: number
          created_at?: string
        }
      }
      user_passes: {
        Row: {
          id: string
          user_id: string
          pass_type_id: string
          remaining_credits: number
          valid_from: string
          valid_until: string
          is_active: boolean
          status: 'active' | 'exhausted' | 'expired'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          pass_type_id: string
          remaining_credits: number
          valid_from: string
          valid_until: string
          is_active?: boolean
          status?: 'active' | 'exhausted' | 'expired'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          pass_type_id?: string
          remaining_credits?: number
          valid_from?: string
          valid_until?: string
          is_active?: boolean
          status?: 'active' | 'exhausted' | 'expired'
          created_at?: string
        }
      }
      class_schedule: {
        Row: {
          id: string
          title: string
          instructor: string
          date: string
          start_time: string
          end_time: string
          capacity: number
          duration_min: number
          heat_c: number | null
          level: string | null
          notes: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          instructor: string
          date: string
          start_time: string
          end_time: string
          capacity: number
          duration_min: number
          heat_c?: number | null
          level?: string | null
          notes?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          instructor?: string
          date?: string
          start_time?: string
          end_time?: string
          capacity?: number
          duration_min?: number
          heat_c?: number | null
          level?: string | null
          notes?: string | null
          created_by?: string
          created_at?: string
        }
      }
      class_bookings: {
        Row: {
          id: string
          user_id: string
          class_id: string
          status: 'booked' | 'cancelled' | 'attended' | 'no_show' | 'waitlist'
          booked_at: string
          consumed_pass_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          class_id: string
          status?: 'booked' | 'cancelled' | 'attended' | 'no_show' | 'waitlist'
          booked_at?: string
          consumed_pass_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          class_id?: string
          status?: 'booked' | 'cancelled' | 'attended' | 'no_show' | 'waitlist'
          booked_at?: string
          consumed_pass_id?: string | null
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          class_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          class_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          class_id?: string
          created_at?: string
        }
      }
    }
    Functions: {
      book_class: {
        Args: { p_class_id: string }
        Returns: {
          booking_id: string
          new_balance: number
          success: boolean
          error?: string
        }
      }
      cancel_booking: {
        Args: { p_booking_id: string }
        Returns: {
          success: boolean
          new_balance?: number
          error?: string
        }
      }
      get_active_pass: {
        Args: {}
        Returns: {
          remaining_credits: number
          valid_until: string
          is_unlimited: boolean
          pass_name: string
        } | null
      }
    }
  }
}