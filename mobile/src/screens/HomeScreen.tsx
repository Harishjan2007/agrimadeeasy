import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { MobileDataService, MobileCropPrice } from '../services/dataService';

export default function HomeScreen({ navigation }: any) {
  const { t, language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const [prices, setPrices] = useState<MobileCropPrice[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const list = await MobileDataService.getCropPrices();
    setPrices(list.slice(0, 3));
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>{t('appName')}</Text>
            <Text style={styles.tagline}>{user.name} • {user.district}</Text>
          </View>
          <TouchableOpacity
            style={styles.langButton}
            onPress={() => setLanguage(language === 'en' ? 'ta' : 'en')}
          >
            <Text style={styles.langButtonText}>
              {language === 'en' ? 'தமிழ்' : 'English'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Live / Recent Mandi Prices Snapshot */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{t('liveMandiPrices')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CropPrices')}>
              <Text style={styles.linkText}>{t('viewAllPrices')} →</Text>
            </TouchableOpacity>
          </View>

          {prices.map((item) => (
            <View key={item.id} style={styles.priceCard}>
              <View style={styles.priceCardTop}>
                <View>
                  <Text style={styles.cropTitle}>{item.crop_name}</Text>
                  <Text style={styles.mandiSub}>{item.market_name}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    item.source_status === 'LIVE' ? styles.badgeLive : styles.badgeRecent
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      item.source_status === 'LIVE' ? styles.badgeTextLive : styles.badgeTextRecent
                    ]}
                  >
                    {item.source_status === 'LIVE' ? t('mandiStatusLive') : t('mandiStatusRecent')}
                  </Text>
                </View>
              </View>

              <View style={styles.priceNumbersRow}>
                <View>
                  <Text style={styles.priceLabel}>{t('modalPrice')}</Text>
                  <Text style={styles.priceMain}>
                    ₹{item.price.toLocaleString('en-IN')}/{item.unit}
                  </Text>
                </View>
                {item.min_price && item.max_price && (
                  <View style={styles.rangeBox}>
                    <Text style={styles.rangeText}>
                      {t('minPrice')}: ₹{item.min_price} • {t('maxPrice')}: ₹{item.max_price}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.sourceText}>
                {t('source')}: {item.source_name} ({item.price_date})
              </Text>
            </View>
          ))}
        </View>

        {/* Quick Action Tiles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('quickActions')}</Text>
          <View style={styles.grid}>
            <TouchableOpacity
              style={[styles.tile, { backgroundColor: '#fef3c7' }]}
              onPress={() => navigation.navigate('Machinery')}
            >
              <Text style={styles.tileEmoji}>🚜</Text>
              <Text style={styles.tileTitle}>{t('hireMachinery')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tile, { backgroundColor: '#ecfdf5' }]}
              onPress={() => navigation.navigate('Predictions')}
            >
              <Text style={styles.tileEmoji}>📈</Text>
              <Text style={styles.tileTitle}>{t('predictions')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tile, { backgroundColor: '#eff6ff' }]}
              onPress={() => navigation.navigate('Dealers')}
            >
              <Text style={styles.tileEmoji}>🏪</Text>
              <Text style={styles.tileTitle}>{t('findDealers')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tile, { backgroundColor: '#f5f3ff' }]}
              onPress={() => navigation.navigate('Schemes')}
            >
              <Text style={styles.tileEmoji}>🏛️</Text>
              <Text style={styles.tileTitle}>{t('checkSchemes')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tile, { backgroundColor: '#ecfeff' }]}
              onPress={() => navigation.navigate('Marketplace')}
            >
              <Text style={styles.tileEmoji}>🌾</Text>
              <Text style={styles.tileTitle}>{t('sellProduce')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tile, { backgroundColor: '#fff7ed' }]}
              onPress={() => navigation.navigate('FarmStore')}
            >
              <Text style={styles.tileEmoji}>🛒</Text>
              <Text style={styles.tileTitle}>{t('farmStore')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Honest System Transparency Notice */}
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>🛡️ AgriME Data Transparency</Text>
          <Text style={styles.noticeBody}>
            Mandi prices are synchronized from official Agmarknet / APMC government sources. Live badges indicate today's arrivals; other prices indicate recent official bulletins. No speculative or artificial prices are fabricated.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  appName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#15803d'
  },
  tagline: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  langButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  langButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a'
  },
  section: {
    marginBottom: 24
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a'
  },
  linkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803d'
  },
  priceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1
  },
  priceCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  cropTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a'
  },
  mandiSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  statusBadge: {
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
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '900'
  },
  badgeTextLive: {
    color: '#15803d'
  },
  badgeTextRecent: {
    color: '#1d4ed8'
  },
  priceNumbersRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  priceLabel: {
    fontSize: 11,
    color: '#64748b'
  },
  priceMain: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a'
  },
  rangeBox: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  rangeText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600'
  },
  sourceText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 8
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between'
  },
  tile: {
    width: '48%',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8
  },
  tileEmoji: {
    fontSize: 26,
    marginBottom: 6
  },
  tileTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center'
  },
  noticeCard: {
    backgroundColor: '#f0fdf4',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginTop: 10
  },
  noticeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 4
  },
  noticeBody: {
    fontSize: 11,
    color: '#15803d',
    lineHeight: 16
  }
});
