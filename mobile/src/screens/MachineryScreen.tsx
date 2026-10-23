import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Modal,
  Alert,
  Platform
} from 'react-native';
import * as Location from 'expo-location';
import {
  Search,
  MapPin,
  Navigation,
  Compass,
  X,
  SlidersHorizontal,
  ChevronDown,
  Clock,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  MobileDataService,
  MobileMachinery,
  MobileBooking
} from '../services/dataService';
import {
  DEMO_MACHINERY_FLEET,
  MachineryDriver,
  MACHINERY_TYPES
} from '../lib/machineryData';
import {
  calculateDistanceKm,
  formatDistance,
  calculateMachineryETA,
  TAMIL_NADU_DISTRICTS
} from '../lib/location';

interface EnrichedMachinery extends MobileMachinery {
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  etaString?: string;
  isDemo?: boolean;
}

export default function MachineryScreen({ navigation }: any) {
  const { t, language } = useLanguage();
  const isTa = language === 'ta';
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'fleet' | 'bookings'>('fleet');
  const [machines, setMachines] = useState<EnrichedMachinery[]>([]);
  const [bookings, setBookings] = useState<MobileBooking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filters State
  const [search, setSearch] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('All Types');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All Districts');
  const [selectedRadius, setSelectedRadius] = useState<number | 'all'>(100);

  // GPS Location State
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'gps' | 'denied' | 'manual'>('idle');
  const [locationNotice, setLocationNotice] = useState<string>('');

  // Modals
  const [districtModalVisible, setDistrictModalVisible] = useState<boolean>(false);
  const [districtSearch, setDistrictSearch] = useState<string>('');
  const [demoDriverModal, setDemoDriverModal] = useState<EnrichedMachinery | null>(null);
  const [bookingModal, setBookingModal] = useState<EnrichedMachinery | null>(null);

  // Booking Form State
  const [bookingDate, setBookingDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [bookingStartTime, setBookingStartTime] = useState<string>('08:00 AM');
  const [bookingHours, setBookingHours] = useState<number>(4);
  const [bookingAddress, setBookingAddress] = useState<string>(user?.address || 'Sample Farm Field');
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [submittingBooking, setSubmittingBooking] = useState<boolean>(false);

  // Request GPS
  const requestGps = async () => {
    try {
      setLocationStatus('locating');
      setLocationNotice(isTa ? 'இருப்பிடத்தைத் தேடுகிறது...' : 'Acquiring GPS position...');

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('denied');
        setLocationNotice(
          isTa
            ? 'ஜிபிஎஸ் அனுமதி மறுக்கப்பட்டது. மாவட்டத்தை தேர்வு செய்யவும்.'
            : 'GPS permission denied. Select your district below.'
        );
        setUserCoords(null);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserCoords({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      });
      setLocationStatus('gps');
      setLocationNotice(
        isTa
          ? '📍 ஜிபிஎஸ் செயலில்: அருகிலுள்ள இயந்திரங்கள் முதலில்'
          : '📍 GPS Active: Nearby machinery ranked nearest first'
      );
    } catch (e: any) {
      setLocationStatus('denied');
      setLocationNotice(
        isTa
          ? 'ஜிபிஎஸ் பெற இயலவில்லை. மாவட்டத்தைத் தேர்வு செய்யவும்.'
          : 'Unable to get GPS. Please choose district manually.'
      );
    }
  };

  const clearLocation = () => {
    setUserCoords(null);
    setLocationStatus('idle');
    setLocationNotice('');
    setSelectedDistrict('All Districts');
  };

  // Load unified machinery data
  const loadData = useCallback(async () => {
    try {
      const [dbList, userBookings] = await Promise.all([
        MobileDataService.getMachinery(),
        MobileDataService.getMyBookings(user?.id)
      ]);

      setBookings(userBookings);

      // Merge DB list with all 10 demo machinery entries from DEMO_MACHINERY_FLEET
      const seenIds = new Set<string>();
      const unified: EnrichedMachinery[] = [];

      // Add DB records first
      for (const m of dbList) {
        if (!seenIds.has(m.id)) {
          seenIds.add(m.id);
          // Try to match coordinates from DEMO_MACHINERY_FLEET if demo record
          const demoMatch = DEMO_MACHINERY_FLEET.find(
            (d) => d.id === m.id || d.name.toLowerCase() === m.name.toLowerCase()
          );

          const isDemo = Boolean(
            demoMatch ||
            m.id.startsWith('demo-') ||
            m.name.includes('[Demo') ||
            m.name.includes('(Demo')
          );

          unified.push({
            ...m,
            latitude: demoMatch?.latitude,
            longitude: demoMatch?.longitude,
            driver_name: m.driver_name || demoMatch?.driver_name,
            service_type: m.service_type || demoMatch?.service_type,
            experience_years: m.experience_years || demoMatch?.experience_years,
            description: m.description || demoMatch?.description,
            isDemo
          });
        }
      }

      // Add any missing baseline demo machinery
      for (const d of DEMO_MACHINERY_FLEET) {
        if (!seenIds.has(d.id)) {
          seenIds.add(d.id);
          unified.push({
            id: d.id,
            provider_id: d.provider_id,
            name: d.name,
            type: d.type,
            service_type: d.service_type,
            driver_name: d.driver_name,
            experience_years: d.experience_years,
            description: d.description,
            price_per_hour: d.price_per_hour,
            price_per_day: d.price_per_hour * 8,
            location: d.location,
            district: d.district,
            latitude: d.latitude,
            longitude: d.longitude,
            is_available: d.available,
            contact_phone: d.contact_phone,
            rating: d.rating,
            image_url: d.image_url,
            provider_name: d.provider_name,
            isDemo: true
          });
        }
      }

      setMachines(unified);
    } catch (e) {
      console.warn('Failed to load machinery data:', e);
    }
  }, [user?.id]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Filter and sort machinery with distance and ETA calculation
  const enrichedFiltered = useMemo(() => {
    const q = search.toLowerCase().trim();

    const items = machines.map((m) => {
      let distanceKm: number | undefined = undefined;
      let etaString: string | undefined = undefined;

      if (userCoords && m.latitude != null && m.longitude != null) {
        const d = calculateDistanceKm(
          userCoords.latitude,
          userCoords.longitude,
          m.latitude,
          m.longitude
        );
        if (d !== null) {
          distanceKm = d;
          etaString = calculateMachineryETA(d);
        }
      }

      return {
        ...m,
        distanceKm,
        etaString
      };
    });

    let filtered = items.filter((m) => {
      // Type Filter
      if (selectedType !== 'All Types' && selectedType !== 'All') {
        if (selectedType === 'Other') {
          if (m.type === 'Tractor' || m.type === 'Paddy Harvester' || m.type === 'Power Tiller') {
            return false;
          }
        } else if (m.type !== selectedType) {
          return false;
        }
      }

      // District Filter
      if (selectedDistrict !== 'All Districts') {
        const dLower = selectedDistrict.toLowerCase();
        const matchesLoc = (m.location || '').toLowerCase().includes(dLower);
        const matchesDist = (m.district || '').toLowerCase().includes(dLower);
        if (!matchesLoc && !matchesDist) return false;
      }

      // Radius Filter
      if (selectedRadius !== 'all' && userCoords) {
        if (m.distanceKm !== undefined && m.distanceKm > selectedRadius) {
          return false;
        }
      }

      // Keyword Search
      if (q) {
        const matchesName = (m.name || '').toLowerCase().includes(q);
        const matchesLoc = (m.location || '').toLowerCase().includes(q);
        const matchesDesc = (m.description || '').toLowerCase().includes(q);
        const matchesDriver = (m.driver_name || '').toLowerCase().includes(q);
        const matchesService = (m.service_type || '').toLowerCase().includes(q);
        if (!matchesName && !matchesLoc && !matchesDesc && !matchesDriver && !matchesService) {
          return false;
        }
      }

      return true;
    });

    // Proximity ranking nearest first
    if (userCoords) {
      filtered.sort((a, b) => {
        const distA = a.distanceKm !== undefined ? a.distanceKm : 999999;
        const distB = b.distanceKm !== undefined ? b.distanceKm : 999999;
        return distA - distB;
      });
    }

    return filtered;
  }, [machines, search, selectedType, selectedDistrict, selectedRadius, userCoords]);

  // Handle Booking Submit
  const handleConfirmBooking = async () => {
    if (!bookingModal) return;

    try {
      setSubmittingBooking(true);
      const totalCost = (bookingModal.price_per_hour || 750) * bookingHours;

      const res = await MobileDataService.createMachineryBooking({
        farmerId: user?.id || null,
        farmerName: user?.name || 'Local Farmer',
        farmerPhone: user?.phone || '+91 98432 12345',
        machineryId: bookingModal.id,
        machineryName: bookingModal.name,
        bookingDate,
        startTime: bookingStartTime,
        totalAmount: totalCost,
        destinationAddress: bookingAddress,
        providerPhone: bookingModal.contact_phone || '+91 90000 00001',
        notes: bookingNotes
      });

      if (res.data) {
        Alert.alert(
          isTa ? 'முன்பதிவு உறுதி செய்யப்பட்டது!' : 'Booking Confirmed!',
          isTa
            ? `${bookingModal.name} முன்பதிவு செய்யப்பட்டது. விவரங்களை 'எனது முன்பதிவுகள்' பகுதியில் கண்காணிக்கலாம்.`
            : `Booking confirmed for ${bookingModal.name}. You can track machine transit in My Bookings.`,
          [
            {
              text: 'OK',
              onPress: () => {
                setBookingModal(null);
                setActiveTab('bookings');
                loadData();
              }
            }
          ]
        );
      }
    } catch (e: any) {
      Alert.alert('Booking Notice', e?.message || 'Could not save booking');
    } finally {
      setSubmittingBooking(false);
    }
  };

  const filteredDistricts = TAMIL_NADU_DISTRICTS.filter((d) =>
    d.name.toLowerCase().includes(districtSearch.toLowerCase().trim())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Tab Bar: Fleet vs My Bookings */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'fleet' && styles.tabBtnActive]}
          onPress={() => setActiveTab('fleet')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'fleet' && styles.tabBtnTextActive]}>
            🚜 {isTa ? 'இயந்திரங்கள்' : 'Machinery Fleet'} ({enrichedFiltered.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'bookings' && styles.tabBtnActive]}
          onPress={() => setActiveTab('bookings')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'bookings' && styles.tabBtnTextActive]}>
            📋 {isTa ? 'எனது முன்பதிவுகள்' : 'My Bookings'} ({bookings.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'fleet' ? (
        <>
          {/* Top Filter Container */}
          <View style={styles.topFilterContainer}>
            {/* Search Input */}
            <View style={styles.searchRow}>
              <Search size={16} color="#64748B" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder={
                  isTa
                    ? 'இயந்திரம், சேவை அல்லது ஓட்டுநரைத் தேடுக...'
                    : 'Search machine, service, driver, or location...'
                }
                value={search}
                onChangeText={setSearch}
                placeholderTextColor="#94A3B8"
                clearButtonMode="while-editing"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')} style={{ padding: 4 }}>
                  <X size={15} color="#64748B" />
                </TouchableOpacity>
              )}
            </View>

            {/* GPS and District Bar */}
            <View style={styles.locationRow}>
              <TouchableOpacity
                style={[styles.gpsBtn, userCoords ? styles.gpsBtnActive : null]}
                onPress={userCoords ? clearLocation : requestGps}
              >
                {locationStatus === 'locating' ? (
                  <ActivityIndicator size="small" color="#059669" />
                ) : (
                  <Navigation size={14} color={userCoords ? '#FFFFFF' : '#059669'} />
                )}
                <Text style={[styles.gpsBtnText, userCoords ? styles.gpsBtnTextActive : null]}>
                  {userCoords
                    ? (isTa ? 'ஜிபிஎஸ் செயலில்' : 'Nearby (GPS)')
                    : (isTa ? 'அருகிலுள்ளவை' : 'Nearby GPS')}
                </Text>
                {userCoords && <X size={13} color="#FFFFFF" style={{ marginLeft: 2 }} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.districtSelector}
                onPress={() => {
                  setDistrictSearch('');
                  setDistrictModalVisible(true);
                }}
              >
                <MapPin size={14} color="#059669" />
                <Text style={styles.districtSelectorText} numberOfLines={1}>
                  {selectedDistrict}
                </Text>
                <ChevronDown size={14} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Location Notice Banner */}
            {locationNotice.length > 0 && (
              <View
                style={[
                  styles.noticeBanner,
                  locationStatus === 'denied' ? styles.noticeBannerWarn : styles.noticeBannerSuccess
                ]}
              >
                <Text
                  style={[
                    styles.noticeBannerText,
                    locationStatus === 'denied' ? styles.noticeBannerTextWarn : styles.noticeBannerTextSuccess
                  ]}
                >
                  {locationNotice}
                </Text>
              </View>
            )}

            {/* Machine Types Horizontal Scroll */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 8 }}
              contentContainerStyle={{ gap: 6, paddingRight: 8 }}
            >
              {MACHINERY_TYPES.map((tItem) => {
                const isSelected = selectedType === tItem;
                return (
                  <TouchableOpacity
                    key={tItem}
                    style={[styles.typeChip, isSelected ? styles.typeChipSelected : null]}
                    onPress={() => setSelectedType(tItem)}
                  >
                    <Text style={[styles.typeChipText, isSelected ? styles.typeChipTextSelected : null]}>
                      {tItem}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Radius Filter Pills (when location active) */}
            {userCoords && (
              <View style={styles.radiusRow}>
                <Text style={styles.radiusLabel}>{isTa ? 'ஆரம்' : 'Radius'}:</Text>
                {[25, 50, 100, 'all'].map((rad) => {
                  const isSelected = selectedRadius === rad;
                  return (
                    <TouchableOpacity
                      key={String(rad)}
                      style={[styles.radiusPill, isSelected ? styles.radiusPillSelected : null]}
                      onPress={() => setSelectedRadius(rad as any)}
                    >
                      <Text style={[styles.radiusPillText, isSelected ? styles.radiusPillTextSelected : null]}>
                        {rad === 'all' ? (isTa ? 'அனைத்தும்' : 'All') : `${rad} km`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Machinery Fleet List */}
          {loading && !refreshing ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#059669" />
              <Text style={styles.loadingText}>
                {isTa ? 'இயந்திரங்கள் ஏற்றப்படுகின்றன...' : 'Loading machinery fleet...'}
              </Text>
            </View>
          ) : enrichedFiltered.length === 0 ? (
            <View style={styles.centerContainer}>
              <Compass size={44} color="#94A3B8" />
              <Text style={styles.emptyTitle}>
                {isTa ? 'இயந்திரங்கள் கிடைக்கவில்லை' : 'No Machinery Found'}
              </Text>
              <Text style={styles.emptySub}>
                {isTa
                  ? 'தேர்ந்தெடுக்கப்பட்ட ஆரம் அல்லது மாவட்டத்தில் இயந்திரங்கள் இல்லை. ஆரத்தை அதிகரிக்கவும்.'
                  : 'No machinery found for the selected criteria. Try increasing the search radius.'}
              </Text>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => {
                  setSelectedType('All Types');
                  setSelectedDistrict('All Districts');
                  setSelectedRadius('all');
                  setSearch('');
                  clearLocation();
                }}
              >
                <Text style={styles.resetBtnText}>{isTa ? 'வடிகட்டிகளை மீட்டமை' : 'Reset Filters'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={enrichedFiltered}
              keyExtractor={(item) => item.id}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const hasDist = item.distanceKm !== undefined;

                return (
                  <View style={styles.card}>
                    {/* Header with Type & Distance */}
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{item.name}</Text>
                        <Text style={styles.cardServiceType}>
                          {item.service_type || item.type}
                        </Text>
                      </View>

                      {hasDist && (
                        <View style={styles.distanceBadge}>
                          <Text style={styles.distanceBadgeText}>
                            📍 {formatDistance(item.distanceKm!)}
                          </Text>
                          {item.etaString && (
                            <Text style={styles.etaText}>⏱ {item.etaString}</Text>
                          )}
                        </View>
                      )}
                    </View>

                    {/* Operator & Experience Badge */}
                    <View style={styles.operatorRow}>
                      <Text style={styles.operatorText}>
                        👤 {item.driver_name || item.provider_name || 'Verified Operator'}
                        {item.experience_years ? ` • ${item.experience_years} yrs exp` : ''}
                      </Text>
                      {item.isDemo && (
                        <View style={styles.demoBadge}>
                          <Text style={styles.demoBadgeText}>Demo Profile</Text>
                        </View>
                      )}
                    </View>

                    {/* Description */}
                    {item.description ? (
                      <Text style={styles.descText} numberOfLines={2}>
                        {item.description}
                      </Text>
                    ) : null}

                    {/* Location & Pricing */}
                    <View style={styles.cardFooter}>
                      <View style={styles.locationCol}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} color="#64748B" />
                          <Text style={styles.locText} numberOfLines={1}>{item.location}</Text>
                        </View>
                      </View>

                      <View style={styles.priceCol}>
                        <Text style={styles.priceText}>
                          ₹{item.price_per_hour}/hr
                        </Text>
                        <Text style={styles.dayPriceText}>
                          ₹{item.price_per_day || item.price_per_hour * 8}/day
                        </Text>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.cardActions}>
                      {item.isDemo ? (
                        <TouchableOpacity
                          style={styles.demoDetailsBtn}
                          onPress={() => setDemoDriverModal(item)}
                        >
                          <Text style={styles.demoDetailsBtnText}>
                            {isTa ? 'மாதிரி விவரங்கள் காண்க' : 'View Demo Profile Details'}
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.bookBtn}
                          onPress={() => setBookingModal(item)}
                        >
                          <Text style={styles.bookBtnText}>
                            {isTa ? 'இப்போதே முன்பதிவு செய்க' : 'Book Machinery'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              }}
            />
          )}
        </>
      ) : (
        /* My Bookings Tab */
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Calendar size={48} color="#94A3B8" />
              <Text style={styles.emptyTitle}>
                {isTa ? 'முன்பதிவுகள் எதுவும் இல்லை' : 'No Machinery Bookings Yet'}
              </Text>
              <Text style={styles.emptySub}>
                {isTa
                  ? 'இயந்திரங்கள் பட்டியலிலிருந்து நீங்கள் தேவைப்படும் இயந்திரத்தை முன்பதிவு செய்யலாம்.'
                  : 'You have not placed any machinery bookings yet. Browse the fleet to book equipment.'}
              </Text>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => setActiveTab('fleet')}
              >
                <Text style={styles.resetBtnText}>{isTa ? 'இயந்திரங்களைத் தேடுக' : 'Browse Fleet'}</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.bookingCard}>
              <View style={styles.bookingHeader}>
                <Text style={styles.bookingTitle}>{item.machinery_name}</Text>
                <View
                  style={[
                    styles.statusPill,
                    item.status === 'confirmed' ? styles.statusConfirmed : styles.statusPending
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      item.status === 'confirmed' ? styles.statusConfirmedText : styles.statusPendingText
                    ]}
                  >
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.bookingDetailRow}>
                <Text style={styles.bookingDetailLabel}>{isTa ? 'தேதி' : 'Date'}:</Text>
                <Text style={styles.bookingDetailVal}>{item.booking_date} ({item.start_time})</Text>
              </View>

              <View style={styles.bookingDetailRow}>
                <Text style={styles.bookingDetailLabel}>{isTa ? 'தொகை' : 'Total Amount'}:</Text>
                <Text style={[styles.bookingDetailVal, { color: '#059669', fontWeight: '800' }]}>
                  ₹{Number(item.total_amount).toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.bookingDetailRow}>
                <Text style={styles.bookingDetailLabel}>{isTa ? 'இடம்' : 'Destination'}:</Text>
                <Text style={styles.bookingDetailVal} numberOfLines={1}>{item.destination_address}</Text>
              </View>

              <View style={styles.bookingActions}>
                <TouchableOpacity
                  style={styles.trackBtn}
                  onPress={() => navigation.navigate('MachineryTracking', { bookingId: item.id })}
                >
                  <Navigation size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.trackBtnText}>{isTa ? 'நேரலை ஜிபிஎஸ் கண்காணிப்பு' : 'Live GPS Tracking'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Demo Driver Profile Modal */}
      <Modal
        visible={demoDriverModal !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDemoDriverModal(null)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            {demoDriverModal && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>{demoDriverModal.name}</Text>
                    <Text style={styles.modalSub}>{demoDriverModal.location}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setDemoDriverModal(null)}>
                    <X size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Demonstration Notice */}
                <View style={styles.demoNoticeBox}>
                  <AlertCircle size={18} color="#D97706" />
                  <Text style={styles.demoNoticeBoxText}>
                    {isTa
                      ? 'இது ஒரு மாதிரி ஓட்டுநர் விவரக்குறிப்பு. வேளாண் இயந்திர சேவைகளை விளக்க மாதிரி தரவாக காட்டப்படுகிறது.'
                      : 'This is a verified demonstration driver profile. Real enrolled machinery providers can be booked directly for farm field operations.'}
                  </Text>
                </View>

                {/* Specifications Grid */}
                <View style={styles.specGrid}>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>{isTa ? 'ஓட்டுநர்' : 'Operator'}</Text>
                    <Text style={styles.specVal}>{demoDriverModal.driver_name}</Text>
                  </View>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>{isTa ? 'அனுபவம்' : 'Experience'}</Text>
                    <Text style={styles.specVal}>{demoDriverModal.experience_years} years</Text>
                  </View>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>{isTa ? 'சேவை' : 'Service Type'}</Text>
                    <Text style={styles.specVal}>{demoDriverModal.service_type}</Text>
                  </View>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>{isTa ? 'கட்டணம்' : 'Hourly Rate'}</Text>
                    <Text style={[styles.specVal, { color: '#059669', fontWeight: '800' }]}>
                      ₹{demoDriverModal.price_per_hour}/hr
                    </Text>
                  </View>
                </View>

                <View style={{ marginTop: 12 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 4 }}>
                    {isTa ? 'இயக்க விபரம்' : 'Operational Scope'}:
                  </Text>
                  <Text style={{ fontSize: 12, color: '#475569', lineHeight: 18 }}>
                    {demoDriverModal.description}
                  </Text>
                </View>

                {demoDriverModal.distanceKm !== undefined && (
                  <View style={styles.distanceModalRow}>
                    <Text style={{ fontSize: 12, color: '#64748B' }}>{isTa ? 'உங்கள் இருப்பிடத்திலிருந்து' : 'Distance from you'}:</Text>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#059669' }}>
                      📍 {formatDistance(demoDriverModal.distanceKm)} (~{demoDriverModal.etaString})
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setDemoDriverModal(null)}
                >
                  <Text style={styles.modalCloseBtnText}>{isTa ? 'சரி' : 'Understood'}</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Booking Form Modal */}
      <Modal
        visible={bookingModal !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setBookingModal(null)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            {bookingModal && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>{isTa ? 'இயந்திர முன்பதிவு' : 'Book Machinery'}</Text>
                    <Text style={styles.modalSub}>{bookingModal.name}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setBookingModal(null)}>
                    <X size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Form Fields */}
                <View style={{ gap: 10, marginVertical: 10 }}>
                  <View>
                    <Text style={styles.inputLabel}>{isTa ? 'முன்பதிவு தேதி' : 'Booking Date (YYYY-MM-DD)'}</Text>
                    <TextInput
                      style={styles.formInput}
                      value={bookingDate}
                      onChangeText={setBookingDate}
                      placeholder="2026-08-25"
                    />
                  </View>

                  <View>
                    <Text style={styles.inputLabel}>{isTa ? 'தொடக்க நேரம்' : 'Start Time'}</Text>
                    <TextInput
                      style={styles.formInput}
                      value={bookingStartTime}
                      onChangeText={setBookingStartTime}
                      placeholder="08:00 AM"
                    />
                  </View>

                  <View>
                    <Text style={styles.inputLabel}>{isTa ? 'தேவைப்படும் மணிநேரம்' : 'Duration (Hours)'}</Text>
                    <TextInput
                      style={styles.formInput}
                      value={String(bookingHours)}
                      onChangeText={(v) => setBookingHours(Math.max(1, parseInt(v, 10) || 1))}
                      keyboardType="number-pad"
                    />
                  </View>

                  <View>
                    <Text style={styles.inputLabel}>{isTa ? 'வயல் முகவரி' : 'Field Destination Address'}</Text>
                    <TextInput
                      style={styles.formInput}
                      value={bookingAddress}
                      onChangeText={setBookingAddress}
                      placeholder="Enter field location or village"
                    />
                  </View>

                  {/* Price Estimate */}
                  <View style={styles.estimateBox}>
                    <Text style={styles.estimateLabel}>{isTa ? 'மதிப்பிடப்பட்ட மொத்த கட்டணம்' : 'Estimated Total'}:</Text>
                    <Text style={styles.estimateVal}>
                      ₹{(bookingModal.price_per_hour * bookingHours).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.submitBookingBtn, submittingBooking && { opacity: 0.6 }]}
                  onPress={handleConfirmBooking}
                  disabled={submittingBooking}
                >
                  {submittingBooking ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBookingBtnText}>
                      {isTa ? 'முன்பதிவை உறுதி செய்' : 'Confirm Machinery Booking'}
                    </Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* District Picker Modal */}
      <Modal
        visible={districtModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDistrictModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isTa ? 'மாவட்டத்தைத் தேர்ந்தெடு' : 'Select District'}</Text>
              <TouchableOpacity onPress={() => setDistrictModalVisible(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchRow}>
              <Search size={16} color="#64748B" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search district name..."
                value={districtSearch}
                onChangeText={setDistrictSearch}
                placeholderTextColor="#94A3B8"
              />
            </View>

            <FlatList
              data={[{ id: 'all', name: 'All Districts', latitude: 11.1271, longitude: 78.6569 }, ...filteredDistricts]}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = selectedDistrict === item.name;
                return (
                  <TouchableOpacity
                    style={[styles.districtItem, isSelected && styles.districtItemSelected]}
                    onPress={() => {
                      setSelectedDistrict(item.name);
                      if (item.name !== 'All Districts') {
                        setUserCoords({ latitude: item.latitude, longitude: item.longitude });
                        setLocationStatus('manual');
                        setLocationNotice(`📍 Location set to ${item.name} centroid`);
                      }
                      setDistrictModalVisible(false);
                    }}
                  >
                    <Text style={[styles.districtItemText, isSelected && styles.districtItemTextSelected]}>
                      {item.name}
                    </Text>
                    {isSelected && <Text style={{ color: '#059669', fontWeight: 'bold' }}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingTop: 6
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  tabBtnActive: {
    borderBottomColor: '#059669'
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B'
  },
  tabBtnTextActive: {
    color: '#059669',
    fontWeight: '800'
  },
  topFilterContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    height: 34,
    borderRadius: 8,
    gap: 4
  },
  gpsBtnActive: {
    backgroundColor: '#059669',
    borderColor: '#059669'
  },
  gpsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46'
  },
  gpsBtnTextActive: {
    color: '#FFFFFF'
  },
  districtSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 34,
    gap: 6
  },
  districtSelectorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B'
  },
  noticeBanner: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  noticeBannerSuccess: {
    backgroundColor: '#ECFDF5'
  },
  noticeBannerWarn: {
    backgroundColor: '#FEF3C7'
  },
  noticeBannerText: {
    fontSize: 11,
    fontWeight: '600'
  },
  noticeBannerTextSuccess: {
    color: '#065F46'
  },
  noticeBannerTextWarn: {
    color: '#92400E'
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  typeChipSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669'
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569'
  },
  typeChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  radiusLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B'
  },
  radiusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#F1F5F9'
  },
  radiusPillSelected: {
    backgroundColor: '#0F172A'
  },
  radiusPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569'
  },
  radiusPillTextSelected: {
    color: '#FFFFFF'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B'
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B'
  },
  emptySub: {
    marginTop: 6,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center'
  },
  resetBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  listContent: {
    padding: 12,
    paddingBottom: 24
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 20
  },
  cardServiceType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    marginTop: 2
  },
  distanceBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'flex-end'
  },
  distanceBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857'
  },
  etaText: {
    fontSize: 10,
    color: '#065F46',
    marginTop: 1
  },
  operatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 4
  },
  operatorText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600'
  },
  demoBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  demoBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309'
  },
  descText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginVertical: 4
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  locationCol: {
    flex: 1
  },
  locText: {
    fontSize: 12,
    color: '#64748B'
  },
  priceCol: {
    alignItems: 'flex-end'
  },
  priceText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A'
  },
  dayPriceText: {
    fontSize: 10,
    color: '#64748B'
  },
  cardActions: {
    marginTop: 10
  },
  demoDetailsBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center'
  },
  demoDetailsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155'
  },
  bookBtn: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center'
  },
  bookBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  bookingTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  statusConfirmed: {
    backgroundColor: '#ECFDF5'
  },
  statusPending: {
    backgroundColor: '#FEF3C7'
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800'
  },
  statusConfirmedText: {
    color: '#059669'
  },
  statusPendingText: {
    color: '#D97706'
  },
  bookingDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3
  },
  bookingDetailLabel: {
    fontSize: 12,
    color: '#64748B'
  },
  bookingDetailVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    maxWidth: '65%',
    textAlign: 'right'
  },
  bookingActions: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    borderRadius: 8,
    paddingVertical: 8
  },
  trackBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A'
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  demoNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12
  },
  demoNoticeBoxText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 6
  },
  specBox: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#EDF2F7'
  },
  specLabel: {
    fontSize: 11,
    color: '#64748B'
  },
  specVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2
  },
  distanceModalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 8,
    marginTop: 12
  },
  modalCloseBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8
  },
  modalCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  modalSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 36,
    marginBottom: 10,
    gap: 6
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0
  },
  districtItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  districtItemSelected: {
    backgroundColor: '#ECFDF5'
  },
  districtItemText: {
    fontSize: 13,
    color: '#334155'
  },
  districtItemTextSelected: {
    fontWeight: '700',
    color: '#059669'
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4
  },
  formInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    fontSize: 13,
    color: '#0F172A'
  },
  estimateBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 10,
    borderRadius: 8,
    marginTop: 6
  },
  estimateLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D'
  },
  estimateVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#15803D'
  },
  submitBookingBtn: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8
  },
  submitBookingBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  }
});
