import React, { useState, useEffect } from 'react';
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
  Alert
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { MobileDataService, MobileScheme } from '../services/dataService';

export default function SchemesScreen() {
  const { t } = useLanguage();
  const [schemes, setSchemes] = useState<MobileScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');

  const loadData = async () => {
    try {
      const list = await MobileDataService.getSchemes();
      setSchemes(list);
    } catch (e) {
      console.warn('Failed to load schemes:', e);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const categories = ['All', 'Income Support', 'Machinery Subsidy', 'Irrigation'];

  const filtered = schemes.filter((s) => {
    const sTerm = search.toLowerCase();
    const matchesSearch =
      (s.name || '').toLowerCase().includes(sTerm) ||
      (s.benefits || '').toLowerCase().includes(sTerm) ||
      (s.eligibility || '').toLowerCase().includes(sTerm);
    const matchesCat = selectedCat === 'All' || s.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  const handleOpenUrl = (url: string) => {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Unable to Open Link', `Could not open ${url} on your device.`);
      });
    } else {
      Alert.alert('Link Notice', 'Official portal link is currently unavailable.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search government schemes, PM-KISAN, subsidies..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#94a3b8"
        />

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.catTab,
                selectedCat === item && styles.catTabActive
              ]}
              onPress={() => setSelectedCat(item)}
            >
              <Text
                style={[
                  styles.catTabText,
                  selectedCat === item && styles.catTabTextActive
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
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🏛️</Text>
              <Text style={styles.emptyText}>No government schemes found matching your search.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.schemeName}>{item.name}</Text>
                  <Text style={styles.stateText}>📍 {item.state}</Text>
                </View>
                <View style={styles.catBadge}>
                  <Text style={styles.catBadgeText}>{item.category}</Text>
                </View>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>🎁 {t('benefits')}:</Text>
                <Text style={styles.infoBody}>{item.benefits}</Text>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>📋 {t('eligibility')}:</Text>
                <Text style={styles.infoBody}>{item.eligibility}</Text>
              </View>

              <TouchableOpacity
                style={styles.portalBtn}
                onPress={() => handleOpenUrl(item.official_url)}
              >
                <Text style={styles.portalBtnText}>🌐 {t('visitOfficialPortal')}</Text>
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
  catTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8
  },
  catTabActive: {
    backgroundColor: '#0f172a'
  },
  catTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b'
  },
  catTabTextActive: {
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
  schemeName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a'
  },
  stateText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  catBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0'
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857'
  },
  infoSection: {
    marginTop: 10
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 2
  },
  infoBody: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17
  },
  portalBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14
  },
  portalBtnText: {
    color: '#ffffff',
    fontSize: 13,
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
  }
});
