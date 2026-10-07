// ============================================================================
// NEXDO PRODUCTION SECURITY & AUTHENTICATION AUTOMATED VERIFICATION SUITE
// Tests PBKDF2-SHA512 password hashing, rate limiting, enumeration protection,
// IDOR access control, server-authoritative pricing, idempotency,
// HMAC webhook signatures, technician presence, and ACID transactions.
// ============================================================================

import { handleNexdoApiRequest } from '../router';
import { dbStore } from '../database/store';
import { AuthSecurity, RateLimiter } from '../services/authSecurity';
import { PresenceService } from '../services/presenceService';

let passed = 0;
let total = 0;

function assert(condition: boolean, title: string, detail?: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`[PASS] ${title}`);
  } else {
    console.error(`[FAIL] ${title}${detail ? `: ${detail}` : ''}`);
    process.exitCode = 1;
  }
}

async function runSecurityVerification() {
  console.log('================================================================');
  console.log('NEXDO PRODUCTION SECURITY & AUTHENTICATION TEST SUITE');
  console.log('================================================================\n');

  // Reset database store and rate limiter to pristine state
  dbStore.resetToSeed();
  RateLimiter.clearAll();

  // --------------------------------------------------------------------------
  // TEST GROUP 1: PASSWORD HASHING & CRYPTOGRAPHIC SECURITY
  // --------------------------------------------------------------------------
  console.log('--- Test Group 1: Cryptographic Password & Token Hashing ---');
  const rawPassword = 'SuperSecurePassword@2026';
  const hash = AuthSecurity.hashPassword(rawPassword);

  assert(
    hash.startsWith('pbkdf2:sha512:100000:'),
    'Password hashed using PBKDF2-SHA512 with 100,000 iterations'
  );
  assert(
    !hash.includes(rawPassword),
    'Plaintext password never present in stored hash'
  );
  assert(
    AuthSecurity.verifyPassword(rawPassword, hash) === true,
    'Valid password successfully verifies with timing-safe comparison'
  );
  assert(
    AuthSecurity.verifyPassword('WrongPassword123', hash) === false,
    'Invalid password safely rejected'
  );

  const token = AuthSecurity.generateSecureToken(32);
  const tokenHash = AuthSecurity.hashToken(token);
  assert(
    token.length === 64 && tokenHash.length === 64,
    '256-bit secure random token generated and SHA-256 hashed'
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 2: REAL USER REGISTRATION & AUTHENTICATION
  // --------------------------------------------------------------------------
  console.log('\n--- Test Group 2: User Registration & Safe Auth APIs ---');
  const regRes = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/register',
    body: {
      phone: '9840999888',
      password: 'StrongUserPass123',
      name: 'Anand Kumar',
      email: 'anand@example.com',
      role: 'CUSTOMER',
    },
  });

  assert(regRes.status === 201, 'POST /api/auth/register returns 201 Created');
  assert(!!regRes.body.user.id, 'User record created with unique ID');
  assert(
    regRes.body.user.password_hash === undefined,
    'password_hash strictly excluded from registration response'
  );
  assert(!!regRes.body.sessionToken, 'Secure session token returned upon registration');

  // Login with newly created user
  const loginRes = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/login',
    body: {
      phone: '9840999888',
      password: 'StrongUserPass123',
    },
  });

  assert(loginRes.status === 200, 'POST /api/auth/login succeeds for valid credentials');
  assert(
    loginRes.body.user.password_hash === undefined,
    'password_hash strictly excluded from login response'
  );
  const userToken = loginRes.body.sessionToken;

  // Session validation via GET /api/auth/me
  const meRes = await handleNexdoApiRequest({
    method: 'GET',
    url: '/api/auth/me',
    headers: { Authorization: `Bearer ${userToken}` },
  });
  assert(meRes.status === 200, 'GET /api/auth/me returns 200 for valid session');
  assert(meRes.body.user.phone === '9840999888', 'Authenticated user identity confirmed');

  // --------------------------------------------------------------------------
  // TEST GROUP 3: ACCOUNT ENUMERATION & BRUTE FORCE RATE LIMITING
  // --------------------------------------------------------------------------
  console.log('\n--- Test Group 3: Account Enumeration & Rate Limiting ---');
  // Unknown phone should return identical generic error
  const unkLogin = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/login',
    body: {
      phone: '9999900000',
      password: 'SomePassword123',
    },
  });
  assert(
    unkLogin.status === 500 && unkLogin.body.error === 'Invalid mobile number or password',
    'Account enumeration blocked: Unknown user returns generic error message'
  );

  // Wrong password on existing user
  const wrongPassLogin = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/login',
    body: {
      phone: '9840999888',
      password: 'IncorrectPassword',
    },
  });
  assert(
    wrongPassLogin.body.error === 'Invalid mobile number or password',
    'Wrong password returns identical generic error message'
  );

  // Trigger rate limiting with repeated failures
  let rateLimited = false;
  for (let i = 0; i < 6; i++) {
    const attempt = await handleNexdoApiRequest({
      method: 'POST',
      url: '/api/auth/login',
      body: { phone: '9840999888', password: 'BadPassword' },
    });
    if (attempt.body.error?.includes('Too many login attempts')) {
      rateLimited = true;
      break;
    }
  }
  assert(rateLimited, 'Brute-force protection: Rate limiter locks out after repeated login failures');

  // --------------------------------------------------------------------------
  // TEST GROUP 4: SESSION INVALIDATION ON LOGOUT & PASSWORD RESET
  // --------------------------------------------------------------------------
  console.log('\n--- Test Group 4: Session Invalidation on Logout & Password Reset ---');
  // Logout
  const logoutRes = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/logout',
    headers: { Authorization: `Bearer ${userToken}` },
  });
  assert(logoutRes.status === 200, 'POST /api/auth/logout succeeds');

  const meAfterLogout = await handleNexdoApiRequest({
    method: 'GET',
    url: '/api/auth/me',
    headers: { Authorization: `Bearer ${userToken}` },
  });
  assert(meAfterLogout.status === 401, 'Logged-out session immediately invalidated (401 Unauthorized)');

  // Password reset session invalidation
  RateLimiter.clearAll();
  const relogin = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/login',
    body: { phone: '9840999888', password: 'StrongUserPass123' },
  });
  const activeTokenBeforeReset = relogin.body.sessionToken;

  const resetReq = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/forgot-password',
    body: { phone: '9840999888' },
  });
  assert(resetReq.status === 200, 'POST /api/auth/forgot-password dispatches reset token');

  const resetConfirm = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/reset-password',
    body: { token: resetReq.body.resetToken, password: 'BrandNewPassword2026!' },
  });
  assert(resetConfirm.status === 200, 'POST /api/auth/reset-password succeeds');

  const meAfterReset = await handleNexdoApiRequest({
    method: 'GET',
    url: '/api/auth/me',
    headers: { Authorization: `Bearer ${activeTokenBeforeReset}` },
  });
  assert(
    meAfterReset.status === 401,
    'Password reset invalidates all existing sessions for the account'
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 5: AUTHORIZATION & IDOR PREVENTION
  // --------------------------------------------------------------------------
  console.log('\n--- Test Group 5: Zero-Trust Authorization & IDOR Protection ---');
  // Register Customer A & Customer B
  const custAReg = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/register',
    body: { phone: '9111111111', password: 'PasswordA123', name: 'Customer Alpha' },
  });
  const custAToken = custAReg.body.sessionToken;
  const custAId = custAReg.body.user.id;

  const custBReg = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/register',
    body: { phone: '9222222222', password: 'PasswordB123', name: 'Customer Beta' },
  });
  const custBToken = custBReg.body.sessionToken;

  // Customer A creates a booking
  const tech1 = Array.from(dbStore.technicianProfiles.values())[0];
  const bookingA = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/bookings',
    headers: { Authorization: `Bearer ${custAToken}` },
    body: {
      technicianId: tech1.id,
      serviceTitle: 'AC Inspection Alpha',
      scheduledTime: 'Tomorrow · 10:00 AM',
      serviceMode: 'DIAGNOSIS',
    },
  });
  assert(bookingA.status === 201, 'Customer A creates booking');
  const bookingAId = bookingA.body.booking.id;

  // Customer B attempts IDOR read of Customer A's booking by ID
  const idorRead = await handleNexdoApiRequest({
    method: 'GET',
    url: `/api/bookings/${bookingAId}`,
    headers: { Authorization: `Bearer ${custBToken}` },
  });
  assert(
    idorRead.status === 403,
    'IDOR Prevented: Customer B blocked with 403 Forbidden when accessing Customer A booking'
  );

  // Customer B attempts IDOR list with customerId query parameter
  const idorList = await handleNexdoApiRequest({
    method: 'GET',
    url: `/api/bookings?customerId=${custAId}`,
    headers: { Authorization: `Bearer ${custBToken}` },
  });
  assert(
    idorList.status === 403,
    'IDOR Prevented: Customer B blocked with 403 Forbidden when querying Customer A bookings list'
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 6: SERVER-AUTHORITATIVE PRICING ENFORCEMENT
  // --------------------------------------------------------------------------
  console.log('\n--- Test Group 6: Server-Authoritative Pricing ---');
  // Client attempts to tamper with diagnosis fee (e.g. sending estimatedPrice = ₹10)
  const tamperedDiagBooking = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/bookings',
    headers: { Authorization: `Bearer ${custAToken}` },
    body: {
      technicianId: tech1.id,
      serviceTitle: 'Tampered Diagnosis',
      scheduledTime: 'Tomorrow · 2:00 PM',
      serviceMode: 'DIAGNOSIS',
      estimatedPrice: 10, // Tampered price
    },
  });
  assert(
    tamperedDiagBooking.body.booking.diagnosis.fee === 149,
    'Server overrides tampered pricing: Diagnosis fee locked to ₹149'
  );
  assert(
    tamperedDiagBooking.body.booking.estimatedPrice === 149,
    'Server locks total estimated price to ₹149 for Diagnosis mode'
  );

  // Direct Service mode locks diagnosis fee to ₹0
  const directServBooking = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/bookings',
    headers: { Authorization: `Bearer ${custAToken}` },
    body: {
      technicianId: tech1.id,
      serviceTitle: 'Direct AC Repair',
      scheduledTime: 'Tomorrow · 6:00 PM',
      serviceMode: 'SERVICE',
      estimatedPrice: 799,
    },
  });
  assert(
    directServBooking.body.booking.serviceMode === 'SERVICE' &&
      directServBooking.body.booking.diagnosis === undefined,
    'Direct Service mode enforces ₹0 diagnosis fee'
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 7: IDEMPOTENCY & CONCURRENCY PROTECTION
  // --------------------------------------------------------------------------
  console.log('\n--- Test Group 7: Idempotency & Booking Concurrency ---');
  const idemKey = `idem_${Date.now()}`;
  const firstCall = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/bookings',
    headers: { Authorization: `Bearer ${custAToken}`, 'X-Idempotency-Key': idemKey },
    body: {
      technicianId: tech1.id,
      serviceTitle: 'Idempotency Test Booking',
      scheduledTime: 'Day After Tomorrow · 11:00 AM',
      serviceMode: 'DIAGNOSIS',
    },
  });
  const secondCall = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/bookings',
    headers: { Authorization: `Bearer ${custAToken}`, 'X-Idempotency-Key': idemKey },
    body: {
      technicianId: tech1.id,
      serviceTitle: 'Idempotency Test Booking Duplicate',
      scheduledTime: 'Day After Tomorrow · 11:00 AM',
      serviceMode: 'DIAGNOSIS',
    },
  });
  assert(
    firstCall.body.booking.id === secondCall.body.booking.id,
    'Idempotency Key prevents duplicate booking creation upon network retries'
  );

  // Concurrency conflict test: attempt to book the same technician for the exact same slot
  const conflictAttempt = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/bookings',
    headers: { Authorization: `Bearer ${custBToken}` },
    body: {
      technicianId: tech1.id,
      serviceTitle: 'Conflicting Booking Slot',
      scheduledTime: 'Day After Tomorrow · 11:00 AM',
      serviceMode: 'DIAGNOSIS',
    },
  });
  assert(
    conflictAttempt.status === 500 &&
      conflictAttempt.body.error?.includes('already booked'),
    'Concurrency conflict correctly rejected when technician is already booked for that slot'
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 8: PAYMENT WEBHOOK SIGNATURE & REPLAY PROTECTION
  // --------------------------------------------------------------------------
  console.log('\n--- Test Group 8: Webhook Cryptographic Verification & Replay Protection ---');
  const webhookSecret = 'test_webhook_hmac_secret_2026';
  process.env.PAYMENT_WEBHOOK_SECRET = webhookSecret;

  const validPayload = {
    booking_id: bookingAId,
    transaction_id: `txn_wh_${Date.now()}`,
    amount: 149,
    status: 'SUCCESS',
  };
  const validSignature = AuthSecurity.createHmacSignature(
    JSON.stringify(validPayload),
    webhookSecret
  );

  const whRes = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/payments/webhook',
    headers: { 'X-Signature': validSignature },
    body: validPayload,
  });
  assert(whRes.status === 200 && whRes.body.success === true, 'Valid payment webhook accepted');

  // Tampered payload with bad signature
  const badWhRes = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/payments/webhook',
    headers: { 'X-Signature': 'invalid_forged_signature_hex' },
    body: validPayload,
  });
  assert(
    badWhRes.status === 500 && badWhRes.body.error?.includes('signature'),
    'Tampered payment webhook rejected with invalid signature error'
  );

  // Duplicate webhook replay
  const replayWhRes = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/payments/webhook',
    headers: { 'X-Signature': validSignature },
    body: validPayload,
  });
  assert(
    replayWhRes.status === 200 && replayWhRes.body.alreadyProcessed === true,
    'Replay attack prevented: Duplicate webhook acknowledged without duplicate database records'
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 9: TECHNICIAN PRESENCE & HEARTBEAT TIMEOUT SWEEP
  // --------------------------------------------------------------------------
  console.log('\n--- Test Group 9: Technician Presence & Heartbeat Engine ---');
  const techOnlineRes = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/technician/online',
    body: { technicianId: tech1.id },
  });
  assert(
    techOnlineRes.body.technician.availability_status === 'ONLINE',
    'POST /api/technician/online transitions status to ONLINE'
  );

  // Fast-forward last_seen_at to simulate expired heartbeat
  tech1.last_seen_at = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const sweptCount = PresenceService.sweepTimeouts(5 * 60 * 1000);
  assert(sweptCount >= 1, 'Automated timeout sweep detects expired heartbeat');
  assert(
    tech1.availability_status === 'OFFLINE',
    'Technician status automatically transitions to OFFLINE after heartbeat expiration'
  );

  // Manual offline toggle
  PresenceService.setOnline(tech1.id);
  const techOfflineRes = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/technician/offline',
    body: { technicianId: tech1.id },
  });
  assert(
    techOfflineRes.body.technician.availability_status === 'OFFLINE',
    'POST /api/technician/offline transitions status to OFFLINE'
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 10: ACID TRANSACTIONS & ROLLBACK INTEGRITY
  // --------------------------------------------------------------------------
  console.log('\n--- Test Group 10: ACID Transaction Simulation & Rollback ---');
  const userCountBefore = dbStore.users.size;
  dbStore.beginTransaction();

  // Insert candidate user
  const tempUserId = 'usr_temp_rollback_test';
  dbStore.users.set(tempUserId, {
    id: tempUserId,
    phone: '9777777777',
    password_hash: 'hash',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    email_verified: false,
    phone_verified: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  assert(dbStore.users.size === userCountBefore + 1, 'Transaction holds uncommitted insert');

  dbStore.rollback();
  assert(
    dbStore.users.size === userCountBefore && !dbStore.users.has(tempUserId),
    'Transaction rollback successfully restores pristine database state'
  );

  console.log('\n================================================================');
  console.log(`SECURITY VERIFICATION RESULTS: ${passed} / ${total} PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runSecurityVerification().catch((err) => {
  console.error('[FATAL] Security verification failed:', err);
  process.exit(1);
});
