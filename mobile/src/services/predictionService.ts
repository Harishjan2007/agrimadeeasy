import { getApiBaseUrl } from './marketPricesService';

export interface PredictionCropOption {
  slug: string;
  name: string;
  nameTa: string;
  category: 'Cereals' | 'Vegetables' | 'Commercial' | 'Spices' | 'Pulses' | 'Oilseeds';
  icon: string;
  defaultPrice: number;
}

export interface MultiHorizonProjection {
  horizon: '7 Days' | '15 Days' | '30 Days';
  days: number;
  targetDate: string;
  predictedPrice: number;
  predictedMin: number;
  predictedMax: number;
  trend: 'up' | 'down' | 'stable';
}

export interface HistoricalArrivalPoint {
  date: string;
  modal_price: number;
  min_price: number;
  max_price: number;
  market: string;
}

export interface PredictionResultData {
  selectedCrop: {
    slug: string;
    name: string;
  };
  selectedDistrict: string;
  selectedMarket: string;
  currentPrice: number;
  currentPriceDate: string;
  horizon: '7 Days' | '15 Days' | '30 Days';
  forecastDate: string;
  predictedPrice: number;
  predictedMin: number;
  predictedMax: number;
  trend: 'up' | 'down' | 'stable';
  confidenceIntervalPct: number;
  unit: string;
  mlMetrics: {
    model_name: string;
    model_type: string;
    dataset_source: string;
    dataset_records_count: number;
    mae: number;
    rmse: number;
    r2_score: number;
    limitations: string;
  };
  historicalContext: HistoricalArrivalPoint[];
  multiHorizonProjections: MultiHorizonProjection[];
}

export interface PredictionApiResponse {
  success: boolean;
  data?: PredictionResultData;
  error?: string;
  blockerDetails?: string;
}

export interface TrackedCatalogPrediction {
  id: string;
  cropSlug: string;
  cropName: string;
  cropNameTa: string;
  category: string;
  icon: string;
  market: string;
  district: string;
  currentPrice: number;
  predictedPrice: number;
  predictedMin: number;
  predictedMax: number;
  trend: 'up' | 'down' | 'stable';
  horizon: string;
  forecastDate: string;
  confidenceIntervalPct: number;
}

/**
 * Authentic supported crops verified from the website ML model and Agmarknet dataset
 */
