-- ==============================================================================
-- AgriME Platform — Migration: 20261022_remaining_fixes.sql
-- Functionality Fixes 1, 2, 5, 6, 8:
-- 1. Database-backed Demo Dealers & Dealer Crop Prices
-- 2. Database-backed Demo Machinery Providers & Equipment
-- 3. Dealer Inquiries Persistence & Management (RLS protected)
-- 4. E-Commerce Orders & Order Items Persistence (RLS protected, COD / Pickup)
-- 5. Database-backed Demo Products (Seeds, Equipment, Fertilizers, Organic, Others)
-- ==============================================================================

-- 1. Extend dealers table for demo records, location fields, and procurement preferences
ALTER TABLE dealers ALTER COLUMN profile_id DROP NOT NULL;
ALTER TABLE dealers 
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS buyer_type TEXT,
  ADD COLUMN IF NOT EXISTS purchase_conditions TEXT,
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false;

-- 2. Extend dealer_crop_prices for capacity, minimum lots, and terms
ALTER TABLE dealer_crop_prices 
  ADD COLUMN IF NOT EXISTS min_quantity NUMERIC,
  ADD COLUMN IF NOT EXISTS max_capacity NUMERIC,
  ADD COLUMN IF NOT EXISTS quantity_unit TEXT DEFAULT 'Quintals',
  ADD COLUMN IF NOT EXISTS payment_terms TEXT,
  ADD COLUMN IF NOT EXISTS grading_terms TEXT;

-- 3. Extend machinery table for demo providers, location, and driver specifications
ALTER TABLE machinery ALTER COLUMN provider_id DROP NOT NULL;
ALTER TABLE machinery 
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS service_type TEXT,
  ADD COLUMN IF NOT EXISTS driver_name TEXT,
  ADD COLUMN IF NOT EXISTS experience_years INTEGER;

-- 4. Extend products table for demo catalog items and package units
ALTER TABLE products ALTER COLUMN dealer_id DROP NOT NULL;
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pack_size TEXT,
  ADD COLUMN IF NOT EXISTS unit TEXT;

-- ==============================================================================
-- TABLE: DEALER INQUIRIES (FIX 5)
-- Farmer harvest lot offers and direct procurement inquiries to dealers
-- ==============================================================================
CREATE TABLE IF NOT EXISTS dealer_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  dealer_name TEXT NOT NULL,
  farmer_name TEXT NOT NULL,
  farmer_phone TEXT NOT NULL,
  crop_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL DEFAULT 'Quintals',
  expected_price NUMERIC,
  price_unit TEXT NOT NULL DEFAULT '₹/Quintal',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_dealer_inquiries_dealer_id ON dealer_inquiries(dealer_id);
CREATE INDEX IF NOT EXISTS idx_dealer_inquiries_farmer_id ON dealer_inquiries(farmer_id);
CREATE INDEX IF NOT EXISTS idx_dealer_inquiries_status ON dealer_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_dealer_inquiries_created_at ON dealer_inquiries(created_at DESC);

-- RLS for dealer_inquiries (Strict User Isolation)
ALTER TABLE dealer_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Farmers can insert inquiries" ON dealer_inquiries;
CREATE POLICY "Farmers can insert inquiries"
  ON dealer_inquiries FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND (farmer_id = auth.uid() OR farmer_id IS NULL)) OR
    (auth.uid() IS NULL AND farmer_id IS NULL)
  );

DROP POLICY IF EXISTS "Participants can view dealer inquiries" ON dealer_inquiries;
CREATE POLICY "Participants can view dealer inquiries"
  ON dealer_inquiries FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND farmer_id = auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM dealers 
      WHERE dealers.id = dealer_inquiries.dealer_id 
      AND dealers.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Dealers can update their received inquiries" ON dealer_inquiries;
CREATE POLICY "Dealers can update their received inquiries"
  ON dealer_inquiries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM dealers 
      WHERE dealers.id = dealer_inquiries.dealer_id 
      AND dealers.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dealers 
      WHERE dealers.id = dealer_inquiries.dealer_id 
      AND dealers.profile_id = auth.uid()
    )
  );

-- ==============================================================================
-- TABLE: ORDERS & ORDER_ITEMS (FIX 6)
-- E-commerce orders persisted without requiring a payment gateway
-- ==============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  fulfillment_method TEXT NOT NULL CHECK (fulfillment_method IN ('cod', 'pickup')),
  payment_method TEXT NOT NULL DEFAULT 'Cash on Delivery (COD)',
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'cancelled')),
  order_status TEXT NOT NULL DEFAULT 'placed' CHECK (order_status IN ('placed', 'confirmed', 'packed', 'dispatched', 'delivered', 'cancelled')),
  total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC NOT NULL CHECK (total_price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- RLS for orders & order_items (Strict Customer Isolation)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can insert orders" ON orders;
CREATE POLICY "Customers can insert orders"
  ON orders FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND (customer_id = auth.uid() OR customer_id IS NULL)) OR
    (auth.uid() IS NULL AND customer_id IS NULL)
  );

