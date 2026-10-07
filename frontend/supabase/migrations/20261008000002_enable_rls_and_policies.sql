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
