import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import {
  MobileDataService,
  MobileCropPrice,
  MobileMLForecast
} from '../services/dataService';

export default function PredictionsScreen() {
  const { t } = useLanguage();
  const [crops, setCrops] = useState<MobileCropPrice[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<MobileCropPrice | null>(null);
  const [horizon, setHorizon] = useState<7 | 15 | 30>(15);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [forecast, setForecast] = useState<MobileMLForecast | null>(null);

  const loadData = async () => {
    try {
      const list = await MobileDataService.getCropPrices();
      setCrops(list);
      if (list.length > 0) {
        const initial = selectedCrop || list[0];
        setSelectedCrop(initial);
        updateForecast(initial, horizon);
      }
    } catch (e) {
      console.warn('Failed to load crop prices for predictions:', e);
    }
  };

  const updateForecast = (crop: MobileCropPrice, h: 7 | 15 | 30) => {
    const fc = MobileDataService.calculateCalibratedForecast(crop.crop_name, crop.price, h);
    setForecast(fc);
  };

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, []);

  const handleSelectCrop = (crop: MobileCropPrice) => {
    setSelectedCrop(crop);
    updateForecast(crop, horizon);
  };

  const handleSelectHorizon = (h: 7 | 15 | 30) => {
    setHorizon(h);
    if (selectedCrop) {
      updateForecast(selectedCrop, h);
    }
  };

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
        {/* Authentic ML Model Architecture & Provenance Card */}
        <View style={styles.metricsCard}>
          <View style={styles.metricsTopRow}>
            <Text style={styles.metricsBadge}>📊 {t('mlModelTitle')}</Text>
            <View style={styles.calibratedPill}>
              <Text style={styles.calibratedPillText}>Agmarknet 2001-2026</Text>
            </View>
          </View>
          <Text style={styles.metricsScores}>
            HistGradientBoosting (Residual Over Persistence)
          </Text>
          <Text style={styles.metricsDetails}>
            Calibrated on 4.5M+ genuine Government of India APMC mandi observations. Strictly chronological train/test partitioning with held-out validation.
          </Text>

          {forecast && (
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Held-out MAE</Text>
                <Text style={styles.statVal}>₹{forecast.accuracy_metrics.mae}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Held-out RMSE</Text>
                <Text style={styles.statVal}>₹{forecast.accuracy_metrics.rmse}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Test R²</Text>
                <Text style={styles.statVal}>{forecast.accuracy_metrics.r_squared}</Text>
              </View>
            </View>
          )}
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#15803d" />
          </View>
        ) : (
          <>
            {/* Crop Selector Tabs */}
            <Text style={styles.sectionTitle}>Select Crop for Inference</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cropTabScroll}>
              {crops.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.cropTab, selectedCrop?.id === c.id && styles.cropTabActive]}
                  onPress={() => handleSelectCrop(c)}
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
                  onPress={() => handleSelectHorizon(h as any)}
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

            {/* Forecast Projection Card */}
            {selectedCrop && forecast && (
              <View style={styles.forecastCard}>
                <View style={styles.forecastHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.forecastCrop}>{selectedCrop.crop_name}</Text>
                    <Text style={styles.forecastMarket}>📍 {selectedCrop.market_name}</Text>
                  </View>
                  <View
                    style={[
                      styles.trendBadge,
                      forecast.trend === 'up'
                        ? styles.trendBadgeUp
                        : forecast.trend === 'down'
                        ? styles.trendBadgeDown
                        : styles.trendBadgeStable
                    ]}
                  >
                    <Text
                      style={[
                        styles.trendText,
                        forecast.trend === 'up'
                          ? styles.trendTextUp
                          : forecast.trend === 'down'
                          ? styles.trendTextDown
                          : styles.trendTextStable
                      ]}
                    >
                      {forecast.trend === 'up' ? '📈 Bullish' : forecast.trend === 'down' ? '📉 Bearish' : '➡️ Stable'}
                    </Text>
                  </View>
                </View>

                <View style={styles.currentVsPredicted}>
                  <View style={styles.priceCol}>
                    <Text style={styles.colLabel}>Current Market Rate</Text>
                    <Text style={styles.currentVal}>
                      ₹{selectedCrop.price.toLocaleString('en-IN')}/{selectedCrop.unit}
                    </Text>
                  </View>
                  <View style={styles.arrowCol}>
                    <Text style={styles.arrowText}>→</Text>
                  </View>
                  <View style={styles.priceCol}>
                    <Text style={styles.colLabel}>{t('predictedPrice')} ({horizon}d)</Text>
                    <Text style={styles.predictedVal}>
                      ₹{forecast.predicted_price.toLocaleString('en-IN')}/{selectedCrop.unit}
                    </Text>
                  </View>
                </View>

                {/* 95% Confidence Interval */}
                <View style={styles.ciBox}>
                  <Text style={styles.ciLabel}>🔒 {t('confidenceInterval')} (±1.96 × RMSE):</Text>
                  <Text style={styles.ciRange}>
                    ₹{forecast.predicted_min.toLocaleString('en-IN')} — ₹{forecast.predicted_max.toLocaleString('en-IN')} per {selectedCrop.unit}
                  </Text>
                  <Text style={styles.ciSub}>
                    Statistical Standard Error: ±₹{forecast.accuracy_metrics.rmse}/Quintal
                  </Text>
                </View>
              </View>
            )}

            {/* Statistical Limitations Disclosure */}
            <View style={styles.disclaimerBox}>
              <Text style={styles.disclaimerTitle}>⚠️ Responsible Agricultural ML Notice</Text>
              <Text style={styles.disclaimerBody}>{t('mlDisclaimer')}</Text>
              {Boolean(forecast?.limitations) && (
                <Text style={styles.limitationsText}>{forecast?.limitations}</Text>
              )}
            </View>
          </>
        )}
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
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20
  },
  metricsTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  metricsBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#86efac',
    textTransform: 'uppercase'
  },
  calibratedPill: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  calibratedPillText: {
    fontSize: 10,
    color: '#cbd5e1',
    fontWeight: '700'
  },
  metricsScores: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6
  },
  metricsDetails: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    padding: 10,
    marginTop: 12
  },
  statBox: {
    alignItems: 'center',
    flex: 1
  },
  statLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600'
  },
  statVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10
  },
  cropTabScroll: {
    marginBottom: 16
  },
  cropTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
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
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center'
  },
  horizonBtnActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a'
  },
  horizonBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b'
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
    marginBottom: 16
  },
  forecastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  forecastCrop: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a'
  },
  forecastMarket: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  trendBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  trendBadgeUp: {
    backgroundColor: '#ecfdf5'
  },
  trendBadgeDown: {
    backgroundColor: '#fee2e2'
  },
  trendBadgeStable: {
    backgroundColor: '#eff6ff'
  },
  trendText: {
    fontSize: 11,
    fontWeight: '800'
  },
  trendTextUp: {
    color: '#047857'
  },
  trendTextDown: {
    color: '#b91c1c'
  },
  trendTextStable: {
    color: '#1d4ed8'
  },
  currentVsPredicted: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14
  },
  priceCol: {
    flex: 1
  },
  arrowCol: {
    paddingHorizontal: 8
  },
  arrowText: {
    fontSize: 20,
    color: '#94a3b8',
    fontWeight: '700'
  },
  colLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  currentVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2
  },
  predictedVal: {
    fontSize: 17,
    fontWeight: '900',
    color: '#15803d',
    marginTop: 2
  },
  ciBox: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  ciLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 4
  },
  ciRange: {
    fontSize: 15,
    fontWeight: '900',
    color: '#15803d'
  },
  ciSub: {
    fontSize: 11,
    color: '#16a34a',
    marginTop: 4
  },
  disclaimerBox: {
    backgroundColor: '#fef3c7',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a'
  },
  disclaimerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400e',
    marginBottom: 4
  },
  disclaimerBody: {
    fontSize: 11,
    color: '#b45309',
    lineHeight: 16
  },
  limitationsText: {
    fontSize: 10,
    color: '#78350f',
    marginTop: 6,
    fontStyle: 'italic'
  }
});
