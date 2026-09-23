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
import { MobileDataService, MobileScheme } from '../services/dataService';

export default function SchemesScreen() {
  const { t } = useLanguage();
  const [schemes, setSchemes] = useState<MobileScheme[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');

  useEffect(() => {
    MobileDataService.getSchemes().then(setSchemes);
  }, []);

  const categories = ['All', 'Income Support', 'Machinery Subsidy', 'Irrigation'];

  const filtered = schemes.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.benefits.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCat === 'All' || s.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search government schemes or subsidies..."
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

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
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
              onPress={() => Linking.openURL(item.official_url)}
            >
              <Text style={styles.portalBtnText}>🌐 {t('visitOfficialPortal')}</Text>
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
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7c3aed'
  },
  infoSection: {
    marginTop: 10
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569'
  },
  infoBody: {
    fontSize: 12,
    color: '#1e293b',
    marginTop: 2,
    lineHeight: 18
  },
  portalBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14
  },
  portalBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800'
  }
});
