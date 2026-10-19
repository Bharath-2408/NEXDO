// ============================================================================
// NEXDO PROFESSIONAL INTERACTIVE MAP COMPONENT
// Powered by Leaflet & OpenStreetMap tiles. Fully compliant with tile usage policies.
// Responsive container, dynamic markers, bounds auto-fit, real live GPS pins,
// and zero fabricated coordinates or imaginary routes.
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, AlertTriangle, RefreshCw, MapPin, Radio, WifiOff } from 'lucide-react';
import { isValidCoordinate } from '../../utils/geoUtils';

export interface LocationPoint {
  latitude: number;
  longitude: number;
  label?: string;
  accuracy?: number | null;
  lastUpdated?: string | null;
}

export interface InteractiveMapProps {
  customerLocation?: LocationPoint | null;
  providerLocation?: LocationPoint | null;
  height?: string;
  className?: string;
  trackingActive?: boolean;
  isStale?: boolean;
  statusMessage?: string;
  onRefresh?: () => void;
  showRouteLine?: boolean;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  customerLocation,
  providerLocation,
  height = '320px',
  className = '',
  trackingActive = false,
  isStale = false,
  statusMessage,
  onRefresh,
  showRouteLine = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const customerMarkerRef = useRef<L.Marker | null>(null);
  const providerMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);

  const [tileError, setTileError] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Default center on Chennai if no coords yet
    const initialLat = customerLocation?.latitude || providerLocation?.latitude || 13.0034;
    const initialLon = customerLocation?.longitude || providerLocation?.longitude || 80.2565;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: 14,
      zoomControl: false, // Customized controls
      attributionControl: true,
    });

    // Add zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // OpenStreetMap tile layer with compliant attribution & tile error listener
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    });

    tileLayer.on('tileerror', () => {
      setTileError(true);
    });

    tileLayer.addTo(map);
    mapInstanceRef.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      customerMarkerRef.current = null;
      providerMarkerRef.current = null;
      routeLineRef.current = null;
      accuracyCircleRef.current = null;
    };
  }, []);

  // Update Markers and Bounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady) return;

    const hasCustomer =
      customerLocation && isValidCoordinate(customerLocation.latitude, customerLocation.longitude);
    const hasProvider =
      providerLocation && isValidCoordinate(providerLocation.latitude, providerLocation.longitude);

    // 1. Customer Marker
    if (hasCustomer) {
      const custLatLng: L.LatLngExpression = [customerLocation.latitude, customerLocation.longitude];

      const customerIcon = L.divIcon({
        className: 'nexdo-customer-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
            <div style="width: 32px; height: 32px; border-radius: 9999px; background-color: #10B981; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-size: 14px;">
              🏠
            </div>
            <div style="margin-top: 2px; padding: 2px 6px; border-radius: 9999px; background-color: rgba(15, 23, 42, 0.9); color: #FFFFFF; font-size: 10px; font-weight: 700; white-space: nowrap;">
              ${customerLocation.label || 'Service Address'}
            </div>
          </div>
        `,
        iconSize: [0, 0],
      });

      if (!customerMarkerRef.current) {
        customerMarkerRef.current = L.marker(custLatLng, { icon: customerIcon }).addTo(map);
      } else {
        customerMarkerRef.current.setLatLng(custLatLng);
        customerMarkerRef.current.setIcon(customerIcon);
      }
    } else if (customerMarkerRef.current) {
      customerMarkerRef.current.remove();
      customerMarkerRef.current = null;
    }

    // 2. Provider Marker
    if (hasProvider) {
      const provLatLng: L.LatLngExpression = [providerLocation.latitude, providerLocation.longitude];

      const providerIcon = L.divIcon({
        className: 'nexdo-provider-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
            <div style="position: relative; width: 36px; height: 36px; border-radius: 9999px; background-color: #2563EB; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.4); display: flex; align-items: center; justify-content: center; color: #FFFFFF;">
              <span style="position: absolute; width: 10px; height: 10px; border-radius: 9999px; background-color: #60A5FA; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.75;"></span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(45deg);"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
            </div>
            <div style="margin-top: 2px; padding: 2px 6px; border-radius: 9999px; background-color: #1E3A8A; color: #93C5FD; font-size: 10px; font-weight: 700; white-space: nowrap; border: 1px solid #3B82F6;">
              ${providerLocation.label || 'Service Provider'}
            </div>
          </div>
        `,
        iconSize: [0, 0],
      });

      if (!providerMarkerRef.current) {
        providerMarkerRef.current = L.marker(provLatLng, { icon: providerIcon }).addTo(map);
      } else {
        providerMarkerRef.current.setLatLng(provLatLng);
        providerMarkerRef.current.setIcon(providerIcon);
      }

      // Accuracy circle if accuracy is reported
      if (providerLocation.accuracy && providerLocation.accuracy > 5) {
        if (!accuracyCircleRef.current) {
          accuracyCircleRef.current = L.circle(provLatLng, {
            radius: Math.min(providerLocation.accuracy, 500),
            color: '#3B82F6',
            fillColor: '#93C5FD',
            fillOpacity: 0.15,
            weight: 1,
          }).addTo(map);
        } else {
          accuracyCircleRef.current.setLatLng(provLatLng);
          accuracyCircleRef.current.setRadius(Math.min(providerLocation.accuracy, 500));
        }
      }
    } else {
      if (providerMarkerRef.current) {
        providerMarkerRef.current.remove();
        providerMarkerRef.current = null;
      }
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.remove();
        accuracyCircleRef.current = null;
      }
    }

    // 3. Optional Direct Line between real positions (if both present)
    if (hasCustomer && hasProvider && showRouteLine) {
      const latlngs: L.LatLngExpression[] = [
        [customerLocation.latitude, customerLocation.longitude],
        [providerLocation.latitude, providerLocation.longitude],
      ];
      if (!routeLineRef.current) {
        routeLineRef.current = L.polyline(latlngs, {
          color: '#38BDF8',
          weight: 3,
          dashArray: '6, 8',
          opacity: 0.8,
        }).addTo(map);
      } else {
        routeLineRef.current.setLatLngs(latlngs);
      }
    } else if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    // 4. Fit bounds
    if (hasCustomer && hasProvider) {
      const bounds = L.latLngBounds([
        [customerLocation.latitude, customerLocation.longitude],
        [providerLocation.latitude, providerLocation.longitude],
      ]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    } else if (hasCustomer) {
      map.setView([customerLocation.latitude, customerLocation.longitude], 15);
    } else if (hasProvider) {
      map.setView([providerLocation.latitude, providerLocation.longitude], 15);
    }
  }, [customerLocation, providerLocation, mapReady, showRouteLine]);

  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (
      customerLocation &&
      isValidCoordinate(customerLocation.latitude, customerLocation.longitude) &&
      providerLocation &&
      isValidCoordinate(providerLocation.latitude, providerLocation.longitude)
    ) {
      const bounds = L.latLngBounds([
        [customerLocation.latitude, customerLocation.longitude],
        [providerLocation.latitude, providerLocation.longitude],
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (customerLocation && isValidCoordinate(customerLocation.latitude, customerLocation.longitude)) {
      map.setView([customerLocation.latitude, customerLocation.longitude], 15);
    } else if (providerLocation && isValidCoordinate(providerLocation.latitude, providerLocation.longitude)) {
      map.setView([providerLocation.latitude, providerLocation.longitude], 15);
    }
  };

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-700/60 shadow-md bg-slate-900 ${className}`}
      style={{ height }}
    >
      {/* Map DOM Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Left Live Status Pill */}
      <div className="absolute top-3 left-3 z-1000 flex items-center gap-2 pointer-events-none">
        {trackingActive ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md border border-slate-700 text-white text-xs font-semibold shadow">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>{statusMessage || 'Live GPS Tracking Active'}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md border border-slate-700 text-slate-300 text-xs font-medium shadow">
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            <span>{statusMessage || 'Service Location Map'}</span>
          </div>
        )}

        {isStale && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/90 text-slate-950 text-[11px] font-bold shadow">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>GPS Signal Stale</span>
          </div>
        )}
      </div>

      {/* Top Right Map Actions */}
      <div className="absolute top-3 right-3 z-1000 flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleRecenter}
          className="p-2 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors shadow text-xs flex items-center justify-center cursor-pointer"
          title="Recenter Map"
        >
          <Navigation className="w-4 h-4" />
        </button>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors shadow text-xs flex items-center justify-center cursor-pointer"
            title="Refresh GPS"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tile Error or Offline Notice */}
      {tileError && (
        <div className="absolute inset-0 z-1001 bg-slate-900/90 flex flex-col items-center justify-center p-4 text-center">
          <WifiOff className="w-8 h-8 text-amber-400 mb-2" />
          <p className="text-sm font-bold text-white">Map tiles temporarily unavailable</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            OpenStreetMap tiles could not be loaded. GPS coordinates and coordinates data remain accurate.
          </p>
        </div>
      )}

      {/* Empty / Waiting for provider location indicator */}
      {!providerLocation && trackingActive && (
        <div className="absolute bottom-3 left-3 right-3 z-1000 bg-slate-900/90 backdrop-blur-md border border-blue-500/40 rounded-xl p-2.5 text-center text-xs text-blue-200">
          <span className="font-semibold text-white">Waiting for provider's live signal...</span>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Your service address is marked. The provider's location will appear as soon as they enable GPS.
          </p>
        </div>
      )}
    </div>
  );
};
