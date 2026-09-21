-- ==============================================================================
-- AgriME Platform — Reference Seed 01: Crops
-- Safe reference data for development & demo. Run after schema.sql.
-- ==============================================================================

INSERT INTO crops (id, name, category) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Paddy (Basmati)', 'Cereals'),
  ('11111111-1111-1111-1111-111111111102', 'Paddy (Common / Sona Masuri)', 'Cereals'),
  ('11111111-1111-1111-1111-111111111103', 'Groundnut (Peanut)', 'Oilseeds'),
  ('11111111-1111-1111-1111-111111111104', 'Maize (Corn)', 'Cereals'),
  ('11111111-1111-1111-1111-111111111105', 'Cotton (Long Staple)', 'Fiber'),
  ('11111111-1111-1111-1111-111111111106', 'Tomato (Hybrid)', 'Vegetables'),
  ('11111111-1111-1111-1111-111111111107', 'Wheat (Sharbati)', 'Cereals'),
  ('11111111-1111-1111-1111-111111111108', 'Soybean', 'Oilseeds'),
  ('11111111-1111-1111-1111-111111111109', 'Sugarcane', 'Commercial'),
  ('11111111-1111-1111-1111-111111111110', 'Onion (Red)', 'Vegetables')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category;
