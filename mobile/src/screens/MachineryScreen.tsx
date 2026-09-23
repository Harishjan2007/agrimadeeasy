import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { MobileDataService, MobileMachinery } from '../services/dataService';

export default function MachineryScreen({ navigation }: any) {
  const { t } = useLanguage();
  const { user, setUserRole } = useAuth();
  const [machines, setMachines] = useState<MobileMachinery[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => {
    MobileDataService.getMachinery().then(setMachines);
  }, []);

  const types = ['All', 'Tractor', 'Harvester', 'Power Tiller'];

  const filtered = machines.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.location.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'All' || m.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Filter and Role Bar */}
      <View style={styles.topSection}>
        <View style={styles.roleBar}>
          <Text style={styles.roleText}>
            Mode: {user.role === 'machinery_provider' ? 'Provider Portal' : 'Farmer Booking'}
          </Text>
          <TouchableOpacity
            style={styles.switchRoleBtn}
            onPress={() =>
              setUserRole(user.role === 'machinery_provider' ? 'farmer' : 'machinery_provider')
            }
          >
            <Text style={styles.switchRoleText}>
              {user.role === 'machinery_provider' ? 'Switch to Farmer' : 'Provider Mode'}
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder={t('searchMachinery')}
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#94a3b8"
        />

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={types}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.typeTab, typeFilter === item && styles.typeTabActive]}
              onPress={() => setTypeFilter(item)}
            >
              <Text
                style={[
                  styles.typeTabText,
                  typeFilter === item && styles.typeTabTextActive
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Machinery Cards */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.machineName}>{item.name}</Text>
                <Text style={styles.locationText}>📍 {item.location}</Text>
              </View>
              <View
                style={[
                  styles.availBadge,
                  item.is_available ? styles.availYes : styles.availNo
                ]}
              >
                <Text
                  style={[
                    styles.availBadgeText,
                    item.is_available ? styles.availYesText : styles.availNoText
                  ]}
                >
                  {item.is_available ? t('available') : t('unavailable')}
                </Text>
              </View>
            </View>

            <View style={styles.rateRow}>
              <View>
                <Text style={styles.rateLabel}>Hourly Rate</Text>
                <Text style={styles.rateVal}>₹{item.price_per_hour}{t('hourlyRate')}</Text>
              </View>
              <View>
                <Text style={styles.rateLabel}>Daily Shift</Text>
                <Text style={styles.rateVal}>₹{item.price_per_day}{t('dailyRate')}</Text>
              </View>
              <View>
                <Text style={styles.rateLabel}>Rating</Text>
                <Text style={styles.rateVal}>⭐ {item.rating}</Text>
              </View>
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[
                  styles.bookBtn,
                  !item.is_available && styles.bookBtnDisabled
                ]}
                disabled={!item.is_available}
                onPress={() => navigation.navigate('MachineryBooking', { machine: item })}
              >
                <Text style={styles.bookBtnText}>{t('bookNow')}</Text>
              </TouchableOpacity>
            </View>
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
  roleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  roleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a'
  },
  switchRoleBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  switchRoleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d'
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
  typeTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8
  },
  typeTabActive: {
    backgroundColor: '#0f172a'
  },
  typeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b'
  },
  typeTabTextActive: {
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
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  machineName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a'
  },
  locationText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  availBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  availYes: {
    backgroundColor: '#dcfce7'
  },
  availNo: {
    backgroundColor: '#fee2e2'
  },
  availBadgeText: {
    fontSize: 10,
    fontWeight: '800'
  },
  availYesText: {
    color: '#15803d'
  },
  availNoText: {
    color: '#b91c1c'
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    marginTop: 12
  },
  rateLabel: {
    fontSize: 10,
    color: '#64748b'
  },
  rateVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2
  },
  cardActions: {
    marginTop: 12
  },
  bookBtn: {
    backgroundColor: '#15803d',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center'
  },
  bookBtnDisabled: {
    backgroundColor: '#cbd5e1'
  },
  bookBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13
  }
});
