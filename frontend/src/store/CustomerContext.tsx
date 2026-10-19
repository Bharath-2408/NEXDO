import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ServiceNeed,
  MatchedProvider,
  Booking,
  BookingStatus,
  ServiceMode,
} from '../types/customer';
import { nexdoApi } from '../api/nexdoApi';
import { useApp } from './AppContext';

const ORDERED_STATUS_FLOW: BookingStatus[] = [
  'REQUESTED',
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
];

interface CustomerContextType {
  activeNeed: ServiceNeed | null;
  matchedProviders: MatchedProvider[];
  selectedProvider: MatchedProvider | null;
  isLoadingProviders: boolean;
  providersError: string | null;
  fetchProviders: (serviceCode?: string, area?: string, latitude?: number, longitude?: number, radiusKm?: number) => Promise<void>;
  fetchNearbyProviders: (latitude: number, longitude: number, radiusKm?: number, serviceCode?: string) => Promise<void>;
  bookings: Booking[];
  activeBooking: Booking | null;
  setActiveNeed: (need: ServiceNeed | null) => void;
  selectProvider: (provider: MatchedProvider | null) => void;
  getProviderById: (id: string) => MatchedProvider | undefined;
  createBooking: (
    providerId: string,
    scheduledTime: string,
    address: string,
    notes?: string,
    serviceMode?: ServiceMode,
    latitude?: number,
    longitude?: number
  ) => Booking;
  cancelBooking: (bookingId: string) => void;
  updateBookingReview: (bookingId: string, rating: number, comment: string, tags: string[]) => void;
  advanceBookingStatus: (bookingId: string, targetStatus?: BookingStatus) => void;
  payDiagnosisFee: (bookingId: string) => void;
  verifyDiagnosisOtp: (bookingId: string, otp: string) => boolean;
  submitEstimate: (bookingId: string, parts: number, labour: number, description: string) => void;
  approveEstimate: (bookingId: string) => void;
  startWork: (bookingId: string) => void;
  completeWork: (bookingId: string) => void;
  processPayment: (bookingId: string, method?: string) => void;
  verifyFinalOtp: (bookingId: string, otp: string) => boolean;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useApp();
  const [activeNeed, setActiveNeedState] = useState<ServiceNeed | null>(null);
  const [matchedProviders, setMatchedProviders] = useState<MatchedProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<MatchedProvider | null>(null);
  const [isLoadingProviders, setIsLoadingProviders] = useState<boolean>(false);
  const [providersError, setProvidersError] = useState<string | null>(null);

