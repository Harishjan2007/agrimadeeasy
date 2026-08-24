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

  const refreshProfile = useCallback(async (): Promise<Profile | null> => {
    if (!isSupabaseConfigured || !supabase) return null;
    const client = supabase;
    try {
      const { data: { user: currentUser } } = await client.auth.getUser();
      if (!currentUser) {
        setUser(null);
        setProfile(null);
        setRole(null);
        return null;
      }

      setUser(currentUser);
      const userProfile = await fetchProfile(currentUser.id);
      setProfile(userProfile);
      
      const userRole = (userProfile?.role || currentUser.user_metadata?.role || 'farmer') as UserRole;
      setRole(userRole);
      return userProfile;
    } catch (e) {
      return null;
    }
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      await client.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setRole(null);
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured || !supabase) {
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
          const userProfile = await fetchProfile(session.user.id);
          if (isMounted) {
            setProfile(userProfile);
            const userRole = (userProfile?.role || session.user.user_metadata?.role || 'farmer') as UserRole;
            setRole(userRole);
          }
        } else {
          setUser(null);
          setProfile(null);
          setRole(null);
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
      } else if (session?.user) {
        setUser(session.user);
        const userProfile = await fetchProfile(session.user.id);
        if (isMounted) {
          setProfile(userProfile);
          const userRole = (userProfile?.role || session.user.user_metadata?.role || 'farmer') as UserRole;
          setRole(userRole);
          setLoading(false);
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
