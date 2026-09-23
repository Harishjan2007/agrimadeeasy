import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { MobileDataService, MobileCropPrice } from '../services/dataService';

export default function PredictionsScreen() {
  const { t } = useLanguage();
  const [crops, setCrops] = useState<MobileCropPrice[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<MobileCropPrice | null>(null);
  const [horizon, setHorizon] = useState<7 | 15 | 30>(15);

  useEffect(() => {
    MobileDataService.getCropPrices().then((list) => {
      setCrops(list);
      if (list.length > 0) setSelectedCrop(list[0]);
    });
  }, []);

  const forecast = selectedCrop
    ? MobileDataService.calculateMLForecast(selectedCrop.price, horizon)
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ML Validation Banner */}
        <View style={styles.metricsCard}>
          <Text style={styles.metricsBadge}>📊 {t('mlModelTitle')}</Text>
          <Text style={styles.metricsScores}>{t('modelAccuracy')}</Text>
          <Text style={styles.metricsDetails}>
            Time-series projection combining seasonal arrival patterns and commodity drift baselines across regional APMC mandis.
          </Text>
        </View>

        {/* Crop Selector Tabs */}
        <Text style={styles.sectionTitle}>Select Crop</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cropTabScroll}>
          {crops.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.cropTab, selectedCrop?.id === c.id && styles.cropTabActive]}
              onPress={() => setSelectedCrop(c)}
            >
              <Text
                style={[
                  styles.cropTabText,
                  selectedCrop?.id === c.id && styles.cropTabTextActive
                ]}
              >
                {c.crop_name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Prediction Horizon Selector */}
        <Text style={styles.sectionTitle}>Forecast Horizon</Text>
        <View style={styles.horizonRow}>
          {[7, 15, 30].map((h) => (
            <TouchableOpacity
              key={h}
              style={[styles.horizonBtn, horizon === h && styles.horizonBtnActive]}
              onPress={() => setHorizon(h as any)}
            >
              <Text
                style={[
                  styles.horizonBtnText,
                  horizon === h && styles.horizonBtnTextActive
                ]}
              >
                {h === 7 ? t('mlHorizon7') : h === 15 ? t('mlHorizon15') : t('mlHorizon30')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Forecast Card */}
        {selectedCrop && forecast && (
          <View style={styles.forecastCard}>
            <View style={styles.forecastHeader}>
              <View>
                <Text style={styles.forecastCrop}>{selectedCrop.crop_name}</Text>
                <Text style={styles.forecastMarket}>{selectedCrop.market_name}</Text>
              </View>
              <View style={styles.trendBadge}>
                <Text style={styles.trendText}>
                  {forecast.trend === 'UP' ? '📈 Bullish Drift' : '📉 Bearish Drift'}
                </Text>
              </View>
            </View>

            <View style={styles.currentVsPredicted}>
              <View style={styles.priceCol}>
                <Text style={styles.colLabel}>Current Market Rate</Text>
                <Text style={styles.currentVal}>₹{selectedCrop.price}/{selectedCrop.unit}</Text>
              </View>
              <View style={styles.arrowCol}>
                <Text style={styles.arrowText}>→</Text>
              </View>
              <View style={styles.priceCol}>
                <Text style={styles.colLabel}>{t('predictedPrice')} ({horizon}d)</Text>
                <Text style={styles.predictedVal}>₹{forecast.predictedPrice}/{selectedCrop.unit}</Text>
              </View>
            </View>

            {/* 95% Confidence Interval */}
            <View style={styles.ciBox}>
              <Text style={styles.ciLabel}>🔒 {t('confidenceInterval')} (±1.96 × RMSE):</Text>
              <Text style={styles.ciRange}>
                ₹{forecast.confidenceLower} — ₹{forecast.confidenceUpper} per {selectedCrop.unit}
              </Text>
              <Text style={styles.ciSub}>
                Statistical Standard Error: ±₹{forecast.rmse}/Q
              </Text>
            </View>
          </View>
        )}

        {/* Statistical Limitations Disclosure */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerTitle}>⚠️ Responsible Agricultural ML Notice</Text>
          <Text style={styles.disclaimerBody}>{t('mlDisclaimer')}</Text>
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
  metricsCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 20
  },
  metricsBadge: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e40af',
    marginBottom: 4
  },
  metricsScores: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1d4ed8'
  },
  metricsDetails: {
    fontSize: 11,
    color: '#3b82f6',
    marginTop: 4,
    lineHeight: 16
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10
  },
  cropTabScroll: {
    marginBottom: 16
  },
  cropTab: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 10
  },
  cropTabActive: {
    backgroundColor: '#15803d',
    borderColor: '#15803d'
  },
  cropTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569'
  },
  cropTabTextActive: {
    color: '#ffffff'
  },
  horizonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20
  },
  horizonBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center'
  },
  horizonBtnActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a'
  },
  horizonBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569'
  },
  horizonBtnTextActive: {
    color: '#ffffff'
  },
  forecastCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2
  },
  forecastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  forecastCrop: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a'
  },
  forecastMarket: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  trendBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  trendText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d'
  },
  currentVsPredicted: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16
  },
  priceCol: {
    flex: 1
  },
  colLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4
  },
  currentVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#475569'
  },
  arrowCol: {
    paddingHorizontal: 8
  },
  arrowText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#94a3b8'
  },
  predictedVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#15803d'
  },
  ciBox: {
    backgroundColor: '#fafaf9',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e7e5e4'
  },
  ciLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#57534e'
  },
  ciRange: {
    fontSize: 15,
    fontWeight: '900',
    color: '#292524',
    marginTop: 4
  },
  ciSub: {
    fontSize: 11,
    color: '#78716c',
    marginTop: 2
  },
  disclaimerBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fde68a'
  },
  disclaimerTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400e',
    marginBottom: 4
  },
  disclaimerBody: {
    fontSize: 11,
    color: '#b45309',
    lineHeight: 16
  }
});
