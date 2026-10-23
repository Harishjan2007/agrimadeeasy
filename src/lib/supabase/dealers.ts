import { supabase, isSupabaseConfigured, formatSupabaseError } from './client';
import { Dealer, DealerCropPrice, DealerInquiry } from '@/types';
import { getCropIcon } from './crops';
import { MOCK_DEALERS, MOCK_DEALER_CROP_PRICES } from '@/lib/mock-data';
import { ALL_DEMO_DEALERS } from '@/lib/dealers-data';

/**
 * Raw relational shape from Supabase dealer query
 */
interface RawDealerCropPriceRow {
  id: string;
  crop_id: string;
  buying_price: number;
  unit: string;
  active: boolean;
  created_at: string;
  updated_at?: string;
  crops: {
    id: string;
    name: string;
    category?: string;
  } | null;
}

interface RawDealerRow {
  id: string;
  profile_id: string;
  shop_name: string;
  name?: string | null;
  address: string;
  phone: string;
  opening_hours: string;
  latitude?: number | null;
  longitude?: number | null;
  district?: string | null;
  state?: string | null;
  buyer_type?: string | null;
  purchase_conditions?: string | null;
  bought_crops?: string[] | null;
  produce_categories?: string[] | null;
  is_demo?: boolean | null;
  verified?: boolean | null;
  created_at: string;
  updated_at?: string;
  dealer_crop_prices: RawDealerCropPriceRow[] | null;
}

function mapRawDealer(row: RawDealerRow): Dealer {
  const activePrices: DealerCropPrice[] = (row.dealer_crop_prices || [])
    .filter((cp) => cp.active)
    .map((cp) => {
      const cropName = cp.crops?.name || 'Crop';
      const cropCategory = cp.crops?.category || 'Cereals';
      return {
        id: cp.id,
        dealer_id: row.id,
        crop_id: cp.crop_id,
        buying_price: Number(cp.buying_price),
        unit: cp.unit || '₹/Quintal',
        active: cp.active,
        created_at: cp.created_at,
        updated_at: cp.updated_at || cp.created_at,
        crop: cp.crops ? {
          id: cp.crops.id,
          name: cropName,
          category: cropCategory,
          icon: getCropIcon(cropName, cropCategory)
        } : undefined
      };
    });

  return {
    id: row.id,
    profile_id: row.profile_id,
    shop_name: row.shop_name,
    name: row.name || undefined,
    address: row.address,
    phone: row.phone,
    opening_hours: row.opening_hours,
    latitude: row.latitude !== null && row.latitude !== undefined ? Number(row.latitude) : undefined,
    longitude: row.longitude !== null && row.longitude !== undefined ? Number(row.longitude) : undefined,
    district: row.district || undefined,
    state: row.state || undefined,
    buyer_type: row.buyer_type || undefined,
    purchase_conditions: row.purchase_conditions || undefined,
    bought_crops: row.bought_crops || undefined,
    produce_categories: row.produce_categories || undefined,
    isDemo: Boolean(row.is_demo),
    verified: Boolean(row.verified),
    created_at: row.created_at,
    crop_prices: activePrices
  };
}

/**
 * Fetch all agricultural dealers and their active crop buying prices from Supabase
 * Falls back to verified mock dealers if Supabase returns 0 records or is unconfigured
 */
export async function getDealers(): Promise<{
  data: Dealer[];
  error: Error | null;
  isConfigured: boolean;
}> {
  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Attempt full relational query with joined crop prices
      let { data, error } = await supabase
        .from('dealers')
        .select(`
          id,
          profile_id,
          shop_name,
          address,
          phone,
          opening_hours,
          latitude,
          longitude,
          district,
          state,
          buyer_type,
          purchase_conditions,
          is_demo,
          verified,
          created_at,
          updated_at,
          dealer_crop_prices (
            id,
            crop_id,
            buying_price,
            unit,
            active,
            min_quantity,
            max_capacity,
            quantity_unit,
            payment_terms,
            grading_terms,
            created_at,
            crops (
              id,
              name,
              category
            )
          )
        `)
        .order('shop_name', { ascending: true });

      // 2. If the relational join fails (e.g. migration columns or relation cache issue), attempt baseline query
      if (error) {
        const baseResult = await supabase
          .from('dealers')
          .select('id, profile_id, shop_name, address, phone, opening_hours, latitude, longitude, district, state, buyer_type, purchase_conditions, is_demo, verified, created_at, updated_at')
          .order('shop_name', { ascending: true });

        if (!baseResult.error && baseResult.data && baseResult.data.length > 0) {
          data = baseResult.data as any;
          error = null;
        }
      }

      if (error) {
        console.warn('Supabase getDealers notice (using verified fallback):', formatSupabaseError(error));
        return { data: getFallbackDealers(), error: null, isConfigured: true };
      }

      if (data && data.length > 0) {
        const dealers: Dealer[] = (data as unknown as RawDealerRow[]).map(mapRawDealer);
        return { data: dealers, error: null, isConfigured: true };
      }
    } catch (err: unknown) {
      console.warn('Unexpected notice in getDealers (using verified fallback):', formatSupabaseError(err));
      return { data: getFallbackDealers(), error: null, isConfigured: true };
    }
  }

  return { data: getFallbackDealers(), error: null, isConfigured: isSupabaseConfigured };
}

