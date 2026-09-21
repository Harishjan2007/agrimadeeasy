-- ==============================================================================
-- AgriME Platform — Farmer-to-Buyer Produce Marketplace Migration
-- Migration: 20260921_farmer_produce_marketplace.sql
-- ==============================================================================

-- 1. TABLE: FARMER PRODUCE LISTINGS
-- Allows registered farmers to advertise their harvest directly with their own asking price
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

-- 2. TABLE: PRODUCE REQUESTS
-- Allows buyers to send purchase interest requests directly to farmers
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

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_farmer_produce_listings_farmer_id ON farmer_produce_listings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farmer_produce_listings_status ON farmer_produce_listings(status);
CREATE INDEX IF NOT EXISTS idx_farmer_produce_listings_crop ON farmer_produce_listings(crop_name);
CREATE INDEX IF NOT EXISTS idx_produce_requests_listing_id ON produce_requests(listing_id);
CREATE INDEX IF NOT EXISTS idx_produce_requests_buyer_id ON produce_requests(buyer_id);
CREATE INDEX IF NOT EXISTS idx_produce_requests_farmer_id ON produce_requests(farmer_id);
CREATE INDEX IF NOT EXISTS idx_produce_requests_status ON produce_requests(status);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE farmer_produce_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE produce_requests ENABLE ROW LEVEL SECURITY;

-- Listings Policies
DROP POLICY IF EXISTS "Public read active produce listings or owner" ON farmer_produce_listings;
CREATE POLICY "Public read active produce listings or owner"
  ON farmer_produce_listings FOR SELECT
  USING (status = 'active' OR auth.uid() = farmer_id);

DROP POLICY IF EXISTS "Farmers can insert own produce listings" ON farmer_produce_listings;
CREATE POLICY "Farmers can insert own produce listings"
  ON farmer_produce_listings FOR INSERT
  WITH CHECK (auth.uid() = farmer_id);

DROP POLICY IF EXISTS "Farmers can update own produce listings" ON farmer_produce_listings;
CREATE POLICY "Farmers can update own produce listings"
  ON farmer_produce_listings FOR UPDATE
  USING (auth.uid() = farmer_id);

DROP POLICY IF EXISTS "Farmers can delete own produce listings" ON farmer_produce_listings;
CREATE POLICY "Farmers can delete own produce listings"
  ON farmer_produce_listings FOR DELETE
  USING (auth.uid() = farmer_id);

-- Requests Policies
DROP POLICY IF EXISTS "Buyers and Farmers can read related produce requests" ON produce_requests;
CREATE POLICY "Buyers and Farmers can read related produce requests"
  ON produce_requests FOR SELECT
  USING (buyer_id = auth.uid() OR farmer_id = auth.uid());

DROP POLICY IF EXISTS "Buyers can create produce requests" ON produce_requests;
CREATE POLICY "Buyers can create produce requests"
  ON produce_requests FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

DROP POLICY IF EXISTS "Participants can update produce requests" ON produce_requests;
CREATE POLICY "Participants can update produce requests"
  ON produce_requests FOR UPDATE
  USING (farmer_id = auth.uid() OR buyer_id = auth.uid());

DROP POLICY IF EXISTS "Buyers can delete own produce requests" ON produce_requests;
CREATE POLICY "Buyers can delete own produce requests"
  ON produce_requests FOR DELETE
  USING (buyer_id = auth.uid());
