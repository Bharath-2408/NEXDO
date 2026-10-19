// ============================================================================
// NEXDO CLIENT API SDK
// Clean typed API client connecting the Frontend UI to Backend Endpoints
// ============================================================================

import { handleNexdoApiRequest } from '../backend/router';
import { Booking, MatchedProvider } from '../types/customer';
import { JobOpportunity, TechnicianEarnings } from '../types/technician';
import { ServiceCategoryRecord, SubscriptionPlanRecord } from '../backend/database/types';

let inMemorySessionToken: string | null = null;

export function setClientSessionToken(token: string | null) {
  inMemorySessionToken = token;
}

export function getClientSessionToken(): string | null {
  return inMemorySessionToken;
}

async function callApi<T>(method: string, endpoint: string, body?: any, customHeaders?: Record<string, string>): Promise<T> {
  const token = getClientSessionToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(customHeaders || {}),
  };

  // 1. In browser with network available, make real HTTP fetch with cookie credentials
  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    let res: Response;
    try {
      res = await fetch(endpoint, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
      });
    } catch (networkErr: any) {
      if (endpoint.startsWith('/api/auth/')) {
        throw new Error('Authentication server or database is unavailable. Please check your connection.');
      }
      throw new Error(networkErr?.message || 'Network request failed');
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err: any = new Error(data?.error || `API error ${res.status}`);
      err.status = res.status;
      err.retryAfterSeconds = data?.retryAfterSeconds;
      throw err;
    }
    return data as T;
  }

  // 2. Direct Backend Router Execution (Node test runners, direct invocation)
  const response = await handleNexdoApiRequest({
    method,
    url: endpoint,
    body,
    headers,
  });

  if (response.status >= 400) {
    const err: any = new Error(response.body?.error || `API error ${response.status}`);
    err.status = response.status;
    err.retryAfterSeconds = response.body?.retryAfterSeconds;
    throw err;
  }

  return response.body as T;
}

