import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { format, addDays, startOfDay, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react-native'
import { ClassCard } from '@/components/ClassCard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Colors } from '@/constants/colors'
import { useAuth } from '@/hooks/useAuth'
import { useSchedule } from '@/hooks/useSchedule'
import { usePasses } from '@/hooks/usePasses'

const FILTER_CHIPS = [
  { id: 'all', label: 'All Classes' },
  { id: 'morning', label: 'Morning' },
  { id: 'evening', label: 'Evening' },
  { id: 'beginner', label: 'Beginner' },
  { id: '60min', label: '60min' },
  { id: 'favorites', label: 'Favorites' },
]

export default function ScheduleScreen() {
  const { user, hasSignedWaiver } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedFilter, setSelectedFilter] = useState('all')
  
  const { 
    classes, 
    isLoading, 
    bookClass, 
    cancelBooking, 
    toggleFavorite,
    isBooking,
    isCancelling 
  } = useSchedule(selectedDate)
  
  const { activePass } = usePasses()

  const canBook = !!user && hasSignedWaiver && !!activePass && 
    (activePass.is_unlimited || activePass.remaining_credits > 0)

  // Generate date options (today + next 6 days)
  const dateOptions = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i))

  const filteredClasses = classes.filter(classItem => {
    switch (selectedFilter) {
      case 'morning':
        return parseInt(classItem.start_time.split(':')[0]) < 12
      case 'evening':
        return parseInt(classItem.start_time.split(':')[0]) >= 17
      case 'beginner':
        return classItem.level?.toLowerCase().includes('beginner')
      case '60min':
        return classItem.duration_min === 60
      case 'favorites':
        return classItem.is_favorite
      default:
        return true
    }
  })

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  const handleBookClass = (classId: string) => {
    if (!canBook) return
    bookClass(classId)
  }

  const handleCancelBooking = (bookingId: string) => {
    cancelBooking(bookingId)
  }

  const handleToggleFavorite = (classId: string, isFavorite: boolean) => {
    toggleFavorite({ classId, isFavorite })
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authContainer}>
          <Text style={styles.authTitle}>Sign In Required</Text>
          <Text style={styles.authText}>
            Please sign in to view the class schedule and book classes.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Class Schedule</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Date Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.dateSelector}
        contentContainerStyle={styles.dateSelectorContent}
      >
        {dateOptions.map((date, index) => {
          const isSelected = isSameDay(date, selectedDate)
          const isToday = isSameDay(date, new Date())
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dateOption,
                isSelected && styles.dateOptionSelected,
              ]}
              onPress={() => handleDateSelect(date)}
            >
              <Text style={[
                styles.dateDay,
                isSelected && styles.dateDaySelected,
              ]}>
                {format(date, 'EEE')}
              </Text>
              <Text style={[
                styles.dateNumber,
                isSelected && styles.dateNumberSelected,
              ]}>
                {format(date, 'd')}
              </Text>
              {isToday && (
                <View style={styles.todayDot} />
              )}
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {/* Filter Chips */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterChips}
        contentContainerStyle={styles.filterChipsContent}
      >
        {FILTER_CHIPS.map((filter) => {
          const isSelected = selectedFilter === filter.id
          
          return (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterChip,
                isSelected && styles.filterChipSelected,
              ]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Text style={[
                styles.filterChipText,
                isSelected && styles.filterChipTextSelected,
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {/* Classes List */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={filteredClasses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ClassCard
              classItem={item}
              onBook={handleBookClass}
              onCancel={handleCancelBooking}
              onToggleFavorite={handleToggleFavorite}
              isBooking={isBooking}
              isCancelling={isCancelling}
              canBook={canBook}
            />
          )}
          contentContainerStyle={styles.classList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Classes Found</Text>
              <Text style={styles.emptyText}>
                {selectedFilter === 'all' 
                  ? 'No classes scheduled for this day.'
                  : 'No classes match your current filter.'
                }
              </Text>
            </View>
          }
        />
      )}

      {!hasSignedWaiver && (
        <View style={styles.waiverBanner}>
          <Text style={styles.waiverBannerText}>
            Complete your waiver to book classes
          </Text>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  filterButton: {
    padding: 8,
  },
  dateSelector: {
    maxHeight: 80,
  },
  dateSelectorContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  dateOption: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 60,
    position: 'relative',
  },
  dateOptionSelected: {
    backgroundColor: Colors.primary,
  },
  dateDay: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  dateDaySelected: {
    color: Colors.white,
  },
  dateNumber: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  dateNumberSelected: {
    color: Colors.white,
  },
  todayDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  filterChips: {
    maxHeight: 50,
    marginTop: 16,
  },
  filterChipsContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  filterChipTextSelected: {
    color: Colors.white,
  },
  classList: {
    padding: 20,
    paddingTop: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  waiverBanner: {
    backgroundColor: Colors.warning,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  waiverBannerText: {
    color: Colors.white,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
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