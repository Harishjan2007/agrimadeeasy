-- ==============================================================================
-- AgriME Platform — Database Schema & Row Level Security (RLS)
-- Supabase / PostgreSQL Schema Definition
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- TABLE: PROFILES
-- Matches auth.users.id
-- ==============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('farmer', 'dealer', 'machinery_provider')),
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- TABLE: CROPS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS crops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- TABLE: MARKETS
-- Regulated APMC & wholesale mandis
-- ==============================================================================
CREATE TABLE IF NOT EXISTS markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- TABLE: CROP PRICES
-- Daily mandi market rates
-- ==============================================================================
CREATE TABLE IF NOT EXISTS crop_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id UUID NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT '₹/Quintal',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- TABLE: CROP PREDICTIONS
-- Stored market forecasts and seasonal price ranges
-- ==============================================================================
CREATE TABLE IF NOT EXISTS crop_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id UUID NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  current_price NUMERIC NOT NULL,
  predicted_min NUMERIC NOT NULL,
  predicted_max NUMERIC NOT NULL,
  trend TEXT NOT NULL CHECK (trend IN ('up', 'down', 'stable')),
  prediction_date DATE NOT NULL,
  prediction_period TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- TABLE: SCHEMES
-- Government welfare initiatives, subsidies, and insurance guides
-- ==============================================================================
CREATE TABLE IF NOT EXISTS schemes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  eligibility TEXT NOT NULL,
  benefits TEXT NOT NULL,
  application_info TEXT NOT NULL,
  official_url TEXT,
  source TEXT,
  government_level TEXT DEFAULT 'central',
  state TEXT,
  category TEXT,
  last_verified_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- TABLE: DEALERS
-- Agricultural merchants buying produce and retailing farm inputs
-- ==============================================================================
CREATE TABLE IF NOT EXISTS dealers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shop_name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  opening_hours TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- TABLE: DEALER CROP PRICES
-- Live crop buying quotes posted by registered merchants
-- ==============================================================================
CREATE TABLE IF NOT EXISTS dealer_crop_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  crop_id UUID NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  buying_price NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT '₹/Quintal',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- TABLE: PRODUCTS
-- Agri inputs (Seeds, Fertilizers, Pesticides, Equipment) sold by dealers
-- ==============================================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- TABLE: MACHINERY
-- Heavy farm machinery listed for hourly rental by providers
-- ==============================================================================
CREATE TABLE IF NOT EXISTS machinery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  price_per_hour NUMERIC NOT NULL,
  location TEXT NOT NULL,
  available BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- TABLE: MACHINERY BOOKINGS
-- Hourly machinery reservations made by farmers
-- ==============================================================================
CREATE TABLE IF NOT EXISTS machinery_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  machinery_id UUID NOT NULL REFERENCES machinery(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
  total_amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- INDEXES
-- Optimal indexing for performance and frequent query filters
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_crop_prices_crop_id ON crop_prices(crop_id);
CREATE INDEX IF NOT EXISTS idx_crop_prices_market_id ON crop_prices(market_id);
CREATE INDEX IF NOT EXISTS idx_crop_predictions_crop_id ON crop_predictions(crop_id);
CREATE INDEX IF NOT EXISTS idx_dealers_profile_id ON dealers(profile_id);
CREATE INDEX IF NOT EXISTS idx_dealer_crop_prices_dealer_id ON dealer_crop_prices(dealer_id);
CREATE INDEX IF NOT EXISTS idx_dealer_crop_prices_crop_id ON dealer_crop_prices(crop_id);
CREATE INDEX IF NOT EXISTS idx_products_dealer_id ON products(dealer_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_machinery_provider_id ON machinery(provider_id);
CREATE INDEX IF NOT EXISTS idx_machinery_available ON machinery(available);
CREATE INDEX IF NOT EXISTS idx_machinery_bookings_farmer_id ON machinery_bookings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_machinery_bookings_machinery_id ON machinery_bookings(machinery_id);
CREATE INDEX IF NOT EXISTS idx_machinery_bookings_status ON machinery_bookings(status);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealer_crop_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE machinery ENABLE ROW LEVEL SECURITY;
ALTER TABLE machinery_bookings ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 1. CROPS & MARKETS (Public Read)
-- ------------------------------------------------------------------------------
CREATE POLICY "Public crops read" ON crops FOR SELECT USING (true);
CREATE POLICY "Public markets read" ON markets FOR SELECT USING (true);

-- ------------------------------------------------------------------------------
-- 2. CROP PRICES & PREDICTIONS (Public Read)
-- ------------------------------------------------------------------------------
CREATE POLICY "Public crop_prices read" ON crop_prices FOR SELECT USING (true);
CREATE POLICY "Public crop_predictions read" ON crop_predictions FOR SELECT USING (true);

-- ------------------------------------------------------------------------------
-- 3. SCHEMES (Public Read)
-- ------------------------------------------------------------------------------
CREATE POLICY "Public schemes read" ON schemes FOR SELECT USING (true);

-- ------------------------------------------------------------------------------
-- 4. PROFILES
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can read all profiles" 
  ON profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 5. DEALERS
-- ------------------------------------------------------------------------------
CREATE POLICY "Public read dealers" 
  ON dealers FOR SELECT 
  USING (true);

CREATE POLICY "Dealers can manage own dealer record" 
  ON dealers FOR ALL 
  USING (auth.uid() = profile_id);

-- ------------------------------------------------------------------------------
-- 6. DEALER CROP PRICES
-- ------------------------------------------------------------------------------
CREATE POLICY "Public read active dealer crop prices" 
  ON dealer_crop_prices FOR SELECT 
  USING (
    active = true OR 
    EXISTS (
      SELECT 1 FROM dealers 
      WHERE dealers.id = dealer_crop_prices.dealer_id 
      AND dealers.profile_id = auth.uid()
    )
  );

CREATE POLICY "Dealers can manage own crop prices" 
  ON dealer_crop_prices FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM dealers 
      WHERE dealers.id = dealer_crop_prices.dealer_id 
      AND dealers.profile_id = auth.uid()
    )
  );

