-- ============================================================================
-- NEXDO PRODUCTION MIGRATION: 20261013000003_add_username_and_multi_domain.sql
-- Adds unique username authentication support to public.users and indexes
-- multi-domain technician_skills lookups without altering existing tables.
-- ============================================================================

-- 1. Add unique username column to public.users (nullable for legacy accounts)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- 2. Add case-insensitive unique index on username
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower
  ON public.users (LOWER(username))
  WHERE username IS NOT NULL;

-- 3. Add composite index for multi-domain technician skill matching
CREATE INDEX IF NOT EXISTS idx_technician_skills_tech_code
  ON public.technician_skills (technician_id, skill_code);

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
