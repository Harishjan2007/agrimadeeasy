import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { MobileMachinery, MobileDataService, MobileBooking } from '../services/dataService';

export default function MachineryBookingScreen({ route, navigation }: any) {
  const { machine }: { machine: MobileMachinery } = route.params || {
    machine: {
      id: 'mac-1',
      name: 'Mahindra 575 DI 45HP Tractor',
      price_per_hour: 850,
      location: 'Thanjavur Delta Zone',
      contact_phone: '+91 94433 11223'
    }
  };

  const { t } = useLanguage();
  const { user } = useAuth();

  const [date, setDate] = useState('2026-09-25');
  const [startTime, setStartTime] = useState('07:00 AM');
  const [hours, setHours] = useState('4');
  const [farmAddress, setFarmAddress] = useState(
    user ? `${user.location || ''}, ${user.district || ''}`.trim().replace(/^,|,$/g, '') || 'Thanjavur Field #4' : 'Thanjavur Field #4'
  );
  const [notes, setNotes] = useState('Rotavator tilling for paddy transplanting');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsedHours = Math.max(1, Number(hours) || 1);
  const totalAmount = parsedHours * machine.price_per_hour;

  const handleConfirmBooking = async () => {
    if (!date.trim() || !startTime.trim()) {
      Alert.alert('Required Fields', 'Please specify the booking date and start time.');
      return;
    }

    if (!farmAddress.trim()) {
      Alert.alert('Address Required', 'Please enter your field destination address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: booking, error } = await MobileDataService.createMachineryBooking({
        farmerId: user?.id,
        farmerName: user?.name || 'Farmer',
        farmerPhone: user?.phone || '+91 98421 55678',
        machineryId: machine.id,
        machineryName: machine.name,
        bookingDate: date.trim(),
        startTime: startTime.trim(),
        totalAmount,
        destinationAddress: farmAddress.trim(),
        providerPhone: machine.contact_phone,
        notes: notes.trim()
      });

      setIsSubmitting(false);

      if (error) {
        Alert.alert('Booking Error', error.message || 'Could not complete booking.');
        return;
      }

      Alert.alert(
        t('bookingConfirmed'),
        `Your reservation for ${machine.name} (₹${totalAmount.toLocaleString('en-IN')}) has been confirmed.\n\nStatus: Pending Provider Dispatch. Payment is settled directly upon work completion.`,
        [
          {
            text: t('trackTrip'),
            onPress: () => navigation.navigate('MachineryTracking', { booking })
          },
          {
            text: 'Done',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (err: any) {
      setIsSubmitting(false);
      Alert.alert('Booking Error', err.message || 'Could not complete booking.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.machineCard}>
          <Text style={styles.machineName}>{machine.name}</Text>
          <Text style={styles.machineLoc}>📍 {machine.location}</Text>
          <Text style={styles.rateHighlight}>
            ₹{machine.price_per_hour} {t('hourlyRate')}
          </Text>
          {Boolean(machine.provider_name) && (
            <Text style={styles.providerNameText}>Provider: {machine.provider_name}</Text>
          )}
        </View>

        <Text style={styles.sectionHeader}>Booking Details</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Date of Work (YYYY-MM-DD) *</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Start Time *</Text>
          <TextInput
            style={styles.input}
            value={startTime}
            onChangeText={setStartTime}
            placeholder="07:00 AM"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Estimated Working Hours *</Text>
          <TextInput
            style={styles.input}
            value={hours}
            onChangeText={setHours}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Farm Destination Address *</Text>
          <TextInput
            style={styles.input}
            value={farmAddress}
            onChangeText={setFarmAddress}
            placeholder="Village, survey / field number"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Field Instructions / Work Type</Text>
          <TextInput
            style={[styles.input, { height: 70 }]}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Rotavator tilling, harvesting, etc."
          />
        </View>

        {/* Cost Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Hourly Rate</Text>
            <Text style={styles.summaryVal}>₹{machine.price_per_hour}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Hours</Text>
            <Text style={styles.summaryVal}>× {parsedHours}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotalRow]}>
            <Text style={styles.totalLabel}>{t('totalAmount')}</Text>
            <Text style={styles.totalVal}>₹{totalAmount.toLocaleString('en-IN')}</Text>
          </View>
          <Text style={styles.summaryNote}>
            Payable directly to machinery operator upon completion of work. No advance commissions.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
          onPress={handleConfirmBooking}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.submitBtnText}>{t('bookNow')}</Text>
          )}
        </TouchableOpacity>
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
  machineCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20
  },
  machineName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a'
  },
  machineLoc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4
  },
  rateHighlight: {
    fontSize: 16,
    fontWeight: '900',
    color: '#15803d',
    marginTop: 8
  },
  providerNameText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12
  },
  fieldGroup: {
    marginBottom: 14
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    fontSize: 14,
    color: '#0f172a'
  },
  summaryCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginVertical: 16
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748b'
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a'
  },
  summaryTotalRow: {
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    paddingTop: 8,
    marginTop: 4
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a'
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#15803d'
  },
  summaryNote: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 8,
    lineHeight: 16
  },
  submitBtn: {
    backgroundColor: '#15803d',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  submitBtnDisabled: {
    backgroundColor: '#86efac'
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15
  }
});
