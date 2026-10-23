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
import { MobileDataService, MobileDealer } from '../services/dataService';

export default function DealersScreen() {
  const { t } = useLanguage();
  const [dealers, setDealers] = useState<MobileDealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All');

  const loadData = async () => {
    try {
      const list = await MobileDataService.getDealers();
      setDealers(list);
    } catch (e) {
      console.warn('Failed to load dealers:', e);
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

  const districts = ['All', 'Thanjavur', 'Coimbatore', 'Salem', 'Madurai'];

  const filtered = dealers.filter((d) => {
    const sTerm = search.toLowerCase();
    const matchesSearch =
      (d.shop_name || '').toLowerCase().includes(sTerm) ||
      (d.address || '').toLowerCase().includes(sTerm) ||
      (d.owner_name || '').toLowerCase().includes(sTerm);
    const matchesDist = selectedDistrict === 'All' || d.district === selectedDistrict;
    return matchesSearch && matchesDist;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search dealer, fertilizer store, or seeds..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#94a3b8"
        />

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={districts}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.distTab,
                selectedDistrict === item && styles.distTabActive
              ]}
              onPress={() => setSelectedDistrict(item)}
            >
              <Text
                style={[
                  styles.distTabText,
                  selectedDistrict === item && styles.distTabTextActive
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
              <Text style={styles.emptyEmoji}>🏪</Text>
              <Text style={styles.emptyText}>No registered agricultural dealers found.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.shopName}>{item.shop_name}</Text>
                    {item.verified && (
                      <View style={styles.verifiedBadge}>
                        <Text style={styles.verifiedBadgeText}>✓ Verified</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.ownerText}>Contact: {item.owner_name}</Text>
                </View>
                <View style={styles.distBadge}>
                  <Text style={styles.distBadgeText}>{item.district}</Text>
                </View>
              </View>

              <Text style={styles.addressText}>📍 {item.address || 'Tamil Nadu'}</Text>

              {Boolean(item.opening_hours) && (
                <Text style={styles.hoursText}>🕒 {item.opening_hours}</Text>
              )}

              <View style={styles.cropsRow}>
                {(item.crops_handled || []).map((crop, idx) => (
                  <View key={idx} style={styles.cropPill}>
                    <Text style={styles.cropPillText}>{crop}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => {
                  if (item.phone) {
                    Linking.openURL(`tel:${item.phone}`);
                  } else {
                    Alert.alert('Contact', 'No phone number listed for this dealer.');
                  }
                }}
              >
                <Text style={styles.callBtnText}>📞 Call Dealer ({item.phone})</Text>
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
  distTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8
  },
  distTabActive: {
    backgroundColor: '#0f172a'
  },
  distTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b'
  },
  distTabTextActive: {
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
  shopName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a'
  },
  verifiedBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669'
  },
  ownerText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  distBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  distBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569'
  },
  addressText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 8
  },
  hoursText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4
  },
  cropsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 12
  },
  cropPill: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  cropPillText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600'
  },
  callBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  callBtnText: {
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
