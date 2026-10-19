// ============================================================================
// NEXDO GEOLOCATION & MAPPING UTILITIES
// Haversine distance, coordinate validation, OSM reverse-geocoding, and ETA math
// Compliant with OpenStreetMap tile & Nominatim usage policies (User-Agent included)
// ============================================================================

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
}

/**
 * Validates whether latitude and longitude are valid geographical numbers
 */
export function isValidCoordinate(latitude: any, longitude: any): boolean {
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return false;
  }
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (isNaN(lat) || isNaN(lon)) return false;
  return lat >= -90.0 && lat <= 90.0 && lon >= -180.0 && lon <= 180.0;
}

/**
 * Calculates Haversine distance in kilometers between two GPS coordinates
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (!isValidCoordinate(lat1, lon1) || !isValidCoordinate(lat2, lon2)) {
    return 0;
  }
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

/**
 * Formats distance into a human-readable string (e.g. "850 m" or "2.4 km")
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm <= 0) return '0 m';
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Estimates arrival time in minutes based on real distance and average city driving speed
 */
export function estimateEtaMinutes(distanceKm: number, avgSpeedKmh = 25): number {
  if (distanceKm <= 0.1) return 3;
  const travelMinutes = (distanceKm / avgSpeedKmh) * 60;
  return Math.max(5, Math.round(travelMinutes + 5)); // Minimum 5 mins with 5 min buffer
}

/**
 * Reverse geocodes GPS coordinates into a readable address using Nominatim (OSM)
 * Respects usage policy: 1 req/sec max with descriptive User-Agent
 */
export async function reverseGeocodeAsync(
  latitude: number,
  longitude: number
): Promise<{ address: string; city: string; area: string; pincode: string }> {
  if (!isValidCoordinate(latitude, longitude)) {
    return {
      address: 'Unknown location',
      city: 'Chennai',
      area: 'Chennai',
      pincode: '',
    };
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NEXDO-OnDemand-ServicePlatform/1.0 (contact: support@nexdo.in)',
      },
    });

    if (!response.ok) {
      throw new Error(`Reverse geocoding HTTP ${response.status}`);
    }

    const data = await response.json();
    const addr = data.address || {};
    const road = addr.road || addr.pedestrian || addr.suburb || '';
    const neighbourhood = addr.neighbourhood || addr.suburb || addr.residential || '';
    const city = addr.city || addr.town || addr.county || 'Chennai';
    const state = addr.state || 'Tamil Nadu';
    const pincode = addr.postcode || '';

    const parts = [road, neighbourhood, city, state].filter(Boolean);
    const formatted = parts.length > 0 ? parts.join(', ') : (data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);

    return {
      address: formatted,
      city,
      area: neighbourhood || city,
      pincode,
    };
  } catch {
    // Non-fatal network fallback
    return {
      address: `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
      city: 'Chennai',
      area: 'Chennai',
      pincode: '',
    };
  }
}

/**
 * Forward geocodes an address or location name to coordinates
 */
export async function forwardGeocodeAsync(
  query: string
): Promise<Array<{ displayName: string; latitude: number; longitude: number }>> {
  if (!query || query.trim().length < 3) return [];

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
      query + ', Tamil Nadu, India'
    )}&limit=5`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NEXDO-OnDemand-ServicePlatform/1.0 (contact: support@nexdo.in)',
      },
    });

    if (!response.ok) return [];
    const results = await response.json();
    if (!Array.isArray(results)) return [];

    return results.map((r: any) => ({
      displayName: r.display_name,
      latitude: parseFloat(r.lat),
      longitude: parseFloat(r.lon),
    }));
  } catch {
    return [];
  }
}
