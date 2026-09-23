import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useAuth, UserRole } from '../context/AuthContext';

export default function ProfileScreen({ navigation }: any) {
  const { t, language, setLanguage } = useLanguage();
  const { user, setUserRole, signOut } = useAuth();

  const roles: { key: UserRole; label: string; icon: string }[] = [
    { key: 'farmer', label: t('farmerRole'), icon: '🌾' },
    { key: 'machinery_provider', label: t('providerRole'), icon: '🚜' },
    { key: 'dealer', label: t('dealerRole'), icon: '🏪' },
    { key: 'buyer', label: t('buyerRole'), icon: '💼' }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.name.slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userPhone}>{user.phone}</Text>
          <Text style={styles.userLoc}>📍 {user.location} ({user.district})</Text>
        </View>

        {/* Role Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('role')}</Text>
          <View style={styles.roleGrid}>
            {roles.map((r) => (
              <TouchableOpacity
                key={r.key}
                style={[
                  styles.roleTile,
                  user.role === r.key && styles.roleTileActive
                ]}
                onPress={() => setUserRole(r.key)}
              >
                <Text style={styles.roleIcon}>{r.icon}</Text>
                <Text
                  style={[
                    styles.roleText,
                    user.role === r.key && styles.roleTextActive
                  ]}
                >
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Language Switcher */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('changeLanguage')}</Text>
          <View style={styles.langRow}>
            <TouchableOpacity
              style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
              onPress={() => setLanguage('en')}
            >
              <Text
                style={[
                  styles.langBtnText,
                  language === 'en' && styles.langBtnTextActive
                ]}
              >
                English (English)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.langBtn, language === 'ta' && styles.langBtnActive]}
              onPress={() => setLanguage('ta')}
            >
              <Text
                style={[
                  styles.langBtnText,
                  language === 'ta' && styles.langBtnTextActive
                ]}
              >
                தமிழ் (Tamil)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Additional AgriME Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('more')}</Text>
          <View style={styles.menuList}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('Predictions')}
            >
              <Text style={styles.menuItemText}>📈 {t('predictions')}</Text>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('Dealers')}
            >
              <Text style={styles.menuItemText}>🏪 {t('dealers')}</Text>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('Schemes')}
            >
              <Text style={styles.menuItemText}>🏛️ {t('schemes')}</Text>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('FarmStore')}
            >
              <Text style={styles.menuItemText}>🛒 {t('farmStore')}</Text>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
          <Text style={styles.logoutText}>{t('logout')}</Text>
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
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900'
  },
  userName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a'
  },
  userPhone: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2
  },
  userLoc: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between'
  },
  roleTile: {
    width: '48%',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center'
  },
  roleTileActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#15803d'
  },
  roleIcon: {
    fontSize: 22,
    marginBottom: 4
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569'
  },
  roleTextActive: {
    color: '#15803d'
  },
  langRow: {
    flexDirection: 'row',
    gap: 10
  },
  langBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center'
  },
  langBtnActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a'
  },
  langBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569'
  },
  langBtnTextActive: {
    color: '#ffffff'
  },
  menuList: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden'
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9'
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a'
  },
  chevron: {
    fontSize: 16,
    color: '#94a3b8'
  },
  logoutBtn: {
    backgroundColor: '#fee2e2',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10
  },
  logoutText: {
    color: '#b91c1c',
    fontSize: 14,
    fontWeight: '800'
  }
});
