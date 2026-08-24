import { supabase, isSupabaseConfigured } from './client';
import { Dealer, DealerCropPrice } from '@/types';
import { getCropIcon } from './crops';
import { MOCK_DEALERS, MOCK_DEALER_CROP_PRICES } from '@/lib/mock-data';

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
  address: string;
  phone: string;
  opening_hours: string;
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
    address: row.address,
    phone: row.phone,
    opening_hours: row.opening_hours,
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
      const { data, error } = await supabase
        .from('dealers')
        .select(`
          id,
          profile_id,
          shop_name,
          address,
          phone,
          opening_hours,
          created_at,
          updated_at,
          dealer_crop_prices (
            id,
            crop_id,
            buying_price,
            unit,
            active,
            created_at,
            crops (
              id,
              name,
              category
            )
          )
        `)
        .order('shop_name', { ascending: true });

      if (error) {
        console.error('Supabase getDealers error, using fallback:', error);
        return { data: getFallbackDealers(), error: null, isConfigured: true };
      }

      if (data && data.length > 0) {
        const dealers: Dealer[] = (data as unknown as RawDealerRow[]).map(mapRawDealer);
        return { data: dealers, error: null, isConfigured: true };
      }
    } catch (err: unknown) {
      console.error('Unexpected error in getDealers, using fallback:', err);
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
      const { data, error } = await supabase
        .from('dealers')
        .select(`
          id,
          profile_id,
          shop_name,
          address,
          phone,
          opening_hours,
          created_at,
          updated_at,
          dealer_crop_prices (
            id,
            crop_id,
            buying_price,
            unit,
            active,
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
        console.error('Supabase getDealerById error, using fallback:', error);
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
      console.error('Unexpected error in getDealerById, using fallback:', err);
    }
  }

  // Fallback lookup
  const fallbackList = getFallbackDealers();
  const fallbackDealer = fallbackList.find((d) => d.id === id) || (id.startsWith('d') ? fallbackList[0] : null);

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
  return MOCK_DEALERS.map((dealer) => {
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
      crop_prices: activePrices
    };
  });
}
