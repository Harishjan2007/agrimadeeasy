import { supabase, isSupabaseConfigured } from './client';
import { Profile, UserRole, OnboardingUserType } from '@/types';

export interface SignUpData {
  name: string;
  email: string;
  password: string;
  phone: string;
  location: string;
  role: UserRole;
  userType?: OnboardingUserType;
  state?: string;
  district?: string;
  // Farmer fields
  primaryCrops?: string[];
  mainInterests?: string[];
  // Dealer fields
  shopName?: string;
  businessAddress?: string;
  latitude?: number | null;
  longitude?: number | null;
  boughtCrops?: string[];
  produceCategories?: string[];
  purchaseConditions?: string;
  openingHours?: string;
  // Machinery Provider fields
  providerName?: string;
  machineryTypes?: string[];
  pricePerHour?: number;
  primaryMachineName?: string;
  rentalTerms?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export function setAuthCookie() {
  if (typeof document !== 'undefined') {
    document.cookie = 'agrime_auth=true; path=/; max-age=604800; SameSite=Lax';
  }
}

export function clearAuthCookie() {
  if (typeof document !== 'undefined') {
    document.cookie = 'agrime_auth=; path=/; max-age=0; SameSite=Lax';
  }
}

/**
 * Register a new user with Supabase Email/Password authentication
 * Automatically creates matching profile record in 'profiles' table,
 * and sets up dealer or machinery provider records based on the selected role.
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
    // 1. Create Supabase Auth User with rich role-specific onboarding metadata
    const userTypeMapped: OnboardingUserType = 
      data.role === 'dealer' ? 'Dealer' : data.role === 'machinery_provider' ? 'Other' : 'Farmer';

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          phone: data.phone,
          location: data.location,
          role: data.role,
          user_type: data.userType || userTypeMapped,
          state: data.state || '',
          district: data.district || '',
          // Farmer specific metadata
          primary_crops: data.primaryCrops || [],
          main_interests: data.mainInterests || [],
          // Dealer specific metadata
          shop_name: data.shopName || '',
          business_address: data.businessAddress || '',
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          bought_crops: data.boughtCrops || [],
          produce_categories: data.produceCategories || [],
          purchase_conditions: data.purchaseConditions || '',
          opening_hours: data.openingHours || '',
          // Machinery Provider metadata
          provider_name: data.providerName || '',
          machinery_types: data.machineryTypes || [],
          price_per_hour: data.pricePerHour ?? null,
          primary_machine_name: data.primaryMachineName || '',
          rental_terms: data.rentalTerms || ''
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No user returned from signup.');

    // 2. Ensure matching profile object with full role-specific fields
    const newProfile: Profile = {
      id: authData.user.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      location: data.location,
      user_type: data.userType || userTypeMapped,
      state: data.state || '',
      district: data.district || '',
      primary_crops: data.primaryCrops || [],
      main_interests: data.mainInterests || [],
      shop_name: data.shopName,
      business_address: data.businessAddress,
      latitude: data.latitude ?? undefined,
      longitude: data.longitude ?? undefined,
      bought_crops: data.boughtCrops,
      produce_categories: data.produceCategories,
      purchase_conditions: data.purchaseConditions,
      opening_hours: data.openingHours,
      provider_name: data.providerName,
      machinery_types: data.machineryTypes,
      price_per_hour: data.pricePerHour,
      rental_terms: data.rentalTerms,
      created_at: new Date().toISOString()
    };

    // Save core compatible fields and extended onboarding attributes to Supabase profiles table
    const dbProfile: Record<string, any> = {
      id: authData.user.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      location: data.location,
      created_at: new Date().toISOString()
    };
    if (data.state) dbProfile.state = data.state;
    if (data.district) dbProfile.district = data.district;
    if (data.primaryCrops && data.primaryCrops.length > 0) dbProfile.primary_crops = data.primaryCrops;
    if (data.mainInterests && data.mainInterests.length > 0) dbProfile.main_interests = data.mainInterests;

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(dbProfile, { onConflict: 'id' });

    if (profileError) {
      console.error('Profile upsert error:', profileError);
      return { user: authData.user, profile: null, error: new Error(profileError.message || 'Failed to persist user profile to database') };
    }

    // 3. If Dealer role, create matching record in 'dealers' table with all collected onboarding business fields
    if (data.role === 'dealer') {
      try {
        const dealerRow = {
          profile_id: authData.user.id,
          shop_name: data.shopName || data.name,
          address: data.businessAddress || data.location,
          phone: data.phone,
          opening_hours: data.openingHours || 'Mon - Sat: 7:00 AM - 7:30 PM',
          district: data.district || null,
          state: data.state || null,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          bought_crops: data.boughtCrops || [],
          produce_categories: data.produceCategories || [],
          purchase_conditions: data.purchaseConditions || null
        };
        const { error: dealerError } = await supabase.from('dealers').upsert(dealerRow, { onConflict: 'profile_id' });
        if (dealerError) {
          console.error('Dealer table upsert error:', dealerError);
          return { user: authData.user, profile: null, error: new Error(dealerError.message || 'Failed to persist dealer business details to database') };
        }
      } catch (dErr: any) {
        console.error('Could not persist dealer table row:', dErr);
        return { user: authData.user, profile: null, error: dErr instanceof Error ? dErr : new Error(String(dErr)) };
      }
    }

    // 4. If Machinery Provider role, create initial fleet record in 'machinery' table
    if (data.role === 'machinery_provider') {
      try {
        const primaryType = (data.machineryTypes && data.machineryTypes.length > 0 ? data.machineryTypes[0] : 'Tractor') as any;
        const machineRow = {
          provider_id: authData.user.id,
          name: data.primaryMachineName || `${data.providerName || data.name} - ${primaryType}`,
          type: primaryType,
          description: data.rentalTerms || 'Agricultural machinery available for field rental.',
          price_per_hour: data.pricePerHour || 750,
          location: data.location,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          available: true
        };
        const { error: machineError } = await supabase.from('machinery').insert(machineRow);
        if (machineError) {
          console.error('Machinery table insert error:', machineError);
          return { user: authData.user, profile: null, error: new Error(machineError.message || 'Failed to persist initial machinery record to database') };
        }
      } catch (mErr: any) {
        console.error('Could not persist machinery table row:', mErr);
        return { user: authData.user, profile: null, error: mErr instanceof Error ? mErr : new Error(String(mErr)) };
      }
    }

    // Persist full profile locally and synchronize auth cookie
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`agrime_profile_${authData.user.id}`, JSON.stringify(newProfile));
      } catch {}
      setAuthCookie();
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

    // Fetch user profile from DB
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    // Check cached local profile for rich onboarding answers
    let localProfile: Partial<Profile> = {};
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`agrime_profile_${authData.user.id}`);
        if (stored) localProfile = JSON.parse(stored);
      } catch {}
    }

    const meta = authData.user.user_metadata || {};
    const mergedProfile: Profile = {
      id: authData.user.id,
      name: profileData?.name || meta.name || data.email.split('@')[0],
      email: authData.user.email || data.email,
      phone: profileData?.phone || meta.phone || '',
      role: (profileData?.role || meta.role || 'farmer') as UserRole,
      location: profileData?.location || meta.location || '',
      user_type: meta.user_type || localProfile.user_type || 'Farmer',
      state: meta.state || localProfile.state || profileData?.state || '',
      district: meta.district || localProfile.district || profileData?.district || '',
      primary_crops: meta.primary_crops || localProfile.primary_crops || [],
      main_interests: meta.main_interests || localProfile.main_interests || [],
      // Dealer specific
      shop_name: meta.shop_name || localProfile.shop_name || profileData?.shop_name,
      business_address: meta.business_address || localProfile.business_address || profileData?.business_address,
      latitude: meta.latitude ?? localProfile.latitude ?? profileData?.latitude,
      longitude: meta.longitude ?? localProfile.longitude ?? profileData?.longitude,
      bought_crops: meta.bought_crops || localProfile.bought_crops || profileData?.bought_crops,
      produce_categories: meta.produce_categories || localProfile.produce_categories || profileData?.produce_categories,
      purchase_conditions: meta.purchase_conditions || localProfile.purchase_conditions || profileData?.purchase_conditions,
      opening_hours: meta.opening_hours || localProfile.opening_hours || profileData?.opening_hours,
      // Machinery Provider specific
      provider_name: meta.provider_name || localProfile.provider_name || profileData?.provider_name,
      machinery_types: meta.machinery_types || localProfile.machinery_types || profileData?.machinery_types,
      price_per_hour: meta.price_per_hour ?? localProfile.price_per_hour ?? profileData?.price_per_hour,
      rental_terms: meta.rental_terms || localProfile.rental_terms || profileData?.rental_terms,
      created_at: profileData?.created_at || new Date().toISOString()
    };

    setAuthCookie();

    return {
      user: authData.user,
      profile: mergedProfile,
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
  clearAuthCookie();
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

    let localProfile: Partial<Profile> = {};
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`agrime_profile_${user.id}`);
        if (stored) localProfile = JSON.parse(stored);
      } catch {}
    }

    const meta = user.user_metadata || {};
    return {
      ...(profile as Profile),
      user_type: meta.user_type || localProfile.user_type || profile?.user_type || 'Farmer',
      state: meta.state || localProfile.state || profile?.state || '',
      district: meta.district || localProfile.district || profile?.district || '',
      primary_crops: meta.primary_crops || localProfile.primary_crops || profile?.primary_crops || [],
      main_interests: meta.main_interests || localProfile.main_interests || profile?.main_interests || [],
      // Dealer specific
      shop_name: meta.shop_name || localProfile.shop_name || profile?.shop_name,
      business_address: meta.business_address || localProfile.business_address || profile?.business_address,
      latitude: meta.latitude ?? localProfile.latitude ?? profile?.latitude,
      longitude: meta.longitude ?? localProfile.longitude ?? profile?.longitude,
      bought_crops: meta.bought_crops || localProfile.bought_crops || profile?.bought_crops,
      produce_categories: meta.produce_categories || localProfile.produce_categories || profile?.produce_categories,
      purchase_conditions: meta.purchase_conditions || localProfile.purchase_conditions || profile?.purchase_conditions,
      opening_hours: meta.opening_hours || localProfile.opening_hours || profile?.opening_hours,
      // Machinery Provider specific
      provider_name: meta.provider_name || localProfile.provider_name || profile?.provider_name,
      machinery_types: meta.machinery_types || localProfile.machinery_types || profile?.machinery_types,
      price_per_hour: meta.price_per_hour ?? localProfile.price_per_hour ?? profile?.price_per_hour,
      rental_terms: meta.rental_terms || localProfile.rental_terms || profile?.rental_terms
    };
  } catch (e) {
    return null;
  }
}

/**
 * Update current user profile fields
 * Strictly prevents changing role or auth email from the profile update form
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    name: string;
    phone: string;
    location: string;
    user_type?: OnboardingUserType;
    state?: string;
    district?: string;
    primary_crops?: string[];
    main_interests?: string[];
    // Dealer fields
    shop_name?: string;
    business_address?: string;
    latitude?: number | null;
    longitude?: number | null;
    bought_crops?: string[];
    produce_categories?: string[];
    purchase_conditions?: string;
    opening_hours?: string;
    // Machinery Provider fields
    provider_name?: string;
    machinery_types?: string[];
    price_per_hour?: number;
    rental_terms?: string;
  }
): Promise<{ profile: Profile | null; error: Error | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      profile: null,
      error: new Error('Supabase is not configured.')
    };
  }

  try {
    // 1. Update basic DB columns in profiles table
    const dbUpdates: Record<string, any> = {
      name: updates.name,
      phone: updates.phone,
      location: updates.location,
      updated_at: new Date().toISOString()
    };
    if (updates.state) dbUpdates.state = updates.state;
    if (updates.district) dbUpdates.district = updates.district;

    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId)
      .select('*')
      .single();

    if (error) throw error;

    // 2. Also update Supabase auth metadata to preserve rich fields
    try {
      await supabase.auth.updateUser({
        data: {
          name: updates.name,
          phone: updates.phone,
          location: updates.location,
          user_type: updates.user_type,
          state: updates.state,
          district: updates.district,
          primary_crops: updates.primary_crops,
          main_interests: updates.main_interests,
          shop_name: updates.shop_name,
          business_address: updates.business_address,
          latitude: updates.latitude,
          longitude: updates.longitude,
          bought_crops: updates.bought_crops,
          produce_categories: updates.produce_categories,
          purchase_conditions: updates.purchase_conditions,
          opening_hours: updates.opening_hours,
          provider_name: updates.provider_name,
          machinery_types: updates.machinery_types,
          price_per_hour: updates.price_per_hour,
          rental_terms: updates.rental_terms
        }
      });
    } catch {}

    const fullProfile: Profile = {
      ...(data as Profile),
      user_type: updates.user_type || (data as any).user_type,
      state: updates.state || (data as any).state,
      district: updates.district || (data as any).district,
      primary_crops: updates.primary_crops || (data as any).primary_crops,
      main_interests: updates.main_interests || (data as any).main_interests,
      shop_name: updates.shop_name || (data as any).shop_name,
      business_address: updates.business_address || (data as any).business_address,
      latitude: updates.latitude !== undefined ? (updates.latitude ?? undefined) : (data as any).latitude,
      longitude: updates.longitude !== undefined ? (updates.longitude ?? undefined) : (data as any).longitude,
      bought_crops: updates.bought_crops || (data as any).bought_crops,
      produce_categories: updates.produce_categories || (data as any).produce_categories,
      purchase_conditions: updates.purchase_conditions || (data as any).purchase_conditions,
      opening_hours: updates.opening_hours || (data as any).opening_hours,
      provider_name: updates.provider_name || (data as any).provider_name,
      machinery_types: updates.machinery_types || (data as any).machinery_types,
      price_per_hour: updates.price_per_hour ?? (data as any).price_per_hour,
      rental_terms: updates.rental_terms || (data as any).rental_terms
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`agrime_profile_${userId}`, JSON.stringify(fullProfile));
      } catch {}
    }

    return { profile: fullProfile, error: null };
  } catch (err: any) {
    return { profile: null, error: err };
  }
}
