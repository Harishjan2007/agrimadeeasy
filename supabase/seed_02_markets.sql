-- ==============================================================================
-- AgriME Platform — Reference Seed 02: Markets (Regulated APMC Mandis)
-- Safe reference data for development & demo. Run after schema.sql.
-- ==============================================================================

INSERT INTO markets (id, name, location, latitude, longitude) VALUES
  ('22222222-2222-2222-2222-222222222201', 'Vellore Central APMC Mandi', 'Vellore, Tamil Nadu', 12.9165, 79.1325),
  ('22222222-2222-2222-2222-222222222202', 'Thiruvannamalai Regulated Market', 'Thiruvannamalai, Tamil Nadu', 12.2253, 79.0747),
  ('22222222-2222-2222-2222-222222222203', 'Kanchipuram Agricultural Market', 'Kanchipuram, Tamil Nadu', 12.8342, 79.7036),
  ('22222222-2222-2222-2222-222222222204', 'Salem Main Agri Market', 'Salem, Tamil Nadu', 11.6643, 78.1460),
  ('22222222-2222-2222-2222-222222222205', 'Guntur Mirchi & Grain Yard', 'Guntur, Andhra Pradesh', 16.3067, 80.4365),
  ('22222222-2222-2222-2222-222222222206', 'Kurnool APMC Market', 'Kurnool, Andhra Pradesh', 15.8281, 78.0373)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude;
