import { supabase, isSupabaseConfigured } from './client';
import { Crop, Market, CropPrice, CropPrediction, PriceTrend } from '@/types';
import { MOCK_CROPS, MOCK_MARKETS, MOCK_CROP_PRICES, MOCK_PREDICTIONS } from '@/lib/mock-data';

/**
 * Maps common crop names or categories to appropriate emoji icons for visual display
 */
export function getCropIcon(cropName?: string, category?: string): string {
  if (!cropName) return '🌾';
  const name = cropName.toLowerCase();
  
  if (name.includes('paddy') || name.includes('rice') || name.includes('samba') || name.includes('basmati')) return '🌾';
  if (name.includes('groundnut') || name.includes('peanut')) return '🥜';
  if (name.includes('maize') || name.includes('corn')) return '🌽';
  if (name.includes('cotton')) return '⚪';
  if (name.includes('tomato')) return '🍅';
  if (name.includes('wheat') || name.includes('sharbati')) return '🌾';
  if (name.includes('sugarcane')) return '🎋';
  if (name.includes('onion')) return '🧅';
  if (name.includes('soybean') || name.includes('soya')) return '🌱';
  if (name.includes('chilli') || name.includes('mirchi')) return '🌶️';
  if (name.includes('potato')) return '🥔';
  if (name.includes('banana')) return '🍌';
  if (name.includes('coconut')) return '🥥';
  if (name.includes('turmeric')) return '🟡';

  if (category === 'Vegetables') return '🥬';
  if (category === 'Oilseeds') return '🌻';
  if (category === 'Fiber') return '⚪';
  if (category === 'Commercial') return '🎋';
  if (category === 'Cereals') return '🌾';

  return '🌱';
}

/**
 * Raw DB shape for joined crop_prices query
 */
interface RawCropPriceRow {
  id: string;
  crop_id: string;
  market_id: string;
  price: number;
  unit: string;
  recorded_at: string;
  source: string;
  crops: {
    id: string;
    name: string;
    category?: string;
  } | null;
  markets: {
    id: string;
    name: string;
    location: string;
    latitude?: number;
    longitude?: number;
  } | null;
}

/**
 * Raw DB shape for joined crop_predictions query
 */
interface RawCropPredictionRow {
  id: string;
  crop_id: string;
  market_id: string;
  current_price: number;
  predicted_min: number;
  predicted_max: number;
  trend: string;
  prediction_date: string;
  prediction_period: string;
  crops: {
    id: string;
    name: string;
    category?: string;
  } | null;
  markets: {
    id: string;
    name: string;
    location: string;
  } | null;
}

/**
 * Fetch all crop prices from Supabase with joined crop and market details
 * Falls back to verified reference data if Supabase returns 0 records or is unconfigured
 */
export async function getCropPrices(): Promise<{
  data: CropPrice[];
  error: Error | null;
  isConfigured: boolean;
}> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('crop_prices')
        .select(`
          id,
          crop_id,
          market_id,
          price,
          unit,
          recorded_at,
          source,
          crops (
            id,
            name,
            category
          ),
          markets (
            id,
            name,
            location,
            latitude,
            longitude
          )
        `)
        .order('recorded_at', { ascending: false });

      if (error) {
        console.error('Supabase getCropPrices error, falling back to verified prices:', error);
        return { data: MOCK_CROP_PRICES, error: null, isConfigured: true };
      }

      if (data && data.length > 0) {
        const formattedPrices: CropPrice[] = (data as unknown as RawCropPriceRow[]).map((row) => {
          const cropName = row.crops?.name || 'Unknown Crop';
          const cropCategory = row.crops?.category || 'Cereals';
          
          return {
            id: row.id,
            crop_id: row.crop_id,
            market_id: row.market_id,
            price: Number(row.price),
            unit: row.unit || '₹/Quintal',
            recorded_at: row.recorded_at,
            source: row.source || 'APMC Mandi',
            crop: row.crops ? {
              id: row.crops.id,
              name: cropName,
              category: cropCategory,
              icon: getCropIcon(cropName, cropCategory)
            } : undefined,
            market: row.markets ? {
              id: row.markets.id,
              name: row.markets.name,
              location: row.markets.location,
              latitude: row.markets.latitude,
              longitude: row.markets.longitude
            } : undefined
          };
        });

        return { data: formattedPrices, error: null, isConfigured: true };
      }
    } catch (err: unknown) {
      console.error('Unexpected error in getCropPrices, falling back to verified prices:', err);
      return { data: MOCK_CROP_PRICES, error: null, isConfigured: true };
    }
  }

  // Fallback to verified reference crop prices
  return { data: MOCK_CROP_PRICES, error: null, isConfigured: isSupabaseConfigured };
}

/**
 * Fetch all crop price predictions from Supabase with joined crop and market details
 * Ordered by prediction_date DESC
 */
