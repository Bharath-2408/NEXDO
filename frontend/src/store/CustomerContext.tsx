import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ServiceNeed,
  MatchedProvider,
  Booking,
  BookingStatus,
  ServiceMode,
} from '../types/customer';
import { MOCK_MATCHED_PROVIDERS, MOCK_INITIAL_BOOKINGS } from '../constants/mockData';
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
    serviceMode?: ServiceMode
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
  const [matchedProviders, setMatchedProviders] = useState<MatchedProvider[]>(MOCK_MATCHED_PROVIDERS);
  const [selectedProvider, setSelectedProvider] = useState<MatchedProvider | null>(MOCK_MATCHED_PROVIDERS[0]);
  
  // Initialize bookings with local storage sync fallback
  const [bookings, setBookings] = useState<Booking[]>(() => {
    try {
      const saved = localStorage.getItem('nexdo_bookings');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return MOCK_INITIAL_BOOKINGS;
  });

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
      setMatchedProviders(MOCK_MATCHED_PROVIDERS);
      setSelectedProvider(MOCK_MATCHED_PROVIDERS[0]);
      return;
    }

    const c = need.canonicalService;
    if (c === 'TV_REPAIR') {
      const tvProviders: MatchedProvider[] = [
        {
          id: 'prov_tv_01',
          name: 'Kumaravel Electronics',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          rating: 4.9,
          reviewCount: 284,
          distanceKm: 1.8,
          etaMinutes: 20,
          verified: true,
          primaryCapability: 'Smart LED & TV Diagnostics',
          allCapabilities: ['TV Repair', 'Panel Fix', 'Audio Board', 'Electronics'],
          estimatedPrice: 499,
          experienceYears: 8,
          phone: '+91 98401 55667',
          bio: 'Certified television & electronics specialist with 8+ years experience in LED, OLED, and smart TV motherboard repairs.',
          badges: ['Top Rated Pro', 'Screen Specialist', 'Fast Arrival'],
        },
        {
          id: 'prov_tv_02',
          name: 'Vasanth TV Care',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
          rating: 4.8,
          reviewCount: 195,
          distanceKm: 2.9,
          etaMinutes: 30,
          verified: true,
          primaryCapability: 'Multi-Brand TV & Display Repair',
          allCapabilities: ['LED TV', 'Motherboard Fix', 'Power Supply'],
          estimatedPrice: 550,
          experienceYears: 6,
          phone: '+91 98402 77889',
          bio: 'Authorised display panel and power issue repair expert with genuine replacement parts and 30-day service guarantee.',
          badges: ['Display Pro', 'Verified Genuine Parts'],
        },
      ];
      setMatchedProviders(tvProviders);
      setSelectedProvider(tvProviders[0]);
    } else if (c === 'PLUMBER' || c === 'PLUMBING') {
      const plumberProviders: MatchedProvider[] = [
        {
          id: 'prov_plumb_01',
          name: 'Murugan Plumbing Works',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
          rating: 4.9,
          reviewCount: 312,
          distanceKm: 1.5,
          etaMinutes: 15,
          verified: true,
          primaryCapability: 'Pipe Leakage & Tap Broken Repair',
          allCapabilities: ['Plumbing', 'Pipe Repair', 'Drainage', 'Bathroom Fitting'],
          estimatedPrice: 249,
          experienceYears: 9,
          phone: '+91 98403 11223',
          bio: 'Expert plumber for immediate pipe burst, faucet replacement, water line clogging, and bathroom sanitary repairs.',
          badges: ['Speedy Arrival', 'Top Rated Plumber', '30-Day Guarantee'],
        },
      ];
      setMatchedProviders(plumberProviders);
      setSelectedProvider(plumberProviders[0]);
    } else {
      setMatchedProviders(MOCK_MATCHED_PROVIDERS);
      setSelectedProvider(MOCK_MATCHED_PROVIDERS[0]);
    }
  };

  const activeBooking =
    bookings.find((b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED') || bookings[0];

  const selectProvider = (provider: MatchedProvider | null) => {
    setSelectedProvider(provider);
  };

  const getProviderById = (id: string) => {
    return matchedProviders.find((p) => p.id === id) || MOCK_MATCHED_PROVIDERS.find((p) => p.id === id);
  };

  const createBooking = (
    providerId: string,
    scheduledTime: string,
    address: string,
    notes?: string,
    serviceMode: ServiceMode = 'DIAGNOSIS'
  ): Booking => {
    const provider = getProviderById(providerId) || matchedProviders[0];
    const effectiveCustomerId = user?.id || 'usr_nexdo_001';
    const effectiveCustomerName = user?.name || 'Customer';
    const effectiveCustomerPhone = user?.phone || '9876543210';

    const newBooking: Booking = {
      id: `bk_${Date.now()}`,
      referenceCode: `NXD-${Math.floor(10000 + Math.random() * 90000)}`,
      customerId: effectiveCustomerId,
      customerName: effectiveCustomerName,
      customerPhone: effectiveCustomerPhone,
      provider,
      serviceTitle: activeNeed?.normalizedService || 'Air Conditioner Diagnostics & Repair',
      scheduledTime: scheduledTime || 'Today · In 45 mins',
      address: address || '42, Sengunthapuram 3rd Cross, Karur, TN 639002',
      status: 'ACCEPTED',
      estimatedPrice: 1100,
      otpCode: '4821',
      createdAt: new Date().toISOString(),
      serviceMode,
      notes,
      diagnosis:
        serviceMode === 'SERVICE'
          ? undefined
          : {
              fee: 149,
              findings: 'Preliminary inspection needed. Coil and capacitor testing required.',
              isPaid: false,
              otp: '4821',
              isVerified: false,
            },
      estimate: {
        parts: 700,
        labour: 400,
        total: 1100,
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
        code: '8942',
        isVerified: false,
      },
    };

    // Asynchronously sync with backend source of truth
    nexdoApi.bookings
      .create({
        customerId: effectiveCustomerId,
        technicianId: provider.id,
        serviceTitle: activeNeed?.normalizedService || 'Air Conditioner Diagnostics & Repair',
        scheduledTime: scheduledTime || 'Today · In 45 mins',
        address: address || '42, Sengunthapuram 3rd Cross, Karur, TN 639002',
        serviceMode,
        notes,
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
