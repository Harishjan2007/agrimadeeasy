import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useAuth, UserRole } from '../context/AuthContext';

export default function ProfileScreen({ navigation }: any) {
  const { t, language, setLanguage } = useLanguage();
  const { user, setUserRole, updateProfile, signOut } = useAuth();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editLocation, setEditLocation] = useState(user?.location || '');
  const [editDistrict, setEditDistrict] = useState(user?.district || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const roles: { key: UserRole; label: string; icon: string }[] = [
    { key: 'farmer', label: t('farmerRole'), icon: '🌾' },
    { key: 'machinery_provider', label: t('providerRole'), icon: '🚜' },
    { key: 'dealer', label: t('dealerRole'), icon: '🏪' },
    { key: 'buyer', label: t('buyerRole'), icon: '💼' }
  ];

  const handleOpenEdit = () => {
    setEditName(user?.name || '');
    setEditPhone(user?.phone || '');
    setEditLocation(user?.location || '');
    setEditDistrict(user?.district || '');
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Required Field', 'Please enter your name.');
      return;
    }
    if (!editPhone.trim() || editPhone.trim().length < 10) {
      Alert.alert('Invalid Mobile', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsUpdating(true);
    const { error } = await updateProfile({
      name: editName.trim(),
      phone: editPhone.trim(),
      location: editLocation.trim(),
      district: editDistrict.trim()
    });
    setIsUpdating(false);

    if (error) {
      Alert.alert('Update Failed', error.message || 'Could not update profile.');
      return;
    }

    setEditModalVisible(false);
    Alert.alert('Success', t('profileUpdated'));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name || 'AG').slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'AgriME User'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'Authenticated User'}</Text>
          {Boolean(user?.phone) && (
            <Text style={styles.userPhone}>📞 {user?.phone}</Text>
          )}
          <Text style={styles.userLoc}>
            📍 {user?.location || 'Tamil Nadu'} ({user?.district || 'Tamil Nadu'})
          </Text>

          <TouchableOpacity style={styles.editProfileBtn} onPress={handleOpenEdit}>
            <Text style={styles.editProfileBtnText}>✏️ Edit Profile</Text>
          </TouchableOpacity>
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
                  user?.role === r.key && styles.roleTileActive
                ]}
                onPress={() => {
                  setUserRole(r.key);
                  if (r.key === 'dealer') navigation.navigate('DealerPortal');
                  else if (r.key === 'machinery_provider') navigation.navigate('MachineryProvider');
                }}
              >
                <Text style={styles.roleIcon}>{r.icon}</Text>
                <Text
                  style={[
                    styles.roleText,
                    user?.role === r.key && styles.roleTextActive
                  ]}
                >
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {user?.role === 'dealer' && (
            <TouchableOpacity
              style={[styles.editProfileBtn, { backgroundColor: '#15803d', borderColor: '#15803d', marginTop: 12 }]}
              onPress={() => navigation.navigate('DealerPortal')}
            >
              <Text style={[styles.editProfileBtnText, { color: '#ffffff' }]}>🏪 Go to Dealer Portal →</Text>
            </TouchableOpacity>
          )}

          {user?.role === 'machinery_provider' && (
            <TouchableOpacity
              style={[styles.editProfileBtn, { backgroundColor: '#b45309', borderColor: '#b45309', marginTop: 12 }]}
              onPress={() => navigation.navigate('MachineryProvider')}
            >
              <Text style={[styles.editProfileBtnText, { color: '#ffffff' }]}>🚜 Go to Machinery Provider Portal →</Text>
            </TouchableOpacity>
          )}
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
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => {
            Alert.alert(
              t('logout'),
              'Are you sure you want to sign out of AgriME?',
              [
                { text: t('cancel'), style: 'cancel' },
                { text: t('logout'), style: 'destructive', onPress: signOut }
              ]
            );
          }}
        >
          <Text style={styles.logoutText}>{t('logout')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Edit Profile</Text>

            <Text style={styles.inputLabel}>{t('fullName')} *</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your Full Name"
            />

            <Text style={styles.inputLabel}>{t('phone')} *</Text>
            <TextInput
              style={styles.input}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>{t('location')}</Text>
            <TextInput
              style={styles.input}
              value={editLocation}
              onChangeText={setEditLocation}
              placeholder="Village or farm area"
            />

            <Text style={styles.inputLabel}>{t('district')}</Text>
            <TextInput
              style={styles.input}
              value={editDistrict}
              onChangeText={setEditDistrict}
              placeholder="District"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, isUpdating && styles.saveBtnDisabled]}
                onPress={handleSaveProfile}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>{t('saveChanges')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  userEmail: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2
  },
  userPhone: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
    marginTop: 4
  },
  userLoc: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4
  },
  editProfileBtn: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  editProfileBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a'
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
    marginTop: 4
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 10
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f1f5f9'
  },
  cancelBtnText: {
    color: '#64748b',
    fontWeight: '700'
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#15803d'
  },
  saveBtnDisabled: {
    backgroundColor: '#86efac'
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '800'
  }
});
