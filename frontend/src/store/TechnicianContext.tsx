import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { JobOpportunity, TechnicianEarnings } from '../types/technician';
import { Capability } from '../types/account';
import { Booking, BookingStatus } from '../types/customer';
import { ALL_AVAILABLE_CAPABILITIES } from '../constants/capabilities';
import { nexdoApi } from '../api/nexdoApi';
import { useApp } from './AppContext';
import { isValidCoordinate } from '../utils/geoUtils';

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

function getDynamicOpportunities(bookingsList: Booking[], currentTechId?: string): JobOpportunity[] {
  const requestedBookings = bookingsList.filter((b) => {
    if (b.status !== 'REQUESTED') return false;
    if (b.technicianId && currentTechId) {
      return b.technicianId === currentTechId || (b.provider && b.provider.id === currentTechId);
    }
    return true;
  });
  return requestedBookings.map(bookingToOpportunity);
}

interface TechnicianContextType {
  opportunities: JobOpportunity[];
  acceptedJobs: JobOpportunity[];
  activeJob: JobOpportunity | null;
  activeBooking: Booking | null;
  earnings: TechnicianEarnings;
  isOnline: boolean;
  isLocationSharing: boolean;
  currentLocation: { latitude: number; longitude: number; accuracy?: number | null } | null;
  locationError: string | null;
  capabilities: Capability[];
  addCapability: (capabilityId: string) => void;
  removeCapability: (capabilityId: string) => void;
  toggleCapabilityActive: (capabilityId: string) => void;
  updateExperienceLevel: (capabilityId: string, level: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT') => void;
  toggleOnline: () => void;
  setOnlineStatus: (online: boolean) => void;
  toggleLocationSharing: (enable?: boolean) => Promise<boolean>;
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

const DEFAULT_EMPTY_EARNINGS: TechnicianEarnings = {
  todayEarnings: 0,
  thisWeekEarnings: 0,
  thisMonthEarnings: 0,
  totalJobs: 0,
  platformFeeCharged: 0,
  activeSubscriptionTitle: 'Standard Pass',
  recentPayouts: [],
};

const TechnicianContext = createContext<TechnicianContextType | undefined>(undefined);

export const TechnicianProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useApp();
  const techId = user?.technicianProfile?.id || user?.id;

  // Synchronize with active customer bookings
  const [bookings, setBookings] = useState<Booking[]>(() => {
    try {
      const saved = localStorage.getItem('nexdo_bookings');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [];
  });

  const [dismissedOppIds, setDismissedOppIds] = useState<string[]>([]);

  const opportunities = useMemo(
    () => getDynamicOpportunities(bookings, techId).filter((o) => !dismissedOppIds.includes(o.id)),
    [bookings, dismissedOppIds, techId]
  );

  const [acceptedJobs, setAcceptedJobs] = useState<JobOpportunity[]>([]);
  const [earnings, setEarnings] = useState<TechnicianEarnings>(DEFAULT_EMPTY_EARNINGS);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [capabilities, setCapabilities] = useState<Capability[]>(() => {
    try {
      const saved = localStorage.getItem('nexdo_technician_capabilities');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return user?.technicianProfile?.capabilities || [];
  });

  const [isLocationSharing, setIsLocationSharing] = useState<boolean>(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number; accuracy?: number | null } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const stopLocationTracking = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsLocationSharing(false);
    nexdoApi.technicians.toggleLocationSharing(false).catch(() => {});
  }, []);

  const toggleLocationSharing = useCallback(async (enable?: boolean): Promise<boolean> => {
    const shouldEnable = enable !== undefined ? enable : !isLocationSharing;

    if (!shouldEnable) {
      stopLocationTracking();
      return false;
    }

    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setLocationError('Geolocation is not supported by your browser.');
      return false;
    }

    setLocationError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude, accuracy, speed, heading } = pos.coords;
          if (!isValidCoordinate(latitude, longitude)) {
            setLocationError('Invalid GPS coordinates received.');
            resolve(false);
            return;
          }

          setCurrentLocation({ latitude, longitude, accuracy });
          setIsLocationSharing(true);

          try {
            await nexdoApi.technicians.updateLocation({
              latitude,
              longitude,
              accuracy: accuracy || null,
              speed: speed || null,
              heading: heading || null,
            });
            await nexdoApi.technicians.toggleLocationSharing(true);
          } catch {
            // Non-fatal
          }

          // Start continuous watching
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
          }

