import React, { useState, useEffect, useMemo } from 'react';
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
import {
  Search,
  ExternalLink,
  ChevronDown,
  Building,
  ShieldCheck,
  FileText,
  Filter,
  X,
  MapPin,
  CheckCircle2
} from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';
import {
  GovernmentScheme,
  VERIFIED_GOVERNMENT_SCHEMES,
  SCHEME_SUPPORT_TYPES,
  TAMIL_NADU_DISTRICTS
} from '../lib/schemesData';
import { supabase } from '../lib/supabase';

const GOV_LEVELS = [
  { id: 'all', labelEn: 'All Schemes (45)', labelTa: 'அனைத்து திட்டங்கள் (45)' },
  { id: 'central', labelEn: 'Central Govt (20)', labelTa: 'மத்திய அரசு (20)' },
  { id: 'state', labelEn: 'Tamil Nadu State (25)', labelTa: 'தமிழக அரசு (25)' }
];

export default function SchemesScreen() {
  const { t, language } = useLanguage();
  const isTa = language === 'ta';

  const [schemes, setSchemes] = useState<GovernmentScheme[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filters State
  const [search, setSearch] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedSupportType, setSelectedSupportType] = useState<string>('All Support Types');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All Districts');

  // Expanded card IDs
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // District Modal
  const [districtModalVisible, setDistrictModalVisible] = useState<boolean>(false);
  const [districtSearch, setDistrictSearch] = useState<string>('');

  const loadSchemes = async () => {
    try {
      // Check if Supabase has custom schemes
      const { data, error } = await supabase
        .from('schemes')
        .select('*')
        .limit(100);

      if (!error && data && data.length >= 30) {
        // Map Supabase rows
        const dbSchemes: GovernmentScheme[] = data.map((d: any) => ({
          id: d.id,
          name: d.name || 'Scheme',
          department: d.department || 'Department of Agriculture',
          government_level: d.government_level === 'state' ? 'state' : 'central',
          state: d.state || null,
          category: d.category || 'General',
          description: d.description || d.benefits || '',
          eligibility: d.eligibility || 'Check guidelines',
          benefits: d.benefits || '',
          benefit_amount: d.benefit_amount,
          support_type: d.support_type,
          official_url: d.official_url || 'https://agricoop.nic.in',
          required_documents: d.required_documents || []
        }));

        // Deduplicate against verified baseline
        const seen = new Set(dbSchemes.map((s) => s.name.toLowerCase()));
        const merged = [...dbSchemes];
        for (const v of VERIFIED_GOVERNMENT_SCHEMES) {
          if (!seen.has(v.name.toLowerCase())) {
            merged.push(v);
          }
        }
        setSchemes(merged);
      } else {
        // Use full authentic verified dataset (45 schemes)
        setSchemes(VERIFIED_GOVERNMENT_SCHEMES);
      }
    } catch (e) {
      console.warn('Failed to load schemes from Supabase, using verified 45 schemes baseline:', e);
      setSchemes(VERIFIED_GOVERNMENT_SCHEMES);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadSchemes().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSchemes();
    setRefreshing(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleOpenUrl = (url?: string) => {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      Linking.openURL(url).catch(() => {
        Alert.alert(
          'Portal Notice',
          `Could not open portal at ${url}. Please verify your device browser.`
        );
      });
    } else {
      Alert.alert('Notice', 'Official portal link undergoing regular state maintenance.');
    }
  };

  // Filter logic
  const filteredSchemes = useMemo(() => {
    const q = search.toLowerCase().trim();

    return schemes.filter((s) => {
      // Government Level Filter
      if (selectedLevel === 'central' && s.government_level !== 'central') return false;
      if (selectedLevel === 'state' && s.government_level !== 'state') return false;

      // Support Type Filter
      if (
        selectedSupportType !== 'All Support Types' &&
        s.support_type !== selectedSupportType
      ) {
        return false;
      }

      // District Filter
      if (selectedDistrict !== 'All Districts') {
        if (s.districts && s.districts.length > 0) {
          const match = s.districts.some(
            (d) => d.toLowerCase() === selectedDistrict.toLowerCase()
          );
          if (!match) return false;
        }
      }

      // Keyword Search
      if (q) {
        const matchesName = (s.name || '').toLowerCase().includes(q);
        const matchesDept = (s.department || '').toLowerCase().includes(q);
        const matchesBenefits = (s.benefits || '').toLowerCase().includes(q);
        const matchesEligibility = (s.eligibility || '').toLowerCase().includes(q);
        const matchesCategory = (s.category || '').toLowerCase().includes(q);
        const matchesSupport = (s.support_type || '').toLowerCase().includes(q);

        if (
          !matchesName &&
          !matchesDept &&
          !matchesBenefits &&
          !matchesEligibility &&
          !matchesCategory &&
          !matchesSupport
        ) {
          return false;
        }
      }

      return true;
    });
  }, [schemes, search, selectedLevel, selectedSupportType, selectedDistrict]);

  const filteredDistricts = TAMIL_NADU_DISTRICTS.filter((d) =>
    d.toLowerCase().includes(districtSearch.toLowerCase().trim())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Search & Filter Header */}
      <View style={styles.topSection}>
        {/* Search Input */}
        <View style={styles.searchRow}>
          <Search size={18} color="#64748B" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              isTa
                ? 'திட்டம், பலன்கள், மானியம் அல்லது துறையைத் தேடுக...'
                : 'Search scheme, benefits, subsidy, or department...'
            }
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#94A3B8"
            clearButtonMode="while-editing"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} style={{ padding: 4 }}>
              <X size={16} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>

        {/* Level Filters (All, Central, Tamil Nadu) */}
        <View style={styles.levelButtonsRow}>
          {GOV_LEVELS.map((lvl) => {
            const isSelected = selectedLevel === lvl.id;
            return (
              <TouchableOpacity
                key={lvl.id}
                style={[
                  styles.levelButton,
                  isSelected ? styles.levelButtonSelected : null
                ]}
                onPress={() => setSelectedLevel(lvl.id)}
              >
                <Text
                  style={[
                    styles.levelButtonText,
                    isSelected ? styles.levelButtonTextSelected : null
                  ]}
                >
                  {isTa ? lvl.labelTa : lvl.labelEn}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* District Selector & Support Type Row */}
        <View style={styles.secondaryFilterRow}>
          {/* District Selector */}
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

        {/* Horizontal Support Types Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.supportTypeScroll}
          contentContainerStyle={styles.supportTypeScrollContent}
        >
          {SCHEME_SUPPORT_TYPES.map((st) => {
            const isSelected = selectedSupportType === st;
            return (
              <TouchableOpacity
                key={st}
                style={[
                  styles.supportTypeChip,
                  isSelected ? styles.supportTypeChipSelected : null
                ]}
                onPress={() => setSelectedSupportType(st)}
              >
                <Text
                  style={[
                    styles.supportTypeChipText,
                    isSelected ? styles.supportTypeChipTextSelected : null
                  ]}
                >
                  {st === 'All Support Types' ? (isTa ? 'அனைத்து உதவிகள்' : 'All Support') : st}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content List */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>
            {isTa ? 'அரசு நலத்திட்டங்கள் ஏற்றப்படுகின்றன...' : 'Loading verified government schemes...'}
          </Text>
        </View>
      ) : filteredSchemes.length === 0 ? (
        <View style={styles.centerContainer}>
          <Building size={48} color="#94A3B8" />
          <Text style={styles.emptyTitleText}>
            {isTa ? 'பொருந்தும் திட்டங்கள் இல்லை' : 'No Matching Schemes Found'}
          </Text>
          <Text style={styles.emptySubText}>
            {isTa
              ? 'உங்கள் வடிகட்டி அமைப்புகளுக்கு ஏற்ற திட்டங்கள் எதுவும் கிடைக்கவில்லை.'
              : 'Try selecting a different government level or support type filter.'}
          </Text>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              setSelectedLevel('all');
              setSelectedSupportType('All Support Types');
              setSelectedDistrict('All Districts');
              setSearch('');
            }}
          >
            <Text style={styles.resetButtonText}>
              {isTa ? 'அனைத்து வடிகட்டிகளையும் மீட்டமை' : 'Reset All Filters'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredSchemes}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.listHeaderRow}>
              <Text style={styles.resultsCountText}>
                {isTa
                  ? `${filteredSchemes.length} சரிபார்க்கப்பட்ட அரசு திட்டங்கள்`
                  : `Showing ${filteredSchemes.length} Verified Schemes`}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isExpanded = expandedIds.has(item.id);
            const isStateScheme = item.government_level === 'state';

            return (
              <View style={styles.card}>
                {/* Level & Department Header */}
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.levelBadge,
                      isStateScheme ? styles.stateLevelBadge : styles.centralLevelBadge
                    ]}
                  >
                    <Text
                      style={[
                        styles.levelBadgeText,
                        isStateScheme ? styles.stateLevelBadgeText : styles.centralLevelBadgeText
                      ]}
                    >
                      {isStateScheme
                        ? (isTa ? 'தமிழக அரசு' : 'Tamil Nadu State')
                        : (isTa ? 'மத்திய அரசு' : 'Central Government')}
                    </Text>
                  </View>

                  {item.category && (
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText} numberOfLines={1}>
                        {item.category}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Scheme Title & Department */}
                <Text style={styles.cardTitle}>{item.name}</Text>
                {item.department && (
                  <View style={styles.deptRow}>
                    <Building size={13} color="#64748B" />
                    <Text style={styles.deptText} numberOfLines={1}>
                      {item.department}
                    </Text>
                  </View>
                )}

                {/* Subsidy / Benefit Callout Box */}
                {item.benefit_amount && (
                  <View style={styles.benefitAmountBox}>
                    <ShieldCheck size={16} color="#059669" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.benefitAmountLabel}>
                        {isTa ? 'மானிய உதவி / பயன் அளவு' : 'Subsidy & Benefit'}
                      </Text>
                      <Text style={styles.benefitAmountValue}>{item.benefit_amount}</Text>
                    </View>
                  </View>
                )}

                {/* Primary Description */}
                <Text
                  style={styles.benefitsText}
                  numberOfLines={isExpanded ? undefined : 3}
                >
                  {item.benefits || item.description}
                </Text>

                {/* Expandable Eligibility & Documents */}
                {isExpanded && (
                  <View style={styles.expandedSection}>
                    {/* Eligibility Criteria */}
                    <View style={styles.subDetailBlock}>
                      <Text style={styles.subDetailLabel}>
                        {isTa ? 'தகுதி வரம்புகள்' : 'Eligibility Criteria'}:
                      </Text>
                      <Text style={styles.subDetailValue}>{item.eligibility}</Text>
                    </View>

                    {/* Required Documents */}
                    {item.required_documents && item.required_documents.length > 0 && (
                      <View style={styles.subDetailBlock}>
                        <Text style={styles.subDetailLabel}>
                          {isTa ? 'தேவைப்படும் ஆவணங்கள்' : 'Required Documents'}:
                        </Text>
                        {item.required_documents.map((doc, idx) => (
                          <View key={idx} style={styles.docRow}>
                            <CheckCircle2 size={12} color="#059669" />
                            <Text style={styles.docText}>{doc}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Specific District Coverage */}
                    {item.districts && item.districts.length > 0 && (
                      <View style={styles.subDetailBlock}>
                        <Text style={styles.subDetailLabel}>
                          {isTa ? 'பொருந்தும் மாவட்டங்கள்' : 'Applicable Districts'}:
                        </Text>
                        <Text style={styles.subDetailValue}>
                          {item.districts.join(', ')}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Actions Row */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.expandButton}
                    onPress={() => toggleExpand(item.id)}
                  >
                    <Text style={styles.expandButtonText}>
                      {isExpanded
                        ? (isTa ? 'சுருக்குக ▲' : 'Show Less ▲')
                        : (isTa ? 'தகுதி & ஆவணங்கள் ▼' : 'Eligibility & Docs ▼')}
                    </Text>
                  </TouchableOpacity>

                  {item.official_url ? (
                    <TouchableOpacity
                      style={styles.applyButton}
                      onPress={() => handleOpenUrl(item.official_url)}
                    >
                      <Text style={styles.applyButtonText}>
                        {isTa ? 'அதிகாரப்பூர்வ தளம்' : 'Official Portal'}
                      </Text>
                      <ExternalLink size={13} color="#FFFFFF" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          }}
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
                {isTa ? 'மாவட்டத்தைத் தேர்ந்தெடுக்கவும்' : 'Filter by District'}
              </Text>
              <TouchableOpacity onPress={() => setDistrictModalVisible(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchRow}>
              <Search size={16} color="#64748B" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder={isTa ? 'மாவட்டத்தை தேடு...' : 'Search district...'}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  topSection: {
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
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0
  },
  levelButtonsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8
  },
  levelButton: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  levelButtonSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669'
  },
  levelButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569'
  },
  levelButtonTextSelected: {
    color: '#FFFFFF'
  },
  secondaryFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
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
  supportTypeScroll: {
    marginTop: 8
  },
  supportTypeScrollContent: {
    gap: 6,
    paddingRight: 8
  },
  supportTypeChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  supportTypeChipSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A'
  },
  supportTypeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569'
  },
  supportTypeChipTextSelected: {
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
    paddingBottom: 24
  },
  listHeaderRow: {
    marginBottom: 10,
    paddingHorizontal: 4
  },
  resultsCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155'
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
    alignItems: 'center',
    marginBottom: 8
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  stateLevelBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  centralLevelBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: '800'
  },
  stateLevelBadgeText: {
    color: '#1D4ED8'
  },
  centralLevelBadgeText: {
    color: '#047857'
  },
  categoryBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: '55%'
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569'
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 20
  },
  deptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginBottom: 8
  },
  deptText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500'
  },
  benefitAmountBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    padding: 10,
    marginVertical: 8
  },
  benefitAmountLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
    textTransform: 'uppercase'
  },
  benefitAmountValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#14532D',
    marginTop: 1
  },
  benefitsText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    marginTop: 4
  },
  expandedSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8
  },
  subDetailBlock: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#EDF2F7'
  },
  subDetailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3
  },
  subDetailValue: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3
  },
  docText: {
    fontSize: 11,
    color: '#334155'
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC'
  },
  expandButton: {
    paddingVertical: 6,
    paddingHorizontal: 8
  },
  expandButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669'
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  applyButtonText: {
    fontSize: 11,
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
    alignItems: 'center',
    marginBottom: 12
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A'
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
  }
});
