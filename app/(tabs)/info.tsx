import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MapPin, Phone, Mail, Clock, ExternalLink, LogOut, User } from 'lucide-react-native'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Colors } from '@/constants/colors'
import { useAuth } from '@/hooks/useAuth'

export default function InfoScreen() {
  const { user, profile, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }



  const handleOpenMaps = () => {
    const address = '123 Yoga Street, Wellness City, WC 12345'
    const url = `https://maps.google.com/?q=${encodeURIComponent(address)}`
    Linking.openURL(url)
  }

  const handleCall = () => {
    Linking.openURL('tel:+1234567890')
  }

  const handleEmail = () => {
    Linking.openURL('mailto:hello@hottemple.com')
  }

  const handleWebsite = () => {
    Linking.openURL('https://hottemple.com')
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Studio Info</Text>
        </View>

        {/* Studio Info */}
        <Card style={styles.studioCard}>
          <Text style={styles.studioName}>The Hot Temple</Text>
          <Text style={styles.studioTagline}>Transform your practice, ignite your soul</Text>
          
          <View style={styles.contactInfo}>
            <TouchableOpacity style={styles.contactItem} onPress={handleOpenMaps}>
              <MapPin size={20} color={Colors.primary} />
              <View style={styles.contactText}>
                <Text style={styles.contactLabel}>Address</Text>
                <Text style={styles.contactValue}>123 Yoga Street, Wellness City, WC 12345</Text>
              </View>
              <ExternalLink size={16} color={Colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactItem} onPress={handleCall}>
              <Phone size={20} color={Colors.primary} />
              <View style={styles.contactText}>
                <Text style={styles.contactLabel}>Phone</Text>
                <Text style={styles.contactValue}>(123) 456-7890</Text>
              </View>
              <ExternalLink size={16} color={Colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactItem} onPress={handleEmail}>
              <Mail size={20} color={Colors.primary} />
              <View style={styles.contactText}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>hello@hottemple.com</Text>
              </View>
              <ExternalLink size={16} color={Colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactItem} onPress={handleWebsite}>
              <ExternalLink size={20} color={Colors.primary} />
              <View style={styles.contactText}>
                <Text style={styles.contactLabel}>Website</Text>
                <Text style={styles.contactValue}>hottemple.com</Text>
              </View>
              <ExternalLink size={16} color={Colors.textLight} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Hours */}
        <Card style={styles.hoursCard}>
          <View style={styles.hoursHeader}>
            <Clock size={24} color={Colors.primary} />
            <Text style={styles.hoursTitle}>Studio Hours</Text>
          </View>
          
          <View style={styles.hoursList}>
            <View style={styles.hoursItem}>
              <Text style={styles.hoursDay}>Monday - Friday</Text>
              <Text style={styles.hoursTime}>6:00 AM - 9:00 PM</Text>
            </View>
            <View style={styles.hoursItem}>
              <Text style={styles.hoursDay}>Saturday</Text>
              <Text style={styles.hoursTime}>7:00 AM - 7:00 PM</Text>
            </View>
            <View style={styles.hoursItem}>
              <Text style={styles.hoursDay}>Sunday</Text>
              <Text style={styles.hoursTime}>8:00 AM - 6:00 PM</Text>
            </View>
          </View>
        </Card>

        {/* Policies */}
        <Card style={styles.policiesCard}>
          <Text style={styles.policiesTitle}>Studio Policies</Text>
          
          <View style={styles.policy}>
            <Text style={styles.policyTitle}>Cancellation Policy</Text>
            <Text style={styles.policyText}>
              Cancel up to 2 hours before class start time for a full credit refund. 
              Late cancellations will result in credit forfeiture.
            </Text>
          </View>

          <View style={styles.policy}>
            <Text style={styles.policyTitle}>Late Arrival</Text>
            <Text style={styles.policyText}>
              Please arrive 10-15 minutes early. Late arrivals may not be admitted 
              to maintain the peaceful environment for other students.
            </Text>
          </View>

          <View style={styles.policy}>
            <Text style={styles.policyTitle}>What to Bring</Text>
            <Text style={styles.policyText}>
              Bring a yoga mat, towel, and water bottle. Mats and towels are 
              available for rent at the studio.
            </Text>
          </View>

          <View style={styles.policy}>
            <Text style={styles.policyTitle}>Health & Safety</Text>
            <Text style={styles.policyText}>
              Please inform instructors of any injuries or health conditions. 
              Stay hydrated and listen to your body during practice.
            </Text>
          </View>
        </Card>

        {/* Account Section */}
        {user && (
          <Card style={styles.accountCard}>
            <View style={styles.accountHeader}>
              <User size={24} color={Colors.primary} />
              <Text style={styles.accountTitle}>Account</Text>
            </View>
            
            <View style={styles.accountInfo}>
              <Text style={styles.accountLabel}>Email</Text>
              <Text style={styles.accountValue}>{user.email}</Text>
            </View>
            
            {profile?.fullname && (
              <View style={styles.accountInfo}>
                <Text style={styles.accountLabel}>Name</Text>
                <Text style={styles.accountValue}>{profile.fullname}</Text>
              </View>
            )}

            <View style={styles.accountInfo}>
              <Text style={styles.accountLabel}>Waiver Status</Text>
              <Text style={[
                styles.accountValue,
                { color: profile?.waiver_signed_at ? Colors.success : Colors.warning }
              ]}>
                {profile?.waiver_signed_at ? 'Signed' : 'Pending'}
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title="Sign Out"
                onPress={handleSignOut}
                variant="outline"
                style={styles.signOutButton}
              />
            </View>
          </Card>
        )}

        {!user && (
          <Card style={styles.authPromptCard}>
            <Text style={styles.authPromptTitle}>Sign In</Text>
            <Text style={styles.authPromptText}>
              Sign in to view your account details and manage your profile.
            </Text>
          </Card>
        )}
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
  studioCard: {
    marginBottom: 20,
    alignItems: 'center',
  },
  studioName: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  studioTagline: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontStyle: 'italic' as const,
    marginBottom: 24,
    textAlign: 'center' as const,
  },
  contactInfo: {
    width: '100%',
    gap: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactText: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 16,
    color: Colors.text,
  },
  hoursCard: {
    marginBottom: 20,
  },
  hoursHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  hoursTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  hoursList: {
    gap: 12,
  },
  hoursItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hoursDay: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  hoursTime: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  policiesCard: {
    marginBottom: 20,
  },
  policiesTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  policy: {
    marginBottom: 16,
  },
  policyTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  policyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  accountCard: {
    marginBottom: 20,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  accountTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  accountInfo: {
    marginBottom: 12,
  },
  accountLabel: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    marginBottom: 2,
  },
  accountValue: {
    fontSize: 16,
    color: Colors.text,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  signOutButton: {
    flex: 1,
  },
  authPromptCard: {
    marginBottom: 40,
    alignItems: 'center',
  },
  authPromptTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  authPromptText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
})