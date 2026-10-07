-- ============================================================================
-- NEXDO CORE RELATIONAL SCHEMA & MIGRATIONS
-- Voice-First Real-World Service Coordination Platform
-- Compatible with Supabase PostgreSQL (pgvector, uuid, rls)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. PROFILES (Unified User Identity: Customer + Technician)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE, -- References auth.users(id) when Supabase Auth is active
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

-- ----------------------------------------------------------------------------
-- 2. SERVICE CATEGORIES (Real dynamic service catalog)
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 3. TECHNICIAN PROFILES
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 4. TECHNICIAN CAPABILITIES
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 5. SUBSCRIPTION PLANS (DAILY: ₹99, WEEKLY: ₹599, MONTHLY: ₹2499)
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 6. TECHNICIAN SUBSCRIPTIONS
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 7. SERVICE REQUESTS (Voice / Manual intent capture)
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 8. TECHNICIAN MATCHES
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 9. BOOKINGS (Source of truth for service lifecycle)
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 10. BOOKING EVENTS (Auditable State Machine Transitions)
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 11. DIAGNOSES (₹149 diagnosis fee flow)
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 12. ESTIMATES & 13. ESTIMATE ITEMS
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 14. ESTIMATE APPROVALS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS estimate_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id),
  approval_method TEXT NOT NULL DEFAULT 'VOICE' CHECK (approval_method IN ('VOICE', 'MANUAL')),
  approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ----------------------------------------------------------------------------
-- 15. PAYMENTS (Sandbox / Real payment records)
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 16. TECHNICIAN PAYOUTS (0% Platform Take Rate)
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 17. CONVERSATION SESSIONS (Backend Voice Context Source of Truth)
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 18. CONVERSATION MESSAGES
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 19. VOICE INTENTS (Audit and accuracy tracking)
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 20. NOTIFICATIONS
-- ----------------------------------------------------------------------------
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

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_technician_profiles_status ON technician_profiles(availability_status, verification_status);
CREATE INDEX IF NOT EXISTS idx_technician_capabilities_code ON technician_capabilities(code);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_technician_id ON bookings(technician_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_ref ON bookings(reference_code);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_token ON conversation_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_session ON conversation_messages(session_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
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

-- Public / Catalog Tables: Everyone can read
CREATE POLICY "Public can read service categories" ON service_categories FOR SELECT USING (true);
CREATE POLICY "Public can read subscription plans" ON subscription_plans FOR SELECT USING (true);
CREATE POLICY "Public can read technician public profiles" ON technician_profiles FOR SELECT USING (verification_status = 'VERIFIED');
CREATE POLICY "Public can read active capabilities" ON technician_capabilities FOR SELECT USING (active = true);

-- Profiles: Users can view & update their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (
  auth.uid() = user_id OR user_id IS NULL
);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (
  auth.uid() = user_id OR user_id IS NULL
);

-- Bookings: Customers can view their bookings; Technicians can view assigned bookings
CREATE POLICY "Customers can view own bookings" ON bookings FOR SELECT USING (
  customer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid() OR user_id IS NULL)
);
CREATE POLICY "Technicians can view assigned bookings" ON bookings FOR SELECT USING (
  technician_id IN (SELECT tp.id FROM technician_profiles tp JOIN profiles p ON tp.profile_id = p.id WHERE p.user_id = auth.uid() OR p.user_id IS NULL)
);

-- Service Requests: Customers view their requests; Active online technicians can view open requests
CREATE POLICY "Customers view own service requests" ON service_requests FOR SELECT USING (
  customer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid() OR user_id IS NULL)
);
CREATE POLICY "Technicians view open service requests" ON service_requests FOR SELECT USING (
  status = 'OPEN'
);

-- Payments: Customer and Technician view relevant payments
CREATE POLICY "Parties view payments" ON payments FOR SELECT USING (
  customer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid() OR user_id IS NULL) OR
  technician_id IN (SELECT tp.id FROM technician_profiles tp JOIN profiles p ON tp.profile_id = p.id WHERE p.user_id = auth.uid() OR p.user_id IS NULL)
);

-- Technician Subscriptions: Technicians view their subscriptions
CREATE POLICY "Technicians view own subscriptions" ON technician_subscriptions FOR SELECT USING (
  technician_id IN (SELECT tp.id FROM technician_profiles tp JOIN profiles p ON tp.profile_id = p.id WHERE p.user_id = auth.uid() OR p.user_id IS NULL)
);

