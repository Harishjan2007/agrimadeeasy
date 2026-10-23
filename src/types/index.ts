export type UserRole = 'farmer' | 'dealer' | 'machinery_provider';

export type OnboardingUserType = 'Farmer' | 'Dealer' | 'Buyer' | 'Other';

export interface Profile {
  id: string;
  name: string;
  full_name?: string;
  email: string;
  phone: string;
  role: UserRole;
  location: string;
  created_at: string;
  // Onboarding & Personalization fields
  user_type?: OnboardingUserType;
  state?: string;
  district?: string;
  primary_crops?: string[];
  main_interests?: string[];
  // Dealer specific fields
  shop_name?: string;
  business_address?: string;
  latitude?: number;
  longitude?: number;
  bought_crops?: string[];
  produce_categories?: string[];
  purchase_conditions?: string;
  opening_hours?: string;
  // Machinery provider specific fields
  provider_name?: string;
  machinery_types?: string[];
  price_per_hour?: number;
  rental_terms?: string;
  updated_at?: string;
  // Convenience fields for dealer profile updates
  dealer_shop_name?: string;
  dealer_crops_purchased?: string[];
  dealer_purchase_conditions?: string;
  address?: string;
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
  district?: string;
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
  model_type: string; // e.g. "Empirical Time-Series Momentum & Seasonal Harmonic Projection"
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
  // Extended fields for Phase 3 verified directory
  department?: string;
  supported_crops?: string[];
  support_type?: string;
  benefit_type?: 'grant' | 'subsidy' | 'loan' | 'insurance' | 'compensation' | 'training' | 'service';
  benefit_amount?: string;
  landholding_criteria?: string;
  min_land_acres?: number;
  max_land_acres?: number;
  districts?: string[];
  required_documents?: string[];
  availability_status?: 'open' | 'seasonal' | 'unverified';
  beneficiaries?: string;
}

export interface Dealer {
  id: string;
  profile_id: string;
  shop_name: string;
  name?: string;
  address: string;
  phone: string;
  opening_hours: string;
  created_at: string;
  updated_at?: string;
  latitude?: number;
  longitude?: number;
  district?: string;
  state?: string;
  bought_crops?: string[];
  produce_categories?: string[];
  profile?: Profile;
  crop_prices?: DealerCropPrice[];
  isDemo?: boolean;
  buyer_type?: string;
  purchase_conditions?: string;
  verified?: boolean;
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
  min_quantity?: number;
  max_capacity?: number;
  quantity_unit?: string;
  payment_terms?: string;
  grading_terms?: string;
}

export type ProductCategory = 
  | 'Seeds' 
  | 'Simple, low-budget equipment' 
  | 'Fertilizers' 
  | 'Organic foods' 
  | 'Other agricultural products'
  | 'Pesticides' 
  | 'Equipment' 
  | 'Other';

export interface Product {
  id: string;
  dealer_id: string;
  name: string;
  category: ProductCategory;
  description: string;
  price: number;
  stock: number;
  pack_size?: string;
  unit?: string;
  isDemo?: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
  dealer?: Dealer;
}

export type MachineryType = 'Tractor' | 'Paddy Harvester' | 'Power Tiller' | 'Rotavator' | 'Sprayer' | 'Transplanter' | 'Laser Leveller' | 'Rotary Slasher' | 'Thresher' | 'Other';

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
  isDemo?: boolean;
  driver_name?: string;
  service_type?: string;
  experience_years?: number;
  distanceKm?: number;
  model?: string;
  rental_terms?: string;
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

export interface ProduceInquiry {
  id: string;
  dealerId: string;
  dealerName: string;
  farmerName: string;
  farmerPhone: string;
  cropName: string;
  estimatedQuantity: string;
  expectedPrice: string;
  message?: string;
  createdAt: string;
  status: 'new' | 'contacted' | 'completed';
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

export type FulfillmentMethod = 'cod' | 'pickup';
export type PaymentStatus = 'pending' | 'completed' | 'cancelled';
export type OrderStatus = 'placed' | 'confirmed' | 'packed' | 'dispatched' | 'delivered' | 'cancelled';

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id?: string;
  product_name: string;
  category: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string | null;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  fulfillment_method: FulfillmentMethod;
  payment_method: string;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
  items?: OrderItem[];
}

export interface DealerInquiry {
  id: string;
  farmer_id?: string | null;
  dealer_id: string;
  dealer_name: string;
  farmer_name: string;
  farmer_phone: string;
  crop_name: string;
  quantity: number;
  unit: string;
  expected_price?: number | null;
  price_unit?: string;
  message?: string;
  status: 'new' | 'contacted' | 'completed' | 'cancelled';
  created_at: string;
  updated_at?: string;
}