  // Initialize bookings with local storage sync fallback
  const [bookings, setBookings] = useState<Booking[]>(() => {
    try {
      const saved = localStorage.getItem('nexdo_bookings');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [];
  });

  const fetchProviders = async (serviceCode?: string, area?: string, latitude?: number, longitude?: number, radiusKm?: number) => {
    setIsLoadingProviders(true);
    setProvidersError(null);
    try {
      const res = await nexdoApi.technicians.search({ serviceCode, area, latitude, longitude, radiusKm });
      const providersList = res || [];
      setMatchedProviders(providersList);
      if (providersList.length > 0) {
        setSelectedProvider(providersList[0]);
      } else {
        setSelectedProvider(null);
      }
    } catch (err: any) {
      setProvidersError(err?.message || 'Failed to load service providers');
      setMatchedProviders([]);
      setSelectedProvider(null);
    } finally {
      setIsLoadingProviders(false);
    }
  };

  const fetchNearbyProviders = async (latitude: number, longitude: number, radiusKm?: number, serviceCode?: string) => {
    setIsLoadingProviders(true);
    setProvidersError(null);
    try {
      const res = await nexdoApi.technicians.searchNearby({ latitude, longitude, radiusKm, serviceCode });
      const providersList = res || [];
      setMatchedProviders(providersList);
      if (providersList.length > 0) {
        setSelectedProvider(providersList[0]);
      } else {
        setSelectedProvider(null);
      }
    } catch (err: any) {
      setProvidersError(err?.message || 'Failed to load nearby service providers');
      setMatchedProviders([]);
      setSelectedProvider(null);
    } finally {
      setIsLoadingProviders(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  // Sync bookings changes to localStorage and dispatch custom event
  const persistBookings = (newBookings: Booking[]) => {
    setBookings(newBookings);
    try {
      localStorage.setItem('nexdo_bookings', JSON.stringify(newBookings));
      window.dispatchEvent(new CustomEvent('nexdo_booking_sync', { detail: newBookings }));
    } catch {
      // Ignore storage errors
    }
  };

  // Listen to cross-context sync events (e.g. from technician actions)
  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<Booking[]>;
      if (customEvent.detail) {
        setBookings(customEvent.detail);
      }
    };
    window.addEventListener('nexdo_booking_sync', handleSync);

    // Initial load from backend API
    nexdoApi.bookings
      .list()
      .then((backendBookings) => {
        if (backendBookings && backendBookings.length > 0) {
          setBookings(backendBookings);
        }
      })
      .catch(() => {});

    return () => window.removeEventListener('nexdo_booking_sync', handleSync);
  }, []);

  const setActiveNeed = (need: ServiceNeed | null) => {
    setActiveNeedState(need);
    if (!need) {
      fetchProviders();
      return;
    }
    const code = need.canonicalService || need.normalizedService;
    fetchProviders(code, need.location);
  };

  const activeBooking =
    bookings.find((b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED') || null;

  const selectProvider = (provider: MatchedProvider | null) => {
    setSelectedProvider(provider);
  };

  const getProviderById = (id: string) => {
    return matchedProviders.find((p) => p.id === id);
  };

  const createBooking = (
    providerId: string,
    scheduledTime: string,
    address: string,
    notes?: string,
    serviceMode: ServiceMode = 'DIAGNOSIS',
    latitude?: number,
    longitude?: number
  ): Booking => {
    const provider = getProviderById(providerId) || selectedProvider;
    if (!provider) {
      throw new Error('Please select a valid service provider to book.');
    }
    const effectiveCustomerId = user?.id || 'usr_nexdo_001';
    const effectiveCustomerName = user?.name || 'Customer';
    const effectiveCustomerPhone = user?.phone || '9876543210';
    const bookingId = `bk_${Date.now()}`;
    const refCode = `NXD-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date().toISOString();
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const newBooking: Booking = {
      id: bookingId,
      referenceCode: refCode,
      customerId: effectiveCustomerId,
      customerName: effectiveCustomerName,
      customerPhone: effectiveCustomerPhone,
      provider,
      serviceTitle: activeNeed?.normalizedService || `${provider.primaryCapability} Service`,
      scheduledTime: scheduledTime || 'Today · In 45 mins',
      address: address || '42, Sengunthapuram 3rd Cross, Karur, TN 639002',
      latitude,
      longitude,
      status: 'REQUESTED',
      estimatedPrice: serviceMode === 'SERVICE' ? (provider.estimatedPrice || 499) : (provider.diagnosisFee || 149),
      otpCode: otp,
      createdAt: now,
      serviceMode,
      notes,
      diagnosis:
        serviceMode === 'SERVICE'
          ? undefined
          : {
              fee: 149,
              findings: '',
              isPaid: false,
              otp,
              isVerified: false,
            },
      estimate: {
        parts: 0,
        labour: serviceMode === 'SERVICE' ? (provider.estimatedPrice || 499) : 0,
        total: serviceMode === 'SERVICE' ? (provider.estimatedPrice || 499) : 149,
        description: 'Capacitor 45/5 MFD replacement and electrical contact check',
        isApproved: false,
        isPriceLocked: false,
      },
      payment: {
        status: 'PENDING',
        amount: 1100,
        transactionId: `TXN_${Date.now()}`,
        qrCodeData: `NEXDO_TXN_${Date.now()}_AMT1100`,
        isSandbox: true,
      },
      finalOtp: {
        code: Math.floor(1000 + Math.random() * 9000).toString(),
        isVerified: false,
      },
    };

    // Asynchronously sync with backend source of truth
    nexdoApi.bookings
      .create({
        customerId: effectiveCustomerId,
        technicianId: provider.id,
        serviceTitle: newBooking.serviceTitle,
        scheduledTime: newBooking.scheduledTime,
        address: newBooking.address,
        latitude,
        longitude,
        serviceMode,
        status: 'REQUESTED',
        notes,
      })
      .then((saved) => {
        if (saved && saved.id) {
          setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...saved, provider } : b)));
        }
      })
      .catch(() => {});

    persistBookings([newBooking, ...bookings]);
    return newBooking;
  };

  const cancelBooking = (bookingId: string) => {
    nexdoApi.bookings.cancel(bookingId).catch(() => {});
    persistBookings(
      bookings.map((b) => (b.id === bookingId ? { ...b, status: 'CANCELLED' as BookingStatus } : b))
    );
  };

  const updateBookingReview = (
    bookingId: string,
    rating: number,
    comment: string,
    tags: string[]
  ) => {
    persistBookings(
      bookings.map((b) =>
        b.id === bookingId ? { ...b, review: { rating, comment, tags } } : b
      )
    );
  };

  const advanceBookingStatus = (bookingId: string, targetStatus?: BookingStatus) => {
    persistBookings(
      bookings.map((b) => {
        if (b.id !== bookingId) return b;
        if (targetStatus) {
          return { ...b, status: targetStatus };
        }
        const currentIdx = ORDERED_STATUS_FLOW.indexOf(b.status);
        if (currentIdx >= 0 && currentIdx < ORDERED_STATUS_FLOW.length - 1) {
          return { ...b, status: ORDERED_STATUS_FLOW[currentIdx + 1] };
        }
        return b;
      })
    );
  };

  // 1. Pay ₹149 Diagnosis Fee
  const payDiagnosisFee = (bookingId: string) => {
    persistBookings(
      bookings.map((b) => {
        if (b.id !== bookingId) return b;
        return {
          ...b,
          status: 'DIAGNOSING',
          diagnosis: {
            fee: 149,
            findings: b.diagnosis?.findings || 'Capacitor failure detected. Motor coil and compressor pressure verified.',
            isPaid: true,
            otp: b.diagnosis?.otp || '4821',
            isVerified: false,
            diagnosedAt: new Date().toISOString(),
          },
        };
      })
    );
  };

  // 2. Verify Diagnosis Completion OTP (entered by technician)
  const verifyDiagnosisOtp = (bookingId: string, otp: string): boolean => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return false;
    const expectedOtp = target.diagnosis?.otp || target.otpCode;
    if (otp.trim() === expectedOtp.trim()) {
      persistBookings(
        bookings.map((b) => {
          if (b.id !== bookingId) return b;
          return {
            ...b,
            status: 'ESTIMATE_PENDING',
            diagnosis: {
              ...(b.diagnosis || { fee: 149, isPaid: true, otp }),
              isVerified: true,
            },
          };
        })
      );
      return true;
    }
    return false;
  };

  // 3. Technician submits itemized estimate (parts ₹700 + labour ₹400 = ₹1,100)
  const submitEstimate = (
    bookingId: string,
    parts: number,
    labour: number,
    description: string
  ) => {
    persistBookings(
      bookings.map((b) => {
        if (b.id !== bookingId) return b;
        return {
          ...b,
          status: 'ESTIMATE_PENDING',
          estimate: {
            parts,
            labour,
            total: parts + labour,
            description,
            isApproved: false,
            isPriceLocked: false,
          },
          estimatedPrice: parts + labour,
        };
      })
    );
  };

  // 4. Customer approves estimate -> PRICE LOCKED
  const approveEstimate = (bookingId: string) => {
    persistBookings(
      bookings.map((b) => {
        if (b.id !== bookingId) return b;
        return {
          ...b,
          status: 'APPROVED',
          estimate: {
            parts: b.estimate?.parts ?? 700,
            labour: b.estimate?.labour ?? 400,
            total: b.estimate?.total ?? 1100,
            description: b.estimate?.description ?? 'Dual Run Capacitor replacement and safety load testing',
            isApproved: true,
            approvedAt: new Date().toISOString(),
            isPriceLocked: true,
          },
        };
      })
    );
  };

  // 5. Work in progress
  const startWork = (bookingId: string) => {
    persistBookings(
      bookings.map((b) => (b.id === bookingId ? { ...b, status: 'WORK_IN_PROGRESS' } : b))
    );
  };

  // 6. Complete work -> Ready for NEXDO QR Payment
  const completeWork = (bookingId: string) => {
    persistBookings(
      bookings.map((b) => {
        if (b.id !== bookingId) return b;
        return {
          ...b,
          status: 'PAYMENT_PENDING',
          payment: {
            status: 'PENDING',
            amount: b.estimate?.total || 1100,
            transactionId: `TXN_${b.referenceCode}`,
            qrCodeData: `NEXDO_TXN_${b.referenceCode}_AMT${b.estimate?.total || 1100}`,
            isSandbox: true,
          },
        };
      })
    );
  };

  // 7. Customer scans NEXDO QR and pays ₹1,100 -> Generates Final OTP
  const processPayment = (bookingId: string, method: string = 'UPI') => {
    persistBookings(
      bookings.map((b) => {
        if (b.id !== bookingId) return b;
        return {
          ...b,
          status: 'OTP_PENDING',
          payment: {
            status: 'RECEIVED',
            amount: b.estimate?.total || 1100,
            transactionId: b.payment?.transactionId || `TXN_${b.referenceCode}`,
            qrCodeData: b.payment?.qrCodeData || `NEXDO_TXN_${b.referenceCode}`,
            isSandbox: true,
            paidAt: new Date().toISOString(),
            method,
          },
          finalOtp: {
            code: b.finalOtp?.code || '8942',
            isVerified: false,
          },
        };
      })
    );
  };

  // 8. Technician enters final completion OTP -> Job Completed & Payout Credited
  const verifyFinalOtp = (bookingId: string, otp: string): boolean => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return false;
    const expectedOtp = target.finalOtp?.code || '8942';
    if (otp.trim() === expectedOtp.trim()) {
      persistBookings(
        bookings.map((b) => {
          if (b.id !== bookingId) return b;
          return {
            ...b,
            status: 'COMPLETED',
            finalOtp: {
              code: expectedOtp,
              isVerified: true,
              verifiedAt: new Date().toISOString(),
            },
          };
        })
      );
      return true;
    }
    return false;
  };

  return (
    <CustomerContext.Provider
      value={{
        activeNeed,
        matchedProviders,
        selectedProvider,
        bookings,
        activeBooking,
        setActiveNeed,
        selectProvider,
        getProviderById,
        createBooking,
        cancelBooking,
        updateBookingReview,
        advanceBookingStatus,
        payDiagnosisFee,
        verifyDiagnosisOtp,
        submitEstimate,
        approveEstimate,
        startWork,
        completeWork,
        processPayment,
        verifyFinalOtp,
        isLoadingProviders,
        providersError,
        fetchProviders,
        fetchNearbyProviders,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context) throw new Error('useCustomer must be used within a CustomerProvider');
  return context;
};