DROP POLICY IF EXISTS "Customers can view own orders" ON orders;
CREATE POLICY "Customers can view own orders"
  ON orders FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND customer_id = auth.uid()
  );

DROP POLICY IF EXISTS "Customers can insert order items" ON order_items;
DROP POLICY IF EXISTS "Public insert order items" ON order_items;
CREATE POLICY "Customers can insert order items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND (
        (auth.uid() IS NOT NULL AND (orders.customer_id = auth.uid() OR orders.customer_id IS NULL)) OR
        (auth.uid() IS NULL AND orders.customer_id IS NULL)
      )
    )
  );

DROP POLICY IF EXISTS "Customers can view own order items" ON order_items;
CREATE POLICY "Customers can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND auth.uid() IS NOT NULL 
      AND orders.customer_id = auth.uid()
    )
  );

-- ==============================================================================
-- IDEMPOTENT SEED DATA: 10 DEMO DEALERS (FIX 1)
-- Deterministic UUID range: 00000000-0000-0000-0001-000000000001 .. 000000000010
-- ==============================================================================
INSERT INTO dealers (
  id, profile_id, shop_name, address, phone, opening_hours, latitude, longitude, district, state, buyer_type, purchase_conditions, is_demo, verified
) VALUES
  (
    '00000000-0000-0000-0001-000000000001', NULL,
    'Cauvery Delta Rice Mill & Direct Buying Hub [Demo Dealer]',
    'Old Thanjavur Road, Near APMC Market Yard, Thanjavur - 613001',
    '+91 90000 00001 (Sample Demo Only)',
    'Mon - Sat: 6:30 AM - 7:00 PM',
    10.7870, 79.1378, 'Thanjavur', 'Tamil Nadu',
    'Modern Rice Mill & Processing Hub',
    'Moisture < 14%, immediate electronic weighment & spot RTGS/NEFT payment.',
    true, false
  ),
  (
    '00000000-0000-0000-0001-000000000002', NULL,
    'Kongu Commercial Grains & Oilseed Traders [Demo Dealer]',
    'Leigh Bazaar Commercial Complex, Salem - 636009',
    '+91 90000 00002 (Sample Demo Only)',
    'Mon - Sat: 7:00 AM - 8:00 PM',
    11.6643, 78.1460, 'Salem', 'Tamil Nadu',
    'Wholesale Mandi Merchant',
    'Standard 50kg gunny bags preferred; moisture test done on-site; spot payout.',
    true, false
  ),
  (
    '00000000-0000-0000-0001-000000000003', NULL,
    'Trichy Regional Farmer Cooperative Procurement Hub [Demo Dealer]',
    'Subramaniapuram Agri Warehousing Zone, Tiruchirappalli - 620020',
    '+91 90000 00003 (Sample Demo Only)',
    'Mon - Fri: 8:00 AM - 6:00 PM',
    10.7905, 78.7047, 'Tiruchirappalli', 'Tamil Nadu',
    'FPO / Farmer Cooperative Buying Hub',
    'FPO member bonus applicable; direct DBT settlement within 24 hours of delivery.',
    true, false
  ),
  (
    '00000000-0000-0000-0001-000000000004', NULL,
    'Madurai Pandian Agro Commodities & Cotton Yard [Demo Dealer]',
    'Mattuthavani Wholesale Yard, Madurai - 625007',
    '+91 90000 00004 (Sample Demo Only)',
    'Mon - Sat: 6:00 AM - 7:30 PM',
    9.9252, 78.1198, 'Madurai', 'Tamil Nadu',
    'Cotton Ginning & Commercial Buyer',
    'Moisture < 8% for cotton, trash content < 3%; automated electronic grading.',
    true, false
  ),
  (
    '00000000-0000-0000-0001-000000000005', NULL,
    'Erode Agro Processing & Turmeric Expellers [Demo Dealer]',
    'Perundurai SIPCOT Agri Zone, Erode - 638052',
    '+91 90000 00005 (Sample Demo Only)',
    'Mon - Sat: 7:30 AM - 7:30 PM',
    11.3410, 77.7172, 'Erode', 'Tamil Nadu',
    'Oilseed Expeller & Commercial Processor',
    'Finger turmeric with high curcumin preferred; instant electronic weighment.',
    true, false
  ),
  (
    '00000000-0000-0000-0001-000000000006', NULL,
    'Tirupur Cotton & Dryland Produce Aggregators [Demo Dealer]',
    'Kangeyam Road Agri Trading Center, Tirupur - 641604',
    '+91 90000 00006 (Sample Demo Only)',
    'Mon - Sat: 8:00 AM - 7:00 PM',
    11.1085, 77.3411, 'Tirupur', 'Tamil Nadu',
    'Cotton Ginning & Commercial Buyer',
    'Staple length > 28mm preferred; fast moisture check and spot digital bank payout.',
    true, false
  ),
  (
    '00000000-0000-0000-0001-000000000007', NULL,
    'Coimbatore Nilgiri Organic & Horticulture Hub [Demo Dealer]',
    'Mettupalayam Agri Wholesale Yard, Coimbatore - 641301',
    '+91 90000 00007 (Sample Demo Only)',
    'Mon - Sun: 5:00 AM - 6:00 PM',
    11.0168, 76.9558, 'Coimbatore', 'Tamil Nadu',
    'Vegetable Commission & Cold Storage Merchant',
    'Pre-cooled vegetables and fresh harvest; crates accepted; daily transparent auction.',
    true, false
  ),
  (
    '00000000-0000-0000-0001-000000000008', NULL,
    'Cuddalore Cashew & Sugarcane Merchant Yard [Demo Dealer]',
    'Panruti Cashew Industrial Corridor, Cuddalore - 607106',
    '+91 90000 00008 (Sample Demo Only)',
    'Mon - Sat: 7:00 AM - 7:00 PM',
    11.7480, 79.7714, 'Cuddalore', 'Tamil Nadu',
    'Oilseed Expeller & Commercial Processor',
    'Raw cashew nuts dried to < 9% moisture; direct mill price with zero commission.',
    true, false
  ),
  (
    '00000000-0000-0000-0001-000000000009', NULL,
    'Vellore North Arcot Oilseeds & Grain Mandi [Demo Dealer]',
    'Katpadi Old Mandi Street, Vellore - 632004',
    '+91 90000 00009 (Sample Demo Only)',
    'Mon - Sat: 6:30 AM - 6:30 PM',
    12.9165, 79.1325, 'Vellore', 'Tamil Nadu',
    'Feed Mill & Poultry Grain Buyer',
    'Maize and oilseeds for cattle and poultry feed; prompt settlement upon quality check.',
    true, false
  ),
  (
    '00000000-0000-0000-0001-000000000010', NULL,
    'Tirunelveli Nellai Agro Traders & Pulses Hub [Demo Dealer]',
    'Tiruchendur Road, Palayamkottai, Tirunelveli - 627002',
    '+91 90000 00010 (Sample Demo Only)',
    'Mon - Sat: 7:00 AM - 7:00 PM',
    8.7139, 77.7567, 'Tirunelveli', 'Tamil Nadu',
    'Wholesale Mandi Merchant',
    'Clean dry pulses and paddy; no insect damage; direct bank payout on weighing.',
    true, false
  )
