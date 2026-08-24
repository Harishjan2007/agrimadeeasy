import { supabase, isSupabaseConfigured } from './client';
import { Profile, UserRole } from '@/types';

export interface SignUpData {
  name: string;
  email: string;
  password: string;
  phone: string;
  location: string;
  role: UserRole;
}

export interface SignInData {
  email: string;
  password: string;
}

/**
 * Register a new user with Supabase Email/Password authentication
 * Automatically creates matching profile record in 'profiles' table.
 */
export async function signUpUser(data: SignUpData): Promise<{ user: any; profile: Profile | null; error: Error | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      user: null,
      profile: null,
      error: new Error('Supabase is not configured yet. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.')
    };
  }

  try {
    // 1. Create Supabase Auth User
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          phone: data.phone,
          location: data.location,
          role: data.role
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No user returned from signup.');

    // 2. Ensure matching profile row in 'profiles'
    const newProfile: Profile = {
      id: authData.user.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      location: data.location,
      created_at: new Date().toISOString()
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(newProfile, { onConflict: 'id' });

    if (profileError) {
      console.warn('Profile upsert warning:', profileError);
    }

    return { user: authData.user, profile: newProfile, error: null };
  } catch (err: any) {
    return { user: null, profile: null, error: err };
  }
}

/**
 * Sign in existing user with Email/Password
 */
export async function signInUser(data: SignInData): Promise<{ user: any; profile: Profile | null; error: Error | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      user: null,
      profile: null,
      error: new Error('Supabase is not configured yet. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.')
    };
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Sign in failed.');

    // Fetch user profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    return {
      user: authData.user,
      profile: (profileData as Profile) || null,
      error: null
    };
  } catch (err: any) {
    return { user: null, profile: null, error: err };
  }
}

/**
 * Sign out current authenticated session
 */
export async function signOutUser(): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { error: null };
  }

  try {
    const { error } = await supabase.auth.signOut();
    return { error: error ? new Error(error.message) : null };
  } catch (err: any) {
    return { error: err };
  }
}

/**
 * Retrieve current active user profile
 */
export async function getCurrentUserProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return profile as Profile;
  } catch (e) {
    return null;
  }
}

/**
 * Update current user profile fields (name, phone, location)
 * Strictly prevents changing role or auth email from the profile update form
 */
export async function updateUserProfile(
  userId: string,
  updates: { name: string; phone: string; location: string }
): Promise<{ profile: Profile | null; error: Error | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      profile: null,
      error: new Error('Supabase is not configured.')
    };
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        name: updates.name,
        phone: updates.phone,
        location: updates.location,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) throw error;
    return { profile: data as Profile, error: null };
  } catch (err: any) {
    return { profile: null, error: err };
  }
}