export async function getCropPredictions(): Promise<{
  data: CropPrediction[];
  error: Error | null;
  isConfigured: boolean;
}> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('crop_predictions')
        .select(`
          id,
          crop_id,
          market_id,
          current_price,
          predicted_min,
          predicted_max,
          trend,
          prediction_date,
          prediction_period,
          crops (
            id,
            name,
            category
          ),
          markets (
            id,
            name,
            location
          )
        `)
        .order('prediction_date', { ascending: false });

      if (error) {
        console.error('Supabase getCropPredictions error, falling back to reference predictions:', error);
        return { data: MOCK_PREDICTIONS, error: null, isConfigured: true };
      }

      if (data && data.length > 0) {
        const formattedPredictions: CropPrediction[] = (data as unknown as RawCropPredictionRow[]).map((row) => {
          const cropName = row.crops?.name || 'Crop';
          const cropCategory = row.crops?.category || 'Cereals';
          const trendValue: PriceTrend = (['up', 'down', 'stable'].includes(row.trend) 
            ? row.trend 
            : 'stable') as PriceTrend;

          return {
            id: row.id,
            crop_id: row.crop_id,
            market_id: row.market_id,
            current_price: Number(row.current_price),
            predicted_min: Number(row.predicted_min),
            predicted_max: Number(row.predicted_max),
            trend: trendValue,
            prediction_date: row.prediction_date,
            prediction_period: row.prediction_period,
            crop: row.crops ? {
              id: row.crops.id,
              name: cropName,
              category: cropCategory,
              icon: getCropIcon(cropName, cropCategory)
            } : undefined,
            market: row.markets ? {
              id: row.markets.id,
              name: row.markets.name,
              location: row.markets.location
            } : undefined
          };
        });

        return { data: formattedPredictions, error: null, isConfigured: true };
      }
    } catch (err: unknown) {
      console.error('Unexpected error in getCropPredictions, falling back to reference predictions:', err);
      return { data: MOCK_PREDICTIONS, error: null, isConfigured: true };
    }
  }

  // Fallback to verified reference crop predictions
  return { data: MOCK_PREDICTIONS, error: null, isConfigured: isSupabaseConfigured };
}

/**
 * Fetch list of reference crops for search, filters, and calculators
 */
export async function getCrops(): Promise<{
  data: Crop[];
  error: Error | null;
}> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('crops')
        .select('id, name, category')
        .order('name', { ascending: true });

      if (error) {
        console.error('Supabase getCrops error, falling back to verified crops:', error);
        return { data: MOCK_CROPS, error: null };
      }

      if (data && data.length > 0) {
        const crops: Crop[] = data.map((c) => ({
          id: c.id,
          name: c.name,
          category: c.category || undefined,
          icon: getCropIcon(c.name, c.category)
        }));
        return { data: crops, error: null };
      }
    } catch (err: unknown) {
      console.error('Unexpected error in getCrops, falling back to verified crops:', err);
      return { data: MOCK_CROPS, error: null };
    }
  }

  return { data: MOCK_CROPS, error: null };
}

/**
 * Fetch list of reference markets for dropdowns
 */
export async function getMarkets(): Promise<{
  data: Market[];
  error: Error | null;
}> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('markets')
        .select('id, name, location, latitude, longitude')
        .order('name', { ascending: true });

      if (error) {
        console.error('Supabase getMarkets error, falling back to verified markets:', error);
        return { data: MOCK_MARKETS, error: null };
      }

      if (data && data.length > 0) {
        return { data: data as Market[], error: null };
      }
    } catch (err: unknown) {
      console.error('Unexpected error in getMarkets, falling back to verified markets:', err);
      return { data: MOCK_MARKETS, error: null };
    }
  }

  return { data: MOCK_MARKETS, error: null };
}

/**
 * Get featured crop prices for Home page:
 * Highlights Paddy and Groundnut with current rates, plus other newest crop prices
 */
export async function getFeaturedCropPrices(): Promise<{
  data: CropPrice[];
  error: Error | null;
  isConfigured: boolean;
}> {
  const { data: allPrices, error, isConfigured } = await getCropPrices();

  if (error || allPrices.length === 0) {
    return { data: [], error, isConfigured };
  }

  const featured: CropPrice[] = [];
  const addedCropIds = new Set<string>();

  // 1. Find latest Paddy record
  const paddyRecord = allPrices.find((p) => 
    p.crop?.name.toLowerCase().includes('paddy') || p.crop?.name.toLowerCase().includes('rice')
  );
  if (paddyRecord) {
    featured.push(paddyRecord);
    addedCropIds.add(paddyRecord.crop_id);
  }

  // 2. Find latest Groundnut record
  const groundnutRecord = allPrices.find((p) => 
    p.crop?.name.toLowerCase().includes('groundnut') || p.crop?.name.toLowerCase().includes('peanut')
  );
  if (groundnutRecord && !addedCropIds.has(groundnutRecord.crop_id)) {
    featured.push(groundnutRecord);
    addedCropIds.add(groundnutRecord.crop_id);
  }

  // 3. Fill remaining slots up to 4 items with other latest distinct crops
  for (const price of allPrices) {
    if (featured.length >= 4) break;
    if (!addedCropIds.has(price.crop_id)) {
      featured.push(price);
      addedCropIds.add(price.crop_id);
    }
  }

  // If still less than 4 (e.g. fewer crops exist), add any remaining prices
  for (const price of allPrices) {
    if (featured.length >= 4) break;
    if (!featured.some((f) => f.id === price.id)) {
      featured.push(price);
    }
  }

  return { data: featured, error: null, isConfigured };
}