-- ------------------------------------------------------------------------------
-- 7. PRODUCTS
-- ------------------------------------------------------------------------------
CREATE POLICY "Public read products" 
  ON products FOR SELECT 
  USING (true);

CREATE POLICY "Dealers can manage own products" 
  ON products FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM dealers 
      WHERE dealers.id = products.dealer_id 
      AND dealers.profile_id = auth.uid()
    )
  );

-- ------------------------------------------------------------------------------
-- 8. MACHINERY
-- ------------------------------------------------------------------------------
CREATE POLICY "Public read available machinery or own machinery" 
  ON machinery FOR SELECT 
  USING (
    available = true OR 
    provider_id = auth.uid()
  );

CREATE POLICY "Machinery providers can manage own machinery" 
  ON machinery FOR ALL 
  USING (provider_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 9. MACHINERY BOOKINGS
-- ------------------------------------------------------------------------------
CREATE POLICY "Farmers can create bookings" 
  ON machinery_bookings FOR INSERT 
  WITH CHECK (farmer_id = auth.uid());

CREATE POLICY "Farmers and Providers can read related bookings" 
  ON machinery_bookings FOR SELECT 
  USING (
    farmer_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM machinery 
      WHERE machinery.id = machinery_bookings.machinery_id 
      AND machinery.provider_id = auth.uid()
    )
  );

CREATE POLICY "Providers can update booking status" 
  ON machinery_bookings FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM machinery 
      WHERE machinery.id = machinery_bookings.machinery_id 
      AND machinery.provider_id = auth.uid()
    )
  );

CREATE POLICY "Farmers can cancel own pending bookings" 
  ON machinery_bookings FOR UPDATE 
  USING (
    farmer_id = auth.uid() AND 
    status IN ('pending', 'cancelled')
  );

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER (AUTH HOOK)
-- Populates the profiles table upon new Supabase Auth user registration
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, role, location)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'farmer'),
    COALESCE(new.raw_user_meta_data->>'location', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    location = EXCLUDED.location,
    updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- TABLE: FARMER PRODUCE LISTINGS
-- Allows registered farmers to advertise their harvest directly with their own asking price
-- ==============================================================================
CREATE TABLE IF NOT EXISTS farmer_produce_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  crop_name TEXT NOT NULL,
  category TEXT,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL DEFAULT 'Quintal',
  asking_price NUMERIC NOT NULL CHECK (asking_price > 0),
  price_unit TEXT NOT NULL DEFAULT '₹/Quintal',
  location TEXT NOT NULL,
  available_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'delisted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- TABLE: PRODUCE REQUESTS
-- Allows buyers to send purchase interest requests directly to farmers
-- ==============================================================================
CREATE TABLE IF NOT EXISTS produce_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES farmer_produce_listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_quantity NUMERIC NOT NULL CHECK (requested_quantity > 0),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_farmer_produce_listings_farmer_id ON farmer_produce_listings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farmer_produce_listings_status ON farmer_produce_listings(status);
CREATE INDEX IF NOT EXISTS idx_farmer_produce_listings_crop ON farmer_produce_listings(crop_name);
CREATE INDEX IF NOT EXISTS idx_produce_requests_listing_id ON produce_requests(listing_id);
CREATE INDEX IF NOT EXISTS idx_produce_requests_buyer_id ON produce_requests(buyer_id);
CREATE INDEX IF NOT EXISTS idx_produce_requests_farmer_id ON produce_requests(farmer_id);
CREATE INDEX IF NOT EXISTS idx_produce_requests_status ON produce_requests(status);

ALTER TABLE farmer_produce_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE produce_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active produce listings or owner"
  ON farmer_produce_listings FOR SELECT
  USING (status = 'active' OR auth.uid() = farmer_id);

CREATE POLICY "Farmers can insert own produce listings"
  ON farmer_produce_listings FOR INSERT
  WITH CHECK (auth.uid() = farmer_id);

CREATE POLICY "Farmers can update own produce listings"
  ON farmer_produce_listings FOR UPDATE
  USING (auth.uid() = farmer_id);

CREATE POLICY "Farmers can delete own produce listings"
  ON farmer_produce_listings FOR DELETE
  USING (auth.uid() = farmer_id);

CREATE POLICY "Buyers and Farmers can read related produce requests"
  ON produce_requests FOR SELECT
  USING (buyer_id = auth.uid() OR farmer_id = auth.uid());

CREATE POLICY "Buyers can create produce requests"
  ON produce_requests FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Participants can update produce requests"
  ON produce_requests FOR UPDATE
  USING (farmer_id = auth.uid() OR buyer_id = auth.uid());

CREATE POLICY "Buyers can delete own produce requests"
  ON produce_requests FOR DELETE
  USING (buyer_id = auth.uid());

