import React, { useState } from 'react'
import { View, Text, StyleSheet, TextInput, Alert, ScrollView } from 'react-native'
import { Calendar, Clock, User, Thermometer, BarChart3, FileText } from 'lucide-react-native'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Colors } from '@/constants/colors'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { format } from 'date-fns'


interface AddClassFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function AddClassForm({ onSuccess, onCancel }: AddClassFormProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    instructor: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '10:00',
    capacity: '20',
    duration_min: '60',
    heat_c: '',
    level: '',
    notes: ''
  })

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to add classes')
      return
    }

    if (!formData.title || !formData.instructor || !formData.date || !formData.start_time || !formData.end_time) {
      Alert.alert('Error', 'Please fill in all required fields')
      return
    }

    setIsLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('class_schedule')
        .insert({
          title: formData.title,
          instructor: formData.instructor,
          date: formData.date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          capacity: parseInt(formData.capacity) || 20,
          duration_min: parseInt(formData.duration_min) || 60,
          heat_c: formData.heat_c ? parseInt(formData.heat_c) : null,
          level: formData.level || null,
          notes: formData.notes || null,
          created_by: user.id
        } as any)
        .select()
        .single()

      if (error) {
        console.error('Error adding class:', error)
        Alert.alert('Error', 'Failed to add class. Please try again.')
        return
      }

      console.log('✅ Class added successfully:', data)
      Alert.alert('Success', 'Class added successfully!', [
        { text: 'OK', onPress: () => {
          // Reset form
          setFormData({
            title: '',
            instructor: '',
            date: format(new Date(), 'yyyy-MM-dd'),
            start_time: '09:00',
            end_time: '10:00',
            capacity: '20',
            duration_min: '60',
            heat_c: '',
            level: '',
            notes: ''
          })
          onSuccess?.()
        }}
      ])
    } catch (error) {
      console.error('Error adding class:', error)
      Alert.alert('Error', 'Failed to add class. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (isLoading) {
    return (
      <Card style={styles.container}>
        <LoadingSpinner />
        <Text style={styles.loadingText}>Adding class...</Text>
      </Card>
    )
  }

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add New Class</Text>
        <Text style={styles.subtitle}>Create a new class for the schedule</Text>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {/* Class Title */}
        <View style={styles.fieldGroup}>
          <View style={styles.fieldHeader}>
            <FileText size={16} color={Colors.primary} />
            <Text style={styles.fieldLabel}>Class Title *</Text>
          </View>
          <TextInput
            style={styles.input}
            value={formData.title}
            onChangeText={(value) => updateField('title', value)}
            placeholder="e.g. Hot Vinyasa Flow"
            placeholderTextColor={Colors.textLight}
          />
        </View>

        {/* Instructor */}
        <View style={styles.fieldGroup}>
          <View style={styles.fieldHeader}>
            <User size={16} color={Colors.primary} />
            <Text style={styles.fieldLabel}>Instructor *</Text>
          </View>
          <TextInput
            style={styles.input}
            value={formData.instructor}
            onChangeText={(value) => updateField('instructor', value)}
            placeholder="e.g. Sarah Johnson"
            placeholderTextColor={Colors.textLight}
          />
        </View>

        {/* Date */}
        <View style={styles.fieldGroup}>
          <View style={styles.fieldHeader}>
            <Calendar size={16} color={Colors.primary} />
            <Text style={styles.fieldLabel}>Date *</Text>
          </View>
          <TextInput
            style={styles.input}
            value={formData.date}
            onChangeText={(value) => updateField('date', value)}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.textLight}
          />
        </View>

        {/* Time Row */}
        <View style={styles.timeRow}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <View style={styles.fieldHeader}>
              <Clock size={16} color={Colors.primary} />
              <Text style={styles.fieldLabel}>Start Time *</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.start_time}
              onChangeText={(value) => updateField('start_time', value)}
              placeholder="09:00"
              placeholderTextColor={Colors.textLight}
            />
          </View>

          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <View style={styles.fieldHeader}>
              <Clock size={16} color={Colors.primary} />
              <Text style={styles.fieldLabel}>End Time *</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.end_time}
              onChangeText={(value) => updateField('end_time', value)}
              placeholder="10:00"
              placeholderTextColor={Colors.textLight}
            />
          </View>
        </View>

        {/* Capacity & Duration Row */}
        <View style={styles.timeRow}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <View style={styles.fieldHeader}>
              <BarChart3 size={16} color={Colors.primary} />
              <Text style={styles.fieldLabel}>Capacity</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.capacity}
              onChangeText={(value) => updateField('capacity', value)}
              placeholder="20"
              keyboardType="numeric"
              placeholderTextColor={Colors.textLight}
            />
          </View>

          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <View style={styles.fieldHeader}>
              <Clock size={16} color={Colors.primary} />
              <Text style={styles.fieldLabel}>Duration (min)</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.duration_min}
              onChangeText={(value) => updateField('duration_min', value)}
              placeholder="60"
              keyboardType="numeric"
              placeholderTextColor={Colors.textLight}
            />
          </View>
        </View>

        {/* Heat & Level Row */}
        <View style={styles.timeRow}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <View style={styles.fieldHeader}>
              <Thermometer size={16} color={Colors.primary} />
              <Text style={styles.fieldLabel}>Heat (°C)</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.heat_c}
              onChangeText={(value) => updateField('heat_c', value)}
              placeholder="38"
              keyboardType="numeric"
              placeholderTextColor={Colors.textLight}
            />
          </View>

          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <View style={styles.fieldHeader}>
              <BarChart3 size={16} color={Colors.primary} />
              <Text style={styles.fieldLabel}>Level</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.level}
              onChangeText={(value) => updateField('level', value)}
              placeholder="Beginner"
              placeholderTextColor={Colors.textLight}
            />
          </View>
        </View>

        {/* Notes */}
        <View style={styles.fieldGroup}>
          <View style={styles.fieldHeader}>
            <FileText size={16} color={Colors.primary} />
            <Text style={styles.fieldLabel}>Notes</Text>
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(value) => updateField('notes', value)}
            placeholder="Additional class information..."
            placeholderTextColor={Colors.textLight}
            multiline
            numberOfLines={3}
          />
        </View>
      </ScrollView>

      <View style={styles.buttonRow}>
        {onCancel && (
          <Button
            title="Cancel"
            onPress={onCancel}
            variant="outline"
            style={styles.cancelButton}
          />
        )}
        <Button
          title="Add Class"
          onPress={handleSubmit}
          style={styles.submitButton}
        />
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  container: {
    margin: 20,
    marginTop: 0,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  form: {
    maxHeight: 400,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
  loadingText: {
    textAlign: 'center' as const,
    marginTop: 12,
    color: Colors.textSecondary,
  },
})