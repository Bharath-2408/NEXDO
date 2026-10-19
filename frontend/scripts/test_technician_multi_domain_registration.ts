// ============================================================================
// NEXDO TECHNICIAN MULTI-DOMAIN REGISTRATION & MATCHING VERIFICATION
// ============================================================================

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { handleNexdoApiRequest } from '../src/backend/router';
import { dbStore } from '../src/backend/database/store';
import { SERVICE_DOMAINS } from '../src/constants/capabilities';
import { TechnicianMatchingService } from '../src/backend/services/technicianMatchingService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let passed = 0;
let failed = 0;

function check(title: string, condition: boolean, details?: string) {
  if (condition) {
    passed++;
    console.log(`[PASS] ${title}`);
  } else {
    failed++;
    console.error(`[FAIL] ${title}${details ? ` -> ${details}` : ''}`);
  }
}

async function runDomainVerification() {
  console.log('================================================================');
  console.log('NEXDO MULTI-DOMAIN REGISTRATION, 3-METHOD LOGIN & UI TEST SUITE');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // 1. Service Domains Catalog Verification
  // --------------------------------------------------------------------------
  console.log('--- Test Group 1: 9 Core Service Domains Catalog ---');
  check('1.1 Exactly 9 core service domains defined', SERVICE_DOMAINS.length === 9);

  const expectedCodes = [
    'ELECTRICAL',
    'PLUMBING',
    'AC_APPLIANCE_REPAIR',
    'CLEANING_HOME_MAINTENANCE',
    'BEAUTY_SALON',
    'TRANSPORT_CAB',
    'FOOD_GROCERY',
    'PERSONAL_ASSISTANCE',
    'OTHER',
  ];

  for (const code of expectedCodes) {
    const found = SERVICE_DOMAINS.find((d) => d.code === code);
    check(`1.2 Domain ${code} exists with English & Tamil metadata`, Boolean(found && found.name && found.nameTamil));
  }

  // --------------------------------------------------------------------------
  // 2. Customer Registration - Zero Domain Prompt + Email & Username
  // --------------------------------------------------------------------------
  console.log('\n--- Test Group 2: Customer Registration Isolation ---');
  const runId = Math.floor(100000 + Math.random() * 900000).toString();
  const noUserCustPhone = `9888${runId}`;
  const noUserCustEmail = `priya.${runId}@nexdo-test.in`;
  const noUserTechPhone = `9887${runId}`;
  const noUserTechEmail = `selvam.${runId}@nexdo-test.in`;
  const custPhone = `9888${runId}01`;
  const custEmail = `ananya.${runId}@nexdo-test.in`;
  const custUsername = `ananya_${runId}`;
  const custPassword = 'SecurePassword123!';

  const custRes = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/register',
    body: {
      phone: custPhone,
      email: custEmail,
      username: custUsername,
      password: custPassword,
      firstName: 'Ananya',
      lastName: 'Customer',
      name: 'Ananya Customer',
      role: 'CUSTOMER',
      // No serviceDomains passed
    },
  });

  check('2.1 Customer registers successfully without domains (HTTP 201)', custRes.status === 201);
  check('2.2 Customer role is strictly CUSTOMER', custRes.body.user?.role === 'CUSTOMER');
  check('2.3 Customer username persisted on user record', custRes.body.user?.username === custUsername);
  check('2.3b Customer first_name and last_name persisted on user record', custRes.body.user?.first_name === 'Ananya' && custRes.body.user?.last_name === 'Customer');

  const customerId = custRes.body.user?.id;
  const custSkills = Array.from(dbStore.technicianSkills.values()).filter(
    (s) => s.technician_id === customerId
  );
  check('2.4 No technician skills created for customer profile', custSkills.length === 0);

  // 2.5 Customer registers without providing username
  const custNoUserRes = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/register',
    body: {
      phone: noUserCustPhone,
      email: noUserCustEmail,
      password: 'SecurePassword123!',
      firstName: 'Priya',
      lastName: 'Dharshini',
      name: 'Priya Dharshini',
      role: 'CUSTOMER',
      // No username passed
    },
  });
  check('2.5 Customer registers successfully without providing username (HTTP 201)', custNoUserRes.status === 201);
  check('2.6 Customer record has null/empty username', custNoUserRes.body.user?.username === null || custNoUserRes.body.user?.username === undefined);

  // --------------------------------------------------------------------------
  // 3. Technician Multi-Domain Registration + Email & Username
  // --------------------------------------------------------------------------
  console.log('\n--- Test Group 3: Technician Multi-Domain Registration ---');
  const techPhone = `9888${runId}02`;
  const techEmail = `murugan.${runId}@nexdo-test.in`;
  const techUsername = `murugan_${runId}`;
  const techPassword = 'SecurePassword123!';
  const selectedDomains = ['ELECTRICAL', 'PLUMBING', 'AC_APPLIANCE_REPAIR'];

  const techRes = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/register',
    body: {
      phone: techPhone,
      email: techEmail,
      username: techUsername,
      password: techPassword,
      firstName: 'Murugan',
      lastName: 'Master Pro',
      name: 'Murugan Master Pro',
      role: 'TECHNICIAN',
      serviceArea: 'Adyar / Chennai',
      serviceDomains: selectedDomains,
    },
  });

  check('3.1 Technician multi-domain registration returns HTTP 201', techRes.status === 201);
  check('3.2 Technician user role is strictly TECHNICIAN', techRes.body.user?.role === 'TECHNICIAN');
  check('3.3 Technician username persisted on user record', techRes.body.user?.username === techUsername);
  check('3.3b Service Provider first_name and last_name persisted on user record', techRes.body.user?.first_name === 'Murugan' && techRes.body.user?.last_name === 'Master Pro');
  const techProfileId = techRes.body.profile?.id;
  check('3.4 Technician profile created', Boolean(techProfileId));

  // 3.5 Service Provider registers without providing username
  const techNoUserRes = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/register',
    body: {
      phone: noUserTechPhone,
      email: noUserTechEmail,
      password: 'SecurePassword123!',
      firstName: 'Selvam',
      lastName: 'Electrician',
      name: 'Selvam Electrician',
      role: 'TECHNICIAN',
      serviceArea: 'Guindy',
      serviceDomains: ['ELECTRICAL'],
      // No username passed
    },
  });
  check('3.5 Service Provider registers successfully without providing username (HTTP 201)', techNoUserRes.status === 201);
  check('3.5b Service Provider record has null/empty username', techNoUserRes.body.user?.username === null || techNoUserRes.body.user?.username === undefined);

  // Verify skills saved in database store
  const storedSkills = Array.from(dbStore.technicianSkills.values()).filter(
    (s) => s.technician_id === techProfileId
  );
  check('3.5 All 3 selected domains saved in technician_skills database', storedSkills.length === 3);

  for (const dom of selectedDomains) {
    const hasSkill = storedSkills.some((s) => s.skill_code === dom);
    check(`3.6 Domain ${dom} persisted in database skills table`, hasSkill);
  }

  // --------------------------------------------------------------------------
  // 4. Session Persistence & /api/auth/me Profile Restoration
  // --------------------------------------------------------------------------
  console.log('\n--- Test Group 4: Session Persistence of Domain Skills ---');
  const token = techRes.body.sessionToken;
  const meRes = await handleNexdoApiRequest({
    method: 'GET',
    url: '/api/auth/me',
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  check('4.1 GET /api/auth/me returns 200 for authenticated technician', meRes.status === 200);
  const returnedSkills = meRes.body.profile?.skills || [];
  check('4.2 Returned profile includes registered skills across sessions', returnedSkills.length === 3);

  // --------------------------------------------------------------------------
  // 5. Job Matching Engine Across Multiple Domains
  // --------------------------------------------------------------------------
  console.log('\n--- Test Group 5: Multi-Domain Job Matching ---');
  const electricalMatches = TechnicianMatchingService.searchTechnicians({
    serviceCode: 'ELECTRICAL_WORK',
    area: 'Adyar',
  });
  const muruganInElectrical = electricalMatches.some((p) => p.name.includes('Murugan'));
  check('5.1 Murugan matched for Electrical job request', muruganInElectrical);

  const plumbingMatches = TechnicianMatchingService.searchTechnicians({
    serviceCode: 'PLUMBING',
    area: 'Adyar',
  });
  const muruganInPlumbing = plumbingMatches.some((p) => p.name.includes('Murugan'));
  check('5.2 Murugan matched for Plumbing job request', muruganInPlumbing);

  const acMatches = TechnicianMatchingService.searchTechnicians({
    serviceCode: 'AC_REPAIR',
    area: 'Adyar',
  });
  const muruganInAC = acMatches.some((p) => p.name.includes('Murugan'));
  check('5.3 Murugan matched for AC Repair job request', muruganInAC);

  const beautyMatches = TechnicianMatchingService.searchTechnicians({
    serviceCode: 'BEAUTY_SALON',
    area: 'Adyar',
  });
  const muruganInBeauty = beautyMatches.some((p) => p.name.includes('Murugan'));
  check('5.4 Murugan NOT matched for Beauty & Salon (skill isolation enforced)', !muruganInBeauty);

  // --------------------------------------------------------------------------
  // 6. Zero Platform Commission & Subscription Rules
  // --------------------------------------------------------------------------
  console.log('\n--- Test Group 6: Business Rules Verification ---');
  const subRes = await handleNexdoApiRequest({
    method: 'GET',
    url: '/api/subscriptions',
  });
  check('6.1 Subscriptions API available', subRes.status === 200);
  const plans = subRes.body.plans || [];
  const daily = plans.find((p: any) => p.tier === 'DAILY' || p.type === 'DAILY');
  const weekly = plans.find((p: any) => p.tier === 'WEEKLY' || p.type === 'WEEKLY');
  const monthly = plans.find((p: any) => p.tier === 'MONTHLY' || p.type === 'MONTHLY');

  check('6.2 Daily Pass is ₹99', daily?.price === 99);
  check('6.3 Weekly Pass is ₹599', weekly?.price === 599);
  check('6.4 Monthly Pass is ₹2,499', monthly?.price === 2499);

  // --------------------------------------------------------------------------
  // 7. Three Login Methods (Mobile, Email, Username) & Role Isolation
  // --------------------------------------------------------------------------
  console.log('\n--- Test Group 7: 3-Method Login (Mobile, Email, Username) & Role Checks ---');

  // 7.1 Customer login by Mobile Number
  const custMobileLogin = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/login',
    body: {
      loginMethod: 'mobile',
      phone: custPhone,
      password: custPassword,
      expectedRole: 'CUSTOMER',
    },
  });
  check('7.1 Customer login by Mobile Number succeeds (HTTP 200)', custMobileLogin.status === 200);

  // 7.2 Customer login by Email Address
  const custEmailLogin = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/login',
    body: {
      loginMethod: 'email',
      email: custEmail.toUpperCase(), // case-insensitive check
      password: custPassword,
      expectedRole: 'CUSTOMER',
    },
  });
  check('7.2 Customer login by Email Address succeeds (HTTP 200)', custEmailLogin.status === 200);

  // 7.3 Customer login by Username
  const custUsernameLogin = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/login',
    body: {
      loginMethod: 'username',
      username: custUsername, // case-insensitive check
      password: custPassword,
      expectedRole: 'CUSTOMER',
    },
  });
  check('7.3 Customer login by Username succeeds (HTTP 200)', custUsernameLogin.status === 200);

  // 7.4 Technician login by Mobile Number
  const techMobileLogin = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/login',
    body: {
      loginMethod: 'mobile',
      phone: techPhone,
      password: techPassword,
      expectedRole: 'TECHNICIAN',
    },
  });
  check('7.4 Technician login by Mobile Number succeeds (HTTP 200)', techMobileLogin.status === 200);

  // 7.5 Technician login by Email Address
  const techEmailLogin = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/login',
    body: {
      loginMethod: 'email',
      email: techEmail,
      password: techPassword,
      expectedRole: 'TECHNICIAN',
    },
  });
  check('7.5 Technician login by Email Address succeeds (HTTP 200)', techEmailLogin.status === 200);

  // 7.6 Technician login by Username
  const techUsernameLogin = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/login',
    body: {
      loginMethod: 'username',
      username: techUsername,
      password: techPassword,
      expectedRole: 'TECHNICIAN',
    },
  });
  check('7.6 Technician login by Username succeeds (HTTP 200)', techUsernameLogin.status === 200);

  // 7.1b Customer login via Single Identifier Field (Mobile Number)
  const custUnifiedMobileLogin = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/login',
    body: {
      identifier: custPhone,
      password: custPassword,
      expectedRole: 'CUSTOMER',
    },
  });
  check('7.1b Customer login via Single Identifier Field (Mobile Number) succeeds (HTTP 200)', custUnifiedMobileLogin.status === 200);

  // 7.2b Customer login via Single Identifier Field (Email Address)
  const custUnifiedEmailLogin = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/login',
    body: {
      identifier: custEmail,
      password: custPassword,
      expectedRole: 'CUSTOMER',
    },
  });
  check('7.2b Customer login via Single Identifier Field (Email Address) succeeds (HTTP 200)', custUnifiedEmailLogin.status === 200);

  // 7.3b Customer login via Single Identifier Field (Username)
  const custUnifiedUserLogin = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/login',
    body: {
      identifier: custUsername,
      password: custPassword,
      expectedRole: 'CUSTOMER',
    },
  });
  check('7.3b Customer login via Single Identifier Field (Username) succeeds (HTTP 200)', custUnifiedUserLogin.status === 200);

  // 7.4b Technician login via Single Identifier Field (Mobile Number)
  const techUnifiedMobileLogin = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/login',
    body: {
      identifier: techPhone,
      password: techPassword,
      expectedRole: 'TECHNICIAN',
    },
  });
  check('7.4b Service Provider login via Single Identifier Field (Mobile Number) succeeds (HTTP 200)', techUnifiedMobileLogin.status === 200);

  // 7.5b Technician login via Single Identifier Field (Email Address)
  const techUnifiedEmailLogin = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/login',
    body: {
      identifier: techEmail,
      password: techPassword,
      expectedRole: 'TECHNICIAN',
    },
  });
  check('7.5b Service Provider login via Single Identifier Field (Email Address) succeeds (HTTP 200)', techUnifiedEmailLogin.status === 200);

  // 7.6b Technician login via Single Identifier Field (Username)
  const techUnifiedUserLogin = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/login',
    body: {
      identifier: techUsername,
      password: techPassword,
      expectedRole: 'TECHNICIAN',
    },
  });
  check('7.6b Service Provider login via Single Identifier Field (Username) succeeds (HTTP 200)', techUnifiedUserLogin.status === 200);

  // 7.6c Login for user registered WITHOUT username via Single Identifier Field
  const noUserMobileLogin = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/login',
    body: {
      identifier: noUserCustPhone,
      password: 'SecurePassword123!',
      expectedRole: 'CUSTOMER',
    },
  });
  check('7.6c Account created without username logs in via Mobile Number (HTTP 200)', noUserMobileLogin.status === 200);

  const noUserEmailLogin = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/login',
    body: {
      identifier: noUserCustEmail,
      password: 'SecurePassword123!',
      expectedRole: 'CUSTOMER',
    },
  });
  check('7.6d Account created without username logs in via Email Address (HTTP 200)', noUserEmailLogin.status === 200);

  // 7.7 Cross-role login blocked (Customer attempting Technician portal)
  const crossRoleCustToTech = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/login',
    body: {
      identifier: custPhone,
      password: custPassword,
      expectedRole: 'TECHNICIAN',
    },
  });
  check('7.7 Customer attempting Technician login rejected with HTTP 403', crossRoleCustToTech.status === 403);

  // 7.8 Cross-role login blocked (Technician attempting Customer portal)
  const crossRoleTechToCust = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/login',
    body: {
      identifier: techEmail,
      password: techPassword,
      expectedRole: 'CUSTOMER',
    },
  });
  check('7.8 Technician attempting Customer login rejected with HTTP 403', crossRoleTechToCust.status === 403);

  // 7.9 Wrong password rejected with HTTP 401
  const wrongPasswordLogin = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/login',
    body: {
      identifier: custPhone,
      password: 'WrongPassword999!',
      expectedRole: 'CUSTOMER',
    },
  });
  check('7.9 Wrong password rejected with HTTP 401', wrongPasswordLogin.status === 401);

  // 7.10 Unknown identifier rejected with HTTP 401
  const unknownIdLogin = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/login',
    body: {
      identifier: 'unknown_nonexistent_user',
      password: 'SomePassword123!',
      expectedRole: 'CUSTOMER',
    },
  });
  check('7.10 Unknown identifier rejected with HTTP 401', unknownIdLogin.status === 401);

  // --------------------------------------------------------------------------
  // 8. Public Home Page, Mandatory Home Button & Responsive Auth Layout
  // --------------------------------------------------------------------------
  console.log('\n--- Test Group 8: Public Home Page, Home Button & Responsive Auth UI ---');
  const rootDir = path.resolve(__dirname, '..');
  const splashSrc = fs.readFileSync(path.join(rootDir, 'src/pages/auth/SplashPage.tsx'), 'utf8');
  const authLayoutSrc = fs.readFileSync(path.join(rootDir, 'src/layouts/AuthLayout.tsx'), 'utf8');
  const loginPageSrc = fs.readFileSync(path.join(rootDir, 'src/pages/auth/LoginPage.tsx'), 'utf8');
  const signupPageSrc = fs.readFileSync(path.join(rootDir, 'src/pages/auth/SignupPage.tsx'), 'utf8');
  const forgotPageSrc = fs.readFileSync(path.join(rootDir, 'src/pages/auth/ForgotPasswordPage.tsx'), 'utf8');

  check(
    '8.1 SplashPage has exact Hero heading & description',
    splashSrc.includes('Every Service You Need,') &&
      splashSrc.includes(
        'Discover everyday services, connect with service providers, and manage your needs through one multilingual, voice-first platform.'
      )
  );
  check(
    '8.2 SplashPage includes FAQ section (#faq) and zero fabricated ratings',
    splashSrc.includes('id="faq"') && !splashSrc.includes('84 completed jobs')
  );
  check(
    '8.3 Mandatory Home button with Home icon present in AuthLayout, LoginPage, SignupPage, and ForgotPasswordPage',
    authLayoutSrc.includes('<Home') &&
      loginPageSrc.includes('<Home') &&
      signupPageSrc.includes('<Home') &&
      forgotPageSrc.includes('<Home')
  );
  check(
    '8.4 AuthLayout uses desktop/laptop responsive container max-w-[600px]',
    authLayoutSrc.includes('max-w-[600px]')
  );
  check(
    '8.5 LoginPage uses single unified identifier field (Mobile Number / Email Address / Username) with empty initial state',
    loginPageSrc.includes('Mobile Number / Email Address / Username') &&
      loginPageSrc.includes('placeholder="Enter mobile number, email, or username"') &&
      loginPageSrc.includes("const [identifier, setIdentifier] = useState('')") &&
      !loginPageSrc.includes('Sign In Method')
  );
  check(
    '8.6 Auth and landing pages use "Service Provider" terminology throughout',
    loginPageSrc.includes('Service Provider Login') &&
      signupPageSrc.includes('Service Provider Registration') &&
      splashSrc.includes('Service Provider')
  );

  // --------------------------------------------------------------------------
  // 9. Neutral Placeholders & Confirm Password Verification
  // --------------------------------------------------------------------------
  console.log('\n--- Test Group 9: Neutral Placeholders, First/Last Name & Confirm Password Validation ---');

  check(
    '9.1 Personal-name example placeholders removed from SignupPage',
    !signupPageSrc.includes('Ramesh Kannan') &&
      !signupPageSrc.includes('ramesh_kannan') &&
      !signupPageSrc.includes('ramesh@example.com')
  );

  check(
    '9.2 Neutral placeholders used across SignupPage fields without username',
    signupPageSrc.includes('placeholder="Enter your first name"') &&
      signupPageSrc.includes('placeholder="Enter your last name"') &&
      !signupPageSrc.includes('placeholder="Choose a username"') &&
      signupPageSrc.includes('placeholder="Enter your mobile number"') &&
      signupPageSrc.includes('placeholder="Enter your email address"') &&
      signupPageSrc.includes('placeholder="Enter your service area"') &&
      signupPageSrc.includes('placeholder="Create a password"') &&
      signupPageSrc.includes('placeholder="Confirm your password"')
  );

  check(
    '9.3 All registration fields (including firstName, lastName, password & confirmPassword) start empty by default without username state',
    signupPageSrc.includes("const [firstName, setFirstName] = useState('')") &&
      signupPageSrc.includes("const [lastName, setLastName] = useState('')") &&
      !signupPageSrc.includes("const [username, setUsername]") &&
      signupPageSrc.includes("const [password, setPassword] = useState('')") &&
      signupPageSrc.includes("const [confirmPassword, setConfirmPassword] = useState('')")
  );

  check(
    '9.4 Confirm Password field and inline "Passwords do not match." validation present in SignupPage',
    signupPageSrc.includes('label="Confirm Password"') &&
      signupPageSrc.includes('Passwords do not match.')
  );

  // 9.5 Empty fields rejected
  const emptyRegRes = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/register',
    body: {
      firstName: '',
      lastName: '',
      name: '',
      username: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role: 'TECHNICIAN',
    },
  });
  check('9.5 Empty registration fields rejected with HTTP 400', emptyRegRes.status === 400);

  // 9.6 Short / invalid password rejected
  const shortPassRes = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/register',
    body: {
      firstName: 'Valid',
      lastName: 'User',
      name: 'Valid User',
      phone: '9888800051',
      password: '123',
      confirmPassword: '123',
      role: 'CUSTOMER',
    },
  });
  check('9.6 Password shorter than 6 characters rejected with HTTP 400', shortPassRes.status === 400);

  // 9.7 Password and Confirm Password do not match
  const mismatchPassRes = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/register',
    body: {
      firstName: 'Valid',
      lastName: 'Provider',
      name: 'Valid Provider',
      phone: '9888800052',
      password: 'SecurePassword123!',
      confirmPassword: 'DifferentPassword123!',
      role: 'TECHNICIAN',
      serviceDomains: ['ELECTRICAL'],
    },
  });
  check(
    '9.7 Mismatched Password and Confirm Password rejected with HTTP 400 ("Passwords do not match.")',
    mismatchPassRes.status === 400 && mismatchPassRes.body?.error === 'Passwords do not match.'
  );

  // 9.8 Matching Password and Confirm Password succeeds and confirmPassword is never stored in DB
  const karthikPhone = `9888${Math.floor(100000 + Math.random() * 900000)}`;
  const karthikEmail = `karthik.${Date.now()}@nexdo-test.in`;
  const matchPassRes = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/auth/register',
    body: {
      firstName: 'Karthik',
      lastName: 'Provider',
      name: 'Karthik Provider',
      phone: karthikPhone,
      email: karthikEmail,
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!',
      role: 'TECHNICIAN',
      serviceArea: 'Tambaram',
      serviceDomains: ['ELECTRICAL', 'PLUMBING'],
    },
  });
  const storedKarthik = dbStore.getUserByPhone(karthikPhone) as any;
  check(
    '9.8 Matching Password and Confirm Password registers user (HTTP 201) without storing confirmPassword in DB',
    matchPassRes.status === 201 &&
      Boolean(storedKarthik) &&
      storedKarthik.first_name === 'Karthik' &&
      storedKarthik.last_name === 'Provider' &&
      !('confirmPassword' in storedKarthik) &&
      !('confirm_password' in storedKarthik)
  );

  // --------------------------------------------------------------------------
  // 10. Login Form Non-Persistence & Field Clearing Verification
  // --------------------------------------------------------------------------
  console.log('\n--- Test Group 10: Login Form Non-Persistence & Field Clearing ---');

  check(
    '10.1 LoginPage defines clearAllLoginFields resetting identifier, password, and showPassword',
    loginPageSrc.includes('const clearAllLoginFields') &&
      loginPageSrc.includes("setIdentifier('')") &&
      loginPageSrc.includes("setPassword('')") &&
      loginPageSrc.includes('setShowPassword(false)')
  );

  check(
    '10.2 LoginPage clears fields on open, navigation, and browser Back/Forward (pageshow/popstate)',
    loginPageSrc.includes("window.addEventListener('pageshow'") &&
      loginPageSrc.includes("window.addEventListener('popstate'") &&
      loginPageSrc.includes('location.key')
  );

  check(
    '10.3 LoginPage clears fields when switching Customer and Technician roles',
    loginPageSrc.includes("handleRoleChange('CUSTOMER')") &&
      loginPageSrc.includes("handleRoleChange('TECHNICIAN')")
  );

  check(
    '10.4 Separate sign-in method selector tabs removed from LoginPage',
    !loginPageSrc.includes('handleMethodChange') &&
      !loginPageSrc.includes('Sign In Method')
  );

  check(
    '10.5 LoginPage clears sensitive values on both failed login and successful login',
    loginPageSrc.includes('clearAllLoginFields(true)') &&
      loginPageSrc.includes('clearAllLoginFields(false)')
  );

  check(
    '10.6 LoginPage sets autoComplete="off" on identifiers/form and autoComplete="new-password" on password',
    loginPageSrc.includes('autoComplete="off"') &&
      loginPageSrc.includes('autoComplete="new-password"') &&
      !loginPageSrc.includes('autoComplete="current-password"')
  );

  check(
    '10.7 LoginPage never saves or reads login form fields in localStorage or sessionStorage',
    !loginPageSrc.includes('localStorage') && !loginPageSrc.includes('sessionStorage')
  );

  console.log('\n================================================================');
  console.log(`MULTI-DOMAIN & AUTH VERIFICATION SUMMARY: ${passed} / ${passed + failed} PASSED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runDomainVerification().catch((err) => {
  console.error('Fatal error during multi-domain test:', err);
  process.exit(1);
});
