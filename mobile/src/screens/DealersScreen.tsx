import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Linking,
  SafeAreaView
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { MobileDataService, MobileDealer } from '../services/dataService';

export default function DealersScreen() {
  const { t } = useLanguage();
  const [dealers, setDealers] = useState<MobileDealer[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All');

  useEffect(() => {
    MobileDataService.getDealers().then(setDealers);
  }, []);

  const districts = ['All', 'Thanjavur', 'Coimbatore', 'Salem', 'Madurai'];

  const filtered = dealers.filter((d) => {
    const matchesSearch =
      d.shop_name.toLowerCase().includes(search.toLowerCase()) ||
      d.address.toLowerCase().includes(search.toLowerCase());
    const matchesDist = selectedDistrict === 'All' || d.district === selectedDistrict;
    return matchesSearch && matchesDist;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search dealer or agricultural input..."
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

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.shopName}>{item.shop_name}</Text>
                <Text style={styles.ownerText}>Contact: {item.owner_name}</Text>
              </View>
              <View style={styles.distBadge}>
                <Text style={styles.distBadgeText}>{item.district}</Text>
              </View>
            </View>

            <Text style={styles.addressText}>📍 {item.address}</Text>

            <View style={styles.cropsRow}>
              {item.crops_handled.map((crop, idx) => (
                <View key={idx} style={styles.cropPill}>
                  <Text style={styles.cropPillText}>{crop}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => Linking.openURL(`tel:${item.phone}`)}
            >
              <Text style={styles.callBtnText}>📞 Call {item.phone}</Text>
            </TouchableOpacity>
          </View>
        )}
      />
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
  listContainer: {
    padding: 16
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
  ownerText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  distBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  distBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1d4ed8'
  },
  addressText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 8
  },
  cropsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10
  },
  cropPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  cropPillText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600'
  },
  callBtn: {
    backgroundColor: '#f0fdf4',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  callBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803d'
  }
});
