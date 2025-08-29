import React, { useState } from 'react'
import { View, Text, StyleSheet, Alert, Platform, TextInput, Pressable } from 'react-native'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Upload, CheckCircle, AlertCircle, FileText, File, Copy } from 'lucide-react-native'
import * as DocumentPicker from 'expo-document-picker'

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
  const [selectedFileName, setSelectedFileName] = useState('')
  const [uploadMethod, setUploadMethod] = useState<'file' | 'paste'>('file')

  const handleFileUpload = async () => {
    try {
      console.log('Starting file upload, platform:', Platform.OS)
      
      if (Platform.OS === 'web') {
        // Web file picker
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.csv,text/csv'
        input.onchange = async (e: any) => {
          const file = e.target.files?.[0]
          if (file) {
            console.log('File selected:', file.name, 'Type:', file.type)
            setSelectedFileName(file.name)
            
            const reader = new FileReader()
            reader.onload = (event) => {
              const content = event.target?.result as string
              console.log('File content loaded, length:', content.length)
              setCsvContent(content)
              setUploadResult(null)
            }
            reader.onerror = (error) => {
              console.error('File read error:', error)
              Alert.alert('Error', 'Failed to read the selected file')
            }
            reader.readAsText(file)
          }
        }
        input.click()
      } else {
        // Mobile file picker using expo-document-picker
        const result = await DocumentPicker.getDocumentAsync({
          type: 'text/csv',
          copyToCacheDirectory: true,
        })
        
        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0]
          console.log('File selected:', asset.name, 'URI:', asset.uri)
          setSelectedFileName(asset.name)
          
          // Read file content
          const response = await fetch(asset.uri)
          const content = await response.text()
          console.log('File content loaded, length:', content.length)
          setCsvContent(content)
          setUploadResult(null)
        }
      }
    } catch (error) {
      console.error('File upload error:', error)
      Alert.alert('Error', 'Failed to select or read the file')
    }
  }

  const handlePasteContent = () => {
    Alert.prompt(
      'Paste CSV Content',
      'Paste your CSV data here (including headers):',
      (text) => {
        if (text) {
          setCsvContent(text)
          setUploadResult(null)
          setSelectedFileName('Pasted content')
        }
      },
      'plain-text',
      csvContent,
      'default'
    )
  }

  const copySampleData = () => {
    const sampleData = `title,instructor,date,day,start_time,end_time,capacity
HOT HIIT PILATES,Mel Lawson,2025/08/29,Thursday,6:00 AM,7:00 AM,24
YOGA FLOW,Sarah Johnson,2025/08/29,Thursday,7:30 AM,8:30 AM,20
STRENGTH TRAINING,Mike Davis,2025/08/29,Thursday,6:00 PM,7:00 PM,16
PILATES CORE,Emma Wilson,2025/08/30,Friday,9:00 AM,10:00 AM,18`
    
    if (Platform.OS === 'web') {
      navigator.clipboard.writeText(sampleData)
      Alert.alert('Copied!', 'Sample CSV data copied to clipboard')
    } else {
      setCsvContent(sampleData)
      setSelectedFileName('Sample data')
      Alert.alert('Sample Loaded', 'Sample CSV data loaded')
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
        Upload your weekly class schedule via CSV file. The CSV should have columns: title, instructor, date, day, start_time, end_time, capacity
      </Text>

      <View style={styles.formatExample}>
        <Text style={styles.exampleTitle}>Expected CSV Format:</Text>
        <Text style={styles.exampleText}>
          title,instructor,date,day,start_time,end_time,capacity{"\n"}HOT HIIT PILATES,Mel Lawson,2025/08/25,Monday,6:00 AM,7:00 AM,24{"\n"}YOGA FLOW,Sarah Johnson,2025/08/25,Monday,7:30 AM,8:30 AM,20
        </Text>
      </View>

      <View style={styles.sampleContainer}>
        <View style={styles.sampleHeader}>
          <FileText size={16} color="#007AFF" />
          <Text style={styles.sampleTitle}>Sample CSV Data</Text>
          <Pressable style={styles.copyButton} onPress={copySampleData}>
            <Copy size={16} color="#007AFF" />
            <Text style={styles.copyButtonText}>Copy Sample</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.methodSelector}>
        <Text style={styles.methodTitle}>Choose upload method:</Text>
        <View style={styles.methodButtons}>
          <Pressable
            style={[
              styles.methodButton,
              uploadMethod === 'file' && styles.methodButtonActive
            ]}
            onPress={() => setUploadMethod('file')}
          >
            <File size={20} color={uploadMethod === 'file' ? '#007AFF' : '#6B7280'} />
            <Text style={[
              styles.methodButtonText,
              uploadMethod === 'file' && styles.methodButtonTextActive
            ]}>Upload File</Text>
          </Pressable>
          <Pressable
            style={[
              styles.methodButton,
              uploadMethod === 'paste' && styles.methodButtonActive
            ]}
            onPress={() => setUploadMethod('paste')}
          >
            <FileText size={20} color={uploadMethod === 'paste' ? '#007AFF' : '#6B7280'} />
            <Text style={[
              styles.methodButtonText,
              uploadMethod === 'paste' && styles.methodButtonTextActive
            ]}>Paste Content</Text>
          </Pressable>
        </View>
      </View>

      {uploadMethod === 'file' ? (
        <Pressable
          style={[
            styles.dropZone,
            csvContent && styles.dropZoneWithContent
          ]}
          onPress={handleFileUpload}
        >
          <View style={styles.dropZoneContent}>
            <File size={32} color="#6B7280" />
            <Text style={styles.dropZoneTitle}>
              {Platform.OS === 'web' ? 'Click to select CSV file' : 'Tap to select CSV file'}
            </Text>
            {selectedFileName && (
              <Text style={styles.selectedFileName}>
                Selected: {selectedFileName}
              </Text>
            )}
            <Text style={styles.dropZoneSubtitle}>
              Supports .csv files up to 10MB
            </Text>
          </View>
        </Pressable>
      ) : (
        <Pressable
          style={[
            styles.dropZone,
            csvContent && styles.dropZoneWithContent
          ]}
          onPress={handlePasteContent}
        >
          <View style={styles.dropZoneContent}>
            <FileText size={32} color="#6B7280" />
            <Text style={styles.dropZoneTitle}>
              Tap to paste CSV content
            </Text>
            {selectedFileName && (
              <Text style={styles.selectedFileName}>
                Content: {selectedFileName}
              </Text>
            )}
            <Text style={styles.dropZoneSubtitle}>
              Copy your CSV data and paste it here
            </Text>
          </View>
        </Pressable>
      )}

      {uploadMethod === 'paste' && (
        <View style={styles.textAreaContainer}>
          <Text style={styles.textAreaLabel}>
            CSV Content:
          </Text>
          <View style={styles.textAreaWrapper}>
            {Platform.OS === 'web' ? (
              <TextInput
                style={styles.textAreaInput}
                value={csvContent}
                onChangeText={(text) => {
                  setCsvContent(text)
                  setUploadResult(null)
                  setSelectedFileName(text ? 'Manual input' : '')
                }}
                placeholder="Paste your CSV content here..."
                multiline
                textAlignVertical="top"
              />
            ) : (
              <Pressable 
                style={styles.textArea}
                onPress={handlePasteContent}
              >
                <Text style={styles.textAreaPlaceholder}>
                  {csvContent || 'Tap to paste CSV content...'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {csvContent && (
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>CSV Preview:</Text>
          <Text style={styles.previewText} numberOfLines={5}>
            {csvContent.substring(0, 200)}{csvContent.length > 200 ? '...' : ''}
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
  dropZone: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  dropZoneActive: {
    borderColor: '#007AFF',
    backgroundColor: '#EBF8FF',
  },
  dropZoneWithContent: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  dropZoneContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropZoneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
  },
  dropZoneTitleActive: {
    color: '#007AFF',
  },
  dropZoneSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  selectedFileName: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
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
  textAreaContainer: {
    marginBottom: 16,
  },
  textAreaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textAreaWrapper: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    padding: 12,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#4B5563',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  textAreaInput: {
    padding: 12,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#4B5563',
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 0,
  },
  sampleContainer: {
    backgroundColor: '#EBF8FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  sampleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    flex: 1,
    marginLeft: 8,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  copyButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  methodSelector: {
    marginBottom: 16,
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  methodButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  methodButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#EBF8FF',
  },
  methodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 8,
  },
  methodButtonTextActive: {
    color: '#007AFF',
  },
  textAreaPlaceholder: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#4B5563',
    minHeight: 100,
    textAlignVertical: 'top',
  },
})