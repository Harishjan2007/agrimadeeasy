export type UserRole = 'farmer' | 'dealer' | 'machinery_provider';

export interface Profile {
  id: string;
  name: string;
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

export interface CropPrice {
  id: string;
  crop_id: string;
  market_id: string;
  price: number;
  unit: string; // e.g. "₹/Quintal", "₹/kg"
  recorded_at: string;
  source: string; // e.g. "Agmarknet / APMC Market"
  crop?: Crop;
  market?: Market;
}

export type PriceTrend = 'up' | 'down' | 'stable';

export interface CropPrediction {
  id: string;
  crop_id: string;
  market_id: string;
  current_price: number;
  predicted_min: number;
  predicted_max: number;
  trend: PriceTrend;
  prediction_date: string;
  prediction_period: string; // e.g. "Next 15 Days", "Next 30 Days"
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
  available: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
  provider?: Profile;
}

export type BookingStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';

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
}
