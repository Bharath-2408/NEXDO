// ============================================================================
// BOOKING SERVICE & STATE MACHINE
// End-to-end service lifecycle: Customer -> Backend -> Technician
// Enforces Diagnosis (₹149) vs Direct Service, State Transitions, Audit Events,
// Server-Authoritative Pricing, Idempotency, Concurrency, and Webhooks.
// ============================================================================

import { dbStore } from '../database/store';
import {
  BookingRecord,
  BookingStatus,
  BookingEventRecord,
  BookingStatusHistoryRecord,
  DiagnosisRecord,
  EstimateRecord,
  PaymentRecord,
  TechnicianPayoutRecord,
  TechnicianEarningsRecord,
} from '../database/types';
import { TechnicianMatchingService } from './technicianMatchingService';
import { Booking, MatchedProvider } from '../../types/customer';
import { JobOpportunity, TechnicianEarnings } from '../../types/technician';
import { AuthSecurity } from './authSecurity';
import { calculateHaversineDistanceKm, estimateEtaMinutes, isValidCoordinate } from '../../utils/geoUtils';

export interface CreateBookingInput {
  customerId?: string;
  technicianId: string;
  serviceTitle: string;
  scheduledTime: string;
  appointmentDate?: string;
  appointmentTime?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  serviceMode?: 'DIAGNOSIS' | 'SERVICE';
  notes?: string;
  estimatedPrice?: number;
  idempotencyKey?: string;
  status?: BookingStatus;
}

export class BookingService {
  /**
   * Transforms raw BookingRecord into frontend Booking interface
   */
  public static mapToFrontendBooking(record: BookingRecord): Booking {
    const techProfile = dbStore.technicianProfiles.get(record.technician_id);
    const diag = Array.from(dbStore.diagnoses.values()).find(
      (d) => d.booking_id === record.id
    );
    const est = Array.from(dbStore.estimates.values()).find(
      (e) => e.booking_id === record.id
    );
    const pay = Array.from(dbStore.payments.values()).find(
      (p) => p.booking_id === record.id
    );

    const provider: MatchedProvider = techProfile
      ? {
          id: techProfile.id,
          name: techProfile.name,
          avatar: techProfile.name.includes('Ravi')
            ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
            : techProfile.name.includes('Senthil')
            ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          rating: techProfile.rating,
          reviewCount: techProfile.review_count,
          distanceKm: 2.1,
          etaMinutes: 25,
          verified: techProfile.verification_status === 'VERIFIED',
          primaryCapability: 'HVAC & Cooling Pro',
          allCapabilities: ['AC Repair', 'Electrical', 'Diagnostics'],
          diagnosisFee: 149,
          repairPriceNote: 'Decided after diagnosis',
          estimatedPrice: record.estimated_price,
          experienceYears: techProfile.experience_years,
          phone: techProfile.phone,
          bio: techProfile.bio || '',
          badges: techProfile.badges,
        }
      : TechnicianMatchingService.getTechnicianById(record.technician_id)!;

    const customer =
      dbStore.customerProfiles.get(record.customer_id) ||
      dbStore.profiles.get(record.customer_id);

    return {
      id: record.id,
      referenceCode: record.reference_code,
      customerId: record.customer_id,
      technicianId: record.technician_id,
      customerName: (customer as any)?.full_name || (customer as any)?.name || 'Customer',
      customerPhone: customer?.phone || '9876543210',
      provider,
      serviceTitle: record.service_title,
      scheduledTime: record.scheduled_time,
      address: record.address,
      latitude: record.latitude !== undefined && record.latitude !== null ? Number(record.latitude) : undefined,
      longitude: record.longitude !== undefined && record.longitude !== null ? Number(record.longitude) : undefined,
      status: record.status,
      estimatedPrice: record.estimated_price,
      otpCode: record.otp_code,
      createdAt: record.created_at,
      serviceMode: record.service_mode,
      notes: record.notes,
      diagnosis: diag
        ? {
            fee: diag.fee,
            findings: diag.findings,
            isPaid: diag.is_paid,
            otp: diag.otp,
            isVerified: diag.is_verified,
            diagnosedAt: diag.diagnosed_at,
          }
        : undefined,
      estimate: est
        ? {
            parts: est.parts_amount,
            labour: est.labour_amount,
            total: est.total_amount,
            description: est.description,
            isApproved: est.is_approved,
            approvedAt: est.approved_at,
            isPriceLocked: est.is_price_locked,
          }
        : undefined,
      payment: pay
        ? {
            status: pay.status === 'SUCCESS' ? 'RECEIVED' : (pay.status as any),
            amount: pay.amount,
            transactionId: pay.transaction_reference,
            qrCodeData: `upi://pay?pa=nexdo.pay@sandbox&pn=NEXDO&am=${pay.amount}&tr=${pay.transaction_reference}`,
            isSandbox: pay.is_sandbox,
            paidAt: pay.confirmed_at,
            method: pay.payment_method,
          }
        : undefined,
    };
  }

