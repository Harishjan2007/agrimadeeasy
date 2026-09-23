import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  SafeAreaView,
  Alert
} from 'react-native';
import * as Location from 'expo-location';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { MobileBooking } from '../services/dataService';

// Accurate Haversine distance formula in kilometers
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export default function MachineryTrackingScreen({ route, navigation }: any) {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [booking, setBooking] = useState<MobileBooking>(
    route?.params?.booking || {
      id: 'bk-demo-1',
      machinery_id: 'mac-1',
      machinery_name: 'Mahindra 575 DI 45HP Tractor with Rotavator',
      date: '2026-09-23',
      time: '08:00 AM',
      status: 'on_the_way',
      farmer_name: 'Muthukumar S.',
      farmer_phone: '+91 98421 55678',
      provider_phone: '+91 94433 11223',
      provider_lat: 10.7870,
      provider_lng: 79.1378,
      destination_lat: 10.7620,
      destination_lng: 79.1550,
      destination_address: 'Thanjavur Delta Farm Sector 4'
    }
  );

  const [deviceLocation, setDeviceLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Request actual device GPS location
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    async function startGpsTracking() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setGpsError('Location permission denied. Showing registered booking coordinates.');
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        setDeviceLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude
        });

        // Watch provider movement if user is provider
        if (user.role === 'machinery_provider' && booking.status === 'on_the_way') {
          subscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              timeInterval: 5000,
              distanceInterval: 10
            },
            (newLoc) => {
              setDeviceLocation({
                latitude: newLoc.coords.latitude,
                longitude: newLoc.coords.longitude
              });
              setBooking((prev) => ({
                ...prev,
                provider_lat: newLoc.coords.latitude,
                provider_lng: newLoc.coords.longitude
              }));
            }
          );
        }
      } catch (e: any) {
        setGpsError(e.message || 'Unable to access device GPS');
      }
    }

    if (booking.status !== 'completed' && booking.status !== 'cancelled') {
      startGpsTracking();
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [booking.status, user.role]);

  // Use real GPS coordinates if available, otherwise verified provider coordinates
  const currentLat = deviceLocation?.latitude || booking.provider_lat || 10.7870;
  const currentLng = deviceLocation?.longitude || booking.provider_lng || 79.1378;

  const distanceKm = calculateHaversineDistance(
    currentLat,
    currentLng,
    booking.destination_lat,
    booking.destination_lng
  );

  // Honest ETA estimation: Tractors average 25 km/h on rural roads
  const tractorSpeedKmH = 25;
  const etaMinutes = Math.max(2, Math.round((distanceKm / tractorSpeedKmH) * 60));

  const handleStatusProgression = (nextStatus: MobileBooking['status']) => {
    setBooking((prev) => ({ ...prev, status: nextStatus }));
  };

  const openNavigation = () => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${currentLat},${currentLng}&destination=${booking.destination_lat},${booking.destination_lng}&travelmode=driving`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Navigation Error', 'Could not launch Google Maps.');
    });
  };

  const callContact = () => {
    const phone = user.role === 'machinery_provider' ? booking.farmer_phone : booking.provider_phone;
    Linking.openURL(`tel:${phone}`);
  };

  const getStatusColor = (st: string) => {
    switch (st) {
      case 'confirmed':
        return '#3b82f6';
      case 'on_the_way':
        return '#f59e0b';
      case 'arrived':
        return '#8b5cf6';
      case 'in_progress':
        return '#10b981';
      case 'completed':
        return '#15803d';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Machinery & Booking Title */}
        <View style={styles.headerCard}>
          <Text style={styles.bookingId}>Booking #{booking.id.slice(-6)}</Text>
          <Text style={styles.machineName}>{booking.machinery_name}</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(booking.status) }
              ]}
            />
            <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
              {booking.status.toUpperCase().replace(/_/g, ' ')}
            </Text>
          </View>
        </View>

        {/* Live GPS Telemetry Box */}
        <View style={styles.telemetryCard}>
          <View style={styles.telemetryHeader}>
            <Text style={styles.telemetryTitle}>📍 Live GPS Telemetry</Text>
            {deviceLocation && (
              <View style={styles.gpsPill}>
                <Text style={styles.gpsPillText}>🛰️ {t('gpsActive')}</Text>
              </View>
            )}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{t('distance')}</Text>
              <Text style={styles.statVal}>{distanceKm} km</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{t('estimatedETA')}</Text>
              <Text style={styles.statVal}>~{etaMinutes} mins</Text>
              <Text style={styles.statSub}>@ {tractorSpeedKmH} km/h rural road</Text>
            </View>
          </View>

          <View style={styles.coordBox}>
            <Text style={styles.coordText}>
              Current Operator GPS: {currentLat.toFixed(4)}° N, {currentLng.toFixed(4)}° E
            </Text>
            <Text style={styles.coordText}>
              Farm Field GPS: {booking.destination_lat.toFixed(4)}° N, {booking.destination_lng.toFixed(4)}° E
            </Text>
          </View>

          {gpsError && <Text style={styles.gpsErrorText}>{gpsError}</Text>}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.navBtn} onPress={openNavigation}>
            <Text style={styles.navBtnText}>🗺️ {t('openNavigation')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.callBtn} onPress={callContact}>
            <Text style={styles.callBtnText}>
              📞 {user.role === 'machinery_provider' ? 'Call Farmer' : t('callProvider')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Provider Lifecycle Controls */}
        {user.role === 'machinery_provider' && (
          <View style={styles.providerControls}>
            <Text style={styles.controlsTitle}>Provider Trip State Update</Text>
            <View style={styles.lifecycleButtons}>
              <TouchableOpacity
                style={[styles.stageBtn, booking.status === 'on_the_way' && styles.stageBtnActive]}
                onPress={() => handleStatusProgression('on_the_way')}
              >
                <Text style={styles.stageBtnText}>Start Trip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.stageBtn, booking.status === 'arrived' && styles.stageBtnActive]}
                onPress={() => handleStatusProgression('arrived')}
              >
                <Text style={styles.stageBtnText}>Arrived</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.stageBtn, booking.status === 'in_progress' && styles.stageBtnActive]}
                onPress={() => handleStatusProgression('in_progress')}
              >
                <Text style={styles.stageBtnText}>In Progress</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.stageBtn, booking.status === 'completed' && styles.stageBtnActive]}
                onPress={() => handleStatusProgression('completed')}
              >
                <Text style={styles.stageBtnText}>Completed</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Honest GPS Notice */}
        <View style={styles.noticeBox}>
          <Text style={styles.noticeTitle}>🛡️ Real-Time Telemetry Transparency</Text>
          <Text style={styles.noticeBody}>{t('gpsNotice')}</Text>
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
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16
  },
  bookingId: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b'
  },
  machineName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 4
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800'
  },
  telemetryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16
  },
  telemetryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  telemetryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a'
  },
  gpsPill: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  gpsPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803d'
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b'
  },
  statVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 2
  },
  statSub: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 2
  },
  coordBox: {
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 8,
    gap: 4
  },
  coordText: {
    fontSize: 11,
    color: '#475569',
    fontFamily: 'monospace'
  },
  gpsErrorText: {
    fontSize: 11,
    color: '#b91c1c',
    marginTop: 8
  },
  actionsCard: {
    gap: 10,
    marginBottom: 16
  },
  navBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  navBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14
  },
  callBtn: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  callBtnText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 13
  },
  providerControls: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16
  },
  controlsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10
  },
  lifecycleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  stageBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  stageBtnActive: {
    backgroundColor: '#15803d',
    borderColor: '#15803d'
  },
  stageBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a'
  },
  noticeBox: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  noticeTitle: {
    fontSize: 11,
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
