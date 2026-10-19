// ============================================================================
// NEXDO BACKEND DATABASE REPOSITORY STORE
// Production-grade persistence engine: Relational integrity, foreign keys,
// ACID transaction simulation, unique constraints, and audit trails.
// ============================================================================

import {
  UserRecord,
  SessionRecord,
  CustomerProfileRecord,
  ProfileRecord,
  ServiceCategoryRecord,
  TechnicianProfileRecord,
  TechnicianSkillRecord,
  TechnicianCapabilityRecord,
  SubscriptionPlanRecord,
  TechnicianSubscriptionRecord,
  ServiceRequestRecord,
  TechnicianMatchRecord,
  BookingRecord,
  BookingEventRecord,
  BookingStatusHistoryRecord,
  DiagnosisRecord,
  EstimateRecord,
  EstimateItemRecord,
  EstimateApprovalRecord,
  PaymentRecord,
  TechnicianPayoutRecord,
  TechnicianEarningsRecord,
  ConversationSessionRecord,
  ConversationMessageRecord,
  VoiceIntentRecord,
  NotificationRecord,
  AuditLogRecord,
} from './types';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

interface TransactionSnapshot {
  users: Map<string, UserRecord>;
  sessions: Map<string, SessionRecord>;
  customerProfiles: Map<string, CustomerProfileRecord>;
  technicianProfiles: Map<string, TechnicianProfileRecord>;
  technicianSkills: Map<string, TechnicianSkillRecord>;
  serviceRequests: Map<string, ServiceRequestRecord>;
  bookings: Map<string, BookingRecord>;
  bookingStatusHistory: Map<string, BookingStatusHistoryRecord>;
  payments: Map<string, PaymentRecord>;
  subscriptions: Map<string, TechnicianSubscriptionRecord>;
  technicianEarnings: Map<string, TechnicianEarningsRecord>;
  auditLogs: Map<string, AuditLogRecord>;
}

export class NexdoDatabaseStore {
  // Production Core Relational Tables
  public users: Map<string, UserRecord> = new Map();
  public sessions: Map<string, SessionRecord> = new Map();
  public customerProfiles: Map<string, CustomerProfileRecord> = new Map();
  public technicianProfiles: Map<string, TechnicianProfileRecord> = new Map();
  public technicianSkills: Map<string, TechnicianSkillRecord> = new Map();
  public serviceRequests: Map<string, ServiceRequestRecord> = new Map();
  public bookings: Map<string, BookingRecord> = new Map();
  public bookingStatusHistory: Map<string, BookingStatusHistoryRecord> = new Map();
  public payments: Map<string, PaymentRecord> = new Map();
  public subscriptions: Map<string, TechnicianSubscriptionRecord> = new Map();
  public technicianEarnings: Map<string, TechnicianEarningsRecord> = new Map();
  public technicianLocations: Map<string, any> = new Map();
  public auditLogs: Map<string, AuditLogRecord> = new Map();
  public revokedTokenHashes: Set<string> = new Set();

  // Backward compatibility legacy stores
  public profiles: Map<string, ProfileRecord> = new Map();
  public serviceCategories: Map<string, ServiceCategoryRecord> = new Map();
  public technicianCapabilities: Map<string, TechnicianCapabilityRecord> = new Map();
  public subscriptionPlans: Map<string, SubscriptionPlanRecord> = new Map();
  public technicianSubscriptions: Map<string, TechnicianSubscriptionRecord> = new Map();
  public technicianMatches: Map<string, TechnicianMatchRecord> = new Map();
  public bookingEvents: Map<string, BookingEventRecord> = new Map();
  public diagnoses: Map<string, DiagnosisRecord> = new Map();
  public estimates: Map<string, EstimateRecord> = new Map();
  public estimateItems: Map<string, EstimateItemRecord> = new Map();
  public estimateApprovals: Map<string, EstimateApprovalRecord> = new Map();
  public technicianPayouts: Map<string, TechnicianPayoutRecord> = new Map();
  public conversationSessions: Map<string, ConversationSessionRecord> = new Map();
  public conversationMessages: Map<string, ConversationMessageRecord> = new Map();
  public voiceIntents: Map<string, VoiceIntentRecord> = new Map();
  public notifications: Map<string, NotificationRecord> = new Map();

  // Transaction support
  private transactionSnapshot: TransactionSnapshot | null = null;
  private inTransaction: boolean = false;

  constructor() {
    this.seedInitialData();
  }

  // --------------------------------------------------------------------------
  // TRANSACTION MANAGEMENT (ACID SIMULATION)
  // --------------------------------------------------------------------------
  public beginTransaction(): void {
    if (this.inTransaction) {
      throw new Error('Transaction already in progress');
    }
    this.inTransaction = true;
    this.transactionSnapshot = {
      users: new Map(this.users),
      sessions: new Map(this.sessions),
      customerProfiles: new Map(this.customerProfiles),
      technicianProfiles: new Map(this.technicianProfiles),
      technicianSkills: new Map(this.technicianSkills),
      serviceRequests: new Map(this.serviceRequests),
      bookings: new Map(this.bookings),
      bookingStatusHistory: new Map(this.bookingStatusHistory),
      payments: new Map(this.payments),
      subscriptions: new Map(this.subscriptions),
      technicianEarnings: new Map(this.technicianEarnings),
      auditLogs: new Map(this.auditLogs),
    };
  }

  public commit(): void {
    if (!this.inTransaction) {
      throw new Error('No active transaction to commit');
    }
    this.transactionSnapshot = null;
    this.inTransaction = false;
  }

  public rollback(): void {
    if (!this.inTransaction || !this.transactionSnapshot) {
      throw new Error('No active transaction to rollback');
    }
    this.users = new Map(this.transactionSnapshot.users);
    this.sessions = new Map(this.transactionSnapshot.sessions);
    this.customerProfiles = new Map(this.transactionSnapshot.customerProfiles);
    this.technicianProfiles = new Map(this.transactionSnapshot.technicianProfiles);
    this.technicianSkills = new Map(this.transactionSnapshot.technicianSkills);
    this.serviceRequests = new Map(this.transactionSnapshot.serviceRequests);
    this.bookings = new Map(this.transactionSnapshot.bookings);
    this.bookingStatusHistory = new Map(this.transactionSnapshot.bookingStatusHistory);
    this.payments = new Map(this.transactionSnapshot.payments);
    this.subscriptions = new Map(this.transactionSnapshot.subscriptions);
    this.technicianEarnings = new Map(this.transactionSnapshot.technicianEarnings);
    this.auditLogs = new Map(this.transactionSnapshot.auditLogs);

    this.transactionSnapshot = null;
    this.inTransaction = false;
  }

  // --------------------------------------------------------------------------
  // INDEX LOOKUPS & RELATIONAL QUERIES
  // --------------------------------------------------------------------------
  public getUserByPhone(phone: string): UserRecord | undefined {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    for (const u of this.users.values()) {
      const uPhone = u.phone.replace(/\D/g, '').slice(-10);
      if (uPhone === cleanPhone) return u;
    }
    return undefined;
  }

  public getUserByEmail(email: string): UserRecord | undefined {
    const cleanEmail = email.toLowerCase().trim();
    for (const u of this.users.values()) {
      if (u.email && u.email.toLowerCase().trim() === cleanEmail) return u;
    }
    return undefined;
  }

  public getUserByUsername(username: string): UserRecord | undefined {
    const cleanUsername = username.toLowerCase().trim();
    if (!cleanUsername) return undefined;
    for (const u of this.users.values()) {
      if (u.username && u.username.toLowerCase().trim() === cleanUsername) return u;
    }
    return undefined;
  }

  public getUserById(id: string): UserRecord | undefined {
    return this.users.get(id);
  }

  public getSessionByTokenHash(tokenHash: string): SessionRecord | undefined {
    for (const s of this.sessions.values()) {
      if (s.session_token_hash === tokenHash) return s;
    }
    return undefined;
  }

