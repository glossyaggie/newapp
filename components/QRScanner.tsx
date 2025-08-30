import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Alert, Modal, TextInput } from 'react-native'
import { Camera, CameraType, BarCodeScanner } from 'expo-camera'
import { TouchableOpacity } from 'react-native'
import { X, QrCode, CheckCircle, AlertCircle } from 'lucide-react-native'
import { Colors } from '@/constants/colors'
import { checkInWithQR } from '@/lib/api/checkin'
import { useAuth } from '@/hooks/useAuth'

interface QRScannerProps {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function QRScanner({ visible, onClose, onSuccess }: QRScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [scanned, setScanned] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [manualQRCode, setManualQRCode] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      try {
        const { status } = await Camera.requestCameraPermissionsAsync()
        setHasPermission(status === 'granted')
      } catch (error) {
        console.log('Camera permission error:', error)
        // On web, we might not have camera access, so we'll show a different interface
        setHasPermission(false)
      }
    }

    getBarCodeScannerPermissions()
  }, [])

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || isProcessing) return

    setScanned(true)
    setIsProcessing(true)

    try {
      if (!user?.id) {
        Alert.alert('Error', 'Please log in to check in')
        return
      }

      const result = await checkInWithQR(data, user.id)

      if (result.success) {
        Alert.alert(
          'Success! 🎉',
          result.message || 'You have been checked in successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                onSuccess()
                onClose()
              }
            }
          ]
        )
      } else {
        Alert.alert('Check-in Failed', result.error || 'Unable to check in. Please try again.')
      }
    } catch (error) {
      console.error('QR scan error:', error)
      Alert.alert('Error', 'Failed to process QR code. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const resetScanner = () => {
    setScanned(false)
    setIsProcessing(false)
  }

  const handleManualSubmit = async () => {
    if (!manualQRCode.trim() || isProcessing) return

    setIsProcessing(true)
    try {
      if (!user?.id) {
        Alert.alert('Error', 'Please log in to check in')
        return
      }

      const result = await checkInWithQR(manualQRCode.trim(), user.id)

      if (result.success) {
        Alert.alert(
          'Success! 🎉',
          result.message || 'You have been checked in successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                onSuccess()
                onClose()
              }
            }
          ]
        )
      } else {
        Alert.alert('Check-in Failed', result.error || 'Unable to check in. Please try again.')
      }
    } catch (error) {
      console.error('Manual QR check-in error:', error)
      Alert.alert('Error', 'Failed to process QR code. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (hasPermission === null) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.container}>
          <Text style={styles.text}>Requesting camera permission...</Text>
        </View>
      </Modal>
    )
  }

  if (hasPermission === false) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Check In</Text>
            <View style={styles.placeholder} />
          </View>
          
          <View style={styles.noCameraContainer}>
            <AlertCircle size={48} color={Colors.error} />
            <Text style={styles.text}>Camera Access Required</Text>
            <Text style={styles.subtext}>
              To check in, you'll need to allow camera access to scan the QR code at the studio.
            </Text>
            
            <View style={styles.manualInputContainer}>
              <Text style={styles.manualInputTitle}>Or enter QR code manually:</Text>
              <TextInput
                style={styles.manualInput}
                placeholder="Enter QR code from studio"
                placeholderTextColor={Colors.textSecondary}
                onChangeText={(text) => setManualQRCode(text)}
                value={manualQRCode}
              />
              <TouchableOpacity 
                style={[styles.manualSubmitButton, !manualQRCode && styles.manualSubmitButtonDisabled]}
                onPress={handleManualSubmit}
                disabled={!manualQRCode}
              >
                <Text style={styles.manualSubmitButtonText}>Check In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    )
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan QR Code</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Camera View */}
        <View style={styles.cameraContainer}>
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={styles.camera}
          />
          
          {/* Overlay */}
          <View style={styles.overlay}>
            <View style={styles.scanArea}>
              <View style={styles.corner} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <QrCode size={24} color={Colors.white} />
            <Text style={styles.instructionText}>
              Position the QR code within the frame
            </Text>
          </View>
        </View>

        {/* Processing State */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <View style={styles.processingContent}>
              <CheckCircle size={48} color={Colors.success} />
              <Text style={styles.processingText}>Processing...</Text>
            </View>
          </View>
        )}

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          {scanned && !isProcessing && (
            <TouchableOpacity style={styles.scanAgainButton} onPress={resetScanner}>
              <Text style={styles.scanAgainText}>Scan Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: Colors.primary,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  placeholder: {
    width: 40,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: Colors.primary,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    top: 0,
    left: 0,
  },
  cornerTopRight: {
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderLeftWidth: 0,
    top: 0,
    right: 0,
    left: 'auto',
  },
  cornerBottomLeft: {
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderTopWidth: 0,
    bottom: 0,
    top: 'auto',
  },
  cornerBottomRight: {
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    bottom: 0,
    right: 0,
    top: 'auto',
    left: 'auto',
  },
  instructions: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  instructionText: {
    color: Colors.white,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContent: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: Colors.white,
    borderRadius: 16,
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  bottomActions: {
    padding: 20,
    alignItems: 'center',
  },
  scanAgainButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  scanAgainText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  text: {
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  noCameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  manualInputContainer: {
    width: '100%',
    marginTop: 20,
  },
  manualInputTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  manualInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.white,
    marginBottom: 12,
  },
  manualSubmitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  manualSubmitButtonDisabled: {
    backgroundColor: Colors.border,
  },
  manualSubmitButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
})