ON CONFLICT (id) DO UPDATE SET
  shop_name = EXCLUDED.shop_name,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  opening_hours = EXCLUDED.opening_hours,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  district = EXCLUDED.district,
  state = EXCLUDED.state,
  buyer_type = EXCLUDED.buyer_type,
  purchase_conditions = EXCLUDED.purchase_conditions,
  is_demo = EXCLUDED.is_demo,
  verified = EXCLUDED.verified;

-- ==============================================================================
-- IDEMPOTENT SEED DATA: 10 DEMO MACHINERY EQUIPMENT & DRIVERS (FIX 2)
-- Deterministic UUID range: 00000000-0000-0000-0002-000000000001 .. 000000000010
-- ==============================================================================
INSERT INTO machinery (
  id, provider_id, name, type, description, price_per_hour, location, latitude, longitude, available, image_url, service_type, driver_name, experience_years, is_demo
) VALUES
  (
    '00000000-0000-0000-0002-000000000001', NULL,
    'Murugan K. (Demo Profile) — Mahindra 45HP Tractor',
    'Tractor',
    'Demonstration driver profile for illustrative purposes. Skilled in wetland puddling and fine tilth rotavator preparation for paddy and groundnut.',
    750, 'Katpadi, Vellore (Sample Location)', 12.9710, 79.1380, true,
    'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80',
    'Rotavator & Seedbed Tillage', 'Murugan K. (Demo Operator)', 9, true
  ),
  (
    '00000000-0000-0000-0002-000000000002', NULL,
    'Selvam P. (Demo Profile) — John Deere 50HP with Cultivator',
    'Tractor',
    'Demonstration driver profile for illustrative purposes. Specializes in hard-pan breaking, heavy 9-tyne cultivator work, and dryland harrowing.',
    800, 'Polur, Thiruvannamalai (Sample Location)', 12.5020, 79.1240, true,
    'https://images.unsplash.com/photo-1584441405886-bc91be61e56a?auto=format&fit=crop&w=800&q=80',
    'Deep Disc Ploughing & Cultivator', 'Selvam P. (Demo Operator)', 12, true
  ),
  (
    '00000000-0000-0000-0002-000000000003', NULL,
    'Arumugam S. (Demo Profile) — Kubota Track Harvester',
    'Paddy Harvester',
    'Demonstration driver profile for illustrative purposes. Rubber crawler track harvester operator with minimal grain loss in wet Delta paddy fields.',
    1600, 'Kumbakonam, Thanjavur (Sample Location)', 10.9602, 79.3845, true,
    'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?auto=format&fit=crop&w=800&q=80',
    'Paddy Reaping, Threshing & Bagging', 'Arumugam S. (Demo Operator)', 7, true
  ),
  (
    '00000000-0000-0000-0002-000000000004', NULL,
    'Kandasamy V. (Demo Profile) — VST 13HP Power Tiller',
    'Power Tiller',
    'Demonstration driver profile for illustrative purposes. Maneuverable walking power tiller operator for narrow terrace fields and banana plots.',
    500, 'Gudiyatham, Vellore (Sample Location)', 12.9460, 78.8710, true,
    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80',
    'Wetland Puddling & Small-Plot Work', 'Kandasamy V. (Demo Operator)', 10, true
  ),
  (
    '00000000-0000-0000-0002-000000000005', NULL,
    'Rajendran M. (Demo Profile) — Yanmar 4-Row Paddy Transplanter',
    'Transplanter',
    'Demonstration driver profile for illustrative purposes. Precision mechanical transplanter operator ensuring uniform mat seedling planting density.',
    1200, 'Mannargudi, Tiruvarur (Sample Location)', 10.6667, 79.4500, true,
    'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80',
    'System of Rice Intensification (SRI) Planting', 'Rajendran M. (Demo Operator)', 5, true
  ),
  (
    '00000000-0000-0000-0002-000000000006', NULL,
    'Mani T. (Demo Profile) — Laser Guided Land Leveller',
    'Laser Leveller',
    'Demonstration driver profile for illustrative purposes. High-precision dual-slope laser transmitter operator saving up to 25% irrigation water.',
    950, 'Omalur, Salem (Sample Location)', 11.7400, 78.0400, true,
    'https://images.unsplash.com/photo-1617576683096-00fc8eecb3af?auto=format&fit=crop&w=800&q=80',
    'Precision Field Grading & Slope Calibration', 'Mani T. (Demo Operator)', 8, true
  ),
  (
    '00000000-0000-0000-0002-000000000007', NULL,
    'Chinnadurai P. (Demo Profile) — 16L Battery Boom Sprayer Unit',
    'Sprayer',
    'Demonstration driver profile for illustrative purposes. Ultra-low volume canopy mist sprayer driver for balanced micro-nutrient and pest control.',
    350, 'Sathyamangalam, Erode (Sample Location)', 11.5042, 77.2389, true,
    'https://images.unsplash.com/photo-1584679109597-c656b19974c9?auto=format&fit=crop&w=800&q=80',
    'Foliar Micronutrient & Organic Bio-Spray', 'Chinnadurai P. (Demo Operator)', 6, true
  ),
  (
    '00000000-0000-0000-0002-000000000008', NULL,
    'Palanisamy K. (Demo Profile) — Shaktiman 7-Foot Rotary Slasher',
    'Rotary Slasher',
    'Demonstration driver profile for illustrative purposes. High-speed grass slasher operator for orchard clearing, sugarcane stubble mulching.',
    650, 'Pollachi, Coimbatore (Sample Location)', 10.6609, 77.0048, true,
    'https://images.unsplash.com/photo-1590682680695-43b964a3ae17?auto=format&fit=crop&w=800&q=80',
    'Post-Harvest Stubble Mulching & Weed Slashing', 'Palanisamy K. (Demo Operator)', 11, true
  ),
  (
    '00000000-0000-0000-0002-000000000009', NULL,
    'Venkatesan R. (Demo Profile) — Groundnut Digger & Shaker Unit',
    'Groundnut Harvester',
    'Demonstration driver profile for illustrative purposes. Tractor PTO-driven peanut pod lifter with vibratory shaker conveyor.',
    1100, 'Cheyyar, Tiruvannamalai (Sample Location)', 12.6580, 79.5420, true,
    'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80',
    'Groundnut Pod Inversion & Soil Separation', 'Venkatesan R. (Demo Operator)', 14, true
  ),
  (
    '00000000-0000-0000-0002-000000000010', NULL,
    'Subramani G. (Demo Profile) — Multi-Crop Axial Flow Thresher',
    'Thresher',
    'Demonstration driver profile for illustrative purposes. High-output clean threshing for black gram, green gram, soybean, and millets.',
    850, 'Madurai North, Madurai (Sample Location)', 9.9400, 78.1300, true,
    'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?auto=format&fit=crop&w=800&q=80',
    'Pulse & Millet Threshing with Dual Aspiration', 'Subramani G. (Demo Operator)', 15, true
  )

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  description = EXCLUDED.description,
  price_per_hour = EXCLUDED.price_per_hour,
  location = EXCLUDED.location,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  available = EXCLUDED.available,
  image_url = EXCLUDED.image_url,
  service_type = EXCLUDED.service_type,
  driver_name = EXCLUDED.driver_name,
  experience_years = EXCLUDED.experience_years,
  is_demo = EXCLUDED.is_demo;

