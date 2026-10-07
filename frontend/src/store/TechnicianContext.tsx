import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { JobOpportunity, TechnicianEarnings } from '../types/technician';
import { Capability } from '../types/account';
import { Booking, BookingStatus } from '../types/customer';
import { ALL_AVAILABLE_CAPABILITIES } from '../constants/capabilities';
import {
  MOCK_TECHNICIAN_EARNINGS,
  MOCK_INITIAL_BOOKINGS,
} from '../constants/mockData';
import { nexdoApi } from '../api/nexdoApi';

function bookingToOpportunity(b: Booking): JobOpportunity {
  const isDiagnosis = b.serviceMode !== 'SERVICE';
  const diagFee = isDiagnosis ? (b.diagnosis?.fee || 149) : 0;
  const dist = b.provider?.distanceKm || 2.4;
  const serviceName = b.serviceTitle || 'Home Service Request';
  const scheduledTime = b.scheduledTime || 'Today';

  const announcementTamil = isDiagnosis
    ? `உங்களுக்கு ஒரு புதிய ${serviceName} request வந்திருக்கு. நேரம்: ${scheduledTime}. தூரம் ${dist} கி.மீ. பரிசோதனைக் கட்டணம் ₹${diagFee}. Accept பண்ணலாமா?`
    : `உங்களுக்கு ஒரு புதிய நேரடி ${serviceName} request வந்திருக்கு. நேரம்: ${scheduledTime}. தூரம் ${dist} கி.மீ. நேரடி சர்வீஸ் கோரப்பட்டுள்ளது. Accept பண்ணலாமா?`;

  const announcementEnglish = isDiagnosis
    ? `New ${serviceName} request. Scheduled: ${scheduledTime}. Distance: ${dist} km away. Diagnosis fee ₹${diagFee}. Would you like to accept?`
    : `New direct ${serviceName} request. Scheduled: ${scheduledTime}. Distance: ${dist} km away. Direct service requested. Would you like to accept?`;

  return {
    id: `opp_${b.id}`,
    serviceName,
    category: 'Home Services',
    customerArea: b.address || 'Chennai',
    distanceKm: dist,
    requestedTime: scheduledTime,
    diagnosisFee: diagFee,
    repairPriceDecidedAfterDiagnosis: isDiagnosis,
    serviceMode: isDiagnosis ? 'DIAGNOSIS' : 'SERVICE',
    urgency: 'NORMAL',
    status: 'ELIGIBLE',
    requiredCapability: 'GENERAL',
    customerNameMasked: `${b.customerName || 'Customer'} (${b.address?.split(',')[0] || 'Nearby'})`,
    issueDescription: b.notes || 'Service requested by customer',
    announcementTamil,
    announcementEnglish,
  };
}

function getDynamicOpportunities(bookingsList: Booking[]): JobOpportunity[] {
  const requestedBookings = bookingsList.filter((b) => b.status === 'REQUESTED');
  if (requestedBookings.length > 0) {
    return requestedBookings.map(bookingToOpportunity);
  }

  try {
    const rawNeed = localStorage.getItem('nexdo_active_need');
    if (rawNeed) {
      const need = JSON.parse(rawNeed);
      if (need && (need.normalizedService || need.rawTranscript)) {
        const isDiagnosis = need.serviceMode !== 'SERVICE';
        const serviceName = need.normalizedService || need.rawTranscript || 'Home Service';
        const requestedTime = need.preferredTime || 'Tomorrow · 6:00 PM';
        const dist = 2.4;
        const diagFee = isDiagnosis ? 149 : 0;
        return [
          {
            id: 'opp_active_need',
            serviceName,
            category: need.serviceCategory || 'Home Services',
            customerArea: need.location || 'Local Area',
            distanceKm: dist,
            requestedTime,
            diagnosisFee: diagFee,
            repairPriceDecidedAfterDiagnosis: isDiagnosis,
            serviceMode: isDiagnosis ? 'DIAGNOSIS' : 'SERVICE',
            urgency: need.urgency === 'URGENT' ? 'URGENT' : 'NORMAL',
            status: 'ELIGIBLE',
            requiredCapability: 'GENERAL',
            customerNameMasked: 'Verified Customer (Local Area)',
            issueDescription: need.specificIssue || need.rawTranscript || 'Customer request',
            announcementTamil: isDiagnosis
              ? `உங்களுக்கு ஒரு புதிய ${serviceName} request வந்திருக்கு. நேரம்: ${requestedTime}. தூரம் ${dist} கி.மீ. பரிசோதனைக் கட்டணம் ₹${diagFee}. Accept பண்ணலாமா?`
              : `உங்களுக்கு ஒரு புதிய நேரடி ${serviceName} request வந்திருக்கு. நேரம்: ${requestedTime}. தூரம் ${dist} கி.மீ. நேரடி சர்வீஸ் கோரப்பட்டுள்ளது. Accept பண்ணலாமா?`,
            announcementEnglish: isDiagnosis
              ? `New ${serviceName} request. Scheduled: ${requestedTime}. Distance: ${dist} km away. Diagnosis fee ₹${diagFee}. Would you like to accept?`
              : `New direct ${serviceName} request. Scheduled: ${requestedTime}. Distance: ${dist} km away. Direct service requested. Would you like to accept?`,
          },
        ];
      }
    }
  } catch {
    // Ignore storage parse errors
  }

  return [];
}

