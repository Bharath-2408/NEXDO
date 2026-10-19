import { dbStore } from '../src/backend/database/store';
import { handleNexdoApiRequest } from '../src/backend/router';
import { TechnicianMatchingService } from '../src/backend/services/technicianMatchingService';
import { BookingService } from '../src/backend/services/bookingService';
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
  console.log('NEXDO REAL PROVIDERS & DIRECT BOOKING DISPATCH TEST SUITE');
  console.log('================================================================\n');

  // Clear demo bookings from memory store
  dbStore.bookings.clear();

  // --- Scenario 1: Verify Zero Hardcoded / Demo Providers in Codebase ---
  console.log('--- Scenario 1: Source Code Audit for Hardcoded Demo Providers ---');

  const customerContextPath = path.resolve(__dirname, '../src/store/CustomerContext.tsx');
  const customerContextContent = fs.readFileSync(customerContextPath, 'utf8');
  assert(!customerContextContent.includes('MOCK_MATCHED_PROVIDERS'), 'CustomerContext does not contain MOCK_MATCHED_PROVIDERS');
  assert(!customerContextContent.includes('Kumaravel Electronics'), 'CustomerContext does not contain fake provider "Kumaravel Electronics"');
  assert(!customerContextContent.includes('Murugan Plumbing'), 'CustomerContext does not contain fake provider "Murugan Plumbing"');
  assert(!customerContextContent.includes('MOCK_INITIAL_BOOKINGS'), 'CustomerContext does not contain MOCK_INITIAL_BOOKINGS');

  const techContextPath = path.resolve(__dirname, '../src/store/TechnicianContext.tsx');
  const techContextContent = fs.readFileSync(techContextPath, 'utf8');
  assert(!techContextContent.includes('MOCK_TECHNICIAN_EARNINGS'), 'TechnicianContext does not contain MOCK_TECHNICIAN_EARNINGS');
  assert(!techContextContent.includes('opp_active_need'), 'TechnicianContext does not contain fake localStorage opportunity generator');

  const customerHomePath = path.resolve(__dirname, '../src/pages/customer/CustomerHomePage.tsx');
  const customerHomeContent = fs.readFileSync(customerHomePath, 'utf8');
  assert(
    customerHomeContent.includes('No service providers available in your area yet.'),
    'CustomerHomePage displays exact text: "No service providers available in your area yet."'
  );

  const providerResultsPath = path.resolve(__dirname, '../src/pages/customer/ProviderResultsPage.tsx');
  const providerResultsContent = fs.readFileSync(providerResultsPath, 'utf8');
  assert(
    providerResultsContent.includes('No service providers available in your area yet.'),
    'ProviderResultsPage displays exact text: "No service providers available in your area yet."'
  );

  const techHomePath = path.resolve(__dirname, '../src/pages/technician/TechnicianHomePage.tsx');
  const techHomeContent = fs.readFileSync(techHomePath, 'utf8');
  assert(
    techHomeContent.includes('No new service requests'),
    'TechnicianHomePage displays exact text: "No new service requests"'
  );

  // --- Scenario 2: Register Real Customer and Real Service Provider ---
  console.log('\n--- Scenario 2: Registration of Real Customer and Real Providers ---');

  const runId = Math.floor(100000 + Math.random() * 900000).toString();
  const custPhone = `9876${runId}`;
  const tech1Phone = `9875${runId}`;
  const tech2Phone = `9874${runId}`;

  const custRes = await handleBackendApiRequest('/api/auth/register', 'POST', {
    role: 'CUSTOMER',
    name: 'Anitha Selvam',
    firstName: 'Anitha',
    lastName: 'Selvam',
    phone: custPhone,
    email: `anitha.${runId}@example.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!',
    city: 'Chennai',
    district: 'Chennai',
  });
  assert(custRes.status === 201, 'Customer registered successfully (HTTP 201)');
  const customerId = custRes.body.user.id;
  const customerToken = custRes.body.sessionToken;

  // Register Provider 1 (AC & Appliance Specialist)
  const tech1Res = await handleBackendApiRequest('/api/auth/register', 'POST', {
    role: 'TECHNICIAN',
    name: 'Karthik Raja',
    firstName: 'Karthik',
    lastName: 'Raja',
    phone: tech1Phone,
    email: `karthik.${runId}@example.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!',
    city: 'Chennai',
    district: 'Chennai',
    serviceArea: 'Anna Nagar',
    selectedDomains: ['AC_APPLIANCE_REPAIR'],
  });
  assert(tech1Res.status === 201, 'Provider 1 (Karthik Raja) registered successfully (HTTP 201)');
  const tech1Id = tech1Res.body.user.id;
  const tech1Token = tech1Res.body.sessionToken;

  // Register Provider 2 (Electrical Specialist in different area)
  const tech2Res = await handleBackendApiRequest('/api/auth/register', 'POST', {
    role: 'TECHNICIAN',
    name: 'Suresh Kumar',
    firstName: 'Suresh',
    lastName: 'Kumar',
    phone: tech2Phone,
    email: `suresh.${runId}@example.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!',
    city: 'Chennai',
    district: 'Chennai',
    serviceArea: 'Tambaram',
    selectedDomains: ['ELECTRICAL'],
  });
  assert(tech2Res.status === 201, 'Provider 2 (Suresh Kumar) registered successfully (HTTP 201)');
  const tech2Id = tech2Res.body.user.id;
  const tech2Token = tech2Res.body.sessionToken;

  // --- Scenario 3: Newly Registered Provider Has 0 Jobs and 0 Earnings ---
  console.log('\n--- Scenario 3: Newly Registered Provider Dashboard State ---');

  const tech1JobsRes = await handleBackendApiRequest('/api/technician/jobs', 'GET', undefined, {
    authorization: `Bearer ${tech1Token}`,
  });
  assert(tech1JobsRes.status === 200, 'Provider 1 can fetch jobs (HTTP 200)');
  assert(tech1JobsRes.body.jobs.length === 0, 'Newly registered Provider 1 has exactly 0 jobs');

  const tech1EarningsRes = await handleBackendApiRequest('/api/technician/earnings', 'GET', undefined, {
    authorization: `Bearer ${tech1Token}`,
  });
  assert(tech1EarningsRes.status === 200, 'Provider 1 can fetch earnings (HTTP 200)');
  assert(tech1EarningsRes.body.earnings.todayEarnings === 0, "Provider 1 today's earnings is ₹0");
  assert(tech1EarningsRes.body.earnings.totalJobs === 0, 'Provider 1 total completed jobs is 0');
  assert(tech1EarningsRes.body.earnings.recentPayouts.length === 0, 'Provider 1 has 0 recent payouts');

  // --- Scenario 4: Real Provider Search & Area Filtering ---
  console.log('\n--- Scenario 4: Real Provider Search & Area Isolation ---');

  // Search in Anna Nagar for AC
  const searchAnnaNagarRes = await handleBackendApiRequest('/api/technicians/search?area=Anna%20Nagar&serviceCode=AC_APPLIANCE_REPAIR', 'GET');
  assert(searchAnnaNagarRes.status === 200, 'Search in Anna Nagar succeeded (HTTP 200)');
  const matchingAnnaNagar = searchAnnaNagarRes.body.technicians;
  assert(matchingAnnaNagar.some((t: any) => t.name === 'Karthik Raja'), 'Found real registered provider Karthik Raja in Anna Nagar');
  assert(!matchingAnnaNagar.some((t: any) => t.name === 'Ravi Kumar'), 'Ravi Kumar is NOT returned');
  assert(!matchingAnnaNagar.some((t: any) => t.name === 'Priya Anand'), 'Priya Anand is NOT returned');

  // Search in non-existent area or unmatched domain
  const searchEmptyRes = await handleBackendApiRequest('/api/technicians/search?area=Coimbatore&serviceCode=BEAUTY_SALON', 'GET');
  assert(searchEmptyRes.status === 200, 'Search for unserved area/domain succeeded (HTTP 200)');
  assert(searchEmptyRes.body.technicians.length === 0, 'Returns 0 providers when no registered provider matches (empty list)');

  // Ensure getTechnicianById returns undefined for fake ID
  const fakeLookup = TechnicianMatchingService.getTechnicianById('non_existent_provider_id');
  assert(fakeLookup === undefined, 'TechnicianMatchingService.getTechnicianById returns undefined for unknown ID (no mock fallback)');

  // --- Scenario 5: Customer Booking Reaches Strictly the Selected Provider ---
  console.log('\n--- Scenario 5: Customer Direct Booking & Dispatch Isolation ---');

  // Look up Provider 1's profile id
  const karthikProfile = dbStore.getTechnicianProfileByUserId(tech1Id);
  const targetProviderId = karthikProfile?.id || tech1Id;

  // Customer creates a direct booking for Karthik Raja
  const createBookingRes = await handleBackendApiRequest('/api/bookings', 'POST', {
    technicianId: targetProviderId,
    serviceTitle: 'Split AC Deep Cleaning',
    scheduledTime: 'Tomorrow at 10:00 AM',
    address: 'Flat 4B, Shanthi Colony, Anna Nagar, Chennai',
    serviceMode: 'DIAGNOSIS',
    status: 'REQUESTED',
    notes: 'AC making rattling noise and low cooling',
  }, {
    authorization: `Bearer ${customerToken}`,
  });
  assert(createBookingRes.status === 201, 'Customer booking created with status REQUESTED (HTTP 201)');
  const bookingId = createBookingRes.body.booking.id;
  const bookedTechId = createBookingRes.body.booking.technicianId || createBookingRes.body.booking.technician_id || createBookingRes.body.booking.provider?.id;
  assert(bookedTechId === targetProviderId, 'Booking technician_id is strictly set to target provider');
  assert(createBookingRes.body.booking.status === 'REQUESTED', 'Initial booking status is REQUESTED');

  // Check Provider 1's opportunities: MUST see this booking
  const tech1JobsAfterRes = await handleBackendApiRequest('/api/technician/jobs', 'GET', undefined, {
    authorization: `Bearer ${tech1Token}`,
  });
  assert(tech1JobsAfterRes.status === 200, 'Provider 1 fetched jobs after booking (HTTP 200)');
  const tech1Jobs = tech1JobsAfterRes.body.jobs;
  assert(tech1Jobs.some((j: any) => j.id === bookingId || j.id === `opp_${bookingId}`), 'Assigned booking is visible to target Provider 1');

  // Check Provider 2's opportunities: MUST NOT see this booking (Strict Dispatch Isolation)
  const tech2JobsAfterRes = await handleBackendApiRequest('/api/technician/jobs', 'GET', undefined, {
    authorization: `Bearer ${tech2Token}`,
  });
  assert(tech2JobsAfterRes.status === 200, 'Provider 2 fetched jobs (HTTP 200)');
  const tech2Jobs = tech2JobsAfterRes.body.jobs;
  assert(
    !tech2Jobs.some((j: any) => j.id === bookingId || j.id === `opp_${bookingId}`),
    'Assigned booking is STRICTLY HIDDEN from Provider 2 (Dispatch Isolation Verified)'
  );

  // --- Scenario 6: Unauthorized Acceptance Block & Concurrency Conflict (HTTP 409 / 403) ---
  console.log('\n--- Scenario 6: Concurrency Protection & Cross-Provider Acceptance Denial ---');

  // Provider 2 tries to accept Provider 1's directly assigned job -> HTTP 403 Forbidden
  const tech2AcceptForbiddenRes = await handleBackendApiRequest(`/api/technician/jobs/${bookingId}/accept`, 'POST', undefined, {
    authorization: `Bearer ${tech2Token}`,
  });
  assert(
    tech2AcceptForbiddenRes.status === 403,
    'Provider 2 cannot accept Provider 1\'s booking: rejected with HTTP 403 Forbidden'
  );

  // Provider 1 accepts the job -> status transitions to ACCEPTED
  const tech1AcceptRes = await handleBackendApiRequest(`/api/technician/jobs/${bookingId}/accept`, 'POST', undefined, {
    authorization: `Bearer ${tech1Token}`,
  });
  assert(tech1AcceptRes.status === 200, 'Provider 1 accepts booking successfully (HTTP 200)');
  assert(tech1AcceptRes.body.job.status === 'ACCEPTED', 'Booking status transitioned to ACCEPTED');

  // Duplicate acceptance attempt by Provider 1 -> HTTP 409 Conflict
  const duplicateAcceptRes = await handleBackendApiRequest(`/api/technician/jobs/${bookingId}/accept`, 'POST', undefined, {
    authorization: `Bearer ${tech1Token}`,
  });
  assert(
    duplicateAcceptRes.status === 409,
    'Duplicate acceptance attempt blocked with HTTP 409 Conflict'
  );

  // --- Scenario 7: Job Execution, Completion & 100% Payout Update ---
  console.log('\n--- Scenario 7: Work Completion & Zero Commission / 100% Payout ---');

  // Provider marks arrived
  const arriveRes = await handleBackendApiRequest(`/api/technician/jobs/${bookingId}/arrive`, 'POST', undefined, {
    authorization: `Bearer ${tech1Token}`,
  });
  assert(arriveRes.status === 200, 'Provider marked arrived (HTTP 200)');

  // Provider completes work
  const completeRes = await handleBackendApiRequest(`/api/technician/jobs/${bookingId}/complete`, 'POST', undefined, {
    authorization: `Bearer ${tech1Token}`,
  });
  assert(completeRes.status === 200, 'Provider completed work (HTTP 200)');
  assert(completeRes.body.job.status === 'COMPLETED', 'Job status is COMPLETED');

  // Verify earnings calculation
  const tech1UpdatedEarningsRes = await handleBackendApiRequest('/api/technician/earnings', 'GET', undefined, {
    authorization: `Bearer ${tech1Token}`,
  });
  assert(tech1UpdatedEarningsRes.status === 200, 'Provider 1 fetched updated earnings (HTTP 200)');
  assert(tech1UpdatedEarningsRes.body.earnings.totalJobs === 1, 'Provider 1 completed jobs count is now 1');
  assert(tech1UpdatedEarningsRes.body.earnings.todayEarnings > 0, `Provider 1 today's earnings updated: ₹${tech1UpdatedEarningsRes.body.earnings.todayEarnings}`);

  console.log('\n================================================================');
  console.log(`REAL PROVIDERS & BOOKING DISPATCH RESULTS: ${passCount} / ${passCount + failCount} PASSED`);
  console.log('================================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Unhandled test error:', err);
  process.exit(1);
});
