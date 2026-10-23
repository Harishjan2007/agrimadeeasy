import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Platform
} from 'react-native';
import * as Location from 'expo-location';
import {
  Search,
  MapPin,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ChevronDown,
  Navigation,
  Compass,
  X,
  Building2,
  Calendar
} from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';
import {
  MarketPriceRecord,
  MarketPricesApiResponse,
  fetchMarketPrices
} from '../services/marketPricesService';
import {
  ALL_TAMIL_NADU_DISTRICT_NAMES,
  formatProximityLabel
} from '../lib/mandiLocations';

const POPULAR_COMMODITIES = [
  'All Commodities',
  'Paddy(Dhan)(Common)',
  'Paddy(Dhan)(Basmati)',
  'Groundnut',
  'Tomato',
  'Onion',
  'Cotton',
  'Maize',
  'Turmeric',
  'Banana',
  'Coconut',
  'Brinjal',
  'Wheat'
];

function CropPricesScreenContent() {
  const { t, language } = useLanguage();
  const isTa = language === 'ta';

  // Search & Filter State
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All Districts');
  const [selectedCommodity, setSelectedCommodity] = useState<string>('All Commodities');
  const [mandiSearch, setMandiSearch] = useState<string>('');
  const [keywordSearch, setKeywordSearch] = useState<string>('');

  // GPS Location State
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'gps' | 'denied' | 'error'>('idle');
  const [locationMessage, setLocationMessage] = useState<string>('');

  // Pagination & Results State
  const PAGE_SIZE = 20;
  const [page, setPage] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [records, setRecords] = useState<MarketPriceRecord[]>([]);
  const [isProximitySorted, setIsProximitySorted] = useState<boolean>(false);
  const [apiSource, setApiSource] = useState<string>('');

  // Status State
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [errorTitle, setErrorTitle] = useState<string | null>(null);
  const [errorResolution, setErrorResolution] = useState<string | null>(null);

  // Modals
  const [selectedItem, setSelectedItem] = useState<MarketPriceRecord | null>(null);
  const [districtModalVisible, setDistrictModalVisible] = useState<boolean>(false);
  const [districtSearch, setDistrictSearch] = useState<string>('');

  // Request GPS Location
  const requestGpsLocation = async () => {
    try {
      setLocationStatus('locating');
      setLocationMessage(isTa ? 'இருப்பிடத்தைத் தேடுகிறது...' : 'Acquiring GPS position...');

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('denied');
        setLocationMessage(
          isTa
            ? 'இருப்பிட அனுமதி மறுக்கப்பட்டது. மாவட்ட வடிகட்டியைப் பயன்படுத்தலாம்.'
            : 'Location permission denied. You can select your district below.'
        );
        setUserCoords(null);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      setUserCoords({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      });
      setLocationStatus('gps');
      setLocationMessage(
        isTa
          ? '📍 ஜிபிஎஸ் இயக்கப்பட்டது: அருகிலுள்ள மண்டிகள் முதலில்'
          : '📍 GPS Active: Nearby mandis ranked first'
      );
    } catch (err: any) {
      console.warn('GPS location request error:', err);
      setLocationStatus('error');
      setLocationMessage(
        isTa
          ? 'ஜிபிஎஸ் பெற இயலவில்லை. மாவட்டத்தை தேர்வு செய்யவும்.'
          : 'Unable to acquire GPS. Please pick a district manually.'
      );
      setUserCoords(null);
    }
  };

  const clearGps = () => {
    setUserCoords(null);
    setLocationStatus('idle');
    setLocationMessage('');
  };

  // Load Data
  const loadData = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);
    setErrorTitle(null);
    setErrorResolution(null);

    const offset = (targetPage - 1) * PAGE_SIZE;

    try {
      const res: MarketPricesApiResponse = await fetchMarketPrices({
        state: 'Tamil Nadu',
        district: selectedDistrict !== 'All Districts' ? selectedDistrict : undefined,
        commodity: selectedCommodity !== 'All Commodities' ? selectedCommodity : undefined,
        market: mandiSearch.trim() || undefined,
        q: keywordSearch.trim() || undefined,
        limit: PAGE_SIZE,
        offset,
        lat: userCoords?.latitude,
        lon: userCoords?.longitude
      });

      if (!res.success && res.errorMessage) {
        setError(res.errorMessage);
        setErrorTitle(res.errorTitle || 'API Service Notice');
        setErrorResolution(res.errorResolution || 'Please verify network connection and try again.');
        setRecords([]);
        setTotalRecords(0);
        setTotalPages(1);
      } else {
        setRecords(res.records || []);
        const total = res.total || res.records?.length || 0;
        setTotalRecords(total);
        setTotalPages(Math.max(1, Math.ceil(total / PAGE_SIZE)));
        setPage(targetPage);
        setIsProximitySorted(!!res.isProximitySorted);
        setApiSource(res.source || 'Agmarknet APMC Mandi Data');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load mandi crop prices.');
      setErrorTitle('Connection Error');
      setErrorResolution('Unable to reach the price service. Tap Retry to reload.');
    } finally {
      setLoading(false);
    }
  }, [selectedDistrict, selectedCommodity, mandiSearch, keywordSearch, userCoords]);

  // Reload on filters change, reset to page 1
  useEffect(() => {
    loadData(1);
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(page);
    setRefreshing(false);
  };

  const handlePrevPage = () => {
    if (page > 1) {
      loadData(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      loadData(page + 1);
    }
  };

  const filteredDistricts = (ALL_TAMIL_NADU_DISTRICT_NAMES || []).filter((d) =>
    (d || '').toLowerCase().includes(districtSearch.toLowerCase().trim())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Search & Filter Bar */}
      <View style={styles.topContainer}>
        {/* Keyword Search */}
        <View style={styles.searchRow}>
          <Search size={18} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={isTa ? 'பயிர் பெயர் அல்லது ரகம் தேடுக...' : 'Search crop or variety...'}
            value={keywordSearch}
            onChangeText={setKeywordSearch}
            placeholderTextColor="#94A3B8"
            clearButtonMode="while-editing"
          />
          {keywordSearch.length > 0 && (
            <TouchableOpacity onPress={() => setKeywordSearch('')} style={styles.clearBtn}>
              <X size={16} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>

        {/* Mandi Yard Search */}
        <View style={[styles.searchRow, { marginTop: 8 }]}>
          <Building2 size={18} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={isTa ? 'மண்டி சந்தை தேடுக (எ.கா: Vellore, Salem)...' : 'Search mandi yard (e.g. Vellore, Salem)...'}
            value={mandiSearch}
            onChangeText={setMandiSearch}
            placeholderTextColor="#94A3B8"
            clearButtonMode="while-editing"
          />
          {mandiSearch.length > 0 && (
            <TouchableOpacity onPress={() => setMandiSearch('')} style={styles.clearBtn}>
              <X size={16} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>

        {/* GPS and District Selector Bar */}
        <View style={styles.locationControlsRow}>
          {/* GPS Button */}
          <TouchableOpacity
            style={[
              styles.gpsButton,
              userCoords ? styles.gpsButtonActive : null
            ]}
            onPress={userCoords ? clearGps : requestGpsLocation}
          >
            {locationStatus === 'locating' ? (
              <ActivityIndicator size="small" color="#059669" />
            ) : (
              <Navigation
                size={16}
                color={userCoords ? '#FFFFFF' : '#059669'}
              />
            )}
            <Text
              style={[
                styles.gpsButtonText,
                userCoords ? styles.gpsButtonTextActive : null
              ]}
            >
              {userCoords
                ? (isTa ? 'ஜிபிஎஸ் செயலில்' : 'Nearby (GPS)')
                : (isTa ? 'அருகிலுள்ள மண்டி' : 'Nearby Mandis')}
            </Text>
            {userCoords && <X size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />}
          </TouchableOpacity>

          {/* District Selector Pill */}
          <TouchableOpacity
            style={styles.districtSelector}
            onPress={() => {
              setDistrictSearch('');
              setDistrictModalVisible(true);
            }}
          >
            <MapPin size={15} color="#059669" />
            <Text style={styles.districtSelectorText} numberOfLines={1}>
              {selectedDistrict}
            </Text>
            <ChevronDown size={14} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Status Notification if GPS denied or active */}
        {locationMessage.length > 0 && (
          <View
            style={[
              styles.locationNoticeBanner,
              locationStatus === 'denied' || locationStatus === 'error'
                ? styles.locationNoticeBannerWarning
                : styles.locationNoticeBannerSuccess
            ]}
          >
            <Text
              style={[
                styles.locationNoticeText,
                locationStatus === 'denied' || locationStatus === 'error'
                  ? styles.locationNoticeTextWarning
                  : styles.locationNoticeTextSuccess
              ]}
            >
              {locationMessage}
            </Text>
          </View>
        )}

        {/* Popular Commodity Horizontal Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.commodityScroll}
          contentContainerStyle={styles.commodityScrollContent}
        >
          {POPULAR_COMMODITIES.map((c) => {
            const isSelected = selectedCommodity === c;
            return (
              <TouchableOpacity
                key={c}
                style={[
                  styles.commodityChip,
                  isSelected ? styles.commodityChipSelected : null
                ]}
                onPress={() => setSelectedCommodity(c)}
              >
                <Text
                  style={[
                    styles.commodityChipText,
                    isSelected ? styles.commodityChipTextSelected : null
                  ]}
                >
                  {c === 'All Commodities' ? (isTa ? 'அனைத்து பயிர்கள்' : 'All Crops') : c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>
            {isTa ? 'அக்மார்க்நெட் மண்டி விலைகள் பெறப்படுகின்றன...' : 'Loading official Agmarknet APMC mandi prices...'}
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <AlertCircle size={44} color="#EF4444" />
          <Text style={styles.errorTitleText}>{errorTitle || 'Service Notice'}</Text>
          <Text style={styles.errorMessageText}>{error}</Text>
          {errorResolution && (
            <Text style={styles.errorResolutionText}>{errorResolution}</Text>
          )}
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadData(page)}
          >
            <RefreshCw size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.retryButtonText}>{isTa ? 'மீண்டும் முயற்சி' : 'Retry Query'}</Text>
          </TouchableOpacity>
        </View>
      ) : records.length === 0 ? (
        <View style={styles.centerContainer}>
          <Compass size={48} color="#94A3B8" />
          <Text style={styles.emptyTitleText}>
            {isTa ? 'பொருந்தும் மண்டி விலைகள் இல்லை' : 'No Matching Mandi Records Found'}
          </Text>
          <Text style={styles.emptySubText}>
            {isTa
              ? 'தேர்ந்தெடுக்கப்பட்ட மாவட்டத்திலோ அல்லது பயிரிலோ தற்போதைய வருகை பதிவுகள் இல்லை.'
              : `No market arrivals found for '${selectedDistrict}' with the selected commodity.`}
          </Text>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              setSelectedDistrict('All Districts');
              setSelectedCommodity('All Commodities');
              setKeywordSearch('');
              setMandiSearch('');
              clearGps();
            }}
          >
            <Text style={styles.resetButtonText}>{isTa ? 'வடிகட்டிகளை அழிக்கவும்' : 'Reset All Filters'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.listHeaderRow}>
              <View>
                <Text style={styles.resultsCountText}>
                  {isTa
                    ? `${totalRecords} அக்மார்க்நெட் மண்டி பதிவுகள்`
                    : `Showing ${records.length} of ${totalRecords} Mandi Arrivals`}
                </Text>
                {isProximitySorted && (
                  <Text style={styles.proximityRankBadge}>
                    📍 {isTa ? 'அருகிலுள்ள மண்டி முன்னுரிமை' : 'Ranked Nearest-First via GPS'}
                  </Text>
                )}
              </View>
              <Text style={styles.pageIndicatorText}>
                {isTa ? `பக்கம் ${page} / ${totalPages}` : `Page ${page} of ${totalPages}`}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const hasDistance = item.distanceKm !== null && item.distanceKm !== undefined;
            const distanceLabel = hasDistance ? formatProximityLabel(item.distanceKm, item.isApproximate) : null;

            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => setSelectedItem(item)}
              >
                {/* Mandi & Location Header */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardMarketName} numberOfLines={1}>
                      {item.market}
                    </Text>
                    <View style={styles.districtBadgeRow}>
                      <MapPin size={12} color="#059669" />
                      <Text style={styles.cardDistrictText}>{item.district}, {item.state}</Text>
                    </View>
                  </View>

                  {/* Distance Pill if available */}
                  {distanceLabel && (
                    <View style={styles.distanceBadge}>
                      <Text style={styles.distanceBadgeText}>📍 {distanceLabel}</Text>
                    </View>
                  )}
                </View>

                {/* Crop & Variety Details */}
                <View style={styles.cardBody}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardCommodityName}>{item.commodity}</Text>
                    <Text style={styles.cardVarietyText}>
                      {item.variety || 'Standard Variety'} {item.grade ? `• Grade ${item.grade}` : ''}
                    </Text>
                  </View>

                  {/* Modal Price Highlight */}
                  <View style={styles.priceContainer}>
                    <Text style={styles.modalPriceText}>
                      ₹{Number(item.modal_price || 0).toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.priceUnitText}>{item.unit || '₹/Quintal'}</Text>
                  </View>
                </View>

                {/* Price Range & Arrival Date Footer */}
                <View style={styles.cardFooter}>
                  <View style={styles.priceRangeBox}>
                    <Text style={styles.priceRangeLabel}>{isTa ? 'விலை வரம்பு' : 'Daily Range'}:</Text>
                    <Text style={styles.priceRangeValues}>
                      ₹{Number(item.min_price || 0).toLocaleString('en-IN')} – ₹{Number(item.max_price || 0).toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View style={styles.dateBox}>
                    <Calendar size={12} color="#64748B" />
                    <Text style={styles.dateText}>{item.arrival_date}</Text>
                  </View>
                </View>

                {/* Historical Trajectory Hint */}
                {item.historical_prices && item.historical_prices.length > 0 && (
                  <View style={styles.historyHintRow}>
                    <TrendingUp size={13} color="#0284C7" />
                    <Text style={styles.historyHintText}>
                      {isTa ? '30 நாள் விலை வரலாற்றுப் போக்கு காண்க' : 'Tap to view 30-day APMC price trajectory'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            <View style={styles.paginationRow}>
              <TouchableOpacity
                style={[styles.pageButton, page <= 1 ? styles.pageButtonDisabled : null]}
                onPress={handlePrevPage}
                disabled={page <= 1}
              >
                <ChevronLeft size={16} color={page <= 1 ? '#94A3B8' : '#059669'} />
                <Text style={[styles.pageButtonText, page <= 1 ? styles.pageButtonTextDisabled : null]}>
                  {isTa ? 'முந்தையது' : 'Previous'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.pageNumberDisplay}>
                {page} / {totalPages}
              </Text>

              <TouchableOpacity
                style={[styles.pageButton, page >= totalPages ? styles.pageButtonDisabled : null]}
                onPress={handleNextPage}
                disabled={page >= totalPages}
              >
                <Text style={[styles.pageButtonText, page >= totalPages ? styles.pageButtonTextDisabled : null]}>
                  {isTa ? 'அடுத்தது' : 'Next'}
                </Text>
                <ChevronRight size={16} color={page >= totalPages ? '#94A3B8' : '#059669'} />
              </TouchableOpacity>
            </View>
          }
        />
      )}

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
              <Text style={styles.modalTitle}>
                {isTa ? 'மாவட்டத்தைத் தேர்ந்தெடுக்கவும்' : 'Select Tamil Nadu District'}
              </Text>
              <TouchableOpacity onPress={() => setDistrictModalVisible(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchRow}>
              <Search size={16} color="#64748B" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder={isTa ? 'மாவட்டத்தைத் தேடு...' : 'Search district name...'}
                value={districtSearch}
                onChangeText={setDistrictSearch}
                placeholderTextColor="#94A3B8"
              />
            </View>

            <FlatList
              data={['All Districts', ...filteredDistricts]}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = selectedDistrict === item;
                return (
                  <TouchableOpacity
                    style={[
                      styles.districtListItem,
                      isSelected ? styles.districtListItemSelected : null
                    ]}
                    onPress={() => {
                      setSelectedDistrict(item);
                      setDistrictModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.districtListItemText,
                        isSelected ? styles.districtListItemTextSelected : null
                      ]}
                    >
                      {item}
                    </Text>
                    {isSelected && <Text style={{ color: '#059669', fontWeight: 'bold' }}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Historical Trend & Mandi Details Modal */}
      <Modal
        visible={selectedItem !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedItem(null)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            {selectedItem && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>{selectedItem.commodity}</Text>
                    <Text style={styles.modalSubTitle}>{selectedItem.market}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedItem(null)}>
                    <X size={22} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Primary Stats Grid */}
                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>{isTa ? 'மாதிரி விலை' : 'Modal Price'}</Text>
                    <Text style={styles.statValueHighlight}>
                      ₹{Number(selectedItem.modal_price || 0).toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.statSubText}>{selectedItem.unit || '₹/Quintal'}</Text>
                  </View>

                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>{isTa ? 'விலை வரம்பு' : 'Price Range'}</Text>
                    <Text style={styles.statValue}>
                      ₹{Number(selectedItem.min_price || 0).toLocaleString('en-IN')} – ₹{Number(selectedItem.max_price || 0).toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.statSubText}>{isTa ? 'குறைந்தது - அதிகபட்சம்' : 'Min - Max Range'}</Text>
                  </View>
                </View>

                {/* Information Table */}
                <View style={styles.detailTable}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>{isTa ? 'மாவட்டம்' : 'District'}</Text>
                    <Text style={styles.detailVal}>{selectedItem.district}, {selectedItem.state}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>{isTa ? 'ரகம்' : 'Variety'}</Text>
                    <Text style={styles.detailVal}>{selectedItem.variety || 'Standard'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>{isTa ? 'தரம்' : 'Grade'}</Text>
                    <Text style={styles.detailVal}>{selectedItem.grade || 'FAQ (Fair Average Quality)'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>{isTa ? 'வருகை தேதி' : 'Arrival Date'}</Text>
                    <Text style={styles.detailVal}>{selectedItem.arrival_date}</Text>
                  </View>
                  {selectedItem.distanceKm !== null && selectedItem.distanceKm !== undefined && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailKey}>{isTa ? 'தொலைவு' : 'Proximity'}</Text>
                      <Text style={[styles.detailVal, { color: '#059669', fontWeight: 'bold' }]}>
                        📍 {formatProximityLabel(selectedItem.distanceKm, selectedItem.isApproximate)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>{isTa ? 'மூலம்' : 'Data Source'}</Text>
                    <Text style={styles.detailVal}>{selectedItem.source || 'Agmarknet APMC Mandi Bulletin'}</Text>
                  </View>
                </View>

                {/* 30-Day Historical Price Trajectory */}
                <View style={styles.historySection}>
                  <View style={styles.historyHeaderRow}>
                    <TrendingUp size={16} color="#059669" />
                    <Text style={styles.historySectionTitle}>
                      {isTa ? 'அக்மார்க்நெட் சமீபத்திய விலை போக்கு' : 'Recent Agmarknet APMC Price Trajectory'}
                    </Text>
                  </View>

                  {selectedItem.historical_prices && selectedItem.historical_prices.length > 0 ? (
                    <View style={styles.historyTable}>
                      <View style={styles.historyTableHeader}>
                        <Text style={[styles.historyCol, { flex: 1.2, fontWeight: '700' }]}>Date</Text>
                        <Text style={[styles.historyCol, { flex: 1.5, fontWeight: '700' }]}>Modal Rate</Text>
                        <Text style={[styles.historyCol, { flex: 1.8, fontWeight: '700' }]}>Range (₹)</Text>
                      </View>
                      {selectedItem.historical_prices.map((pt, idx) => (
                        <View key={idx} style={styles.historyTableRow}>
                          <Text style={[styles.historyCol, { flex: 1.2, color: '#334155' }]}>{pt.date}</Text>
                          <Text style={[styles.historyCol, { flex: 1.5, fontWeight: '700', color: '#059669' }]}>
                            ₹{Number(pt.modal_price || 0).toLocaleString('en-IN')}
                          </Text>
                          <Text style={[styles.historyCol, { flex: 1.8, color: '#64748B' }]}>
                            ₹{pt.min_price || 0} - ₹{pt.max_price || 0}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.noHistoryText}>
                      {isTa
                        ? 'இந்த மண்டிக்கு கூடுதல் வரலாற்று அறிக்கைகள் கிடைக்கவில்லை.'
                        : 'Single bulletin arrival recorded for this APMC session.'}
                    </Text>
                  )}
                </View>

                {/* Close Button */}
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setSelectedItem(null)}
                >
                  <Text style={styles.modalCloseButtonText}>{isTa ? 'மூடு' : 'Close'}</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

class CropPricesErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('CropPricesScreen caught runtime error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <AlertCircle size={48} color="#EF4444" />
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 12, textAlign: 'center' }}>
            Crop Prices Screen Notice
          </Text>
          <Text style={{ fontSize: 12, color: '#64748B', marginTop: 6, textAlign: 'center' }}>
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </Text>
          <TouchableOpacity
            style={{ marginTop: 20, backgroundColor: '#059669', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Reload Screen</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

export default function CropPricesScreen() {
  return (
    <CropPricesErrorBoundary>
      <CropPricesScreenContent />
    </CropPricesErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  topContainer: {
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
    height: 40
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0
  },
  clearBtn: {
    padding: 4
  },
  locationControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    gap: 6
  },
  gpsButtonActive: {
    backgroundColor: '#059669',
    borderColor: '#059669'
  },
  gpsButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46'
  },
  gpsButtonTextActive: {
    color: '#FFFFFF'
  },
  districtSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 18,
    paddingHorizontal: 12,
    height: 36,
    gap: 6
  },
  districtSelectorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B'
  },
  locationNoticeBanner: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6
  },
  locationNoticeBannerSuccess: {
    backgroundColor: '#ECFDF5'
  },
  locationNoticeBannerWarning: {
    backgroundColor: '#FEF3C7'
  },
  locationNoticeText: {
    fontSize: 11,
    fontWeight: '600'
  },
  locationNoticeTextSuccess: {
    color: '#065F46'
  },
  locationNoticeTextWarning: {
    color: '#92400E'
  },
  commodityScroll: {
    marginTop: 8
  },
  commodityScrollContent: {
    gap: 6,
    paddingRight: 8
  },
  commodityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  commodityChipSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669'
  },
  commodityChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569'
  },
  commodityChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700'
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
    color: '#64748B',
    textAlign: 'center'
  },
  errorTitleText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B'
  },
  errorMessageText: {
    marginTop: 4,
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center'
  },
  errorResolutionText: {
    marginTop: 6,
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center'
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  emptyTitleText: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B'
  },
  emptySubText: {
    marginTop: 6,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center'
  },
  resetButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  listContent: {
    padding: 12,
    paddingBottom: 28
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4
  },
  resultsCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155'
  },
  proximityRankBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    marginTop: 2
  },
  pageIndicatorText: {
    fontSize: 12,
    color: '#64748B'
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
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
    marginBottom: 10
  },
  cardMarketName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A'
  },
  districtBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2
  },
  cardDistrictText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500'
  },
  distanceBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10
  },
  distanceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857'
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9'
  },
  cardCommodityName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#047857'
  },
  cardVarietyText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  priceContainer: {
    alignItems: 'flex-end'
  },
  modalPriceText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A'
  },
  priceUnitText: {
    fontSize: 11,
    color: '#64748B'
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8
  },
  priceRangeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  priceRangeLabel: {
    fontSize: 11,
    color: '#64748B'
  },
  priceRangeValues: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155'
  },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  dateText: {
    fontSize: 11,
    color: '#64748B'
  },
  historyHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC'
  },
  historyHintText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7'
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 8
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  pageButtonDisabled: {
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC'
  },
  pageButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669'
  },
  pageButtonTextDisabled: {
    color: '#94A3B8'
  },
  pageNumberDisplay: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569'
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
    marginBottom: 12
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A'
  },
  modalSubTitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2
  },
  modalSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 12,
    gap: 8
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0
  },
  districtListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  districtListItemSelected: {
    backgroundColor: '#ECFDF5'
  },
  districtListItemText: {
    fontSize: 14,
    color: '#334155'
  },
  districtListItemTextSelected: {
    fontWeight: '700',
    color: '#059669'
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 12
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B'
  },
  statValueHighlight: {
    fontSize: 22,
    fontWeight: '900',
    color: '#059669',
    marginTop: 2
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4
  },
  statSubText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2
  },
  detailTable: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7'
  },
  detailKey: {
    fontSize: 12,
    color: '#64748B'
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    maxWidth: '65%',
    textAlign: 'right'
  },
  historySection: {
    marginTop: 6,
    marginBottom: 16
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8
  },
  historySectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B'
  },
  historyTable: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  historyTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#EDF2F7',
    paddingVertical: 8,
    paddingHorizontal: 8
  },
  historyTableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0'
  },
  historyCol: {
    fontSize: 11
  },
  noHistoryText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    paddingVertical: 6
  },
  modalCloseButton: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10
  },
  modalCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  }
});