          watchIdRef.current = navigator.geolocation.watchPosition(
            async (nextPos) => {
              const nextCoords = nextPos.coords;
              if (isValidCoordinate(nextCoords.latitude, nextCoords.longitude)) {
                setCurrentLocation({
                  latitude: nextCoords.latitude,
                  longitude: nextCoords.longitude,
                  accuracy: nextCoords.accuracy,
                });
                try {
                  await nexdoApi.technicians.updateLocation({
                    latitude: nextCoords.latitude,
                    longitude: nextCoords.longitude,
                    accuracy: nextCoords.accuracy || null,
                    speed: nextCoords.speed || null,
                    heading: nextCoords.heading || null,
                  });
                } catch {
                  // Non-fatal
                }
              }
            },
            (err) => {
              setLocationError(err.message || 'GPS signal lost.');
            },
            {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 10000,
            }
          );

          resolve(true);
        },
        (err) => {
          let msg = 'Failed to access GPS location.';
          if (err.code === err.PERMISSION_DENIED) {
            msg = 'GPS permission denied. Please allow location access.';
          } else if (err.code === err.TIMEOUT) {
            msg = 'Location request timed out.';
          }
          setLocationError(msg);
          setIsLocationSharing(false);
          resolve(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  }, [isLocationSharing, stopLocationTracking]);

  // Cleanup watcher on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Sync capabilities from authenticated technician profile
  useEffect(() => {
    const userCaps = user?.technicianProfile?.capabilities;
    if (userCaps && userCaps.length > 0) {
      setCapabilities((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(userCaps)) return prev;
        return userCaps;
      });
    }
  }, [user?.technicianProfile?.capabilities]);

  useEffect(() => {
    try {
      localStorage.setItem('nexdo_technician_capabilities', JSON.stringify(capabilities));
    } catch {
      // Ignore
    }
  }, [capabilities]);

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

  // Fetch real jobs and real earnings from backend on user session
  useEffect(() => {
    if (!user) return;
    const currentTechId = user.technicianProfile?.id || user.id;

    nexdoApi.technician
      .getJobs(currentTechId)
      .then((jobs) => {
        if (jobs) {
          const accepted = jobs.filter((j) => j.status === 'ACCEPTED');
          setAcceptedJobs(accepted);
        }
      })
      .catch(() => {});

    nexdoApi.technician
      .getEarnings(currentTechId)
      .then((data) => {
        if (data) {
          setEarnings(data);
        }
      })
      .catch(() => {});
  }, [user]);

  const activeBooking = bookings.find((b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED') || null;
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
        stopLocationTracking();
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
      stopLocationTracking();
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

  const acceptOpportunity = async (oppId: string) => {
    const rawId = oppId.replace('opp_', '');
    try {
      await nexdoApi.technician.acceptJob(rawId);
    } catch (err) {
      console.error('Accept job error in backend:', err);
    }
    const opp = opportunities.find((o) => o.id === oppId);
    if (opp) {
      const accepted: JobOpportunity = { ...opp, status: 'ACCEPTED' };
      setDismissedOppIds((prev) => [...prev, oppId]);
      setAcceptedJobs((prev) => [accepted, ...prev]);

      // Move booking to ACCEPTED
      persistBookings(
        bookings.map((b) => (b.id === rawId || b.id === oppId ? { ...b, status: 'ACCEPTED' as BookingStatus } : b))
      );
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
    const expectedOtp = target.finalOtp?.code || target.otpCode || '8942';
    if (otp.trim() === expectedOtp.trim()) {
      const payoutAmount = target.estimate?.total || target.estimatedPrice || 149;
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

      // Transition backend status to COMPLETED
      nexdoApi.technician.completeJob(bookingId).catch(() => {});

      // Payout 100% directly to technician with zero deduction
      creditPayout(
        payoutAmount,
        target.serviceTitle,
        `${target.customerName} (${target.address.split(',')[1]?.trim() || 'Zone'})`
      );

      // Refresh earnings from backend
      if (user) {
        const currentTechId = user.technicianProfile?.id || user.id;
        nexdoApi.technician.getEarnings(currentTechId).then((data) => {
          if (data) setEarnings(data);
        }).catch(() => {});
      }
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
        isLocationSharing,
        currentLocation,
        locationError,
        capabilities,
        addCapability,
        removeCapability,
        toggleCapabilityActive,
        updateExperienceLevel,
        toggleOnline,
        setOnlineStatus,
        toggleLocationSharing,
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
