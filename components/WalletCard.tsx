import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { format, parseISO } from 'date-fns'
import { CreditCard, Calendar, AlertTriangle } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { Colors } from '@/constants/colors'

interface WalletCardProps {
  activePass: {
    remaining_credits: number
    valid_until: string
    is_unlimited: boolean
    pass_name: string
  } | null
  hasLowCredits: boolean
  onTopUp: () => void
}

export function WalletCard({ activePass, hasLowCredits, onTopUp }: WalletCardProps) {
  if (!activePass) {
    return (
      <Card style={styles.card}>
        <View style={styles.noPassContainer}>
          <CreditCard size={48} color={Colors.textLight} />
          <Text style={styles.noPassTitle}>No Active Pass</Text>
          <Text style={styles.noPassText}>
            Purchase a class pass to start booking classes
          </Text>
          <Button
            title="Buy Pass"
            onPress={onTopUp}
            style={styles.buyButton}
          />
        </View>
      </Card>
    )
  }

  const expiryDate = format(parseISO(activePass.valid_until), 'MMM d, yyyy')
  const isUnlimited = activePass.is_unlimited

  return (
    <Card style={styles.card} padding={0}>
      <LinearGradient
        colors={Colors.primaryGradient}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <Text style={styles.passName}>{activePass.pass_name}</Text>
          <CreditCard size={24} color={Colors.white} />
        </View>

        <View style={styles.creditsContainer}>
          {isUnlimited ? (
            <Text style={styles.creditsText}>Unlimited</Text>
          ) : (
            <>
              <Text style={styles.creditsNumber}>{activePass.remaining_credits}</Text>
              <Text style={styles.creditsLabel}>
                {activePass.remaining_credits === 1 ? 'Credit' : 'Credits'} Remaining
              </Text>
            </>
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.expiryContainer}>
            <Calendar size={16} color={Colors.white} />
            <Text style={styles.expiryText}>Expires {expiryDate}</Text>
          </View>
        </View>
      </LinearGradient>

      {hasLowCredits && (
        <View style={styles.warningContainer}>
          <AlertTriangle size={16} color={Colors.warning} />
          <Text style={styles.warningText}>
            Low credits! Top up to keep booking classes.
          </Text>
          <Button
            title="Top Up"
            onPress={onTopUp}
            variant="outline"
            size="small"
            style={styles.topUpButton}
          />
        </View>
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 20,
  },
  gradient: {
    borderRadius: 12,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  passName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  creditsContainer: {
    marginBottom: 16,
  },
  creditsNumber: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: Colors.white,
    lineHeight: 40,
  },
  creditsText: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  creditsLabel: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiryText: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.warning + '10',
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: Colors.warning,
    fontWeight: '500' as const,
  },
  topUpButton: {
    borderColor: Colors.warning,
  },
  noPassContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noPassTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  noPassText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: 20,
    lineHeight: 20,
  },
  buyButton: {
    minWidth: 120,
  },
})