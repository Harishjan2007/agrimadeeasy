-- ==============================================================================
-- AgriME Platform — Migration: 20261021_role_onboarding_enhancements.sql
-- Role-Specific Onboarding & Profile Schema Alignment
-- Safe, non-destructive schema additions. Preserves all existing tables and data.
-- ==============================================================================

-- 1. Extend profiles table with structured geographic and preference fields
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS primary_crops TEXT[],
  ADD COLUMN IF NOT EXISTS main_interests TEXT[];

-- 2. Extend dealers table with state and produce procurement preferences
ALTER TABLE dealers 
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS bought_crops TEXT[],
  ADD COLUMN IF NOT EXISTS produce_categories TEXT[],
  ADD COLUMN IF NOT EXISTS purchase_conditions TEXT;

-- 3. Optimal index for dealer location queries and crop matching
CREATE INDEX IF NOT EXISTS idx_dealers_district ON dealers(district);
CREATE INDEX IF NOT EXISTS idx_profiles_role_district ON profiles(role, district);

-- 4. Safely support ON CONFLICT (profile_id) for dealers upsert
-- Check for existing duplicate profile_id records before creating the unique constraint.
-- Do NOT automatically delete or truncate user data if duplicates exist.
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  -- Count non-null profile_id duplicates
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT profile_id
    FROM dealers
    WHERE profile_id IS NOT NULL
    GROUP BY profile_id
    HAVING COUNT(*) > 1
  ) dups;

  IF duplicate_count > 0 THEN
    RAISE EXCEPTION 'AgriME Migration Aborted: Found % profile_id(s) with duplicate records in "dealers" table. The UNIQUE constraint "dealers_profile_id_unique" cannot be created until duplicate rows are manually resolved. Run the duplicate review query, resolve duplicates manually, and then re-run this migration.', duplicate_count;
  ELSE
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      JOIN pg_namespace n ON t.relnamespace = n.oid
      WHERE c.conname = 'dealers_profile_id_unique'
        AND t.relname = 'dealers'
    ) THEN
      ALTER TABLE dealers ADD CONSTRAINT dealers_profile_id_unique UNIQUE (profile_id);
    END IF;
  END IF;
END $$;

-- 5. Ensure RLS policies explicitly enforce ownership using both USING and WITH CHECK
DO $$
BEGIN
  -- Dealers: INSERT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'dealers' AND policyname = 'Dealers can insert their own record'
  ) THEN
    CREATE POLICY "Dealers can insert their own record"
      ON dealers FOR INSERT
      WITH CHECK (auth.uid() = profile_id);
  END IF;

  -- Dealers: UPDATE (enforce ownership with both USING and WITH CHECK)
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'dealers' AND policyname = 'Dealers can update their own record'
  ) THEN
    DROP POLICY "Dealers can update their own record" ON dealers;
  END IF;

  CREATE POLICY "Dealers can update their own record"
    ON dealers FOR UPDATE
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

  -- Machinery: UPDATE (enforce ownership with both USING and WITH CHECK)
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'machinery' AND policyname = 'Providers can update own machinery'
  ) THEN
    DROP POLICY "Providers can update own machinery" ON machinery;
  END IF;

  CREATE POLICY "Providers can update own machinery"
    ON machinery FOR UPDATE
    USING (auth.uid() = provider_id)
    WITH CHECK (auth.uid() = provider_id);
END $$;