interface TechnicianContextType {
  opportunities: JobOpportunity[];
  acceptedJobs: JobOpportunity[];
  activeJob: JobOpportunity | null;
  activeBooking: Booking | null;
  earnings: TechnicianEarnings;
  isOnline: boolean;
  capabilities: Capability[];
  addCapability: (capabilityId: string) => void;
  removeCapability: (capabilityId: string) => void;
  toggleCapabilityActive: (capabilityId: string) => void;
  updateExperienceLevel: (capabilityId: string, level: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT') => void;
  toggleOnline: () => void;
  setOnlineStatus: (online: boolean) => void;
  acceptOpportunity: (oppId: string) => void;
  rejectOpportunity: (oppId: string) => void;
  advanceJobStatus: (oppId: string) => void;
  advanceTechnicianStep: (bookingId: string, targetStatus?: BookingStatus) => void;
  recordDiagnosis: (bookingId: string, findings: string) => void;
  verifyDiagnosisOtp: (bookingId: string, otp: string) => boolean;
  createEstimate: (bookingId: string, parts: number, labour: number, description: string) => void;
  startWork: (bookingId: string) => void;
  finishWork: (bookingId: string) => void;
  verifyFinalOtp: (bookingId: string, otp: string) => boolean;
  activateSubscription: (type: 'DAILY' | 'WEEKLY' | 'MONTHLY') => void;
}

const initialCapabilities: Capability[] = [
  { id: 'cap_ac_rep', code: 'AC_REPAIR', name: 'AC Repair & Diagnostics', category: 'HVAC & Cooling', experienceLevel: 'EXPERT', isCertified: true, active: true },
  { id: 'cap_ac_srv', code: 'AC_SERVICE', name: 'AC Deep Cleaning & Gas Refill', category: 'HVAC & Cooling', experienceLevel: 'EXPERT', isCertified: true, active: true },
  { id: 'cap_fan_rep', code: 'FAN_REPAIR', name: 'Ceiling & Exhaust Fan Repair', category: 'Electrical', experienceLevel: 'EXPERT', isCertified: true, active: true },
  { id: 'cap_elec_gen', code: 'ELECTRICAL_WORK', name: 'Wiring, MCB & Switchboard Work', category: 'Electrical', experienceLevel: 'INTERMEDIATE', isCertified: false, active: true },
  { id: 'cap_bike', code: 'BIKE_REPAIR', name: 'Two-Wheeler Service & Starting Fix', category: 'Automotive', experienceLevel: 'INTERMEDIATE', isCertified: false, active: true },
];

const TechnicianContext = createContext<TechnicianContextType | undefined>(undefined);

export const TechnicianProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Synchronize with active customer bookings
  const [bookings, setBookings] = useState<Booking[]>(() => {
    try {
      const saved = localStorage.getItem('nexdo_bookings');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return MOCK_INITIAL_BOOKINGS;
  });

  const [dismissedOppIds, setDismissedOppIds] = useState<string[]>([]);

  const opportunities = useMemo(
    () => getDynamicOpportunities(bookings).filter((o) => !dismissedOppIds.includes(o.id)),
    [bookings, dismissedOppIds]
  );

  const [acceptedJobs, setAcceptedJobs] = useState<JobOpportunity[]>(() => {
    const ongoing = MOCK_INITIAL_BOOKINGS.find((b) => b.status === 'ACCEPTED' || b.status === 'TECHNICIAN_ON_THE_WAY');
    if (ongoing) {
      return [{ ...bookingToOpportunity(ongoing), id: 'job_accepted_01', status: 'ACCEPTED' }];
    }
    return [];
  });

  const [earnings, setEarnings] = useState<TechnicianEarnings>(MOCK_TECHNICIAN_EARNINGS);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [capabilities, setCapabilities] = useState<Capability[]>(initialCapabilities);

  const persistBookings = (newBookings: Booking[]) => {
    setBookings(newBookings);
    try {
      localStorage.setItem('nexdo_bookings', JSON.stringify(newBookings));
      window.dispatchEvent(new CustomEvent('nexdo_booking_sync', { detail: newBookings }));
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<Booking[]>;
      if (customEvent.detail) {
        setBookings(customEvent.detail);
      }
    };
    window.addEventListener('nexdo_booking_sync', handleSync);
    return () => window.removeEventListener('nexdo_booking_sync', handleSync);
  }, []);