-- Conversation Sessions & Messages
CREATE POLICY "Users view own conversation session" ON conversation_sessions FOR SELECT USING (true);
CREATE POLICY "Users insert conversation session" ON conversation_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users update conversation session" ON conversation_sessions FOR UPDATE USING (true);
CREATE POLICY "Users view messages" ON conversation_messages FOR SELECT USING (true);
CREATE POLICY "Users insert messages" ON conversation_messages FOR INSERT WITH CHECK (true);

-- ============================================================================
-- SEED INITIAL DATA
-- ============================================================================

-- 1. Service Categories
INSERT INTO service_categories (id, code, name_en, name_ta, description_en, description_ta, icon, base_diagnosis_fee, base_service_price, sort_order)
VALUES
  ('c0000001-0000-0000-0000-000000000001', 'AC_REPAIR', 'AC Repair', 'ஏசி பழுதுபார்த்தல்', 'Cooling issues, compressor, gas refill, leakage & servicing', 'ஏசி கூலிங் வரவில்லை, கேஸ் ரீஃபில், கம்ப்ரசர் சரிசெய்தல்', 'Snowflake', 149, 499, 1),
  ('c0000001-0000-0000-0000-000000000002', 'TV_REPAIR', 'TV Repair', 'டிவி பழுதுபார்த்தல்', 'Smart LED, display panel, sound issues, motherboard repair', 'டிவி டிஸ்ப்ளே, ஆடியோ போர்டு மற்றும் மதர்போர்டு பழுது', 'Tv', 149, 449, 2),
  ('c0000001-0000-0000-0000-000000000003', 'REFRIGERATOR_REPAIR', 'Refrigerator Repair', 'பிரிட்ஜ் பழுதுபார்த்தல்', 'Cooling failure, thermostat, defrosting, gas leakage', 'பிரிட்ஜ் கூலிங் பிரச்சனை, கேஸ் லீக், மோட்டார் சரிசெய்தல்', 'Refrigerator', 149, 499, 3),
  ('c0000001-0000-0000-0000-000000000004', 'WASHING_MACHINE_REPAIR', 'Washing Machine Repair', 'வாஷிங் மெஷின் பழுதுபார்த்தல்', 'Drum spin issues, water drainage, motor replacement, PCB error', 'டிரம் சுழலவில்லை, தண்ணீர் வடியவில்லை, போர்டு பழுது', 'WashingMachine', 149, 499, 4),
  ('c0000001-0000-0000-0000-000000000005', 'ELECTRICAL_WORK', 'Electrical', 'மின்சார வேலைகள்', 'Switchboard, wiring, MCB tripping, fan installation', 'சுவிட்ச் போர்டு, வயரிங், ஃபேன் ரிப்பேர், எம்சிபி சரிசெய்தல்', 'Zap', 149, 249, 5),
  ('c0000001-0000-0000-0000-000000000006', 'PLUMBING', 'Plumbing', 'பிளம்பிங் வேலைகள்', 'Pipe leakage, tap replacement, drainage clog, sanitary fitting', 'பைப் லீக்கேஜ், குழாய் மாற்றுதல், அடைப்பு சரிசெய்தல்', 'Droplet', 149, 249, 6),
  ('c0000001-0000-0000-0000-000000000007', 'CLEANING', 'Cleaning', 'சுத்தம் செய்யும் வேலைகள்', 'Deep home cleaning, bathroom scrubbing, kitchen sanitation', 'முழு வீடு மற்றும் கழிவறை ஆழ்ந்த சுத்திகரிப்பு', 'Sparkles', 0, 399, 7),
  ('c0000001-0000-0000-0000-000000000008', 'APPLIANCE_REPAIR', 'Appliance Repair', 'வீட்டு உபகரணங்கள் பழுதுபார்த்தல்', 'Microwave, mixer grinder, water heater (geyser) repair', 'மைக்ரோவேவ், மிக்சி, வாட்டர் ஹீட்டர் சரிசெய்தல்', 'Wrench', 149, 349, 8)
ON CONFLICT (code) DO NOTHING;

