import React, { useState } from 'react'
import { View, Text, StyleSheet, Alert, Platform } from 'react-native'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react-native'

interface UploadResult {
  success: boolean
  message: string
  insertedCount?: number
  error?: string
}

export function ScheduleUpload() {
  const { user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [csvContent, setCsvContent] = useState('')
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [replaceExisting, setReplaceExisting] = useState(false)

  const handleFileSelect = () => {
    if (Platform.OS === 'web') {
      // Create file input for web
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.csv'
      input.onchange = (e: any) => {
        const file = e.target.files[0]
        if (file) {
          const reader = new FileReader()
          reader.onload = (event) => {
            const content = event.target?.result as string
            setCsvContent(content)
            setUploadResult(null)
          }
          reader.readAsText(file)
        }
      }
      input.click()
    } else {
      // For mobile, you'd need to use expo-document-picker
      Alert.alert('Mobile Upload', 'Please paste your CSV content directly or use the web version for file upload.')
    }
  }

  const uploadSchedule = async () => {
    if (!csvContent.trim()) {
      Alert.alert('Error', 'Please select a CSV file or paste CSV content first.')
      return
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to upload schedules.')
      return
    }

    setIsUploading(true)
    setUploadResult(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/schedule_import`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            csvData: csvContent,
            replaceExisting,
          }),
        }
      )

      const result = await response.json()

      if (result.success) {
        setUploadResult({
          success: true,
          message: result.message,
          insertedCount: result.insertedCount,
        })
        setCsvContent('') // Clear the content after successful upload
      } else {
        setUploadResult({
          success: false,
          error: result.error || 'Upload failed',
          message: '',
        })
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: '',
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Upload size={24} color="#007AFF" />
        <Text style={styles.title}>Upload Weekly Schedule</Text>
      </View>

      <Text style={styles.description}>
        Upload your weekly class schedule via CSV file. The CSV should have columns:
        title, instructor, date, day, start_time, end_time, capacity
      </Text>

      <View style={styles.formatExample}>
        <Text style={styles.exampleTitle}>Expected CSV Format:</Text>
        <Text style={styles.exampleText}>
          title,instructor,date,day,start_time,end_time,capacity{"\n"}
          HOT HIIT PILATES,Mel Lawson,2025/08/25,Monday,6:00 AM,7:00 PM,24
        </Text>
      </View>

      {Platform.OS === 'web' && (
        <Button
          title="Select CSV File"
          onPress={handleFileSelect}
          style={styles.selectButton}
        />
      )}

      {csvContent && (
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>CSV Preview:</Text>
          <Text style={styles.previewText} numberOfLines={5}>
            {csvContent.substring(0, 200)}...
          </Text>
          <Text style={styles.rowCount}>
            {csvContent.split('\n').length - 1} rows detected
          </Text>
        </View>
      )}

      <View style={styles.optionsContainer}>
        <Button
          title={replaceExisting ? "Replace Existing Classes" : "Add to Existing Classes"}
          onPress={() => setReplaceExisting(!replaceExisting)}
          variant={replaceExisting ? "secondary" : "outline"}
          style={styles.optionButton}
        />
      </View>

      <Button
        title={isUploading ? "Uploading..." : "Upload Schedule"}
        onPress={uploadSchedule}
        disabled={isUploading || !csvContent.trim()}
        style={styles.uploadButton}
      />

      {isUploading && (
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
          <Text style={styles.loadingText}>Processing schedule...</Text>
        </View>
      )}

      {uploadResult && (
        <View style={[
          styles.resultContainer,
          uploadResult.success ? styles.successResult : styles.errorResult
        ]}>
          {uploadResult.success ? (
            <CheckCircle size={20} color="#10B981" />
          ) : (
            <AlertCircle size={20} color="#EF4444" />
          )}
          <Text style={[
            styles.resultText,
            uploadResult.success ? styles.successText : styles.errorText
          ]}>
            {uploadResult.success ? uploadResult.message : uploadResult.error}
          </Text>
          {uploadResult.insertedCount && (
            <Text style={styles.countText}>
              {uploadResult.insertedCount} classes imported
            </Text>
          )}
        </View>
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    margin: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
    color: '#1F2937',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  formatExample: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  exampleTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#4B5563',
    lineHeight: 16,
  },
  selectButton: {
    marginBottom: 16,
  },
  previewContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#4B5563',
    lineHeight: 16,
  },
  rowCount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    fontWeight: '500',
  },
  optionsContainer: {
    marginBottom: 16,
  },
  optionButton: {
    marginBottom: 8,
  },
  uploadButton: {
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  resultContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  successResult: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  errorResult: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  resultText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  successText: {
    color: '#065F46',
  },
  errorText: {
    color: '#991B1B',
  },
  countText: {
    fontSize: 12,
    color: '#065F46',
    marginTop: 4,
    marginLeft: 28,
  },
})