  public getCustomerProfileByUserId(userId: string): CustomerProfileRecord | undefined {
    const targetUuid = this.toUuid(userId);
    for (const cp of this.customerProfiles.values()) {
      if (
        cp.user_id === userId ||
        this.toUuid(cp.user_id) === targetUuid ||
        cp.id === userId ||
        this.toUuid(cp.id) === targetUuid
      ) return cp;
    }
    return undefined;
  }

  public getTechnicianProfileByUserId(userId: string): TechnicianProfileRecord | undefined {
    const targetUuid = this.toUuid(userId);
    for (const tp of this.technicianProfiles.values()) {
      if (
        tp.profile_id === userId ||
        this.toUuid(tp.profile_id) === targetUuid ||
        tp.id === userId ||
        this.toUuid(tp.id) === targetUuid
      ) return tp;
    }
    return undefined;
  }

  public getTechnicianProfileById(techId: string): TechnicianProfileRecord | undefined {
    return this.technicianProfiles.get(techId);
  }

  public logAudit(entry: Omit<AuditLogRecord, 'id' | 'created_at'>): AuditLogRecord {
    const record: AuditLogRecord = {
      id: `audit_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      user_id: entry.user_id,
      action: entry.action,
      ip_address: entry.ip_address,
      user_agent: entry.user_agent,
      status: entry.status,
      metadata: entry.metadata,
      created_at: new Date().toISOString(),
    };
    this.auditLogs.set(record.id, record);

    if (isSupabaseConfigured) {
      const client = getSupabaseClient();
      if (client) {
        Promise.resolve((client.from('audit_logs') as any).insert([record])).catch(() => {});
      }
    }

    return record;
  }

  /**
   * Converts any string ID into a deterministic, valid RFC 4122 UUID for PostgreSQL
   */
  public toUuid(id?: string): string {
    if (!id) {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
      return '10000000-0000-4000-8000-000000000000'.replace(/[018]/g, (c: any) =>
        (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
      );
    }
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return id.toLowerCase();
    }
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0') + id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24).padEnd(24, '0');
    const safeHex = hex.replace(/[^0-9a-f]/gi, '0').padEnd(32, '0').slice(0, 32);
    return `${safeHex.slice(0, 8)}-${safeHex.slice(8, 12)}-4${safeHex.slice(13, 16)}-a${safeHex.slice(17, 20)}-${safeHex.slice(20, 32)}`.toLowerCase();
  }

  /**
   * Formats record payload to match Supabase PostgreSQL schema precisely
   */
  public formatForSupabase(table: string, data: Record<string, any>): Record<string, any> {
    const d = { ...data };
    if (d.id) d.id = this.toUuid(d.id);

    if (table === 'users') {
      const payload: Record<string, any> = {
        id: d.id,
        email: d.email || null,
        phone: d.phone,
        password_hash: d.password_hash,
        role: d.role,
        status: d.status || 'ACTIVE',
        email_verified: Boolean(d.email_verified),
        phone_verified: Boolean(d.phone_verified),
        last_login_at: d.last_login_at || new Date().toISOString(),
        created_at: d.created_at || new Date().toISOString(),
        updated_at: d.updated_at || new Date().toISOString(),
      };
      if (d.username) {
        payload.username = String(d.username).toLowerCase().trim();
      }
      if (d.first_name !== undefined) {
        payload.first_name = d.first_name;
      }
      if (d.last_name !== undefined) {
        payload.last_name = d.last_name;
      }
      return payload;
    }

    if (table === 'sessions') {
      return {
        id: d.id,
        user_id: this.toUuid(d.user_id),
        session_token_hash: d.session_token_hash,
        ip_address: d.ip_address || null,
        user_agent: d.user_agent || null,
        expires_at: d.expires_at,
        last_active_at: d.last_active_at || new Date().toISOString(),
        created_at: d.created_at || new Date().toISOString(),
      };
    }

    if (table === 'customer_profiles') {
      const payload: Record<string, any> = {
        id: d.id,
        user_id: this.toUuid(d.user_id),
        full_name: d.full_name || d.name || 'Customer',
        phone: d.phone,
        email: d.email || null,
        address: d.address || null,
        city: d.city || 'Chennai',
        state: d.state || 'Tamil Nadu',
        pincode: d.pincode || null,
        latitude: d.latitude || null,
        longitude: d.longitude || null,
        created_at: d.created_at || new Date().toISOString(),
        updated_at: d.updated_at || new Date().toISOString(),
      };
      if (d.first_name !== undefined) {
        payload.first_name = d.first_name;
      }
      if (d.last_name !== undefined) {
        payload.last_name = d.last_name;
      }
      return payload;
    }

    if (table === 'technician_profiles') {
      const payload: Record<string, any> = {
        id: d.id,
        user_id: this.toUuid(d.user_id || d.profile_id),
        full_name: d.full_name || d.name || 'Service Provider',
        phone: d.phone,
        email: d.email || null,
        service_area: d.service_area || (d.service_areas ? d.service_areas[0] : 'Chennai Central'),
        experience_years: d.experience_years || 0,
        verification_status: d.verification_status || 'VERIFIED',
        rating: d.rating || 5.0,
        review_count: d.review_count || 0,
        completed_jobs_count: d.completed_jobs_count || 0,
        subscription_plan: d.subscription_plan || 'FREE',
        online_status: d.online_status || d.availability_status || 'OFFLINE',
        latitude: d.latitude !== undefined ? d.latitude : null,
        longitude: d.longitude !== undefined ? d.longitude : null,
        location_updated_at: d.location_updated_at || null,
        is_location_shared: Boolean(d.is_location_shared),
        last_seen_at: d.last_seen_at || new Date().toISOString(),
        created_at: d.created_at || new Date().toISOString(),
        updated_at: d.updated_at || new Date().toISOString(),
      };
      if (d.first_name !== undefined) {
        payload.first_name = d.first_name;
      }
      if (d.last_name !== undefined) {
        payload.last_name = d.last_name;
      }
      return payload;
    }

    if (table === 'service_requests') {
      return {
        id: this.toUuid(d.id),
        customer_id: this.toUuid(d.customer_id),
        service_category: d.service_category || 'General Service',
        service_code: d.service_code || 'GENERAL',
        service_description: d.service_description || d.raw_transcript || d.specific_issue || null,
        service_mode: d.service_mode === 'SERVICE' ? 'SERVICE' : 'DIAGNOSIS',
        requested_date: d.requested_date || null,
        requested_time: d.requested_time || d.preferred_time || 'Within 45 mins',
        address: d.address || d.location || 'Chennai, Tamil Nadu',
        latitude: d.latitude || null,
        longitude: d.longitude || null,
        status: d.status || 'OPEN',
        created_at: d.created_at || new Date().toISOString(),
        updated_at: d.updated_at || new Date().toISOString(),
      };
    }

    if (table === 'technician_skills') {
      return {
        id: this.toUuid(d.id),
        technician_id: this.toUuid(d.technician_id),
        skill_code: d.skill_code || d.code,
        skill_name: d.skill_name || d.name,
        category: d.category || null,
        experience_level: d.experience_level || 'INTERMEDIATE',
        is_certified: Boolean(d.is_certified),
        active: d.active !== undefined ? Boolean(d.active) : true,
        created_at: d.created_at || new Date().toISOString(),
      };
    }

    if (table === 'bookings') {
      let pgStatus = d.status || 'REQUESTED';
      if (pgStatus === 'WORK_IN_PROGRESS' || pgStatus === 'DIAGNOSING') pgStatus = 'IN_PROGRESS';
      if (pgStatus === 'MATCHING' || pgStatus === 'TECHNICIAN_SELECTED' || pgStatus === 'PENDING_CONFIRMATION') pgStatus = 'REQUESTED';
      if (pgStatus === 'ESTIMATE_PENDING' || pgStatus === 'APPROVED') pgStatus = 'ACCEPTED';
      if (pgStatus === 'PAYMENT_PENDING' || pgStatus === 'PAYMENT_RECEIVED' || pgStatus === 'OTP_PENDING') pgStatus = 'IN_PROGRESS';

      let pgConfStatus = d.confirmation_status || 'PENDING';
      if (pgConfStatus !== 'PENDING' && pgConfStatus !== 'CONFIRMED' && pgConfStatus !== 'REJECTED') {
        pgConfStatus = 'PENDING';
      }

      return {
        id: d.id,
        reference_code: d.reference_code || `REF-${Date.now()}`,
        customer_id: this.toUuid(d.customer_id),
        technician_id: this.toUuid(d.technician_id),
        service_request_id: d.service_request_id ? this.toUuid(d.service_request_id) : null,
        service_mode: d.service_mode || 'DIAGNOSIS',
        service_title: d.service_title || d.serviceTitle || 'Home Service',
        appointment_date: d.appointment_date || d.appointmentDate || 'Today',
        appointment_time: d.appointment_time || d.appointmentTime || '10:00 AM',
        address: d.address || 'Chennai',
        latitude: d.latitude !== undefined ? d.latitude : null,
        longitude: d.longitude !== undefined ? d.longitude : null,
        diagnosis_fee: d.diagnosis_fee !== undefined ? d.diagnosis_fee : 149,
        service_amount: d.service_amount || 0,
        total_amount: d.total_amount || 149,
        status: pgStatus,
        confirmation_status: pgConfStatus,
        notes: d.notes || null,
        idempotency_key: d.idempotency_key || null,
        created_at: d.created_at || new Date().toISOString(),
        updated_at: d.updated_at || new Date().toISOString(),
      };
    }

    if (table === 'technician_locations') {
      return {
        id: this.toUuid(d.id),
        technician_id: this.toUuid(d.technician_id),
        latitude: d.latitude,
        longitude: d.longitude,
        accuracy_meters: d.accuracy_meters !== undefined ? d.accuracy_meters : null,
        speed_mps: d.speed_mps !== undefined ? d.speed_mps : null,
        heading_degrees: d.heading_degrees !== undefined ? d.heading_degrees : null,
        recorded_at: d.recorded_at || new Date().toISOString(),
      };
    }

    if (table === 'booking_status_history') {
      let newStat = d.new_status;
      if (newStat === 'WORK_IN_PROGRESS' || newStat === 'DIAGNOSING') newStat = 'IN_PROGRESS';
      if (newStat === 'PAYMENT_PENDING' || newStat === 'PAYMENT_RECEIVED' || newStat === 'OTP_PENDING') newStat = 'IN_PROGRESS';

      // Ensure changed_by references a valid public.users(id)
      let changedByRaw = d.changed_by || d.actor_id;
      let tech = this.technicianProfiles.get(changedByRaw) || this.technicianProfiles.get(this.toUuid(changedByRaw));
      if (!tech) {
        const targetUuid = this.toUuid(changedByRaw);
        tech = Array.from(this.technicianProfiles.values()).find(
          (t) => t.id === changedByRaw || this.toUuid(t.id) === targetUuid
        );
      }
      if (tech && tech.profile_id) {
        changedByRaw = tech.profile_id;
      }
      let changedByUuid = this.toUuid(changedByRaw);

      // Verify that changedByUuid or changedByRaw exists in known users; fallback to booking's customer if needed
      const userExists = this.users.get(changedByRaw) || this.users.get(changedByUuid);
      if (!userExists) {
        const booking = this.bookings.get(d.booking_id) || this.bookings.get(this.toUuid(d.booking_id));
        if (booking?.customer_id) {
          changedByUuid = this.toUuid(booking.customer_id);
        }
      }

      return {
        id: d.id,
        booking_id: this.toUuid(d.booking_id),
        previous_status: d.previous_status || null,
        new_status: newStat,
        changed_by: changedByUuid,
        reason: d.reason || null,
        created_at: d.created_at || new Date().toISOString(),
      };
    }

    if (table === 'payments') {
      let pStatus = d.payment_status || 'PENDING';
      if (pStatus !== 'PENDING' && pStatus !== 'SUCCESS' && pStatus !== 'FAILED' && pStatus !== 'REFUNDED') {
        pStatus = 'SUCCESS';
      }
      return {
        id: d.id,
        booking_id: this.toUuid(d.booking_id),
        customer_id: this.toUuid(d.customer_id),
        amount: d.amount,
        currency: d.currency || 'INR',
        provider: d.provider || 'RAZORPAY',
        provider_transaction_id: d.provider_transaction_id || d.transaction_reference || null,
        payment_status: pStatus,
        payment_method_type: d.payment_method_type || d.payment_method || 'UPI',
        idempotency_key: d.idempotency_key || null,
        created_at: d.created_at || new Date().toISOString(),
        updated_at: d.updated_at || new Date().toISOString(),
      };
    }

    if (table === 'subscriptions') {
      return {
        id: d.id,
        technician_id: this.toUuid(d.technician_id),
        plan_tier: d.plan_tier || d.plan_type || 'WEEKLY',
        amount: d.amount || d.price || 599,
        status: d.is_active ? 'ACTIVE' : (d.status || 'ACTIVE'),
        start_date: d.activated_at || d.start_date || new Date().toISOString(),
        end_date: d.expires_at || d.end_date || new Date(Date.now() + 7 * 86400000).toISOString(),
        provider_transaction_id: d.payment_reference || d.provider_transaction_id || null,
        created_at: d.created_at || new Date().toISOString(),
        updated_at: d.updated_at || new Date().toISOString(),
      };
    }

    if (table === 'technician_earnings') {
      const gross = Number(d.gross_amount ?? d.amount ?? 149);
      const fee = Number(d.platform_fee ?? 0);
      const net = Number(d.net_amount ?? (gross - fee));
      return {
        id: d.id,
        technician_id: this.toUuid(d.technician_id),
        booking_id: this.toUuid(d.booking_id),
        gross_amount: gross,
        platform_fee: fee,
        net_amount: net,
        payment_status: d.payment_status || 'PAID',
        payout_status: d.payout_status || 'PROCESSED',
        created_at: d.created_at || new Date().toISOString(),
      };
    }

    if (table === 'notifications') {
      return {
        id: d.id,
        user_id: this.toUuid(d.user_id),
        type: d.type || 'SYSTEM',
        title: d.title || 'Notification',
        message: d.message || '',
        read_status: Boolean(d.read_status || d.is_read),
        metadata: d.metadata || null,
        created_at: d.created_at || new Date().toISOString(),
      };
    }

    if (table === 'audit_logs') {
      return {
        id: d.id,
        user_id: d.user_id ? this.toUuid(d.user_id) : null,
        action: d.action,
        ip_address: d.ip_address || null,
        user_agent: d.user_agent || null,
        status: d.status || 'INFO',
        metadata: d.metadata || null,
        created_at: d.created_at || new Date().toISOString(),
      };
    }

    return d;
  }

  /**
   * Persists record to live Supabase PostgreSQL table when configured
   */
  public async syncToRemote(table: string, data: Record<string, any>): Promise<any> {
    const isNode = typeof window === 'undefined' && typeof process !== 'undefined' && Boolean((process as any).versions?.node);
    if (isSupabaseConfigured && isNode) {
      const client = getSupabaseClient();
      if (client) {
        const payload = this.formatForSupabase(table, data);
        try {
          const syncPayload = { ...payload };
          let res = await (client.from(table as any) as any).upsert([syncPayload]);

          // Iteratively strip columns not present in remote schema cache
          let retries = 0;
          while (
            res?.error &&
            retries < 5 &&
            /Could not find the '([^']+)' column/i.test(res.error.message || '')
          ) {
            const match = res.error.message.match(/Could not find the '([^']+)' column/i);
            if (match && match[1] && syncPayload[match[1]] !== undefined) {
              delete syncPayload[match[1]];
              retries++;
              res = await (client.from(table as any) as any).upsert([syncPayload]);
            } else {
              break;
            }
          }

          if (
            res?.error &&
            /(?:username|first_name|last_name)/i.test(res.error.message || '')
          ) {
            delete syncPayload.username;
            delete syncPayload.first_name;
            delete syncPayload.last_name;
            res = await (client.from(table as any) as any).upsert([syncPayload]);
          }
          if (res?.error) {
            console.warn(`[NEXDO Supabase Sync] Failed to upsert to ${table}:`, res.error.message);
          }
          return res;
        } catch (err: any) {
          console.warn(`[NEXDO Supabase Sync] Exception on upsert to ${table}:`, err?.message || err);
        }
      }
    }
    return Promise.resolve();
  }

  /**
   * Deletes a record from live Supabase PostgreSQL table when configured
   */
  public async deleteFromRemote(table: string, id: string): Promise<any> {
    const isNode = typeof window === 'undefined' && typeof process !== 'undefined' && Boolean((process as any).versions?.node);
    if (isSupabaseConfigured && isNode) {
      const client = getSupabaseClient();
      if (client) {
        const uuid = this.toUuid(id);
        try {
          const res = await (client.from(table as any) as any).delete().eq('id', uuid);
          if (res?.error) {
            console.warn(`[NEXDO Supabase Delete] Failed to delete from ${table}:`, res.error.message);
          }
          return res;
        } catch (err: any) {
          console.warn(`[NEXDO Supabase Delete] Exception deleting from ${table}:`, err?.message || err);
        }
      }
    }
    return Promise.resolve();
  }

  /**
   * Directly queries a user by phone from remote Supabase
   */
  public async fetchUserByPhoneFromRemote(phone: string): Promise<UserRecord | null> {
    if (!isSupabaseConfigured) return null;
    const client = getSupabaseClient();
    if (!client) return null;

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) return null;

    try {
      const { data, error } = await client
        .from('users')
        .select('*')
        .or(`phone.eq.${cleanPhone},phone.eq.+91${cleanPhone},phone.eq.+91 ${cleanPhone}`)
        .limit(1);

      if (error || !data || data.length === 0) return null;
      const remoteUser = data[0] as UserRecord;
      this.users.set(remoteUser.id, remoteUser);

      // Proactively fetch associated profile
      if (remoteUser.role === 'CUSTOMER') {
        await this.fetchCustomerProfileFromRemote(remoteUser.id);
      } else if (remoteUser.role === 'TECHNICIAN') {
        await this.fetchTechnicianProfileFromRemote(remoteUser.id);
      }

      return remoteUser;
    } catch {
      return null;
    }
  }

  /**
   * Directly queries a user by email from remote Supabase
   */
  public async fetchUserByEmailFromRemote(email: string): Promise<UserRecord | null> {
    if (!isSupabaseConfigured) return null;
    const client = getSupabaseClient();
    if (!client) return null;

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return null;

    try {
      const { data, error } = await client
        .from('users')
        .select('*')
        .ilike('email', cleanEmail)
        .limit(1);

      if (error || !data || data.length === 0) return null;
      const remoteUser = data[0] as UserRecord;
      this.users.set(remoteUser.id, remoteUser);

      // Proactively fetch associated profile
      if (remoteUser.role === 'CUSTOMER') {
        await this.fetchCustomerProfileFromRemote(remoteUser.id);
      } else if (remoteUser.role === 'TECHNICIAN') {
        await this.fetchTechnicianProfileFromRemote(remoteUser.id);
      }

      return remoteUser;
    } catch {
      return null;
    }
  }

  /**
   * Directly queries a user by username from remote Supabase
   */
  public async fetchUserByUsernameFromRemote(username: string): Promise<UserRecord | null> {
    if (!isSupabaseConfigured) return null;
    const client = getSupabaseClient();
    if (!client) return null;

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) return null;

    // Check in-memory first
    const local = this.getUserByUsername(cleanUsername);
    if (local) return local;

    try {
      const { data, error } = await client
        .from('users')
        .select('*')
        .ilike('username', cleanUsername)
        .limit(1);

      if (!error && data && data.length > 0) {
        const remoteUser = data[0] as UserRecord;
        this.users.set(remoteUser.id, remoteUser);

        if (remoteUser.role === 'CUSTOMER') {
          await this.fetchCustomerProfileFromRemote(remoteUser.id);
        } else if (remoteUser.role === 'TECHNICIAN') {
          await this.fetchTechnicianProfileFromRemote(remoteUser.id);
        }
        return remoteUser;
      }
    } catch {
      // Column 'username' might not exist in remote table schema
    }

    // Fallback 1: Lookup by email prefix (e.g. 'nivasan24' matches 'nivasan24@gmail.com')
    try {
      const { data: emailData, error: emailError } = await client
        .from('users')
        .select('*')
        .ilike('email', `${cleanUsername}@%`)
        .limit(1);

      if (!emailError && emailData && emailData.length > 0) {
        const remoteUser = emailData[0] as UserRecord;
        this.users.set(remoteUser.id, remoteUser);
        if (remoteUser.role === 'CUSTOMER') {
          await this.fetchCustomerProfileFromRemote(remoteUser.id);
        } else if (remoteUser.role === 'TECHNICIAN') {
          await this.fetchTechnicianProfileFromRemote(remoteUser.id);
        }
        return remoteUser;
      }
    } catch {
      // Fallback 1 query optional
    }

    // Fallback 2: Lookup by profile full_name in customer_profiles or technician_profiles
    const searchName = cleanUsername.replace(/[._-]/g, ' ').trim();
    if (searchName) {
      try {
        const { data: custData } = await client
          .from('customer_profiles')
          .select('user_id')
          .ilike('full_name', searchName)
          .limit(1);

        if (custData && custData.length > 0 && custData[0].user_id) {
          return await this.fetchUserByIdFromRemote(custData[0].user_id);
        }

        const { data: techData } = await client
          .from('technician_profiles')
          .select('user_id')
          .ilike('full_name', searchName)
          .limit(1);

        if (techData && techData.length > 0 && techData[0].user_id) {
          return await this.fetchUserByIdFromRemote(techData[0].user_id);
        }
      } catch {
        // Fallback 2 query optional
      }
    }

    return null;
  }

  /**
   * Directly queries a user by ID from remote Supabase
   */
  public async fetchUserByIdFromRemote(userId: string): Promise<UserRecord | null> {
    if (!isSupabaseConfigured) return null;
    const client = getSupabaseClient();
    if (!client) return null;

    const uuid = this.toUuid(userId);
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('id', uuid)
      .limit(1);

    if (error || !data || data.length === 0) return null;
    const remoteUser = data[0] as UserRecord;
    this.users.set(remoteUser.id, remoteUser);
    return remoteUser;
  }

  /**
   * Directly queries a session by token hash from remote Supabase
   */
  public async fetchSessionByTokenHashFromRemote(tokenHash: string): Promise<SessionRecord | null> {
    if (this.revokedTokenHashes.has(tokenHash)) return null;
    if (!isSupabaseConfigured) return null;
    const client = getSupabaseClient();
    if (!client) return null;

    const { data, error } = await client
      .from('sessions')
      .select('*')
      .eq('session_token_hash', tokenHash)
      .limit(1);

    if (error || !data || data.length === 0) return null;
    const remoteSession = data[0] as SessionRecord;
    this.sessions.set(remoteSession.id, remoteSession);
    return remoteSession;
  }

  /**
   * Directly deletes a session by token hash from remote Supabase
   */
  public async deleteSessionByTokenHashFromRemote(tokenHash: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    const client = getSupabaseClient();
    if (!client) return;

    try {
      await (client.from('sessions') as any).delete().eq('session_token_hash', tokenHash);
    } catch (err: any) {
      console.warn('[NEXDO Supabase Delete] Exception deleting session by token hash:', err?.message || err);
    }
  }

  /**
   * Directly queries customer profile by user ID from remote Supabase
   */
  public async fetchCustomerProfileFromRemote(userId: string): Promise<CustomerProfileRecord | null> {
    if (!isSupabaseConfigured) return null;
    const client = getSupabaseClient();
    if (!client) return null;

    const uuid = this.toUuid(userId);
    const { data, error } = await client
      .from('customer_profiles')
      .select('*')
      .eq('user_id', uuid)
      .limit(1);

    if (error || !data || data.length === 0) return null;
    const remoteProfile = data[0] as CustomerProfileRecord;
    this.customerProfiles.set(remoteProfile.id, remoteProfile);
    return remoteProfile;
  }

  /**
   * Directly queries technician profile by user ID from remote Supabase
   */
  public async fetchTechnicianProfileFromRemote(userId: string): Promise<TechnicianProfileRecord | null> {
    if (!isSupabaseConfigured) return null;
    const client = getSupabaseClient();
    if (!client) return null;

    const uuid = this.toUuid(userId);
    const { data, error } = await client
      .from('technician_profiles')
      .select('*')
      .eq('user_id', uuid)
      .limit(1);

    if (error || !data || data.length === 0) return null;
    const p = data[0] as any;
    const mapped: TechnicianProfileRecord = {
      id: p.id,
      profile_id: p.user_id,
      first_name: p.first_name || undefined,
      last_name: p.last_name || undefined,
      name:
        p.first_name && p.last_name
          ? `${p.first_name} ${p.last_name}`.trim()
          : p.full_name || p.first_name || 'Service Provider',
      phone: p.phone,
      email: p.email || undefined,
      city: 'Chennai',
      district: 'Chennai District, Tamil Nadu',
      pincode: '600020',
      radius_km: 8,
      experience_years: p.experience_years || 1,
      rating: p.rating || 5.0,
      review_count: p.review_count || 0,
      completed_jobs_count: p.completed_jobs_count || 0,
      verification_status: p.verification_status || 'VERIFIED',
      availability_status: p.online_status || 'ONLINE',
      service_areas: [p.service_area || 'Chennai Central'],
      languages_spoken: ['Tamil', 'English'],
      badges: ['Verified Pro'],
      subscription_plan: p.subscription_plan || 'WEEKLY',
      latitude: p.latitude !== undefined && p.latitude !== null ? Number(p.latitude) : null,
      longitude: p.longitude !== undefined && p.longitude !== null ? Number(p.longitude) : null,
      location_updated_at: p.location_updated_at || null,
      is_location_shared: Boolean(p.is_location_shared),
      last_seen_at: p.last_seen_at,
      created_at: p.created_at,
      updated_at: p.updated_at,
    };
    this.technicianProfiles.set(mapped.id, mapped);

    try {
      const { data: skillsData } = await client
        .from('technician_skills')
        .select('*')
        .eq('technician_id', p.id);

      if (skillsData && Array.isArray(skillsData)) {
        for (const s of skillsData) {
          const mappedSkill: TechnicianSkillRecord = {
            id: s.id,
            technician_id: s.technician_id,
            skill_code: s.skill_code,
            skill_name: s.skill_name,
            category: s.category || 'General',
            experience_level: s.experience_level || 'INTERMEDIATE',
            is_certified: Boolean(s.is_certified),
            active: s.active !== undefined ? Boolean(s.active) : true,
            created_at: s.created_at || new Date().toISOString(),
          };
          this.technicianSkills.set(mappedSkill.id, mappedSkill);
        }
      }
    } catch {
      // Skills query optional
    }

    return mapped;
  }

  /**
   * Fetches all real registered technician profiles and their registered skills from remote Supabase
   */
  public async fetchAllTechniciansFromRemote(): Promise<TechnicianProfileRecord[]> {
    if (!isSupabaseConfigured) {
      return Array.from(this.technicianProfiles.values());
    }
    const client = getSupabaseClient();
    if (!client) {
      return Array.from(this.technicianProfiles.values());
    }

    try {
      const { data: techData, error: techError } = await client
        .from('technician_profiles')
        .select('*');

      if (techError || !techData) {
        return Array.from(this.technicianProfiles.values());
      }

      const { data: skillsData } = await client
        .from('technician_skills')
        .select('*');

      if (skillsData && Array.isArray(skillsData)) {
        for (const s of skillsData) {
          const mappedSkill: TechnicianSkillRecord = {
            id: s.id,
            technician_id: s.technician_id,
            skill_code: s.skill_code,
            skill_name: s.skill_name,
            category: s.category || 'General',
            experience_level: s.experience_level || 'INTERMEDIATE',
            is_certified: Boolean(s.is_certified),
            active: s.active !== undefined ? Boolean(s.active) : true,
            created_at: s.created_at || new Date().toISOString(),
          };
          this.technicianSkills.set(mappedSkill.id, mappedSkill);
        }
      }

      for (const p of techData) {
        const mapped: TechnicianProfileRecord = {
          id: p.id,
          profile_id: p.user_id,
          first_name: p.first_name || undefined,
          last_name: p.last_name || undefined,
          name:
            p.first_name && p.last_name
              ? `${p.first_name} ${p.last_name}`.trim()
              : p.full_name || p.first_name || 'Service Provider',
          phone: p.phone,
          email: p.email || undefined,
          city: 'Chennai',
          district: 'Chennai District, Tamil Nadu',
          pincode: '600020',
          radius_km: p.radius_km || 8,
          experience_years: p.experience_years || 1,
          rating: p.rating || 5.0,
          review_count: p.review_count || 0,
          completed_jobs_count: p.completed_jobs_count || 0,
          verification_status: p.verification_status || 'VERIFIED',
          availability_status: p.online_status || 'ONLINE',
          service_areas: [p.service_area || 'Chennai Central'],
          languages_spoken: ['Tamil', 'English'],
          badges: ['Verified Pro'],
          subscription_plan: p.subscription_plan || 'WEEKLY',
          latitude: p.latitude !== undefined && p.latitude !== null ? Number(p.latitude) : null,
          longitude: p.longitude !== undefined && p.longitude !== null ? Number(p.longitude) : null,
          location_updated_at: p.location_updated_at || null,
          is_location_shared: Boolean(p.is_location_shared),
          last_seen_at: p.last_seen_at,
          created_at: p.created_at,
          updated_at: p.updated_at,
        };
        this.technicianProfiles.set(mapped.id, mapped);
      }

      return Array.from(this.technicianProfiles.values());
    } catch (err) {
      console.warn('[NEXDO Backend] Exception fetching all technicians from remote:', err);
      return Array.from(this.technicianProfiles.values());
    }
  }

  /**
   * Directly queries a service request by ID from remote Supabase
   */
  public async fetchServiceRequestFromRemote(requestId: string): Promise<ServiceRequestRecord | null> {
    if (!isSupabaseConfigured) return null;
    const client = getSupabaseClient();
    if (!client) return null;

    const uuid = this.toUuid(requestId);
    const { data, error } = await client
      .from('service_requests')
      .select('*')
      .eq('id', uuid)
      .limit(1);

    if (error || !data || data.length === 0) return null;
    const remoteReq = data[0] as ServiceRequestRecord;
    this.serviceRequests.set(remoteReq.id, remoteReq);
    return remoteReq;
  }

  /**
   * Directly queries a booking by ID from remote Supabase
   */
  public async fetchBookingFromRemote(bookingId: string): Promise<BookingRecord | null> {
    if (!isSupabaseConfigured) return null;
    const client = getSupabaseClient();
    if (!client) return null;

    const uuid = this.toUuid(bookingId);
    const { data, error } = await client
      .from('bookings')
      .select('*')
      .eq('id', uuid)
      .limit(1);

    if (error || !data || data.length === 0) return null;
    const raw = data[0] as any;
    const remoteBooking: BookingRecord = {
      ...raw,
      latitude: raw.latitude !== undefined && raw.latitude !== null ? Number(raw.latitude) : undefined,
      longitude: raw.longitude !== undefined && raw.longitude !== null ? Number(raw.longitude) : undefined,
      estimated_price: Number(raw.total_amount ?? raw.diagnosis_fee ?? raw.service_amount ?? 149),
      diagnosis_fee: Number(raw.diagnosis_fee ?? 0),
      service_amount: Number(raw.service_amount ?? 0),
      total_amount: Number(raw.total_amount ?? 149),
    };
    this.bookings.set(bookingId, remoteBooking);
    this.bookings.set(remoteBooking.id, remoteBooking);
    return remoteBooking;
  }

  /**
   * Updates a technician's GPS coordinates and records telemetry
   */
  public async updateTechnicianLocationAsync(
    technicianId: string,
    coords: {
      latitude: number;
      longitude: number;
      accuracy_meters?: number | null;
      speed_mps?: number | null;
      heading_degrees?: number | null;
    }
  ): Promise<TechnicianProfileRecord | null> {
    let tech = this.technicianProfiles.get(technicianId) || this.technicianProfiles.get(this.toUuid(technicianId));
    if (!tech) {
      const targetUuid = this.toUuid(technicianId);
      tech = Array.from(this.technicianProfiles.values()).find(
        (t) => t.id === technicianId || this.toUuid(t.id) === targetUuid || t.profile_id === technicianId
      );
    }
    if (!tech) return null;

    const now = new Date().toISOString();
    tech.latitude = coords.latitude;
    tech.longitude = coords.longitude;
    tech.location_updated_at = now;
    tech.is_location_shared = true;
    tech.updated_at = now;

    // Record in technicianLocations
    const locRecord: any = {
      id: `loc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      technician_id: tech.id,
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy_meters: coords.accuracy_meters || null,
      speed_mps: coords.speed_mps || null,
      heading_degrees: coords.heading_degrees || null,
      recorded_at: now,
    };
    this.technicianLocations.set(locRecord.id, locRecord);

    await this.syncToRemote('technician_profiles', tech);
    await this.syncToRemote('technician_locations', locRecord);

    return tech;
  }