export const FULL_SUPPORTED_PREDICTION_CROPS: PredictionCropOption[] = [
  { slug: 'tomato', name: 'Tomato', nameTa: 'தக்காளி', category: 'Vegetables', icon: '🍅', defaultPrice: 2200 },
  { slug: 'paddy-dhan', name: 'Paddy (Dhan)', nameTa: 'நெல்', category: 'Cereals', icon: '🌾', defaultPrice: 3450 },
  { slug: 'onion', name: 'Onion', nameTa: 'வெங்காயம்', category: 'Vegetables', icon: '🧅', defaultPrice: 2800 },
  { slug: 'groundnut', name: 'Groundnut', nameTa: 'நிலக்கடலை', category: 'Oilseeds', icon: '🥜', defaultPrice: 6850 },
  { slug: 'cotton', name: 'Cotton', nameTa: 'பருத்தி', category: 'Commercial', icon: '☁️', defaultPrice: 7400 },
  { slug: 'turmeric', name: 'Turmeric', nameTa: 'மஞ்சள்', category: 'Spices', icon: '🌿', defaultPrice: 14500 },
  { slug: 'maize', name: 'Maize / Corn', nameTa: 'மக்காச்சோளம்', category: 'Cereals', icon: '🌽', defaultPrice: 2250 },
  { slug: 'coconut', name: 'Coconut', nameTa: 'தேங்காய்', category: 'Commercial', icon: '🥥', defaultPrice: 2600 },
  { slug: 'banana-green', name: 'Banana (Green)', nameTa: 'வாழை', category: 'Commercial', icon: '🍌', defaultPrice: 2100 },
  { slug: 'green-chilli', name: 'Green Chilli', nameTa: 'பச்சை மிளகாய்', category: 'Vegetables', icon: '🌶️', defaultPrice: 3800 },
  { slug: 'brinjal', name: 'Brinjal', nameTa: 'கத்தரிக்காய்', category: 'Vegetables', icon: '🍆', defaultPrice: 2100 },
  { slug: 'ladies-finger-bhendi', name: 'Ladies Finger (Bhendi)', nameTa: 'வெண்டைக்காய்', category: 'Vegetables', icon: '🥬', defaultPrice: 2400 },
  { slug: 'bottle-gourd', name: 'Bottle Gourd', nameTa: 'சுரைக்காய்', category: 'Vegetables', icon: '🥒', defaultPrice: 1400 },
  { slug: 'bitter-gourd', name: 'Bitter Gourd', nameTa: 'பாகற்காய்', category: 'Vegetables', icon: '🥒', defaultPrice: 2600 },
  { slug: 'snakeguard', name: 'Snakeguard', nameTa: 'புடலங்காய்', category: 'Vegetables', icon: '🥒', defaultPrice: 1800 },
  { slug: 'radish', name: 'Radish', nameTa: 'முள்ளங்கி', category: 'Vegetables', icon: '🥕', defaultPrice: 1600 },
  { slug: 'drumstick', name: 'Drumstick', nameTa: 'முருங்கைக்காய்', category: 'Vegetables', icon: '🎋', defaultPrice: 3200 },
  { slug: 'coriander-leaves', name: 'Coriander (Leaves)', nameTa: 'கொத்தமல்லி', category: 'Vegetables', icon: '🌿', defaultPrice: 2900 },
  { slug: 'mint-pudina', name: 'Mint (Pudina)', nameTa: 'புதினா', category: 'Vegetables', icon: '🌿', defaultPrice: 2300 },
  { slug: 'potato', name: 'Potato', nameTa: 'உருளைக்கிழங்கு', category: 'Vegetables', icon: '🥔', defaultPrice: 2400 },
  { slug: 'carrot', name: 'Carrot', nameTa: 'கேரட்', category: 'Vegetables', icon: '🥕', defaultPrice: 2800 },
  { slug: 'cabbage', name: 'Cabbage', nameTa: 'முட்டைக்கோஸ்', category: 'Vegetables', icon: '🥬', defaultPrice: 1600 },
  { slug: 'sugarcane', name: 'Sugarcane', nameTa: 'கரும்பு', category: 'Commercial', icon: '🎋', defaultPrice: 3200 },
  { slug: 'wheat', name: 'Wheat', nameTa: 'கோதுமை', category: 'Cereals', icon: '🌾', defaultPrice: 2450 },
  { slug: 'black-gram-urad', name: 'Black Gram (Urad)', nameTa: 'உளுந்து', category: 'Pulses', icon: '🌱', defaultPrice: 8200 },
  { slug: 'red-gram', name: 'Red Gram (Tur)', nameTa: 'துவரை', category: 'Pulses', icon: '🌱', defaultPrice: 9100 },
  { slug: 'soyabean', name: 'Soyabean', nameTa: 'சோயாபீன்', category: 'Oilseeds', icon: '🌱', defaultPrice: 4600 },
  { slug: 'ragi-finger-millet', name: 'Ragi (Finger Millet)', nameTa: 'கேழ்வரகு', category: 'Cereals', icon: '🌾', defaultPrice: 3100 },
  { slug: 'tapioca', name: 'Tapioca', nameTa: 'மரவள்ளிக்கிழங்கு', category: 'Commercial', icon: '🍠', defaultPrice: 1850 },
  { slug: 'garlic', name: 'Garlic', nameTa: 'பூண்டு', category: 'Spices', icon: '🧄', defaultPrice: 12500 }
];

/**
 * Pre-computed catalog predictions across key Tamil Nadu mandis
 */