export const nexdoApi = {
  auth: {
    register: async (data: {
      phone: string;
      username?: string;
      password: string;
      confirmPassword?: string;
      firstName?: string;
      lastName?: string;
      name?: string;
      role?: 'CUSTOMER' | 'TECHNICIAN';
      email?: string;
      serviceArea?: string;
      serviceDomains?: string[];
    }) => {
      const res = await callApi<{ user: any; sessionToken: string; profile: any }>(
        'POST',
        '/api/auth/register',
        data
      );
      if (res.sessionToken) {
        setClientSessionToken(res.sessionToken);
      }
      return res;
    },

    login: async (data: {
      identifier?: string;
      phone?: string;
      email?: string;
      username?: string;
      loginMethod?: 'mobile' | 'email' | 'username' | 'auto';
      expectedRole?: 'CUSTOMER' | 'TECHNICIAN';
      password: string;
    }) => {
      const res = await callApi<{ user: any; sessionToken: string; profile: any }>(
        'POST',
        '/api/auth/login',
        data
      );
      if (res.sessionToken) {
        setClientSessionToken(res.sessionToken);
      }
      return res;
    },

    logout: async () => {
      const res = await callApi<{ success: boolean }>('POST', '/api/auth/logout');
      setClientSessionToken(null);
      return res;
    },

    me: async () => {
      const res = await callApi<{ user: any; profile: any }>('GET', '/api/auth/me');
      return res;
    },

    forgotPassword: async (input: { email?: string; phone?: string } | string) => {
      const payload = typeof input === 'string'
        ? input.includes('@') ? { email: input } : { phone: input }
        : input;
      return callApi<{
        success: boolean;
        message: string;
        resetToken?: string;
        emailDelivery?: 'SENT' | 'NOT_CONFIGURED' | 'FAILED' | 'SUPPRESSED';
        providerError?: string;
      }>('POST', '/api/auth/forgot-password', payload);
    },

    verifyOtp: async (data: { email?: string; phone?: string; otp: string }) => {
      return callApi<{ success: boolean; resetToken: string }>('POST', '/api/auth/verify-otp', data);
    },

    resetPassword: async (tokenOrPayload: string | { token: string; password: string }, password?: string) => {
      const payload = typeof tokenOrPayload === 'string'
        ? { token: tokenOrPayload, password: password || '' }
        : tokenOrPayload;
      return callApi<{ success: boolean }>('POST', '/api/auth/reset-password', payload);
    },
  },

  voice: {
    interpret: async (payload: {
      text: string;
      sessionToken?: string;
      role?: 'customer' | 'technician';
      currentRoute?: string;
      conversationLanguage?: string;
      context?: Record<string, any>;
    }) => {
      return callApi<{
        intent: string;
        action: { type: string; payload: any; source: string; timestamp: number };
        language: 'ta' | 'en';
        message: string;
        response: string;
        confidence: number;
        requires_confirmation: boolean;
        requiresConfirmation: boolean;
        navigation_target?: string;
        entities: Record<string, any>;
        data?: any;
      }>('POST', '/api/voice/interpret', payload);
    },
  },

  services: {
    list: async () => {
      const res = await callApi<{ services: ServiceCategoryRecord[] }>('GET', '/api/services');
      return res.services;
    },
  },

  serviceRequests: {
    create: async (data: {
      customerId?: string;
      serviceCode: string;
      rawTranscript: string;
      urgency?: 'NORMAL' | 'URGENT' | 'SCHEDULED';
      preferredTime?: string;
      location?: string;
      specificIssue?: string;
      serviceMode?: 'DIAGNOSIS' | 'SERVICE';
    }) => {
      return callApi<{ serviceRequest: any; matchedTechnicians: MatchedProvider[] }>(
        'POST',
        '/api/service-requests',
        data
      );
    },
  },

  technicians: {
    search: async (params?: { serviceCode?: string; area?: string; serviceMode?: 'DIAGNOSIS' | 'SERVICE'; latitude?: number; longitude?: number; radiusKm?: number }) => {
      const query = new URLSearchParams();
      if (params?.serviceCode) query.set('serviceCode', params.serviceCode);
      if (params?.area) query.set('area', params.area);
      if (params?.serviceMode) query.set('serviceMode', params.serviceMode);
      if (params?.latitude !== undefined) query.set('lat', params.latitude.toString());
      if (params?.longitude !== undefined) query.set('lng', params.longitude.toString());
      if (params?.radiusKm !== undefined) query.set('radiusKm', params.radiusKm.toString());

      const res = await callApi<{ technicians: MatchedProvider[] }>(
        'GET',
        `/api/technicians/search?${query.toString()}`
      );
      return res.technicians;
    },

    searchNearby: async (params: { latitude: number; longitude: number; radiusKm?: number; serviceCode?: string }) => {
      const query = new URLSearchParams();
      query.set('lat', params.latitude.toString());
      query.set('lng', params.longitude.toString());
      if (params.radiusKm) query.set('radiusKm', params.radiusKm.toString());
      if (params.serviceCode) query.set('serviceCode', params.serviceCode);

      const res = await callApi<{ technicians: MatchedProvider[] }>(
        'GET',
        `/api/technicians/nearby?${query.toString()}`
      );
      return res.technicians;
    },

    updateLocation: async (data: {
      latitude: number;
      longitude: number;
      accuracy?: number | null;
      speed?: number | null;
      heading?: number | null;
    }) => {
      return callApi<{ success: boolean; recordedAt: string; latitude: number; longitude: number }>(
        'POST',
        '/api/technician/location',
        data
      );
    },

    toggleLocationSharing: async (enabled: boolean) => {
      return callApi<{ success: boolean; isLocationShared: boolean }>(
        'POST',
        '/api/technician/location/toggle',
        { enabled }
      );
    },

    getById: async (id: string) => {
      const res = await callApi<{ technicians: MatchedProvider[] }>(
        'GET',
        `/api/technicians/search`
      );
      return res.technicians.find((t) => t.id === id);
    },

    setOnline: async (technicianId?: string) => {
      return callApi<{ technician: any }>('POST', '/api/technician/online', { technicianId });
    },

    setOffline: async (technicianId?: string) => {
      return callApi<{ technician: any }>('POST', '/api/technician/offline', { technicianId });
    },

    heartbeat: async (technicianId?: string) => {
      return callApi<{ status: 'ONLINE' | 'OFFLINE'; lastSeenAt: string }>(
        'POST',
        '/api/technician/heartbeat',
        { technicianId }
      );
    },
  },

  bookings: {
    list: async (params?: { customerId?: string; technicianId?: string; status?: string }) => {
      const query = new URLSearchParams();
      if (params?.customerId) query.set('customerId', params.customerId);
      if (params?.technicianId) query.set('technicianId', params.technicianId);
      if (params?.status) query.set('status', params.status);

      const res = await callApi<{ bookings: Booking[] }>('GET', `/api/bookings?${query.toString()}`);
      return res.bookings;
    },

    getById: async (id: string) => {
      const res = await callApi<{ booking: Booking }>('GET', `/api/bookings/${id}`);
      return res.booking;
    },

    getTracking: async (id: string) => {
      const res = await callApi<{ tracking: any }>('GET', `/api/bookings/${id}/tracking`);
      return res.tracking;
    },

    create: async (data: {
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
      status?: string;
    }) => {
      const res = await callApi<{ booking: Booking }>('POST', '/api/bookings', data, {
        ...(data.idempotencyKey ? { 'X-Idempotency-Key': data.idempotencyKey } : {}),
      });
      return res.booking;
    },

    confirm: async (id: string) => {
      const res = await callApi<{ booking: Booking }>('POST', `/api/bookings/${id}/confirm`);
      return res.booking;
    },

    cancel: async (id: string, reason?: string) => {
      const res = await callApi<{ booking: Booking }>('POST', `/api/bookings/${id}/cancel`, {
        reason,
      });
      return res.booking;
    },
  },

  technician: {
    getJobs: async (technicianId?: string) => {
      const query = technicianId ? `?technicianId=${technicianId}` : '';
      const res = await callApi<{ jobs: JobOpportunity[] }>(
        'GET',
        `/api/technician/jobs${query}`
      );
      return res.jobs;
    },

    acceptJob: async (jobId: string) => {
      const res = await callApi<{ job: Booking }>(
        'POST',
        `/api/technician/jobs/${jobId}/accept`
      );
      return res.job;
    },

    markArrived: async (jobId: string) => {
      const res = await callApi<{ job: Booking }>(
        'POST',
        `/api/technician/jobs/${jobId}/arrive`
      );
      return res.job;
    },

    startWork: async (jobId: string) => {
      const res = await callApi<{ job: Booking }>(
        'POST',
        `/api/technician/jobs/${jobId}/start`
      );
      return res.job;
    },

    completeWork: async (jobId: string) => {
      const res = await callApi<{ job: Booking }>(
        'POST',
        `/api/technician/jobs/${jobId}/complete`
      );
      return res.job;
    },

    completeJob: async (jobId: string) => {
      const res = await callApi<{ job: Booking }>(
        'POST',
        `/api/technician/jobs/${jobId}/complete`
      );
      return res.job;
    },

    getEarnings: async (technicianId?: string) => {
      const query = technicianId ? `?technicianId=${technicianId}` : '';
      const res = await callApi<{ earnings: TechnicianEarnings }>(
        'GET',
        `/api/technician/earnings${query}`
      );
      return res.earnings;
    },
  },

  subscriptions: {
    list: async () => {
      const res = await callApi<{ plans: SubscriptionPlanRecord[] }>('GET', '/api/subscriptions');
      return res.plans;
    },

    activate: async (technicianId: string, tier: 'DAILY' | 'WEEKLY' | 'MONTHLY') => {
      const res = await callApi<{ subscription: any }>('POST', '/api/subscriptions', {
        technicianId,
        tier,
      });
      return res.subscription;
    },
  },

  payments: {
    createIntent: async (bookingId: string, amount: number, method?: string, idempotencyKey?: string) => {
      const res = await callApi<{ payment: any }>('POST', '/api/payments/create-intent', {
        bookingId,
        amount,
        method,
        idempotencyKey,
      });
      return res.payment;
    },

    sendWebhook: async (
      payload: { booking_id: string; transaction_id: string; amount: number; status: string },
      signature: string
    ) => {
      return callApi<{ success: boolean; alreadyProcessed?: boolean }>(
        'POST',
        '/api/payments/webhook',
        payload,
        { 'X-Signature': signature }
      );
    },
  },

  health: {
    database: async () => {
      return callApi<{ database: string; environment: string; timestamp: string }>(
        'GET',
        '/api/health/database'
      );
    },
  },
};