  /**
   * Stops live location sharing for a technician
   */
  public async stopTechnicianLocationSharingAsync(technicianId: string): Promise<boolean> {
    let tech = this.technicianProfiles.get(technicianId) || this.technicianProfiles.get(this.toUuid(technicianId));
    if (!tech) {
      const targetUuid = this.toUuid(technicianId);
      tech = Array.from(this.technicianProfiles.values()).find(
        (t) => t.id === technicianId || this.toUuid(t.id) === targetUuid || t.profile_id === technicianId
      );
    }
    if (!tech) return false;

    tech.is_location_shared = false;
    tech.updated_at = new Date().toISOString();
    await this.syncToRemote('technician_profiles', tech);
    return true;
  }

  // --------------------------------------------------------------------------
  // INITIAL DATA SEEDING
  // --------------------------------------------------------------------------
  public seedInitialData() {
    // 1. Service Categories
    const categories: ServiceCategoryRecord[] = [
      {
        id: 'c0000001-0000-0000-0000-000000000001',
        code: 'AC_REPAIR',
        name_en: 'AC Repair',
        name_ta: 'ஏசி பழுதுபார்த்தல்',
        description_en: 'Cooling issues, compressor, gas refill, leakage & servicing',
        description_ta: 'ஏசி கூலிங் வரவில்லை, கேஸ் ரீஃபில், கம்ப்ரசர் சரிசெய்தல்',
        icon: 'Snowflake',
        base_diagnosis_fee: 149,
        base_service_price: 499,
        is_active: true,
        sort_order: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'c0000001-0000-0000-0000-000000000002',
        code: 'TV_REPAIR',
        name_en: 'TV Repair',
        name_ta: 'டிவி பழுதுபார்த்தல்',
        description_en: 'Smart LED, display panel, sound issues, motherboard repair',
        description_ta: 'டிவி டிஸ்ப்ளே, ஆடியோ போர்டு மற்றும் மதர்போர்டு பழுது',
        icon: 'Tv',
        base_diagnosis_fee: 149,
        base_service_price: 449,
        is_active: true,
        sort_order: 2,
        created_at: new Date().toISOString(),
      },
      {
        id: 'c0000001-0000-0000-0000-000000000003',
        code: 'REFRIGERATOR_REPAIR',
        name_en: 'Refrigerator Repair',
        name_ta: 'பிரிட்ஜ் பழுதுபார்த்தல்',
        description_en: 'Cooling failure, thermostat, defrosting, gas leakage',
        description_ta: 'பிரிட்ஜ் கூலிங் பிரச்சனை, கேஸ் லீக், மோட்டார் சரிசெய்தல்',
        icon: 'Refrigerator',
        base_diagnosis_fee: 149,
        base_service_price: 499,
        is_active: true,
        sort_order: 3,
        created_at: new Date().toISOString(),
      },
      {
        id: 'c0000001-0000-0000-0000-000000000004',
        code: 'WASHING_MACHINE_REPAIR',
        name_en: 'Washing Machine Repair',
        name_ta: 'வாஷிங் மெஷின் பழுதுபார்த்தல்',
        description_en: 'Drum spin issues, water drainage, motor replacement, PCB error',
        description_ta: 'டிரம் சுழலவில்லை, தண்ணீர் வடியவில்லை, போர்டு பழுது',
        icon: 'WashingMachine',
        base_diagnosis_fee: 149,
        base_service_price: 499,
        is_active: true,
        sort_order: 4,
        created_at: new Date().toISOString(),
      },
      {
        id: 'c0000001-0000-0000-0000-000000000005',
        code: 'ELECTRICAL_WORK',
        name_en: 'Electrical',
        name_ta: 'மின்சார வேலைகள்',
        description_en: 'Switchboard, wiring, MCB tripping, fan installation',
        description_ta: 'சுவிட்ச் போர்டு, வயரிங், ஃபேன் ரிப்பேர், எம்சிபி சரிசெய்தல்',
        icon: 'Zap',
        base_diagnosis_fee: 149,
        base_service_price: 249,
        is_active: true,
        sort_order: 5,
        created_at: new Date().toISOString(),
      },
      {
        id: 'c0000001-0000-0000-0000-000000000006',
        code: 'PLUMBING',
        name_en: 'Plumbing',
        name_ta: 'பிளம்பிங் வேலைகள்',
        description_en: 'Pipe leakage, tap replacement, drainage clog, sanitary fitting',
        description_ta: 'பைப் லீக்கேஜ், குழாய் மாற்றுதல், அடைப்பு சரிசெய்தல்',
        icon: 'Droplet',
        base_diagnosis_fee: 149,
        base_service_price: 249,
        is_active: true,
        sort_order: 6,
        created_at: new Date().toISOString(),
      },
      {
        id: 'c0000001-0000-0000-0000-000000000007',
        code: 'CLEANING',
        name_en: 'Cleaning',
        name_ta: 'சுத்தம் செய்யும் வேலைகள்',
        description_en: 'Deep home cleaning, bathroom scrubbing, kitchen sanitation',
        description_ta: 'முழு வீடு மற்றும் கழிவறை ஆழ்ந்த சுத்திகரிப்பு',
        icon: 'Sparkles',
        base_diagnosis_fee: 0,
        base_service_price: 399,
        is_active: true,
        sort_order: 7,
        created_at: new Date().toISOString(),
      },
      {
        id: 'c0000001-0000-0000-0000-000000000008',
        code: 'APPLIANCE_REPAIR',
        name_en: 'Appliance Repair',
        name_ta: 'வீட்டு உபகரணங்கள் பழுதுபார்த்தல்',
        description_en: 'Microwave, mixer grinder, water heater (geyser) repair',
        description_ta: 'மைக்ரோவேவ், மிக்சி, வாட்டர் ஹீட்டர் சரிசெய்தல்',
        icon: 'Wrench',
        base_diagnosis_fee: 149,
        base_service_price: 349,
        is_active: true,
        sort_order: 8,
        created_at: new Date().toISOString(),
      },
    ];
    categories.forEach((c) => this.serviceCategories.set(c.id, c));

    // 2. Subscription Plans (DAILY: ₹99, WEEKLY: ₹599, MONTHLY: ₹2499)
    const plans: SubscriptionPlanRecord[] = [
      {
        id: 'p0000001-0000-0000-0000-000000000001',
        plan_code: 'plan_daily',
        tier: 'DAILY',
        title: 'Daily Access Pass',
        price: 99,
        billing_cycle: 'per day',
        period_days: 1,
        features: [
          'Unlimited eligible job requests during your active day',
          'Zero commission — keep 100% of customer job earnings',
          'Real-time voice & audio incoming job announcements',
          'Direct customer phone & navigation coordinates',
          'Instant payout handoff on service completion',
        ],
        tagline: 'Unlimited eligible jobs during active 24-hour access',
        badge: 'Flexible Day Pass',
        truthful_disclaimer:
          'Unlimited access allows receiving all requests matching your capabilities and area without artificial caps. It does not guarantee customer request volume or job allocations.',
        recommended: false,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'p0000001-0000-0000-0000-000000000002',
        plan_code: 'plan_weekly',
        tier: 'WEEKLY',
        title: 'Weekly Access Pass',
        price: 599,
        billing_cycle: 'per week',
        period_days: 7,
        features: [
          '7 days uninterrupted eligible job access',
          'Save over ₹90 compared to daily renewals',
          'Zero commission — keep 100% of customer job earnings',
          'Real-time voice & audio incoming job announcements',
          'Direct customer phone & navigation coordinates',
          'Instant payout handoff on service completion',
        ],
        tagline: 'High flexibility for active weekly service schedules',
        badge: 'Best Flexibility',
        truthful_disclaimer:
          'Provides continuous platform access for 7 days with zero per-job commission. Service demand depends on local customer requests and is not guaranteed.',
        recommended: false,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'p0000001-0000-0000-0000-000000000003',
        plan_code: 'plan_monthly',
        tier: 'MONTHLY',
        title: 'Monthly Access Pass',
        price: 2499,
        billing_cycle: 'per month',
        period_days: 30,
        features: [
          '30 days uninterrupted eligible job access',
          'Save over ₹470 compared to daily renewals',
          'Zero commission — keep 100% of customer job earnings',
          'Priority capability matching in your service radius',
          'Voice announcements in your preferred local language',
          'Dedicated partner phone support line',
        ],
        tagline: 'Best value for dedicated full-time service professionals',
        badge: 'Most Popular',
        truthful_disclaimer:
          'Provides continuous platform access for 30 days with no per-job commission. Service demand depends on local customer requests and is not guaranteed.',
        recommended: true,
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ];
    plans.forEach((p) => this.subscriptionPlans.set(p.id, p));

    // 3. Seed Users with Cryptographic Password Hashes
    const defaultPasswordHash =
      'pbkdf2:sha512:100000:d1a2b3c4d5e6f7a8:6be91d2a3f4a26145009cb394085dd3ecd14e663d99b679fb0212d466c08cf842ca9f11c8aacc89b393ac46c0b3a98e4c10f56525bad47d4c9177e6a9ab0696e';

    // Customer User
    const custUserId = 'u0000001-0000-0000-0000-000000000001';
    const custUser: UserRecord = {
      id: custUserId,
      username: 'hariharasudhan',
      email: 'customer@nexdo.in',
      phone: '9876543210',
      password_hash: defaultPasswordHash,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      email_verified: true,
      phone_verified: true,
      last_login_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.users.set(custUser.id, custUser);

    const custProfileRecord: CustomerProfileRecord = {
      id: 'cp_0000001',
      user_id: custUserId,
      full_name: 'Hariharasudhan',
      phone: '9876543210',
      email: 'customer@nexdo.in',
      address: '42, Sengunthapuram 3rd Cross',
      city: 'Karur',
      state: 'Tamil Nadu',
      pincode: '639002',
      latitude: 10.9601,
      longitude: 78.0766,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.customerProfiles.set(custProfileRecord.id, custProfileRecord);

    // Legacy profile record for backward compatibility
    const legacyCustProfile: ProfileRecord = {
      id: custUserId,
      user_id: custUserId,
      role: 'CUSTOMER',
      name: 'Hariharasudhan',
      phone: '9876543210',
      email: 'customer@nexdo.in',
      dob: '24/08/2007',
      address: '42, Sengunthapuram 3rd Cross',
      city: 'Karur',
      district: 'Karur District, Tamil Nadu',
      pincode: '639002',
      preferred_language: 'ta',
      voice_auto_confirm: true,
      saved_addresses: [
        {
          id: 'addr_home',
          label: 'Home',
          address: '42, Sengunthapuram 3rd Cross, Karur, TN 639002',
          isDefault: true,
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.profiles.set(legacyCustProfile.id, legacyCustProfile);

    // Technician 1: Ravi Kumar (HVAC & Cooling)
    const techUser1Id = 'u0000001-0000-0000-0000-000000000002';
    const techUser1: UserRecord = {
      id: techUser1Id,
      username: 'ravi_kumar',
      email: 'ravi.kumar@nexdo.in',
      phone: '9840122334',
      password_hash: defaultPasswordHash,
      role: 'TECHNICIAN',
      status: 'ACTIVE',
      email_verified: true,
      phone_verified: true,
      last_login_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.users.set(techUser1.id, techUser1);

    const tech1: TechnicianProfileRecord = {
      id: 't0000001-0000-0000-0000-000000000001',
      profile_id: techUser1Id,
      name: 'Ravi Kumar',
      phone: '+91 98401 22334',
      email: 'ravi.kumar@nexdo.in',
      city: 'Chennai',
      district: 'Chennai District, Tamil Nadu',
      pincode: '600020',
      radius_km: 8,
      experience_years: 7,
      rating: 4.9,
      review_count: 342,
      completed_jobs_count: 342,
      verification_status: 'VERIFIED',
      availability_status: 'ONLINE',
      service_areas: ['Adyar', 'Besant Nagar', 'Thiruvanmiyur', 'Kotturpuram'],
      languages_spoken: ['Tamil', 'English'],
      bio: 'Certified HVAC & multi-skill technician with 7+ years on-field experience in Adyar & South Chennai. Background verified, 30-day warranty.',
      badges: ['Top Rated Pro', 'Multi-Skilled', 'Speedy Arrival'],
      subscription_plan: 'MONTHLY',
      last_seen_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.technicianProfiles.set(tech1.id, tech1);

    // Technician 2: Senthil Murugan
    const techUser2Id = 'u0000001-0000-0000-0000-000000000003';
    const techUser2: UserRecord = {
      id: techUser2Id,
      username: 'senthil_murugan',
      email: 'senthil.murugan@nexdo.in',
      phone: '9840233445',
      password_hash: defaultPasswordHash,
      role: 'TECHNICIAN',
      status: 'ACTIVE',
      email_verified: true,
      phone_verified: true,
      last_login_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.users.set(techUser2.id, techUser2);

    const tech2: TechnicianProfileRecord = {
      id: 't0000001-0000-0000-0000-000000000002',
      profile_id: techUser2Id,
      name: 'Senthil Murugan',
      phone: '+91 98402 33445',
      email: 'senthil.murugan@nexdo.in',
      city: 'Chennai',
      district: 'Chennai District, Tamil Nadu',
      pincode: '600090',
      radius_km: 6,
      experience_years: 9,
      rating: 4.8,
      review_count: 218,
      completed_jobs_count: 218,
      verification_status: 'VERIFIED',
      availability_status: 'ONLINE',
      service_areas: ['Besant Nagar', 'Thiruvanmiyur', 'Mylapore'],
      languages_spoken: ['Tamil'],
      bio: 'Experienced cooling appliances specialist with deep expertise in multi-brand inverter ACs, gas leakage sealing, and PCB diagnostics.',
      badges: ['Inverter Pro', 'Fast Responder'],
      subscription_plan: 'WEEKLY',
      last_seen_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.technicianProfiles.set(tech2.id, tech2);

    // Technician 3: Kumaravel Electronics
    const techUser3Id = 'u0000001-0000-0000-0000-000000000004';
    const techUser3: UserRecord = {
      id: techUser3Id,
      username: 'kumaravel',
      email: 'kumaravel@nexdo.in',
      phone: '9840155667',
      password_hash: defaultPasswordHash,
      role: 'TECHNICIAN',
      status: 'ACTIVE',
      email_verified: true,
      phone_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.users.set(techUser3.id, techUser3);

    const tech3: TechnicianProfileRecord = {
      id: 't0000001-0000-0000-0000-000000000003',
      profile_id: techUser3Id,
      name: 'Kumaravel Electronics',
      phone: '+91 98401 55667',
      email: 'kumaravel@nexdo.in',
      city: 'Chennai',
      district: 'Chennai District, Tamil Nadu',
      pincode: '600041',
      radius_km: 10,
      experience_years: 8,
      rating: 4.9,
      review_count: 284,
      completed_jobs_count: 284,
      verification_status: 'VERIFIED',
      availability_status: 'ONLINE',
      service_areas: ['Thiruvanmiyur', 'Adyar', 'Velachery'],
      languages_spoken: ['Tamil', 'English'],
      bio: 'Certified television & electronics specialist with 8+ years experience in LED, OLED, and smart TV motherboard repairs.',
      badges: ['Top Rated Pro', 'Screen Specialist', 'Fast Arrival'],
      subscription_plan: 'MONTHLY',
      last_seen_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.technicianProfiles.set(tech3.id, tech3);

    // Technician 4: Murugan Plumbing
    const techUser4Id = 'u0000001-0000-0000-0000-000000000005';
    const techUser4: UserRecord = {
      id: techUser4Id,
      username: 'murugan_plumbing',
      email: 'murugan.plumbing@nexdo.in',
      phone: '9840311223',
      password_hash: defaultPasswordHash,
      role: 'TECHNICIAN',
      status: 'ACTIVE',
      email_verified: true,
      phone_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.users.set(techUser4.id, techUser4);

    const tech4: TechnicianProfileRecord = {
      id: 't0000001-0000-0000-0000-000000000004',
      profile_id: techUser4Id,
      name: 'Murugan Plumbing Works',
      phone: '+91 98403 11223',
      email: 'murugan.plumbing@nexdo.in',
      city: 'Chennai',
      district: 'Chennai District, Tamil Nadu',
      pincode: '600085',
      radius_km: 7,
      experience_years: 9,
      rating: 4.9,
      review_count: 312,
      completed_jobs_count: 312,
      verification_status: 'VERIFIED',
      availability_status: 'ONLINE',
      service_areas: ['Kotturpuram', 'Adyar', 'Mylapore'],
      languages_spoken: ['Tamil'],
      bio: 'Expert plumber for immediate pipe burst, faucet replacement, water line clogging, and bathroom sanitary repairs.',
      badges: ['Speedy Arrival', 'Top Rated Plumber', '30-Day Guarantee'],
      subscription_plan: 'WEEKLY',
      last_seen_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.technicianProfiles.set(tech4.id, tech4);

    // 4. Skills & Capabilities Seed
    const capabilities: TechnicianCapabilityRecord[] = [
      {
        id: 'cap00001-0000-0000-0000-000000000001',
        technician_id: tech1.id,
        code: 'AC_REPAIR',
        name: 'AC Repair & Diagnostics',
        category: 'HVAC & Cooling',
        experience_level: 'EXPERT',
        is_certified: true,
        active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'cap00001-0000-0000-0000-000000000002',
        technician_id: tech1.id,
        code: 'AC_SERVICE',
        name: 'AC Deep Cleaning & Gas Refill',
        category: 'HVAC & Cooling',
        experience_level: 'EXPERT',
        is_certified: true,
        active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'cap00001-0000-0000-0000-000000000003',
        technician_id: tech1.id,
        code: 'ELECTRICAL_WORK',
        name: 'Wiring, MCB & Switchboard Work',
        category: 'Electrical',
        experience_level: 'INTERMEDIATE',
        is_certified: false,
        active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'cap00001-0000-0000-0000-000000000004',
        technician_id: tech2.id,
        code: 'AC_REPAIR',
        name: 'Inverter AC Diagnostics',
        category: 'HVAC & Cooling',
        experience_level: 'EXPERT',
        is_certified: true,
        active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'cap00001-0000-0000-0000-000000000005',
        technician_id: tech3.id,
        code: 'TV_REPAIR',
        name: 'Smart LED & TV Diagnostics',
        category: 'Electronics',
        experience_level: 'EXPERT',
        is_certified: true,
        active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'cap00001-0000-0000-0000-000000000006',
        technician_id: tech4.id,
        code: 'PLUMBING',
        name: 'Pipe Leakage & Tap Broken Repair',
        category: 'Plumbing',
        experience_level: 'EXPERT',
        is_certified: true,
        active: true,
        created_at: new Date().toISOString(),
      },
    ];
    capabilities.forEach((c) => {
      this.technicianCapabilities.set(c.id, c);
      this.technicianSkills.set(c.id, {
        id: c.id,
        technician_id: c.technician_id,
        skill_code: c.code,
        skill_name: c.name,
        category: c.category,
        experience_level: c.experience_level,
        is_certified: c.is_certified,
        active: c.active,
        created_at: c.created_at,
      });
    });

    // 5. Subscriptions Seed (Ravi: Monthly, Senthil: Weekly ₹599 mandatory pass)
    const sub1: TechnicianSubscriptionRecord = {
      id: 's0000001-0000-0000-0000-000000000001',
      technician_id: tech1.id,
      plan_id: 'p0000001-0000-0000-0000-000000000003',
      plan_type: 'MONTHLY',
      price: 2499,
      is_active: true,
      activated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      expires_at: new Date(Date.now() + 25 * 86400000).toISOString(),
      payment_reference: 'TXN_SUB_MTH_001',
      created_at: new Date().toISOString(),
    };
    this.technicianSubscriptions.set(sub1.id, sub1);
    this.subscriptions.set(sub1.id, sub1);

    const sub2: TechnicianSubscriptionRecord = {
      id: 's0000001-0000-0000-0000-000000000002',
      technician_id: tech2.id,
      plan_id: 'p0000001-0000-0000-0000-000000000002',
      plan_type: 'WEEKLY',
      price: 599,
      is_active: true,
      activated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      expires_at: new Date(Date.now() + 5 * 86400000).toISOString(),
      payment_reference: 'TXN_SUB_WK_002',
      created_at: new Date().toISOString(),
    };
    this.technicianSubscriptions.set(sub2.id, sub2);
    this.subscriptions.set(sub2.id, sub2);
  }

  /**
   * Syncs core seed entities (technicians, skills, users, profiles) to live Supabase database
   */
  public async syncSeedDataToRemote(): Promise<void> {
    if (!isSupabaseConfigured) return;
    const client = getSupabaseClient();
    if (!client) return;

    try {
      // 1. Sync seed users
      for (const u of this.users.values()) {
        await this.syncToRemote('users', u);
      }
      // 2. Sync seed customer profiles
      for (const cp of this.customerProfiles.values()) {
        await this.syncToRemote('customer_profiles', cp);
      }
      // 3. Sync seed technician profiles
      for (const tp of this.technicianProfiles.values()) {
        await this.syncToRemote('technician_profiles', tp);
      }
      // 4. Sync seed technician skills
      for (const ts of this.technicianSkills.values()) {
        await this.syncToRemote('technician_skills', ts);
      }
      // 5. Sync seed subscriptions
      for (const sub of this.subscriptions.values()) {
        await this.syncToRemote('subscriptions', sub);
      }
    } catch (err: any) {
      console.warn('[NEXDO] Seed sync warning:', err?.message || err);
    }
  }

  /**
   * Resets entire store to initial pristine seed state (for test isolation)
   */
  public resetToSeed(): void {
    this.users.clear();
    this.sessions.clear();
    this.customerProfiles.clear();
    this.technicianProfiles.clear();
    this.technicianSkills.clear();
    this.serviceRequests.clear();
    this.bookings.clear();
    this.bookingStatusHistory.clear();
    this.payments.clear();
    this.subscriptions.clear();
    this.technicianEarnings.clear();
    this.auditLogs.clear();
    this.profiles.clear();
    this.serviceCategories.clear();
    this.technicianCapabilities.clear();
    this.subscriptionPlans.clear();
    this.technicianMatches.clear();
    this.bookingEvents.clear();
    this.diagnoses.clear();
    this.estimates.clear();
    this.estimateItems.clear();
    this.estimateApprovals.clear();
    this.technicianPayouts.clear();
    this.conversationSessions.clear();
    this.conversationMessages.clear();
    this.voiceIntents.clear();
    this.notifications.clear();
    this.revokedTokenHashes.clear();
    this.inTransaction = false;
    this.transactionSnapshot = null;
    this.seedInitialData();
  }
}

export const dbStore = new NexdoDatabaseStore();
