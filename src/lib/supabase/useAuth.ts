'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './client';
import { Profile, UserRole } from '@/types';
import { User } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  isConfigured: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    if (!isSupabaseConfigured || !supabase) return null;
    const client = supabase;
    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Could not fetch profile for user:', userId, error.message);
        return null;
      }
      return data as Profile;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  }, []);

  const enrichProfile = useCallback((baseProfile: Profile | null, currentUser: User): Profile => {
    let localProfile: Partial<Profile> = {};
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`agrime_profile_${currentUser.id}`);
        if (stored) localProfile = JSON.parse(stored);
      } catch {}
    }

    const meta = currentUser.user_metadata || {};
    return {
      id: currentUser.id,
      name: baseProfile?.name || meta.name || currentUser.email?.split('@')[0] || 'User',
      email: currentUser.email || baseProfile?.email || '',
      phone: baseProfile?.phone || meta.phone || '',
      role: (baseProfile?.role || meta.role || 'farmer') as UserRole,
      location: baseProfile?.location || meta.location || '',
      user_type: meta.user_type || localProfile.user_type || baseProfile?.user_type || 'Farmer',
      state: meta.state || localProfile.state || baseProfile?.state || '',
      district: meta.district || localProfile.district || baseProfile?.district || '',
      primary_crops: meta.primary_crops || localProfile.primary_crops || baseProfile?.primary_crops || [],
      main_interests: meta.main_interests || localProfile.main_interests || baseProfile?.main_interests || [],
      created_at: baseProfile?.created_at || new Date().toISOString()
    };
  }, []);

  const refreshProfile = useCallback(async (): Promise<Profile | null> => {
    if (!isSupabaseConfigured || !supabase) return null;
    const client = supabase;
    try {
      const { data: { user: currentUser } } = await client.auth.getUser();
      if (!currentUser) {
        setUser(null);
        setProfile(null);
        setRole(null);
        if (typeof document !== 'undefined') {
          document.cookie = 'agrime_auth=; path=/; max-age=0; SameSite=Lax';
        }
        return null;
      }

      setUser(currentUser);
      const rawProfile = await fetchProfile(currentUser.id);
      const enriched = enrichProfile(rawProfile, currentUser);
      setProfile(enriched);
      
      const userRole = enriched.role || 'farmer';
      setRole(userRole);
      if (typeof document !== 'undefined') {
        document.cookie = 'agrime_auth=true; path=/; max-age=604800; SameSite=Lax';
      }
      return enriched;
    } catch (e) {
      return null;
    }
  }, [fetchProfile, enrichProfile]);

  const signOut = useCallback(async () => {
    if (typeof document !== 'undefined') {
      document.cookie = 'agrime_auth=; path=/; max-age=0; SameSite=Lax';
      try {
        localStorage.removeItem('agrime_demo_session');
      } catch {}
    }
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      try {
        await client.auth.signOut();
      } catch {}
    }
    setUser(null);
    setProfile(null);
    setRole(null);
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured || !supabase) {
      setUser(null);
      setProfile(null);
      setRole(null);
      setLoading(false);
      return;
    }

    const client = supabase;

    const initAuth = async () => {
      try {
        const { data: { session } } = await client.auth.getSession();
        if (!isMounted) return;

        if (session?.user) {
          setUser(session.user);
          const rawProfile = await fetchProfile(session.user.id);
          if (isMounted) {
            const enriched = enrichProfile(rawProfile, session.user);
            setProfile(enriched);
            setRole(enriched.role);
            if (typeof document !== 'undefined') {
              document.cookie = 'agrime_auth=true; path=/; max-age=604800; SameSite=Lax';
            }
          }
        } else {
          if (isMounted) {
            setUser(null);
            setProfile(null);
            setRole(null);
            if (typeof document !== 'undefined') {
              document.cookie = 'agrime_auth=; path=/; max-age=0; SameSite=Lax';
            }
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Real-time auth listener
    const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setProfile(null);
        setRole(null);
        setLoading(false);
        if (typeof document !== 'undefined') {
          document.cookie = 'agrime_auth=; path=/; max-age=0; SameSite=Lax';
        }
      } else if (session?.user) {
        setUser(session.user);
        const rawProfile = await fetchProfile(session.user.id);
        if (isMounted) {
          const enriched = enrichProfile(rawProfile, session.user);
          setProfile(enriched);
          setRole(enriched.role);
          setLoading(false);
          if (typeof document !== 'undefined') {
            document.cookie = 'agrime_auth=true; path=/; max-age=604800; SameSite=Lax';
          }
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  return {
    user,
    profile,
    role,
    loading,
    isConfigured: isSupabaseConfigured,
    signOut,
    refreshProfile
  };
}
