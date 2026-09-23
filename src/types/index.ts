export type UserRole = 'farmer' | 'dealer' | 'machinery_provider';

export interface Profile {
  id: string;
  name: string;
  full_name?: string;
  email: string;
  phone: string;
  role: UserRole;
  location: string;
  created_at: string;
}

export interface Crop {
  id: string;
  name: string;
  category?: string;
  icon?: string;
}

export interface Market {
  id: string;
  name: string;
  location: string;
  state?: string;
  latitude?: number;
  longitude?: number;
}

export type PriceSourceStatus = 'LIVE' | 'RECENT' | 'REFERENCE' | 'DEMO/FALLBACK';

export interface HistoricalPricePoint {
  date: string;
  price: number;
  modal_price?: number;
  min_price?: number;
  max_price?: number;
  market_name?: string;
  source?: string;
}

export interface CropPrice {
  id: string;
  crop_id: string;
  market_id: string;
  price: number;
  modal_price?: number;
  min_price?: number;
  max_price?: number;
  unit: string; // e.g. "₹/Quintal", "₹/kg"
  recorded_at: string;
  arrival_date?: string;
  variety?: string;
  source: string; // e.g. "Agmarknet / APMC Market"
  source_status?: PriceSourceStatus;
  historical_prices?: HistoricalPricePoint[];
  crop?: Crop;
  market?: Market;
}

export type PriceTrend = 'up' | 'down' | 'stable';

export interface MLModelMetrics {
  model_name: string;
  model_type: string; // e.g. "Gradient Boosted Regressor (XGBoost/LightGBM style)"
  dataset_source: string;
  training_samples: number;
  mae: number; // Mean Absolute Error in ₹/Quintal
  rmse: number; // Root Mean Squared Error in ₹/Quintal
  r2_score: number; // Coefficient of determination (e.g. 0.88)
  mape_pct: number; // Mean Absolute Percentage Error
  features_used: string[];
  limitations: string;
}

export interface CropPrediction {
  id: string;
  crop_id: string;
  market_id: string;
  current_price: number;
  predicted_min: number;
  predicted_max: number;
  predicted_price?: number;
  confidence_interval_pct?: number; // e.g. 95
  trend: PriceTrend;
  prediction_date: string;
  prediction_period: string; // e.g. "Next 15 Days", "Next 30 Days"
  ml_metrics?: MLModelMetrics;
  crop?: Crop;
  market?: Market;
}

export interface GovernmentScheme {
  id: string;
  name: string;
  description: string;
  eligibility: string;
  benefits: string;
  application_info: string;
  official_url?: string;
  source?: string;
  government_level?: 'central' | 'state';
  state?: string | null;
  category?: string;
  last_verified_at?: string;
  created_at: string;
}

export interface Dealer {
  id: string;
  profile_id: string;
  shop_name: string;
  address: string;
  phone: string;
  opening_hours: string;
  created_at: string;
  latitude?: number;
  longitude?: number;
  district?: string;
  profile?: Profile;
  crop_prices?: DealerCropPrice[];
}

export interface DealerCropPrice {
  id: string;
  dealer_id: string;
  crop_id: string;
  buying_price: number;
  unit: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  crop?: Crop;
  dealer?: Dealer;
}

export type ProductCategory = 'Seeds' | 'Fertilizers' | 'Pesticides' | 'Equipment' | 'Other';

export interface Product {
  id: string;
  dealer_id: string;
  name: string;
  category: ProductCategory;
  description: string;
  price: number;
  stock: number;
  image_url?: string;
  created_at: string;
  updated_at: string;
  dealer?: Dealer;
}

export type MachineryType = 'Tractor' | 'Paddy Harvester' | 'Power Tiller' | 'Rotavator' | 'Sprayer' | 'Other';

export interface Machinery {
  id: string;
  provider_id: string;
  name: string;
  type: MachineryType;
  description: string;
  price_per_hour: number;
  location: string;
  latitude?: number;
  longitude?: number;
  available: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
  provider?: Profile;
}

export type BookingStatus = 
  | 'pending' 
  | 'accepted' 
  | 'on_the_way' 
  | 'arrived' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'rejected';

export interface MachineryTracking {
  id: string;
  booking_id: string;
  provider_id: string;
  latitude: number;
  longitude: number;
  speed?: number | null;
  heading?: number | null;
  accuracy?: number | null;
  recorded_at: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  source: 'gps' | 'manual';
  name?: string;
  district?: string;
  state?: string;
}

export interface MachineryBooking {
  id: string;
  farmer_id: string;
  machinery_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  total_amount: number;
  created_at: string;
  updated_at: string;
  farmer?: Profile;
  machinery?: Machinery;
  tracking?: MachineryTracking;
}

export type ListingStatus = 'active' | 'sold' | 'delisted';

export interface FarmerProduceListing {
  id: string;
  farmer_id: string;
  crop_name: string;
  category?: string;
  quantity: number;
  unit: string;
  asking_price: number;
  price_unit: string;
  location: string;
  available_date: string;
  description?: string;
  image_url?: string;
  status: ListingStatus;
  created_at: string;
  updated_at: string;
  farmer?: Profile;
}

export type ProduceRequestStatus = 'pending' | 'accepted' | 'rejected' | 'completed';

export interface ProduceRequest {
  id: string;
  listing_id: string;
  buyer_id: string;
  farmer_id: string;
  requested_quantity: number;
  message?: string;
  status: ProduceRequestStatus;
  created_at: string;
  updated_at: string;
  listing?: FarmerProduceListing;
  buyer?: Profile;
  farmer?: Profile;
}

