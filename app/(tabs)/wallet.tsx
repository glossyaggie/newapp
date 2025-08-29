import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Linking, Alert, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CreditCard, Plus, Clock, Check } from 'lucide-react-native'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { WalletCard } from '@/components/WalletCard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Colors } from '@/constants/colors'
import { useAuth } from '@/hooks/useAuth'
import { usePasses } from '@/hooks/usePasses'
import { createStripeCheckout } from '@/lib/api/passes'
import type { Database } from '@/types/supabase'

type PassType = Database['public']['Tables']['pass_types']['Row']

// Price mapping to your actual Stripe price IDs
const STRIPE_PRICE_IDS: Record<string, string> = {
  'Single Class': 'price_1S0r9bARpqh0Ut1y4lHGGuAT',
  '5-Class Pack': 'price_1S0vfBARpqh0Ut1ybKjeqehJ',
  '10-Class Pack': 'price_1S0rHLARpqh0Ut1ybWGa3ocf',
  '25-Class Pack': 'price_1S0rHqARpqh0Ut1ygGGaoqac',
  'Weekly Unlimited': 'price_1S0rIRARpqh0Ut1yQkmz18xc',
  'Monthly Unlimited': 'price_1S0rJlARpqh0Ut1yaeBEQVRf',
  'VIP Monthly': 'price_1S0rKbARpqh0Ut1ydYwnH2Zy',
  'VIP Yearly': 'price_1S0rLOARpqh0Ut1y2lbJ17g7',
}

// Display prices (these should match your Stripe product prices)
const PASS_PRICES: Record<string, number> = {
  'Single Class': 25,
  '5-Class Pack': 0.50, // Updated to match your actual Stripe price
  '10-Class Pack': 200,
  '25-Class Pack': 400,
  'Weekly Unlimited': 45,
  'Monthly Unlimited': 200,
  'VIP Monthly': 300,
  'VIP Yearly': 2500,
}

function getPassPrice(passType: PassType): string {
  const price = PASS_PRICES[passType.name] || 0
  return `$${price}`
}

function getPerClassPrice(passType: PassType): string {
  const price = PASS_PRICES[passType.name] || 0
  if (passType.credits && passType.credits > 0) {
    const perClass = price / passType.credits
    return `${perClass.toFixed(2)}`
  }
  return '$0'
}

export default function WalletScreen() {
  const { user } = useAuth()
  const { activePass, passTypes, hasLowCredits, isLoading } = usePasses()
  const [purchasingPassId, setPurchasingPassId] = useState<string | null>(null)

  const handlePurchasePass = async (passType: PassType) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to purchase a pass.')
      return
    }

    const priceId = STRIPE_PRICE_IDS[passType.name]
    if (!priceId) {
      Alert.alert('Error', 'Price ID not found for this pass type')
      return
    }

    setPurchasingPassId(passType.id)

    try {
      console.log('🔄 Creating checkout session for:', passType.name, 'with price ID:', priceId)
      
      const checkoutUrl = await createStripeCheckout(priceId, passType.id)
      
      console.log('✅ Checkout URL created:', checkoutUrl)
      
      if (Platform.OS === 'web') {
        window.open(checkoutUrl, '_blank')
      } else {
        const supported = await Linking.canOpenURL(checkoutUrl)
        if (supported) {
          await Linking.openURL(checkoutUrl)
        } else {
          Alert.alert('Error', 'Unable to open checkout page')
        }
      }
    } catch (error) {
      console.error('❌ Error creating checkout session:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      Alert.alert('Error', `Failed to create checkout session: ${errorMessage}`)
    } finally {
      setPurchasingPassId(null)
    }
  }

  const handleTopUp = () => {
    // Scroll to pass types or show purchase modal
    console.log('Top up pressed')
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authContainer}>
          <Text style={styles.authTitle}>Sign In Required</Text>
          <Text style={styles.authText}>
            Please sign in to view your wallet and purchase passes.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Wallet</Text>
        </View>

        <WalletCard
          activePass={activePass || null}
          hasLowCredits={hasLowCredits || false}
          onTopUp={handleTopUp}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Passes</Text>
          <Text style={styles.sectionSubtitle}>
            Choose the perfect pass for your practice
          </Text>
        </View>

        <FlatList
          data={passTypes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.passCard}>
              <View style={styles.passHeader}>
                <View style={styles.passInfo}>
                  <Text style={styles.passName}>{item.name}</Text>
                  <View style={styles.passDetails}>
                    {item.kind === 'unlimited' ? (
                      <View style={styles.passDetail}>
                        <Text style={styles.passDetailText}>Unlimited Classes</Text>
                      </View>
                    ) : (
                      <View style={styles.passDetail}>
                        <Text style={styles.passDetailText}>
                          {item.credits} {item.credits === 1 ? 'Class' : 'Classes'}
                        </Text>
                      </View>
                    )}
                    <View style={styles.passDetail}>
                      <Clock size={14} color={Colors.textSecondary} />
                      <Text style={styles.passDetailText}>
                        {item.duration_days} days validity
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.passPrice}>
                  <Text style={styles.priceText}>
                    {getPassPrice(item)}
                  </Text>
                  <Text style={styles.priceSubtext}>
                    {item.kind === 'pack' && item.credits ? 
                      `${getPerClassPrice(item)} per class` : 
                      'Best value'
                    }
                  </Text>
                </View>
              </View>

              <Button
                title={purchasingPassId === item.id ? "Creating checkout..." : "Purchase"}
                onPress={() => handlePurchasePass(item)}
                style={styles.purchaseButton}
                disabled={purchasingPassId === item.id}
              />

              {item.kind === 'unlimited' && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>Most Popular</Text>
                </View>
              )}
            </Card>
          )}
          scrollEnabled={false}
          contentContainerStyle={styles.passList}
        />

        <Card style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>Pass Benefits</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefit}>
              <Check size={16} color={Colors.success} />
              <Text style={styles.benefitText}>Book classes up to 7 days in advance</Text>
            </View>
            <View style={styles.benefit}>
              <Check size={16} color={Colors.success} />
              <Text style={styles.benefitText}>Free cancellation up to 2 hours before</Text>
            </View>
            <View style={styles.benefit}>
              <Check size={16} color={Colors.success} />
              <Text style={styles.benefitText}>Access to all class types and levels</Text>
            </View>
            <View style={styles.benefit}>
              <Check size={16} color={Colors.success} />
              <Text style={styles.benefitText}>Track your hot streaks and progress</Text>
            </View>
          </View>
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
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  passList: {
    gap: 16,
  },
  passCard: {
    position: 'relative',
    overflow: 'hidden',
  },
  passHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  passInfo: {
    flex: 1,
  },
  passName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  passDetails: {
    gap: 4,
  },
  passDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  passDetailText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  passPrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.primary,
  },
  priceSubtext: {
    fontSize: 12,
    color: Colors.textLight,
  },
  purchaseButton: {
    marginTop: 8,
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
  },
  popularText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  benefitsCard: {
    marginTop: 24,
    marginBottom: 40,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  benefitsList: {
    gap: 12,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
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