import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export type UserRole = 'farmer' | 'machinery_provider' | 'dealer' | 'buyer';

export interface MobileUserProfile {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  location: string;
  district: string;
}

const DEFAULT_PROFILE: MobileUserProfile = {
  id: 'usr-farmer-demo',
  name: 'Muthukumar S.',
  phone: '+91 98421 55678',
  role: 'farmer',
  location: 'Thanjavur Delta Road',
  district: 'Thanjavur'
};

interface AuthContextType {
  user: MobileUserProfile;
  isAuthenticated: boolean;
  setUserRole: (role: UserRole) => void;
  updateProfile: (profile: Partial<MobileUserProfile>) => void;
  signIn: (emailOrPhone: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: DEFAULT_PROFILE,
  isAuthenticated: true,
  setUserRole: () => {},
  updateProfile: () => {},
  signIn: async () => {},
  signOut: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<MobileUserProfile>(DEFAULT_PROFILE);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  useEffect(() => {
    // Load persisted mobile profile
    AsyncStorage.getItem('agrime_mobile_profile').then((data) => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          setUser(parsed);
        } catch (e) {}
      }
    });

    // Check supabase auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsAuthenticated(true);
      }
    });
  }, []);

  const setUserRole = (role: UserRole) => {
    const updated = { ...user, role };
    setUser(updated);
    AsyncStorage.setItem('agrime_mobile_profile', JSON.stringify(updated)).catch(() => {});
  };

  const updateProfile = (partial: Partial<MobileUserProfile>) => {
    const updated = { ...user, ...partial };
    setUser(updated);
    AsyncStorage.setItem('agrime_mobile_profile', JSON.stringify(updated)).catch(() => {});
  };

  const signIn = async (emailOrPhone: string) => {
    setIsAuthenticated(true);
    const updated = { ...user, phone: emailOrPhone };
    setUser(updated);
    AsyncStorage.setItem('agrime_mobile_profile', JSON.stringify(updated)).catch(() => {});
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        setUserRole,
        updateProfile,
        signIn,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
