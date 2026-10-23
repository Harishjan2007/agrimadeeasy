import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { isValidUuid } from '../services/dataService';

export type UserRole = 'farmer' | 'machinery_provider' | 'dealer' | 'buyer';

export interface MobileUserProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  location: string;
  district: string;
  state: string;
  shop_name?: string;
  primary_crops?: string[];
}

export interface SignUpData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  location: string;
  district: string;
  state?: string;
  shopName?: string;
  businessAddress?: string;
  primaryMachineName?: string;
  primaryMachineType?: string;
  pricePerHour?: number;
}

interface AuthContextType {
  user: MobileUserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUserRole: (role: UserRole) => void;
  updateProfile: (profile: Partial<MobileUserProfile>) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (data: SignUpData) => Promise<{ error: Error | null; needEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUserRole: () => {},
  updateProfile: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null })
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<MobileUserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load and sync user profile from Supabase and cache authoritatively
  const syncProfile = async (userId: string, authUserEmail?: string, authMeta?: Record<string, any>) => {
    try {
      let dbProfile: Record<string, any> | null = null;
      let authoritativeRole: UserRole | null = null;
      let shopNameFromDb: string | undefined = undefined;

      // 1. Authoritative check in 'profiles' table
      if (isSupabaseConfigured && isValidUuid(userId)) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (!error && data) {
            dbProfile = data;
            if (data.role && ['farmer', 'machinery_provider', 'dealer', 'buyer'].includes(data.role)) {
              authoritativeRole = data.role as UserRole;
            }
          }
        } catch (pErr) {
          console.warn('Profiles table lookup notice:', pErr);
        }
      }

      // 2. Authoritative check in auth metadata
      const meta = authMeta || {};
      if (!authoritativeRole || authoritativeRole === 'farmer') {
        if (meta.role && ['dealer', 'machinery_provider', 'buyer', 'farmer'].includes(meta.role)) {
          authoritativeRole = meta.role as UserRole;
        } else if (meta.user_type === 'Dealer' || meta.shop_name) {
          authoritativeRole = 'dealer';
        } else if (meta.user_type === 'Other' || meta.machinery_types || meta.primary_machine_name) {
          authoritativeRole = 'machinery_provider';
        }
      }

      // 3. Fallback check: check 'dealers' table for profile_id match
      if (isSupabaseConfigured && isValidUuid(userId) && authoritativeRole !== 'dealer') {
        try {
          const { data: dealerRecord } = await supabase
            .from('dealers')
            .select('id, shop_name')
            .eq('profile_id', userId)
            .maybeSingle();

          if (dealerRecord) {
            authoritativeRole = 'dealer';
            shopNameFromDb = dealerRecord.shop_name;
          }
        } catch (dErr) {
          // Ignore table lookup error
        }
      }

      // 4. Fallback check: check 'machinery' table for provider_id match
      if (isSupabaseConfigured && isValidUuid(userId) && authoritativeRole !== 'machinery_provider' && authoritativeRole !== 'dealer') {
        try {
          const { data: machRecords } = await supabase
            .from('machinery')
            .select('id, name')
            .eq('provider_id', userId)
            .limit(1);

          if (machRecords && machRecords.length > 0) {
            authoritativeRole = 'machinery_provider';
          }
        } catch (mErr) {
          // Ignore table lookup error
        }
      }

      // 5. Check local cached role if available
      if (!authoritativeRole || authoritativeRole === 'farmer') {
        try {
          const cached = await AsyncStorage.getItem('agrime_mobile_profile');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed?.id === userId && parsed.role && parsed.role !== 'farmer') {
              authoritativeRole = parsed.role as UserRole;
            }
          }
        } catch (cErr) {}
      }

      const finalRole: UserRole = authoritativeRole || (dbProfile?.role as UserRole) || 'farmer';

      const resolvedProfile: MobileUserProfile = {
        id: userId,
        email: authUserEmail || dbProfile?.email || meta.email || '',
        name: dbProfile?.name || meta.name || (authUserEmail ? authUserEmail.split('@')[0] : 'AgriME User'),
        phone: dbProfile?.phone || meta.phone || '',
        role: finalRole,
        location: dbProfile?.location || meta.location || 'Tamil Nadu',
        district: dbProfile?.district || meta.district || 'Thanjavur',
        state: dbProfile?.state || meta.state || 'Tamil Nadu',
        shop_name: shopNameFromDb || dbProfile?.shop_name || meta.shop_name,
        primary_crops: dbProfile?.primary_crops || meta.primary_crops || []
      };

      setUser(resolvedProfile);
      setIsAuthenticated(true);
      await AsyncStorage.setItem('agrime_mobile_profile', JSON.stringify(resolvedProfile));

      // Synchronize back to profiles table if role was authoritatively resolved differently
      if (isSupabaseConfigured && isValidUuid(userId) && dbProfile && dbProfile.role !== finalRole) {
        supabase.from('profiles').update({ role: finalRole }).eq('id', userId).then(() => {}).catch(() => {});
      }
    } catch (e) {
      console.warn('Profile synchronization error:', e);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        // 1. Try reading cached profile for instant rendering
        const cached = await AsyncStorage.getItem('agrime_mobile_profile');
        if (cached && isMounted) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.id) {
              setUser(parsed);
              setIsAuthenticated(true);
            }
          } catch (e) {}
        }

        // 2. Validate real Supabase session
        if (isSupabaseConfigured) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && isMounted) {
            await syncProfile(session.user.id, session.user.email, session.user.user_metadata);
          } else if (!cached && isMounted) {
            setIsAuthenticated(false);
            setUser(null);
          }
        }
      } catch (err) {
        console.warn('Session restoration error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    restoreSession();

    // 3. Listen to Supabase auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await syncProfile(session.user.id, session.user.email, session.user.user_metadata);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
        await AsyncStorage.removeItem('agrime_mobile_profile');
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const setUserRole = (role: UserRole) => {
    if (!user) return;
    const updated = { ...user, role };
    setUser(updated);
    AsyncStorage.setItem('agrime_mobile_profile', JSON.stringify(updated)).catch(() => {});

    if (isValidUuid(user.id)) {
      supabase.from('profiles').update({ role }).eq('id', user.id).then(() => {}).catch(() => {});
    }
  };

  const updateProfile = async (partial: Partial<MobileUserProfile>): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error('User is not signed in') };

    const updated = { ...user, ...partial };
    setUser(updated);
    await AsyncStorage.setItem('agrime_mobile_profile', JSON.stringify(updated)).catch(() => {});

    try {
      if (isValidUuid(user.id)) {
        const dbUpdates: Record<string, any> = {};
        if (partial.name !== undefined) dbUpdates.name = partial.name;
        if (partial.phone !== undefined) dbUpdates.phone = partial.phone;
        if (partial.location !== undefined) dbUpdates.location = partial.location;
        if (partial.district !== undefined) dbUpdates.district = partial.district;
        if (partial.state !== undefined) dbUpdates.state = partial.state;

        const { error } = await supabase
          .from('profiles')
          .update(dbUpdates)
          .eq('id', user.id);

        if (error) return { error: new Error(error.message) };
      }
      return { error: null };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    if (!email || !password) {
      return { error: new Error('Please enter both email and password.') };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      if (!data.user) {
        return { error: new Error('Sign in returned empty user credentials.') };
      }

      await syncProfile(data.user.id, data.user.email, data.user.user_metadata);
      return { error: null };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const signUp = async (data: SignUpData): Promise<{ error: Error | null; needEmailConfirmation?: boolean }> => {
    if (!data.email || !data.password) {
      return { error: new Error('Email and password are required.') };
    }
    if (data.password.length < 6) {
      return { error: new Error('Password must be at least 6 characters.') };
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          data: {
            name: data.name,
            phone: data.phone,
            role: data.role,
            location: data.location,
            district: data.district,
            state: data.state || 'Tamil Nadu',
            shop_name: data.shopName || ''
          }
        }
      });

      if (authError) {
        return { error: new Error(authError.message) };
      }

      if (!authData.user) {
        return { error: new Error('Sign up failed: no user returned.') };
      }

      const userId = authData.user.id;

      // Upsert profile in Supabase profiles table
      try {
        await supabase.from('profiles').upsert({
          id: userId,
          name: data.name,
          email: data.email.trim(),
          phone: data.phone,
          role: data.role,
          location: data.location,
          district: data.district,
          state: data.state || 'Tamil Nadu',
          created_at: new Date().toISOString()
        }, { onConflict: 'id' });
      } catch (e) {
        console.warn('Profile row upsert notice:', e);
      }

      // If dealer, register dealer record
      if (data.role === 'dealer') {
        try {
          await supabase.from('dealers').upsert({
            profile_id: userId,
            shop_name: data.shopName || data.name,
            address: data.businessAddress || data.location,
            phone: data.phone,
            district: data.district,
            state: data.state || 'Tamil Nadu',
            opening_hours: 'Mon - Sat: 7:30 AM - 7:30 PM'
          }, { onConflict: 'profile_id' });
        } catch (dErr) {
          console.warn('Dealer row upsert notice:', dErr);
        }
      }

      // If machinery provider, register primary machine
      if (data.role === 'machinery_provider') {
        try {
          await supabase.from('machinery').insert({
            provider_id: userId,
            name: data.primaryMachineName || `${data.name}'s ${data.primaryMachineType || 'Tractor'}`,
            type: data.primaryMachineType || 'Tractor',
            description: 'Agricultural equipment available for local hiring.',
            price_per_hour: data.pricePerHour || 750,
            location: data.location,
            available: true
          });
        } catch (mErr) {
          console.warn('Machinery row insert notice:', mErr);
        }
      }

      await syncProfile(userId, data.email, authData.user.user_metadata);

      const needEmailConfirmation = Boolean(authData.session === null);
      return { error: null, needEmailConfirmation };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const resetPassword = async (email: string): Promise<{ error: Error | null }> => {
    if (!email) {
      return { error: new Error('Please enter your registered email address.') };
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) return { error: new Error(error.message) };
      return { error: null };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    setUser(null);
    setIsAuthenticated(false);
    await AsyncStorage.removeItem('agrime_mobile_profile');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        setUserRole,
        updateProfile,
        signIn,
        signUp,
        signOut,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
