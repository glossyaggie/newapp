import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Alert, ScrollView, TextInput, Modal } from 'react-native'
import { waiverApi, WaiverDocument } from '@/lib/api/admin'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Colors } from '@/constants/colors'
import { CheckCircle } from 'lucide-react-native'

export function WaiverManagement() {
  const [waivers, setWaivers] = useState<WaiverDocument[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [modalVisible, setModalVisible] = useState<boolean>(false)
  const [editingWaiver, setEditingWaiver] = useState<WaiverDocument | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    file_url: ''
  })

  useEffect(() => {
    loadWaivers()
  }, [])

  const loadWaivers = async () => {
    try {
      setLoading(true)
      const data = await waiverApi.getAllWaivers()
      setWaivers(data)
    } catch (error) {
      console.error('Error loading waivers:', error)
      Alert.alert('Error', 'Failed to load waivers')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWaiver = () => {
    setEditingWaiver(null)
    setFormData({ title: '', content: '', file_url: '' })
    setModalVisible(true)
  }

  const handleEditWaiver = (waiver: WaiverDocument) => {
    setEditingWaiver(waiver)
    setFormData({
      title: waiver.title,
      content: waiver.content,
      file_url: waiver.file_url || ''
    })
    setModalVisible(true)
  }

  const handleSaveWaiver = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      Alert.alert('Error', 'Please fill in title and content')
      return
    }

    try {
      if (editingWaiver) {
        await waiverApi.updateWaiver(editingWaiver.id, {
          title: formData.title,
          content: formData.content,
          file_url: formData.file_url || null
        })
      } else {
        await waiverApi.createWaiver({
          title: formData.title,
          content: formData.content,
          file_url: formData.file_url || null,
          is_active: false,
          version: 1
        })
      }
      
      setModalVisible(false)
      loadWaivers()
      Alert.alert('Success', `Waiver ${editingWaiver ? 'updated' : 'created'} successfully`)
    } catch (error) {
      console.error('Error saving waiver:', error)
      Alert.alert('Error', 'Failed to save waiver')
    }
  }

  const handleSetActive = async (waiver: WaiverDocument) => {
    try {
      await waiverApi.setActiveWaiver(waiver.id)
      loadWaivers()
      Alert.alert('Success', 'Waiver set as active')
    } catch (error) {
      console.error('Error setting active waiver:', error)
      Alert.alert('Error', 'Failed to set waiver as active')
    }
  }

  const handleDeleteWaiver = (waiver: WaiverDocument) => {
    Alert.alert(
      'Delete Waiver',
      `Are you sure you want to delete "${waiver.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await waiverApi.deleteWaiver(waiver.id)
              loadWaivers()
              Alert.alert('Success', 'Waiver deleted successfully')
            } catch (error) {
              console.error('Error deleting waiver:', error)
              Alert.alert('Error', 'Failed to delete waiver')
            }
          }
        }
      ]
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <Text style={styles.loadingText}>Loading waivers...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Waiver Management</Text>
        <Button
          title="Add Waiver"
          onPress={handleCreateWaiver}
          variant="primary"
          style={styles.addButton}
        />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {waivers.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No waivers found</Text>
            <Text style={styles.emptySubtext}>Create your first waiver to get started</Text>
          </Card>
        ) : (
          waivers.map((waiver) => (
            <Card key={waiver.id} style={styles.waiverCard}>
              <View style={styles.waiverHeader}>
                <View style={styles.waiverInfo}>
                  <Text style={styles.waiverTitle}>{waiver.title}</Text>
                  <Text style={styles.waiverMeta}>
                    Version {waiver.version} • {new Date(waiver.created_at).toLocaleDateString()}
                  </Text>
                  {waiver.is_active && (
                    <View style={styles.activeTag}>
                      <CheckCircle size={16} color={Colors.success} />
                      <Text style={styles.activeText}>Active</Text>
                    </View>
                  )}
                </View>
                <View style={styles.waiverActions}>
                  {!waiver.is_active && (
                    <Button
                      title="Set Active"
                      onPress={() => handleSetActive(waiver)}
                      variant="primary"
                      style={styles.actionButton}
                    />
                  )}
                  <Button
                    title="Edit"
                    onPress={() => handleEditWaiver(waiver)}
                    variant="ghost"
                    style={styles.actionButton}
                  />
                  <Button
                    title="Delete"
                    onPress={() => handleDeleteWaiver(waiver)}
                    variant="ghost"
                    style={[styles.actionButton, styles.deleteButton]}
                  />
                </View>
              </View>
              <Text style={styles.waiverPreview} numberOfLines={3}>
                {waiver.content}
              </Text>
            </Card>
          ))
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingWaiver ? 'Edit Waiver' : 'Create New Waiver'}
            </Text>
            <Button
              title="Cancel"
              onPress={() => setModalVisible(false)}
              variant="ghost"
            />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="Enter waiver title"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>File URL (Optional)</Text>
              <TextInput
                style={styles.input}
                value={formData.file_url}
                onChangeText={(text) => setFormData({ ...formData, file_url: text })}
                placeholder="https://example.com/waiver.pdf"
                placeholderTextColor={Colors.textSecondary}
                autoCapitalize="none"
                keyboardType="url"
              />
              <Text style={styles.helpText}>
                Optional: Link to a PDF or image file for users to view
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Content</Text>
              <Text style={styles.helpText}>
                Use [USER_NAME] as a placeholder for the user&apos;s name
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.content}
                onChangeText={(text) => setFormData({ ...formData, content: text })}
                placeholder="Enter waiver content..."
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={10}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              title={editingWaiver ? 'Update Waiver' : 'Create Waiver'}
              onPress={handleSaveWaiver}
              variant="primary"
              style={styles.saveButton}
            />
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  addButton: {
    paddingHorizontal: 16,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center' as const,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
  },
  waiverCard: {
    marginBottom: 16,
    padding: 16,
  },
  waiverHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 12,
  },
  waiverInfo: {
    flex: 1,
    marginRight: 16,
  },
  waiverTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  waiverMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  activeTag: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start' as const,
  },
  activeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.success,
    marginLeft: 4,
  },
  waiverActions: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  deleteButton: {
    borderColor: Colors.error,
  },
  waiverPreview: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.white,
  },
  textArea: {
    minHeight: 200,
  },
  helpText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveButton: {
    width: '100%',
  },
})