-- ==============================================================================
-- AgriME Platform — Migration: 20260923_crop_prices_ingestion.sql
-- Near-Real-Time Crop Price Ingestion Schema & Realtime Publication
-- ==============================================================================

-- 1. Ensure crop_prices table has all normalized price, variety, and provenance columns
ALTER TABLE crop_prices
  ADD COLUMN IF NOT EXISTS modal_price NUMERIC,
  ADD COLUMN IF NOT EXISTS min_price NUMERIC,
  ADD COLUMN IF NOT EXISTS max_price NUMERIC,
  ADD COLUMN IF NOT EXISTS variety TEXT,
  ADD COLUMN IF NOT EXISTS source_status TEXT DEFAULT 'RECENT',
  ADD COLUMN IF NOT EXISTS arrival_date DATE DEFAULT CURRENT_DATE;

-- 2. Indexes for fast mandi lookups and time-series queries
CREATE INDEX IF NOT EXISTS idx_crop_prices_crop_id ON crop_prices(crop_id);
CREATE INDEX IF NOT EXISTS idx_crop_prices_market_id ON crop_prices(market_id);
CREATE INDEX IF NOT EXISTS idx_crop_prices_arrival_date ON crop_prices(arrival_date DESC);
CREATE INDEX IF NOT EXISTS idx_crop_prices_source_status ON crop_prices(source_status);

-- 3. Enable Supabase Realtime publication for crop_prices table
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE crop_prices;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
END $$;
