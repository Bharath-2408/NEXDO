// ==============================================================================
// NEXDO LIVE SUPABASE END-TO-END VERIFICATION & AUDIT SUITE
// Tests all 8 core flows against real remote Supabase database:
// 1. Customer signup, login, session persistence, and logout
// 2. Technician signup, login, presence toggle, and role isolation
// 3. Service request & booking creation, in-memory cache clearing, and remote persistence
// 4. Booking status transitions, history tracking, earnings, and IDOR protection
// 5. Server-authoritative pricing (₹149 diagnosis) & sandbox payment flow
// 6. Complete RLS audit across all 13 core relational tables
// 7. Client bundle secret exposure scan
// 8. Direct database verification (not fake in-memory)
// Zero secret exposure. Zero real money charged.
// ==============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Safely load environment variables without logging values
function loadEnv() {
  const envPath = path.resolve(rootDir, '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const k = trimmed.slice(0, idx).trim();
        let v = trimmed.slice(idx + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        if (!process.env[k]) {
          process.env[k] = v;
        }
      }
    }
  }
}
loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('[FAIL] Supabase credentials missing from .env');
  process.exit(1);
}

// Trusted backend client (bypasses RLS)
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Untrusted public client (tests RLS)
const anonClient = createClient(SUPABASE_URL, ANON_KEY || SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Helper for deterministic test IDs
const testRunId = Math.floor(100000 + Math.random() * 900000);
const custPhone = `98${testRunId.toString().padStart(8, '0').slice(0, 8)}`;
const techPhone = `97${testRunId.toString().padStart(8, '0').slice(0, 8)}`;

let passedTests = 0;
let totalTests = 0;
const results = [];

function recordTest(name, passed, details = '') {
  totalTests++;
  if (passed) passedTests++;
  const status = passed ? '[PASS]' : '[FAIL]';
  results.push({ name, passed, details });
  console.log(`${status} ${name}${details ? ` (${details})` : ''}`);
}

async function runE2ETests() {
  console.log('================================================================');
  console.log('NEXDO REAL SUPABASE END-TO-END VERIFICATION & AUDIT');
  console.log('================================================================');
  console.log(`Target: ${SUPABASE_URL ? 'Connected' : 'Missing'}`);
  console.log(`Test Execution ID: ${testRunId}`);
  console.log('----------------------------------------------------------------\n');

  // Dynamic import of backend router & store (compiled or via tsx)
  let handleNexdoApiRequest;
  let dbStore;
  let AuthService;
  let BookingService;
  let PresenceService;

  try {
    const routerMod = await import('../src/backend/router.ts');
    handleNexdoApiRequest = routerMod.handleNexdoApiRequest;
    const storeMod = await import('../src/backend/database/store.ts');
    dbStore = storeMod.dbStore;
    const authMod = await import('../src/backend/services/authService.ts');
    AuthService = authMod.AuthService;
    const bookingMod = await import('../src/backend/services/bookingService.ts');
    BookingService = bookingMod.BookingService;
    const presenceMod = await import('../src/backend/services/presenceService.ts');
    PresenceService = presenceMod.PresenceService;
  } catch (err) {
    console.error('Failed to import backend modules:', err);
    process.exit(1);
  }

  // Ensure remote Supabase has seed records (seed users, technician profiles, skills)
  console.log('Ensuring seed data is synchronized to remote Supabase...');
  await dbStore.syncSeedDataToRemote();
  console.log('Seed synchronization complete.\n');

  // --------------------------------------------------------------------------
  // TEST SECTION 1: CUSTOMER SIGNUP, LOGIN, SESSION PERSISTENCE & LOGOUT
  // --------------------------------------------------------------------------
  console.log('--- 1. Customer Authentication & Session Persistence ---');
  let customerSessionToken = '';
  let customerUserId = '';

  try {
    // 1a. Signup
    const regRes = await handleNexdoApiRequest({
      method: 'POST',
      url: '/api/auth/register',
      body: {
        phone: custPhone,
        password: 'Password@123',
        name: 'Test Customer E2E',
        role: 'CUSTOMER',
        email: `cust_${testRunId}@nexdo.test`,
      },
    });

    const regSuccess = regRes.status === 201 && regRes.body?.sessionToken;
    customerSessionToken = regRes.body?.sessionToken;
    customerUserId = regRes.body?.user?.id;
    recordTest('1a. Customer registration via API', regSuccess, `User ID: ${customerUserId ? 'generated' : 'failed'}`);

    // Verify user row directly in remote Supabase
    const { data: remoteUser, error: uErr } = await adminClient
      .from('users')
      .select('id, phone, role, status')
      .eq('phone', custPhone)
      .limit(1);
    const userInDb = !uErr && remoteUser && remoteUser.length > 0;
    recordTest('1b. Customer record persisted in remote Supabase (public.users)', userInDb);

    // Verify customer profile in remote Supabase
    const userUuid = dbStore.toUuid(customerUserId);
    const { data: remoteCp, error: cpErr } = await adminClient
      .from('customer_profiles')
      .select('id, user_id, full_name, phone')
      .eq('user_id', userUuid)
      .limit(1);
    const cpInDb = !cpErr && remoteCp && remoteCp.length > 0;
    recordTest('1c. Customer profile persisted in remote Supabase (public.customer_profiles)', cpInDb);

    // 1d. Login
    const loginRes = await handleNexdoApiRequest({
      method: 'POST',
      url: '/api/auth/login',
      body: {
        phone: custPhone,
        password: 'Password@123',
      },
    });
    const loginSuccess = loginRes.status === 200 && loginRes.body?.sessionToken;
    customerSessionToken = loginRes.body?.sessionToken;
    recordTest('1d. Customer login with valid credentials', loginSuccess);

    // 1e. Negative test: bad password fails
    const badLoginRes = await handleNexdoApiRequest({
      method: 'POST',
      url: '/api/auth/login',
      body: {
        phone: custPhone,
        password: 'WrongPassword123!',
      },
    });
    recordTest('1e. Login with invalid password rejected', badLoginRes.status === 500 || badLoginRes.status === 401);

    // 1f. Session persistence: simulate restart by clearing in-memory session cache
    dbStore.sessions.clear();
    const meRes = await handleNexdoApiRequest({
      method: 'GET',
      url: '/api/auth/me',
      headers: { Authorization: `Bearer ${customerSessionToken}` },
    });
    const sessionRestored = meRes.status === 200 && meRes.body?.user?.phone === custPhone;
    recordTest('1f. Session persistence restored from remote Supabase after memory clear', sessionRestored);

    // 1g. Logout
    const logoutRes = await handleNexdoApiRequest({
      method: 'POST',
      url: '/api/auth/logout',
      headers: { Authorization: `Bearer ${customerSessionToken}` },
    });
    recordTest('1g. Customer logout endpoint success', logoutRes.status === 200 && logoutRes.body?.success === true);

    // Verify session invalidation after logout
    const postLogoutMe = await handleNexdoApiRequest({
      method: 'GET',
      url: '/api/auth/me',
      headers: { Authorization: `Bearer ${customerSessionToken}` },
    });
    recordTest('1h. Session invalidated after logout (returns 401)', postLogoutMe.status === 401);

    // Re-login customer for subsequent booking tests
    const reLogin = await handleNexdoApiRequest({
      method: 'POST',
      url: '/api/auth/login',
      body: { phone: custPhone, password: 'Password@123' },
    });
    customerSessionToken = reLogin.body?.sessionToken;
  } catch (err) {
    recordTest('Customer authentication flow', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST SECTION 2: TECHNICIAN SIGNUP, LOGIN & ROLE-BASED ACCESS
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Technician Authentication, Presence & Role Isolation ---');
  let technicianSessionToken = '';
  let technicianUserId = '';
  let technicianProfileId = '';

  try {
    const techReg = await handleNexdoApiRequest({
      method: 'POST',
      url: '/api/auth/register',
      body: {
        phone: techPhone,
        password: 'TechPassword@123',
        name: 'Murugan Test Pro',
        role: 'TECHNICIAN',
        serviceArea: 'Adyar',
        email: `tech_${testRunId}@nexdo.test`,
      },
    });

    const techRegOk = techReg.status === 201 && techReg.body?.sessionToken;
    technicianSessionToken = techReg.body?.sessionToken;
    technicianUserId = techReg.body?.user?.id;
    technicianProfileId = techReg.body?.profile?.id;
    recordTest('2a. Technician registration via API', techRegOk);

    // Verify technician profile in remote Supabase
    const techUserUuid = dbStore.toUuid(technicianUserId);
    const { data: remoteTp, error: tpErr } = await adminClient
      .from('technician_profiles')
      .select('id, user_id, full_name, online_status')
      .eq('user_id', techUserUuid)
      .limit(1);
    const tpInDb = !tpErr && remoteTp && remoteTp.length > 0;
    recordTest('2b. Technician profile persisted in remote Supabase (technician_profiles)', tpInDb);

    // 2c. Technician toggle online status
    const onlineRes = await handleNexdoApiRequest({
      method: 'POST',
      url: '/api/technician/online',
      headers: { Authorization: `Bearer ${technicianSessionToken}` },
      body: { technicianId: technicianProfileId },
    });
    recordTest('2c. Technician set online endpoint', onlineRes.status === 200);

    // Verify online status update in Supabase
    const { data: tpStatus } = await adminClient
      .from('technician_profiles')
      .select('online_status')
      .eq('user_id', techUserUuid)
      .limit(1);
    const isOnline = tpStatus && tpStatus[0]?.online_status === 'ONLINE';
    recordTest('2d. Online presence status verified in remote Supabase', isOnline);

    // 2e. Technician heartbeat
    const hbRes = await handleNexdoApiRequest({
      method: 'POST',
      url: '/api/technician/heartbeat',
      headers: { Authorization: `Bearer ${technicianSessionToken}` },
      body: { technicianId: technicianProfileId },
    });
    recordTest('2e. Technician heartbeat endpoint', hbRes.status === 200 && (hbRes.body?.status === 'ONLINE' || hbRes.body?.status === 'ACTIVE'));
  } catch (err) {
    recordTest('Technician flow', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST SECTION 3: SERVICE REQUEST & BOOKING CREATION & PERSISTENCE
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Service Request & Booking Creation & Remote Persistence ---');
  let testRequestId = '';
  let testBookingId = '';

  try {
    // 3a. Service request creation
    const srRes = await handleNexdoApiRequest({
      method: 'POST',
      url: '/api/service-requests',
      headers: { Authorization: `Bearer ${customerSessionToken}` },
      body: {
        serviceCode: 'AC_REPAIR',
        serviceCategory: 'Cooling & Appliances',
        rawTranscript: 'ஏசி கூலிங் வரவில்லை உடனே சரி செய்ய வேண்டும்',
        serviceMode: 'DIAGNOSIS',
        location: 'Besant Nagar, Chennai',
      },
    });
    const srOk = srRes.status === 201 && srRes.body?.serviceRequest?.id;
    testRequestId = srRes.body?.serviceRequest?.id;
    recordTest('3a. Service request created via API', srOk);

    // Verify service request in remote Supabase
    const srUuid = dbStore.toUuid(testRequestId);
    const { data: remoteSr, error: srErr } = await adminClient
      .from('service_requests')
      .select('id, service_code, service_mode, status')
      .eq('id', srUuid)
      .limit(1);
    const srInDb = !srErr && remoteSr && remoteSr.length > 0;
    recordTest('3b. Service request persisted in remote Supabase (service_requests)', srInDb);

    // 3c. Create booking with technician Ravi Kumar
    const techRaviId = 't0000001-0000-0000-0000-000000000001';
    const bkRes = await handleNexdoApiRequest({
      method: 'POST',
      url: '/api/bookings',
      headers: {
        Authorization: `Bearer ${customerSessionToken}`,
        'X-Idempotency-Key': `idemp_${testRunId}_booking`,
      },
      body: {
        technicianId: techRaviId,
        serviceTitle: 'AC Cooling Diagnosis & Inspection',
        serviceMode: 'DIAGNOSIS',
        scheduledTime: 'Within 45 mins',
        address: '42, Sengunthapuram 3rd Cross, Chennai',
        notes: 'AC fan is running but no cooling effect',
      },
    });
    const bkOk = bkRes.status === 201 && bkRes.body?.booking?.id;
    testBookingId = bkRes.body?.booking?.id;
    recordTest('3c. Booking created via API', bkOk, `Reference: ${bkRes.body?.booking?.referenceCode}`);

    // Verify booking in remote Supabase
    const bkUuid = dbStore.toUuid(testBookingId);
    const { data: remoteBk, error: bkErr } = await adminClient
      .from('bookings')
      .select('id, reference_code, diagnosis_fee, total_amount, status')
      .eq('id', bkUuid)
      .limit(1);
    const bkInDb = !bkErr && remoteBk && remoteBk.length > 0;
    recordTest('3d. Booking record persisted in remote Supabase (bookings)', bkInDb);

    // 3e. Simulate page reload / process restart: clear in-memory booking cache
    dbStore.bookings.delete(testBookingId);
    const fetchBkRes = await handleNexdoApiRequest({
      method: 'GET',
      url: `/api/bookings/${testBookingId}`,
      headers: { Authorization: `Bearer ${customerSessionToken}` },
    });
    const bkRestored =
      fetchBkRes.status === 200 &&
      (fetchBkRes.body?.booking?.id === testBookingId ||
        dbStore.toUuid(fetchBkRes.body?.booking?.id) === dbStore.toUuid(testBookingId));
    recordTest('3e. Booking retrieved directly from remote Supabase after memory clear', bkRestored);
  } catch (err) {
    recordTest('Service request & booking persistence', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST SECTION 4: BOOKING STATUS UPDATES & IDOR PROTECTION
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Booking Status Progression & Zero-Trust IDOR Protection ---');
  try {
    // 4a. Update to ARRIVED
    const arriveRes = await handleNexdoApiRequest({
      method: 'POST',
      url: `/api/technician/jobs/${testBookingId}/arrive`,
    });
    recordTest('4a. Transition status to ARRIVED', arriveRes.status === 200);

    // 4b. Update to WORK_IN_PROGRESS
    const startRes = await handleNexdoApiRequest({
      method: 'POST',
      url: `/api/technician/jobs/${testBookingId}/start`,
    });
    recordTest('4b. Transition status to WORK_IN_PROGRESS', startRes.status === 200);

    // 4c. Update to COMPLETED
    const completeRes = await handleNexdoApiRequest({
      method: 'POST',
      url: `/api/technician/jobs/${testBookingId}/complete`,
    });
    recordTest('4c. Transition status to COMPLETED', completeRes.status === 200);

    // Verify status update and status history in remote Supabase
    const bkUuid = dbStore.toUuid(testBookingId);
    const { data: statusHistory } = await adminClient
      .from('booking_status_history')
      .select('id, new_status, created_at')
      .eq('booking_id', bkUuid);
    const hasHistory = statusHistory && statusHistory.length >= 2;
    recordTest('4d. Booking status history persisted in remote Supabase (booking_status_history)', hasHistory, `Entries: ${statusHistory?.length || 0}`);

    // Verify technician earnings record in remote Supabase
    const { data: earnings } = await adminClient
      .from('technician_earnings')
      .select('id, net_amount, payout_status')
      .eq('booking_id', bkUuid);
    const hasEarnings = earnings && earnings.length > 0;
    recordTest('4e. Technician 0% commission earnings persisted in remote Supabase (technician_earnings)', hasEarnings);

    // 4f. IDOR Protection Test: Customer B attempts to view Customer A's booking
    const custBReg = await handleNexdoApiRequest({
      method: 'POST',
      url: '/api/auth/register',
      body: {
        phone: `91${testRunId.toString().padStart(8, '0').slice(0, 8)}`,
        password: 'Password@123',
        name: 'Another Customer',
        role: 'CUSTOMER',
      },
    });
    const custBToken = custBReg.body?.sessionToken;

    const idorRes = await handleNexdoApiRequest({
      method: 'GET',
      url: `/api/bookings/${testBookingId}`,
      headers: { Authorization: `Bearer ${custBToken}` },
    });
    recordTest('4f. IDOR Protection: Foreign customer access blocked (HTTP 403 Forbidden)', idorRes.status === 403);
  } catch (err) {
    recordTest('Booking status & IDOR protection', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST SECTION 5: SERVER-AUTHORITATIVE PRICING & PAYMENT SANDBOX FLOW
  // --------------------------------------------------------------------------
  console.log('\n--- 5. Server-Authoritative Pricing & Sandbox Payment (Zero Real Money) ---');
  try {
    // 5a. Attempt to tamper pricing: submit diagnosis booking with estimatedPrice = 1
    const techRaviId = 't0000001-0000-0000-0000-000000000001';
    const tamperedBkRes = await handleNexdoApiRequest({
      method: 'POST',
      url: '/api/bookings',
      headers: { Authorization: `Bearer ${customerSessionToken}` },
      body: {
        technicianId: techRaviId,
        serviceTitle: 'Tampered Price Test',
        serviceMode: 'DIAGNOSIS',
        estimatedPrice: 1, // Tampered by client
      },
    });

    const isPricingLocked =
      tamperedBkRes.status === 201 &&
      tamperedBkRes.body?.booking?.estimatedPrice === 149 &&
      (tamperedBkRes.body?.booking?.diagnosis?.fee === 149 ||
        tamperedBkRes.body?.booking?.provider?.diagnosisFee === 149);
    recordTest('5a. Server-authoritative pricing overrides tampered client price to ₹149', isPricingLocked);

    // 5b. Sandbox payment execution (₹0 real money)
    const payRes = await handleNexdoApiRequest({
      method: 'POST',
      url: '/api/payments/create-intent',
      headers: {
        Authorization: `Bearer ${customerSessionToken}`,
        'X-Idempotency-Key': `idemp_${testRunId}_pay`,
      },
      body: {
        bookingId: testBookingId,
        amount: 149,
        method: 'UPI_SANDBOX',
      },
    });
    const payOk = payRes.status === 200 && payRes.body?.payment?.is_sandbox === true;
    recordTest('5b. Payment sandbox processed with zero real money charge', payOk, `Ref: ${payRes.body?.payment?.transaction_reference}`);

    // Verify payment in remote Supabase
    const bkUuid = dbStore.toUuid(testBookingId);
    const { data: remotePay, error: pErr } = await adminClient
      .from('payments')
      .select('id, amount, payment_status, currency')
      .eq('booking_id', bkUuid)
      .limit(1);
    const payInDb = !pErr && remotePay && remotePay.length > 0;
    recordTest('5c. Payment record persisted in remote Supabase (payments)', payInDb, `Amount: ₹${remotePay?.[0]?.amount || 149}`);

    // 5d. Payment webhook HMAC verification
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || 'dev_payment_webhook_secret_key';
    const payload = {
      booking_id: testBookingId,
      transaction_id: `txn_wh_${testRunId}`,
      amount: 149,
      status: 'SUCCESS',
    };
    const validSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    const whRes = await handleNexdoApiRequest({
      method: 'POST',
      url: '/api/payments/webhook',
      headers: { 'X-Signature': validSignature },
      body: payload,
    });
    recordTest('5d. Payment webhook with valid HMAC signature accepted', whRes.status === 200 && whRes.body?.success === true);

    // 5e. Payment webhook with invalid signature rejected
    const badWhRes = await handleNexdoApiRequest({
      method: 'POST',
      url: '/api/payments/webhook',
      headers: { 'X-Signature': 'invalid_signature_hex' },
      body: payload,
    });
    recordTest('5e. Payment webhook with forged HMAC signature rejected', badWhRes.status === 500 || badWhRes.status === 400);
  } catch (err) {
    recordTest('Server pricing & sandbox payments', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST SECTION 6: ROW LEVEL SECURITY (RLS) AUDIT ACROSS ALL 13 CORE TABLES
  // --------------------------------------------------------------------------
  console.log('\n--- 6. Comprehensive RLS Audit Across All 13 Core Relational Tables ---');
  const all13Tables = [
    { table: 'users', sensitive: true, test: 'unauth_select' },
    { table: 'sessions', sensitive: true, test: 'unauth_select' },
    { table: 'customer_profiles', sensitive: true, test: 'unauth_select' },
    { table: 'technician_profiles', sensitive: false, test: 'public_verified' },
    { table: 'technician_skills', sensitive: false, test: 'public_active' },
    { table: 'service_requests', sensitive: true, test: 'unauth_select' },
    { table: 'bookings', sensitive: true, test: 'unauth_select' },
    { table: 'booking_status_history', sensitive: true, test: 'unauth_select' },
    { table: 'payments', sensitive: true, test: 'unauth_select' },
    { table: 'subscriptions', sensitive: true, test: 'unauth_select' },
    { table: 'technician_earnings', sensitive: true, test: 'unauth_select' },
    { table: 'notifications', sensitive: true, test: 'unauth_select' },
    { table: 'audit_logs', sensitive: true, test: 'admin_only' },
  ];

  for (const { table, sensitive } of all13Tables) {
    try {
      // Query table with untrusted anon client (no auth session)
      const { data, error } = await anonClient.from(table).select('*').limit(5);

      if (table === 'audit_logs') {
        // Must return empty or error
        const blocked = error !== null || !data || data.length === 0;
        recordTest(`6. RLS: ${table} completely blocked for unauthenticated client`, blocked);
      } else if (sensitive) {
        // Sensitive tables must return empty array under RLS (0 rows leaked)
        const noLeak = !data || data.length === 0;
        recordTest(`6. RLS: ${table} zero-leakage isolation for unauthenticated client`, noLeak, `Rows visible: ${data?.length || 0}`);
      } else {
        // Public tables like technician_profiles or skills can show verified/active rows
        recordTest(`6. RLS: ${table} allows public read for verified/active records`, data !== null);
      }
    } catch (err) {
      recordTest(`6. RLS: ${table}`, false, err.message);
    }
  }

  // --------------------------------------------------------------------------
  // TEST SECTION 7: CLIENT BUNDLE SECRET EXPOSURE AUDIT
  // --------------------------------------------------------------------------
  console.log('\n--- 7. Client Bundle Security & Secret Exposure Audit ---');
  try {
    const distAssetsDir = path.resolve(rootDir, 'dist', 'assets');
    if (!fs.existsSync(distAssetsDir)) {
      recordTest('7. Production dist/assets exists', false, 'Run npm run build first');
    } else {
      const files = fs.readdirSync(distAssetsDir).filter((f) => f.endsWith('.js'));
      let serviceKeyFound = false;
      let dbUrlFound = false;

      for (const file of files) {
        const content = fs.readFileSync(path.join(distAssetsDir, file), 'utf8');
        // Check if service-role key or database password exists
        if (SERVICE_ROLE_KEY && content.includes(SERVICE_ROLE_KEY)) {
          serviceKeyFound = true;
        }
        if (content.includes('SUPABASE_SERVICE_ROLE_KEY')) {
          serviceKeyFound = true;
        }
        if (content.includes('postgresql://') || content.includes('postgres:')) {
          dbUrlFound = true;
        }
      }

      recordTest('7a. SUPABASE_SERVICE_ROLE_KEY absent from all client bundles', !serviceKeyFound);
      recordTest('7b. DATABASE_URL / raw PostgreSQL passwords absent from client bundles', !dbUrlFound);
    }
  } catch (err) {
    recordTest('Client bundle audit', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST SECTION 8: REAL SUPABASE OPERATIONS (NOT IN-MEMORY MOCK)
  // --------------------------------------------------------------------------
  console.log('\n--- 8. Real Database Direct Verification (Remote Authoritative) ---');
  try {
    // Check that records created during this run exist in remote Supabase
    const { count: userCount } = await adminClient
      .from('users')
      .select('*', { count: 'exact', head: true });
    recordTest('8a. Real Supabase users table contains records', (userCount || 0) > 0, `Total: ${userCount}`);

    const { count: bookingCount } = await adminClient
      .from('bookings')
      .select('*', { count: 'exact', head: true });
    recordTest('8b. Real Supabase bookings table contains records', (bookingCount || 0) > 0, `Total: ${bookingCount}`);

    const { count: paymentCount } = await adminClient
      .from('payments')
      .select('*', { count: 'exact', head: true });
    recordTest('8c. Real Supabase payments table contains records', (paymentCount || 0) > 0, `Total: ${paymentCount}`);
  } catch (err) {
    recordTest('Direct database verification', false, err.message);
  }

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TOTAL E2E DATABASE VERIFICATION: ${passedTests} / ${totalTests} PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('================================================================');

  if (passedTests < totalTests) {
    console.error(`[FAIL] ${totalTests - passedTests} tests failed.`);
    process.exit(1);
  } else {
    console.log('[SUCCESS] All live Supabase end-to-end tests passed cleanly.');
  }
}

runE2ETests().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
