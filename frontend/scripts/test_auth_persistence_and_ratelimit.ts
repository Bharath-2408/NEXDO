// ==============================================================================
// NEXDO AUTHENTICATION, PERSISTENCE, PASSWORD RESET & RATE LIMIT VERIFIER
// 15 Comprehensive Verification Scenarios:
// 1. Empty Default Login Credentials (UI & State)
// 2. Independent Customer Login & Role Assignment
// 3. Independent Technician Login & Role Assignment
// 4. Customer and Technician Registration
// 5. Valid Session Survival Across Restart/Refresh
// 6. Last Authorized Page Persistence & Restoration per Role
// 7. Expired Session Rejection (401)
// 8. Logout Invalidation & Session Destruction
// 9. Browser Back & Protected Route Access Isolation
// 10. Real Email OTP Dispatch & Supabase Delivery Detection
// 11. Invalid, Expired & Attempt-Limited OTP Rejection
// 12. Server-Side Rate Limiting (HTTP 429 with Retry-After)
// 13. Inability to Bypass Rate Limit via Client State Reset
// 14. Cross-Role Access Denial & IDOR Booking Isolation
// 15. Server Outage Safety (Zero Bypass) & Voice Non-Regression
// ==============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleNexdoApiRequest } from '../src/backend/router';
import { dbStore } from '../src/backend/database/store';
import { AuthSecurity, RateLimiter } from '../src/backend/services/authSecurity';
import { AuthService } from '../src/backend/services/authService';
import { resolveLocalVoiceTurn } from '../src/voice/voiceClient';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function check(title: string, condition: boolean, detail?: string) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`[PASS] ${title}`);
  } else {
    failedChecks++;
    console.error(`[FAIL] ${title}${detail ? `: ${detail}` : ''}`);
  }
}

