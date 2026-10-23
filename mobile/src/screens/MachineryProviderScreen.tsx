import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Switch
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  MobileDataService,
  MobileMachinery,
  MobileBooking
} from '../services/dataService';

export default function MachineryProviderScreen({ navigation }: any) {
  const { t, language } = useLanguage();
  const { user, signOut, setUserRole } = useAuth();
  const isTa = language === 'ta';

  const [activeTab, setActiveTab] = useState<'bookings' | 'fleet' | 'profile'>('bookings');
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'active' | 'completed'>('active');
  const [fleet, setFleet] = useState<MobileMachinery[]>([]);
  const [bookings, setBookings] = useState<MobileBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const providerId = user?.id || 'demo-provider-1';

  const loadData = async () => {
    try {
      const [fList, bList] = await Promise.all([
        MobileDataService.getProviderEquipment(providerId),
        MobileDataService.getProviderBookings(providerId)
      ]);
      setFleet(fList);
      setBookings(bList);
    } catch (err) {
      console.warn('Failed to load machinery provider data:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [providerId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleToggleAvailability = async (machine: MobileMachinery) => {
    const nextState = !machine.available;
    await MobileDataService.toggleMachineryAvailability(machine.id, nextState);
    Alert.alert(
      'Availability Updated',
      `${machine.name} is now marked as ${nextState ? 'Available for booking' : 'Busy / Under Maintenance'}.`
    );
    await loadData();
  };

  const handleUpdateStatus = async (
    bookingId: string,
    nextStatus: 'confirmed' | 'on_the_way' | 'in_progress' | 'completed' | 'cancelled'
  ) => {
    await MobileDataService.updateBookingStatus(bookingId, nextStatus);
    Alert.alert('Booking Updated', `Status transitioned to ${nextStatus.replace('_', ' ').toUpperCase()}.`);
    await loadData();
  };

  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === 'all') return true;
    if (bookingFilter === 'pending') return b.status === 'pending';
    if (bookingFilter === 'active') return ['confirmed', 'on_the_way', 'in_progress'].includes(b.status);
    if (bookingFilter === 'completed') return ['completed', 'cancelled'].includes(b.status);
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.providerTitle}>
              {user?.name || 'AgriME Equipment Hub'}
            </Text>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>🚜 Provider</Text>
            </View>
          </View>
          <Text style={styles.subText}>
            📍 {user?.location || 'Thanjavur'}, {user?.district || 'Tamil Nadu'} • 📞 {user?.phone || '+91 98421 88765'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.switchRoleBtn}
          onPress={() => {
            setUserRole('farmer');
            navigation.navigate('MainTabs');
          }}
        >
          <Text style={styles.switchRoleText}>🌾 Farmer View</Text>
        </TouchableOpacity>
      </View>

      {/* KPI Stats Bar */}
      <View style={styles.kpiContainer}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiVal}>{fleet.length}</Text>
          <Text style={styles.kpiLabel}>Fleet Machines</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiVal}>{bookings.filter((b) => b.status === 'pending').length}</Text>
          <Text style={styles.kpiLabel}>Pending Requests</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiVal}>
            {bookings.filter((b) => ['confirmed', 'on_the_way', 'in_progress'].includes(b.status)).length}
          </Text>
          <Text style={styles.kpiLabel}>Active Jobs</Text>
        </View>
      </View>

      {/* Main Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'bookings' && styles.tabBtnActive]}
          onPress={() => setActiveTab('bookings')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'bookings' && styles.tabBtnTextActive]}>
            📋 {isTa ? 'வாடகை முன்பதிவுகள்' : 'Bookings'} ({bookings.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'fleet' && styles.tabBtnActive]}
          onPress={() => setActiveTab('fleet')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'fleet' && styles.tabBtnTextActive]}>
            🚜 {isTa ? 'என் இயந்திரங்கள்' : 'Equipment Fleet'} ({fleet.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'profile' && styles.tabBtnActive]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'profile' && styles.tabBtnTextActive]}>
            ⚙️ {isTa ? 'விவரக்குறிப்பு' : 'Account'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#15803d" />
          <Text style={{ marginTop: 10, color: '#64748b', fontSize: 13 }}>Loading equipment records...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.contentScroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* TAB 1: BOOKINGS */}
          {activeTab === 'bookings' && (
            <View>
              {/* Sub-filter chips */}
              <View style={styles.subFilterRow}>
                {(['active', 'pending', 'completed', 'all'] as const).map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[styles.chip, bookingFilter === filter && styles.chipActive]}
                    onPress={() => setBookingFilter(filter)}
                  >
                    <Text style={[styles.chipText, bookingFilter === filter && styles.chipTextActive]}>
                      {filter.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {filteredBookings.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyEmoji}>📋</Text>
                  <Text style={styles.emptyText}>No bookings matching the "{bookingFilter}" filter.</Text>
                </View>
              ) : (
                filteredBookings.map((b) => (
                  <View key={b.id} style={styles.bookingCard}>
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.farmerName}>{b.farmer_name || 'Local Farmer'}</Text>
                        <Text style={styles.machineDetail}>
                          🚜 {b.machine_name} • {b.hours_booked} hours
                        </Text>
                        <Text style={styles.dateSub}>📅 Date: {b.booking_date}</Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          b.status === 'pending'
                            ? styles.badgePending
                            : b.status === 'on_the_way'
                            ? styles.badgeOnTheWay
                            : b.status === 'in_progress'
                            ? styles.badgeInProgress
                            : b.status === 'completed'
                            ? styles.badgeCompleted
                            : styles.badgeConfirmed
                        ]}
                      >
                        <Text style={styles.statusBadgeText}>
                          {b.status.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailsBox}>
                      <Text style={styles.detailText}>📍 Location: {b.delivery_address || 'Farm Field'}</Text>
                      <Text style={styles.detailText}>
                        💰 Total Fee: <Text style={{ fontWeight: '800', color: '#0f172a' }}>₹{b.total_amount}</Text>
                      </Text>
                      {Boolean(b.farmer_phone) && (
                        <TouchableOpacity
                          style={styles.callRow}
                          onPress={() => Linking.openURL(`tel:${b.farmer_phone}`)}
                        >
                          <Text style={styles.callRowText}>📞 Call Farmer: {b.farmer_phone}</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Status State-Machine Action Controls */}
                    <View style={styles.actionRow}>
                      {b.status === 'pending' && (
                        <>
                          <TouchableOpacity
                            style={styles.btnPrimary}
                            onPress={() => handleUpdateStatus(b.id, 'confirmed')}
                          >
                            <Text style={styles.btnPrimaryText}>✓ Accept Booking</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.btnDanger}
                            onPress={() => handleUpdateStatus(b.id, 'cancelled')}
                          >
                            <Text style={styles.btnDangerText}>✕ Decline</Text>
                          </TouchableOpacity>
                        </>
                      )}

                      {b.status === 'confirmed' && (
                        <TouchableOpacity
                          style={styles.btnTransit}
                          onPress={() => handleUpdateStatus(b.id, 'on_the_way')}
                        >
                          <Text style={styles.btnTransitText}>🚀 Start Dispatch (On the Way)</Text>
                        </TouchableOpacity>
                      )}

                      {b.status === 'on_the_way' && (
                        <>
                          <TouchableOpacity
                            style={styles.btnPrimary}
                            onPress={() => handleUpdateStatus(b.id, 'in_progress')}
                          >
                            <Text style={styles.btnPrimaryText}>🚜 Arrived & Start Work</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.btnSecondary}
                            onPress={() => navigation.navigate('MachineryTracking', { booking: b })}
                          >
                            <Text style={styles.btnSecondaryText}>📍 View Route Map</Text>
                          </TouchableOpacity>
                        </>
                      )}

                      {b.status === 'in_progress' && (
                        <TouchableOpacity
                          style={styles.btnSuccess}
                          onPress={() => handleUpdateStatus(b.id, 'completed')}
                        >
                          <Text style={styles.btnSuccessText}>🏁 Job Completed & Collect Payment</Text>
                        </TouchableOpacity>
                      )}

                      {b.status === 'completed' && (
                        <View style={styles.completedNotice}>
                          <Text style={styles.completedNoticeText}>✓ Payment settled • Service completed</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* TAB 2: FLEET */}
          {activeTab === 'fleet' && (
            <View>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionHeading}>Your Machinery Fleet</Text>
                  <Text style={styles.sectionSub}>Manage operational status and hourly hire rates</Text>
                </View>
              </View>

              {fleet.map((m) => (
                <View key={m.id} style={styles.fleetCard}>
                  <View style={styles.fleetTopRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fleetName}>{m.name}</Text>
                      <Text style={styles.fleetSub}>
                        {m.type} • 📍 {m.location}
                      </Text>
                    </View>
                    <View style={styles.rateBadge}>
                      <Text style={styles.rateVal}>₹{m.price_per_hour}</Text>
                      <Text style={styles.rateUnit}>/hr</Text>
                    </View>
                  </View>

                  <Text style={styles.fleetDesc}>{m.description}</Text>

                  <View style={styles.fleetBottomRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.availLabel}>
                        Status: <Text style={{ fontWeight: '800', color: m.available ? '#15803d' : '#dc2626' }}>
                          {m.available ? 'Ready for Hiring' : 'Unavailable'}
                        </Text>
                      </Text>
                    </View>

                    <Switch
                      value={m.available}
                      onValueChange={() => handleToggleAvailability(m)}
                      trackColor={{ false: '#cbd5e1', true: '#86efac' }}
                      thumbColor={m.available ? '#15803d' : '#94a3b8'}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* TAB 3: ACCOUNT & OTHER SERVICES */}
          {activeTab === 'profile' && (
            <View>
              <View style={styles.profileSection}>
                <Text style={styles.sectionHeading}>Provider Operations Profile</Text>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Hub Name:</Text>
                  <Text style={styles.profileValue}>{user?.name} Fleet Services</Text>
                </View>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Registered Phone:</Text>
                  <Text style={styles.profileValue}>{user?.phone || 'Not provided'}</Text>
                </View>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Base Location:</Text>
                  <Text style={styles.profileValue}>{user?.location || 'Thanjavur'}, {user?.district}</Text>
                </View>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Total Machines:</Text>
                  <Text style={styles.profileValue}>{fleet.length} registered</Text>
                </View>
              </View>

              <View style={styles.servicesGrid}>
                <Text style={styles.sectionHeading}>AgriME Core Services</Text>
                <View style={styles.gridRow}>
                  <TouchableOpacity
                    style={styles.gridTile}
                    onPress={() => navigation.navigate('CropPrices')}
                  >
                    <Text style={styles.gridEmoji}>📊</Text>
                    <Text style={styles.gridTitle}>Mandi Prices</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.gridTile}
                    onPress={() => navigation.navigate('Predictions')}
                  >
                    <Text style={styles.gridEmoji}>📈</Text>
                    <Text style={styles.gridTitle}>Forecasts</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.gridTile}
                    onPress={() => navigation.navigate('Dealers')}
                  >
                    <Text style={styles.gridEmoji}>🏪</Text>
                    <Text style={styles.gridTitle}>Dealers</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.gridTile}
                    onPress={() => navigation.navigate('Schemes')}
                  >
                    <Text style={styles.gridEmoji}>🏛️</Text>
                    <Text style={styles.gridTitle}>Schemes</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={() => {
                  Alert.alert('Sign Out', 'Sign out of Machinery Provider Portal?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Sign Out', style: 'destructive', onPress: signOut }
                  ]);
                }}
              >
                <Text style={styles.logoutText}>🚪 Sign Out</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  providerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a'
  },
  subText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  proBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#b45309'
  },
  switchRoleBtn: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  switchRoleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d'
  },
  kpiContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0'
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center'
  },
  kpiVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a'
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 2
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0'
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderColor: 'transparent'
  },
  tabBtnActive: {
    borderColor: '#15803d'
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b'
  },
  tabBtnTextActive: {
    color: '#15803d'
  },
  contentScroll: {
    padding: 16,
    paddingBottom: 40
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  subFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9'
  },
  chipActive: {
    backgroundColor: '#0f172a'
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b'
  },
  chipTextActive: {
    color: '#ffffff'
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 8
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center'
  },
  bookingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  farmerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a'
  },
  machineDetail: {
    fontSize: 12,
    color: '#15803d',
    fontWeight: '700',
    marginTop: 2
  },
  dateSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  badgePending: {
    backgroundColor: '#fef3c7'
  },
  badgeConfirmed: {
    backgroundColor: '#dbeafe'
  },
  badgeOnTheWay: {
    backgroundColor: '#e0e7ff'
  },
  badgeInProgress: {
    backgroundColor: '#fef08a'
  },
  badgeCompleted: {
    backgroundColor: '#dcfce7'
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0f172a'
  },
  detailsBox: {
    marginTop: 10,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8
  },
  detailText: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 2
  },
  callRow: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderColor: '#e2e8f0'
  },
  callRowText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1d4ed8'
  },
  actionRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center'
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: '#15803d',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center'
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12
  },
  btnTransit: {
    flex: 1,
    backgroundColor: '#4338ca',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center'
  },
  btnTransitText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12
  },
  btnSuccess: {
    flex: 1,
    backgroundColor: '#16a34a',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center'
  },
  btnSuccessText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12
  },
  btnSecondary: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center'
  },
  btnSecondaryText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 11
  },
  btnDanger: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fee2e2'
  },
  btnDangerText: {
    color: '#dc2626',
    fontWeight: '800',
    fontSize: 12
  },
  completedNotice: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 6
  },
  completedNoticeText: {
    color: '#15803d',
    fontWeight: '700',
    fontSize: 11
  },
  sectionHeaderRow: {
    marginBottom: 12
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a'
  },
  sectionSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1
  },
  fleetCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  fleetTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  fleetName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a'
  },
  fleetSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  rateBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  rateVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#b45309'
  },
  rateUnit: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b45309'
  },
  fleetDesc: {
    fontSize: 12,
    color: '#475569',
    marginTop: 8
  },
  fleetBottomRow: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  availLabel: {
    fontSize: 12,
    color: '#334155'
  },
  profileSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9'
  },
  profileLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600'
  },
  profileValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a'
  },
  servicesGrid: {
    marginBottom: 20
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10
  },
  gridTile: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  gridEmoji: {
    fontSize: 24,
    marginBottom: 4
  },
  gridTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a'
  },
  logoutBtn: {
    backgroundColor: '#fee2e2',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fca5a5'
  },
  logoutText: {
    color: '#b91c1c',
    fontWeight: '800',
    fontSize: 13
  }
});
