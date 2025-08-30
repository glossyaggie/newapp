import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Colors } from '@/constants/colors'
import { Plus, Edit, Trash2, Calendar, Gift } from 'lucide-react-native'
import { format, parseISO } from 'date-fns'
import { updateCurrentSpecial } from './SpecialsBanner'

interface SpecialFormData {
  title: string
  description: string
  discount_percentage: string
  valid_from: string
  valid_until: string
}

interface WeeklySpecial {
  id: string
  title: string
  description?: string
  discount_percentage?: number
  valid_from: string
  valid_until: string
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string
}

export default function SpecialsManagement() {
  // Mock data for now - replace with real hooks later
  const [specials, setSpecials] = useState<WeeklySpecial[]>(() => {
    // Load from localStorage on component mount
    try {
      const saved = localStorage.getItem('weekly_specials')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [isLoading, setIsLoading] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editingSpecial, setEditingSpecial] = useState<WeeklySpecial | null>(null)
  const [formData, setFormData] = useState<SpecialFormData>({
    title: '',
    description: '',
    discount_percentage: '',
    valid_from: '',
    valid_until: '',
  })

  const saveSpecialsToStorage = (newSpecials: WeeklySpecial[]) => {
    try {
      localStorage.setItem('weekly_specials', JSON.stringify(newSpecials))
      // Update the banner with the first active special
      const activeSpecial = newSpecials.find(s => s.is_active)
      if (activeSpecial) {
        updateCurrentSpecial({
          title: activeSpecial.title,
          description: activeSpecial.description,
          discount_percentage: activeSpecial.discount_percentage
        })
      } else {
        updateCurrentSpecial(null)
      }
    } catch (error) {
      console.error('Failed to save specials to storage:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      discount_percentage: '',
      valid_from: '',
      valid_until: '',
    })
    setEditingSpecial(null)
    setShowForm(false)
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Title is required')
      return
    }

    if (!formData.valid_from || !formData.valid_until) {
      Alert.alert('Error', 'Valid from and until dates are required')
      return
    }

    try {
      const specialData: WeeklySpecial = {
        id: editingSpecial?.id || Date.now().toString(),
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        discount_percentage: formData.discount_percentage ? parseInt(formData.discount_percentage) : undefined,
        valid_from: formData.valid_from,
        valid_until: formData.valid_until,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'current-user',
      }

      if (editingSpecial) {
        const updatedSpecials = specials.map(s => s.id === editingSpecial.id ? specialData : s)
        setSpecials(updatedSpecials)
        saveSpecialsToStorage(updatedSpecials)
        Alert.alert('Success', 'Special updated successfully!')
      } else {
        const newSpecials = [specialData, ...specials]
        setSpecials(newSpecials)
        saveSpecialsToStorage(newSpecials)
        Alert.alert('Success', 'Special created successfully! Check the home page to see the banner!')
      }
      resetForm()
    } catch (error) {
      Alert.alert('Error', 'Failed to save special')
    }
  }

  const handleEdit = (special: WeeklySpecial) => {
    setEditingSpecial(special)
    setFormData({
      title: special.title,
      description: special.description || '',
      discount_percentage: special.discount_percentage?.toString() || '',
      valid_from: special.valid_from,
      valid_until: special.valid_until,
    })
    setShowForm(true)
  }

  const handleToggleStatus = async (special: WeeklySpecial) => {
    try {
      const updatedSpecials = specials.map(s => 
        s.id === special.id ? { ...s, is_active: !s.is_active } : s
      )
      setSpecials(updatedSpecials)
      saveSpecialsToStorage(updatedSpecials)
    } catch (error) {
      Alert.alert('Error', 'Failed to update status')
    }
  }

  const handleDelete = async (special: WeeklySpecial) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete "${special.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const remainingSpecials = specials.filter(s => s.id !== special.id)
              setSpecials(remainingSpecials)
              saveSpecialsToStorage(remainingSpecials)
              Alert.alert('Success', 'Special deleted successfully!')
            } catch (error) {
              Alert.alert('Error', 'Failed to delete special')
            }
          },
        },
      ]
    )
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Weekly Specials</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowForm(true)}
        >
          <Plus size={20} color={Colors.white} />
          <Text style={styles.addButtonText}>Add Special</Text>
        </TouchableOpacity>
      </View>

      {/* Form */}
      {showForm && (
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>
            {editingSpecial ? 'Edit Special' : 'Create New Special'}
          </Text>
          
          <TextInput
            style={styles.input}
            placeholder="Special Title (e.g., 'Bring a Friend Week')"
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Description (e.g., 'Bring a friend for free this week!')"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            multiline
          />
          
          <TextInput
            style={styles.input}
            placeholder="Discount % (optional, e.g., 20)"
            value={formData.discount_percentage}
            onChangeText={(text) => setFormData({ ...formData, discount_percentage: text })}
            keyboardType="numeric"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Valid From (YYYY-MM-DD)"
            value={formData.valid_from}
            onChangeText={(text) => setFormData({ ...formData, valid_from: text })}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Valid Until (YYYY-MM-DD)"
            value={formData.valid_until}
            onChangeText={(text) => setFormData({ ...formData, valid_until: text })}
          />
          
          <View style={styles.formButtons}>
            <Button
              title="Cancel"
              onPress={resetForm}
              variant="secondary"
              style={styles.formButton}
            />
            <Button
              title={editingSpecial ? 'Update' : 'Create'}
              onPress={handleSubmit}
              style={styles.formButton}
            />
          </View>
        </Card>
      )}

      {/* Specials List */}
      <ScrollView style={styles.specialsList}>
        {specials.map((special) => (
          <Card key={special.id} style={styles.specialCard}>
            <View style={styles.specialHeader}>
              <View style={styles.specialInfo}>
                <Text style={styles.specialTitle}>{special.title}</Text>
                {special.description && (
                  <Text style={styles.specialDescription}>{special.description}</Text>
                )}
                {special.discount_percentage && (
                  <Text style={styles.discountBadge}>{special.discount_percentage}% OFF</Text>
                )}
              </View>
              
              <View style={styles.specialActions}>
                <TouchableOpacity
                  style={[styles.statusButton, { backgroundColor: special.is_active ? Colors.success : Colors.error }]}
                  onPress={() => handleToggleStatus(special)}
                >
                  <Text style={styles.statusText}>
                    {special.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEdit(special)}
                >
                  <Edit size={16} color={Colors.primary} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDelete(special)}
                >
                  <Trash2 size={16} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.specialDates}>
              <View style={styles.dateItem}>
                <Calendar size={14} color={Colors.textSecondary} />
                <Text style={styles.dateText}>
                  From: {format(parseISO(special.valid_from), 'MMM d, yyyy')}
                </Text>
              </View>
              <View style={styles.dateItem}>
                <Calendar size={14} color={Colors.textSecondary} />
                <Text style={styles.dateText}>
                  Until: {format(parseISO(special.valid_until), 'MMM d, yyyy')}
                </Text>
              </View>
            </View>
          </Card>
        ))}
        
        {specials.length === 0 && (
          <Card style={styles.emptyCard}>
            <Gift size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No specials created yet</Text>
            <Text style={styles.emptySubtext}>Create your first weekly special to promote classes</Text>
          </Card>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: Colors.white,
    fontWeight: '600',
    marginLeft: 4,
  },
  formCard: {
    marginBottom: 16,
    padding: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: Colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: Colors.white,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  formButton: {
    flex: 1,
  },
  specialsList: {
    flex: 1,
  },
  specialCard: {
    marginBottom: 12,
    padding: 16,
  },
  specialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  specialInfo: {
    flex: 1,
  },
  specialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  specialDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  discountBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  specialActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  actionButton: {
    padding: 4,
  },
  specialDates: {
    marginTop: 12,
    gap: 4,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
})
