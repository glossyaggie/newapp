import React, { useState, useRef, useEffect } from 'react'
import { View, Text, StyleSheet, Alert, ScrollView, Dimensions, Platform, PanResponder, Linking } from 'react-native'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/supabase'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
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
  const [loadingWaiver, setLoadingWaiver] = useState<boolean>(true)
  const [waiverUrl, setWaiverUrl] = useState<string | null>(null)
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

      const updateData: Database['public']['Tables']['profiles']['Update'] = {
        waiver_signed_at: new Date().toISOString(),
        waiver_signature_data: signaturePath
      }
      
      const { error } = await (supabase as any)
        .from('profiles')
        .update(updateData)
        .eq('id', user.data.user.id)

      if (error) throw error

      // Send waiver email with signature
      try {
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
        
        const response = await fetch(`${supabaseUrl}/functions/v1/waiver_email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.data.user.id,
            userProfile,
            signatureData: signaturePath
          })
        })
        
        if (!response.ok) {
          console.warn('Failed to send waiver email:', await response.text())
        }
      } catch (emailError) {
        console.warn('Error sending waiver email:', emailError)
      }

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

  // Load waiver document on component mount
  useEffect(() => {
    loadWaiver()
  }, [])

  const loadWaiver = async () => {
    try {
      setLoadingWaiver(true)
      // Get the public URL for the waiver PDF
      const { data } = supabase.storage
        .from('waivers')
        .getPublicUrl('hot_yoga_waiver_simple.pdf')
      
      setWaiverUrl(data.publicUrl)
    } catch (error) {
      console.error('Error loading waiver:', error)
      Alert.alert('Error', 'Failed to load waiver document')
    } finally {
      setLoadingWaiver(false)
    }
  }

  const openWaiverPDF = async () => {
    if (waiverUrl) {
      try {
        const supported = await Linking.canOpenURL(waiverUrl)
        if (supported) {
          await Linking.openURL(waiverUrl)
        } else {
          Alert.alert('Error', 'Cannot open PDF viewer')
        }
      } catch (error) {
        console.error('Error opening PDF:', error)
        Alert.alert('Error', 'Failed to open waiver document')
      }
    }
  }

  if (loadingWaiver) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <Text style={styles.loadingText}>Loading waiver...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Card style={styles.card}>
        <Text style={styles.title}>Liability Waiver</Text>
        <Text style={styles.subtitle}>Please read and sign to continue</Text>
        
        <View style={styles.waiverSection}>
          <Text style={styles.waiverDescription}>
            Please review the waiver document before signing. Tap the button below to open and read the full waiver.
          </Text>
          
          <Button
            title="📄 View Waiver Document"
            onPress={openWaiverPDF}
            variant="outline"
            style={styles.viewWaiverButton}
            disabled={!waiverUrl}
          />
          
          <Text style={styles.agreementText}>
            By signing below, I acknowledge that I have read and agree to the terms of the waiver document.
          </Text>
        </View>

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
  waiverSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  waiverDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center' as const,
  },
  viewWaiverButton: {
    marginBottom: 16,
  },
  agreementText: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    fontStyle: 'italic' as const,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.background,
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
})