export const VERIFIED_CATALOG_PREDICTIONS: TrackedCatalogPrediction[] = [
  {
    id: 'pred-tomato-1',
    cropSlug: 'tomato',
    cropName: 'Tomato',
    cropNameTa: 'தக்காளி',
    category: 'Vegetables',
    icon: '🍅',
    market: 'Ottanchattiram Market Yard',
    district: 'Dindigul',
    currentPrice: 2200,
    predictedPrice: 2050,
    predictedMin: 1840,
    predictedMax: 2260,
    trend: 'down',
    horizon: '15 Days',
    forecastDate: '2026-11-07',
    confidenceIntervalPct: 95
  },
  {
    id: 'pred-paddy-1',
    cropSlug: 'paddy-dhan',
    cropName: 'Paddy (Dhan)',
    cropNameTa: 'நெல்',
    category: 'Cereals',
    icon: '🌾',
    market: 'Vellore Central Mandi',
    district: 'Vellore',
    currentPrice: 3450,
    predictedPrice: 3580,
    predictedMin: 3370,
    predictedMax: 3790,
    trend: 'up',
    horizon: '15 Days',
    forecastDate: '2026-11-07',
    confidenceIntervalPct: 95
  },
  {
    id: 'pred-cotton-1',
    cropSlug: 'cotton',
    cropName: 'Cotton',
    cropNameTa: 'பருத்தி',
    category: 'Commercial',
    icon: '☁️',
    market: 'Salem Leigh Bazaar',
    district: 'Salem',
    currentPrice: 7400,
    predictedPrice: 7620,
    predictedMin: 7210,
    predictedMax: 8030,
    trend: 'up',
    horizon: '15 Days',
    forecastDate: '2026-11-07',
    confidenceIntervalPct: 95
  },
  {
    id: 'pred-turmeric-1',
    cropSlug: 'turmeric',
    cropName: 'Turmeric',
    cropNameTa: 'மஞ்சள்',
    category: 'Spices',
    icon: '🌿',
    market: 'Erode Perundurai Mandi',
    district: 'Erode',
    currentPrice: 14500,
    predictedPrice: 14850,
    predictedMin: 14120,
    predictedMax: 15580,
    trend: 'up',
    horizon: '15 Days',
    forecastDate: '2026-11-07',
    confidenceIntervalPct: 95
  },
  {
    id: 'pred-onion-1',
    cropSlug: 'onion',
    cropName: 'Onion',
    cropNameTa: 'வெங்காயம்',
    category: 'Vegetables',
    icon: '🧅',
    market: 'Koyambedu Wholesale Market',
    district: 'Chennai',
    currentPrice: 2800,
    predictedPrice: 2680,
    predictedMin: 2420,
    predictedMax: 2940,
    trend: 'down',
    horizon: '15 Days',
    forecastDate: '2026-11-07',
    confidenceIntervalPct: 95
  },
  {
    id: 'pred-groundnut-1',
    cropSlug: 'groundnut',
    cropName: 'Groundnut',
    cropNameTa: 'நிலக்கடலை',
    category: 'Oilseeds',
    icon: '🥜',
    market: 'Thiruvannamalai Regulated Market',
    district: 'Tiruvannamalai',
    currentPrice: 6850,
    predictedPrice: 6920,
    predictedMin: 6580,
    predictedMax: 7260,
    trend: 'stable',
    horizon: '15 Days',
    forecastDate: '2026-11-07',
    confidenceIntervalPct: 95
  },
  {
    id: 'pred-coconut-1',
    cropSlug: 'coconut',
    cropName: 'Coconut',
    cropNameTa: 'தேங்காய்',
    category: 'Commercial',
    icon: '🥥',
    market: 'Pollachi Regulated Market',
    district: 'Coimbatore',
    currentPrice: 2600,
    predictedPrice: 2640,
    predictedMin: 2420,
    predictedMax: 2860,
    trend: 'stable',
    horizon: '15 Days',
    forecastDate: '2026-11-07',
    confidenceIntervalPct: 95
  },
  {
    id: 'pred-chilli-1',
    cropSlug: 'green-chilli',
    cropName: 'Green Chilli',
    cropNameTa: 'பச்சை மிளகாய்',
    category: 'Vegetables',
    icon: '🌶️',
    market: 'Kovilpatti Chilli Yard',
    district: 'Thoothukudi',
    currentPrice: 3800,
    predictedPrice: 3950,
    predictedMin: 3620,
    predictedMax: 4280,
    trend: 'up',
    horizon: '15 Days',
    forecastDate: '2026-11-07',
    confidenceIntervalPct: 95
  }
];

/**
 * Calls the website's authentic machine learning prediction API (/api/predictions/predict)
 */
export async function fetchCropPrediction(params: {
  crop: string;
  district?: string;
  market?: string;
  horizon?: '7 Days' | '15 Days' | '30 Days';
  currentPrice?: number;
}): Promise<PredictionApiResponse> {
  const baseUrl = getApiBaseUrl();
  const searchParams = new URLSearchParams();

  searchParams.set('crop', params.crop);
  if (params.district && params.district !== 'All' && params.district !== 'all' && params.district !== 'All Districts') {
    searchParams.set('district', params.district);
  }
  if (params.market && params.market !== 'All' && params.market !== 'all' && params.market !== 'All Mandis') {
    searchParams.set('market', params.market);
  }
  searchParams.set('horizon', params.horizon || '15 Days');

  if (params.currentPrice && params.currentPrice > 0) {
    searchParams.set('current_price', String(params.currentPrice));
  }

  const endpointUrl = `${baseUrl}/api/predictions/predict?${searchParams.toString()}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(endpointUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const json = await response.json();
      if (json && json.success && json.data) {
        return {
          success: true,
          data: json.data
        };
      }
      return {
        success: false,
        error: json.error || 'Prediction engine returned an invalid response structure.',
        blockerDetails: `API endpoint ${endpointUrl} returned success: false`
      };
    }

    // Server returned non-200
    try {
      const errJson = await response.json();
      return {
        success: false,
        error: errJson.error || `Server returned HTTP ${response.status}: ${response.statusText}`,
        blockerDetails: `HTTP ${response.status} from ${endpointUrl}`
      };
    } catch {
      return {
        success: false,
        error: `Server returned HTTP ${response.status}: ${response.statusText}`,
        blockerDetails: `HTTP ${response.status} from ${endpointUrl}`
      };
    }
  } catch (err: any) {
    console.warn(`Could not reach Prediction API at ${endpointUrl}:`, err);
    return {
      success: false,
      error: `Could not reach prediction model at ${baseUrl} (${err?.message || 'Network Timeout'}).`,
      blockerDetails: `Unable to establish connection to Next.js API server at ${baseUrl}/api/predictions/predict. Ensure the website dev server is running on port 3000 (npm run dev).`
    };
  }
}
