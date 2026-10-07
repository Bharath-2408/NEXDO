// ============================================================================
// NEXDO BACKEND DATABASE TYPES (Matching Supabase 20-Table Schema & Auth Engine)
// ============================================================================

export type UserRole = 'CUSTOMER' | 'TECHNICIAN' | 'ADMIN';

export interface UserRecord {
  id: string;
  email?: string | null;
  phone: string;
  password_hash: string;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  email_verified: boolean;
  phone_verified: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SessionRecord {
  id: string;
  user_id: string;
  session_token_hash: string;
  ip_address?: string;
  user_agent?: string;
  expires_at: string;
  last_active_at: string;
  created_at: string;
}

export interface CustomerProfileRecord {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  city: string;
  state: string;
  pincode?: string | null;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface ProfileRecord {
  id: string;
  user_id?: string | null;
  role: 'CUSTOMER' | 'TECHNICIAN';
  name: string;
  phone: string;
  email?: string | null;
  dob?: string | null;
  avatar_url?: string | null;
  address?: string | null;
  city: string;
  district: string;
  pincode?: string | null;
  preferred_language: 'ta' | 'en';
  voice_auto_confirm: boolean;
  saved_addresses?: any[];
  created_at: string;
  updated_at: string;
}

export interface ServiceCategoryRecord {
  id: string;
  code: string;
  name_en: string;
  name_ta: string;
  description_en?: string;
  description_ta?: string;
  icon?: string;
  base_diagnosis_fee: number;
  base_service_price: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface TechnicianProfileRecord {
  id: string;
  profile_id: string;
  name: string;
  phone: string;
  email?: string;
  dob?: string;
  address?: string;
  city: string;
  district: string;
  pincode?: string;
  radius_km: number;
  experience_years: number;
  rating: number;
  review_count: number;
  completed_jobs_count: number;
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  availability_status: 'ONLINE' | 'OFFLINE';
  service_areas: string[];
  languages_spoken: string[];
  bio?: string;
  badges: string[];
  subscription_plan?: string;
  last_seen_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TechnicianSkillRecord {
  id: string;
  technician_id: string;
  skill_code: string;
  skill_name: string;
  category?: string;
  experience_level: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';
  is_certified: boolean;
  active: boolean;
  created_at: string;
}

export interface TechnicianCapabilityRecord {
  id: string;
  technician_id: string;
  category_id?: string;
  code: string;
  name: string;
  category: string;
  experience_level: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';
  is_certified: boolean;
  active: boolean;
  created_at: string;
}

export interface SubscriptionPlanRecord {
  id: string;
  plan_code: string;
  tier: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  title: string;
  price: number;
  billing_cycle: string;
  period_days: number;
  features: string[];
  tagline?: string;
  badge?: string;
  truthful_disclaimer?: string;
  recommended: boolean;
  is_active: boolean;
  created_at: string;
}

export interface TechnicianSubscriptionRecord {
  id: string;
  technician_id: string;
  plan_id: string;
  plan_type: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  price: number;
  is_active: boolean;
  activated_at: string;
  expires_at: string;
  payment_reference?: string;
  created_at: string;
}

export interface ServiceRequestRecord {
  id: string;
  customer_id: string;
  service_category_id?: string;
  service_category?: string;
  service_code: string;
  raw_transcript: string;
  service_description?: string;
  urgency: 'NORMAL' | 'URGENT' | 'SCHEDULED';
  preferred_time: string;
  requested_date?: string;
  requested_time?: string;
  location: string;
  address?: string;
  specific_issue?: string;
  service_mode: 'DIAGNOSIS' | 'SERVICE';
  estimated_cost_range?: string;
  status: 'OPEN' | 'MATCHED' | 'BOOKED' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface TechnicianMatchRecord {
  id: string;
  service_request_id: string;
  technician_id: string;
  score: number;
  distance_km: number;
  eta_minutes: number;
  rank: number;
  created_at: string;
}

export type BookingStatus =
  | 'REQUESTED'
  | 'MATCHING'
  | 'TECHNICIAN_SELECTED'
  | 'PENDING_CONFIRMATION'
  | 'CONFIRMED'
  | 'ACCEPTED'
  | 'TECHNICIAN_ON_THE_WAY'
  | 'ARRIVED'
  | 'DIAGNOSING'
  | 'ESTIMATE_PENDING'
  | 'APPROVED'
  | 'WORK_IN_PROGRESS'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_RECEIVED'
  | 'OTP_PENDING'
  | 'COMPLETED'
  | 'CANCELLED';

export interface BookingRecord {
  id: string;
  reference_code: string;
  customer_id: string;
  technician_id: string;
  service_request_id?: string;
  service_title: string;
  scheduled_time: string;
  appointment_date?: string;
  appointment_time?: string;
  address: string;
  service_mode: 'DIAGNOSIS' | 'SERVICE';
  diagnosis_fee?: number;
  service_amount?: number;
  total_amount?: number;
  status: BookingStatus;
  confirmation_status?: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  estimated_price: number;
  otp_code: string;
  final_otp_code: string;
  notes?: string;
  idempotency_key?: string;
  created_at: string;
  updated_at: string;
}

export interface BookingEventRecord {
  id: string;
  booking_id: string;
  event_type: string;
  from_status?: string;
  to_status: string;
  actor_role: 'CUSTOMER' | 'TECHNICIAN' | 'SYSTEM';
  actor_id?: string;
  metadata?: any;
  created_at: string;
}

export interface BookingStatusHistoryRecord {
  id: string;
  booking_id: string;
  previous_status?: string;
  new_status: string;
  changed_by: string;
  reason?: string;
  created_at: string;
}

export interface DiagnosisRecord {
  id: string;
  booking_id: string;
  fee: number;
  findings?: string;
  is_paid: boolean;
  otp: string;
  is_verified: boolean;
  diagnosed_at?: string;
  created_at: string;
}

export interface EstimateRecord {
  id: string;
  booking_id: string;
  parts_amount: number;
  labour_amount: number;
  total_amount: number;
  description: string;
  is_price_locked: boolean;
  is_approved: boolean;
  approved_at?: string;
  created_at: string;
}

export interface EstimateItemRecord {
  id: string;
  estimate_id: string;
  item_name: string;
  item_type: 'PART' | 'LABOUR';
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface EstimateApprovalRecord {
  id: string;
  estimate_id: string;
  customer_id: string;
  approval_method: 'VOICE' | 'MANUAL';
  approved_at: string;
  metadata?: any;
}

export interface PaymentRecord {
  id: string;
  booking_id: string;
  customer_id: string;
  technician_id: string;
  payment_intent_id?: string;
  transaction_reference: string;
  amount: number;
  currency: string;
  provider?: string;
  provider_transaction_id?: string;
  status: 'PENDING' | 'RECEIVED' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  payment_status?: 'PENDING' | 'RECEIVED' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  payment_method: string;
  payment_method_type?: string;
  is_sandbox: boolean;
  idempotency_key?: string;
  confirmed_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface TechnicianEarningsRecord {
  id: string;
  technician_id: string;
  booking_id: string;
  gross_amount: number;
  platform_fee: number;
  net_amount: number;
  payment_status: 'PAID' | 'PENDING';
  payout_status: 'PROCESSED' | 'PENDING' | 'FAILED';
  created_at: string;
}

export interface TechnicianPayoutRecord {
  id: string;
  technician_id: string;
  booking_id: string;
  amount: number;
  platform_fee: number;
  net_payout: number;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  payout_reference: string;
  processed_at?: string;
  created_at: string;
}

export interface ConversationSessionRecord {
  id: string;
  user_id?: string | null;
  session_token: string;
  role: 'customer' | 'technician';
  language: 'ta' | 'en';
  current_route: string;
  state_metadata: Record<string, any>;
  last_active_at: string;
  created_at: string;
}

export interface ConversationMessageRecord {
  id: string;
  session_id: string;
  speaker: 'user' | 'assistant';
  text: string;
  language: string;
  intent?: string;
  action_type?: string;
  entities?: Record<string, any>;
  created_at: string;
}

export interface VoiceIntentRecord {
  id: string;
  session_id?: string;
  raw_transcript: string;
  detected_language: string;
  canonical_intent: string;
  confidence: number;
  matched_action: string;
  requires_confirmation: boolean;
  resolution_source: string;
  created_at: string;
}

export interface NotificationRecord {
  id: string;
  user_id?: string;
  recipient_id: string;
  recipient_role: 'CUSTOMER' | 'TECHNICIAN';
  title: string;
  body: string;
  message?: string;
  type: string;
  reference_id?: string;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

export interface AuditLogRecord {
  id: string;
  user_id?: string | null;
  action: string;
  ip_address?: string;
  user_agent?: string;
  status: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  metadata?: Record<string, any>;
  created_at: string;
}
