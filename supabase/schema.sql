-- ============================================================================
-- NEXDO COMPLETE POSTGRESQL SCHEMA (Supabase DDL)
-- For execution in Supabase Dashboard SQL Editor or Supabase CLI
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
  role TEXT NOT NULL DEFAULT 'CUSTOMER' CHECK (role IN ('CUSTOMER', 'TECHNICIAN')),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  dob TEXT,
  avatar_url TEXT,
  address TEXT,
  city TEXT DEFAULT 'Chennai',
  district TEXT DEFAULT 'Chennai District, Tamil Nadu',
  pincode TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'ta' CHECK (preferred_language IN ('ta', 'en')),
  voice_auto_confirm BOOLEAN NOT NULL DEFAULT true,
  saved_addresses JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. SERVICE CATEGORIES
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ta TEXT NOT NULL,
  description_en TEXT,
  description_ta TEXT,
  icon TEXT,
  base_diagnosis_fee NUMERIC NOT NULL DEFAULT 149,
  base_service_price NUMERIC NOT NULL DEFAULT 499,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TECHNICIAN PROFILES
CREATE TABLE IF NOT EXISTS technician_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  dob TEXT,
  address TEXT,
  city TEXT DEFAULT 'Chennai',
  district TEXT DEFAULT 'Chennai District, Tamil Nadu',
  pincode TEXT,
  radius_km NUMERIC NOT NULL DEFAULT 10,
  experience_years INTEGER NOT NULL DEFAULT 5,
  rating NUMERIC(3, 2) NOT NULL DEFAULT 4.80,
  review_count INTEGER NOT NULL DEFAULT 0,
  completed_jobs_count INTEGER NOT NULL DEFAULT 0,
  verification_status TEXT NOT NULL DEFAULT 'VERIFIED' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
  availability_status TEXT NOT NULL DEFAULT 'ONLINE' CHECK (availability_status IN ('ONLINE', 'OFFLINE')),
  service_areas TEXT[] NOT NULL DEFAULT ARRAY['Adyar', 'Besant Nagar', 'Thiruvanmiyur', 'Mylapore', 'Velachery'],
  languages_spoken TEXT[] NOT NULL DEFAULT ARRAY['Tamil', 'English'],
  bio TEXT,
  badges TEXT[] NOT NULL DEFAULT ARRAY['Top Rated Pro', 'Speedy Arrival', 'Verified Genuine Parts'],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TECHNICIAN CAPABILITIES
CREATE TABLE IF NOT EXISTS technician_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID NOT NULL REFERENCES technician_profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  experience_level TEXT NOT NULL DEFAULT 'EXPERT' CHECK (experience_level IN ('BEGINNER', 'INTERMEDIATE', 'EXPERT')),
  is_certified BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. SUBSCRIPTION PLANS
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_code TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL CHECK (tier IN ('DAILY', 'WEEKLY', 'MONTHLY')),
  title TEXT NOT NULL,
  price NUMERIC NOT NULL,
  billing_cycle TEXT NOT NULL,
  period_days INTEGER NOT NULL,
  features TEXT[] NOT NULL,
  tagline TEXT,
  badge TEXT,
  truthful_disclaimer TEXT,
  recommended BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TECHNICIAN SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS technician_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID NOT NULL REFERENCES technician_profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  plan_type TEXT NOT NULL CHECK (plan_type IN ('DAILY', 'WEEKLY', 'MONTHLY')),
  price NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  payment_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. SERVICE REQUESTS
CREATE TABLE IF NOT EXISTS service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_category_id UUID REFERENCES service_categories(id),
  service_code TEXT NOT NULL,
  raw_transcript TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'NORMAL' CHECK (urgency IN ('NORMAL', 'URGENT', 'SCHEDULED')),
  preferred_time TEXT DEFAULT 'Within 45 mins',
  location TEXT NOT NULL,
  specific_issue TEXT,
  service_mode TEXT NOT NULL DEFAULT 'DIAGNOSIS' CHECK (service_mode IN ('DIAGNOSIS', 'SERVICE')),
  estimated_cost_range TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'MATCHED', 'BOOKED', 'EXPIRED', 'CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. TECHNICIAN MATCHES
