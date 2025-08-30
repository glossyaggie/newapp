import React from 'react'
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { X, Users, CreditCard, Calendar, TrendingUp, PieChart } from 'lucide-react-native'
import { Card } from '@/components/ui/Card'
import { Colors } from '@/constants/colors'
import { AdminStats } from '@/hooks/useAdmin'

interface AdminStatsPopupProps {
  visible: boolean
  onClose: () => void
  stats: AdminStats | undefined
  isLoading: boolean
}

export function AdminStatsPopup({ visible, onClose, stats, isLoading }: AdminStatsPopupProps) {
  if (!visible) return null

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Member Statistics</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading statistics...</Text>
            </View>
          ) : (
            <>
              {/* Overview Cards */}
              <View style={styles.overviewGrid}>
                <Card style={styles.overviewCard}>
                  <Users size={24} color={Colors.primary} />
                  <Text style={styles.overviewNumber}>{stats?.totalAccounts || 0}</Text>
                  <Text style={styles.overviewLabel}>Total Accounts</Text>
                </Card>

                <Card style={styles.overviewCard}>
                  <CreditCard size={24} color={Colors.success} />
                  <Text style={styles.overviewNumber}>{stats?.activePassHolders || 0}</Text>
                  <Text style={styles.overviewLabel}>Active Pass Holders</Text>
                </Card>

                <Card style={styles.overviewCard}>
                  <TrendingUp size={24} color={Colors.secondary} />
                  <Text style={styles.overviewNumber}>{stats?.recentSignups || 0}</Text>
                  <Text style={styles.overviewLabel}>New This Month</Text>
                </Card>
              </View>

              {/* Pass Distribution */}
              <Card style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <PieChart size={20} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>Pass Distribution</Text>
                </View>
                
                <View style={styles.distributionList}>
                  <View style={styles.distributionItem}>
                    <View style={styles.distributionDot} />
                    <Text style={styles.distributionLabel}>Single Class Passes</Text>
                    <Text style={styles.distributionValue}>{stats?.passDistribution.singleClass || 0}</Text>
                  </View>
                  
                  <View style={styles.distributionItem}>
                    <View style={[styles.distributionDot, { backgroundColor: Colors.secondary }]} />
                    <Text style={styles.distributionLabel}>Class Packs</Text>
                    <Text style={styles.distributionValue}>{stats?.passDistribution.classPacks || 0}</Text>
                  </View>
                  
                  <View style={styles.distributionItem}>
                    <View style={[styles.distributionDot, { backgroundColor: Colors.success }]} />
                    <Text style={styles.distributionLabel}>Unlimited Passes</Text>
                    <Text style={styles.distributionValue}>{stats?.passDistribution.unlimited || 0}</Text>
                  </View>
                </View>
              </Card>

              {/* Engagement Metrics */}
              <Card style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Calendar size={20} color={Colors.warning} />
                  <Text style={styles.sectionTitle}>Engagement</Text>
                </View>
                
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Classes Today</Text>
                  <Text style={styles.metricValue}>{stats?.classesToday || 0}</Text>
                </View>
                
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Average Capacity</Text>
                  <Text style={styles.metricValue}>{stats?.avgCapacity || 0}%</Text>
                </View>
                
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Conversion Rate</Text>
                  <Text style={styles.metricValue}>
                    {stats?.totalAccounts > 0 
                      ? Math.round((stats.activePassHolders / stats.totalAccounts) * 100)
                      : 0}%
                  </Text>
                </View>
              </Card>

              {/* Insights */}
              <Card style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Quick Insights</Text>
                
                <View style={styles.insightList}>
                  {stats?.recentSignups > 0 && (
                    <Text style={styles.insightText}>
                      📈 {stats.recentSignups} new members joined this month
                    </Text>
                  )}
                  
                  {stats?.activePassHolders > 0 && (
                    <Text style={styles.insightText}>
                      💳 {stats.activePassHolders} members have active passes
                    </Text>
                  )}
                  
                  {stats?.passDistribution.unlimited > 0 && (
                    <Text style={styles.insightText}>
                      ⭐ {stats.passDistribution.unlimited} unlimited members
                    </Text>
                  )}
                  
                  {stats?.classesToday > 0 && (
                    <Text style={styles.insightText}>
                      🧘 {stats.classesToday} classes scheduled today
                    </Text>
                  )}
                </View>
              </Card>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  overviewGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  overviewCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  overviewNumber: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
  },
  sectionCard: {
    marginBottom: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  distributionList: {
    gap: 12,
  },
  distributionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  distributionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  distributionLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  distributionValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  insightList: {
    gap: 8,
  },
  insightText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
})
