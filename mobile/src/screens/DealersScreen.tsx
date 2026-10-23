import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Linking,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Modal,
  Alert
} from 'react-native';
import * as Location from 'expo-location';
import {
  Search,
  MapPin,
  Navigation,
  Phone,
  Clock,
  Building2,
  Store,
  ChevronDown,
  X,
  Compass,
  CheckCircle2,
  ShieldCheck,
  AlertCircle
} from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';
import {
  DealerProfile,
  DEMO_DEALER_PROFILES,
  BUYER_TYPES
} from '../lib/dealersData';
import {
  calculateDistanceKm,
  formatDistance,
  TAMIL_NADU_DISTRICTS
} from '../lib/location';
import { supabase } from '../lib/supabase';

interface EnrichedDealer extends DealerProfile {
  distanceKm?: number;
}

export default function DealersScreen() {
  const { t, language } = useLanguage();
  const isTa = language === 'ta';

  const [dealers, setDealers] = useState<EnrichedDealer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filters State
  const [search, setSearch] = useState<string>('');
  const [selectedBuyerType, setSelectedBuyerType] = useState<string>('All Buyer Types');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All Districts');
  const [selectedRadius, setSelectedRadius] = useState<number | 'all'>(100);

  // GPS Location State
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'gps' | 'denied' | 'manual'>('idle');
  const [locationNotice, setLocationNotice] = useState<string>('');

  // Modals
  const [districtModalVisible, setDistrictModalVisible] = useState<boolean>(false);
  const [districtSearch, setDistrictSearch] = useState<string>('');
  const [selectedDealerForModal, setSelectedDealerForModal] = useState<EnrichedDealer | null>(null);

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
            : 'GPS permission denied. Select district below.'
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
          ? '📍 ஜிபிஎஸ் செயலில்: அருகிலுள்ள வியாபாரிகள் முதலில்'
          : '📍 GPS Active: Nearby produce buyers ranked nearest first'
      );
    } catch (e) {
      setLocationStatus('denied');
      setLocationNotice(
        isTa
          ? 'ஜிபிஎஸ் பெற இயலவில்லை. மாவட்டத்தை தேர்வு செய்யவும்.'
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

  // Load Data
  const loadData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('dealers')
        .select('*')
        .limit(50);

      const dbList: EnrichedDealer[] = [];
      const seenIds = new Set<string>();

      if (!error && data && data.length > 0) {
        data.forEach((d: any) => {
          const rawAddress = d.address || '';
          const derivedDistrict =
            d.district || (rawAddress.includes(',') ? rawAddress.split(',').pop()?.trim() : 'Tamil Nadu');

          const isDemo = Boolean(d.isDemo || d.id.startsWith('demo-') || d.id.startsWith('u-demo'));

          seenIds.add(d.id);
          dbList.push({
            id: d.id,
            profile_id: d.profile_id || d.id,
            shop_name: d.shop_name || 'Agri Produce Dealer',
            owner_name: d.owner_name || 'Dealer Principal',
            address: rawAddress,
            phone: d.phone || '+91 94431 88200',
            opening_hours: d.opening_hours || 'Mon - Sat: 7:30 AM - 7:30 PM',
            latitude: d.latitude || 11.1271,
            longitude: d.longitude || 78.6569,
            district: derivedDistrict || 'Tamil Nadu',
            isDemo,
            buyer_type: d.buyer_type || 'Wholesale Mandi Merchant',
            purchase_conditions: d.purchase_conditions || 'Standard market conditions apply.',
            verified: d.verified ?? !isDemo,
            crops_handled:
              Array.isArray(d.crops_handled) && d.crops_handled.length > 0
                ? d.crops_handled
                : ['Paddy', 'Pulses', 'Seeds']
          });
        });
      }

      // Merge to guarantee all 10 demo dealer profiles are present
      for (const demo of DEMO_DEALER_PROFILES) {
        if (!seenIds.has(demo.id)) {
          seenIds.add(demo.id);
          dbList.push(demo);
        }
      }

      setDealers(dbList);
    } catch (e) {
      console.warn('Failed to load dealers from database, using verified demo baseline:', e);
      setDealers(DEMO_DEALER_PROFILES);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Filter and sort dealers with distance
  const filteredDealers = useMemo(() => {
    const q = search.toLowerCase().trim();

    // 1. Calculate distance for each dealer if userCoords exist
    const items = dealers.map((d) => {
      let distanceKm: number | undefined = undefined;
      if (userCoords && d.latitude != null && d.longitude != null) {
        const dist = calculateDistanceKm(
          userCoords.latitude,
          userCoords.longitude,
          d.latitude,
          d.longitude
        );
        if (dist !== null) distanceKm = dist;
      }
      return {
        ...d,
        distanceKm
      };
    });

    // 2. Filter
    let filtered = items.filter((d) => {
      // Buyer Type Filter
      if (selectedBuyerType !== 'All Buyer Types' && selectedBuyerType !== 'all') {
        if (d.buyer_type !== selectedBuyerType) return false;
      }

      // District Filter
      if (selectedDistrict !== 'All Districts') {
        const dLower = selectedDistrict.toLowerCase();
        const matchesLoc = (d.address || '').toLowerCase().includes(dLower);
        const matchesDist = (d.district || '').toLowerCase().includes(dLower);
        if (!matchesLoc && !matchesDist) return false;
      }

      // Radius Filter
      if (selectedRadius !== 'all' && userCoords) {
        if (d.distanceKm !== undefined && d.distanceKm > selectedRadius) {
          return false;
        }
      }

      // Search Term
      if (q) {
        const matchesName = (d.shop_name || '').toLowerCase().includes(q);
        const matchesAddress = (d.address || '').toLowerCase().includes(q);
        const matchesOwner = (d.owner_name || '').toLowerCase().includes(q);
        const matchesType = (d.buyer_type || '').toLowerCase().includes(q);
        const matchesCrops = (d.crops_handled || []).some((c) => c.toLowerCase().includes(q));

        if (!matchesName && !matchesAddress && !matchesOwner && !matchesType && !matchesCrops) {
          return false;
        }
      }

      return true;
    });

    // 3. Proximity Sort (nearest first if coordinates active)
    if (userCoords) {
      filtered.sort((a, b) => {
        const distA = a.distanceKm !== undefined ? a.distanceKm : 999999;
        const distB = b.distanceKm !== undefined ? b.distanceKm : 999999;
        return distA - distB;
      });
    }

    return filtered;
  }, [dealers, search, selectedBuyerType, selectedDistrict, selectedRadius, userCoords]);

  const handleCallDealer = (phone: string, isDemo: boolean) => {
    if (isDemo) {
      Alert.alert(
        isTa ? 'மாதிரி வியாபாரி அறிவிப்பு' : 'Demo Profile Notice',
        isTa
          ? 'இது ஒரு மாதிரி கொள்முதல் வியாபாரி விவரக்குறிப்பு. நேரடி அழைப்பு தேவையில்லை.'
          : 'This is an illustrative demonstration dealer profile. Enrolled real traders can be dialed directly.'
      );
      return;
    }

    const clean = phone.replace(/[^0-9+]/g, '');
    if (clean) {
      Linking.openURL(`tel:${clean}`).catch(() => {
        Alert.alert('Call Notice', `Could not place call to ${phone}`);
      });
    }
  };

  const filteredDistricts = TAMIL_NADU_DISTRICTS.filter((d) =>
    d.name.toLowerCase().includes(districtSearch.toLowerCase().trim())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Filter Header */}
      <View style={styles.topFilterContainer}>
        {/* Search Bar */}
        <View style={styles.searchRow}>
          <Search size={16} color="#64748B" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              isTa
                ? 'வியாபாரி, கொள்முதல் பயிர் அல்லது இடத்தை தேடுக...'
                : 'Search dealer, crop bought, buyer type, or city...'
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

        {/* Location & District Row */}
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

        {/* Buyer Types Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 8 }}
          contentContainerStyle={{ gap: 6, paddingRight: 8 }}
        >
          {BUYER_TYPES.map((bt) => {
            const isSelected = selectedBuyerType === bt;
            return (
              <TouchableOpacity
                key={bt}
                style={[styles.typeChip, isSelected ? styles.typeChipSelected : null]}
                onPress={() => setSelectedBuyerType(bt)}
              >
                <Text style={[styles.typeChipText, isSelected ? styles.typeChipTextSelected : null]}>
                  {bt === 'All Buyer Types' ? (isTa ? 'அனைத்து வியாபாரிகள்' : 'All Buyer Types') : bt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Radius Filter Pills */}
        {userCoords && (
          <View style={styles.radiusRow}>
            <Text style={styles.radiusLabel}>{isTa ? 'ஆரம்' : 'Radius'}:</Text>
            {[50, 100, 200, 'all'].map((rad) => {
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

      {/* Main Dealer List */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>
            {isTa ? 'வியாபாரிகள் பட்டியல் ஏற்றப்படுகிறது...' : 'Loading registered produce buyers...'}
          </Text>
        </View>
      ) : filteredDealers.length === 0 ? (
        <View style={styles.centerContainer}>
          <Compass size={44} color="#94A3B8" />
          <Text style={styles.emptyTitle}>
            {isTa ? 'வியாபாரிகள் கிடைக்கவில்லை' : 'No Produce Buyers Found'}
          </Text>
          <Text style={styles.emptySub}>
            {isTa
              ? 'தேர்ந்தெடுக்கப்பட்ட வடிகட்டி அமைப்புகளில் எந்த வியாபாரிகளும் கிடைக்கவில்லை.'
              : 'No dealers match your current search and radius criteria.'}
          </Text>
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() => {
              setSelectedBuyerType('All Buyer Types');
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
          data={filteredDealers}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const hasDist = item.distanceKm !== undefined;

            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => setSelectedDealerForModal(item)}
              >
                {/* Header: Shop Name & Distance */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.cardTitle}>{item.shop_name}</Text>
                    <View style={styles.buyerTypeBadge}>
                      <Text style={styles.buyerTypeBadgeText} numberOfLines={1}>
                        {item.buyer_type}
                      </Text>
                    </View>
                  </View>

                  {hasDist && (
                    <View style={styles.distanceBadge}>
                      <Text style={styles.distanceBadgeText}>
                        📍 {formatDistance(item.distanceKm!)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Address & District */}
                <View style={styles.addressRow}>
                  <MapPin size={12} color="#059669" style={{ marginTop: 2 }} />
                  <Text style={styles.addressText} numberOfLines={2}>
                    {item.address}
                  </Text>
                </View>

                {/* Crops Handled Tags */}
                {item.crops_handled && item.crops_handled.length > 0 && (
                  <View style={styles.cropsRow}>
                    <Text style={styles.cropsLabel}>{isTa ? 'வாங்கும் பயிர்கள்' : 'Buys'}:</Text>
                    <View style={styles.cropsTagContainer}>
                      {item.crops_handled.slice(0, 4).map((crop, idx) => (
                        <View key={idx} style={styles.cropTag}>
                          <Text style={styles.cropTagText}>{crop}</Text>
                        </View>
                      ))}
                      {item.crops_handled.length > 4 && (
                        <Text style={styles.moreCropsText}>+{item.crops_handled.length - 4}</Text>
                      )}
                    </View>
                  </View>
                )}

                {/* Footer: Opening Hours & Contact Action */}
                <View style={styles.cardFooter}>
                  <View style={styles.hoursBox}>
                    <Clock size={12} color="#64748B" />
                    <Text style={styles.hoursText} numberOfLines={1}>{item.opening_hours}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.callBtn}
                    onPress={() => handleCallDealer(item.phone, item.isDemo)}
                  >
                    <Phone size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.callBtnText}>{isTa ? 'தொடர்பு' : 'Contact'}</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Dealer Detail & Purchase Terms Modal */}
      <Modal
        visible={selectedDealerForModal !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedDealerForModal(null)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '82%' }]}>
            {selectedDealerForModal && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>{selectedDealerForModal.shop_name}</Text>
                    <Text style={styles.modalSub}>{selectedDealerForModal.buyer_type}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedDealerForModal(null)}>
                    <X size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Demo Notice if applicable */}
                {selectedDealerForModal.isDemo && (
                  <View style={styles.demoNoticeBox}>
                    <AlertCircle size={16} color="#D97706" />
                    <Text style={styles.demoNoticeBoxText}>
                      {isTa
                        ? 'இது ஒரு மாதிரி கொள்முதல் வியாபாரி விவரக்குறிப்பு. சந்தை விலை மற்றும் கொள்முதல் விதிமுறைகளை விளக்க மாதிரி தரவாக காட்டப்படுகிறது.'
                        : 'Demonstration produce buyer profile illustrating commercial procurement conditions and terms across Tamil Nadu APMC hubs.'}
                    </Text>
                  </View>
                )}

                {/* Key Details Grid */}
                <View style={styles.detailGrid}>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>{isTa ? 'உரிமையாளர்' : 'Proprietor'}</Text>
                    <Text style={styles.detailVal}>{selectedDealerForModal.owner_name}</Text>
                  </View>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>{isTa ? 'மாவட்டம்' : 'District'}</Text>
                    <Text style={styles.detailVal}>{selectedDealerForModal.district}</Text>
                  </View>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>{isTa ? 'நேரம்' : 'Timings'}</Text>
                    <Text style={styles.detailVal}>{selectedDealerForModal.opening_hours}</Text>
                  </View>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>{isTa ? 'தொலைவு' : 'Proximity'}</Text>
                    <Text style={[styles.detailVal, { color: '#059669', fontWeight: '800' }]}>
                      {selectedDealerForModal.distanceKm !== undefined
                        ? `📍 ${formatDistance(selectedDealerForModal.distanceKm)}`
                        : 'Tamil Nadu Hub'}
                    </Text>
                  </View>
                </View>

                {/* Address */}
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionLabel}>{isTa ? 'முகவரி' : 'Address'}:</Text>
                  <Text style={styles.sectionValue}>{selectedDealerForModal.address}</Text>
                </View>

                {/* Purchase Conditions */}
                {selectedDealerForModal.purchase_conditions && (
                  <View style={[styles.sectionBlock, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                    <Text style={[styles.sectionLabel, { color: '#15803D' }]}>
                      {isTa ? 'கொள்முதல் விதிமுறைகள் & நிபந்தனைகள்' : 'Purchase Terms & Grading Conditions'}:
                    </Text>
                    <Text style={[styles.sectionValue, { color: '#14532D', marginTop: 2 }]}>
                      {selectedDealerForModal.purchase_conditions}
                    </Text>
                  </View>
                )}

                {/* Crops Handled */}
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionLabel}>{isTa ? 'கொள்முதல் செய்யப்படும் பயிர்கள்' : 'Commodities Procured'}:</Text>
                  <View style={styles.modalCropsWrap}>
                    {selectedDealerForModal.crops_handled.map((c, idx) => (
                      <View key={idx} style={styles.modalCropBadge}>
                        <Text style={styles.modalCropBadgeText}>{c}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Call Button */}
                <TouchableOpacity
                  style={styles.modalCallBtn}
                  onPress={() => handleCallDealer(selectedDealerForModal.phone, selectedDealerForModal.isDemo)}
                >
                  <Phone size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.modalCallBtnText}>
                    {selectedDealerForModal.isDemo ? 'Demo Contact Profile' : `Call ${selectedDealerForModal.phone}`}
                  </Text>
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
  buyerTypeBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
    alignSelf: 'flex-start'
  },
  buyerTypeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569'
  },
  distanceBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  distanceBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857'
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginVertical: 4
  },
  addressText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
    lineHeight: 16
  },
  cropsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 6
  },
  cropsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669'
  },
  cropsTagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    flex: 1
  },
  cropTag: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1
  },
  cropTagText: {
    fontSize: 10,
    color: '#15803D',
    fontWeight: '600'
  },
  moreCropsText: {
    fontSize: 10,
    color: '#64748B',
    alignSelf: 'center'
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
  hoursBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1
  },
  hoursText: {
    fontSize: 11,
    color: '#64748B'
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  callBtnText: {
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
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 6
  },
  detailBox: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#EDF2F7'
  },
  detailLabel: {
    fontSize: 11,
    color: '#64748B'
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2
  },
  sectionBlock: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155'
  },
  sectionValue: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
    marginTop: 2
  },
  modalCropsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6
  },
  modalCropBadge: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  modalCropBadgeText: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '600'
  },
  modalCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 14,
    marginBottom: 8
  },
  modalCallBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
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
  }
});