-- ==============================================================================
-- IDEMPOTENT SEED DATA: 50 DEMO E-COMMERCE PRODUCTS (FIX 8)
-- Deterministic UUID range: 00000000-0000-0000-0003-000000000001 .. 000000000050
-- ==============================================================================
INSERT INTO products (
  id, dealer_id, name, category, description, price, stock, pack_size, unit, image_url, is_demo
) VALUES
  -- 10 SEEDS
  ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0001-000000000001', 'Certified Paddy Seeds (BPT 5204 Samba Masuri)', 'Seeds', 'Government certified breeder-foundation seed with 98% germination guarantee. 140-145 days duration, fine grain variety.', 1150, 45, '25 kg Bag', 'Bag (25 kg)', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0001-000000000001', 'High-Yielding Hybrid Maize Seeds (COH(M) 8)', 'Seeds', 'Drought-tolerant single cross hybrid maize. High test weight, orange-yellow flint grains suitable for poultry feed and starch.', 480, 60, '4 kg Pack', 'Pack (4 kg)', 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0001-000000000002', 'Certified Groundnut Seeds (TMV 7 Bold Pods)', 'Seeds', 'High oil content (49%) bunch-type groundnut seeds. Treated with Trichoderma viride against collar rot.', 1450, 35, '15 kg Bag', 'Bag (15 kg)', 'https://images.unsplash.com/photo-1567894340315-735d7c361db0?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000004', '00000000-0000-0000-0001-000000000002', 'Black Gram Seeds (VBN 8 Certified Urad)', 'Seeds', 'Mungbean yellow mosaic virus (MYMV) resistant pulse variety. Synchronized maturity in 65-70 days.', 340, 50, '2 kg Pack', 'Pack (2 kg)', 'https://images.unsplash.com/photo-1585652616655-0814421b05fc?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000005', '00000000-0000-0000-0001-000000000001', 'Green Gram Seeds (CO 8 Moong Dal)', 'Seeds', 'Bold shiny green seeds with high protein content (24%). Suitable for rice fallow and rainfed conditions.', 320, 40, '2 kg Pack', 'Pack (2 kg)', 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000006', '00000000-0000-0000-0001-000000000003', 'Barnyard Millet Seeds (Kuthiraivali Certified MDU 1)', 'Seeds', 'Climate-resilient short-duration millet (95-100 days). High dietary fiber and low glycemic index.', 190, 75, '1 kg Pack', 'Pack (1 kg)', 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000007', '00000000-0000-0000-0001-000000000003', 'Foxtail Millet Seeds (Tenai Certified CO 7)', 'Seeds', 'Nutrient-dense drought-hardy traditional grain. Rich in minerals and vitamin B12.', 180, 80, '1 kg Pack', 'Pack (1 kg)', 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000008', '00000000-0000-0000-0001-000000000002', 'Cotton Hybrid Seeds (RCH 659 BG II)', 'Seeds', 'Bollworm-resistant premium hybrid cotton seeds with high ginning turnout (36%) and long staple fibers.', 860, 55, '450 g Packet', 'Packet (450 g)', 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000009', '00000000-0000-0000-0001-000000000003', 'Hybrid Tomato Seeds (Shivam 3550)', 'Seeds', 'High-yielding determinate tomato hybrid with thick pericarp, excellent shelf life and field transportability.', 620, 90, '10 g Pouch', 'Pouch (10 g)', 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000010', '00000000-0000-0000-0001-000000000001', 'F1 Hybrid Bhendi Seeds (Singham Okra)', 'Seeds', 'Dark green, five-ridged slender tender fruits resistant to Yellow Vein Mosaic Virus (YVMV).', 450, 65, '100 g Pouch', 'Pouch (100 g)', 'https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?auto=format&fit=crop&w=600&q=80', true),

  -- 10 SIMPLE, LOW-BUDGET EQUIPMENT
  ('00000000-0000-0000-0003-000000000011', '00000000-0000-0000-0001-000000000001', '16-Litre 2-in-1 Dual Battery Knapsack Sprayer', 'Simple, low-budget equipment', 'High-pressure 12V 12AH battery and manual hand pump backup with 4 multi-spray nozzles and brass lance.', 2250, 30, '1 Complete Unit', 'Unit', 'https://images.unsplash.com/photo-1584679109597-c656b19974c9?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000012', '00000000-0000-0000-0001-000000000001', 'Cono Weeder for Wetland Paddy (Single Row)', 'Simple, low-budget equipment', 'Ergonomic dual-rotor manual cono weeder. Uproots weeds and incorporates them into wetland soil for organic aeration.', 1450, 25, '1 Unit', 'Unit', 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000013', '00000000-0000-0000-0001-000000000002', 'Manual Push-Wheel Seed Drill & Fertilizer Applicator', 'Simple, low-budget equipment', 'Single-row direct seeder for maize, groundnut, and black gram with adjustable depth control (2-6 cm).', 2800, 18, '1 Unit', 'Unit', 'https://images.unsplash.com/photo-1589923188651-268a9f65e321?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000014', '00000000-0000-0000-0001-000000000002', 'High-Carbon Steel Hand Sickles (Pack of 3)', 'Simple, low-budget equipment', 'Forged serrated curved blades with polished teakwood handles for swift, fatigue-free paddy harvest.', 380, 85, 'Pack of 3 Sickles', 'Pack of 3', 'https://images.unsplash.com/photo-1599685315640-9ceeb2f5897d?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000015', '00000000-0000-0000-0001-000000000003', 'Hand-Operated Vegetable Seedling Transplanter', 'Simple, low-budget equipment', 'Double-handle stainless steel walk-behind jab seeder for tomato, chili, brinjal, and onion plugs.', 1150, 40, '1 Transplanter Pipe', 'Unit', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000016', '00000000-0000-0000-0001-000000000003', 'HDPE Micro Drip Irrigation Kit (50 Plants DIY)', 'Simple, low-budget equipment', 'Complete low-pressure home-farm drip set with 16mm mainline, 50 pin drippers, punch, joints, and filter.', 890, 50, '1 Kit (50 Plants)', 'DIY Kit', 'https://images.unsplash.com/photo-1584679109594-55c3c2f9e421?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000017', '00000000-0000-0000-0001-000000000001', 'Multi-Purpose Manual Wheel Hoe Weeder (2 Blades)', 'Simple, low-budget equipment', 'All-steel garden & farm push weeder with 6-inch trenching shovel and reversible 8-inch flat weed blade.', 1650, 22, '1 Wheel Weeder', 'Unit', 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000018', '00000000-0000-0000-0001-000000000002', 'Heavy-Duty Brass Garden & Tree Spray Gun', 'Simple, low-budget equipment', 'Adjustable mist-to-jet solid brass nozzle capable of 35-foot vertical reach for mango and coconut spraying.', 520, 60, '1 Brass Lance', 'Unit', 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000019', '00000000-0000-0000-0001-000000000003', 'Portable Hanging Electronic Crane Scale (300 kg)', 'Simple, low-budget equipment', 'High-precision digital luggage & crop bag scale with backlit LCD, tare function, and forged steel shackle hook.', 980, 45, '1 Digital Scale', 'Unit', 'https://images.unsplash.com/photo-1599685315640-9ceeb2f5897d?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000020', '00000000-0000-0000-0001-000000000001', 'UV-Stabilized Grain Storage Tarpaulin Sheet (24x18 Ft)', 'Simple, low-budget equipment', 'Multi-layered cross-laminated 250 GSM waterproof tarpaulin for threshing floor and grain moisture barrier.', 1850, 35, '1 Tarpaulin (24x18 Ft)', 'Sheet', 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80', true),

  -- 10 FERTILIZERS
  ('00000000-0000-0000-0003-000000000021', '00000000-0000-0000-0001-000000000001', 'Enriched Neem Coated Urea (46% N)', 'Fertilizers', 'High-efficiency slow-release nitrogenous fertilizer with organic neem extract reducing leaching losses.', 266, 200, '45 kg Bag', 'Bag (45 kg)', 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000022', '00000000-0000-0000-0001-000000000001', 'Di-Ammonium Phosphate (DAP 18-46-0)', 'Fertilizers', 'Standard basal fertilizer providing soluble nitrogen and available phosphate for root establishment.', 1350, 120, '50 kg Bag', 'Bag (50 kg)', 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000023', '00000000-0000-0000-0001-000000000002', 'Muriate of Potash (MOP 0-0-60 White/Pink)', 'Fertilizers', 'Potassium nutrient essential for drought resistance, grain filling, and pest immunity in crops.', 1650, 90, '50 kg Bag', 'Bag (50 kg)', 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000024', '00000000-0000-0000-0001-000000000002', 'IFFCO Nano Urea Liquid (500 ml Bottle)', 'Fertilizers', 'Advanced nanotechnology foliar spray replacing 1 bag of conventional urea with 80% absorption rate.', 225, 150, '500 ml Bottle', 'Bottle (500 ml)', 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000025', '00000000-0000-0000-0001-000000000003', '100% Water-Soluble NPK 19-19-19 Foliar Grade', 'Fertilizers', 'Balanced macro-nutrient fertilizer for drip irrigation and foliar spray during vegetative growth.', 140, 180, '1 kg Pouch', 'Pouch (1 kg)', 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000026', '00000000-0000-0000-0001-000000000003', 'Chelated Micronutrient Fertilizer (Zinc EDTA 12%)', 'Fertilizers', 'Fully soluble organic chelated zinc preventing Khaira disease in paddy and leaf chlorosis.', 380, 75, '500 g Pack', 'Pack (500 g)', 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000027', '00000000-0000-0000-0001-000000000001', 'Agricultural Gypsum (Calcium Sulfate 85%)', 'Fertilizers', 'Soil conditioner for sodic soil reclamation and pegging nutrient for bold groundnut pods.', 320, 100, '50 kg Bag', 'Bag (50 kg)', 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000028', '00000000-0000-0000-0001-000000000002', 'Agricultural Elemental Sulphur 90% (Bentonite Granules)', 'Fertilizers', 'Fourth essential macro-nutrient enhancing oil percentage in groundnut, sesame, and mustard crops.', 450, 60, '10 kg Bucket', 'Bucket (10 kg)', 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000029', '00000000-0000-0000-0001-000000000003', 'Potassium Schoenite (K2O 23%, MgO 11% Soluble)', 'Fertilizers', 'Chlorine-free dual nutrient fertilizer ideal for sugarcane, banana, turmeric, and vegetables.', 1100, 45, '25 kg Bag', 'Bag (25 kg)', 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000030', '00000000-0000-0000-0001-000000000001', 'Ferrous Sulphate Agricultural Grade (Iron 19%)', 'Fertilizers', 'Cures iron deficiency (yellowing) in high pH alkaline soils, pulses, sugarcane, and groundnut.', 280, 80, '25 kg Bag', 'Bag (25 kg)', 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80', true),

  -- 10 ORGANIC FOODS
  ('00000000-0000-0000-0003-000000000031', '00000000-0000-0000-0001-000000000001', 'Cold-Pressed Native Chekku Groundnut Oil', 'Organic foods', 'Wood-churned, unrefined, chemical-free groundnut oil extracted from naturally farmed TMV 7 pods.', 280, 70, '1 Litre Glass Bottle', 'Litre (1 L)', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000032', '00000000-0000-0000-0001-000000000001', 'Wood-Pressed Pure Sesame (Gingelly) Oil', 'Organic foods', 'Traditional mara chekku gingelly oil cold-pressed with palm jaggery. Rich in natural sesamol antioxidants.', 360, 50, '1 Litre Glass Bottle', 'Litre (1 L)', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000033', '00000000-0000-0000-0001-000000000002', 'Traditional Heritage Red Rice (Mappillai Samba)', 'Organic foods', 'Authentic Tamil Nadu heritage red rice rich in iron, zinc, and dietary fiber. Boosts physical stamina.', 140, 90, '1 kg Pouch', 'Pack (1 kg)', 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000034', '00000000-0000-0000-0001-000000000002', 'Aromatic Seeraga Samba Traditional Biryani Rice', 'Organic foods', 'Small ovular fragrant grain famed for Dindigul biryani. Organically cultivated in Cauvery delta basin.', 160, 80, '1 kg Pouch', 'Pack (1 kg)', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000035', '00000000-0000-0000-0001-000000000003', 'Pure Organic Chemical-Free Country Jaggery (Naatu Sakkarai)', 'Organic foods', 'Unbleached natural sugarcane brown sugar powder crafted without sulphur or synthetic clarifiers.', 95, 120, '1 kg Pouch', 'Pack (1 kg)', 'https://images.unsplash.com/photo-1607672632458-9eb56696346b?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000036', '00000000-0000-0000-0001-000000000003', 'Raw Unfiltered Multi-Flora Wild Forest Honey', 'Organic foods', 'Directly harvested from Jawadhu hill forests by tribal cooperatives. Raw, unheated, unpasteurized.', 420, 45, '500 g Glass Jar', 'Jar (500 g)', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000037', '00000000-0000-0000-0001-000000000001', 'Pure Organic Turmeric Powder (Curcumin 4.5% Erode)', 'Organic foods', 'Stone-ground golden yellow turmeric harvested from certified organic farms in Erode district.', 220, 85, '500 g Pouch', 'Pack (500 g)', 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000038', '00000000-0000-0000-0001-000000000002', 'A2 Desi Gir Cow Vedic Cultured Bilona Ghee', 'Organic foods', 'Traditional clay pot bilona churned ghee from free-range native cows. High in butyric acid.', 850, 30, '500 ml Glass Jar', 'Jar (500 ml)', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000039', '00000000-0000-0000-0001-000000000003', 'Traditional Karuppu Kavuni (Black Emperor Rice)', 'Organic foods', 'Deep purple-black anti-oxidant dense heirloom rice packed with anthocyanins and essential amino acids.', 190, 60, '1 kg Pouch', 'Pack (1 kg)', 'https://images.unsplash.com/photo-1585652616655-0814421b05fc?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000040', '00000000-0000-0000-0001-000000000001', 'Unpolished High-Protein Native Toor Dal (Pigeon Pea)', 'Organic foods', 'Naturally grown, wood-dehulled yellow split pigeon peas. Cooks soft with rich creamy aroma.', 185, 75, '1 kg Pouch', 'Pack (1 kg)', 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80', true),

  -- 10 OTHER AGRICULTURAL PRODUCTS
  ('00000000-0000-0000-0003-000000000041', '00000000-0000-0000-0001-000000000001', 'Premium Compressed Low-EC Cocopeat Block (5 kg)', 'Other agricultural products', 'Washed coconut coir pith block expanding to 75 Litres of aerated soilless growing media.', 160, 150, '5 kg Block', 'Block (5 kg)', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000042', '00000000-0000-0000-0001-000000000001', 'Bio-Composted Earthworm Castings (Vermicompost)', 'Other agricultural products', 'Pure odorless vermicompost enriched with beneficial microbial flora, humic acid, and plant hormones.', 350, 80, '40 kg Bag', 'Bag (40 kg)', 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000043', '00000000-0000-0000-0001-000000000002', 'Cold-Pressed De-Oiled Neem Cake Powder (Fertilizer & Nematicide)', 'Other agricultural products', 'Pure neem seed meal containing azadirachtin (min 1000 ppm) combating root-knot nematodes and grubs.', 550, 70, '25 kg Bag', 'Bag (25 kg)', 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000044', '00000000-0000-0000-0001-000000000002', 'Trichoderma Viride Bio-Fungicide (1% WP)', 'Other agricultural products', 'Antagonistic fungal biocontrol agent preventing damping off, root rot, wilt, and collar rot in seedlings.', 160, 110, '1 kg Pack', 'Pack (1 kg)', 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000045', '00000000-0000-0000-0001-000000000003', 'Pseudomonas Fluorescens Bio-Pesticide (1% WP)', 'Other agricultural products', 'Beneficial rhizobacteria promoting systemic acquired resistance and controlling sheath blight and leaf spots.', 150, 95, '1 kg Pack', 'Pack (1 kg)', 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000046', '00000000-0000-0000-0001-000000000003', 'Silpaulin Multi-Layer UV Cross-Laminated Azolla Sheet (12x4 Ft)', 'Other agricultural products', 'Durable 200 GSM flexible bed tailored for cultivating nutritious green azolla cattle feed supplement.', 680, 50, '1 Azolla Bed', 'Unit', 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000047', '00000000-0000-0000-0001-000000000001', 'Pheromone Trap for Fall Armyworm & Cotton Bollworm (5 Sets)', 'Other agricultural products', 'Funnel pheromone trap with species-specific lures for eco-friendly pest monitoring without toxic chemicals.', 450, 65, 'Set of 5 Traps + Lures', 'Set of 5', 'https://images.unsplash.com/photo-1584679109594-55c3c2f9e421?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000048', '00000000-0000-0000-0001-000000000002', 'Yellow & Blue Sticky Insect Traps (Pack of 25)', 'Other agricultural products', 'Weather-resistant sticky sheets capturing whiteflies, aphids, thrips, and leaf miners in vegetable farms.', 290, 80, 'Pack of 25 Traps', 'Pack of 25', 'https://images.unsplash.com/photo-1584679109594-55c3c2f9e421?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000049', '00000000-0000-0000-0001-000000000003', 'Virgin HDPE UV-Treated Shade Net 50% Green (3x10 Mtr)', 'Other agricultural products', 'Premium nursery shade netting shielding tender saplings, vegetables, and flowers from harsh sun heat.', 790, 40, '1 Roll (3x10 M)', 'Roll', 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=600&q=80', true),
  ('00000000-0000-0000-0003-000000000050', '00000000-0000-0000-0001-000000000001', 'Concentrated Bio-Active Humic & Fulvic Acid Liquid (1 L)', 'Other agricultural products', 'Naturally mined potassium humate (12%) stimulating root elongation, nutrient uptake, and soil buffering.', 380, 85, '1 Litre Bottle', 'Litre (1 L)', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80', true)

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  pack_size = EXCLUDED.pack_size,
  unit = EXCLUDED.unit,
  image_url = EXCLUDED.image_url,
  is_demo = EXCLUDED.is_demo;