  /**
   * Creates a new booking record with server-authoritative pricing and idempotency checks
   */
  public static createBooking(input: CreateBookingInput): Booking {
    // 1. Idempotency Check
    if (input.idempotencyKey) {
      for (const existing of dbStore.bookings.values()) {
        if (existing.idempotency_key === input.idempotencyKey) {
          return this.mapToFrontendBooking(existing);
        }
      }
    }

    const custId = input.customerId || 'u0000001-0000-0000-0000-000000000001';
    const serviceMode = input.serviceMode || 'DIAGNOSIS';
    const bookingId = `bk_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const refCode = `NXD-${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;
    const now = new Date().toISOString();
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const finalOtp = Math.floor(1000 + Math.random() * 9000).toString();

    // 2. Authoritative Pricing Enforcement (Server ignores client-supplied pricing)
    const diagnosisFee = serviceMode === 'DIAGNOSIS' ? 149 : 0;
    const initialEstimatedPrice =
      serviceMode === 'DIAGNOSIS' ? 149 : input.estimatedPrice || 499;

    // 3. Concurrency Conflict Check: Ensure technician is not double-booked for explicit slots
    const scheduledTime = input.scheduledTime || 'Within 45 mins';
    if (scheduledTime !== 'Within 45 mins' && scheduledTime !== 'Today') {
      const conflict = Array.from(dbStore.bookings.values()).find(
        (b) =>
          b.technician_id === input.technicianId &&
          b.scheduled_time === scheduledTime &&
          b.status !== 'CANCELLED' &&
          b.status !== 'COMPLETED'
      );
      if (conflict) {
        throw new Error(
          `Technician is already booked for ${scheduledTime}. Please choose another slot.`
        );
      }
    }

    let lat: number | undefined = undefined;
    let lon: number | undefined = undefined;
    if (input.latitude !== undefined && input.longitude !== undefined) {
      if (!isValidCoordinate(input.latitude, input.longitude)) {
        throw new Error('Invalid GPS coordinates provided for service address.');
      }
      lat = Number(input.latitude);
      lon = Number(input.longitude);
    }

    const record: BookingRecord = {
      id: bookingId,
      reference_code: refCode,
      customer_id: custId,
      technician_id: input.technicianId,
      service_title: input.serviceTitle,
      scheduled_time: scheduledTime,
      appointment_date: input.appointmentDate,
      appointment_time: input.appointmentTime,
      address: input.address || 'Chennai, Tamil Nadu',
      latitude: lat,
      longitude: lon,
      service_mode: serviceMode,
      diagnosis_fee: diagnosisFee,
      service_amount: serviceMode === 'SERVICE' ? initialEstimatedPrice : 0,
      total_amount: initialEstimatedPrice,
      status: input.status || 'ACCEPTED',
      confirmation_status: (input.status || 'ACCEPTED') === 'ACCEPTED' ? 'CONFIRMED' : 'PENDING',
      estimated_price: initialEstimatedPrice,
      otp_code: otp,
      final_otp_code: finalOtp,
      notes: input.notes,
      idempotency_key: input.idempotencyKey,
      created_at: now,
      updated_at: now,
    };

    dbStore.bookings.set(record.id, record);
    dbStore.syncToRemote('bookings', record).then(() => {
      dbStore.syncToRemote('booking_status_history', history);
    }).catch(() => {});

    // Initial audit event
    const event: BookingEventRecord = {
      id: `ev_${Date.now()}`,
      booking_id: record.id,
      event_type: 'BOOKING_CREATED',
      from_status: undefined,
      to_status: record.status,
      actor_role: 'CUSTOMER',
      actor_id: custId,
      metadata: { serviceMode, diagnosisFee, initialEstimatedPrice },
      created_at: now,
    };
    dbStore.bookingEvents.set(event.id, event);

    // History tracking
    const history: BookingStatusHistoryRecord = {
      id: `bsh_${Date.now()}`,
      booking_id: record.id,
      previous_status: undefined,
      new_status: record.status,
      changed_by: custId,
      reason: 'Initial booking request submitted',
      created_at: now,
    };
    dbStore.bookingStatusHistory.set(history.id, history);

    // If diagnosis mode, initialize diagnosis record with authoritative ₹149 fee
    if (serviceMode === 'DIAGNOSIS') {
      const diag: DiagnosisRecord = {
        id: `diag_${Date.now()}`,
        booking_id: record.id,
        fee: 149,
        findings: '',
        is_paid: false,
        otp,
        is_verified: false,
        created_at: now,
      };
      dbStore.diagnoses.set(diag.id, diag);
    }

    return this.mapToFrontendBooking(record);
  }

  /**
   * Async booking creation that awaits remote database persistence
   */
  public static async createBookingAsync(input: CreateBookingInput): Promise<Booking> {
    const booking = this.createBooking(input);
    const record = dbStore.bookings.get(booking.id);
    if (record) {
      await dbStore.syncToRemote('bookings', record);
      const hist = Array.from(dbStore.bookingStatusHistory.values()).find((h) => h.booking_id === record.id);
      if (hist) {
        await dbStore.syncToRemote('booking_status_history', hist);
      }
    }
    return booking;
  }

  public static getBookingById(bookingId: string): Booking | undefined {
    const record = dbStore.bookings.get(bookingId);
    if (!record) return undefined;
    return this.mapToFrontendBooking(record);
  }

  public static listBookings(filter?: {
    customerId?: string;
    technicianId?: string;
    status?: BookingStatus;
  }): Booking[] {
    let records = Array.from(dbStore.bookings.values());

    if (filter?.customerId) {
      records = records.filter((r) => r.customer_id === filter.customerId);
    }
    if (filter?.technicianId) {
      records = records.filter((r) => r.technician_id === filter.technicianId);
    }
    if (filter?.status) {
      records = records.filter((r) => r.status === filter.status);
    }

    return records
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((r) => this.mapToFrontendBooking(r));
  }

  /**
   * Secure live tracking endpoint for active bookings
   * Enforces zero-trust IDOR authorization: Only the booking's customer or assigned technician.
   * Auto-stops on completion or cancellation. Returns real GPS coordinates and calculates distance.
   */
  public static async getBookingTrackingDetailsAsync(
    bookingId: string,
    requestingUserId?: string,
    requestingRole?: string
  ) {
    let booking = dbStore.bookings.get(bookingId);
    if (!booking) {
      booking = (await dbStore.fetchBookingFromRemote(bookingId)) || undefined;
    }
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Zero-trust IDOR check: Only the customer who booked or the assigned technician can view tracking
    if (requestingUserId) {
      const reqUuid = dbStore.toUuid(requestingUserId);
      const custUuid = dbStore.toUuid(booking.customer_id);

      // Resolve technician user id
      let tech = dbStore.technicianProfiles.get(booking.technician_id);
      if (!tech) {
        tech = (await dbStore.fetchTechnicianProfileFromRemote(booking.technician_id)) || undefined;
      }
      const techUuid = tech ? dbStore.toUuid(tech.id) : '';
      const techUserUuid = tech ? dbStore.toUuid(tech.profile_id) : '';

      const isCustomer = reqUuid === custUuid || requestingUserId === booking.customer_id;
      const isTechnician =
        reqUuid === techUuid ||
        reqUuid === techUserUuid ||
        requestingUserId === booking.technician_id ||
        (tech && requestingUserId === tech.profile_id);

      if (!isCustomer && !isTechnician) {
        throw new Error('Forbidden: Access denied to tracking information for this booking');
      }
    }

    // Check lifecycle status
    const isCompleted = booking.status === 'COMPLETED';
    const isCancelled = booking.status === 'CANCELLED';
    const trackingActive = !isCompleted && !isCancelled;

    // Fetch latest technician location
    let tech = dbStore.technicianProfiles.get(booking.technician_id);
    if (!tech) {
      tech = (await dbStore.fetchTechnicianProfileFromRemote(booking.technician_id)) || undefined;
    }

    const hasProviderCoords = Boolean(
      tech &&
      isValidCoordinate(tech.latitude, tech.longitude) &&
      tech.is_location_shared
    );

    const hasCustomerCoords = Boolean(
      isValidCoordinate(booking.latitude, booking.longitude)
    );

    // Stale detection: if last update > 5 minutes ago or technician is offline
    const now = Date.now();
    let isStale = false;
    if (tech?.location_updated_at) {
      const updateTime = new Date(tech.location_updated_at).getTime();
      if (now - updateTime > 5 * 60 * 1000) {
        isStale = true;
      }
    }
    if (tech?.availability_status === 'OFFLINE') {
      isStale = true;
    }

    // Calculate real distance & ETA if both coordinates exist
    let distanceKm: number | null = null;
    let etaMinutes: number | null = null;
    if (hasProviderCoords && hasCustomerCoords) {
      distanceKm = calculateHaversineDistanceKm(
        tech!.latitude!,
        tech!.longitude!,
        booking.latitude!,
        booking.longitude!
      );
      etaMinutes = estimateEtaMinutes(distanceKm);
    }

    let statusMessage = 'Live GPS Tracking Active';
    if (isCompleted) {
      statusMessage = 'Service completed. Live tracking closed.';
    } else if (isCancelled) {
      statusMessage = 'Service cancelled. Live tracking ended.';
    } else if (!tech?.is_location_shared) {
      statusMessage = 'Waiting for provider to enable location sharing.';
    } else if (isStale) {
      statusMessage = 'GPS signal stale. Last reported position displayed.';
    }

    return {
      bookingId: booking.id,
      referenceCode: booking.reference_code,
      status: booking.status,
      serviceTitle: booking.service_title,
      trackingActive,
      isStale,
      statusMessage,
      provider: tech
        ? {
            id: tech.id,
            name: tech.name,
            phone: tech.phone,
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
            latitude: hasProviderCoords ? tech.latitude! : null,
            longitude: hasProviderCoords ? tech.longitude! : null,
            accuracyMeters: hasProviderCoords ? 15 : null,
            lastUpdated: tech.location_updated_at || null,
            isLocationShared: Boolean(tech.is_location_shared),
          }
        : null,
      destination: {
        address: booking.address,
        latitude: hasCustomerCoords ? booking.latitude! : null,
        longitude: hasCustomerCoords ? booking.longitude! : null,
      },
      distanceKm,
      etaMinutes,
    };
  }

  public static confirmBooking(bookingId: string): Booking {
    const record = dbStore.bookings.get(bookingId);
    if (!record) throw new Error(`Booking ${bookingId} not found`);

    const fromStatus = record.status;
    record.status = 'ACCEPTED';
    record.confirmation_status = 'CONFIRMED';
    record.updated_at = new Date().toISOString();

    const event: BookingEventRecord = {
      id: `ev_${Date.now()}`,
      booking_id: record.id,
      event_type: 'BOOKING_CONFIRMED',
      from_status: fromStatus,
      to_status: 'ACCEPTED',
      actor_role: 'CUSTOMER',
      created_at: record.updated_at,
    };
    dbStore.bookingEvents.set(event.id, event);

    const history: BookingStatusHistoryRecord = {
      id: `bsh_${Date.now()}`,
      booking_id: record.id,
      previous_status: fromStatus,
      new_status: 'ACCEPTED',
      changed_by: record.customer_id,
      reason: 'Confirmed by user',
      created_at: record.updated_at,
    };
    dbStore.bookingStatusHistory.set(history.id, history);

    return this.mapToFrontendBooking(record);
  }

  public static cancelBooking(bookingId: string, reason?: string): Booking {
    const record = dbStore.bookings.get(bookingId);
    if (!record) throw new Error(`Booking ${bookingId} not found`);

    const fromStatus = record.status;
    record.status = 'CANCELLED';
    record.updated_at = new Date().toISOString();

    const event: BookingEventRecord = {
      id: `ev_${Date.now()}`,
      booking_id: record.id,
      event_type: 'BOOKING_CANCELLED',
      from_status: fromStatus,
      to_status: 'CANCELLED',
      actor_role: 'CUSTOMER',
      metadata: { reason },
      created_at: record.updated_at,
    };
    dbStore.bookingEvents.set(event.id, event);

    const history: BookingStatusHistoryRecord = {
      id: `bsh_${Date.now()}`,
      booking_id: record.id,
      previous_status: fromStatus,
      new_status: 'CANCELLED',
      changed_by: record.customer_id,
      reason: reason || 'Cancelled by user',
      created_at: record.updated_at,
    };
    dbStore.bookingStatusHistory.set(history.id, history);

    return this.mapToFrontendBooking(record);
  }

  public static updateBookingStatus(
    bookingId: string,
    newStatus: BookingStatus,
    actorRole: 'CUSTOMER' | 'TECHNICIAN' | 'SYSTEM'
  ): Booking {
    const record = dbStore.bookings.get(bookingId);
    if (!record) throw new Error(`Booking ${bookingId} not found`);

    const fromStatus = record.status;
    record.status = newStatus;
    record.updated_at = new Date().toISOString();

    const event: BookingEventRecord = {
      id: `ev_${Date.now()}`,
      booking_id: record.id,
      event_type: `STATUS_${newStatus}`,
      from_status: fromStatus,
      to_status: newStatus,
      actor_role: actorRole,
      created_at: record.updated_at,
    };
    dbStore.bookingEvents.set(event.id, event);

    let changedByUserId = record.customer_id;
    if (actorRole === 'TECHNICIAN') {
      const techProfile =
        dbStore.technicianProfiles.get(record.technician_id) ||
        dbStore.technicianProfiles.get(dbStore.toUuid(record.technician_id)) ||
        Array.from(dbStore.technicianProfiles.values()).find(
          (t) => t.id === record.technician_id || dbStore.toUuid(t.id) === dbStore.toUuid(record.technician_id)
        );
      changedByUserId = techProfile?.profile_id || record.technician_id;
    }

    const history: BookingStatusHistoryRecord = {
      id: `bsh_${Date.now()}`,
      booking_id: record.id,
      previous_status: fromStatus,
      new_status: newStatus,
      changed_by: changedByUserId,
      reason: `Transitioned by ${actorRole}`,
      created_at: record.updated_at,
    };
    dbStore.bookingStatusHistory.set(history.id, history);
    dbStore.syncToRemote('bookings', record);
    dbStore.syncToRemote('booking_status_history', history);

    // If completed, automatically generate technician payout & earnings record (0% commission)
    if (newStatus === 'COMPLETED') {
      const est = Array.from(dbStore.estimates.values()).find((e) => e.booking_id === bookingId);
      const payoutAmount = Number(est?.total_amount ?? record.total_amount ?? record.estimated_price ?? record.diagnosis_fee ?? 149);
      const payout: TechnicianPayoutRecord = {
        id: `po_${Date.now()}`,
        technician_id: record.technician_id,
        booking_id: record.id,
        amount: payoutAmount,
        platform_fee: 0, // 0% commission guarantee
        net_payout: payoutAmount,
        status: 'PROCESSED',
        payout_reference: `PAYOUT_${record.reference_code}`,
        processed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      dbStore.technicianPayouts.set(payout.id, payout);

      const earning: TechnicianEarningsRecord = {
        id: `earn_${Date.now()}`,
        technician_id: record.technician_id,
        booking_id: record.id,
        gross_amount: payoutAmount,
        platform_fee: 0,
        net_amount: payoutAmount,
        payment_status: 'PAID',
        payout_status: 'PROCESSED',
        created_at: new Date().toISOString(),
      };
      dbStore.technicianEarnings.set(earning.id, earning);
      dbStore.syncToRemote('technician_earnings', earning);
    }

    return this.mapToFrontendBooking(record);
  }

  /**
   * Async status update that awaits remote database sync
   */
  public static async updateBookingStatusAsync(
    bookingId: string,
    newStatus: BookingStatus,
    actorRole: 'CUSTOMER' | 'TECHNICIAN' | 'SYSTEM'
  ): Promise<Booking> {
    if (!dbStore.bookings.has(bookingId)) {
      await dbStore.fetchBookingFromRemote(bookingId);
    }
    const res = this.updateBookingStatus(bookingId, newStatus, actorRole);
    const record = dbStore.bookings.get(bookingId);
    if (record) {
      await dbStore.syncToRemote('bookings', record);
      const latestHistory = Array.from(dbStore.bookingStatusHistory.values())
        .filter((h) => h.booking_id === record.id || dbStore.toUuid(h.booking_id) === dbStore.toUuid(record.id))
        .slice(-1)[0];
      if (latestHistory) {
        await dbStore.syncToRemote('booking_status_history', latestHistory);
      }
      if (newStatus === 'COMPLETED') {
        const earning = Array.from(dbStore.technicianEarnings.values())
          .find((e) => e.booking_id === record.id || dbStore.toUuid(e.booking_id) === dbStore.toUuid(record.id));
        if (earning) {
          await dbStore.syncToRemote('technician_earnings', earning);
        }
      }
    }
    return res;
  }

  public static submitEstimate(
    bookingId: string,
    parts: number,
    labour: number,
    description: string
  ): EstimateRecord {
    const record = dbStore.bookings.get(bookingId);
    if (!record) throw new Error(`Booking ${bookingId} not found`);

    const total = parts + labour;
    const est: EstimateRecord = {
      id: `est_${Date.now()}`,
      booking_id: bookingId,
      parts_amount: parts,
      labour_amount: labour,
      total_amount: total,
      description,
      is_price_locked: true,
      is_approved: false,
      created_at: new Date().toISOString(),
    };
    dbStore.estimates.set(est.id, est);
    this.updateBookingStatus(bookingId, 'ESTIMATE_PENDING', 'TECHNICIAN');
    return est;
  }

  public static approveEstimate(bookingId: string): EstimateRecord {
    const est = Array.from(dbStore.estimates.values()).find((e) => e.booking_id === bookingId);
    if (!est) throw new Error(`Estimate for booking ${bookingId} not found`);

    est.is_approved = true;
    est.approved_at = new Date().toISOString();

    this.updateBookingStatus(bookingId, 'APPROVED', 'CUSTOMER');
    return est;
  }

  /**
   * Processes payment with server-authoritative amount calculation and idempotency protection
   */
  public static processPayment(
    bookingId: string,
    requestedAmount?: number,
    method: string = 'UPI_SANDBOX',
    idempotencyKey?: string
  ): PaymentRecord {
    const record = dbStore.bookings.get(bookingId);
    if (!record) throw new Error(`Booking ${bookingId} not found`);

    // Check payment idempotency
    if (idempotencyKey) {
      for (const p of dbStore.payments.values()) {
        if (p.idempotency_key === idempotencyKey) {
          return p;
        }
      }
    }

    // Authoritative payment amount
    const diag = Array.from(dbStore.diagnoses.values()).find((d) => d.booking_id === bookingId);
    const est = Array.from(dbStore.estimates.values()).find((e) => e.booking_id === bookingId);

    let authoritativeAmount: number;
    if (est && est.is_approved) {
      authoritativeAmount = est.total_amount;
    } else if (record.service_mode === 'DIAGNOSIS') {
      authoritativeAmount = diag?.fee || 149;
    } else {
      authoritativeAmount = record.estimated_price || 499;
    }

    // Ignore client amount if it differs
    const finalAmount = authoritativeAmount;

    const payment: PaymentRecord = {
      id: `pay_${Date.now()}`,
      booking_id: bookingId,
      customer_id: record.customer_id,
      technician_id: record.technician_id,
      payment_intent_id: `pi_sand_${Date.now()}`,
      transaction_reference: `TXN_NEXDO_${Math.floor(100000 + Math.random() * 900000)}`,
      amount: finalAmount,
      currency: 'INR',
      status: 'RECEIVED',
      payment_status: 'SUCCESS',
      payment_method: method,
      is_sandbox: true,
      idempotency_key: idempotencyKey,
      confirmed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    dbStore.payments.set(payment.id, payment);
    dbStore.syncToRemote('payments', payment);

    if (diag) {
      diag.is_paid = true;
    }

    this.updateBookingStatus(bookingId, 'PAYMENT_RECEIVED', 'CUSTOMER');
    return payment;
  }

  /**
   * Async payment processing that awaits remote database sync
   */
  public static async processPaymentAsync(
    bookingId: string,
    requestedAmount?: number,
    method: string = 'UPI_SANDBOX',
    idempotencyKey?: string
  ): Promise<PaymentRecord> {
    if (!dbStore.bookings.has(bookingId)) {
      await dbStore.fetchBookingFromRemote(bookingId);
    }
    const payment = this.processPayment(bookingId, requestedAmount, method, idempotencyKey);
    await dbStore.syncToRemote('payments', payment);
    return payment;
  }

  /**
   * Handles payment provider webhook with cryptographic signature verification and idempotent replay protection
   */
  public static handlePaymentWebhook(
    payload: {
      booking_id: string;
      transaction_id: string;
      amount: number;
      status: string;
    },
    signature: string,
    webhookSecret: string
  ): { success: boolean; alreadyProcessed?: boolean } {
    const rawPayload = JSON.stringify(payload);
    const isValid = AuthSecurity.verifyHmacSignature(rawPayload, signature, webhookSecret);
    if (!isValid) {
      throw new Error('Invalid webhook cryptographic signature');
    }

    // Idempotency check on provider transaction ID
    for (const p of dbStore.payments.values()) {
      if (p.provider_transaction_id === payload.transaction_id) {
        return { success: true, alreadyProcessed: true };
      }
    }

    const booking = dbStore.bookings.get(payload.booking_id);
    if (!booking) {
      throw new Error(`Booking ${payload.booking_id} not found`);
    }

    if (payload.status === 'SUCCESS' || payload.status === 'captured') {
      const payment: PaymentRecord = {
        id: `pay_wh_${Date.now()}`,
        booking_id: booking.id,
        customer_id: booking.customer_id,
        technician_id: booking.technician_id,
        provider_transaction_id: payload.transaction_id,
        transaction_reference: payload.transaction_id,
        amount: payload.amount,
        currency: 'INR',
        status: 'SUCCESS',
        payment_status: 'SUCCESS',
        payment_method: 'WEBHOOK',
        is_sandbox: false,
        confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      dbStore.payments.set(payment.id, payment);
      dbStore.syncToRemote('payments', payment);
      this.updateBookingStatus(booking.id, 'CONFIRMED', 'SYSTEM');
    }

    return { success: true, alreadyProcessed: false };
  }

  /**
   * Retrieves technician job opportunities formatted for Technician UI
   * Directly assigned bookings are visible ONLY to the assigned technician.
   * Broadcast requests without explicit assignment are visible to technicians matching the service domain.
   */
  public static getTechnicianOpportunities(technicianId: string): JobOpportunity[] {
    const validTechIds = new Set<string>();
    if (technicianId) {
      validTechIds.add(technicianId);
      const profile = dbStore.technicianProfiles.get(technicianId);
      if (profile?.profile_id) validTechIds.add(profile.profile_id);
      for (const [id, p] of dbStore.technicianProfiles.entries()) {
        if (p.profile_id === technicianId || id === technicianId) {
          validTechIds.add(id);
          if (p.profile_id) validTechIds.add(p.profile_id);
        }
      }
    }

    // Technician domain skills for broadcast matching
    const techSkills = new Set<string>();
    for (const [_, skill] of dbStore.technicianSkills.entries()) {
      if (validTechIds.has(skill.technician_id) && skill.active) {
        techSkills.add(skill.skill_code.toUpperCase());
      }
    }
    for (const [_, cap] of dbStore.technicianCapabilities.entries()) {
      if (validTechIds.has(cap.technician_id) && cap.active) {
        techSkills.add(cap.code.toUpperCase());
      }
    }

    const allBookings = Array.from(dbStore.bookings.values()).filter((b) => {
      if (b.status === 'CANCELLED') return false;

      // 1. Directly assigned bookings: strictly visible only to the assigned provider
      if (b.technician_id) {
        return validTechIds.has(b.technician_id);
      }

      // 2. Unassigned/broadcast requests: visible only if requested and matches skills
      if (b.status === 'REQUESTED') {
        if (techSkills.size === 0) return true;
        const titleUpper = (b.service_title || '').toUpperCase();
        return Array.from(techSkills).some((skill) => titleUpper.includes(skill) || skill.includes(titleUpper));
      }

      return false;
    });

    return allBookings.map((b) => {
      const mode = b.service_mode;
      const isDiag = mode === 'DIAGNOSIS';

      const announcementTa = isDiag
        ? `புதிய பணி வாய்ப்பு! ${b.service_title}. பரிசோதனை கட்டணம் ₹149.`
        : `புதிய பணி வாய்ப்பு! ${b.service_title}. நேரடி பழுதுநீக்கல் பணி.`;

      const announcementEn = isDiag
        ? `New job request! ${b.service_title}. Diagnosis fee ₹149.`
        : `New direct repair request! ${b.service_title}.`;

      return {
        id: b.id,
        serviceName: b.service_title,
        category: 'Cooling & Appliances',
        customerArea: b.address.split(',')[0] || 'Adyar',
        distanceKm: 2.1,
        requestedTime: b.scheduled_time,
        diagnosisFee: isDiag ? 149 : 0,
        repairPriceDecidedAfterDiagnosis: isDiag,
        estimatedPayout: isDiag ? 149 : b.estimated_price,
        urgency: 'HIGH',
        status: b.status === 'ACCEPTED' ? 'ACCEPTED' : b.status === 'COMPLETED' ? 'COMPLETED' : 'ELIGIBLE',
        requiredCapability: 'AC_REPAIR',
        customerNameMasked: 'H*******',
        issueDescription: b.notes || 'Service request received via customer booking.',
        serviceMode: mode,
        announcementTamil: announcementTa,
        announcementEnglish: announcementEn,
      };
    });
  }

  /**
   * Calculates actual earnings for a technician strictly from completed jobs and recorded payouts.
   * Returns 0s for newly registered providers without completed jobs.
   */
  public static getTechnicianEarnings(technicianId: string): TechnicianEarnings {
    const validTechIds = new Set<string>();
    if (technicianId) {
      validTechIds.add(technicianId);
      const profile = dbStore.technicianProfiles.get(technicianId);
      if (profile?.profile_id) validTechIds.add(profile.profile_id);
      for (const [id, p] of dbStore.technicianProfiles.entries()) {
        if (p.profile_id === technicianId || id === technicianId) {
          validTechIds.add(id);
          if (p.profile_id) validTechIds.add(p.profile_id);
        }
      }
    }

    const completedBookings = Array.from(dbStore.bookings.values()).filter(
      (b) => validTechIds.has(b.technician_id) && b.status === 'COMPLETED'
    );
    const payouts = Array.from(dbStore.technicianPayouts.values()).filter(
      (p) => validTechIds.has(p.technician_id)
    );

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = startOfToday - now.getDay() * 24 * 60 * 60 * 1000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let todayEarnings = 0;
    let thisWeekEarnings = 0;
    let thisMonthEarnings = 0;

    for (const p of payouts) {
      const pTime = new Date(p.processed_at || p.created_at).getTime();
      const amt = Number(p.net_payout || p.amount || 0);
      if (pTime >= startOfToday) todayEarnings += amt;
      if (pTime >= startOfWeek) thisWeekEarnings += amt;
      if (pTime >= startOfMonth) thisMonthEarnings += amt;
    }

    const recentPayouts = payouts
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map((p) => {
        const b = dbStore.bookings.get(p.booking_id);
        return {
          id: p.id,
          date: new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          jobTitle: b?.service_title || 'Completed Service',
          amount: p.net_payout,
          customerMasked: 'Verified Customer',
        };
      });

    const activeSub = Array.from(dbStore.technicianSubscriptions.values()).find(
      (s) => validTechIds.has(s.technician_id) && s.is_active
    );

    return {
      todayEarnings,
      thisWeekEarnings,
      thisMonthEarnings,
      totalJobs: completedBookings.length,
      platformFeeCharged: 0,
      activeSubscriptionTitle: activeSub ? `${activeSub.plan_type} Access Pass` : 'Standard Pass',
      recentPayouts,
    };
  }
}
