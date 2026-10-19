import React, { useEffect, useState, useRef } from 'react';
import { Phone, Radio, Clock } from 'lucide-react';
import { Booking } from '../../types/customer';
import { nexdoApi } from '../../api/nexdoApi';
import { InteractiveMap } from '../map/InteractiveMap';
import { isValidCoordinate, formatDistance } from '../../utils/geoUtils';

export interface LiveTrackingMapProps {
  booking: Booking;
  onAdvanceStep?: () => void;
}

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  booking,
  onAdvanceStep,
}) => {
  const [trackingData, setTrackingData] = useState<any>(null);
  const isMountedRef = useRef(true);

  const fetchTracking = async () => {
    try {
      const data = await nexdoApi.bookings.getTracking(booking.id);
      if (isMountedRef.current && data) {
        setTrackingData(data);
      }
    } catch {
      // Non-fatal, handled by map fallback
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchTracking();

    const isFinished = booking.status === 'COMPLETED' || booking.status === 'CANCELLED';
    if (isFinished) return;

    // Polling every 6 seconds while booking is active
    const interval = setInterval(() => {
      fetchTracking();
    }, 6000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [booking.id, booking.status]);

  const customerLat = booking.latitude || trackingData?.destination?.latitude;
  const customerLon = booking.longitude || trackingData?.destination?.longitude;
  const hasCustomerCoords = isValidCoordinate(customerLat, customerLon);

  const providerLat = trackingData?.provider?.latitude;
  const providerLon = trackingData?.provider?.longitude;
  const isProviderSharing = Boolean(trackingData?.provider?.isLocationShared);
  const hasProviderCoords = isProviderSharing && isValidCoordinate(providerLat, providerLon);

  const distanceKm = trackingData?.distanceKm ?? null;
  const etaMinutes = trackingData?.etaMinutes ?? null;
  const isStale = Boolean(trackingData?.isStale);
  const statusMessage = trackingData?.statusMessage || (isProviderSharing ? 'Live GPS tracking active' : 'Waiting for provider location');

  return (
    <div className="w-full bg-slate-900 rounded-3xl overflow-hidden relative border border-slate-700/80 shadow-md">
      {/* Top Status Header */}
      <div className="p-3 bg-slate-800/90 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          {hasProviderCoords ? (
            <span className={`w-2.5 h-2.5 rounded-full ${isStale ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
          ) : (
            <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          )}
          <span className="font-semibold text-slate-200">
            {hasProviderCoords
              ? isStale
                ? 'GPS Signal Stale · Last Known Location'
                : 'Live GPS Tracking Active'
              : 'Waiting for provider GPS broadcast'}
          </span>
        </div>

        {/* Real Distance and ETA if both coordinates exist */}
        {distanceKm !== null && (
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg bg-blue-900/60 text-sky-200 text-xs font-bold border border-blue-700/50">
              {formatDistance(distanceKm)} away
            </span>
            {etaMinutes !== null && (
              <span className="flex items-center gap-1 text-slate-300 text-xs">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span>~{etaMinutes} mins</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Real Leaflet Map */}
      <InteractiveMap
        height="300px"
        customerLocation={
          hasCustomerCoords
            ? {
                latitude: customerLat,
                longitude: customerLon,
                label: 'Service Location',
              }
            : null
        }
        providerLocation={
          hasProviderCoords
            ? {
                latitude: providerLat,
                longitude: providerLon,
                label: trackingData?.provider?.name || booking.provider.name,
                accuracy: trackingData?.provider?.accuracyMeters,
                lastUpdated: trackingData?.provider?.lastUpdated,
              }
            : null
        }
        trackingActive={Boolean(trackingData?.trackingActive)}
        isStale={isStale}
        statusMessage={statusMessage}
        onRefresh={fetchTracking}
        showRouteLine={hasCustomerCoords && hasProviderCoords}
      />

      {/* Technician quick communication bar */}
      <div className="p-4 bg-slate-800 text-white flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <img
            src={booking.provider.avatar}
            alt={booking.provider.name}
            className="w-12 h-12 rounded-xl object-cover border border-slate-600"
          />
          <div className="text-left">
            <h4 className="font-bold text-sm text-white">{booking.provider.name}</h4>
            <p className="text-xs text-sky-300">{booking.serviceTitle}</p>
            <span className="text-[11px] text-slate-400">OTP Code: {booking.otpCode}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <a
            href={`tel:${booking.provider.phone}`}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call</span>
          </a>
          {onAdvanceStep && (
            <button
              onClick={onAdvanceStep}
              className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-sky-300 border border-slate-600 transition-colors"
            >
              Simulate Progress Step →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Backwards compatibility alias
export const LiveTrackingMapMock = LiveTrackingMap;