-- 2. Subscription Plans (DAILY: ₹99, WEEKLY: ₹599, MONTHLY: ₹2499)
INSERT INTO subscription_plans (id, plan_code, tier, title, price, billing_cycle, period_days, features, tagline, badge, truthful_disclaimer, recommended)
VALUES
  ('p0000001-0000-0000-0000-000000000001', 'plan_daily', 'DAILY', 'Daily Access Pass', 99, 'per day', 1, ARRAY[
    'Unlimited eligible job requests during your active day',
    'Zero commission — keep 100% of customer job earnings',
    'Real-time voice & audio incoming job announcements',
    'Direct customer phone & navigation coordinates',
    'Instant payout handoff on service completion'
  ], 'Unlimited eligible jobs during active 24-hour access', 'Flexible Day Pass', 'Unlimited access allows receiving all requests matching your capabilities and area without artificial caps. It does not guarantee customer request volume or job allocations.', false),

  ('p0000001-0000-0000-0000-000000000002', 'plan_weekly', 'WEEKLY', 'Weekly Access Pass', 599, 'per week', 7, ARRAY[
    '7 days uninterrupted eligible job access',
    'Save over ₹90 compared to daily renewals',
    'Zero commission — keep 100% of customer job earnings',
    'Real-time voice & audio incoming job announcements',
    'Direct customer phone & navigation coordinates',
    'Instant payout handoff on service completion'
  ], 'High flexibility for active weekly service schedules', 'Best Flexibility', 'Provides continuous platform access for 7 days with zero per-job commission. Service demand depends on local customer requests and is not guaranteed.', false),

  ('p0000001-0000-0000-0000-000000000003', 'plan_monthly', 'MONTHLY', 'Monthly Access Pass', 2499, 'per month', 30, ARRAY[
    '30 days uninterrupted eligible job access',
    'Save over ₹470 compared to daily renewals',
    'Zero commission — keep 100% of customer job earnings',
    'Priority capability matching in your service radius',
    'Voice announcements in your preferred local language',
    'Dedicated partner phone support line'
  ], 'Best value for dedicated full-time service professionals', 'Most Popular', 'Provides continuous platform access for 30 days with no per-job commission. Service demand depends on local customer requests and is not guaranteed.', true)
ON CONFLICT (plan_code) DO NOTHING;

