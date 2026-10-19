// ============================================================================
// NEXDO GEOLOCATION HOOK
// Robust real browser/device Geolocation API integration with permission state,
// accuracy checks, error codes, and reverse-geocoded address lookup.
// Never uses hardcoded coordinates.
// ============================================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { Coordinates, reverseGeocodeAsync, isValidCoordinate } from '../utils/geoUtils';

export type GeolocationErrorCode =
  | 'PERMISSION_DENIED'
  | 'POSITION_UNAVAILABLE'
  | 'TIMEOUT'
  | 'UNSUPPORTED'
  | 'LOW_ACCURACY';

export interface GeolocationState {
  coords: Coordinates | null;
  address: string | null;
  city: string | null;
  area: string | null;
  pincode: string | null;
  loading: boolean;
  error: string | null;
  errorCode: GeolocationErrorCode | null;
  isWatching: boolean;
  accuracyWarning: boolean;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unknown';
}

export interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  autoReverseGeocode?: boolean;
  accuracyThresholdMeters?: number; // e.g. warn if > 500m
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 10000,
    autoReverseGeocode = true,
    accuracyThresholdMeters = 500,
  } = options;

  const [state, setState] = useState<GeolocationState>({
    coords: null,
    address: null,
    city: null,
    area: null,
    pincode: null,
    loading: false,
    error: null,
    errorCode: null,
    isWatching: false,
    accuracyWarning: false,
    permissionStatus: 'unknown',
  });

  const watchIdRef = useRef<number | null>(null);

  // Check initial permission status if supported
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'permissions' in navigator && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((perm) => {
          setState((prev) => ({
            ...prev,
            permissionStatus: perm.state as 'prompt' | 'granted' | 'denied',
          }));
          perm.onchange = () => {
            setState((prev) => ({
              ...prev,
              permissionStatus: perm.state as 'prompt' | 'granted' | 'denied',
            }));
          };
        })
        .catch(() => {
          // Ignore unsupported permission queries
        });
    }
  }, []);

  const handlePositionSuccess = useCallback(
    async (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;

      if (!isValidCoordinate(latitude, longitude)) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: 'Invalid coordinates received from GPS device.',
          errorCode: 'POSITION_UNAVAILABLE',
        }));
        return;
      }

      const isLowAccuracy = Boolean(accuracy && accuracy > accuracyThresholdMeters);

      setState((prev) => ({
        ...prev,
        coords: { latitude, longitude, accuracy },
        loading: false,
        error: null,
        errorCode: isLowAccuracy ? 'LOW_ACCURACY' : null,
        accuracyWarning: isLowAccuracy,
        permissionStatus: 'granted',
      }));

      if (autoReverseGeocode) {
        try {
          const geo = await reverseGeocodeAsync(latitude, longitude);
          setState((prev) => ({
            ...prev,
            address: geo.address,
            city: geo.city,
            area: geo.area,
            pincode: geo.pincode,
          }));
        } catch {
          // Address fetch non-critical
        }
      }
    },
    [accuracyThresholdMeters, autoReverseGeocode]
  );

  const handlePositionError = useCallback((err: GeolocationPositionError) => {
    let message = 'An unknown GPS error occurred.';
    let code: GeolocationErrorCode = 'POSITION_UNAVAILABLE';

    switch (err.code) {
      case err.PERMISSION_DENIED:
        message = 'Location access was denied. Please allow location access in your browser settings to proceed.';
        code = 'PERMISSION_DENIED';
        break;
      case err.POSITION_UNAVAILABLE:
        message = 'GPS signal is currently unavailable. Please check your network or enter address manually.';
        code = 'POSITION_UNAVAILABLE';
        break;
      case err.TIMEOUT:
        message = 'Location request timed out. Please try again or enter your location manually.';
        code = 'TIMEOUT';
        break;
    }

    setState((prev) => ({
      ...prev,
      loading: false,
      error: message,
      errorCode: code,
      permissionStatus: code === 'PERMISSION_DENIED' ? 'denied' : prev.permissionStatus,
    }));
  }, []);

  /**
   * Triggers a single explicit location fetch
   */
  const getCurrentLocation = useCallback(async (): Promise<Coordinates | null> => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by your browser.',
        errorCode: 'UNSUPPORTED',
      }));
      return null;
    }

    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      errorCode: null,
    }));

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await handlePositionSuccess(pos);
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        (err) => {
          handlePositionError(err);
          resolve(null);
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        }
      );
    });
  }, [enableHighAccuracy, timeout, maximumAge, handlePositionSuccess, handlePositionError]);

  /**
   * Starts continuous location tracking
   */
  const startWatching = useCallback(
    (onUpdate?: (coords: Coordinates) => void) => {
      if (typeof window === 'undefined' || !('geolocation' in navigator)) {
        setState((prev) => ({
          ...prev,
          error: 'Geolocation is not supported by your browser.',
          errorCode: 'UNSUPPORTED',
        }));
        return;
      }

      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }

      setState((prev) => ({ ...prev, isWatching: true, error: null }));

      const id = navigator.geolocation.watchPosition(
        (pos) => {
          handlePositionSuccess(pos);
          if (onUpdate) {
            onUpdate({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            });
          }
        },
        handlePositionError,
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        }
      );

      watchIdRef.current = id;
    },
    [enableHighAccuracy, timeout, maximumAge, handlePositionSuccess, handlePositionError]
  );

  /**
   * Stops continuous location tracking
   */
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setState((prev) => ({ ...prev, isWatching: false }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  /**
   * Allows setting coordinates manually (e.g. from address search fallback)
   */
  const setManualLocation = useCallback(
    (coords: Coordinates, address?: string, area?: string, city?: string) => {
      setState((prev) => ({
        ...prev,
        coords,
        address: address || prev.address,
        area: area || prev.area,
        city: city || prev.city || 'Chennai',
        error: null,
        errorCode: null,
        loading: false,
      }));
    },
    []
  );

  return {
    ...state,
    getCurrentLocation,
    startWatching,
    stopWatching,
    setManualLocation,
  };
}
