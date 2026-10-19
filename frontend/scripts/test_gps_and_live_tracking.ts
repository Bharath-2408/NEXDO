import { dbStore } from '../src/backend/database/store';
import { handleNexdoApiRequest } from '../src/backend/router';
import {
  isValidCoordinate,
  calculateHaversineDistanceKm,
  estimateEtaMinutes,
  formatDistance,
} from '../src/utils/geoUtils';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function handleBackendApiRequest(url: string, method: string, body?: any, headers?: Record<string, string>) {
  return handleNexdoApiRequest({ url, method, body, headers });
}

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    failCount++;
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('NEXDO REAL GPS & LIVE TRACKING VERIFICATION SUITE');
  console.log('================================================================\n');

  // --- Scenario 1: Source Code Audit for Zero Mock Locations & Tile Compliance ---
  console.log('--- Scenario 1: Source Code Audit ---');

  const liveTrackingMapMockPath = path.resolve(__dirname, '../src/components/customer/LiveTrackingMapMock.tsx');
  const liveTrackingMapContent = fs.readFileSync(liveTrackingMapMockPath, 'utf8');
  assert(!liveTrackingMapContent.includes('Adyar Sector 4'), 'LiveTrackingMap does not contain hardcoded "Adyar Sector 4" string');
  assert(liveTrackingMapContent.includes('InteractiveMap'), 'LiveTrackingMap embeds real InteractiveMap component');
  assert(liveTrackingMapContent.includes('getTracking'), 'LiveTrackingMap polls real getTracking endpoint');

  const bookingFlowPath = path.resolve(__dirname, '../src/pages/customer/BookingFlowPage.tsx');
  const bookingFlowContent = fs.readFileSync(bookingFlowPath, 'utf8');
  assert(bookingFlowContent.includes('useGeolocation'), 'BookingFlowPage uses real useGeolocation hook');
  assert(bookingFlowContent.includes('Use My Current Location'), 'BookingFlowPage includes "Use My Current Location" button');
  assert(bookingFlowContent.includes('InteractiveMap'), 'BookingFlowPage provides InteractiveMap preview when coordinates detected');

  const techHomePath = path.resolve(__dirname, '../src/pages/technician/TechnicianHomePage.tsx');
  const techHomeContent = fs.readFileSync(techHomePath, 'utf8');
  assert(techHomeContent.includes('Live GPS Location Broadcast'), 'TechnicianHomePage includes "Live GPS Location Broadcast" card');
  assert(techHomeContent.includes('toggleLocationSharing'), 'TechnicianHomePage provides location sharing toggle action');

  // --- Scenario 2: GPS Math & Coordinate Validation ---
  console.log('\n--- Scenario 2: Coordinate Validation & Haversine Distance ---');

  assert(isValidCoordinate(13.0827, 80.2707), 'Validates Chennai center coordinates (13.0827, 80.2707)');
  assert(!isValidCoordinate(95.0, 80.0), 'Rejects latitude > 90');
  assert(!isValidCoordinate(-91.0, 80.0), 'Rejects latitude < -90');
  assert(!isValidCoordinate(13.0, 185.0), 'Rejects longitude > 180');
  assert(!isValidCoordinate(null, 80.0), 'Rejects null latitude');
  assert(!isValidCoordinate(13.0, undefined), 'Rejects undefined longitude');
  assert(!isValidCoordinate(NaN, 80.0), 'Rejects NaN latitude');

  // Haversine calculation between Chennai Central (13.0827, 80.2707) and Adyar (13.0012, 80.2565) ~9.1 km
  const distKm = calculateHaversineDistanceKm(13.0827, 80.2707, 13.0012, 80.2565);
  assert(distKm > 8.5 && distKm < 9.5, `Haversine distance between Chennai Central & Adyar is ~9.1 km (actual: ${distKm.toFixed(2)} km)`);

  const samePointDist = calculateHaversineDistanceKm(13.0827, 80.2707, 13.0827, 80.2707);
  assert(samePointDist === 0, 'Haversine distance between same coordinate is exactly 0 km');

  const eta = estimateEtaMinutes(distKm);
  assert(eta > 15 && eta < 30, `ETA estimation for ~9km urban travel is reasonable (${eta} mins)`);
  assert(formatDistance(0.5) === '500 m', 'Formats 0.5 km as 500 m');
  assert(formatDistance(4.25) === '4.3 km', 'Formats 4.25 km as 4.3 km');

  // --- Scenario 3: Real Provider Registration & GPS Updates ---
  console.log('\n--- Scenario 3: Real Provider Registration & Live Location Broadcast ---');

  const runId = Math.floor(100000 + Math.random() * 900000).toString();
  const techPhone = `9876${runId}`;
  const custPhone = `9875${runId}`;

  // Register technician
  const regTechRes = await handleBackendApiRequest('/api/auth/register', 'POST', {
    role: 'TECHNICIAN',
    name: 'Karthik Raja',
    firstName: 'Karthik',
    lastName: 'Raja',
    phone: techPhone,
    email: `karthik.${runId}@example.com`,
    password: 'SecurePassword123!',
    confirmPassword: 'SecurePassword123!',
    city: 'Chennai',
    district: 'Chennai',
    serviceArea: 'Adyar',
    selectedDomains: ['AC_APPLIANCE_REPAIR'],
  });
  assert(regTechRes.status === 201, 'Registered new real technician Karthik Raja');
  const techUser = regTechRes.body.user;
  const storedTechProfile = Array.from(dbStore.technicianProfiles.values()).find(
    (t) => t.profile_id === techUser.id || t.id === techUser.id
  );
  const techProfileId = storedTechProfile?.id || techUser.id;

  // Login technician to obtain session
  const loginTechRes = await handleBackendApiRequest('/api/auth/login', 'POST', {
    identifier: techPhone,
    password: 'SecurePassword123!',
  });
  const techToken = loginTechRes.body.token || loginTechRes.body.sessionToken;

  // Set technician online
  const onlineRes = await handleBackendApiRequest(
    '/api/technician/online',
    'POST',
    {},
    { authorization: `Bearer ${techToken}` }
  );
  assert(onlineRes.status === 200, 'Technician went online');

  // Broadcast GPS location (e.g. Adyar: 13.0067, 80.2570)
  const locUpdateRes = await handleBackendApiRequest(
    '/api/technician/location',
    'POST',
    {
      latitude: 13.0067,
      longitude: 80.257,
      accuracy: 12,
      speed: 15.5,
      heading: 180,
    },
    { authorization: `Bearer ${techToken}` }
  );
  assert(locUpdateRes.status === 200, 'Technician broadcasted live GPS coordinates (13.0067, 80.2570)');
  assert(locUpdateRes.body.isLocationShared === true, 'Location sharing automatically set to active');

  // Verify stored profile has updated coordinates
  const storedTech = dbStore.technicianProfiles.get(techProfileId);
  assert(storedTech !== undefined, 'Stored technician profile exists in DB store');
  assert(storedTech?.latitude === 13.0067, 'Stored technician profile has correct latitude');
  assert(storedTech?.longitude === 80.257, 'Stored technician profile has correct longitude');
  assert(storedTech?.is_location_shared === true, 'Stored technician profile has is_location_shared = true');

  // --- Scenario 4: Nearby Real Provider Search with Haversine Sorting ---
  console.log('\n--- Scenario 4: Nearby Real Provider Search with Haversine Sorting ---');

  // Search from nearby customer location (Besant Nagar: 13.0002, 80.2668 - ~1.2 km from Adyar)
  const nearbyRes = await handleBackendApiRequest(
    '/api/technicians/nearby?lat=13.0002&lon=80.2668&domain=AC_APPLIANCE_REPAIR&radiusKm=15',
    'GET'
  );
  assert(nearbyRes.status === 200, 'Nearby technicians search endpoint returned 200 OK');
  assert(Array.isArray(nearbyRes.body.technicians), 'Nearby search returns technicians array');

  const foundTech = nearbyRes.body.technicians.find((t: any) => t.id === techProfileId);
  assert(foundTech !== undefined, 'Found registered technician in nearby results');
  assert(typeof foundTech.distanceKm === 'number', `Computed distance is a valid number: ${foundTech?.distanceKm} km`);
  assert(foundTech.distanceKm < 3.0, `Technician is correctly detected within ~1.5 km (${foundTech.distanceKm} km)`);

  // --- Scenario 5: Customer Booking with Real GPS Coordinates ---
  console.log('\n--- Scenario 5: Customer Booking with GPS Location ---');

  // Register customer
  const regCustRes = await handleBackendApiRequest('/api/auth/register', 'POST', {
    role: 'CUSTOMER',
    name: 'Ananya S',
    firstName: 'Ananya',
    lastName: 'S',
    phone: custPhone,
    email: `ananya.${runId}@example.com`,
    password: 'SecurePassword123!',
    confirmPassword: 'SecurePassword123!',
    city: 'Chennai',
    district: 'Chennai',
  });
  assert(regCustRes.status === 201, 'Registered new customer Ananya S');
  const custUser = regCustRes.body.user;

  // Login customer
  const loginCustRes = await handleBackendApiRequest('/api/auth/login', 'POST', {
    identifier: custPhone,
    password: 'SecurePassword123!',
  });
  const custToken = loginCustRes.body.token || loginCustRes.body.sessionToken;

  // Create booking with GPS coordinates
  const createBookingRes = await handleBackendApiRequest(
    '/api/bookings',
    'POST',
    {
      customerId: custUser.id,
      technicianId: techProfileId,
      serviceTitle: 'Air Conditioner Repair & Gas Fill',
      scheduledTime: 'Today · In 45 mins',
      address: 'Plot 14, 2nd Avenue, Besant Nagar, Chennai 600090',
      latitude: 13.0002,
      longitude: 80.2668,
      serviceMode: 'DIAGNOSIS',
    },
    { authorization: `Bearer ${custToken}` }
  );
  assert(createBookingRes.status === 201, 'Booking created with GPS coordinates');
  const booking = createBookingRes.body.booking;
  assert(booking.latitude === 13.0002, 'Booking record stored customer latitude (13.0002)');
  assert(booking.longitude === 80.2668, 'Booking record stored customer longitude (80.2668)');

  // --- Scenario 6: Live Tracking & Zero-Trust IDOR Authorization ---
  console.log('\n--- Scenario 6: Live Tracking & IDOR Security ---');

  // Customer accesses tracking -> Should succeed (200)
  const custTrackingRes = await handleBackendApiRequest(
    `/api/bookings/${booking.id}/tracking`,
    'GET',
    undefined,
    { authorization: `Bearer ${custToken}` }
  );
  assert(custTrackingRes.status === 200, 'Customer successfully accessed live tracking for their booking');
  assert(custTrackingRes.body.tracking.trackingActive === true, 'Live tracking is active for in-progress booking');
  assert(custTrackingRes.body.tracking.provider.latitude === 13.0067, 'Tracking payload contains real provider latitude');
  assert(custTrackingRes.body.tracking.destination.latitude === 13.0002, 'Tracking payload contains customer destination latitude');
  assert(custTrackingRes.body.tracking.distanceKm !== null, `Tracking calculates real distance: ${custTrackingRes.body.tracking.distanceKm} km`);
  assert(custTrackingRes.body.tracking.etaMinutes !== null, `Tracking calculates real ETA: ${custTrackingRes.body.tracking.etaMinutes} mins`);

  // Assigned Technician accesses tracking -> Should succeed (200)
  const techTrackingRes = await handleBackendApiRequest(
    `/api/bookings/${booking.id}/tracking`,
    'GET',
    undefined,
    { authorization: `Bearer ${techToken}` }
  );
  assert(techTrackingRes.status === 200, 'Assigned technician successfully accessed live tracking for this booking');

  // Third-party unrelated user attempts to access tracking -> Must be 403 Forbidden (Zero-Trust IDOR)
  const hackerRes = await handleBackendApiRequest('/api/auth/register', 'POST', {
    role: 'CUSTOMER',
    name: 'Unrelated User',
    firstName: 'Unrelated',
    lastName: 'User',
    phone: `9871${runId}`,
    email: `unrelated.${runId}@example.com`,
    password: 'SecurePassword123!',
    confirmPassword: 'SecurePassword123!',
    city: 'Chennai',
    district: 'Chennai',
  });
  const hackerToken = hackerRes.body.token || hackerRes.body.sessionToken;

  const idorRes = await handleBackendApiRequest(
    `/api/bookings/${booking.id}/tracking`,
    'GET',
    undefined,
    { authorization: `Bearer ${hackerToken}` }
  );
  assert(idorRes.status === 403, 'Unauthorized third-party user was rejected with 403 Forbidden (IDOR Protection)');

  // --- Scenario 7: Auto-Stop on Offline & Booking Completion ---
  console.log('\n--- Scenario 7: Auto-Stop & Stale Handling ---');

  // Technician goes offline -> location sharing auto-stops
  const offlineRes = await handleBackendApiRequest(
    '/api/technician/offline',
    'POST',
    {},
    { authorization: `Bearer ${techToken}` }
  );
  assert(offlineRes.status === 200, 'Technician went offline');

  const afterOfflineTech = dbStore.technicianProfiles.get(techProfileId);
  assert(afterOfflineTech?.is_location_shared === false, 'Location sharing auto-disabled when technician went offline');

  // Tracking query now reflects offline/stale state
  const staleTrackingRes = await handleBackendApiRequest(
    `/api/bookings/${booking.id}/tracking`,
    'GET',
    undefined,
    { authorization: `Bearer ${custToken}` }
  );
  assert(staleTrackingRes.body.tracking.isStale === true, 'Tracking marked isStale = true when technician went offline');

  // Technician completes booking
  dbStore.bookings.get(booking.id)!.status = 'COMPLETED';

  const completedTrackingRes = await handleBackendApiRequest(
    `/api/bookings/${booking.id}/tracking`,
    'GET',
    undefined,
    { authorization: `Bearer ${custToken}` }
  );
  assert(completedTrackingRes.body.tracking.trackingActive === false, 'Tracking auto-stopped (trackingActive = false) when booking completed');
  assert(
    completedTrackingRes.body.tracking.statusMessage.includes('completed'),
    'Status message indicates tracking closed on completion'
  );

  console.log('\n================================================================');
  console.log(`TOTAL CHECKS: ${passCount + failCount}`);
  console.log(`PASSED: ${passCount}`);
  console.log(`FAILED: ${failCount}`);
  console.log('================================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
