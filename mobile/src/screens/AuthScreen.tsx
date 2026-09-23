import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useAuth, UserRole } from '../context/AuthContext';

export default function AuthScreen({ navigation }: any) {
  const { t } = useLanguage();
  const { signIn, setUserRole } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [district, setDistrict] = useState('Thanjavur');
  const [role, setRole] = useState<UserRole>('farmer');

  const handleSubmit = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    await signIn(phone);
    setUserRole(role);
    navigation.replace('MainTabs');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{t('appName')}</Text>
        <Text style={styles.subtitle}>{t('tagline')}</Text>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, !isRegister && styles.tabActive]}
            onPress={() => setIsRegister(false)}
          >
            <Text style={[styles.tabText, !isRegister && styles.tabTextActive]}>
              {t('login')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, isRegister && styles.tabActive]}
            onPress={() => setIsRegister(true)}
          >
            <Text style={[styles.tabText, isRegister && styles.tabTextActive]}>
              {t('register')}
            </Text>
          </TouchableOpacity>
        </View>

        {isRegister && (
          <TextInput
            style={styles.input}
            placeholder="Full Name (e.g. Muthukumar S.)"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#94a3b8"
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Mobile Number (e.g. 9842155678)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholderTextColor="#94a3b8"
        />

        {isRegister && (
          <TextInput
            style={styles.input}
            placeholder="District (e.g. Thanjavur, Coimbatore)"
            value={district}
            onChangeText={setDistrict}
            placeholderTextColor="#94a3b8"
          />
        )}

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitBtnText}>
            {isRegister ? t('register') : t('login')}
          </Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          By continuing, you agree to access AgriME agricultural advisory, APMC market data, and community services.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    padding: 20
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#15803d',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8
  },
  tabActive: {
    backgroundColor: '#ffffff'
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b'
  },
  tabTextActive: {
    color: '#0f172a'
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 14
  },
  submitBtn: {
    backgroundColor: '#15803d',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800'
  },
  disclaimer: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16
  }
});
