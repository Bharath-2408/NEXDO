-- ==============================================================================
-- NEXDO GPS & REAL-TIME LIVE TRACKING SCHEMA MIGRATION
-- Migration: 20261016000005_add_gps_and_live_tracking.sql
-- Adds GPS coordinates, tracking timestamps & telemetry to profiles & bookings
-- ==============================================================================

-- 1. Add GPS coordinates, location freshness, and sharing toggle to technician_profiles
ALTER TABLE public.technician_profiles
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS is_location_shared BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_technician_profiles_gps
    ON public.technician_profiles(latitude, longitude)
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- 2. Add GPS coordinates to bookings table
ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS idx_bookings_gps
    ON public.bookings(latitude, longitude)
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- 3. Dedicated technician_locations telemetry table for live tracking audit & streaming
CREATE TABLE IF NOT EXISTS public.technician_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    technician_id UUID NOT NULL REFERENCES public.technician_profiles(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90.0 AND latitude <= 90.0),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180.0 AND longitude <= 180.0),
    accuracy_meters DOUBLE PRECISION,
    speed_mps DOUBLE PRECISION,
    heading_degrees DOUBLE PRECISION,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_technician_locations_tech_time
    ON public.technician_locations(technician_id, recorded_at DESC);

-- 4. Enable RLS on technician_locations
ALTER TABLE public.technician_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS technician_locations_insert_own ON public.technician_locations;
CREATE POLICY technician_locations_insert_own ON public.technician_locations
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.technician_profiles tp
            WHERE tp.id = technician_locations.technician_id AND tp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS technician_locations_select_authorized ON public.technician_locations;
CREATE POLICY technician_locations_select_authorized ON public.technician_locations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.technician_profiles tp
            WHERE tp.id = technician_locations.technician_id AND tp.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.technician_id = technician_locations.technician_id
              AND b.customer_id = auth.uid()
              AND b.status IN ('ACCEPTED', 'TECHNICIAN_ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'WORK_IN_PROGRESS')
        )
    );
