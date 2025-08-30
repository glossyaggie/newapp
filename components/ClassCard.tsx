import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { format, parseISO } from 'date-fns'
import { Heart, Clock, Thermometer, Users } from 'lucide-react-native'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { Colors } from '@/constants/colors'
import { BOOKING_LIMITS } from '@/constants/limits'
import type { ClassWithBooking } from '@/hooks/useSchedule'

interface ClassCardProps {
  classItem: ClassWithBooking
  onBook: (classId: string) => void
  onCancel: (bookingId: string) => void
  onToggleFavorite: (classId: string, isFavorite: boolean) => void
  isBooking: boolean
  isCancelling: boolean
  canBook: boolean
}

export function ClassCard({
  classItem,
  onBook,
  onCancel,
  onToggleFavorite,
  isBooking,
  isCancelling,
  canBook,
}: ClassCardProps) {
  const startTime = format(parseISO(`${classItem.date}T${classItem.start_time}`), 'h:mm a')
  const endTime = format(parseISO(`${classItem.date}T${classItem.end_time}`), 'h:mm a')
  
  const availableSpots = classItem.capacity - classItem.booking_count
  const isFull = availableSpots <= 0
  const isAlmostFull = availableSpots <= BOOKING_LIMITS.CAPACITY_CRITICAL_THRESHOLD
  const isWarning = availableSpots <= BOOKING_LIMITS.CAPACITY_WARNING_THRESHOLD
  
  const isBooked = !!classItem.user_booking
  
  const getCapacityColor = () => {
    if (isFull) return Colors.error
    if (isAlmostFull) return Colors.error
    if (isWarning) return Colors.warning
    return Colors.success
  }

  const getCapacityText = () => {
    if (isFull) return 'Full'
    if (availableSpots === 1) return '1 spot left'
    return `${availableSpots} spots left`
  }

  const getBookingButtonText = () => {
    if (isBooked) {
      return classItem.user_booking?.status === 'waitlist' ? 'Waitlist' : 'Booked'
    }
    return 'Book'
  }

  const getBookingButtonVariant = () => {
    if (isBooked) {
      return classItem.user_booking?.status === 'waitlist' ? 'outline' : 'primary'
    }
    return 'primary'
  }

  const handleBookingAction = () => {
    // Prevent multiple rapid clicks
    if (isBooking || isCancelling) {
      return
    }
    
    if (isBooked && classItem.user_booking) {
      onCancel(classItem.user_booking.id)
    } else {
      onBook(classItem.id)
    }
  }

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{classItem.title}</Text>
            {isBooked && (
              <View style={[
                styles.bookingBadge,
                { backgroundColor: classItem.user_booking?.status === 'waitlist' ? Colors.warning : Colors.success }
              ]}>
                <Text style={styles.bookingBadgeText}>
                  {classItem.user_booking?.status === 'waitlist' ? 'Waitlist' : 'Booked'}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => {
              console.log('🔍 Heart button pressed:', { classId: classItem.id, isFavorite: classItem.is_favorite })
              onToggleFavorite(classItem.id, classItem.is_favorite)
            }}
            style={styles.favoriteButton}
          >
            <Heart
              size={20}
              color={classItem.is_favorite ? Colors.error : Colors.textLight}
              fill={classItem.is_favorite ? Colors.error : 'transparent'}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.instructor}>{classItem.instructor}</Text>
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Clock size={16} color={Colors.textSecondary} />
          <Text style={styles.detailText}>
            {startTime} - {endTime} ({classItem.duration_min}min)
          </Text>
        </View>

        {classItem.heat_c && (
          <View style={styles.detailItem}>
            <Thermometer size={16} color={Colors.primary} />
            <Text style={styles.detailText}>{classItem.heat_c}°C</Text>
          </View>
        )}

        {classItem.level && (
          <View style={styles.detailItem}>
            <Text style={styles.levelBadge}>{classItem.level}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.capacityContainer}>
          <Users size={16} color={getCapacityColor()} />
          <Text style={[styles.capacityText, { color: getCapacityColor() }]}>
            {getCapacityText()}
          </Text>
        </View>

        <Button
          title={getBookingButtonText()}
          onPress={handleBookingAction}
          variant={getBookingButtonVariant()}
          size="small"
          disabled={!canBook || (!isBooked && isFull) || isBooking || isCancelling}
          loading={isBooking || isCancelling}
          style={styles.bookButton}
        />
      </View>

      {classItem.notes && (
        <Text style={styles.notes}>{classItem.notes}</Text>
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    flex: 1,
  },
  bookingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  bookingBadgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.white,
    textTransform: 'uppercase' as const,
  },
  favoriteButton: {
    padding: 4,
    marginLeft: 8,
  },
  instructor: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  levelBadge: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  capacityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  capacityText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  bookButton: {
    minWidth: 80,
  },
  notes: {
    fontSize: 12,
    color: Colors.textLight,
    fontStyle: 'italic' as const,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
})