-- ==============================================================================
-- AgriME Platform — Migration: 20261023_daily_mandi_prices.sql
-- Daily Agmarknet APMC Mandi Prices Table for Cloud Cache & Zero-Block Ingestion
-- ==============================================================================

CREATE TABLE IF NOT EXISTS daily_mandi_prices (
  id TEXT PRIMARY KEY,
  state TEXT NOT NULL DEFAULT 'Tamil Nadu',
  district TEXT NOT NULL,
  market TEXT NOT NULL,
  commodity TEXT NOT NULL,
  variety TEXT NOT NULL DEFAULT 'General',
  grade TEXT DEFAULT 'FAQ',
  arrival_date TEXT NOT NULL,
  min_price NUMERIC NOT NULL,
  max_price NUMERIC NOT NULL,
  modal_price NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT '₹/Quintal',
  source TEXT NOT NULL DEFAULT 'Ministry of Agriculture and Farmers Welfare (Agmarknet) via data.gov.in',
  source_status TEXT NOT NULL DEFAULT 'LIVE',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Fast lookup indexes for common queries
CREATE INDEX IF NOT EXISTS idx_daily_mandi_state ON daily_mandi_prices(state);
CREATE INDEX IF NOT EXISTS idx_daily_mandi_district ON daily_mandi_prices(district);
CREATE INDEX IF NOT EXISTS idx_daily_mandi_commodity ON daily_mandi_prices(commodity);
CREATE INDEX IF NOT EXISTS idx_daily_mandi_market ON daily_mandi_prices(market);
CREATE INDEX IF NOT EXISTS idx_daily_mandi_updated ON daily_mandi_prices(updated_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE daily_mandi_prices ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all users
DROP POLICY IF EXISTS "Public read daily_mandi_prices" ON daily_mandi_prices;
CREATE POLICY "Public read daily_mandi_prices"
  ON daily_mandi_prices FOR SELECT
  USING (true);

-- Allow public/service upsert for ingestion sync
DROP POLICY IF EXISTS "Allow sync upsert daily_mandi_prices" ON daily_mandi_prices;
CREATE POLICY "Allow sync upsert daily_mandi_prices"
  ON daily_mandi_prices FOR ALL
  USING (true)
  WITH CHECK (true);
