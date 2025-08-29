import React, { useState } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { X } from 'lucide-react-native'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Colors } from '@/constants/colors'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Database } from '@/types/supabase'

interface BulkScheduleUploadProps {
  onSuccess: () => void
  onCancel: () => void
}

type ClassInsert = Database['public']['Tables']['class_schedule']['Insert']

interface ClassData {
  title: string
  instructor: string
  date: string
  start_time: string
  end_time: string
  capacity: number
  duration_min: number
  heat_c?: number | null
  level?: string | null
  notes?: string | null
}

export function BulkScheduleUpload({ onSuccess, onCancel }: BulkScheduleUploadProps) {
  const { user } = useAuth()
  const [csvData, setCsvData] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [previewData, setPreviewData] = useState<ClassData[]>([])
  const [showPreview, setShowPreview] = useState(false)

  const parseCSV = (csvText: string): ClassData[] => {
    const lines = csvText.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const classes: ClassData[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      if (values.length < headers.length) continue

      const classData: any = {}
      headers.forEach((header, index) => {
        const value = values[index]
        switch (header) {
          case 'title':
          case 'class':
          case 'name':
            classData.title = value
            break
          case 'instructor':
          case 'teacher':
            classData.instructor = value
            break
          case 'date':
            classData.date = value
            break
          case 'start_time':
          case 'start':
          case 'time':
            classData.start_time = value
            break
          case 'end_time':
          case 'end':
            classData.end_time = value
            break
          case 'capacity':
            classData.capacity = parseInt(value) || 20
            break
          case 'duration':
          case 'duration_min':
            classData.duration_min = parseInt(value) || 60
            break
          case 'heat':
          case 'heat_c':
            classData.heat_c = parseInt(value) || null
            break
          case 'level':
            classData.level = value
            break
          case 'notes':
            classData.notes = value
            break
        }
      })

      if (classData.title && classData.instructor && classData.date && classData.start_time) {
        // Set defaults
        classData.capacity = classData.capacity || 20
        classData.duration_min = classData.duration_min || 60
        
        // Generate end_time if not provided
        if (!classData.end_time && classData.start_time && classData.duration_min) {
          const [hours, minutes] = classData.start_time.split(':').map(Number)
          const startMinutes = hours * 60 + minutes
          const endMinutes = startMinutes + classData.duration_min
          const endHours = Math.floor(endMinutes / 60)
          const endMins = endMinutes % 60
          classData.end_time = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
        }

        classes.push(classData)
      }
    }

    return classes
  }

  const handlePreview = () => {
    if (!csvData.trim()) {
      Alert.alert('Error', 'Please enter CSV data first')
      return
    }

    const parsed = parseCSV(csvData)
    if (parsed.length === 0) {
      Alert.alert('Error', 'No valid classes found in CSV data. Please check the format.')
      return
    }

    setPreviewData(parsed)
    setShowPreview(true)
  }

  const handleUpload = async () => {
    if (!user || previewData.length === 0) return

    setIsUploading(true)
    try {
      const classesToInsert: ClassInsert[] = previewData.map(classData => ({
        title: classData.title,
        instructor: classData.instructor,
        date: classData.date,
        start_time: classData.start_time,
        end_time: classData.end_time,
        capacity: classData.capacity,
        duration_min: classData.duration_min,
        heat_c: classData.heat_c || null,
        level: classData.level || null,
        notes: classData.notes || null,
        created_by: user.id
      }))

      const { error } = await supabase
        .from('class_schedule')
        .insert(classesToInsert as any)

      if (error) throw error

      Alert.alert(
        'Success', 
        `Successfully uploaded ${previewData.length} classes to the schedule!`,
        [{ text: 'OK', onPress: onSuccess }]
      )
    } catch (error) {
      console.error('Upload error:', error)
      Alert.alert('Error', 'Failed to upload classes. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const sampleCSV = `title,instructor,date,start_time,end_time,capacity,level
Hot Vinyasa Flow,Sarah Johnson,2025-08-30,06:00,07:00,20,All Levels
Yin Yoga,Mike Chen,2025-08-30,19:30,20:30,15,Beginner
Power Yoga,Emma Davis,2025-08-31,09:00,10:00,25,Intermediate`

  if (showPreview) {
    return (
      <Card style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Preview Classes ({previewData.length})</Text>
          <TouchableOpacity onPress={() => setShowPreview(false)}>
            <X size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.previewList} showsVerticalScrollIndicator={false}>
          {previewData.map((classItem, index) => (
            <Card key={index} style={styles.previewItem}>
              <Text style={styles.previewTitle}>{classItem.title}</Text>
              <Text style={styles.previewDetail}>Instructor: {classItem.instructor}</Text>
              <Text style={styles.previewDetail}>Date: {classItem.date}</Text>
              <Text style={styles.previewDetail}>Time: {classItem.start_time} - {classItem.end_time}</Text>
              <Text style={styles.previewDetail}>Capacity: {classItem.capacity}</Text>
              {classItem.level && (
                <Text style={styles.previewDetail}>Level: {classItem.level}</Text>
              )}
              {classItem.notes && (
                <Text style={styles.previewDetail}>Notes: {classItem.notes}</Text>
              )}
            </Card>
          ))}
        </ScrollView>

        <View style={styles.buttonRow}>
          <Button
            title="Back to Edit"
            onPress={() => setShowPreview(false)}
            variant="outline"
            style={styles.button}
          />
          <Button
            title={isUploading ? 'Uploading...' : 'Upload Classes'}
            onPress={handleUpload}
            disabled={isUploading}
            loading={isUploading}
            style={styles.button}
          />
        </View>
      </Card>
    )
  }

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bulk Schedule Upload</Text>
        <TouchableOpacity onPress={onCancel}>
          <X size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.description}>
        Upload multiple classes at once using CSV format. You can copy and paste from Excel or Google Sheets.
      </Text>

      <View style={styles.sampleSection}>
        <Text style={styles.sampleTitle}>Sample CSV Format:</Text>
        <View style={styles.sampleBox}>
          <Text style={styles.sampleText}>{sampleCSV}</Text>
        </View>
        <Text style={styles.sampleNote}>
          Required fields: title, instructor, date (YYYY-MM-DD), start_time (HH:MM)
        </Text>
      </View>

      <Text style={styles.inputLabel}>Paste your CSV data:</Text>
      <TextInput
        style={styles.textInput}
        value={csvData}
        onChangeText={setCsvData}
        placeholder="Paste CSV data here..."
        multiline
        numberOfLines={8}
        textAlignVertical="top"
      />

      <View style={styles.buttonRow}>
        <Button
          title="Cancel"
          onPress={onCancel}
          variant="outline"
          style={styles.button}
        />
        <Button
          title="Preview Classes"
          onPress={handlePreview}
          style={styles.button}
        />
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  sampleSection: {
    marginBottom: 20,
  },
  sampleTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  sampleBox: {
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  sampleText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: Colors.text,
    lineHeight: 16,
  },
  sampleNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic' as const,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.surface,
    minHeight: 120,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
  previewList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  previewItem: {
    padding: 12,
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  previewDetail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
})