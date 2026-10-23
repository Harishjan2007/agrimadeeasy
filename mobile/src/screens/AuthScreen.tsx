import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useAuth, UserRole } from '../context/AuthContext';

export default function AuthScreen({ navigation }: any) {
  const { t } = useLanguage();
  const { signIn, signUp, resetPassword } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('farmer');
  const [district, setDistrict] = useState('Thanjavur');
  const [location, setLocation] = useState('Thanjavur Delta');
  const [shopName, setShopName] = useState('');
  const [machineName, setMachineName] = useState('');
  const [machineType, setMachineType] = useState('Tractor');

  const roleOptions: { key: UserRole; label: string; icon: string }[] = [
    { key: 'farmer', label: t('farmerRole'), icon: '🌾' },
    { key: 'machinery_provider', label: t('providerRole'), icon: '🚜' },
    { key: 'dealer', label: t('dealerRole'), icon: '🏪' },
    { key: 'buyer', label: t('buyerRole'), icon: '💼' }
  ];

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Required Fields', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);

    if (error) {
      Alert.alert('Sign In Failed', error.message || 'Invalid email or password.');
      return;
    }

    // Auth state automatically changes and routes to MainTabs
  };

  const handleSignUp = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      Alert.alert('Invalid Mobile', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    const { error, needEmailConfirmation } = await signUp({
      name: name.trim(),
      email: email.trim(),
      password,
      phone: phone.trim(),
      role,
      district: district.trim(),
      location: location.trim(),
      shopName: shopName.trim(),
      primaryMachineName: machineName.trim(),
      primaryMachineType: machineType
    });
    setLoading(false);

    if (error) {
      Alert.alert('Registration Failed', error.message || 'Could not register user.');
      return;
    }

    if (needEmailConfirmation) {
      Alert.alert(
        'Confirm Email',
        'Registration successful! Please check your email to confirm your account, then sign in.',
        [{ text: 'OK', onPress: () => setIsRegister(false) }]
      );
    }
  };

  const handleForgotPassword = () => {
    Alert.prompt
      ? Alert.prompt(
          t('resetPassword'),
          'Enter your registered email address:',
          async (enteredEmail) => {
            if (enteredEmail) {
              const { error } = await resetPassword(enteredEmail);
              if (error) Alert.alert('Error', error.message);
              else Alert.alert(t('resetPassword'), t('resetLinkSent'));
            }
          }
        )
      : (async () => {
          if (!email.trim()) {
            Alert.alert(t('resetPassword'), 'Please type your email in the email field first.');
            return;
          }
          const { error } = await resetPassword(email.trim());
          if (error) Alert.alert('Error', error.message);
          else Alert.alert(t('resetPassword'), t('resetLinkSent'));
        })();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.title}>{t('appName')}</Text>
            <Text style={styles.subtitle}>{t('tagline')}</Text>

            {/* Toggle Tabs */}
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

            {/* Registration Fields */}
            {isRegister && (
              <>
                <Text style={styles.inputLabel}>{t('fullName')} *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Muthukumar S."
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="#94a3b8"
                />

                <Text style={styles.inputLabel}>{t('phone')} *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholderTextColor="#94a3b8"
                />

                <Text style={styles.inputLabel}>{t('role')} *</Text>
                <View style={styles.roleGrid}>
                  {roleOptions.map((opt) => (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.roleTile, role === opt.key && styles.roleTileActive]}
                      onPress={() => setRole(opt.key)}
                    >
                      <Text style={styles.roleIcon}>{opt.icon}</Text>
                      <Text style={[styles.roleText, role === opt.key && styles.roleTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {role === 'dealer' && (
                  <>
                    <Text style={styles.inputLabel}>{t('shopName')} *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Cauvery Agro Inputs"
                      value={shopName}
                      onChangeText={setShopName}
                      placeholderTextColor="#94a3b8"
                    />
                  </>
                )}

                {role === 'machinery_provider' && (
                  <>
                    <Text style={styles.inputLabel}>Primary Machine Name *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Mahindra 575 DI Tractor"
                      value={machineName}
                      onChangeText={setMachineName}
                      placeholderTextColor="#94a3b8"
                    />
                  </>
                )}

                <Text style={styles.inputLabel}>{t('district')} *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Thanjavur, Coimbatore"
                  value={district}
                  onChangeText={setDistrict}
                  placeholderTextColor="#94a3b8"
                />
              </>
            )}

            {/* Common Credentials */}
            <Text style={styles.inputLabel}>{t('email')} *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. farmer@agrime.in"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.inputLabel}>{t('password')} *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="At least 6 characters"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#94a3b8"
              />
              <TouchableOpacity
                style={styles.showPassBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.showPassText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>

            {!isRegister && (
              <TouchableOpacity style={styles.forgotBtn} onPress={handleForgotPassword}>
                <Text style={styles.forgotBtnText}>{t('forgotPassword')}</Text>
              </TouchableOpacity>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={isRegister ? handleSignUp : handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {isRegister ? t('register') : t('login')}
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              AgriME adheres to strict authentication standards. Your data is protected by Supabase Row-Level Security.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  scrollContent: {
    padding: 20,
    justifyContent: 'center',
    flexGrow: 1
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
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
    marginTop: 2
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
    marginBottom: 12
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  showPassBtn: {
    position: 'absolute',
    right: 14,
    padding: 6
  },
  showPassText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803d'
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
    marginTop: 4
  },
  roleTile: {
    width: '48%',
    backgroundColor: '#f8fafc',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6
  },
  roleTileActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#15803d'
  },
  roleIcon: {
    fontSize: 18
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b'
  },
  roleTextActive: {
    color: '#15803d'
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 14,
    marginTop: -4
  },
  forgotBtnText: {
    fontSize: 12,
    color: '#15803d',
    fontWeight: '700'
  },
  submitBtn: {
    backgroundColor: '#15803d',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6
  },
  submitBtnDisabled: {
    backgroundColor: '#86efac'
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
