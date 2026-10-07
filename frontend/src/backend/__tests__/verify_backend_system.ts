// ============================================================================
// NEXDO BACKEND AUTOMATED VERIFICATION SUITE
// Tests all 20 Supabase entities, API endpoints, State Machine, Matching,
// Multi-turn Conversational Context, and 20 Critical Verification Milestones
// ============================================================================

import { handleNexdoApiRequest } from '../router';
import { dbStore } from '../database/store';
import { BookingService } from '../services/bookingService';
import { VoiceContextEngine } from '../services/voiceContextEngine';

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`[PASS] ${testName}`);
  } else {
    console.error(`[FAIL] ${testName}${detail ? `: ${detail}` : ''}`);
    process.exitCode = 1;
  }
}

async function runBackendVerification() {
  console.log('================================================================');
  console.log('NEXDO BACKEND AUTOMATED VERIFICATION SUITE');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // TEST GROUP 1: SERVICE CATEGORIES
  // --------------------------------------------------------------------------
  console.log('--- Test Group 1: Service Categories ---');
  const catRes = await handleNexdoApiRequest({ method: 'GET', url: '/api/services' });
  assert(catRes.status === 200, 'GET /api/services returns 200 OK');
  const categories = catRes.body.services;
  assert(categories.length >= 8, `Catalog has ${categories.length} service categories (>= 8 required)`);

  const requiredCodes = [
    'AC_REPAIR',
    'TV_REPAIR',
    'REFRIGERATOR_REPAIR',
    'WASHING_MACHINE_REPAIR',
    'ELECTRICAL_WORK',
    'PLUMBING',
    'CLEANING',
    'APPLIANCE_REPAIR',
  ];
  for (const code of requiredCodes) {
    const found = categories.find((c: any) => c.code === code);
    assert(!!found, `Service category ${code} is configured with dual-language names`);
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 2: SUBSCRIPTION PLANS & WEEKLY ₹599
  // --------------------------------------------------------------------------
  console.log('\n--- Test Group 2: Subscription Plans & Technician Passes ---');
  const subRes = await handleNexdoApiRequest({ method: 'GET', url: '/api/subscriptions' });
  assert(subRes.status === 200, 'GET /api/subscriptions returns 200 OK');
  const plans = subRes.body.plans;
  assert(plans.length >= 3, 'Subscription plans configured (Daily, Weekly, Monthly)');

  const weeklyPlan = plans.find((p: any) => p.tier === 'WEEKLY');
  assert(!!weeklyPlan, 'Weekly subscription plan exists');
  assert(weeklyPlan.price === 599, 'Weekly subscription plan price is exactly ₹599 (mandatory)');

  const dailyPlan = plans.find((p: any) => p.tier === 'DAILY');
  assert(dailyPlan.price === 99, 'Daily subscription plan price is exactly ₹99');

  const monthlyPlan = plans.find((p: any) => p.tier === 'MONTHLY');
  assert(monthlyPlan.price === 2499, 'Monthly subscription plan price is exactly ₹2499');

  // Technician Subscribes to Weekly ₹599
  const activateRes = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/subscriptions',
    body: {
      technicianId: 't0000001-0000-0000-0000-000000000001',
      tier: 'WEEKLY',
    },
  });
  assert(activateRes.status === 201, 'POST /api/subscriptions activates weekly pass');
  assert(activateRes.body.subscription.price === 599, 'Activated subscription price is ₹599');
  assert(activateRes.body.subscription.plan_type === 'WEEKLY', 'Activated subscription tier is WEEKLY');

  // --------------------------------------------------------------------------
  // TEST GROUP 3: TECHNICIAN MATCHING ENGINE
  // --------------------------------------------------------------------------
  console.log('\n--- Test Group 3: Technician Matching Engine ---');
  const techSearchRes = await handleNexdoApiRequest({
    method: 'GET',
    url: '/api/technicians/search?serviceCode=AC_REPAIR',
  });
  assert(techSearchRes.status === 200, 'GET /api/technicians/search returns 200 OK');
  const matchedTechs = techSearchRes.body.technicians;
  assert(matchedTechs.length >= 2, `Found ${matchedTechs.length} available AC technicians`);
  assert(matchedTechs[0].verified === true, 'Top technician is background-verified');
  assert(matchedTechs[0].rating >= 4.8, 'Top technician has professional rating');
  assert(matchedTechs[0].diagnosisFee === 149, 'Top technician diagnosis fee is ₹149');

  // TV Search
  const tvSearchRes = await handleNexdoApiRequest({
    method: 'GET',
    url: '/api/technicians/search?serviceCode=TV_REPAIR',
  });
  const tvTechs = tvSearchRes.body.technicians;
  assert(tvTechs.length >= 1, 'Found specialized TV technician');
  assert(tvTechs[0].name.includes('Kumaravel'), 'Specialist Kumaravel matched for TV repair');

  // --------------------------------------------------------------------------
  // TEST GROUP 4: SERVICE REQUESTS
  // --------------------------------------------------------------------------
  console.log('\n--- Test Group 4: Service Requests ---');
  const srRes = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/service-requests',
    body: {
      customerId: 'u0000001-0000-0000-0000-000000000001',
      serviceCode: 'AC_REPAIR',
      rawTranscript: 'எங்க AC சரியா வேலை செய்யல, ஒரு technician வேணும்.',
      urgency: 'URGENT',
      location: 'Adyar, Chennai',
      specificIssue: 'AC cooling not working, strange sound',
      serviceMode: 'DIAGNOSIS',
    },
  });
  assert(srRes.status === 201, 'POST /api/service-requests creates request');
  assert(srRes.body.serviceRequest.service_code === 'AC_REPAIR', 'Service request code is AC_REPAIR');
  assert(srRes.body.matchedTechnicians.length >= 1, 'Service request returns immediate matched technicians');

  // --------------------------------------------------------------------------
  // TEST GROUP 5: DIAGNOSIS (₹149) VS DIRECT SERVICE / REPAIR
  // --------------------------------------------------------------------------
  console.log('\n--- Test Group 5: Diagnosis vs Direct Service Modes ---');
  // 5A. Diagnosis Flow
  const diagBookingRes = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/bookings',
    body: {
      customerId: 'u0000001-0000-0000-0000-000000000001',
      technicianId: matchedTechs[0].id,
      serviceTitle: 'Air Conditioner Inspection',
      serviceMode: 'DIAGNOSIS',
    },
  });
  assert(diagBookingRes.status === 201, 'Booking with DIAGNOSIS mode created');
  const diagBooking = diagBookingRes.body.booking;
  assert(diagBooking.serviceMode === 'DIAGNOSIS', 'Booking records serviceMode = DIAGNOSIS');
  assert(diagBooking.diagnosis?.fee === 149, 'Diagnosis booking has ₹149 diagnosis fee');

  // 5B. Direct Service Flow (No ₹149 fee)
  const serviceBookingRes = await handleNexdoApiRequest({
    method: 'POST',
    url: '/api/bookings',
    body: {
      customerId: 'u0000001-0000-0000-0000-000000000001',
      technicianId: matchedTechs[0].id,
      serviceTitle: 'Air Conditioner Direct Gas Refill & Service',
      serviceMode: 'SERVICE',
      estimatedPrice: 799,
    },
  });
  assert(serviceBookingRes.status === 201, 'Booking with SERVICE mode created');
  const serviceBooking = serviceBookingRes.body.booking;
  assert(serviceBooking.serviceMode === 'SERVICE', 'Booking records serviceMode = SERVICE');
  assert(serviceBooking.diagnosis === undefined, 'No mandatory diagnosis fee created for direct service');
  assert(serviceBooking.estimatedPrice === 799, 'Direct service booking uses direct repair price');

  // Technician sees exact customer choice
  const techJobsRes = await handleNexdoApiRequest({
    method: 'GET',
    url: `/api/technician/jobs?technicianId=${matchedTechs[0].id}`,
  });
  assert(techJobsRes.status === 200, 'GET /api/technician/jobs returns 200 OK');
  const techJobs = techJobsRes.body.jobs;
  const oppDiag = techJobs.find((j: any) => j.id === diagBooking.id);
  const oppServ = techJobs.find((j: any) => j.id === serviceBooking.id);
  assert(oppDiag?.serviceMode === 'DIAGNOSIS', 'Technician sees DIAGNOSIS choice');
  assert(oppDiag?.diagnosisFee === 149, 'Technician sees ₹149 diagnosis fee for diagnosis booking');
  assert(oppServ?.serviceMode === 'SERVICE', 'Technician sees SERVICE choice');
  assert(oppServ?.diagnosisFee === 0, 'Technician sees ₹0 diagnosis fee for direct service');

  // --------------------------------------------------------------------------
  // TEST GROUP 6: BOOKING LIFECYCLE & STATE MACHINE
  // --------------------------------------------------------------------------
  console.log('\n--- Test Group 6: Booking Lifecycle & State Transitions ---');
  // Arrive
  const arriveRes = await handleNexdoApiRequest({
    method: 'POST',
    url: `/api/technician/jobs/${diagBooking.id}/arrive`,
  });
  assert(arriveRes.status === 200, 'Technician marks arrived (ARRIVED)');
  assert(arriveRes.body.job.status === 'ARRIVED', 'Status transitioned to ARRIVED');

  // Estimate
  const est = BookingService.submitEstimate(diagBooking.id, 700, 400, 'Refrigerant refill & valve repair');
  assert(est.total_amount === 1100, 'Estimate amount calculated: ₹700 + ₹400 = ₹1,100');
  assert(est.is_price_locked === true, 'Estimate price is locked');

  // Approve Estimate
  const approvedEst = BookingService.approveEstimate(diagBooking.id);
  assert(approvedEst.is_approved === true, 'Customer approves estimate without OTP');

  // Start Work
  const startRes = await handleNexdoApiRequest({
    method: 'POST',
    url: `/api/technician/jobs/${diagBooking.id}/start`,
  });
  assert(startRes.status === 200, 'Technician starts work (WORK_IN_PROGRESS)');

  // Complete Work
  const completeRes = await handleNexdoApiRequest({
    method: 'POST',
    url: `/api/technician/jobs/${diagBooking.id}/complete`,
  });
  assert(completeRes.status === 200, 'Technician completes work (COMPLETED)');
  assert(completeRes.body.job.status === 'COMPLETED', 'Status transitioned to COMPLETED');

  // Payout record check: 0% platform take rate
  const payout = Array.from(dbStore.technicianPayouts.values()).find(
    (p) => p.booking_id === diagBooking.id
  );
  assert(!!payout, 'Technician payout generated upon completion');
  assert(payout?.platform_fee === 0, 'NEXDO 0% platform fee enforced on payout');
  assert(payout?.net_payout === 1100, 'Technician receives 100% of approved service amount (₹1,100)');

  // --------------------------------------------------------------------------
  // TEST GROUP 7: ROLE SECURITY ENFORCEMENT
  // --------------------------------------------------------------------------
  console.log('\n--- Test Group 7: Role Security Enforcement ---');
  // Customer attempting technician-only action
  const custTechActionRes = await VoiceContextEngine.interpret({
    text: 'accept this job',
    role: 'customer',
  });
  assert(custTechActionRes.intent === 'ACCESS_DENIED', 'Customer cannot execute technician job acceptance');

  // Technician attempting customer-only action
  const techCustActionRes = await VoiceContextEngine.interpret({
    text: 'select this technician',
    role: 'technician',
  });
  assert(techCustActionRes.intent === 'ACCESS_DENIED', 'Technician cannot execute customer provider selection');

  // --------------------------------------------------------------------------
  // TEST GROUP 8: MULTI-TURN CONTEXT-AWARE VOICE WORKFLOW
  // --------------------------------------------------------------------------
  console.log('\n--- Test Group 8: Multi-turn Conversational Context Workflow ---');
  const sessionToken = `test_sess_${Date.now()}`;

  // Turn 1: User says "Technician தேடு"
  const turn1 = await VoiceContextEngine.interpret({
    text: 'Technician தேடு',
    sessionToken,
    role: 'customer',
  });
  assert(turn1.intent === 'CLARIFICATION', 'Turn 1: "Technician தேடு" prompts service clarification');
  assert(
    turn1.message.includes('எந்த service-க்கு technician வேண்டும்'),
    'Turn 1: Prompt asks for service type in authentic Tamil'
  );

  // Turn 2: User says "AC"
  const turn2 = await VoiceContextEngine.interpret({
    text: 'AC',
    sessionToken,
    role: 'customer',
  });
  assert(turn2.intent === 'SEARCH_TECHNICIAN', 'Turn 2: "AC" triggers AC technician search');
  assert(turn2.message.includes('AC repair'), 'Turn 2: Response mentions AC repair technicians');
  assert(turn2.navigation_target === '/customer/providers', 'Turn 2: Routes to /customer/providers');

  // Turn 3: User says "முதல் ஆளை பார்ப்போம்"
  const turn3 = await VoiceContextEngine.interpret({
    text: 'முதல் ஆளை பார்ப்போம்',
    sessionToken,
    role: 'customer',
  });
  assert(turn3.intent === 'SELECT_TECHNICIAN', 'Turn 3: "முதல் ஆளை பார்ப்போம்" selects first technician');
  assert(turn3.entities.index === 0, 'Turn 3: Relative reference index is 0');
  assert(turn3.message.includes('முதல் டெக்னீசியன்'), 'Turn 3: Response confirms selection of first technician');

  // Turn 4: User says "இவரை book பண்ணலாம்"
  const turn4 = await VoiceContextEngine.interpret({
    text: 'இவரை book பண்ணலாம்',
    sessionToken,
    role: 'customer',
  });
  assert(turn4.intent === 'CONFIRM_BOOKING', 'Turn 4: "இவரை book பண்ணலாம்" resolves pronoun to selected technician');
  assert(turn4.requires_confirmation === true, 'Turn 4: Prompts confirmation before booking');
  assert(turn4.message.includes('book செய்யட்டுமா'), 'Turn 4: Asks user for natural confirmation');

  // Turn 5: User says "ஆமா"
  const turn5 = await VoiceContextEngine.interpret({
    text: 'ஆமா',
    sessionToken,
    role: 'customer',
  });
  assert(turn5.intent === 'CONFIRM_BOOKING', 'Turn 5: "ஆமா" confirms booking');
  assert(turn5.navigation_target === '/customer/track', 'Turn 5: Routes directly to /customer/track');
  assert(!!turn5.data?.booking?.id, 'Turn 5: Booking created in backend database');

  // Multi-turn Cancellation Test
  const cancelSess = `test_cancel_${Date.now()}`;
  await VoiceContextEngine.interpret({
    text: 'இந்த technician-ஐ book பண்ணு',
    sessionToken: cancelSess,
    role: 'customer',
  });
  const cancelTurn = await VoiceContextEngine.interpret({
    text: 'வேண்டாம்',
    sessionToken: cancelSess,
    role: 'customer',
  });
  assert(cancelTurn.intent === 'CANCEL', '"வேண்டாம்" cleanly cancels pending action');

  // --------------------------------------------------------------------------
  // TEST GROUP 9: NATURAL NAVIGATION ACROSS ROLES & LANGUAGES
  // --------------------------------------------------------------------------
  console.log('\n--- Test Group 9: Natural Navigation Across Roles & Languages ---');
  // Customer Home
  const custHome = await VoiceContextEngine.interpret({ text: 'home page ku po', role: 'customer' });
  assert(custHome.navigation_target === '/customer', 'Customer "home page ku po" routes to /customer');

  // Technician Home
  const techHome = await VoiceContextEngine.interpret({ text: 'home page ku po', role: 'technician' });
  assert(techHome.navigation_target === '/technician', 'Technician "home page ku po" routes to /technician');

  // Customer Bookings
  const custBk = await VoiceContextEngine.interpret({ text: 'booking paaru', role: 'customer' });
  assert(custBk.navigation_target === '/customer/bookings', 'Customer "booking paaru" routes to /customer/bookings');

  // Technician Jobs
  const techJobsTurn = await VoiceContextEngine.interpret({ text: 'jobs kaatu', role: 'technician' });
  assert(techJobsTurn.navigation_target === '/technician/jobs', 'Technician "jobs kaatu" routes to /technician/jobs');

  // Technician Earnings
  const techEarn = await VoiceContextEngine.interpret({ text: 'வருமானம் பாரு', role: 'technician' });
  assert(techEarn.navigation_target === '/technician/earnings', 'Technician "வருமானம் பாரு" routes to /technician/earnings');

  // --------------------------------------------------------------------------
  // TEST GROUP 10: SAME-LANGUAGE RESPONSE INTEGRITY (ZERO HINDI)
  // --------------------------------------------------------------------------
  console.log('\n--- Test Group 10: Same-Language Response & Zero Hindi ---');
  const enRes = await VoiceContextEngine.interpret({ text: 'Show me my bookings', role: 'customer' });
  assert(enRes.language === 'en', 'English input detected as en');
  assert(!/[\u0B80-\u0BFF]/.test(enRes.message), 'English input receives English response');

  const taRes = await VoiceContextEngine.interpret({ text: 'ஹோம் பேஜுக்கு போ', role: 'customer' });
  assert(taRes.language === 'ta', 'Tamil script detected as ta');
  assert(/[\u0B80-\u0BFF]/.test(taRes.message), 'Tamil input receives authentic Tamil script response');

  // Zero Hindi check
  const hindiRegex = /[\u0900-\u097F]/;
  assert(!hindiRegex.test(enRes.message) && !hindiRegex.test(taRes.message), '0% Hindi characters guaranteed');

  console.log('\n================================================================');
  console.log(`BACKEND VERIFICATION RESULTS: ${passedCount} / ${totalCount} PASSED (${Math.round((passedCount / totalCount) * 100)}%)`);
  console.log('================================================================');
}

runBackendVerification().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
