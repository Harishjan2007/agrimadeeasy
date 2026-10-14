/**
 * AgriME data.gov.in Daily Mandi-Price API Client & Types
 * -------------------------------------------------------
 * Resource: Mandi APMC Market Prices
 * Endpoint: https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24
 *
 * Provides typed access to live wholesale APMC mandi daily arrivals, preserving
 * official units (₹/Quintal) and field definitions (min, max, modal prices).
 */

export interface MarketPriceRecord {
  id: string;
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  grade: string;
  arrival_date: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  unit: string;
}

export interface MarketPricesFilterOptions {
  state?: string;
  district?: string;
  market?: string;
  commodity?: string;
  limit?: number;
  offset?: number;
}

export interface MarketPricesApiResponse {
  success: boolean;
  status:
    | 'SUCCESS'
    | 'NO_DATA'
    | 'API_ERROR'
    | 'CONFIG_ERROR'
    | 'FETCH_ERROR'
    | 'CONNECTION_ERROR'
    | 'AUTH_ERROR'
    | 'PARSE_ERROR'
    | 'RATE_LIMIT_ERROR';
  errorCategory?: 'CONNECTION' | 'AUTHENTICATION' | 'PARSING' | 'RATE_LIMIT' | 'UPSTREAM' | 'CONFIGURATION';
  errorTitle?: string;
  errorResolution?: string;
  code?: string;
  error?: string;
  technicalDetails?: string;
  statusCode?: number;
  total: number;
  count: number;
  limit: number;
  offset: number;
  filters: {
    state: string;
    district: string;
    market: string;
    commodity: string;
  };
  workingFormat?: string | null;
  attemptedFormats?: string[];
  catalogTotal?: number;
  message?: string;
  records: MarketPriceRecord[];
  unit: string;
  source: string;
  resource_id: string;
  timestamp: string;
  diagnosticHint?: string;
}

export const TAMIL_NADU_DISTRICTS = [
  'All Districts',
  'Ariyalur',
  'Chengalpattu',
  'Chennai',
  'Coimbatore',
  'Cuddalore',
  'Dharmapuri',
  'Dindigul',
  'Erode',
  'Kallakurichi',
  'Kancheepuram',
  'Karur',
  'Krishnagiri',
  'Madurai',
  'Mayiladuthurai',
  'Nagapattinam',
  'Namakkal',
  'Perambalur',
  'Pudukkottai',
  'Ramanathapuram',
  'Ranipet',
  'Salem',
  'Sivaganga',
  'Tenkasi',
  'Thanjavur',
  'Theni',
  'Thoothukudi',
  'Tiruchirappalli',
  'Tirunelveli',
  'Tirupathur',
  'Tiruppur',
  'Tiruvallur',
  'Tiruvannamalai',
  'Tiruvarur',
  'Vellore',
  'Viluppuram',
  'Virudhunagar'
];

export const POPULAR_COMMODITIES = [
  'All Commodities',
  'Tomato',
  'Onion',
  'Paddy(Dhan)(Common)',
  'Groundnut',
  'Maize',
  'Coconut',
  'Cotton',
  'Turmeric',
  'Banana',
  'Brinjal',
  'Green Chilli',
  'Ladies Finger',
  'Potato',
  'Wheat'
];

/**
 * Client-side fetch helper querying the server-side /api/market-prices proxy route.
 * Keeps API key securely stored server-side.
 */
export async function fetchMarketPrices(
  options: MarketPricesFilterOptions = {}
): Promise<MarketPricesApiResponse> {
  const params = new URLSearchParams();

  if (options.state && options.state !== 'All States') {
    params.set('state', options.state);
  } else if (!options.state) {
    params.set('state', 'Tamil Nadu');
  }

  if (options.district && options.district !== 'All Districts') {
    params.set('district', options.district);
  }

  if (options.market && options.market !== 'All Markets') {
    params.set('market', options.market);
  }

  if (options.commodity && options.commodity !== 'All Commodities') {
    params.set('commodity', options.commodity);
  }

  if (typeof options.limit === 'number') {
    params.set('limit', String(options.limit));
  }

  if (typeof options.offset === 'number') {
    params.set('offset', String(options.offset));
  }

  const res = await fetch(`/api/market-prices?${params.toString()}`);
  const data: MarketPricesApiResponse = await res.json();
  return data;
}
