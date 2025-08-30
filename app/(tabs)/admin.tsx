import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Plus, Calendar, Users, Settings, BarChart3, Upload, Gift } from 'lucide-react-native'
import { Card } from '@/components/ui/Card'
import { Colors } from '@/constants/colors'
import { useAuth } from '@/hooks/useAuth'
import { useAdminStats } from '@/hooks/useAdmin'
import { BulkScheduleUpload } from '@/components/BulkScheduleUpload'
import { AdminStatsPopup } from '@/components/AdminStatsPopup'
import SpecialsManagement from '@/components/SpecialsManagement'
import ClassCheckIn from '@/components/ClassCheckIn'
import ManageClasses from '@/components/ManageClasses'

export default function AdminScreen() {
  const { isAdmin } = useAuth()
  const { data: stats, isLoading: statsLoading } = useAdminStats()
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [showStatsPopup, setShowStatsPopup] = useState(false)
  const [showSpecials, setShowSpecials] = useState(false)
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [showManageClasses, setShowManageClasses] = useState(false)

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.unauthorizedContainer}>
          <Text style={styles.unauthorizedTitle}>Access Denied</Text>
          <Text style={styles.unauthorizedText}>
            You don't have permission to access the admin panel.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Admin Panel</Text>
          <Text style={styles.subtitle}>Manage studio operations</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => setShowStatsPopup(true)}
          >
            <Card style={styles.statCardInner}>
              <Users size={24} color={Colors.primary} />
              <Text style={styles.statNumber}>
                {statsLoading ? '...' : stats?.totalAccounts || 0}
              </Text>
                             <Text style={styles.statLabel}>Total Members</Text>
              <Text style={styles.statSubtext}>Tap for details</Text>
            </Card>
          </TouchableOpacity>

          <Card style={styles.statCard}>
            <Calendar size={24} color={Colors.secondary} />
            <Text style={styles.statNumber}>
              {statsLoading ? '...' : stats?.classesToday || 0}
            </Text>
            <Text style={styles.statLabel}>Classes Today</Text>
          </Card>

          <Card style={styles.statCard}>
            <BarChart3 size={24} color={Colors.success} />
            <Text style={styles.statNumber}>
              {statsLoading ? '...' : `${stats?.avgCapacity || 0}%`}
            </Text>
            <Text style={styles.statLabel}>Avg Capacity</Text>
          </Card>
        </View>

        {/* Admin Actions */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => setShowBulkUpload(!showBulkUpload)}
          >
            <Card style={styles.actionCardInner}>
              <Upload size={32} color={Colors.secondary} />
              <Text style={styles.actionTitle}>Bulk Upload</Text>
              <Text style={styles.actionSubtitle}>Upload multiple classes via CSV</Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => setShowManageClasses(!showManageClasses)}
          >
            <Card style={styles.actionCardInner}>
              <Calendar size={32} color={Colors.warning} />
              <Text style={styles.actionTitle}>Manage Classes</Text>
              <Text style={styles.actionSubtitle}>Edit, cancel, or add classes</Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Card style={styles.actionCardInner}>
              <Users size={32} color={Colors.success} />
              <Text style={styles.actionTitle}>Class Rosters</Text>
              <Text style={styles.actionSubtitle}>View bookings & check-ins</Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Card style={styles.actionCardInner}>
              <BarChart3 size={32} color={Colors.primary} />
              <Text style={styles.actionTitle}>Analytics</Text>
              <Text style={styles.actionSubtitle}>Revenue & attendance reports</Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Card style={styles.actionCardInner}>
              <Settings size={32} color={Colors.textSecondary} />
              <Text style={styles.actionTitle}>Settings</Text>
              <Text style={styles.actionSubtitle}>Studio & app configuration</Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => setShowSpecials(!showSpecials)}
          >
            <Card style={styles.actionCardInner}>
              <Gift size={32} color={Colors.primary} />
              <Text style={styles.actionTitle}>Weekly Specials</Text>
              <Text style={styles.actionSubtitle}>Manage promotional offers</Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => setShowCheckIn(!showCheckIn)}
          >
            <Card style={styles.actionCardInner}>
              <Users size={32} color={Colors.success} />
              <Text style={styles.actionTitle}>Class Check-in</Text>
              <Text style={styles.actionSubtitle}>Manage attendance & QR codes</Text>
            </Card>
          </TouchableOpacity>
        </View>

        {/* Bulk Upload Form */}
        {showBulkUpload && (
          <BulkScheduleUpload 
            onSuccess={() => setShowBulkUpload(false)}
            onCancel={() => setShowBulkUpload(false)}
          />
        )}

        {/* Manage Classes */}
        {showManageClasses && (
          <ManageClasses />
        )}

        {/* Stats Popup */}
        <AdminStatsPopup
          visible={showStatsPopup}
          onClose={() => setShowStatsPopup(false)}
          stats={stats}
          isLoading={statsLoading}
        />

        {/* Specials Management */}
        {showSpecials && (
          <SpecialsManagement />
        )}

        {/* Class Check-in */}
        {showCheckIn && (
          <ClassCheckIn />
        )}

        {/* Recent Activity */}
        <Card style={styles.activityCard}>
          <Text style={styles.activityTitle}>Recent Activity</Text>
          
          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <View style={styles.activityDot} />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>
                  Sarah Johnson booked "Hot Vinyasa Flow" for tomorrow 6:00 PM
                </Text>
                <Text style={styles.activityTime}>2 minutes ago</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <View style={styles.activityDot} />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>
                  Mike Chen cancelled "Yin Yoga" for today 7:30 PM
                </Text>
                <Text style={styles.activityTime}>5 minutes ago</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <View style={styles.activityDot} />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>
                  Emma Davis purchased "Unlimited Monthly Pass"
                </Text>
                <Text style={styles.activityTime}>12 minutes ago</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <View style={styles.activityDot} />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>
                  Class "Power Yoga" reached full capacity (20/20)
                </Text>
                <Text style={styles.activityTime}>18 minutes ago</Text>
              </View>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
  },
  statCardInner: {
    alignItems: 'center',
    padding: 16,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
  },
  statSubtext: {
    fontSize: 10,
    color: Colors.textLight,
    textAlign: 'center' as const,
    marginTop: 2,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    width: '48%',
  },
  actionCardInner: {
    alignItems: 'center',
    padding: 20,
    minHeight: 120,
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center' as const,
  },
  actionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 16,
  },
  activityCard: {
    marginBottom: 40,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  activityList: {
    gap: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 6,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: Colors.textLight,
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  unauthorizedTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'center' as const,
    marginBottom: 12,
  },
  unauthorizedText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 24,
  },
})