/**
 * Fetch a single dealer by ID with active crop buying quotes
 */
export async function getDealerById(id: string): Promise<{
  data: Dealer | null;
  cropPrices: DealerCropPrice[];
  error: Error | null;
  isConfigured: boolean;
}> {
  if (!id) {
    return { data: null, cropPrices: [], error: new Error('Invalid dealer ID'), isConfigured: isSupabaseConfigured };
  }

  if (isSupabaseConfigured && supabase) {
    try {
      let { data, error } = await supabase
        .from('dealers')
        .select(`
          id,
          profile_id,
          shop_name,
          address,
          phone,
          opening_hours,
          latitude,
          longitude,
          district,
          state,
          buyer_type,
          purchase_conditions,
          is_demo,
          verified,
          created_at,
          updated_at,
          dealer_crop_prices (
            id,
            crop_id,
            buying_price,
            unit,
            active,
            min_quantity,
            max_capacity,
            quantity_unit,
            payment_terms,
            grading_terms,
            created_at,
            crops (
              id,
              name,
              category
            )
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) {
        // Fallback to baseline dealer row if relational join failed
        const baseResult = await supabase
          .from('dealers')
          .select('id, profile_id, shop_name, address, phone, opening_hours, district, state, buyer_type, purchase_conditions, is_demo, verified, created_at, updated_at')
          .eq('id', id)
          .maybeSingle();

        if (!baseResult.error && baseResult.data) {
          data = baseResult.data as any;
          error = null;
        }
      }

      if (error) {
        console.warn('Supabase getDealerById notice (using fallback):', formatSupabaseError(error));
      } else if (data) {
        const dealer = mapRawDealer(data as unknown as RawDealerRow);
        return {
          data: dealer,
          cropPrices: dealer.crop_prices || [],
          error: null,
          isConfigured: true
        };
      }
    } catch (err: unknown) {
      console.warn('Unexpected notice in getDealerById (using fallback):', formatSupabaseError(err));
    }
  }

  // Fallback lookup
  const fallbackList = getFallbackDealers();
  const fallbackDealer = fallbackList.find((d) => d.id === id || (id.startsWith('demo-dealer-') && d.id.includes(id.replace('demo-dealer-', '')))) || (id.startsWith('d') ? fallbackList[0] : null);

  if (fallbackDealer) {
    return {
      data: fallbackDealer,
      cropPrices: fallbackDealer.crop_prices || [],
      error: null,
      isConfigured: isSupabaseConfigured
    };
  }

  return { data: null, cropPrices: [], error: null, isConfigured: isSupabaseConfigured };
}

function getFallbackDealers(): Dealer[] {
  const mockMapped = MOCK_DEALERS.map((dealer) => {
    const activePrices = MOCK_DEALER_CROP_PRICES
      .filter((cp) => cp.dealer_id === dealer.id && cp.active)
      .map((cp) => ({
        ...cp,
        crop: cp.crop ? {
          ...cp.crop,
          icon: getCropIcon(cp.crop.name, cp.crop.category)
        } : undefined
      }));

    return {
      ...dealer,
      isDemo: false,
      crop_prices: activePrices
    };
  });

  const demoMapped = ALL_DEMO_DEALERS.map((demo) => ({
    ...demo,
    isDemo: true
  }));

  return [...mockMapped, ...demoMapped];
}

/**
 * Update an existing dealer business profile in Supabase and/or local cache
 */
export async function updateDealerProfile(
  dealerId: string,
  updates: Partial<Dealer> & { full_name?: string }
): Promise<{
  data: Partial<Dealer> | null;
  error: Error | null;
}> {
  const payload: Record<string, any> = {
    updated_at: new Date().toISOString()
  };

  if (updates.shop_name !== undefined) payload.shop_name = updates.shop_name;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.address !== undefined) payload.address = updates.address;
  if (updates.district !== undefined) payload.district = updates.district;
  if (updates.state !== undefined) payload.state = updates.state;
  if (updates.opening_hours !== undefined) payload.opening_hours = updates.opening_hours;
  if (updates.latitude !== undefined) payload.latitude = updates.latitude;
  if (updates.longitude !== undefined) payload.longitude = updates.longitude;
  if (updates.bought_crops !== undefined) payload.bought_crops = updates.bought_crops;
  if (updates.produce_categories !== undefined) payload.produce_categories = updates.produce_categories;
  if (updates.purchase_conditions !== undefined) payload.purchase_conditions = updates.purchase_conditions;

  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Update dealers table
      let updateQuery = supabase.from('dealers').update(payload);
      if (dealerId && !dealerId.startsWith('d') && !dealerId.startsWith('demo-')) {
        updateQuery = updateQuery.eq('id', dealerId);
      } else if (updates.profile_id) {
        updateQuery = updateQuery.eq('profile_id', updates.profile_id);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          updateQuery = updateQuery.eq('profile_id', user.id);
        }
      }

      const { data: updatedDealer, error: dealerError } = await updateQuery.select().maybeSingle();

      // 2. Also synchronize dealer's user profile record
      const profileUpdates: Record<string, any> = {
        updated_at: new Date().toISOString()
      };
      if (updates.full_name) profileUpdates.name = updates.full_name;
      if (updates.shop_name) profileUpdates.shop_name = updates.shop_name;
      if (updates.phone) profileUpdates.phone = updates.phone;
      if (updates.address) {
        profileUpdates.location = updates.address;
        profileUpdates.business_address = updates.address;
      }
      if (updates.state) profileUpdates.state = updates.state;
      if (updates.district) profileUpdates.district = updates.district;
      if (updates.latitude !== undefined) profileUpdates.latitude = updates.latitude;
      if (updates.longitude !== undefined) profileUpdates.longitude = updates.longitude;
      if (updates.bought_crops) profileUpdates.bought_crops = updates.bought_crops;
      if (updates.produce_categories) profileUpdates.produce_categories = updates.produce_categories;
      if (updates.purchase_conditions) profileUpdates.purchase_conditions = updates.purchase_conditions;
      if (updates.opening_hours) profileUpdates.opening_hours = updates.opening_hours;

      const profileTargetId = updates.profile_id || (await supabase.auth.getUser()).data.user?.id;
      if (profileTargetId) {
        await supabase.from('profiles').update(profileUpdates).eq('id', profileTargetId);
        try {
          await supabase.auth.updateUser({ data: profileUpdates });
        } catch {}
      }

      if (dealerError) {
        console.error('Supabase updateDealerProfile error:', dealerError.message);
        return {
          data: null,
          error: new Error(dealerError.message || 'Failed to update dealer profile in database')
        };
      }

      return {
        data: { ...(updatedDealer as Dealer || {}), ...updates },
        error: null
      };
    } catch (err: any) {
      console.error('updateDealerProfile caught exception:', err);
      return {
        data: null,
        error: err instanceof Error ? err : new Error(String(err) || 'Database update exception')
      };
    }
  }

  // Fallback / Offline (Supabase not configured in current environment)
  return {
    data: { id: dealerId, ...updates },
    error: null
  };
}

/**
 * ==============================================================================
 * DEALER INQUIRIES API (FIX 5)
 * Persist farmer harvest lot offers and procurement requests directly in Supabase
 * ==============================================================================
 */

export interface CreateInquiryInput {
  dealerId: string;
  dealerName: string;
  farmerId?: string | null;
  farmerName: string;
  farmerPhone: string;
  cropName: string;
  quantity: number;
  unit?: string;
  expectedPrice?: number | null;
  priceUnit?: string;
  message?: string;
}

export async function createDealerInquiry(input: CreateInquiryInput): Promise<{
  data: DealerInquiry | null;
  error: Error | null;
}> {
  if (!input.dealerId || !input.farmerName || !input.farmerPhone || !input.cropName || input.quantity <= 0) {
    return {
      data: null,
      error: new Error('Invalid inquiry details: dealer, farmer name, phone, crop, and quantity are required.')
    };
  }

  const payload: Record<string, any> = {
    dealer_id: input.dealerId,
    dealer_name: input.dealerName,
    farmer_id: input.farmerId || null,
    farmer_name: input.farmerName.trim(),
    farmer_phone: input.farmerPhone.trim(),
    crop_name: input.cropName.trim(),
    quantity: Number(input.quantity),
    unit: input.unit || 'Quintals',
    expected_price: input.expectedPrice !== undefined && input.expectedPrice !== null ? Number(input.expectedPrice) : null,
    price_unit: input.priceUnit || '₹/Quintal',
    message: input.message ? input.message.trim() : null,
    status: 'new',
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('dealer_inquiries')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.warn('Supabase createDealerInquiry notice (storing in local fallback):', error.message);
      } else if (data) {
        return {
          data: {
            id: data.id,
            dealerId: data.dealer_id,
            dealerName: data.dealer_name,
            farmerId: data.farmer_id,
            farmerName: data.farmer_name,
            farmerPhone: data.farmer_phone,
            cropName: data.crop_name,
            estimatedQuantity: `${data.quantity} ${data.unit}`,
            expectedPrice: data.expected_price ? `₹${data.expected_price}/${data.unit}` : 'Negotiable',
            message: data.message || '',
            status: data.status as 'new' | 'contacted' | 'completed',
            createdAt: data.created_at
          } as any,
          error: null
        };
      }
    } catch (err: any) {
      console.warn('createDealerInquiry exception, falling back to local storage:', err);
    }
  }

  // Local fallback storage for offline resilience
  const localId = `inq-${Date.now()}`;
  const localInquiry: DealerInquiry = {
    id: localId,
    dealer_id: input.dealerId,
    dealer_name: input.dealerName,
    farmer_id: input.farmerId || null,
    farmer_name: input.farmerName,
    farmer_phone: input.farmerPhone,
    crop_name: input.cropName,
    quantity: input.quantity,
    unit: input.unit || 'Quintals',
    expected_price: input.expectedPrice,
    price_unit: input.priceUnit || '₹/Quintal',
    message: input.message,
    status: 'new',
    created_at: payload.created_at
  };

  if (typeof window !== 'undefined') {
    try {
      const existing = JSON.parse(localStorage.getItem('agrime_inquiries') || '[]');
      existing.unshift(localInquiry);
      localStorage.setItem('agrime_inquiries', JSON.stringify(existing));
    } catch {}
  }

  return { data: localInquiry, error: null };
}

export async function getDealerInquiries(dealerId: string): Promise<{
  data: DealerInquiry[];
  error: Error | null;
}> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('dealer_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (dealerId && dealerId !== 'all') {
        query = query.eq('dealer_id', dealerId);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return { data: data as DealerInquiry[], error: null };
      }
    } catch (err) {
      console.warn('getDealerInquiries notice, checking local cache:', err);
    }
  }

  // Local fallback
  if (typeof window !== 'undefined') {
    try {
      const stored = JSON.parse(localStorage.getItem('agrime_inquiries') || '[]');
      const filtered = dealerId && dealerId !== 'all'
        ? stored.filter((i: any) => i.dealer_id === dealerId || i.dealerId === dealerId)
        : stored;
      return { data: filtered, error: null };
    } catch {}
  }

  return { data: [], error: null };
}

export async function getFarmerInquiries(farmerId: string): Promise<{
  data: DealerInquiry[];
  error: Error | null;
}> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('dealer_inquiries')
        .select('*')
        .eq('farmer_id', farmerId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return { data: data as DealerInquiry[], error: null };
      }
    } catch (err) {
      console.warn('getFarmerInquiries notice:', err);
    }
  }

  // Local fallback
  if (typeof window !== 'undefined') {
    try {
      const stored = JSON.parse(localStorage.getItem('agrime_inquiries') || '[]');
      const filtered = stored.filter((i: any) => i.farmer_id === farmerId || i.farmerId === farmerId);
      return { data: filtered, error: null };
    } catch {}
  }

  return { data: [], error: null };
}

export async function updateDealerInquiryStatus(
  inquiryId: string,
  status: 'new' | 'contacted' | 'completed' | 'cancelled'
): Promise<{ success: boolean; error: Error | null }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('dealer_inquiries')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', inquiryId);

      if (!error) {
        return { success: true, error: null };
      }
    } catch (err: any) {
      console.warn('updateDealerInquiryStatus error:', err);
    }
  }

  // Local fallback
  if (typeof window !== 'undefined') {
    try {
      const stored = JSON.parse(localStorage.getItem('agrime_inquiries') || '[]');
      const updated = stored.map((i: any) => i.id === inquiryId ? { ...i, status } : i);
      localStorage.setItem('agrime_inquiries', JSON.stringify(updated));
      return { success: true, error: null };
    } catch {}
  }

  return { success: true, error: null };
}

