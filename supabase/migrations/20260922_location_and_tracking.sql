-- ==============================================================================
-- AgriME Platform — Migration: 20260922_location_and_tracking.sql
-- PHASE 1: Location-Based Discovery & Real-Time Machinery Tracking
-- Safe, non-destructive migration. Preserves all existing records and schema.
-- ==============================================================================

-- 1. Add nullable geographic coordinates to dealers table
ALTER TABLE dealers 
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS district TEXT;

-- 2. Add nullable geographic coordinates to machinery table
ALTER TABLE machinery 
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- 3. Safely update machinery_bookings status check constraint to support the full state machine
-- States: pending, accepted, on_the_way, arrived, in_progress, completed, cancelled, rejected
DO $$
BEGIN
  -- Drop existing status constraint if present
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'machinery_bookings_status_check' 
    AND table_name = 'machinery_bookings'
  ) THEN
    ALTER TABLE machinery_bookings DROP CONSTRAINT machinery_bookings_status_check;
  END IF;

  -- Add updated constraint with full lifecycle states
  ALTER TABLE machinery_bookings 
    ADD CONSTRAINT machinery_bookings_status_check 
    CHECK (status IN ('pending', 'accepted', 'on_the_way', 'arrived', 'in_progress', 'completed', 'cancelled', 'rejected'));
END $$;

-- 4. Create dedicated machinery_tracking table for real-time provider GPS positions
-- Holds single active/latest position record per booking to avoid unbounded table bloat
CREATE TABLE IF NOT EXISTS machinery_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES machinery_bookings(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  speed NUMERIC,
  heading NUMERIC,
  accuracy NUMERIC,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Optimal indexes for tracking queries
CREATE INDEX IF NOT EXISTS idx_machinery_tracking_booking_id ON machinery_tracking(booking_id);
CREATE INDEX IF NOT EXISTS idx_machinery_tracking_provider_id ON machinery_tracking(provider_id);
CREATE INDEX IF NOT EXISTS idx_machinery_tracking_recorded_at ON machinery_tracking(recorded_at DESC);

-- 5. Row Level Security (RLS) for machinery_tracking
ALTER TABLE machinery_tracking ENABLE ROW LEVEL SECURITY;

-- Provider can insert tracking for their own booking
DROP POLICY IF EXISTS "Providers can insert tracking for their booking" ON machinery_tracking;
CREATE POLICY "Providers can insert tracking for their booking"
  ON machinery_tracking FOR INSERT
  WITH CHECK (
    provider_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM machinery_bookings mb
      JOIN machinery m ON m.id = mb.machinery_id
      WHERE mb.id = machinery_tracking.booking_id
      AND m.provider_id = auth.uid()
    )
  );

-- Provider can update tracking for their own booking
DROP POLICY IF EXISTS "Providers can update tracking for their booking" ON machinery_tracking;
CREATE POLICY "Providers can update tracking for their booking"
  ON machinery_tracking FOR UPDATE
  USING (
    provider_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM machinery_bookings mb
      JOIN machinery m ON m.id = mb.machinery_id
      WHERE mb.id = machinery_tracking.booking_id
      AND m.provider_id = auth.uid()
    )
  );

-- Booking participants (both farmer and provider) can read tracking data
DROP POLICY IF EXISTS "Booking participants can read tracking" ON machinery_tracking;
CREATE POLICY "Booking participants can read tracking"
  ON machinery_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM machinery_bookings mb
      JOIN machinery m ON m.id = mb.machinery_id
      WHERE mb.id = machinery_tracking.booking_id
      AND (mb.farmer_id = auth.uid() OR m.provider_id = auth.uid())
    )
  );

-- 6. Enable Supabase Realtime publication for tracking and bookings tables
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE machinery_tracking;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE machinery_bookings;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
END $$;

-- 7. Seed verified geographic coordinates for existing reference dealers (Vellore & Ranipet, Tamil Nadu)
UPDATE dealers SET
  latitude = 12.9350,
  longitude = 79.1360,
  district = 'Vellore'
WHERE id = '77777777-7777-7777-7777-777777777701' AND latitude IS NULL;

UPDATE dealers SET
  latitude = 12.9050,
  longitude = 79.1250,
  district = 'Vellore'
WHERE id = '77777777-7777-7777-7777-777777777702' AND latitude IS NULL;

UPDATE dealers SET
  latitude = 12.9280,
  longitude = 79.3330,
  district = 'Ranipet'
WHERE id = '77777777-7777-7777-7777-777777777703' AND latitude IS NULL;
