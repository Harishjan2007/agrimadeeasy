import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  MobileDataService,
  MobileMachinery,
  MobileBooking
} from '../services/dataService';

export default function MachineryScreen({ navigation }: any) {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'fleet' | 'bookings'>('fleet');
  const [machines, setMachines] = useState<MobileMachinery[]>([]);
  const [bookings, setBookings] = useState<MobileBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  const types = ['All', 'Tractor', 'Harvester', 'Power Tiller'];

  const loadData = async () => {
    try {
      const [macList, bookList] = await Promise.all([
        MobileDataService.getMachinery(),
        MobileDataService.getMyBookings(user?.id)
      ]);
      setMachines(macList);
      setBookings(bookList);
    } catch (e) {
      console.warn('Failed to load machinery data:', e);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filteredMachines = machines.filter((m) => {
    const matchesSearch =
      (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.location || '').toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'All' || m.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Switcher: Fleet vs My Bookings */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'fleet' && styles.tabBtnActive]}
          onPress={() => setActiveTab('fleet')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'fleet' && styles.tabBtnTextActive]}>
            🚜 {t('machinery')} ({machines.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'bookings' && styles.tabBtnActive]}
          onPress={() => {
            setActiveTab('bookings');
            MobileDataService.getMyBookings(user?.id).then(setBookings);
          }}
        >
          <Text style={[styles.tabBtnText, activeTab === 'bookings' && styles.tabBtnTextActive]}>
            📋 {t('myBookings')} ({bookings.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'fleet' ? (
        <>
          {/* Top Search & Filter Bar */}
          <View style={styles.topSection}>
            <TextInput
              style={styles.searchInput}
              placeholder={t('searchMachinery')}
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#94a3b8"
            />

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={types}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.typeTab, typeFilter === item && styles.typeTabActive]}
                  onPress={() => setTypeFilter(item)}
                >
                  <Text
                    style={[
                      styles.typeTabText,
                      typeFilter === item && styles.typeTabTextActive
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>

          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#15803d" />
            </View>
          ) : (
            <FlatList
              data={filteredMachines}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyEmoji}>🚜</Text>
                  <Text style={styles.emptyText}>No machinery available matching filter.</Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.machineName}>{item.name}</Text>
                      <Text style={styles.locationText}>📍 {item.location}</Text>
                      {Boolean(item.provider_name) && (
                        <Text style={styles.providerSub}>Provider: {item.provider_name}</Text>
                      )}
                    </View>
                    <View
                      style={[
                        styles.availBadge,
                        item.is_available ? styles.availYes : styles.availNo
                      ]}
                    >
                      <Text
                        style={[
                          styles.availBadgeText,
                          item.is_available ? styles.availYesText : styles.availNoText
                        ]}
                      >
                        {item.is_available ? t('available') : t('unavailable')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.rateRow}>
                    <View>
                      <Text style={styles.rateLabel}>Hourly Rate</Text>
                      <Text style={styles.rateVal}>₹{item.price_per_hour}{t('hourlyRate')}</Text>
                    </View>
                    <View>
                      <Text style={styles.rateLabel}>Daily Shift</Text>
                      <Text style={styles.rateVal}>₹{item.price_per_day}{t('dailyRate')}</Text>
                    </View>
                    <View>
                      <Text style={styles.rateLabel}>Rating</Text>
                      <Text style={styles.rateVal}>⭐ {item.rating}</Text>
                    </View>
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={[
                        styles.bookBtn,
                        !item.is_available && styles.bookBtnDisabled
                      ]}
                      disabled={!item.is_available}
                      onPress={() => navigation.navigate('MachineryBooking', { machine: item })}
                    >
                      <Text style={styles.bookBtnText}>{t('bookNow')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </>
      ) : (
        /* My Bookings Tab */
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyText}>{t('noBookings')}</Text>
              <TouchableOpacity style={styles.browseFleetBtn} onPress={() => setActiveTab('fleet')}>
                <Text style={styles.browseFleetBtnText}>Browse Machinery Fleet</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.machineName}>{item.machinery_name}</Text>
                  <Text style={styles.locationText}>📍 {item.destination_address}</Text>
                  <Text style={styles.bookingDateSub}>
                    📅 {item.booking_date} at {item.start_time}
                  </Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.rateRow}>
                <View>
                  <Text style={styles.rateLabel}>{t('totalAmount')}</Text>
                  <Text style={styles.rateVal}>₹{item.total_amount.toLocaleString('en-IN')}</Text>
                </View>
                <View>
                  <Text style={styles.rateLabel}>Operator Contact</Text>
                  <Text style={styles.operatorContact}>{item.provider_phone}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.trackBtn}
                onPress={() => navigation.navigate('MachineryTracking', { booking: item })}
              >
                <Text style={styles.trackBtnText}>🗺️ {t('trackTrip')}</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0'
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  tabBtnActive: {
    borderBottomColor: '#15803d'
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b'
  },
  tabBtnTextActive: {
    color: '#15803d'
  },
  topSection: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0'
  },
  searchInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 12
  },
  typeTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8
  },
  typeTabActive: {
    backgroundColor: '#0f172a'
  },
  typeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b'
  },
  typeTabTextActive: {
    color: '#ffffff'
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  machineName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a'
  },
  locationText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4
  },
  providerSub: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '600',
    marginTop: 2
  },
  bookingDateSub: {
    fontSize: 12,
    color: '#0284c7',
    fontWeight: '700',
    marginTop: 4
  },
  availBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  availYes: {
    backgroundColor: '#ecfdf5'
  },
  availNo: {
    backgroundColor: '#fee2e2'
  },
  availBadgeText: {
    fontSize: 10,
    fontWeight: '800'
  },
  availYesText: {
    color: '#047857'
  },
  availNoText: {
    color: '#b91c1c'
  },
  statusBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe'
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1d4ed8'
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginVertical: 12
  },
  rateLabel: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: '700'
  },
  rateVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2
  },
  operatorContact: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2
  },
  cardActions: {
    marginTop: 2
  },
  bookBtn: {
    backgroundColor: '#15803d',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  bookBtnDisabled: {
    backgroundColor: '#cbd5e1'
  },
  bookBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800'
  },
  trackBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8
  },
  trackBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800'
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600'
  },
  browseFleetBtn: {
    backgroundColor: '#15803d',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 14
  },
  browseFleetBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13
  }
});
