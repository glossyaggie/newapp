import React, { useState, useRef } from 'react'
import { View, Text, StyleSheet, Alert, ScrollView, Dimensions, Platform, PanResponder } from 'react-native'
import { supabase } from '@/lib/supabase'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Colors } from '@/constants/colors'
import Svg, { Path } from 'react-native-svg'

interface WaiverFormProps {
  onSuccess?: () => void
  userProfile: {
    first_name?: string
    last_name?: string
    fullname?: string
  }
}

const { width: screenWidth } = Dimensions.get('window')
const SIGNATURE_WIDTH = screenWidth - 80
const SIGNATURE_HEIGHT = 200

export function WaiverForm({ onSuccess, userProfile }: WaiverFormProps) {
  const [loading, setLoading] = useState<boolean>(false)
  const [signaturePath, setSignaturePath] = useState<string>('')
  const [isDrawing, setIsDrawing] = useState<boolean>(false)
  const pathRef = useRef<string>('')
  const currentPointRef = useRef<{ x: number; y: number } | null>(null)

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,

    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent
      currentPointRef.current = { x: locationX, y: locationY }
      pathRef.current = `M${locationX},${locationY}`
      setSignaturePath(pathRef.current)
      setIsDrawing(true)
    },

    onPanResponderMove: (evt) => {
      const { locationX, locationY } = evt.nativeEvent
      if (currentPointRef.current && isDrawing) {
        pathRef.current += ` L${locationX},${locationY}`
        setSignaturePath(pathRef.current)
        currentPointRef.current = { x: locationX, y: locationY }
      }
    },

    onPanResponderRelease: () => {
      setIsDrawing(false)
    },
  })

  const clearSignature = () => {
    setSignaturePath('')
    pathRef.current = ''
    currentPointRef.current = null
  }

  const handleSignWaiver = async () => {
    if (!signaturePath.trim()) {
      Alert.alert('Error', 'Please provide your signature')
      return
    }

    setLoading(true)
    try {
      const user = await supabase.auth.getUser()
      if (!user.data.user) throw new Error('User not authenticated')

      const { error } = await (supabase as any)
        .from('profiles')
        .update({
          waiver_signed_at: new Date().toISOString(),
          waiver_signature_data: signaturePath
        })
        .eq('id', user.data.user.id)

      if (error) throw error

      Alert.alert('Success', 'Waiver signed successfully!', [
        { text: 'OK', onPress: onSuccess }
      ])
    } catch (error: any) {
      console.error('Error signing waiver:', error)
      Alert.alert('Error', error.message || 'Failed to sign waiver')
    } finally {
      setLoading(false)
    }
  }

  const waiverText = `
LIABILITY WAIVER AND RELEASE

I, ${userProfile.fullname || `${userProfile.first_name} ${userProfile.last_name}`}, acknowledge that I am voluntarily participating in hot yoga classes and activities at The Hot Temple.

I understand that yoga practice involves physical exertion and carries inherent risks of injury. I acknowledge that the heated environment may pose additional risks including but not limited to dehydration, overheating, and heat-related illness.

I hereby release, waive, discharge, and covenant not to sue The Hot Temple, its owners, instructors, employees, and agents from any and all liability, claims, demands, actions, and causes of action whatsoever arising out of or related to any loss, damage, or injury that may be sustained by me while participating in such activities.

I acknowledge that I am in good physical condition and have no medical conditions that would prevent my safe participation in yoga classes. I agree to inform instructors of any injuries or medical conditions before class.

I understand that this waiver is binding and that I am giving up substantial rights by signing it.

By signing below, I acknowledge that I have read and understand this waiver and agree to its terms.
  `

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Card style={styles.card}>
        <Text style={styles.title}>Liability Waiver</Text>
        <Text style={styles.subtitle}>Please read and sign to continue</Text>
        
        <ScrollView style={styles.waiverTextContainer} showsVerticalScrollIndicator={true}>
          <Text style={styles.waiverText}>{waiverText}</Text>
        </ScrollView>

        <View style={styles.signatureSection}>
          <Text style={styles.signatureLabel}>Your Signature:</Text>
          
          <View style={styles.signatureContainer}>
            <View 
              style={styles.signatureCanvas}
              {...panResponder.panHandlers}
            >
              {Platform.OS !== 'web' ? (
                <Svg width={SIGNATURE_WIDTH} height={SIGNATURE_HEIGHT}>
                  <Path
                    d={signaturePath}
                    stroke={Colors.primary}
                    strokeWidth={3}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              ) : (
                <View style={styles.webSignatureFallback}>
                  <Text style={styles.webSignatureText}>
                    {signaturePath ? '✓ Signature captured' : 'Draw your signature here'}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.signatureActions}>
              <Button
                title="Clear"
                onPress={clearSignature}
                variant="ghost"
                style={styles.clearButton}
              />
            </View>
          </View>
        </View>

        <Button
          title="Sign Waiver"
          onPress={handleSignWaiver}
          loading={loading}
          disabled={!signaturePath.trim()}
          style={styles.signButton}
        />
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  card: {
    margin: 20,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  waiverTextContainer: {
    maxHeight: 300,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    backgroundColor: Colors.white,
  },
  waiverText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
  },
  signatureSection: {
    marginBottom: 24,
  },
  signatureLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  signatureContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.white,
    overflow: 'hidden' as const,
  },
  signatureCanvas: {
    width: SIGNATURE_WIDTH,
    height: SIGNATURE_HEIGHT,
    backgroundColor: Colors.white,
  },
  webSignatureFallback: {
    width: SIGNATURE_WIDTH,
    height: SIGNATURE_HEIGHT,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.surface,
  },
  webSignatureText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  signatureActions: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'flex-end' as const,
  },
  clearButton: {
    paddingHorizontal: 16,
  },
  signButton: {
    marginTop: 8,
  },
})