  const activeBooking = bookings.find((b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED') || bookings[0] || null;
  const activeJob = acceptedJobs.find((j) => j.status === 'ACCEPTED') || null;

  useEffect(() => {
    nexdoApi.technicians.setOnline().catch(() => {});

    const interval = setInterval(() => {
      if (isOnline) {
        nexdoApi.technicians.heartbeat().catch(() => {});
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [isOnline]);

  const toggleOnline = () => {
    setIsOnline((prev) => {
      const next = !prev;
      if (next) {
        nexdoApi.technicians.setOnline().catch(() => {});
      } else {
        nexdoApi.technicians.setOffline().catch(() => {});
      }
      return next;
    });
  };

  const setOnlineStatus = (online: boolean) => {
    setIsOnline(online);
    if (online) {
      nexdoApi.technicians.setOnline().catch(() => {});
    } else {
      nexdoApi.technicians.setOffline().catch(() => {});
    }
  };

  const addCapability = (capabilityId: string) => {
    const found = ALL_AVAILABLE_CAPABILITIES.find((c) => c.id === capabilityId);
    if (found && !capabilities.some((c) => c.id === capabilityId)) {
      const newCap: Capability = {
        ...found,
        experienceLevel: 'INTERMEDIATE',
        isCertified: false,
        active: true,
      };
      setCapabilities((prev) => [...prev, newCap]);
    }
  };

  const removeCapability = (capabilityId: string) => {
    setCapabilities((prev) => prev.filter((c) => c.id !== capabilityId));
  };

  const toggleCapabilityActive = (capabilityId: string) => {
    setCapabilities((prev) =>
      prev.map((c) => (c.id === capabilityId ? { ...c, active: !c.active } : c))
    );
  };

  const updateExperienceLevel = (
    capabilityId: string,
    level: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT'
  ) => {
    setCapabilities((prev) =>
      prev.map((c) => (c.id === capabilityId ? { ...c, experienceLevel: level } : c))
    );
  };

  const acceptOpportunity = (oppId: string) => {
    nexdoApi.technician.acceptJob(oppId).catch(() => {});
    const opp = opportunities.find((o) => o.id === oppId);
    if (opp) {
      const accepted: JobOpportunity = { ...opp, status: 'ACCEPTED' };
      setDismissedOppIds((prev) => [...prev, oppId]);
      setAcceptedJobs((prev) => [accepted, ...prev]);

      // If active booking is in REQUESTED, move it to ACCEPTED
      if (activeBooking && activeBooking.status === 'REQUESTED') {
        persistBookings(
          bookings.map((b) => (b.id === activeBooking.id ? { ...b, status: 'ACCEPTED' } : b))
        );
      }
    }
  };

  const rejectOpportunity = (oppId: string) => {
    setDismissedOppIds((prev) => [...prev, oppId]);
  };

  const advanceJobStatus = (oppId: string) => {
    setAcceptedJobs((prev) =>
      prev.map((job) => {
        if (job.id !== oppId) return job;
        const nextStatus = job.status === 'ACCEPTED' ? 'COMPLETED' : job.status;
        if (nextStatus === 'COMPLETED' && job.status !== 'COMPLETED') {
          const payoutAmount = job.approvedRepairAmount ?? (job.diagnosisFee || 149);
          creditPayout(payoutAmount, job.serviceName, job.customerNameMasked);
        }
        return { ...job, status: nextStatus };
      })
    );
  };

  const creditPayout = (amount: number, jobTitle: string, customerMasked: string) => {
    setEarnings((e) => ({
      ...e,
      todayEarnings: e.todayEarnings + amount,
      thisWeekEarnings: e.thisWeekEarnings + amount,
      totalJobs: e.totalJobs + 1,
      recentPayouts: [
        {
          id: `pay_${Date.now()}`,
          date: 'Just now',
          jobTitle,
          amount,
          customerMasked,
        },
        ...e.recentPayouts,
      ],
    }));
  };

  // Operational Stepper for Synchronized Booking
  const advanceTechnicianStep = (bookingId: string, targetStatus?: BookingStatus) => {
    persistBookings(
      bookings.map((b) => {
        if (b.id !== bookingId) return b;
        if (targetStatus) return { ...b, status: targetStatus };

        if (b.status === 'ACCEPTED') return { ...b, status: 'TECHNICIAN_ON_THE_WAY' };
        if (b.status === 'TECHNICIAN_ON_THE_WAY') return { ...b, status: 'ARRIVED' };
        if (b.status === 'ARRIVED') {
          return { ...b, status: b.serviceMode === 'SERVICE' ? 'ESTIMATE_PENDING' : 'DIAGNOSING' };
        }
        return b;
      })
    );
  };

  const recordDiagnosis = (bookingId: string, findings: string) => {
    persistBookings(
      bookings.map((b) => {
        if (b.id !== bookingId) return b;
        return {
          ...b,
          status: 'DIAGNOSING',
          diagnosis: {
            fee: 149,
            findings: findings || 'Capacitor failure detected. Motor coil and compressor pressure verified.',
            isPaid: b.diagnosis?.isPaid || false,
            otp: b.diagnosis?.otp || '4821',
            isVerified: false,
            diagnosedAt: new Date().toISOString(),
          },
        };
      })
    );
  };

  const verifyDiagnosisOtp = (bookingId: string, otp: string): boolean => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return false;
    const expected = target.diagnosis?.otp || target.otpCode;
    if (otp.trim() === expected.trim()) {
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

  const createEstimate = (
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

  const startWork = (bookingId: string) => {
    persistBookings(
      bookings.map((b) => (b.id === bookingId ? { ...b, status: 'WORK_IN_PROGRESS' } : b))
    );
  };

  const finishWork = (bookingId: string) => {
    persistBookings(
      bookings.map((b) => {
        if (b.id !== bookingId) return b;
        const totalAmount = b.estimate?.total || 1100;
        return {
          ...b,
          status: 'PAYMENT_PENDING',
          payment: {
            status: 'PENDING',
            amount: totalAmount,
            transactionId: `TXN_${b.referenceCode}`,
            qrCodeData: `NEXDO_TXN_${b.referenceCode}_AMT${totalAmount}`,
            isSandbox: true,
          },
        };
      })
    );
  };

  const verifyFinalOtp = (bookingId: string, otp: string): boolean => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return false;
    const expectedOtp = target.finalOtp?.code || '8942';
    if (otp.trim() === expectedOtp.trim()) {
      const payoutAmount = target.estimate?.total || target.estimatedPrice || 1100;
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

      // Payout 100% directly to technician with zero deduction
      creditPayout(
        payoutAmount,
        target.serviceTitle,
        `${target.customerName} (${target.address.split(',')[1]?.trim() || 'Zone'})`
      );
      return true;
    }
    return false;
  };

  const activateSubscription = (type: 'DAILY' | 'WEEKLY' | 'MONTHLY') => {
    nexdoApi.subscriptions
      .activate('t0000001-0000-0000-0000-000000000001', type)
      .catch(() => {});

    const title =
      type === 'DAILY'
        ? 'Daily Access Pass (₹99)'
        : type === 'WEEKLY'
        ? 'Weekly Access Pass (₹599)'
        : 'Monthly Unlimited Access Pass (₹2,499)';
    setEarnings((prev) => ({
      ...prev,
      activeSubscriptionTitle: title,
    }));
  };

  return (
    <TechnicianContext.Provider
      value={{
        opportunities,
        acceptedJobs,
        activeJob,
        activeBooking,
        earnings,
        isOnline,
        capabilities,
        addCapability,
        removeCapability,
        toggleCapabilityActive,
        updateExperienceLevel,
        toggleOnline,
        setOnlineStatus,
        acceptOpportunity,
        rejectOpportunity,
        advanceJobStatus,
        advanceTechnicianStep,
        recordDiagnosis,
        verifyDiagnosisOtp,
        createEstimate,
        startWork,
        finishWork,
        verifyFinalOtp,
        activateSubscription,
      }}
    >
      {children}
    </TechnicianContext.Provider>
  );
};

export const useTechnician = () => {
  const context = useContext(TechnicianContext);
  if (!context) throw new Error('useTechnician must be used within a TechnicianProvider');
  return context;
};