CREATE TABLE IF NOT EXISTS technician_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES technician_profiles(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL DEFAULT 1.0,
  distance_km NUMERIC NOT NULL DEFAULT 2.5,
  eta_minutes INTEGER NOT NULL DEFAULT 25,
  rank INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES profiles(id),
  technician_id UUID NOT NULL REFERENCES technician_profiles(id),
  service_request_id UUID REFERENCES service_requests(id),
  service_title TEXT NOT NULL,
  scheduled_time TEXT NOT NULL,
  address TEXT NOT NULL,
  service_mode TEXT NOT NULL DEFAULT 'DIAGNOSIS' CHECK (service_mode IN ('DIAGNOSIS', 'SERVICE')),
  status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK (status IN (
    'REQUESTED',
    'MATCHING',
    'TECHNICIAN_SELECTED',
    'PENDING_CONFIRMATION',
    'CONFIRMED',
    'ACCEPTED',
    'TECHNICIAN_ON_THE_WAY',
    'ARRIVED',
    'DIAGNOSING',
    'ESTIMATE_PENDING',
    'APPROVED',
    'WORK_IN_PROGRESS',
    'PAYMENT_PENDING',
    'PAYMENT_RECEIVED',
    'OTP_PENDING',
    'COMPLETED',
    'CANCELLED'
  )),
  estimated_price NUMERIC NOT NULL DEFAULT 149,
  otp_code TEXT NOT NULL,
  final_otp_code TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. BOOKING EVENTS
CREATE TABLE IF NOT EXISTS booking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  actor_role TEXT NOT NULL CHECK (actor_role IN ('CUSTOMER', 'TECHNICIAN', 'SYSTEM')),
  actor_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. DIAGNOSES
CREATE TABLE IF NOT EXISTS diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  fee NUMERIC NOT NULL DEFAULT 149,
  findings TEXT,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  otp TEXT NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  diagnosed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. ESTIMATES & 13. ESTIMATE ITEMS
CREATE TABLE IF NOT EXISTS estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  parts_amount NUMERIC NOT NULL DEFAULT 0,
  labour_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  is_price_locked BOOLEAN NOT NULL DEFAULT true,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS estimate_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('PART', 'LABOUR')),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. ESTIMATE APPROVALS
CREATE TABLE IF NOT EXISTS estimate_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id),
  approval_method TEXT NOT NULL DEFAULT 'VOICE' CHECK (approval_method IN ('VOICE', 'MANUAL')),
  approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 15. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id),
  technician_id UUID NOT NULL REFERENCES technician_profiles(id),
  payment_intent_id TEXT NOT NULL,
  transaction_reference TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RECEIVED', 'FAILED')),
  payment_method TEXT DEFAULT 'UPI_SANDBOX',
  is_sandbox BOOLEAN NOT NULL DEFAULT true,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. TECHNICIAN PAYOUTS
CREATE TABLE IF NOT EXISTS technician_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID NOT NULL REFERENCES technician_profiles(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  platform_fee NUMERIC NOT NULL DEFAULT 0,
  net_payout NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'PROCESSED' CHECK (status IN ('PENDING', 'PROCESSED', 'FAILED')),
  payout_reference TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. CONVERSATION SESSIONS
CREATE TABLE IF NOT EXISTS conversation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_token TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'technician')),
  language TEXT NOT NULL DEFAULT 'ta' CHECK (language IN ('ta', 'en')),
  current_route TEXT NOT NULL DEFAULT '/customer',
  state_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. CONVERSATION MESSAGES
CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES conversation_sessions(id) ON DELETE CASCADE,
  speaker TEXT NOT NULL CHECK (speaker IN ('user', 'assistant')),
  text TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'ta',
  intent TEXT,
  action_type TEXT,
  entities JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. VOICE INTENTS
CREATE TABLE IF NOT EXISTS voice_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES conversation_sessions(id) ON DELETE SET NULL,
  raw_transcript TEXT NOT NULL,
  detected_language TEXT NOT NULL,
  canonical_intent TEXT NOT NULL,
  confidence NUMERIC NOT NULL,
  matched_action TEXT NOT NULL,
  requires_confirmation BOOLEAN NOT NULL DEFAULT false,
  resolution_source TEXT NOT NULL DEFAULT 'BACKEND_SEMANTIC_ENGINE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_role TEXT NOT NULL CHECK (recipient_role IN ('CUSTOMER', 'TECHNICIAN')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL,
  reference_id TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE technician_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE technician_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE technician_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE technician_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE technician_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read service categories" ON service_categories FOR SELECT USING (true);
CREATE POLICY "Public read subscription plans" ON subscription_plans FOR SELECT USING (true);
CREATE POLICY "Public read verified technicians" ON technician_profiles FOR SELECT USING (verification_status = 'VERIFIED');
CREATE POLICY "Public read active capabilities" ON technician_capabilities FOR SELECT USING (active = true);
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Customers read own bookings" ON bookings FOR SELECT USING (customer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid() OR user_id IS NULL));
CREATE POLICY "Technicians read assigned bookings" ON bookings FOR SELECT USING (technician_id IN (SELECT tp.id FROM technician_profiles tp JOIN profiles p ON tp.profile_id = p.id WHERE p.user_id = auth.uid() OR p.user_id IS NULL));
CREATE POLICY "Users access own session" ON conversation_sessions FOR ALL USING (true);
CREATE POLICY "Users access messages" ON conversation_messages FOR ALL USING (true);