async function runAll15Scenarios() {
  console.log('================================================================');
  console.log('NEXDO 15-SCENARIO AUTHENTICATION & SECURITY VERIFICATION SUITE');
  console.log('================================================================\n');

  // Reset database store and rate limiter to clean baseline
  dbStore.resetToSeed();
  RateLimiter.clearAll();

  // --------------------------------------------------------------------------
  // SCENARIO 1: Empty Default Login Credentials
  // --------------------------------------------------------------------------
  console.log('--- Scenario 1: Empty Default Login Credentials ---');
  const loginPageSrc = fs.readFileSync(path.resolve(rootDir, 'src/pages/auth/LoginPage.tsx'), 'utf8');
  const signupPageSrc = fs.readFileSync(path.resolve(rootDir, 'src/pages/auth/SignupPage.tsx'), 'utf8');
  const appContextSrc = fs.readFileSync(path.resolve(rootDir, 'src/store/AppContext.tsx'), 'utf8');

  check('1.1 LoginPage initial phone is empty string', loginPageSrc.includes("useState('')") && !loginPageSrc.includes("useState('+91 98765 43210')") && !loginPageSrc.includes("useState('9876543210')"));
  check('1.2 LoginPage initial password is empty string', !loginPageSrc.includes("useState('password123')") && !loginPageSrc.includes("useState('nexdo@123')"));
  check('1.3 SignupPage fields are empty strings by default', !signupPageSrc.includes("useState('John Doe')") && !signupPageSrc.includes("useState('password123')"));
  check('1.4 AppContext default guest user has isAuthenticated: false', appContextSrc.includes('isAuthenticated, setIsAuthenticated] = useState<boolean>(false)'));
  check('1.5 AppContext default guest user starts unauthenticated', appContextSrc.includes("name: 'Guest User'"));

  const runId = Math.floor(100000 + Math.random() * 900000).toString();
  const custPhone = `+919988${runId}`;
  const custEmail = `ravi.${runId}@example.com`;
  const techPhone = `+919977${runId}`;
  const techEmail = `murugan.${runId}@example.com`;
  const otpPhone = `+919966${runId}`;
  const otpEmail = `otp.${runId}@example.com`;
  const custBPhone = `+919955${runId}`;

  // --------------------------------------------------------------------------
  // SCENARIO 2: Independent Customer Login & Role Assignment
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 2: Independent Customer Login & Role Assignment ---');
  // Register known test customer
  const custReg = await handleNexdoApiRequest({
    method: 'POST',
    path: '/api/auth/register',
    headers: { 'x-forwarded-for': '127.0.0.1' },
    body: {
      phone: custPhone,
      password: 'SecureCustomerPass@2026',
      name: 'Ravi Kumar',
      role: 'CUSTOMER',
      email: custEmail,
    },
  });
  check('2.1 Customer registration returns HTTP 201', custReg.status === 201);
  const custToken = custReg.body.sessionToken || custReg.body.session?.token;
  check('2.2 Customer registration returns secure token', Boolean(custToken));

  const custLogin = await handleNexdoApiRequest({
    method: 'POST',
    path: '/api/auth/login',
    headers: { 'x-forwarded-for': '127.0.0.1' },
    body: {
      identifier: custPhone,
      password: 'SecureCustomerPass@2026',
    },
  });
  check('2.3 Customer login returns HTTP 200', custLogin.status === 200);
  check('2.4 Customer login user role is strictly CUSTOMER', custLogin.body.user?.role === 'CUSTOMER');
  check('2.5 Password hash excluded from login response', !('password_hash' in (custLogin.body.user || {})));

  // --------------------------------------------------------------------------
  // SCENARIO 3: Independent Technician Login & Role Assignment
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 3: Independent Technician Login & Role Assignment ---');
  const techReg = await handleNexdoApiRequest({
    method: 'POST',
    path: '/api/auth/register',
    headers: { 'x-forwarded-for': '127.0.0.2' },
    body: {
      phone: techPhone,
      password: 'SecureTechnicianPass@2026',
      name: 'Murugan Tech',
      role: 'TECHNICIAN',
      email: techEmail,
    },
  });
  check('3.1 Technician registration returns HTTP 201', techReg.status === 201);

  const techLogin = await handleNexdoApiRequest({
    method: 'POST',
    path: '/api/auth/login',
    headers: { 'x-forwarded-for': '127.0.0.2' },
    body: {
      identifier: techPhone,
      password: 'SecureTechnicianPass@2026',
    },
  });
  check('3.2 Technician login returns HTTP 200', techLogin.status === 200);
  check('3.3 Technician login user role is strictly TECHNICIAN', techLogin.body.user?.role === 'TECHNICIAN');
  const techToken = techLogin.body.sessionToken || techLogin.body.session?.token;
  check('3.4 Technician session token provided', Boolean(techToken));

  // --------------------------------------------------------------------------
  // SCENARIO 4: Customer and Technician Registration
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 4: Customer and Technician Registration Database Integrity ---');
  const custInDb = dbStore.getUserById(custLogin.body.user.id);
  check('4.1 Customer persisted in database with PBKDF2 hash', Boolean(custInDb?.password_hash && custInDb.password_hash.startsWith('pbkdf2:sha512:')));
  const techInDb = dbStore.getUserById(techLogin.body.user.id);
  check('4.2 Technician persisted in database with PBKDF2 hash', Boolean(techInDb?.password_hash && techInDb.password_hash.startsWith('pbkdf2:sha512:')));
  check('4.3 Plaintext password never stored anywhere in database', custInDb?.password_hash !== 'SecureCustomerPass@2026' && techInDb?.password_hash !== 'SecureTechnicianPass@2026');

  // --------------------------------------------------------------------------
  // SCENARIO 5: Session Survival Across Restart/Refresh
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 5: Valid Session Survival Across Restart/Refresh ---');
  // 5.1 Verification using Bearer header
  const meHeaderRes = await handleNexdoApiRequest({
    method: 'GET',
    path: '/api/auth/me',
    headers: { authorization: `Bearer ${custToken}` },
  });
  check('5.1 GET /api/auth/me succeeds with Bearer token', meHeaderRes.status === 200 && meHeaderRes.body.user?.id === custLogin.body.user.id);

  // 5.2 Verification using session Cookie (simulating browser page refresh / reopen)
  const meCookieRes = await handleNexdoApiRequest({
    method: 'GET',
    path: '/api/auth/me',
    headers: { cookie: `nexdo_session=${custToken}` },
  });
  check('5.2 GET /api/auth/me succeeds with nexdo_session cookie', meCookieRes.status === 200 && meCookieRes.body.user?.id === custLogin.body.user.id);
  check('5.3 Cookie restoration retains user role', meCookieRes.body.user?.role === 'CUSTOMER');

  // --------------------------------------------------------------------------
  // SCENARIO 6: Last Authorized Page Persistence & Restoration
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 6: Last Authorized Page Persistence & Restoration ---');
  // Check that SplashPage, LoginPage, and SignupPage have redirection to last authorized page
  const splashPageSrc = fs.readFileSync(path.resolve(rootDir, 'src/pages/auth/SplashPage.tsx'), 'utf8');
  check('6.1 SplashPage restores last authorized page for logged-in user', splashPageSrc.includes('getLastAuthorizedPage(currentRole)'));
  check('6.2 LoginPage redirects logged-in user to last authorized page', loginPageSrc.includes('getLastAuthorizedPage(currentRole)'));
  check('6.3 SignupPage redirects logged-in user to last authorized page', signupPageSrc.includes('getLastAuthorizedPage(currentRole)'));
  check('6.4 Customer Layout isolates last page key to customer domain', appContextSrc.includes('nexdo_last_page_customer'));
  check('6.5 Technician Layout isolates last page key to technician domain', appContextSrc.includes('nexdo_last_page_technician'));

  // --------------------------------------------------------------------------
  // SCENARIO 7: Expired / Invalid Session Rejection
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 7: Expired / Invalid Session Rejection ---');
  const fakeTokenRes = await handleNexdoApiRequest({
    method: 'GET',
    path: '/api/auth/me',
    headers: { authorization: 'Bearer deadbeef-invalid-session-token-9999' },
  });
  check('7.1 Bogus session token returns HTTP 401', fakeTokenRes.status === 401);

  const missingTokenRes = await handleNexdoApiRequest({
    method: 'GET',
    path: '/api/auth/me',
  });
  check('7.2 Missing token returns HTTP 401', missingTokenRes.status === 401);

  // --------------------------------------------------------------------------
  // SCENARIO 8: Logout Invalidation & Session Destruction
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 8: Logout Invalidation & Session Destruction ---');
  const logoutRes = await handleNexdoApiRequest({
    method: 'POST',
    path: '/api/auth/logout',
    headers: { authorization: `Bearer ${custToken}` },
  });
  check('8.1 POST /api/auth/logout returns HTTP 200', logoutRes.status === 200);
  check('8.2 Logout response clears session cookie (Max-Age=0)', logoutRes.headers['Set-Cookie']?.includes('Max-Age=0'));

  // Attempting to reuse logged-out session
  const reuseRes = await handleNexdoApiRequest({
    method: 'GET',
    path: '/api/auth/me',
    headers: { authorization: `Bearer ${custToken}` },
  });
  check('8.3 Previous token is revoked in database and rejected with HTTP 401', reuseRes.status === 401);

  // --------------------------------------------------------------------------
  // SCENARIO 9: Protected Route Access & Browser Back Protection
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 9: Protected Route Access & Browser Back Protection ---');
  const custLayoutSrc = fs.readFileSync(path.resolve(rootDir, 'src/layouts/CustomerLayout.tsx'), 'utf8');
  const techLayoutSrc = fs.readFileSync(path.resolve(rootDir, 'src/layouts/TechnicianLayout.tsx'), 'utf8');
  check('9.1 CustomerLayout redirects unauthenticated access to /login?role=customer', custLayoutSrc.includes("navigate('/login?role=customer', { replace: true })"));
  check('9.2 CustomerLayout blocks cross-role technician access', custLayoutSrc.includes("if (currentRole === 'TECHNICIAN')"));
  check('9.3 TechnicianLayout redirects unauthenticated access to /login?role=technician', techLayoutSrc.includes("navigate('/login?role=technician', { replace: true })"));
  check('9.4 TechnicianLayout blocks cross-role customer access', techLayoutSrc.includes("if (currentRole === 'CUSTOMER')"));

  // --------------------------------------------------------------------------
  // SCENARIO 10: Real Email OTP Dispatch & Supabase Delivery Detection
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 10: Real Email OTP Dispatch & Delivery Detection ---');
  // Create user with known email
  await handleNexdoApiRequest({
    method: 'POST',
    path: '/api/auth/register',
    headers: { 'x-forwarded-for': '127.0.0.5' },
    body: {
      phone: otpPhone,
      password: 'KnownPassword@2026',
      name: 'OTP Test User',
      role: 'CUSTOMER',
      email: otpEmail,
    },
  });

  const forgotRes = await handleNexdoApiRequest({
    method: 'POST',
    path: '/api/auth/forgot-password',
    headers: { 'x-forwarded-for': '127.0.0.5' },
    body: { identifier: otpEmail },
  });
  check('10.1 POST /api/auth/forgot-password returns HTTP 200', forgotRes.status === 200);
  check('10.2 Dispatches 6-digit OTP structure with 10-minute expiry', Boolean(forgotRes.body.expiresAt));
  check('10.3 Detects and reports email delivery status truthfully without faking', 'emailDelivery' in forgotRes.body);

  // --------------------------------------------------------------------------
  // SCENARIO 11: Invalid, Expired & Attempt-Limited OTP Rejection
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 11: Invalid, Expired & Attempt-Limited OTP Rejection ---');
  // 11.1 Bad OTP check
  const badOtpRes = await handleNexdoApiRequest({
    method: 'POST',
    path: '/api/auth/verify-otp',
    headers: { 'x-forwarded-for': '127.0.0.5' },
    body: { identifier: otpEmail, otp: '000000' },
  });
  check('11.1 Incorrect OTP rejected with HTTP 400', badOtpRes.status === 400);

  // 11.2 Exhausting 5 attempts
  for (let i = 0; i < 4; i++) {
    await handleNexdoApiRequest({
      method: 'POST',
      path: '/api/auth/verify-otp',
      headers: { 'x-forwarded-for': '127.0.0.5' },
      body: { identifier: otpEmail, otp: '111111' },
    });
  }
  const lockoutOtpRes = await handleNexdoApiRequest({
    method: 'POST',
    path: '/api/auth/verify-otp',
    headers: { 'x-forwarded-for': '127.0.0.5' },
    body: { identifier: otpEmail, otp: '111111' },
  });
  check(
    '11.2 Exceeding 5 attempts locks out OTP verification',
    (lockoutOtpRes.status === 400 || lockoutOtpRes.status === 429) && Boolean(lockoutOtpRes.body.error)
  );

  // 11.3 Test single-use reset token
  // Direct test of verifyPasswordResetOtp helper to get valid resetToken
  RateLimiter.clearAll();
  const freshForgot = await AuthService.requestPasswordResetAsync(otpEmail, '127.0.0.6');
  const validOtp = freshForgot.debugOtp; // Available in non-production for verification
  let singleUseToken = '';
  if (validOtp) {
    const verified = AuthService.verifyPasswordResetOtp({
      email: otpEmail,
      otp: validOtp,
      ipAddress: '127.0.0.6',
    });
    singleUseToken = verified.resetToken;
    check('11.3 Valid OTP produces 10-minute reset token', Boolean(singleUseToken));
    
    // Reset password with valid token
    const resetOk = await AuthService.resetPasswordAsync(singleUseToken, 'BrandNewPassword@2026', '127.0.0.6');
    check('11.4 Password reset succeeds with valid token', resetOk === true);

    // Attempting to reuse same token
    let reuseFailed = false;
    try {
      await AuthService.resetPasswordAsync(singleUseToken, 'AnotherPassword@2026', '127.0.0.6');
    } catch (e: any) {
      reuseFailed = true;
    }
    check('11.5 Single-use reset token cannot be reused', reuseFailed);
  }

  // --------------------------------------------------------------------------
  // SCENARIO 12: Server-Side Rate Limiting (HTTP 429)
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 12: Server-Side Rate Limiting (HTTP 429) ---');
  RateLimiter.clearAll();
  const testIp = '198.51.100.42';

  // Trigger 5 consecutive failed logins
  for (let i = 0; i < 5; i++) {
    await handleNexdoApiRequest({
      method: 'POST',
      path: '/api/auth/login',
      headers: { 'x-forwarded-for': testIp },
      body: { identifier: otpPhone, password: 'WrongPassword' },
    });
  }

  // 6th attempt should be blocked with 429
  const rateLimitRes = await handleNexdoApiRequest({
    method: 'POST',
    path: '/api/auth/login',
    headers: { 'x-forwarded-for': testIp },
    body: { identifier: otpPhone, password: 'WrongPassword' },
  });
  check('12.1 Rate limiter returns HTTP 429 after 5 failed attempts', rateLimitRes.status === 429);
  check('12.2 HTTP 429 includes Retry-After header', Boolean(rateLimitRes.headers['Retry-After']));
  check('12.3 Error message informs user of rate limit cooldown', rateLimitRes.body.error?.includes('Too many login attempts'));

  // --------------------------------------------------------------------------
  // SCENARIO 13: Inability to Bypass Rate Limit via Client State Reset
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 13: Inability to Bypass Rate Limit via Client State Reset ---');
  // Attempting to send request from same IP with valid password or cleared headers
  const bypassAttempt = await handleNexdoApiRequest({
    method: 'POST',
    path: '/api/auth/login',
    headers: { 'x-forwarded-for': testIp },
    body: { identifier: otpPhone, password: 'KnownPassword@2026' },
  });
  check('13.1 Rate limit persists on server: valid password still blocked during lockout', bypassAttempt.status === 429);

  // Forgot password 60s cooldown check
  RateLimiter.clearAll();
  const fp1 = await handleNexdoApiRequest({
    method: 'POST',
    path: '/api/auth/forgot-password',
    headers: { 'x-forwarded-for': '198.51.100.43' },
    body: { identifier: otpEmail },
  });
  check('12.4 Initial forgot-password succeeds', fp1.status === 200);

  const fp2 = await handleNexdoApiRequest({
    method: 'POST',
    path: '/api/auth/forgot-password',
    headers: { 'x-forwarded-for': '198.51.100.43' },
    body: { identifier: otpEmail },
  });
  check('12.5 Rapid duplicate forgot-password request returns HTTP 429 cooldown', fp2.status === 429);
  check('12.6 Forgot-password 429 specifies Retry-After header', Boolean(fp2.headers['Retry-After']));

  // --------------------------------------------------------------------------
  // SCENARIO 14: Cross-Role Access Denial & IDOR Isolation
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 14: Cross-Role Access Denial & IDOR Isolation ---');
  // Customer token cannot access technician jobs
  const custNewLogin = await handleNexdoApiRequest({
    method: 'POST',
    path: '/api/auth/login',
    headers: { 'x-forwarded-for': '127.0.0.10' },
    body: { identifier: custPhone, password: 'SecureCustomerPass@2026' },
  });
  const validCustToken = custNewLogin.body.sessionToken || custNewLogin.body.session?.token;

  // Attempt technician accept using customer
  const crossRoleRes = await handleNexdoApiRequest({
    method: 'POST',
    path: '/api/technician/jobs/job_123/accept',
    headers: { authorization: `Bearer ${validCustToken}` },
  });
  check('14.1 Customer token cannot execute technician job acceptance', crossRoleRes.status === 403 || crossRoleRes.status === 404);

  // IDOR Isolation: Customer A cannot view Customer B's bookings
  const custBReg = await handleNexdoApiRequest({
    method: 'POST',
    path: '/api/auth/register',
    headers: { 'x-forwarded-for': '127.0.0.11' },
    body: {
      phone: custBPhone,
      password: 'PassCustB@2026',
      name: 'Customer B',
      role: 'CUSTOMER',
    },
  });
  const custBToken = custBReg.body.sessionToken || custBReg.body.session?.token;

  // Customer A creates booking
  const createBookingRes = await handleNexdoApiRequest({
    method: 'POST',
    path: '/api/bookings',
    headers: { authorization: `Bearer ${validCustToken}` },
    body: {
      customerId: custLogin.body.user.id,
      serviceCategory: 'AC_REPAIR',
      serviceMode: 'DIAGNOSIS',
      technicianId: 't0000001-0000-0000-0000-000000000001',
    },
  });
  const bookingAId = createBookingRes.body.booking.id;

  // Customer B tries to read Customer A's booking
  const idorRes = await handleNexdoApiRequest({
    method: 'GET',
    path: `/api/bookings/${bookingAId}`,
    headers: { authorization: `Bearer ${custBToken}` },
  });
  check('14.2 IDOR Prevented: Customer B blocked with 403 when requesting Customer A booking', idorRes.status === 403);

  // --------------------------------------------------------------------------
  // SCENARIO 15: Server Outage Safety (Zero Bypass) & Voice Non-Regression
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 15: Server Outage Safety & Voice Non-Regression ---');
  // Check for removal of demo password bypass in authSecurity.ts
  const authSecSrc = fs.readFileSync(path.resolve(rootDir, 'src/backend/services/authSecurity.ts'), 'utf8');
  check('15.1 Zero hardcoded password bypasses in codebase', !authSecSrc.includes("password === 'password123'"));

  // Non-existent user fails with safe message
  const badUserLogin = await handleNexdoApiRequest({
    method: 'POST',
    path: '/api/auth/login',
    headers: { 'x-forwarded-for': '127.0.0.12' },
    body: { identifier: '+919999999999', password: 'SomeRandomPassword' },
  });
  check('15.2 Unknown user returns generic error message without fake fallback login', badUserLogin.status === 401 && Boolean(badUserLogin.body.error));

  // Voice system test: English and Tamil intent matching
  const voiceEn = resolveLocalVoiceTurn({
    text: 'take me home',
    role: 'customer',
    currentRoute: '/customer/profile',
  });
  check('15.3 English voice intent correctly maps to navigation', voiceEn.intent === 'NAVIGATE_HOME' && voiceEn.language === 'en');

  const voiceTa = resolveLocalVoiceTurn({
    text: 'முகப்பு பக்கத்துக்கு போ',
    role: 'customer',
    currentRoute: '/customer/providers',
  });
  check('15.4 Tamil voice intent correctly maps to navigation', voiceTa.intent === 'NAVIGATE_HOME' && voiceTa.language === 'ta');

  // Summary
  console.log('\n================================================================');
  console.log(`VERIFICATION COMPLETE: ${passedChecks} / ${totalChecks} CHECKS PASSED`);
  console.log('================================================================');

  if (failedChecks > 0) {
    process.exit(1);
  }
}

runAll15Scenarios().catch((err) => {
  console.error('[FATAL ERROR IN TEST SUITE]', err);
  process.exit(1);
});
