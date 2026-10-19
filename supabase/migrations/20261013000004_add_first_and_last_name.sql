-- ============================================================================
-- NEXDO MIGRATION: ADD FIRST_NAME AND LAST_NAME TO USERS & PROFILES
-- Supports structured First Name + Last Name registration and display while
-- preserving full_name for backward compatibility with existing records.
-- ============================================================================

-- 1. Add first_name and last_name columns to public.users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT;

-- 2. Add first_name and last_name columns to public.customer_profiles
ALTER TABLE public.customer_profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT;

-- 3. Add first_name and last_name columns to public.technician_profiles
ALTER TABLE public.technician_profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT;

-- 4. Backfill existing customer_profiles where first_name is null
UPDATE public.customer_profiles
SET
  first_name = COALESCE(NULLIF(SPLIT_PART(TRIM(full_name), ' ', 1), ''), full_name),
  last_name = CASE
    WHEN POSITION(' ' IN TRIM(full_name)) > 0
      THEN TRIM(SUBSTRING(TRIM(full_name) FROM POSITION(' ' IN TRIM(full_name)) + 1))
    ELSE ''
  END
WHERE first_name IS NULL AND full_name IS NOT NULL;

-- 5. Backfill existing technician_profiles where first_name is null
UPDATE public.technician_profiles
SET
  first_name = COALESCE(NULLIF(SPLIT_PART(TRIM(full_name), ' ', 1), ''), full_name),
  last_name = CASE
    WHEN POSITION(' ' IN TRIM(full_name)) > 0
      THEN TRIM(SUBSTRING(TRIM(full_name) FROM POSITION(' ' IN TRIM(full_name)) + 1))
    ELSE ''
  END
WHERE first_name IS NULL AND full_name IS NOT NULL;
