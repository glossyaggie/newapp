import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Colors } from '@/constants/colors'
import { Calendar, Plus, Edit, Trash2, X, Clock, User } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'

interface Class {
  id: string
  title: string
  instructor: string
  date: string
  start_time: string
  end_time: string
  capacity: number
  duration: number
}

interface ClassFormData {
  title: string
  instructor: string
  date: string
  start_time: string
  end_time: string
  capacity: number
  duration: number
}

export default function ManageClasses() {
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [formData, setFormData] = useState<ClassFormData>({
    title: '',
    instructor: '',
    date: '',
    start_time: '',
    end_time: '',
    capacity: 20,
    duration: 60
  })

  useEffect(() => {
    loadClasses()
  }, [])

  const loadClasses = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('class_schedule')
        .select('*')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date')
        .order('start_time')

      if (error) throw error
      setClasses(data || [])
    } catch (error) {
      console.error('Error loading classes:', error)
      Alert.alert('Error', 'Failed to load classes')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      instructor: '',
      date: '',
      start_time: '',
      end_time: '',
      capacity: 20,
      duration: 60
    })
  }

  const handleAddClass = async () => {
    if (!formData.title || !formData.instructor || !formData.date || !formData.start_time || !formData.end_time) {
      Alert.alert('Error', 'Please fill in all required fields')
      return
    }

    try {
      const { error } = await supabase
        .from('class_schedule')
        .insert([formData])

      if (error) throw error

      Alert.alert('Success', 'Class added successfully!')
      setShowAddForm(false)
      resetForm()
      loadClasses()
    } catch (error) {
      console.error('Error adding class:', error)
      Alert.alert('Error', 'Failed to add class')
    }
  }

  const handleEditClass = async () => {
    if (!editingClass || !formData.title || !formData.instructor || !formData.date || !formData.start_time || !formData.end_time) {
      Alert.alert('Error', 'Please fill in all required fields')
      return
    }

    try {
      const { error } = await supabase
        .from('class_schedule')
        .update(formData)
        .eq('id', editingClass.id)

      if (error) throw error

      Alert.alert('Success', 'Class updated successfully!')
      setEditingClass(null)
      resetForm()
      loadClasses()
    } catch (error) {
      console.error('Error updating class:', error)
      Alert.alert('Error', 'Failed to update class')
    }
  }

  const handleCancelClass = async (classId: string, className: string) => {
    Alert.alert(
      'Cancel Class',
      `Are you sure you want to cancel "${className}"? This will also cancel all bookings for this class.`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              // First cancel all bookings for this class
              const { error: bookingsError } = await supabase
                .from('class_bookings')
                .update({ status: 'cancelled' })
                .eq('class_id', classId)

              if (bookingsError) throw bookingsError

              // Then delete the class
              const { error: classError } = await supabase
                .from('class_schedule')
                .delete()
                .eq('id', classId)

              if (classError) throw classError

              Alert.alert('Success', 'Class cancelled successfully!')
              loadClasses()
            } catch (error) {
              console.error('Error cancelling class:', error)
              Alert.alert('Error', 'Failed to cancel class')
            }
          }
        }
      ]
    )
  }

  const startEditing = (classItem: Class) => {
    setEditingClass(classItem)
    setFormData({
      title: classItem.title,
      instructor: classItem.instructor,
      date: classItem.date,
      start_time: classItem.start_time,
      end_time: classItem.end_time,
      capacity: classItem.capacity,
      duration: classItem.duration
    })
  }

  const ClassForm = ({ isEditing = false }: { isEditing?: boolean }) => (
    <Modal
      visible={showAddForm || !!editingClass}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Edit Class' : 'Add New Class'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowAddForm(false)
                setEditingClass(null)
                resetForm()
              }}
            >
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Class Title *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="e.g., HOT 60, Vinyasa Flow"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Instructor *</Text>
              <TextInput
                style={styles.input}
                value={formData.instructor}
                onChangeText={(text) => setFormData({ ...formData, instructor: text })}
                placeholder="e.g., Vicky Raabe"
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Date *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.date}
                  onChangeText={(text) => setFormData({ ...formData, date: text })}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Duration (min) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.duration.toString()}
                  onChangeText={(text) => setFormData({ ...formData, duration: parseInt(text) || 60 })}
                  keyboardType="numeric"
                  placeholder="60"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Start Time *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.start_time}
                  onChangeText={(text) => setFormData({ ...formData, start_time: text })}
                  placeholder="HH:MM"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>End Time *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.end_time}
                  onChangeText={(text) => setFormData({ ...formData, end_time: text })}
                  placeholder="HH:MM"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Capacity</Text>
              <TextInput
                style={styles.input}
                value={formData.capacity.toString()}
                onChangeText={(text) => setFormData({ ...formData, capacity: parseInt(text) || 20 })}
                keyboardType="numeric"
                placeholder="20"
              />
            </View>

            <View style={styles.formButtons}>
              <Button
                title="Cancel"
                onPress={() => {
                  setShowAddForm(false)
                  setEditingClass(null)
                  resetForm()
                }}
                style={styles.cancelButton}
              />
              <Button
                title={isEditing ? 'Update Class' : 'Add Class'}
                onPress={isEditing ? handleEditClass : handleAddClass}
                style={styles.submitButton}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Classes</Text>
        <Text style={styles.subtitle}>Add, edit, or cancel classes</Text>
      </View>

      {/* Add Class Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddForm(true)}
      >
        <Card style={styles.addButtonCard}>
          <Plus size={24} color={Colors.primary} />
          <Text style={styles.addButtonText}>Add New Class</Text>
        </Card>
      </TouchableOpacity>

      {/* Classes List */}
      <View style={styles.classesList}>
        {classes.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Calendar size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No upcoming classes</Text>
            <Text style={styles.emptySubtext}>Add your first class to get started</Text>
          </Card>
        ) : (
          classes.map((classItem) => (
            <Card key={classItem.id} style={styles.classCard}>
              <View style={styles.classHeader}>
                <View style={styles.classInfo}>
                  <Text style={styles.classTitle}>{classItem.title}</Text>
                  <Text style={styles.classInstructor}>{classItem.instructor}</Text>
                  <Text style={styles.classDateTime}>
                    {format(parseISO(classItem.date), 'MMM dd, yyyy')} • {classItem.start_time} - {classItem.end_time}
                  </Text>
                  <Text style={styles.classCapacity}>
                    Capacity: {classItem.capacity} • Duration: {classItem.duration}min
                  </Text>
                </View>
                
                <View style={styles.classActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => startEditing(classItem)}
                  >
                    <Edit size={20} color={Colors.primary} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleCancelClass(classItem.id, classItem.title)}
                  >
                    <Trash2 size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))
        )}
      </View>

      {/* Add/Edit Class Form Modal */}
      <ClassForm isEditing={!!editingClass} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  addButton: {
    marginBottom: 20,
  },
  addButtonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: Colors.primary,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  classesList: {
    flex: 1,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 4,
  },
  classCard: {
    marginBottom: 12,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  classInfo: {
    flex: 1,
  },
  classTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  classInstructor: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  classDateTime: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  classCapacity: {
    fontSize: 12,
    color: Colors.textLight,
  },
  classActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: Colors.background,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  form: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: Colors.white,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.textLight,
  },
  submitButton: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
})
