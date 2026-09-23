import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  SafeAreaView
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { MobileDataService, MobileCropPrice } from '../services/dataService';

export default function CropPricesScreen() {
  const { t } = useLanguage();
  const [prices, setPrices] = useState<MobileCropPrice[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedItem, setSelectedItem] = useState<MobileCropPrice | null>(null);

  useEffect(() => {
    MobileDataService.getCropPrices().then(setPrices);
  }, []);

  const categories = ['All', 'Cereals', 'Vegetables', 'Commercial', 'Spices'];

  const filtered = prices.filter((p) => {
    const matchesSearch =
      p.crop_name.toLowerCase().includes(search.toLowerCase()) ||
      p.market_name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === 'All' || p.category === category;
    return matchesSearch && matchesCat;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Search & Filter Header */}
      <View style={styles.topSection}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('searchCrops')}
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#94a3b8"
        />

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.catList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.catTab, category === item && styles.catTabActive]}
              onPress={() => setCategory(item)}
            >
              <Text
                style={[styles.catTabText, category === item && styles.catTabTextActive]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Prices List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cropTitle}>{item.crop_name}</Text>
                <Text style={styles.varietyText}>
                  {item.variety ? `${item.variety} • ` : ''}
                  {item.market_name}
                </Text>
              </View>
              <View
                style={[
                  styles.badge,
                  item.source_status === 'LIVE' ? styles.badgeLive : styles.badgeRecent
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    item.source_status === 'LIVE' ? styles.badgeTextLive : styles.badgeTextRecent
                  ]}
                >
                  {item.source_status === 'LIVE' ? t('mandiStatusLive') : t('mandiStatusRecent')}
                </Text>
              </View>
            </View>

            <View style={styles.priceRow}>
              <View>
                <Text style={styles.label}>{t('modalPrice')}</Text>
                <Text style={styles.mainPrice}>
                  ₹{item.price.toLocaleString('en-IN')}/{item.unit}
                </Text>
              </View>

              {item.min_price && item.max_price && (
                <View style={styles.rangePill}>
                  <Text style={styles.rangeText}>
                    Min: ₹{item.min_price} • Max: ₹{item.max_price}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.sourceText}>
                {t('source')}: {item.source_name} ({item.price_date})
              </Text>

              {item.historical_30d && (
                <TouchableOpacity
                  style={styles.historyBtn}
                  onPress={() => setSelectedItem(item)}
                >
                  <Text style={styles.historyBtnText}>{t('viewHistorical')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />

      {/* 30-Day Historical Modal */}
      {selectedItem && (
        <Modal animationType="slide" transparent visible={Boolean(selectedItem)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {selectedItem.crop_name} — {t('historical30d')}
              </Text>
              <Text style={styles.modalSubtitle}>{selectedItem.market_name}</Text>

              <View style={styles.historyList}>
                {selectedItem.historical_30d?.map((h, idx) => (
                  <View key={idx} style={styles.historyRow}>
                    <Text style={styles.historyDate}>{h.date}</Text>
                    <Text style={styles.historyPrice}>
                      ₹{h.price.toLocaleString('en-IN')}/{selectedItem.unit}
                    </Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setSelectedItem(null)}
              >
                <Text style={styles.closeBtnText}>{t('close')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  catList: {
    gap: 8
  },
  catTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8
  },
  catTabActive: {
    backgroundColor: '#15803d'
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
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  cropTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a'
  },
  varietyText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  badgeLive: {
    backgroundColor: '#dcfce7'
  },
  badgeRecent: {
    backgroundColor: '#dbeafe'
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900'
  },
  badgeTextLive: {
    color: '#15803d'
  },
  badgeTextRecent: {
    color: '#1d4ed8'
  },
  priceRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  label: {
    fontSize: 11,
    color: '#64748b'
  },
  mainPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a'
  },
  rangePill: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  rangeText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600'
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sourceText: {
    fontSize: 10,
    color: '#94a3b8',
    flex: 1
  },
  historyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#f0fdf4',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  historyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%'
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a'
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 16
  },
  historyList: {
    marginBottom: 20
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9'
  },
  historyDate: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600'
  },
  historyPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a'
  },
  closeBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center'
  },
  closeBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14
  }
});
