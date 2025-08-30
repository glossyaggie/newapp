import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Gift, ArrowRight } from 'lucide-react-native'
import { Colors } from '@/constants/colors'

// This will be replaced with real data from the database later
// For now, we'll use a simple state that can be updated
interface WeeklySpecial {
  title: string
  description?: string
  discount_percentage?: number
}

// Global state for the current special (simple implementation)
let currentSpecial: WeeklySpecial | null = (() => {
  try {
    const saved = localStorage.getItem('weekly_specials')
    if (saved) {
      const specials = JSON.parse(saved)
      const activeSpecial = specials.find((s: any) => s.is_active)
      if (activeSpecial) {
        return {
          title: activeSpecial.title,
          description: activeSpecial.description,
          discount_percentage: activeSpecial.discount_percentage
        }
      }
    }
  } catch {
    // Fallback to default
  }
  return {
    title: "Bring a Friend Week",
    description: "Bring a friend for free this week!",
    discount_percentage: null
  }
})()

// Function to update the special (will be called from admin)
export const updateCurrentSpecial = (special: WeeklySpecial | null) => {
  currentSpecial = special
}

export default function SpecialsBanner() {
  // For now, always show the current special
  const special = currentSpecial

  if (!special) {
    return null // Don't show banner if no special
  }

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.8}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Gift size={24} color={Colors.white} />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.title}>{special.title}</Text>
            {special.description && (
              <Text style={styles.description}>{special.description}</Text>
            )}
            {special.discount_percentage && (
              <Text style={styles.discount}>{special.discount_percentage}% OFF</Text>
            )}
          </View>
          
          <View style={styles.arrowContainer}>
            <ArrowRight size={20} color={Colors.white} />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gradient: {
    borderRadius: 12,
    padding: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: 4,
  },
  discount: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  arrowContainer: {
    marginLeft: 8,
  },
})
