-- ==============================================================================
-- NEXDO PRODUCTION DATABASE SCHEMA MIGRATION
-- Migration: 20261008000001_production_auth_and_security.sql
-- Relational tables, Foreign Keys, Indexes, Constraints & Row Security
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. USERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    phone TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('CUSTOMER', 'TECHNICIAN', 'ADMIN')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'PENDING')),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- ------------------------------------------------------------------------------
-- 2. SESSIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_token_hash TEXT NOT NULL UNIQUE,
    ip_address TEXT,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON public.sessions(session_token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON public.sessions(expires_at);

-- ------------------------------------------------------------------------------
-- 3. CUSTOMER PROFILES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    city TEXT NOT NULL DEFAULT 'Chennai',
    state TEXT NOT NULL DEFAULT 'Tamil Nadu',
    pincode TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_id ON public.customer_profiles(user_id);

-- ------------------------------------------------------------------------------
-- 4. TECHNICIAN PROFILES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.technician_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    service_area TEXT,
    experience_years INTEGER NOT NULL DEFAULT 0,
    verification_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    rating NUMERIC(3,2) NOT NULL DEFAULT 5.0,
    review_count INTEGER NOT NULL DEFAULT 0,
    completed_jobs_count INTEGER NOT NULL DEFAULT 0,
    subscription_plan TEXT DEFAULT 'FREE',
    online_status TEXT NOT NULL DEFAULT 'OFFLINE' CHECK (online_status IN ('ONLINE', 'OFFLINE')),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_technician_profiles_user_id ON public.technician_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_technician_profiles_online_status ON public.technician_profiles(online_status);
CREATE INDEX IF NOT EXISTS idx_technician_profiles_rating ON public.technician_profiles(rating);

-- ------------------------------------------------------------------------------
-- 5. TECHNICIAN SKILLS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.technician_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    technician_id UUID NOT NULL REFERENCES public.technician_profiles(id) ON DELETE CASCADE,
    skill_code TEXT NOT NULL,
    skill_name TEXT NOT NULL,
    category TEXT,
    experience_level TEXT NOT NULL DEFAULT 'INTERMEDIATE' CHECK (experience_level IN ('BEGINNER', 'INTERMEDIATE', 'EXPERT')),
    is_certified BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_technician_skills_tech_id ON public.technician_skills(technician_id);
CREATE INDEX IF NOT EXISTS idx_technician_skills_code ON public.technician_skills(skill_code);

-- ------------------------------------------------------------------------------
-- 6. SERVICE REQUESTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    service_category TEXT NOT NULL,
    service_code TEXT NOT NULL,
    service_description TEXT,
    service_mode TEXT NOT NULL CHECK (service_mode IN ('DIAGNOSIS', 'SERVICE')),
    requested_date TEXT,
    requested_time TEXT,
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'MATCHED', 'ACCEPTED', 'EXPIRED', 'CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_requests_customer_id ON public.service_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_code ON public.service_requests(service_code);

-- ------------------------------------------------------------------------------
-- 7. BOOKINGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_code TEXT UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    technician_id UUID NOT NULL REFERENCES public.technician_profiles(id) ON DELETE RESTRICT,
    service_request_id UUID REFERENCES public.service_requests(id) ON DELETE SET NULL,
    service_mode TEXT NOT NULL CHECK (service_mode IN ('DIAGNOSIS', 'SERVICE')),
    service_title TEXT NOT NULL,
    appointment_date TEXT NOT NULL,
    appointment_time TEXT NOT NULL,
    diagnosis_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
    service_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK (
        status IN ('REQUESTED', 'ACCEPTED', 'CONFIRMED', 'TECHNICIAN_ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
    ),
    confirmation_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (confirmation_status IN ('PENDING', 'CONFIRMED', 'REJECTED')),
    notes TEXT,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_technician_id ON public.bookings(technician_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_ref_code ON public.bookings(reference_code);

-- ------------------------------------------------------------------------------
-- 8. BOOKING STATUS HISTORY TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.booking_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID NOT NULL REFERENCES public.users(id),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_status_history_booking_id ON public.booking_status_history(booking_id);

-- ------------------------------------------------------------------------------
-- 9. PAYMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    amount NUMERIC(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    provider TEXT NOT NULL DEFAULT 'RAZORPAY',
    provider_transaction_id TEXT UNIQUE,
    payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')),
    payment_method_type TEXT NOT NULL,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(payment_status);

-- ------------------------------------------------------------------------------
-- 10. SUBSCRIPTIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    technician_id UUID NOT NULL REFERENCES public.technician_profiles(id) ON DELETE CASCADE,
    plan_tier TEXT NOT NULL CHECK (plan_tier IN ('DAILY', 'WEEKLY', 'MONTHLY')),
    amount NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED')),
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ NOT NULL,
    provider_transaction_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_tech_id ON public.subscriptions(technician_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- ------------------------------------------------------------------------------
-- 11. TECHNICIAN EARNINGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.technician_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    technician_id UUID NOT NULL REFERENCES public.technician_profiles(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
    gross_amount NUMERIC(10,2) NOT NULL,
    platform_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
    net_amount NUMERIC(10,2) NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'PAID',
    payout_status TEXT NOT NULL DEFAULT 'PROCESSED' CHECK (payout_status IN ('PENDING', 'PROCESSED', 'FAILED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_technician_earnings_tech_id ON public.technician_earnings(technician_id);
CREATE INDEX IF NOT EXISTS idx_technician_earnings_booking_id ON public.technician_earnings(booking_id);

-- ------------------------------------------------------------------------------
-- 12. NOTIFICATIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON public.notifications(read_at);

-- ------------------------------------------------------------------------------
-- 13. AUDIT LOGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    status TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
-- ==============================================================================
-- NEXDO PRODUCTION ROW LEVEL SECURITY (RLS) POLICIES
-- Migration: 20261008000002_enable_rls_and_policies.sql
-- Zero-Trust Multi-Tenant Isolation for Customer, Technician, and Admin roles
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. USERS TABLE RLS
-- ------------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select_own ON public.users;
CREATE POLICY users_select_own ON public.users
    FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS users_update_own ON public.users;
CREATE POLICY users_update_own ON public.users
    FOR UPDATE
    USING (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 2. SESSIONS TABLE RLS
-- ------------------------------------------------------------------------------
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sessions_select_own ON public.sessions;
CREATE POLICY sessions_select_own ON public.sessions
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS sessions_delete_own ON public.sessions;
CREATE POLICY sessions_delete_own ON public.sessions
    FOR DELETE
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 3. CUSTOMER PROFILES TABLE RLS
-- ------------------------------------------------------------------------------
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS customer_profiles_select_own ON public.customer_profiles;
CREATE POLICY customer_profiles_select_own ON public.customer_profiles
    FOR SELECT
    USING (
        auth.uid() = user_id 
        OR EXISTS (
            SELECT 1 FROM public.bookings b
            JOIN public.technician_profiles tp ON b.technician_id = tp.id
            WHERE b.customer_id = customer_profiles.user_id AND tp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS customer_profiles_update_own ON public.customer_profiles;
CREATE POLICY customer_profiles_update_own ON public.customer_profiles
    FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS customer_profiles_insert_own ON public.customer_profiles;
CREATE POLICY customer_profiles_insert_own ON public.customer_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 4. TECHNICIAN PROFILES TABLE RLS
-- ------------------------------------------------------------------------------
ALTER TABLE public.technician_profiles ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view active verified technicians in directory
DROP POLICY IF EXISTS technician_profiles_select_public ON public.technician_profiles;
CREATE POLICY technician_profiles_select_public ON public.technician_profiles
    FOR SELECT
    USING (verification_status = 'VERIFIED' OR auth.uid() = user_id);

DROP POLICY IF EXISTS technician_profiles_update_own ON public.technician_profiles;
CREATE POLICY technician_profiles_update_own ON public.technician_profiles
    FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS technician_profiles_insert_own ON public.technician_profiles;
CREATE POLICY technician_profiles_insert_own ON public.technician_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 5. TECHNICIAN SKILLS TABLE RLS
-- ------------------------------------------------------------------------------
ALTER TABLE public.technician_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS technician_skills_select_public ON public.technician_skills;
CREATE POLICY technician_skills_select_public ON public.technician_skills
    FOR SELECT
    USING (active = TRUE OR EXISTS (
        SELECT 1 FROM public.technician_profiles tp 
        WHERE tp.id = technician_skills.technician_id AND tp.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS technician_skills_manage_own ON public.technician_skills;
CREATE POLICY technician_skills_manage_own ON public.technician_skills
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.technician_profiles tp 
        WHERE tp.id = technician_skills.technician_id AND tp.user_id = auth.uid()
    ));

-- ------------------------------------------------------------------------------
-- 6. SERVICE REQUESTS TABLE RLS
-- ------------------------------------------------------------------------------
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_requests_select ON public.service_requests;
CREATE POLICY service_requests_select ON public.service_requests
    FOR SELECT
    USING (
        auth.uid() = customer_id
        OR (status = 'OPEN' AND EXISTS (
            SELECT 1 FROM public.technician_profiles tp WHERE tp.user_id = auth.uid()
        ))
    );

DROP POLICY IF EXISTS service_requests_insert_own ON public.service_requests;
CREATE POLICY service_requests_insert_own ON public.service_requests
    FOR INSERT
    WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS service_requests_update_own ON public.service_requests;
CREATE POLICY service_requests_update_own ON public.service_requests
    FOR UPDATE
    USING (auth.uid() = customer_id);

-- ------------------------------------------------------------------------------
-- 7. BOOKINGS TABLE RLS
-- ------------------------------------------------------------------------------
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bookings_select_participants ON public.bookings;
CREATE POLICY bookings_select_participants ON public.bookings
    FOR SELECT
    USING (
        auth.uid() = customer_id
        OR EXISTS (
            SELECT 1 FROM public.technician_profiles tp
            WHERE tp.id = bookings.technician_id AND tp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS bookings_insert_customer ON public.bookings;
CREATE POLICY bookings_insert_customer ON public.bookings
    FOR INSERT
    WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS bookings_update_participants ON public.bookings;
CREATE POLICY bookings_update_participants ON public.bookings
    FOR UPDATE
    USING (
        auth.uid() = customer_id
        OR EXISTS (
            SELECT 1 FROM public.technician_profiles tp
            WHERE tp.id = bookings.technician_id AND tp.user_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- 8. BOOKING STATUS HISTORY TABLE RLS
-- ------------------------------------------------------------------------------
ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS booking_status_history_select ON public.booking_status_history;
CREATE POLICY booking_status_history_select ON public.booking_status_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings b
            LEFT JOIN public.technician_profiles tp ON b.technician_id = tp.id
            WHERE b.id = booking_status_history.booking_id
            AND (b.customer_id = auth.uid() OR tp.user_id = auth.uid())
        )
    );

-- ------------------------------------------------------------------------------
-- 9. PAYMENTS TABLE RLS
-- ------------------------------------------------------------------------------
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payments_select_participants ON public.payments;
CREATE POLICY payments_select_participants ON public.payments
    FOR SELECT
    USING (
        auth.uid() = customer_id
        OR EXISTS (
            SELECT 1 FROM public.bookings b
            JOIN public.technician_profiles tp ON b.technician_id = tp.id
            WHERE b.id = payments.booking_id AND tp.user_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- 10. SUBSCRIPTIONS TABLE RLS
-- ------------------------------------------------------------------------------
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS subscriptions_select_own ON public.subscriptions;
CREATE POLICY subscriptions_select_own ON public.subscriptions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.technician_profiles tp
            WHERE tp.id = subscriptions.technician_id AND tp.user_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- 11. TECHNICIAN EARNINGS TABLE RLS
-- ------------------------------------------------------------------------------
ALTER TABLE public.technician_earnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS technician_earnings_select_own ON public.technician_earnings;
CREATE POLICY technician_earnings_select_own ON public.technician_earnings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.technician_profiles tp
            WHERE tp.id = technician_earnings.technician_id AND tp.user_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- 12. NOTIFICATIONS TABLE RLS
-- ------------------------------------------------------------------------------
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_manage_own ON public.notifications;
CREATE POLICY notifications_manage_own ON public.notifications
    FOR ALL
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 13. AUDIT LOGS TABLE RLS (Zero-trust: Service Role or Admin Only)
-- ------------------------------------------------------------------------------
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_logs_admin_only ON public.audit_logs;
CREATE POLICY audit_logs_admin_only ON public.audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'ADMIN'
        )
    );
