import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Colors } from '@/constants/colors'
import { Users, CheckCircle, Circle, QrCode, Clock, Calendar } from 'lucide-react-native'
import { getTodayClasses, getClassRoster, manualCheckIn, generateClassQR } from '@/lib/api/checkin'
import { format, parseISO } from 'date-fns'

interface Class {
  id: string
  title: string
  instructor: string
  date: string
  start_time: string
  end_time: string
}

interface ClassRoster {
  booking_id: string
  user_name: string
  user_email: string
  checked_in: boolean
  check_in_time: string | null
  check_in_method: string | null
}

export default function ClassCheckIn() {
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [roster, setRoster] = useState<ClassRoster[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingRoster, setIsLoadingRoster] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)

  useEffect(() => {
    loadTodayClasses()
  }, [])

  // Auto-refresh roster every 30 seconds when a class is selected
  useEffect(() => {
    if (!selectedClass) return

    const interval = setInterval(() => {
      loadClassRoster(selectedClass.id)
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [selectedClass])

  const loadTodayClasses = async () => {
    setIsLoading(true)
    try {
      const todayClasses = await getTodayClasses()
      setClasses(todayClasses)
    } catch (error) {
      console.error('Error loading classes:', error)
      Alert.alert('Error', 'Failed to load today\'s classes')
    } finally {
      setIsLoading(false)
    }
  }

  const loadClassRoster = async (classId: string) => {
    setIsLoadingRoster(true)
    try {
      const classRoster = await getClassRoster(classId)
      console.log('📋 Loaded roster for class:', classId, 'Roster:', classRoster)
      setRoster(classRoster)
    } catch (error) {
      console.error('Error loading roster:', error)
      Alert.alert('Error', 'Failed to load class roster')
    } finally {
      setIsLoadingRoster(false)
    }
  }

  const handleClassSelect = async (classItem: Class) => {
    setSelectedClass(classItem)
    setQrCode(null) // Reset QR code when selecting new class
    await loadClassRoster(classItem.id)
  }

  const handleCheckInToggle = async (bookingId: string, currentStatus: boolean) => {
    try {
      const result = await manualCheckIn(bookingId, !currentStatus)
      
      if (result.success) {
        // Update local state
        setRoster(prev => prev.map(item => 
          item.booking_id === bookingId 
            ? { ...item, checked_in: !currentStatus }
            : item
        ))
      } else {
        Alert.alert('Error', result.error || 'Failed to update check-in status')
      }
    } catch (error) {
      console.error('Check-in toggle error:', error)
      Alert.alert('Error', 'Failed to update check-in status')
    }
  }

  const generateQR = async () => {
    if (!selectedClass) return

    try {
      const result = await generateClassQR(selectedClass.id)
      
      if (result.success && result.qr_code) {
        setQrCode(result.qr_code)
        Alert.alert('QR Code Generated', 'QR code is ready for display in the studio')
      } else {
        Alert.alert('Error', result.error || 'Failed to generate QR code')
      }
    } catch (error) {
      console.error('Generate QR error:', error)
      Alert.alert('Error', 'Failed to generate QR code')
    }
  }

  const getCheckInStats = () => {
    const total = roster.length
    const checkedIn = roster.filter(item => item.checked_in).length
    return { total, checkedIn, percentage: total > 0 ? Math.round((checkedIn / total) * 100) : 0 }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Class Check-in</Text>
        <Text style={styles.subtitle}>Manage student attendance</Text>
      </View>

      {/* Class Selection */}
      <Card style={styles.classSelectionCard}>
        <Text style={styles.sectionTitle}>Select Class</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classList}>
          {classes.map((classItem) => (
            <TouchableOpacity
              key={classItem.id}
              style={[
                styles.classCard,
                selectedClass?.id === classItem.id && styles.selectedClassCard
              ]}
              onPress={() => handleClassSelect(classItem)}
            >
                             <Text style={[
                 styles.classTitle,
                 selectedClass?.id === classItem.id && styles.selectedClassTitle
               ]}>
                 {classItem.title}
               </Text>
                              <Text style={[
                  styles.classTime,
                  selectedClass?.id === classItem.id && styles.selectedClassTime
                ]}>
                  {new Date(classItem.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {classItem.start_time}
                </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Card>

      {/* QR Code Section */}
      {selectedClass && (
        <Card style={styles.qrCard}>
          <View style={styles.qrHeader}>
            <QrCode size={20} color={Colors.primary} />
            <Text style={styles.qrTitle}>QR Code for Studio Display</Text>
          </View>
          {qrCode ? (
            <View style={styles.qrDisplay}>
              <Text style={styles.qrCode}>{qrCode}</Text>
              <Text style={styles.qrExpiry}>Expires in 15 minutes</Text>
            </View>
          ) : (
            <Button title="Generate QR Code" onPress={generateQR} />
          )}
        </Card>
      )}

      {/* Class Roster */}
      {selectedClass && (
        <Card style={styles.rosterCard}>
          <View style={styles.rosterHeader}>
            <Text style={styles.sectionTitle}>Class Roster</Text>
            <View style={styles.statsContainer}>
              <Users size={16} color={Colors.textSecondary} />
              <Text style={styles.statsText}>
                {getCheckInStats().checkedIn}/{getCheckInStats().total} checked in
              </Text>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={() => selectedClass && loadClassRoster(selectedClass.id)}
                disabled={isLoadingRoster}
              >
                <Text style={styles.refreshButtonText}>
                  {isLoadingRoster ? 'Refreshing...' : 'Refresh'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {isLoadingRoster ? (
            <LoadingSpinner />
          ) : roster.length > 0 ? (
            <ScrollView style={styles.rosterList}>
              {roster.map((student) => (
                <TouchableOpacity
                  key={student.booking_id}
                  style={styles.studentRow}
                  onPress={() => handleCheckInToggle(student.booking_id, student.checked_in)}
                >
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.user_name}</Text>
                    <Text style={styles.studentEmail}>{student.user_email}</Text>
                    {student.check_in_time && (
                      <View style={styles.checkInTime}>
                        <Clock size={12} color={Colors.textLight} />
                                                 <Text style={styles.checkInTimeText}>
                           {student.check_in_time} via {student.check_in_method}
                         </Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.checkInStatus}>
                    {student.checked_in ? (
                      <CheckCircle size={24} color={Colors.success} />
                    ) : (
                      <Circle size={24} color={Colors.border} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyRoster}>
              <Users size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No students booked for this class</Text>
            </View>
          )}
        </Card>
      )}

      {classes.length === 0 && (
        <Card style={styles.emptyCard}>
          <Calendar size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>No classes scheduled for today</Text>
        </Card>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  classSelectionCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  classList: {
    flexDirection: 'row',
  },
  classCard: {
    padding: 16,
    marginRight: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    minWidth: 120,
  },
  selectedClassCard: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  classTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  selectedClassTitle: {
    color: Colors.white,
  },
  classTime: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  selectedClassTime: {
    color: Colors.white,
    opacity: 0.8,
  },
  qrCard: {
    marginBottom: 16,
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
  qrDisplay: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
  qrCode: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  qrExpiry: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  rosterCard: {
    flex: 1,
  },
  rosterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  refreshButton: {
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  refreshButtonText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
  },
  rosterList: {
    flex: 1,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  studentEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  checkInTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkInTimeText: {
    fontSize: 12,
    color: Colors.textLight,
    marginLeft: 4,
  },
  checkInStatus: {
    marginLeft: 12,
  },
  emptyRoster: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
  },
})
