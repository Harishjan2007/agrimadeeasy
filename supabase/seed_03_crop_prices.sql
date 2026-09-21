-- ==============================================================================
-- AgriME Platform — Reference Seed 03: Crop Prices
-- Reference mandi benchmark prices for development & demo. Not a real-time live feed.
-- Run after seed_01_crops.sql and seed_02_markets.sql.
-- ==============================================================================

INSERT INTO crop_prices (id, crop_id, market_id, price, unit, recorded_at, source) VALUES
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201', 3450, '₹/Quintal', now() - INTERVAL '3 hours', 'Vellore Mandi Reference Benchmark'),
  ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222201', 2380, '₹/Quintal', now() - INTERVAL '3 hours', 'Vellore Mandi Reference Benchmark'),
  ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222202', 6850, '₹/Quintal', now() - INTERVAL '2 hours', 'Thiruvannamalai Regulated Market Benchmark'),
  ('33333333-3333-3333-3333-333333333304', '11111111-1111-1111-1111-111111111104', '22222222-2222-2222-2222-222222222201', 2150, '₹/Quintal', now() - INTERVAL '4 hours', 'Vellore Mandi Reference Benchmark'),
  ('33333333-3333-3333-3333-333333333305', '11111111-1111-1111-1111-111111111105', '22222222-2222-2222-2222-222222222205', 7420, '₹/Quintal', now() - INTERVAL '1 hour', 'Guntur APMC Yard Benchmark'),
  ('33333333-3333-3333-3333-333333333306', '11111111-1111-1111-1111-111111111106', '22222222-2222-2222-2222-222222222203', 1850, '₹/Quintal', now() - INTERVAL '5 hours', 'Kanchipuram Farmers Market Benchmark'),
  ('33333333-3333-3333-3333-333333333307', '11111111-1111-1111-1111-111111111107', '22222222-2222-2222-2222-222222222204', 2450, '₹/Quintal', now() - INTERVAL '3 hours', 'Salem Agri Board Benchmark'),
  ('33333333-3333-3333-3333-333333333308', '11111111-1111-1111-1111-111111111110', '22222222-2222-2222-2222-222222222201', 2200, '₹/Quintal', now() - INTERVAL '2 hours', 'Vellore Mandi Reference Benchmark')
ON CONFLICT (id) DO UPDATE SET
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  recorded_at = EXCLUDED.recorded_at,
  source = EXCLUDED.source;
