import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Calendar, Wallet, Flame, ArrowRight, Clock, Users, X } from 'lucide-react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Card } from '@/components/ui/Card'
import { WalletCard } from '@/components/WalletCard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { AuthForm } from '@/components/AuthForm'
import { Colors } from '@/constants/colors'
import { useAuth } from '@/hooks/useAuth'
import { usePasses } from '@/hooks/usePasses'
import { useUpcomingBookings } from '@/hooks/useUpcomingBookings'
import { format, parseISO, addHours, isAfter } from 'date-fns'
import SpecialsBanner from '@/components/SpecialsBanner'
import QRScanner from '@/components/QRScanner'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'


export default function HomeScreen() {
  const { user, profile, loading: authLoading, error: authError } = useAuth()
  const { activePass, hasLowCredits, isLoading: passesLoading } = usePasses()
  const { upcomingBookings, isLoading: bookingsLoading } = useUpcomingBookings()
  const [showAllBookings, setShowAllBookings] = useState(true)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [cancellingBooking, setCancellingBooking] = useState<string | null>(null)
  const queryClient = useQueryClient()

  if (authLoading || (user && passesLoading) || (user && bookingsLoading)) {
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
              <Text style={styles.debugText}>
                Debug: App loaded successfully on mobile
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

  const handleCheckInSuccess = () => {
    // Refresh the upcoming bookings to show updated check-in status
    // This will be handled by React Query's automatic refetching
  }

  const handleCancelBooking = async (booking: any) => {
    console.log('🎯 Cancel button clicked for booking:', booking)
    
    // Check if it's within 2 hours of class start time
    const classDateTime = parseISO(`${booking.date}T${booking.start_time}`)
    const twoHoursBefore = addHours(classDateTime, -2)
    const now = new Date()
    
    const isWithinTwoHours = isAfter(now, twoHoursBefore)
    
    console.log('📅 Class datetime:', classDateTime)
    console.log('⏰ Two hours before:', twoHoursBefore)
    console.log('🕐 Current time:', now)
    console.log('⚠️ Within 2 hours:', isWithinTwoHours)
    
    let message = `Are you sure you want to cancel "${booking.class_title}"?`
    if (isWithinTwoHours) {
      message += '\n\n⚠️ Cancelling within 2 hours of class start time means you will NOT get your class credit back.'
    } else {
      message += '\n\n✅ Your class credit will be returned to your pass.'
    }
    
    // Use browser confirm for web compatibility
    const confirmed = window.confirm(message)
    
    if (confirmed) {
      console.log('✅ User confirmed cancellation')
      
      setCancellingBooking(booking.id)
      try {
        console.log('🔄 Calling cancel_booking RPC with booking ID:', booking.id)
        
        // Call the cancel_booking RPC
        const { data, error } = await (supabase.rpc as any)('cancel_booking', {
          p_booking_id: booking.id
        })
        
        console.log('📡 RPC Response - data:', data, 'error:', error)
        
        if (error) {
          alert(`Failed to cancel booking: ${error.message}`)
          return
        }
        
        if (data?.success) {
          alert(
            isWithinTwoHours 
              ? 'Your booking has been cancelled. No credit will be refunded as it was within 2 hours of class start time.'
              : 'Your booking has been cancelled and your class credit has been returned to your pass.'
          )
          
          // Force refresh the passes and bookings data
          console.log('🔄 Refreshing passes and bookings data...')
          // Small delay to ensure database transaction completes
          setTimeout(async () => {
            console.log('🔄 Invalidating queries...')
            await queryClient.invalidateQueries({ queryKey: ['active-pass', user?.id] })
            await queryClient.invalidateQueries({ queryKey: ['upcoming-bookings', user?.id] })
            
            // Force refetch the active pass data
            console.log('🔄 Force refetching active pass...')
            const { data: newPassData } = await supabase.rpc('get_active_pass')
            console.log('🔄 New pass data:', newPassData)
            
            // Update the cache directly
            queryClient.setQueryData(['active-pass', user?.id], newPassData)
          }, 500)
        } else {
          alert(data?.error || 'Failed to cancel booking')
        }
      } catch (error) {
        alert('Failed to cancel booking. Please try again.')
      } finally {
        setCancellingBooking(null)
      }
    } else {
      console.log('❌ User cancelled the confirmation')
    }
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

                                {/* Weekly Specials Banner */}
                      <SpecialsBanner />

                      {/* Quick Check-in Button */}
                      <Card style={styles.checkInCard}>
                        <TouchableOpacity
                          style={styles.checkInButton}
                          onPress={() => setShowQRScanner(true)}
                        >
                          <Text style={styles.checkInButtonText}>📱 Check In to Class</Text>
                          <Text style={styles.checkInButtonSubtext}>Scan QR code at the studio</Text>
                        </TouchableOpacity>
                      </Card>

                      {/* Upcoming Bookings Section */}
          {upcomingBookings && upcomingBookings.length > 0 && (
            <Card style={styles.bookingsCard}>
              <View style={styles.bookingsHeader}>
                <Text style={styles.bookingsTitle}>
                  {showAllBookings ? 'All Booked Classes' : 'Next Class'}
                </Text>
                <View style={styles.bookingsActions}>
                  <TouchableOpacity 
                    style={styles.filterButton}
                    onPress={() => setShowAllBookings(!showAllBookings)}
                  >
                    <Text style={styles.filterButtonText}>
                      {showAllBookings ? 'Show Next' : `Show All (${upcomingBookings.length})`}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => router.push('/schedule')}>
                    <Text style={styles.viewScheduleText}>View Schedule</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {showAllBookings ? (
                // Show all bookings in a scrollable list
                <ScrollView 
                  style={styles.allBookingsList}
                  showsVerticalScrollIndicator={false}
                >
                  {upcomingBookings.map((booking) => {
                    const formattedDate = format(parseISO(booking.date), 'MMM d')
                    const formattedTime = format(parseISO(`2000-01-01T${booking.start_time}`), 'h:mm a')
                    
                    return (
                      <View key={booking.id} style={styles.bookingItem}>
                        <View style={styles.bookingItemHeader}>
                          <Text style={styles.bookingItemTitle}>{booking.class_title}</Text>
                          <View style={styles.bookingItemActions}>
                            <View style={[
                              styles.statusBadge,
                              { backgroundColor: booking.status === 'waitlist' ? Colors.warning : Colors.success }
                            ]}>
                              <Text style={styles.statusText}>
                                {booking.status === 'waitlist' ? 'Waitlist' : 'Booked'}
                              </Text>
                            </View>
                            {booking.status === 'booked' && (
                              <TouchableOpacity
                                style={[
                                  styles.cancelButton,
                                  cancellingBooking === booking.id && styles.cancelButtonDisabled
                                ]}
                                onPress={() => handleCancelBooking(booking)}
                                disabled={cancellingBooking === booking.id}
                              >
                                <X size={12} color={Colors.white} />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                        
                        <View style={styles.bookingItemDetails}>
                          <View style={styles.bookingItemDetail}>
                            <Clock size={14} color={Colors.textSecondary} />
                            <Text style={styles.bookingItemDetailText}>
                              {formattedDate} • {formattedTime}
                            </Text>
                          </View>
                          
                          <View style={styles.bookingItemDetail}>
                            <Users size={14} color={Colors.textSecondary} />
                            <Text style={styles.bookingItemDetailText}>
                              {booking.instructor}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )
                  })}
                </ScrollView>
              ) : (
                // Show just the next class
                <View>
                  <Text style={styles.nextClassText}>
                    {upcomingBookings.length === 1 
                      ? `You have 1 class booked - ${upcomingBookings[0].class_title} with ${upcomingBookings[0].instructor}`
                      : `You have ${upcomingBookings.length} classes booked - ${upcomingBookings[0].class_title} with ${upcomingBookings[0].instructor}`
                    }
                  </Text>
                  <Text style={styles.nextClassTime}>
                    {format(parseISO(upcomingBookings[0].date), 'MMM d')} at {format(parseISO(`2000-01-01T${upcomingBookings[0].start_time}`), 'h:mm a')}
                  </Text>
                </View>
              )}
            </Card>
          )}

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

      {/* QR Scanner Modal */}
      <QRScanner
        visible={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onSuccess={handleCheckInSuccess}
      />
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
  bookingsCard: {
    marginBottom: 24,
    padding: 20,
  },
  bookingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bookingsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  bookingsActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterButton: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  viewScheduleText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  allBookingsList: {
    maxHeight: 300,
  },
  bookingItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  bookingItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bookingItemTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.white,
    textTransform: 'uppercase' as const,
  },
  bookingItemDetails: {
    gap: 6,
  },
  bookingItemDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bookingItemDetailText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  bookingItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: Colors.error,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonDisabled: {
    opacity: 0.5,
  },
  nextClassText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  nextClassTime: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
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
    marginBottom: 16,
  },
  debugText: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center' as const,
    marginBottom: 32,
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
  checkInCard: {
    marginBottom: 16,
  },
  checkInButton: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  checkInButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 4,
  },
  checkInButtonSubtext: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.8,
  },
})