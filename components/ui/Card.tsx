import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { Colors } from '@/constants/colors'

interface CardProps {
  children: React.ReactNode
  style?: ViewStyle
  padding?: number
}

export function Card({ children, style, padding = 16 }: CardProps) {
  return (
    <View style={[styles.card, { padding }, style]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
})