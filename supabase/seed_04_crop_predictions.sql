-- ==============================================================================
-- AgriME Platform — Reference Seed 04: Crop Predictions
-- Reference price trend forecast models for development & demo.
-- Not live automated AI predictions.
-- Run after seed_01_crops.sql and seed_02_markets.sql.
-- ==============================================================================

INSERT INTO crop_predictions (id, crop_id, market_id, current_price, predicted_min, predicted_max, trend, prediction_date, prediction_period) VALUES
  ('44444444-4444-4444-4444-444444444401', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201', 3450, 3600, 3850, 'up', CURRENT_DATE, 'Next 15 Days (Harvest Peak)'),
  ('44444444-4444-4444-4444-444444444402', '11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222202', 6850, 7100, 7400, 'up', CURRENT_DATE, 'Next 30 Days (Export Demand)'),
  ('44444444-4444-4444-4444-444444444403', '11111111-1111-1111-1111-111111111106', '22222222-2222-2222-2222-222222222203', 1850, 1400, 1650, 'down', CURRENT_DATE, 'Next 7 Days (Arrival Surge)'),
  ('44444444-4444-4444-4444-444444444404', '11111111-1111-1111-1111-111111111105', '22222222-2222-2222-2222-222222222205', 7420, 7500, 7850, 'up', CURRENT_DATE, 'Next 20 Days (Textile Demand)'),
  ('44444444-4444-4444-4444-444444444405', '11111111-1111-1111-1111-111111111107', '22222222-2222-2222-2222-222222222204', 2450, 2400, 2520, 'stable', CURRENT_DATE, 'Next 30 Days (Steady Buffer)'),
  ('44444444-4444-4444-4444-444444444406', '11111111-1111-1111-1111-111111111110', '22222222-2222-2222-2222-222222222201', 2200, 2600, 3100, 'up', CURRENT_DATE, 'Next 15 Days (Seasonal Inflow Drop)')
ON CONFLICT (id) DO UPDATE SET
  current_price = EXCLUDED.current_price,
  predicted_min = EXCLUDED.predicted_min,
  predicted_max = EXCLUDED.predicted_max,
  trend = EXCLUDED.trend,
  prediction_date = EXCLUDED.prediction_date,
  prediction_period = EXCLUDED.prediction_period;