-- 3. Initial Profiles
INSERT INTO profiles (id, role, name, phone, email, address, city, district, pincode, preferred_language, voice_auto_confirm)
VALUES
  ('u0000001-0000-0000-0000-000000000001', 'CUSTOMER', 'Hariharasudhan', '9876543210', 'hariharasudhan@example.com', '42, Sengunthapuram 3rd Cross', 'Karur', 'Karur District, Tamil Nadu', '639002', 'ta', true),
  ('u0000001-0000-0000-0000-000000000002', 'TECHNICIAN', 'Ravi Kumar', '+91 98401 22334', 'ravi.kumar@example.com', '18, Sardar Patel Road, Adyar', 'Chennai', 'Chennai District, Tamil Nadu', '600020', 'ta', true),
  ('u0000001-0000-0000-0000-000000000003', 'TECHNICIAN', 'Senthil Murugan', '+91 98402 33445', 'senthil.murugan@example.com', '12, First Main Road, Besant Nagar', 'Chennai', 'Chennai District, Tamil Nadu', '600090', 'ta', true),
  ('u0000001-0000-0000-0000-000000000004', 'TECHNICIAN', 'Kumaravel Electronics', '+91 98401 55667', 'kumaravel@example.com', '7, LB Road, Thiruvanmiyur', 'Chennai', 'Chennai District, Tamil Nadu', '600041', 'ta', true),
  ('u0000001-0000-0000-0000-000000000005', 'TECHNICIAN', 'Murugan Plumbing Works', '+91 98403 11223', 'murugan.plumb@example.com', '23, Canal Bank Road, Kotturpuram', 'Chennai', 'Chennai District, Tamil Nadu', '600085', 'ta', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Initial Technician Profiles
INSERT INTO technician_profiles (id, profile_id, name, phone, address, city, district, pincode, radius_km, experience_years, rating, review_count, completed_jobs_count, verification_status, availability_status, service_areas, languages_spoken, bio, badges)
VALUES
  ('t0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000002', 'Ravi Kumar', '+91 98401 22334', '18, Sardar Patel Road, Adyar', 'Chennai', 'Chennai District, Tamil Nadu', '600020', 8, 7, 4.90, 342, 342, 'VERIFIED', 'ONLINE', ARRAY['Adyar', 'Besant Nagar', 'Thiruvanmiyur', 'Kotturpuram'], ARRAY['Tamil', 'English'], 'Certified HVAC & multi-skill technician with 7+ years on-field experience in Adyar & South Chennai. Background verified, 30-day warranty.', ARRAY['Top Rated Pro', 'Multi-Skilled', 'Speedy Arrival']),
  ('t0000001-0000-0000-0000-000000000002', 'u0000001-0000-0000-0000-000000000003', 'Senthil Murugan', '+91 98402 33445', '12, First Main Road, Besant Nagar', 'Chennai', 'Chennai District, Tamil Nadu', '600090', 6, 9, 4.80, 218, 218, 'VERIFIED', 'ONLINE', ARRAY['Besant Nagar', 'Thiruvanmiyur', 'Mylapore'], ARRAY['Tamil'], 'Experienced cooling appliances specialist with deep expertise in multi-brand inverter ACs, gas leakage sealing, and PCB diagnostics.', ARRAY['Inverter Pro', 'Fast Responder']),
  ('t0000001-0000-0000-0000-000000000003', 'u0000001-0000-0000-0000-000000000004', 'Kumaravel Electronics', '+91 98401 55667', '7, LB Road, Thiruvanmiyur', 'Chennai', 'Chennai District, Tamil Nadu', '600041', 10, 8, 4.90, 284, 284, 'VERIFIED', 'ONLINE', ARRAY['Thiruvanmiyur', 'Adyar', 'Velachery'], ARRAY['Tamil', 'English'], 'Certified television & electronics specialist with 8+ years experience in LED, OLED, and smart TV motherboard repairs.', ARRAY['Top Rated Pro', 'Screen Specialist', 'Fast Arrival']),
  ('t0000001-0000-0000-0000-000000000004', 'u0000001-0000-0000-0000-000000000005', 'Murugan Plumbing Works', '+91 98403 11223', '23, Canal Bank Road, Kotturpuram', 'Chennai', 'Chennai District, Tamil Nadu', '600085', 7, 9, 4.90, 312, 312, 'VERIFIED', 'ONLINE', ARRAY['Kotturpuram', 'Adyar', 'Mylapore'], ARRAY['Tamil'], 'Expert plumber for immediate pipe burst, faucet replacement, water line clogging, and bathroom sanitary repairs.', ARRAY['Speedy Arrival', 'Top Rated Plumber', '30-Day Guarantee'])
ON CONFLICT (id) DO NOTHING;

-- 5. Capabilities Seed
INSERT INTO technician_capabilities (id, technician_id, category_id, code, name, category, experience_level, is_certified, active)
VALUES
  ('cap00001-0000-0000-0000-000000000001', 't0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'AC_REPAIR', 'AC Repair & Diagnostics', 'HVAC & Cooling', 'EXPERT', true, true),
  ('cap00001-0000-0000-0000-000000000002', 't0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'AC_SERVICE', 'AC Deep Cleaning & Gas Refill', 'HVAC & Cooling', 'EXPERT', true, true),
  ('cap00001-0000-0000-0000-000000000003', 't0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000005', 'FAN_REPAIR', 'Ceiling & Exhaust Fan Repair', 'Electrical', 'EXPERT', true, true),
  ('cap00001-0000-0000-0000-000000000004', 't0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000005', 'ELECTRICAL_WORK', 'Wiring, MCB & Switchboard Work', 'Electrical', 'INTERMEDIATE', false, true),
  ('cap00001-0000-0000-0000-000000000005', 't0000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000001', 'AC_REPAIR', 'Inverter AC Diagnostics', 'HVAC & Cooling', 'EXPERT', true, true),
  ('cap00001-0000-0000-0000-000000000006', 't0000001-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000002', 'TV_REPAIR', 'Smart LED & TV Diagnostics', 'Electronics', 'EXPERT', true, true),
  ('cap00001-0000-0000-0000-000000000007', 't0000001-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000006', 'PLUMBING', 'Pipe Leakage & Tap Broken Repair', 'Plumbing', 'EXPERT', true, true)
ON CONFLICT (id) DO NOTHING;

-- 6. Technician Subscriptions Seed (Ravi: Monthly, Senthil: Weekly ₹599 mandatory plan)
INSERT INTO technician_subscriptions (id, technician_id, plan_id, plan_type, price, is_active, activated_at, expires_at, payment_reference)
VALUES
  ('s0000001-0000-0000-0000-000000000001', 't0000001-0000-0000-0000-000000000001', 'p0000001-0000-0000-0000-000000000003', 'MONTHLY', 2499, true, NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days', 'TXN_SUB_MTH_001'),
  ('s0000001-0000-0000-0000-000000000002', 't0000001-0000-0000-0000-000000000002', 'p0000001-0000-0000-0000-000000000002', 'WEEKLY', 599, true, NOW() - INTERVAL '2 days', NOW() + INTERVAL '5 days', 'TXN_SUB_WK_002')
ON CONFLICT (id) DO NOTHING;
