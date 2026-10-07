import { resolveLocalVoiceTurn } from '../voiceClient';
import { dispatchCanonicalAction, ActionDispatcherDependencies } from '../actionDispatcher';

console.log('================================================================');
console.log('NEXDO VOICE SYSTEM AUTOMATED VERIFICATION SUITE');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] ${testName}`);
  } else {
    console.error(`[FAIL] ${testName}`);
    if (detail) console.error(`       Detail: ${detail}`);
  }
}

// TEST 1: Romanized Tamil "home page ku po"
{
  const res = resolveLocalVoiceTurn({
    text: 'home page ku po',
    role: 'customer',
    currentRoute: '/customer/bookings',
  });
  assert(res.language === 'ta', 'Test 1.1: Language is detected as "ta" for "home page ku po"');
  assert(res.intent === 'NAVIGATE_HOME', 'Test 1.2: Intent is NAVIGATE_HOME');
  assert(res.action.type === 'NAVIGATE_HOME', 'Test 1.3: Canonical action is NAVIGATE_HOME');
  assert(res.response === 'சரிங்க, ஹோம் பேஜுக்கு போறேன்.', 'Test 1.4: Natural Tamil response generated', `Got: ${res.response}`);
}

// TEST 2: English "take me home"
{
  const res = resolveLocalVoiceTurn({
    text: 'take me home',
    role: 'customer',
    currentRoute: '/customer/profile',
  });
  assert(res.language === 'en', 'Test 2.1: Language is detected as "en" for "take me home"');
  assert(res.intent === 'NAVIGATE_HOME', 'Test 2.2: Intent is NAVIGATE_HOME');
  assert(res.response === "Sure, taking you home.", 'Test 2.3: Natural English response generated', `Got: ${res.response}`);
}

// TEST 2b: Romanized Tamil "veetuku po"
{
  const res = resolveLocalVoiceTurn({
    text: 'veetuku po',
    role: 'customer',
    currentRoute: '/customer/bookings',
  });
  assert(res.language === 'ta', 'Test 2b.1: Language is detected as "ta" for "veetuku po"');
  assert(res.intent === 'NAVIGATE_HOME', 'Test 2b.2: Intent is NAVIGATE_HOME for "veetuku po"');
  assert(res.response === 'சரிங்க, ஹோம் பேஜுக்கு போறேன்.', 'Test 2b.3: Natural Tamil response for veetuku po');
}

// TEST 3: Pure Tamil Script "முகப்பு பக்கத்துக்கு போ"
{
  const res = resolveLocalVoiceTurn({
    text: 'முகப்பு பக்கத்துக்கு போ',
    role: 'customer',
    currentRoute: '/customer/providers',
  });
  assert(res.language === 'ta', 'Test 3.1: Language is detected as "ta" for Tamil script');
  assert(res.intent === 'NAVIGATE_HOME', 'Test 3.2: Intent is NAVIGATE_HOME');
  assert(res.response === 'சரிங்க, ஹோம் பேஜுக்கு போறேன்.', 'Test 3.3: Natural Tamil response generated');
}

// TEST 4: Customer Bookings "bookings kaatu"
{
  const res = resolveLocalVoiceTurn({
    text: 'bookings kaatu',
    role: 'customer',
    currentRoute: '/customer',
  });
  assert(res.language === 'ta', 'Test 4.1: Language detected as "ta"');
  assert(res.intent === 'NAVIGATE_BOOKINGS', 'Test 4.2: Intent is NAVIGATE_BOOKINGS');
  assert(res.response === 'சரி, உங்கள் புக்கிங்ஸை காட்டுறேன்.', 'Test 4.3: Natural Tamil response for bookings', `Got: ${res.response}`);
}

// TEST 5: Technician Jobs "jobs kaatu"
{
  const res = resolveLocalVoiceTurn({
    text: 'jobs kaatu',
    role: 'technician',
    currentRoute: '/technician',
  });
  assert(res.language === 'ta', 'Test 5.1: Language detected as "ta"');
  assert(res.intent === 'NAVIGATE_JOBS', 'Test 5.2: Intent is NAVIGATE_JOBS');
  assert(res.response === 'சரி, உங்கள் ஜாப்ஸை காட்டுறேன்.', 'Test 5.3: Natural Tamil response for jobs', `Got: ${res.response}`);
}

// TEST 6: Technician Earnings "earnings kaatu"
{
  const res = resolveLocalVoiceTurn({
    text: 'earnings kaatu',
    role: 'technician',
    currentRoute: '/technician',
  });
  assert(res.language === 'ta', 'Test 6.1: Language detected as "ta"');
  assert(res.intent === 'NAVIGATE_EARNINGS', 'Test 6.2: Intent is NAVIGATE_EARNINGS');
  assert(res.response === 'சரி, உங்கள் வருமானத்தை காட்டுகிறேன்.', 'Test 6.3: Natural Tamil response for earnings', `Got: ${res.response}`);
}

// TEST 7: Technician Capabilities "capabilities kaatu"
{
  const res = resolveLocalVoiceTurn({
    text: 'capabilities kaatu',
    role: 'technician',
    currentRoute: '/technician',
  });
  assert(res.intent === 'NAVIGATE_CAPABILITIES', 'Test 7.1: Intent is NAVIGATE_CAPABILITIES');
  assert(res.response === 'சரி, உங்க திறன்களை திறக்கிறேன்.', 'Test 7.2: Natural response for capabilities');
}

// TEST 8: Back Navigation "back po"
{
  const res = resolveLocalVoiceTurn({
    text: 'back po',
    role: 'customer',
    currentRoute: '/customer/express',
  });
  assert(res.language === 'ta', 'Test 8.1: Language detected as "ta" for "back po"');
  assert(res.intent === 'NAVIGATE_BACK', 'Test 8.2: Intent is NAVIGATE_BACK');
  assert(res.response === 'சரி, பின்னாடி போகலாம்.', 'Test 8.3: Natural Tamil back response', `Got: ${res.response}`);
}

// TEST 9: Service Need "enakku AC service venum"
{
  const res = resolveLocalVoiceTurn({
    text: 'enakku AC service venum',
    role: 'customer',
    currentRoute: '/customer',
  });
  assert(res.language === 'ta', 'Test 9.1: Language detected as "ta"');
  assert(res.intent === 'EXPRESS_NEED', 'Test 9.2: Intent is EXPRESS_NEED');
  assert(/[\u0B80-\u0BFF]/.test(res.response), 'Test 9.3: Response is written in authentic Tamil script');
  assert(!/successfully processed|robot/i.test(res.response), 'Test 9.4: No robotic canned phrasing');
}

// TEST 10: Multi-turn Language Persistence
{
  // Turn 1: Tamil input establishes conversationLanguage = 'ta'
  const t1 = resolveLocalVoiceTurn({
    text: 'enakku AC service venum',
    role: 'customer',
    currentRoute: '/customer',
    conversationLanguage: 'ta',
  });
  assert(t1.language === 'ta', 'Test 10.1: Turn 1 is Tamil');

  // Turn 2: Short neutral command with conversationLanguage = 'ta' should stay in 'ta'
  const t2 = resolveLocalVoiceTurn({
    text: 'bookings',
    role: 'customer',
    currentRoute: '/customer',
    conversationLanguage: 'ta',
  });
  assert(t2.language === 'ta', 'Test 10.2: Turn 2 maintains Tamil conversational context', `Got: ${t2.language}`);

  // Turn 3: Explicit English switches to 'en'
  const t3 = resolveLocalVoiceTurn({
    text: 'I need an electrician tomorrow',
    role: 'customer',
    currentRoute: '/customer/bookings',
    conversationLanguage: 'ta',
  });
  assert(t3.language === 'en', 'Test 10.3: Explicit English switches conversation to English');
}

// TEST 11: Action Dispatcher Navigation Routing
{
  let navigatedTo = '';

  const mockDeps = (role: 'customer' | 'technician'): ActionDispatcherDependencies => ({
    navigate: ((path: any) => {
      navigatedTo = String(path);
    }) as any,
    role,
    showToast: ((_msg: string) => {}) as any,
  });

  // Customer NAVIGATE_HOME -> /customer
  dispatchCanonicalAction({ type: 'NAVIGATE_HOME', source: 'VOICE', timestamp: Date.now() }, mockDeps('customer'));
  assert(navigatedTo === '/customer', 'Test 11.1: Customer NAVIGATE_HOME routes to /customer', `Got: ${navigatedTo}`);

  // Technician NAVIGATE_HOME -> /technician
  dispatchCanonicalAction({ type: 'NAVIGATE_HOME', source: 'VOICE', timestamp: Date.now() }, mockDeps('technician'));
  assert(navigatedTo === '/technician', 'Test 11.2: Technician NAVIGATE_HOME routes to /technician', `Got: ${navigatedTo}`);

  // Customer NAVIGATE_BOOKINGS -> /customer/bookings
  dispatchCanonicalAction({ type: 'NAVIGATE_BOOKINGS', source: 'VOICE', timestamp: Date.now() }, mockDeps('customer'));
  assert(navigatedTo === '/customer/bookings', 'Test 11.3: Customer NAVIGATE_BOOKINGS routes to /customer/bookings');

  // Technician NAVIGATE_JOBS -> /technician/jobs
  dispatchCanonicalAction({ type: 'NAVIGATE_JOBS', source: 'VOICE', timestamp: Date.now() }, mockDeps('technician'));
  assert(navigatedTo === '/technician/jobs', 'Test 11.4: Technician NAVIGATE_JOBS routes to /technician/jobs');

  // Technician NAVIGATE_EARNINGS -> /technician/earnings
  dispatchCanonicalAction({ type: 'NAVIGATE_EARNINGS', source: 'VOICE', timestamp: Date.now() }, mockDeps('technician'));
  assert(navigatedTo === '/technician/earnings', 'Test 11.5: Technician NAVIGATE_EARNINGS routes to /technician/earnings');

  // Technician NAVIGATE_SUBSCRIPTION -> /technician/subscription
  dispatchCanonicalAction({ type: 'NAVIGATE_SUBSCRIPTION', source: 'VOICE', timestamp: Date.now() }, mockDeps('technician'));
  assert(navigatedTo === '/technician/subscription', 'Test 11.6: Technician NAVIGATE_SUBSCRIPTION routes to /technician/subscription');

  // Technician NAVIGATE_CAPABILITIES -> /technician/capabilities
  dispatchCanonicalAction({ type: 'NAVIGATE_CAPABILITIES', source: 'VOICE', timestamp: Date.now() }, mockDeps('technician'));
  assert(navigatedTo === '/technician/capabilities', 'Test 11.7: Technician NAVIGATE_CAPABILITIES routes to /technician/capabilities');

  // Back Navigation -> -1
  dispatchCanonicalAction({ type: 'NAVIGATE_BACK', source: 'VOICE', timestamp: Date.now() }, mockDeps('customer'));
  assert(navigatedTo === '-1', 'Test 11.8: NAVIGATE_BACK calls navigate(-1)');
}

// TEST 12: Zero Hindi & Zero User-Facing Tanglish in System Responses
{
  const phrases = [
    'home page ku po',
    'take me home',
    'bookings kaatu',
    'en jobs kaatu',
    'earnings kaatu',
    'capabilities kaatu',
    'back po',
    'enakku AC service venum',
    'TV repair pannanum',
    'technician-a kaatu',
  ];

  let hasHindi = false;
  for (const p of phrases) {
    const res = resolveLocalVoiceTurn({ text: p, role: 'customer', currentRoute: '/customer' });
    // Check Devanagari Unicode range: \u0900-\u097F
    if (/[\u0900-\u097F]/.test(res.response)) {
      hasHindi = true;
    }
  }
  assert(!hasHindi, 'Test 12.1: Zero Hindi characters across all responses');
}

// TEST 13: Already on Home Page
{
  const res = resolveLocalVoiceTurn({
    text: 'home page ku po',
    role: 'customer',
    currentRoute: '/customer',
  });
  assert(res.intent === 'NAVIGATE_HOME', 'Test 13.1: Intent is NAVIGATE_HOME when already on home');
  assert(
    res.response === 'ஏற்கனவே முகப்புப் பக்கத்தில் தான் உள்ளீர்கள். உங்களுக்கு என்ன உதவி வேண்டும்?',
    'Test 13.2: Natural response when already on home page',
    `Got: ${res.response}`
  );
}

// TEST 14: Role Switching via Voice
{
  // Switch to Technician mode
  const toTech = resolveLocalVoiceTurn({
    text: 'technician mode ku maathu',
    role: 'customer',
    currentRoute: '/customer',
  });
  assert(toTech.intent === 'SWITCH_ROLE_TECHNICIAN', 'Test 14.1: Intent is SWITCH_ROLE_TECHNICIAN');
  assert(toTech.response === 'சரி, டெக்னிஷியன் மோடுக்கு மாற்றுறேன்.', 'Test 14.2: Natural response for switching to technician');

  // Switch to Customer mode
  const toCustomer = resolveLocalVoiceTurn({
    text: 'customer mode ku maathu',
    role: 'technician',
    currentRoute: '/technician',
  });
  assert(toCustomer.intent === 'SWITCH_ROLE_CUSTOMER', 'Test 14.3: Intent is SWITCH_ROLE_CUSTOMER');
  assert(toCustomer.response === 'சரி, வாடிக்கையாளர் பக்கத்திற்கு மாற்றுகிறேன்.', 'Test 14.4: Natural response for switching to customer');
}

// TEST 15: Language Switching via Voice
{
  // Switch to English
  const toEn = resolveLocalVoiceTurn({
    text: 'English language use பண்ணு',
    role: 'customer',
    currentRoute: '/customer',
  });
  assert(toEn.intent === 'SWITCH_LANGUAGE', 'Test 15.1: Intent is SWITCH_LANGUAGE for English');
  assert(toEn.language === 'en', 'Test 15.2: Language set to English');
  assert(toEn.response === "Sure, I'll speak with you in English from now on. How can I help you?", 'Test 15.3: English switch response');

  // Switch to Tamil
  const toTa = resolveLocalVoiceTurn({
    text: 'தமிழ்ல பேசு',
    role: 'customer',
    currentRoute: '/customer',
  });
  assert(toTa.intent === 'SWITCH_LANGUAGE', 'Test 15.4: Intent is SWITCH_LANGUAGE for Tamil');
  assert(toTa.language === 'ta', 'Test 15.5: Language set to Tamil');
  assert(toTa.response === 'சரி, இனி உங்களுடன் தமிழில் பேசுகிறேன். உங்களுக்கு என்ன உதவி வேண்டும்?', 'Test 15.6: Tamil switch response');
}

// TEST 16: Multi-turn Dynamic Language Recognition
{
  // English utterance without explicit markers
  const enRes = resolveLocalVoiceTurn({
    text: 'I need a plumber tomorrow at 10 AM',
    role: 'customer',
    currentRoute: '/customer',
    conversationLanguage: 'ta',
  });
  assert(enRes.language === 'en', 'Test 16.1: English sentence detected as "en" even with prior Tamil context');
}

// TEST 17: Priority 4 Exact Tamil Navigation Commands
{
  // 1. ஹோம் போ
  const tHome = resolveLocalVoiceTurn({ text: 'ஹோம் போ', role: 'customer', currentRoute: '/customer/bookings' });
  assert(tHome.intent === 'NAVIGATE_HOME' && tHome.language === 'ta', 'Test 17.1: "ஹோம் போ" parses NAVIGATE_HOME');

  // 2. புக்கிங் பாரு
  const tBk1 = resolveLocalVoiceTurn({ text: 'புக்கிங் பாரு', role: 'customer', currentRoute: '/customer' });
  assert(tBk1.intent === 'NAVIGATE_BOOKINGS' && tBk1.language === 'ta', 'Test 17.2: "புக்கிங் பாரு" parses NAVIGATE_BOOKINGS');

  // 3. என்னோட புக்கிங் பாரு
  const tBk2 = resolveLocalVoiceTurn({ text: 'என்னோட புக்கிங் பாரு', role: 'customer', currentRoute: '/customer' });
  assert(tBk2.intent === 'NAVIGATE_BOOKINGS' && tBk2.language === 'ta', 'Test 17.3: "என்னோட புக்கிங் பாரு" parses NAVIGATE_BOOKINGS');

  // 4. டெக்னிஷியன் தேடு
  const tProv = resolveLocalVoiceTurn({ text: 'டெக்னிஷியன் தேடு', role: 'customer', currentRoute: '/customer' });
  assert(tProv.intent === 'NAVIGATE_PROVIDERS' && tProv.language === 'ta', 'Test 17.4: "டெக்னிஷியன் தேடு" parses NAVIGATE_PROVIDERS');

  // 5. ப்ரொஃபைல் போ
  const tProf = resolveLocalVoiceTurn({ text: 'ப்ரொஃபைல் போ', role: 'customer', currentRoute: '/customer' });
  assert(tProf.intent === 'NAVIGATE_PROFILE' && tProf.language === 'ta', 'Test 17.5: "ப்ரொஃபைல் போ" parses NAVIGATE_PROFILE');

  // 6. டெக்னிஷியன் மோடுக்கு போ
  const tTechMode = resolveLocalVoiceTurn({ text: 'டெக்னிஷியன் மோடுக்கு போ', role: 'customer', currentRoute: '/customer' });
  assert(tTechMode.intent === 'SWITCH_ROLE_TECHNICIAN' && tTechMode.language === 'ta', 'Test 17.6: "டெக்னிஷியன் மோடுக்கு போ" switches role');

  // 7. ஜாப்ஸ் பாரு
  const tJobs1 = resolveLocalVoiceTurn({ text: 'ஜாப்ஸ் பாரு', role: 'technician', currentRoute: '/technician' });
  assert(tJobs1.intent === 'NAVIGATE_JOBS' && tJobs1.language === 'ta', 'Test 17.7: "ஜாப்ஸ் பாரு" parses NAVIGATE_JOBS');

  // 8. வேலை பாரு
  const tJobs2 = resolveLocalVoiceTurn({ text: 'வேலை பாரு', role: 'technician', currentRoute: '/technician' });
  assert(tJobs2.intent === 'NAVIGATE_JOBS' && tJobs2.language === 'ta', 'Test 17.8: "வேலை பாரு" parses NAVIGATE_JOBS');

  // 9. வருமானம் பாரு
  const tEarn = resolveLocalVoiceTurn({ text: 'வருமானம் பாரு', role: 'technician', currentRoute: '/technician' });
  assert(tEarn.intent === 'NAVIGATE_EARNINGS' && tEarn.language === 'ta', 'Test 17.9: "வருமானம் பாரு" parses NAVIGATE_EARNINGS');

  // 10. கஸ்டமர் மோடுக்கு போ
  const tCustMode = resolveLocalVoiceTurn({ text: 'கஸ்டமர் மோடுக்கு போ', role: 'technician', currentRoute: '/technician' });
  assert(tCustMode.intent === 'SWITCH_ROLE_CUSTOMER' && tCustMode.language === 'ta', 'Test 17.10: "கஸ்டமர் மோடுக்கு போ" switches role');
}

// TEST 18: Natural Phrasing Variations for Navigation
{
  // A. "let's go home"
  const tHome1 = resolveLocalVoiceTurn({ text: "let's go home", role: 'customer', currentRoute: '/customer/bookings' });
  assert(tHome1.intent === 'NAVIGATE_HOME' && tHome1.language === 'en', 'Test 18.1: "let\'s go home" parses NAVIGATE_HOME in English');

  // B. "take me back home"
  const tHome2 = resolveLocalVoiceTurn({ text: 'take me back home', role: 'customer', currentRoute: '/customer/profile' });
  assert(tHome2.intent === 'NAVIGATE_HOME' && tHome2.language === 'en', 'Test 18.2: "take me back home" parses NAVIGATE_HOME');

  // C. "ஹோம் பேஜ் திற"
  const tHome3 = resolveLocalVoiceTurn({ text: 'ஹோம் பேஜ் திற', role: 'customer', currentRoute: '/customer/bookings' });
  assert(tHome3.intent === 'NAVIGATE_HOME' && tHome3.language === 'ta', 'Test 18.3: "ஹோம் பேஜ் திற" parses NAVIGATE_HOME in Tamil');

  // D. "என் booking-ஐ காட்டு"
  const tBk1 = resolveLocalVoiceTurn({ text: 'என் booking-ஐ காட்டு', role: 'customer', currentRoute: '/customer' });
  assert(tBk1.intent === 'NAVIGATE_BOOKINGS' && tBk1.language === 'ta', 'Test 18.4: "என் booking-ஐ காட்டு" parses NAVIGATE_BOOKINGS');

  // E. "show my bookings"
  const tBk2 = resolveLocalVoiceTurn({ text: 'show my bookings', role: 'customer', currentRoute: '/customer' });
  assert(tBk2.intent === 'NAVIGATE_BOOKINGS' && tBk2.language === 'en', 'Test 18.5: "show my bookings" parses NAVIGATE_BOOKINGS in English');

  // F. "find a technician"
  const tProv1 = resolveLocalVoiceTurn({ text: 'find a technician', role: 'customer', currentRoute: '/customer' });
  assert(tProv1.intent === 'NAVIGATE_PROVIDERS' && tProv1.language === 'en', 'Test 18.6: "find a technician" parses NAVIGATE_PROVIDERS in English');

  // G. "technicians-a kaatu"
  const tProv2 = resolveLocalVoiceTurn({ text: 'technicians-a kaatu', role: 'customer', currentRoute: '/customer' });
  assert(tProv2.intent === 'NAVIGATE_PROVIDERS' && tProv2.language === 'ta', 'Test 18.7: "technicians-a kaatu" parses NAVIGATE_PROVIDERS');

  // H. "profile open pannu"
  const tProf1 = resolveLocalVoiceTurn({ text: 'profile open pannu', role: 'customer', currentRoute: '/customer' });
  assert(tProf1.intent === 'NAVIGATE_PROFILE' && tProf1.language === 'ta', 'Test 18.8: "profile open pannu" parses NAVIGATE_PROFILE');

  // I. "சுயவிவரம் திற"
  const tProf2 = resolveLocalVoiceTurn({ text: 'சுயவிவரம் திற', role: 'customer', currentRoute: '/customer' });
  assert(tProf2.intent === 'NAVIGATE_PROFILE' && tProf2.language === 'ta', 'Test 18.9: "சுயவிவரம் திற" parses NAVIGATE_PROFILE in Tamil');

  // J. "available jobs open பண்ணு"
  const tJobs1 = resolveLocalVoiceTurn({ text: 'available jobs open பண்ணு', role: 'technician', currentRoute: '/technician' });
  assert(tJobs1.intent === 'NAVIGATE_JOBS' && tJobs1.language === 'ta', 'Test 18.10: "available jobs open பண்ணு" parses NAVIGATE_JOBS');

  // K. "வருமானத்தை காட்டு"
  const tEarn1 = resolveLocalVoiceTurn({ text: 'வருமானத்தை காட்டு', role: 'technician', currentRoute: '/technician' });
  assert(tEarn1.intent === 'NAVIGATE_EARNINGS' && tEarn1.language === 'ta', 'Test 18.11: "வருமானத்தை காட்டு" parses NAVIGATE_EARNINGS');

  // L. "சந்தா காட்டு"
  const tSub1 = resolveLocalVoiceTurn({ text: 'சந்தா காட்டு', role: 'technician', currentRoute: '/technician' });
  assert(tSub1.intent === 'NAVIGATE_SUBSCRIPTION' && tSub1.language === 'ta', 'Test 18.12: "சந்தா காட்டு" parses NAVIGATE_SUBSCRIPTION');
}

// TEST 19: Action & Button Voice Control
{
  // A. "select this technician"
  const tSel1 = resolveLocalVoiceTurn({
    text: 'select this technician',
    role: 'customer',
    currentRoute: '/customer/providers',
    context: {
      visibleProviders: [{ id: 'pro_01', name: 'Muthukumar S' }, { id: 'pro_02', name: 'Karthik V' }],
    },
  });
  assert(tSel1.intent === 'SELECT_TECHNICIAN', 'Test 19.1: "select this technician" parses SELECT_TECHNICIAN');
  assert(tSel1.action.payload?.providerId === 'pro_01', 'Test 19.2: Focuses provider #1 from visible list');

  // B. "இந்த technician-ஐ select பண்ணு"
  const tSel2 = resolveLocalVoiceTurn({
    text: 'இந்த technician-ஐ select பண்ணு',
    role: 'customer',
    currentRoute: '/customer/providers',
  });
  assert(tSel2.intent === 'SELECT_TECHNICIAN' && tSel2.language === 'ta', 'Test 19.3: "இந்த technician-ஐ select பண்ணு" parses SELECT_TECHNICIAN in Tamil');

  // C. "choose first technician"
  const tSel3 = resolveLocalVoiceTurn({
    text: 'choose first technician',
    role: 'customer',
    currentRoute: '/customer/providers',
  });
  assert(tSel3.intent === 'SELECT_TECHNICIAN' && tSel3.action.payload?.index === 0, 'Test 19.4: "choose first technician" has index 0');

  // D. "show his profile"
  const tProfView = resolveLocalVoiceTurn({
    text: 'show his profile',
    role: 'customer',
    currentRoute: '/customer/providers',
  });
  assert(tProfView.intent === 'VIEW_TECHNICIAN_PROFILE' && tProfView.language === 'en', 'Test 19.5: "show his profile" parses VIEW_TECHNICIAN_PROFILE');

  // E. "இவரோட profile காட்டு"
  const tProfViewTa = resolveLocalVoiceTurn({
    text: 'இவரோட profile காட்டு',
    role: 'customer',
    currentRoute: '/customer/providers',
  });
  assert(tProfViewTa.intent === 'VIEW_TECHNICIAN_PROFILE' && tProfViewTa.language === 'ta', 'Test 19.6: "இவரோட profile காட்டு" parses VIEW_TECHNICIAN_PROFILE in Tamil');

  // F. "start work"
  const tStartWork = resolveLocalVoiceTurn({
    text: 'start work',
    role: 'technician',
    currentRoute: '/technician/jobs',
  });
  assert(tStartWork.intent === 'START_WORK' && tStartWork.language === 'en', 'Test 19.7: "start work" parses START_WORK in English');
  assert(tStartWork.response === "Alright, let's start the job.", 'Test 19.8: Natural English response for start work');

  // G. "வேலை ஆரம்பி"
  const tStartWorkTa = resolveLocalVoiceTurn({
    text: 'வேலை ஆரம்பி',
    role: 'technician',
    currentRoute: '/technician/jobs',
  });
  assert(tStartWorkTa.intent === 'START_WORK' && tStartWorkTa.language === 'ta', 'Test 19.9: "வேலை ஆரம்பி" parses START_WORK in Tamil');
  assert(tStartWorkTa.response === 'சரி, வேலை ஆரம்பிக்கலாம்.', 'Test 19.10: Natural Tamil response for வேலை ஆரம்பி');

  // H. "technician arrived" / "வந்துட்டேன்"
  const tArrivedEn = resolveLocalVoiceTurn({
    text: 'mark arrived',
    role: 'technician',
    currentRoute: '/technician/jobs',
  });
  assert(tArrivedEn.intent === 'MARK_ARRIVED' && tArrivedEn.language === 'en', 'Test 19.11: "mark arrived" parses MARK_ARRIVED');

  const tArrivedTa = resolveLocalVoiceTurn({
    text: 'வந்துட்டேன்',
    role: 'technician',
    currentRoute: '/technician/jobs',
  });
  assert(tArrivedTa.intent === 'MARK_ARRIVED' && tArrivedTa.language === 'ta', 'Test 19.12: "வந்துட்டேன்" parses MARK_ARRIVED in Tamil');

  // I. "start journey" / "கிளம்பிட்டேன்"
  const tWayEn = resolveLocalVoiceTurn({
    text: 'on the way',
    role: 'technician',
    currentRoute: '/technician/jobs',
  });
  assert(tWayEn.intent === 'MARK_ON_THE_WAY' && tWayEn.language === 'en', 'Test 19.13: "on the way" parses MARK_ON_THE_WAY');

  const tWayTa = resolveLocalVoiceTurn({
    text: 'கிளம்பிட்டேன்',
    role: 'technician',
    currentRoute: '/technician/jobs',
  });
  assert(tWayTa.intent === 'MARK_ON_THE_WAY' && tWayTa.language === 'ta', 'Test 19.14: "கிளம்பிட்டேன்" parses MARK_ON_THE_WAY in Tamil');

  // J. "accept this job"
  const tAcc = resolveLocalVoiceTurn({
    text: 'accept this job',
    role: 'technician',
    currentRoute: '/technician/jobs',
  });
  assert(tAcc.intent === 'ACCEPT_REQUEST' && tAcc.language === 'en', 'Test 19.15: "accept this job" parses ACCEPT_REQUEST');

  // K. "confirm booking"
  const tConfBk = resolveLocalVoiceTurn({
    text: 'confirm booking',
    role: 'customer',
    currentRoute: '/customer/book',
  });
  assert(tConfBk.intent === 'CONFIRM_BOOKING' && tConfBk.language === 'en', 'Test 19.16: "confirm booking" parses CONFIRM_BOOKING');

  // L. "make payment"
  const tPay = resolveLocalVoiceTurn({
    text: 'make payment',
    role: 'customer',
    currentRoute: '/customer/tracking',
  });
  assert(tPay.intent === 'INITIATE_PAYMENT' && tPay.language === 'en', 'Test 19.17: "make payment" parses INITIATE_PAYMENT');
}

// TEST 20: Destructive Action Confirmations
{
  // A. "cancel this booking" prompt
  const tCancelPrompt = resolveLocalVoiceTurn({
    text: 'cancel this booking',
    role: 'customer',
    currentRoute: '/customer/bookings',
  });
  assert(tCancelPrompt.intent === 'CANCEL_BOOKING', 'Test 20.1: "cancel this booking" identifies CANCEL_BOOKING intent');
  assert(
    tCancelPrompt.response === 'Do you want me to cancel this booking?',
    'Test 20.2: Prompts confirmation in English',
    `Got: ${tCancelPrompt.response}`
  );

  // B. "இந்த booking cancel பண்ணு" prompt
  const tCancelPromptTa = resolveLocalVoiceTurn({
    text: 'இந்த booking cancel பண்ணு',
    role: 'customer',
    currentRoute: '/customer/bookings',
  });
  assert(tCancelPromptTa.intent === 'CANCEL_BOOKING', 'Test 20.3: Tamil cancel identifies intent');
  assert(
    tCancelPromptTa.response === 'இந்த புக்கிங்கை ரத்து செய்யவா?',
    'Test 20.4: Prompts confirmation in authentic Tamil script',
    `Got: ${tCancelPromptTa.response}`
  );

  // C. Follow-up "yes" executes CANCEL_BOOKING
  const tConfirmed = resolveLocalVoiceTurn({
    text: 'yes',
    role: 'customer',
    currentRoute: '/customer/bookings',
    context: {
      pendingConfirmationAction: 'CANCEL_BOOKING',
    },
  });
  assert(tConfirmed.intent === 'CANCEL_BOOKING', 'Test 20.5: Follow-up "yes" executes pending CANCEL_BOOKING');
  assert(tConfirmed.response === "Okay, I'll cancel this booking.", 'Test 20.6: Confirmed cancellation response');

  // D. Follow-up "no" cancels action
  const tAborted = resolveLocalVoiceTurn({
    text: 'no',
    role: 'customer',
    currentRoute: '/customer/bookings',
    context: {
      pendingConfirmationAction: 'CANCEL_BOOKING',
    },
  });
  assert(tAborted.intent === 'CANCEL', 'Test 20.7: Follow-up "no" resolves to CANCEL');

  // E. "amount okay, start work" -> APPROVE_ESTIMATE
  const tAppr = resolveLocalVoiceTurn({
    text: 'amount okay, start work',
    role: 'customer',
    currentRoute: '/customer/tracking',
  });
  assert(tAppr.intent === 'APPROVE_ESTIMATE', 'Test 20.8: "amount okay, start work" parses APPROVE_ESTIMATE');

  // F. "pass this job" -> REJECT_REQUEST
  const tPass = resolveLocalVoiceTurn({
    text: 'pass this job',
    role: 'technician',
    currentRoute: '/technician/jobs',
  });
  assert(tPass.intent === 'REJECT_REQUEST', 'Test 20.9: "pass this job" parses REJECT_REQUEST');
}

// TEST 21: Full Spectrum Natural Phrasing for HOME
{
  const homePhrases = [
    { text: 'home', expectedLang: 'en' },
    { text: 'go home', expectedLang: 'en' },
    { text: 'go to home', expectedLang: 'en' },
    { text: 'take me home', expectedLang: 'en' },
    { text: 'open home', expectedLang: 'en' },
    { text: 'home page', expectedLang: 'en' },
    { text: 'open home page', expectedLang: 'en' },
    { text: 'home page ku po', expectedLang: 'ta' },
    { text: 'home ku po', expectedLang: 'ta' },
    { text: 'home-ku kootitu po', expectedLang: 'ta' },
    { text: 'naan home poganum', expectedLang: 'ta' },
    { text: 'ஹோம் போ', expectedLang: 'ta' },
    { text: 'ஹோம் பேஜுக்கு போ', expectedLang: 'ta' },
    { text: 'என்னை ஹோம் பேஜுக்கு கூட்டிட்டு போ', expectedLang: 'ta' },
  ];

  for (const { text, expectedLang } of homePhrases) {
    const res = resolveLocalVoiceTurn({ text, role: 'customer', currentRoute: '/customer/bookings' });
    assert(
      res.intent === 'NAVIGATE_HOME' && res.language === expectedLang,
      `Test 21: HOME phrase "${text}" resolves to NAVIGATE_HOME in ${expectedLang}`,
      `Got intent: ${res.intent}, lang: ${res.language}`
    );
  }
}

// TEST 22: Full Spectrum Natural Phrasing for BOOKINGS
{
  const bookingPhrases = [
    { text: 'bookings', expectedLang: 'en' },
    { text: 'show bookings', expectedLang: 'en' },
    { text: 'open my bookings', expectedLang: 'en' },
    { text: 'show my bookings', expectedLang: 'en' },
    { text: 'booking paaru', expectedLang: 'ta' },
    { text: 'bookings kaatu', expectedLang: 'ta' },
    { text: 'en booking-a paaru', expectedLang: 'ta' },
    { text: 'en booking kaatu', expectedLang: 'ta' },
    { text: 'புக்கிங் காட்டு', expectedLang: 'ta' },
    { text: 'என் புக்கிங் பாரு', expectedLang: 'ta' },
    { text: 'புக்கிங்ஸ் பேஜுக்கு போ', expectedLang: 'ta' },
    { text: 'என்னை புக்கிங் பேஜுக்கு கூட்டிட்டு போ', expectedLang: 'ta' },
  ];

  for (const { text, expectedLang } of bookingPhrases) {
    const res = resolveLocalVoiceTurn({ text, role: 'customer', currentRoute: '/customer' });
    assert(
      res.intent === 'NAVIGATE_BOOKINGS' && res.language === expectedLang,
      `Test 22: BOOKINGS phrase "${text}" resolves to NAVIGATE_BOOKINGS in ${expectedLang}`,
      `Got intent: ${res.intent}, lang: ${res.language}`
    );
  }

  // Context-aware Technician response for "bookings"
  const techBookingRes = resolveLocalVoiceTurn({ text: 'bookings', role: 'technician', currentRoute: '/technician' });
  assert(
    techBookingRes.intent === 'NAVIGATE_BOOKINGS' && techBookingRes.response === 'Sure, opening your jobs.',
    'Test 22.b: Technician saying "bookings" resolves to NAVIGATE_BOOKINGS with job response',
    `Got: ${techBookingRes.response}`
  );
}

// TEST 23: Full Spectrum Natural Phrasing for PROVIDERS / TECHNICIANS
{
  const providerPhrases = [
    { text: 'find technician', expectedLang: 'en' },
    { text: 'find a technician', expectedLang: 'en' },
    { text: 'search technician', expectedLang: 'en' },
    { text: 'please find a technician', expectedLang: 'en' },
    { text: 'technician thedu', expectedLang: 'ta' },
    { text: 'technician search pannu', expectedLang: 'ta' },
    { text: 'technician-a thedu', expectedLang: 'ta' },
    { text: 'technicians kaatu', expectedLang: 'ta' },
    { text: 'டெக்னிஷியன் தேடு', expectedLang: 'ta' },
    { text: 'டெக்னிஷியன்ஸ் காட்டு', expectedLang: 'ta' },
    { text: 'டெக்னிஷியன் பக்கத்துக்கு போ', expectedLang: 'ta' },
  ];

  for (const { text, expectedLang } of providerPhrases) {
    const res = resolveLocalVoiceTurn({ text, role: 'customer', currentRoute: '/customer' });
    assert(
      res.intent === 'NAVIGATE_PROVIDERS' && res.language === expectedLang,
      `Test 23: PROVIDERS phrase "${text}" resolves to NAVIGATE_PROVIDERS in ${expectedLang}`,
      `Got intent: ${res.intent}, lang: ${res.language}`
    );
  }
}

// TEST 24: Full Spectrum Natural Phrasing for PROFILE
{
  const profilePhrases = [
    { text: 'profile', expectedLang: 'en' },
    { text: 'open profile', expectedLang: 'en' },
    { text: 'show profile', expectedLang: 'en' },
    { text: 'profile open pannu', expectedLang: 'ta' },
    { text: 'en profile kaatu', expectedLang: 'ta' },
    { text: 'profile ku po', expectedLang: 'ta' },
    { text: 'ப்ரொஃபைல் காட்டு', expectedLang: 'ta' },
    { text: 'சுயவிவரம் திற', expectedLang: 'ta' },
    { text: 'ப்ரொஃபைல் பக்கத்துக்கு போ', expectedLang: 'ta' },
  ];

  for (const { text, expectedLang } of profilePhrases) {
    const res = resolveLocalVoiceTurn({ text, role: 'customer', currentRoute: '/customer' });
    assert(
      res.intent === 'NAVIGATE_PROFILE' && res.language === expectedLang,
      `Test 24: PROFILE phrase "${text}" resolves to NAVIGATE_PROFILE in ${expectedLang}`,
      `Got intent: ${res.intent}, lang: ${res.language}`
    );
  }
}

// TEST 25: Full Spectrum Natural Phrasing for JOBS (Technician)
{
  const jobPhrases = [
    { text: 'jobs', expectedLang: 'en' },
    { text: 'show jobs', expectedLang: 'en' },
    { text: 'jobs paaru', expectedLang: 'ta' },
    { text: 'jobs kaatu', expectedLang: 'ta' },
    { text: 'job-ku po', expectedLang: 'ta' },
    { text: 'வேலைகள் பாரு', expectedLang: 'ta' },
    { text: 'வேலை பாரு', expectedLang: 'ta' },
    { text: 'ஜாப்ஸ் காட்டு', expectedLang: 'ta' },
  ];

  for (const { text, expectedLang } of jobPhrases) {
    const res = resolveLocalVoiceTurn({ text, role: 'technician', currentRoute: '/technician' });
    assert(
      res.intent === 'NAVIGATE_JOBS' && res.language === expectedLang,
      `Test 25: JOBS phrase "${text}" resolves to NAVIGATE_JOBS in ${expectedLang}`,
      `Got intent: ${res.intent}, lang: ${res.language}`
    );
  }
}

// TEST 26: Full Spectrum Natural Phrasing for EARNINGS (Technician)
{
  const earningsPhrases = [
    { text: 'earnings', expectedLang: 'en' },
    { text: 'show earnings', expectedLang: 'en' },
    { text: 'income', expectedLang: 'en' },
    { text: 'income paaru', expectedLang: 'ta' },
    { text: 'varumanam paaru', expectedLang: 'ta' },
    { text: 'varumanam kaatu', expectedLang: 'ta' },
    { text: 'வருமானம் பாரு', expectedLang: 'ta' },
    { text: 'வருமானம் காட்டு', expectedLang: 'ta' },
  ];

  for (const { text, expectedLang } of earningsPhrases) {
    const res = resolveLocalVoiceTurn({ text, role: 'technician', currentRoute: '/technician' });
    assert(
      res.intent === 'NAVIGATE_EARNINGS' && res.language === expectedLang,
      `Test 26: EARNINGS phrase "${text}" resolves to NAVIGATE_EARNINGS in ${expectedLang}`,
      `Got intent: ${res.intent}, lang: ${res.language}`
    );
  }
}

// TEST 27: Full Spectrum Natural Phrasing for ROLE SWITCH
{
  const rolePhrases = [
    { text: 'customer mode-ku po', expectedIntent: 'SWITCH_ROLE_CUSTOMER', expectedLang: 'ta', role: 'technician' as const },
    { text: 'technician mode-ku po', expectedIntent: 'SWITCH_ROLE_TECHNICIAN', expectedLang: 'ta', role: 'customer' as const },
    { text: 'switch to customer', expectedIntent: 'SWITCH_ROLE_CUSTOMER', expectedLang: 'en', role: 'technician' as const },
    { text: 'switch to technician', expectedIntent: 'SWITCH_ROLE_TECHNICIAN', expectedLang: 'en', role: 'customer' as const },
  ];

  for (const { text, expectedIntent, expectedLang, role } of rolePhrases) {
    const res = resolveLocalVoiceTurn({ text, role, currentRoute: role === 'customer' ? '/customer' : '/technician' });
    assert(
      res.intent === expectedIntent && res.language === expectedLang,
      `Test 27: ROLE SWITCH phrase "${text}" resolves to ${expectedIntent} in ${expectedLang}`,
      `Got intent: ${res.intent}, lang: ${res.language}`
    );
  }
}

// TEST 28: Interactive Voice Button Control
{
  const buttonActions = [
    { text: 'Indha technician-a select pannu', expectedIntent: 'SELECT_TECHNICIAN', expectedLang: 'ta', role: 'customer' as const, route: '/customer/providers' },
    { text: 'Select this technician', expectedIntent: 'SELECT_TECHNICIAN', expectedLang: 'en', role: 'customer' as const, route: '/customer/providers' },
    { text: 'Job accept pannu', expectedIntent: 'ACCEPT_REQUEST', expectedLang: 'ta', role: 'technician' as const, route: '/technician/jobs' },
    { text: 'Accept job', expectedIntent: 'ACCEPT_REQUEST', expectedLang: 'en', role: 'technician' as const, route: '/technician/jobs' },
    { text: 'Naan vandhuten', expectedIntent: 'MARK_ARRIVED', expectedLang: 'ta', role: 'technician' as const, route: '/technician/jobs' },
    { text: 'Mark arrived', expectedIntent: 'MARK_ARRIVED', expectedLang: 'en', role: 'technician' as const, route: '/technician/jobs' },
    { text: 'Velai aarambikkalam', expectedIntent: 'START_WORK', expectedLang: 'ta', role: 'technician' as const, route: '/technician/jobs' },
    { text: 'Start work', expectedIntent: 'START_WORK', expectedLang: 'en', role: 'technician' as const, route: '/technician/jobs' },
    { text: 'Payment page open pannu', expectedIntent: 'INITIATE_PAYMENT', expectedLang: 'ta', role: 'customer' as const, route: '/customer/tracking' },
    { text: 'Make payment', expectedIntent: 'INITIATE_PAYMENT', expectedLang: 'en', role: 'customer' as const, route: '/customer/tracking' },
  ];

  for (const { text, expectedIntent, expectedLang, role, route } of buttonActions) {
    const res = resolveLocalVoiceTurn({ text, role, currentRoute: route });
    assert(
      res.intent === expectedIntent && res.language === expectedLang,
      `Test 28: Button action "${text}" resolves to ${expectedIntent} in ${expectedLang}`,
      `Got intent: ${res.intent}, lang: ${res.language}`
    );
  }
}

// TEST 29: Complex Natural & Conversational Variations
{
  const conversationalPhrases = [
    { text: 'I want to go home', expectedIntent: 'NAVIGATE_HOME', expectedLang: 'en', role: 'customer' as const, route: '/customer/bookings' },
    { text: 'Can you take me to the home page?', expectedIntent: 'NAVIGATE_HOME', expectedLang: 'en', role: 'customer' as const, route: '/customer/bookings' },
    { text: 'I need my bookings', expectedIntent: 'NAVIGATE_BOOKINGS', expectedLang: 'en', role: 'customer' as const, route: '/customer' },
    { text: 'Show me my bookings', expectedIntent: 'NAVIGATE_BOOKINGS', expectedLang: 'en', role: 'customer' as const, route: '/customer' },
    { text: 'Can you open the technician search?', expectedIntent: 'NAVIGATE_PROVIDERS', expectedLang: 'en', role: 'customer' as const, route: '/customer' },
    { text: 'Take me to my profile', expectedIntent: 'NAVIGATE_PROFILE', expectedLang: 'en', role: 'customer' as const, route: '/customer' },
    { text: 'Show the jobs', expectedIntent: 'NAVIGATE_JOBS', expectedLang: 'en', role: 'technician' as const, route: '/technician' },
    { text: 'How much have I earned?', expectedIntent: 'NAVIGATE_EARNINGS', expectedLang: 'en', role: 'technician' as const, route: '/technician' },
    { text: "I've arrived", expectedIntent: 'MARK_ARRIVED', expectedLang: 'en', role: 'technician' as const, route: '/technician/jobs' },
    { text: 'start the work', expectedIntent: 'START_WORK', expectedLang: 'en', role: 'technician' as const, route: '/technician/jobs' },
    { text: 'velaya start pannalam', expectedIntent: 'START_WORK', expectedLang: 'ta', role: 'technician' as const, route: '/technician/jobs' },
    { text: 'ennai home ku kootitu po', expectedIntent: 'NAVIGATE_HOME', expectedLang: 'ta', role: 'customer' as const, route: '/customer/bookings' },
  ];

  for (const { text, expectedIntent, expectedLang, role, route } of conversationalPhrases) {
    const res = resolveLocalVoiceTurn({ text, role, currentRoute: route });
    assert(
      res.intent === expectedIntent && res.language === expectedLang,
      `Test 29: Conversational phrase "${text}" resolves to ${expectedIntent} in ${expectedLang}`,
      `Got intent: ${res.intent}, lang: ${res.language}`
    );
  }
}

// TEST 30: Natural Voice Intelligence & Context-Aware Controller (Prompt Section 22 Verification)
{
  console.log('\n--- Running Test 30: Section 22 Natural Voice Verification ---');

  // 1. Natural Problem / Need Expression (Tamil & Tanglish)
  const acNeed = resolveLocalVoiceTurn({
    text: 'En AC cooling varala, oru technician venum',
    role: 'customer',
    currentRoute: '/customer',
  });
  assert(acNeed.language === 'ta', 'Test 30.1: "En AC cooling varala, oru technician venum" detected as "ta"');
  assert(acNeed.intent === 'EXPRESS_NEED', 'Test 30.2: Intent is EXPRESS_NEED');
  assert(acNeed.action.payload?.canonicalService === 'AC_REPAIR', 'Test 30.3: Canonical service is AC_REPAIR');
  assert(acNeed.action.payload?.problem === 'AC_NOT_COOLING', 'Test 30.4: Specific issue identified as AC_NOT_COOLING');
  assert(/[\u0B80-\u0BFF]/.test(acNeed.response), 'Test 30.5: Response generated in authentic Tamil script');

  // 2. Pure Tamil Breakdown Expression
  const tvNeed = resolveLocalVoiceTurn({
    text: 'TV வேலை செய்யல',
    role: 'customer',
    currentRoute: '/customer',
  });
  assert(tvNeed.language === 'ta', 'Test 30.6: "TV வேலை செய்யல" detected as "ta"');
  assert(tvNeed.intent === 'EXPRESS_NEED', 'Test 30.7: TV failure intent is EXPRESS_NEED');
  assert(tvNeed.action.payload?.canonicalService === 'TV_REPAIR', 'Test 30.8: Canonical service is TV_REPAIR');
  assert(tvNeed.action.payload?.problem === 'TV_NOT_WORKING', 'Test 30.9: Problem is TV_NOT_WORKING');

  // 3. Ambiguous Need Clarification ("Repair வேணும்")
  const ambigNeed = resolveLocalVoiceTurn({
    text: 'Repair வேணும்',
    role: 'customer',
    currentRoute: '/customer',
  });
  assert(ambigNeed.intent === 'HELP', 'Test 30.10: "Repair வேணும்" prompts helpful clarification');
  assert(ambigNeed.action.payload?.clarificationNeeded === true, 'Test 30.11: Clarification needed is true');
  assert(/[\u0B80-\u0BFF]/.test(ambigNeed.response), 'Test 30.12: Clarification question in authentic Tamil script');

  // 4. Select Nearest Technician
  const nearestTech = resolveLocalVoiceTurn({
    text: 'Nearest technician காட்டு',
    role: 'customer',
    currentRoute: '/customer/providers',
  });
  assert(nearestTech.intent === 'SELECT_NEAREST_TECHNICIAN', 'Test 30.13: "Nearest technician காட்டு" resolves to SELECT_NEAREST_TECHNICIAN');
  assert(nearestTech.action.payload?.isNearest === true, 'Test 30.14: Payload marks isNearest: true');

  // 5. Select First Technician
  const firstTech = resolveLocalVoiceTurn({
    text: 'First technician select பண்ணு',
    role: 'customer',
    currentRoute: '/customer/providers',
  });
  assert(firstTech.intent === 'SELECT_TECHNICIAN', 'Test 30.15: "First technician select பண்ணு" resolves to SELECT_TECHNICIAN');
  assert(firstTech.action.payload?.index === 0, 'Test 30.16: First technician index is 0');

  // 6. Natural Technician Booking Request with Pro in Context
  const bookPro = resolveLocalVoiceTurn({
    text: 'இந்த technician-ஐ book பண்ணு',
    role: 'customer',
    currentRoute: '/customer/providers',
    context: {
      selectedTechnician: { id: 'pro_ravi', name: 'Ravi Kumar' },
    },
  });
  assert(bookPro.intent === 'CONFIRM_BOOKING', 'Test 30.17: "இந்த technician-ஐ book பண்ணு" transitions to CONFIRM_BOOKING');
  assert(/Ravi Kumar/.test(bookPro.response), 'Test 30.18: Response asks confirmation mentioning selected technician Ravi Kumar');

  // 7. Contextual Affirmative with Pending Confirmation
  const confirmYes = resolveLocalVoiceTurn({
    text: 'ஆமா',
    role: 'customer',
    currentRoute: '/customer/providers',
    context: {
      pendingConfirmationAction: 'CONFIRM_BOOKING',
      selectedTechnician: { id: 'pro_ravi', name: 'Ravi Kumar' },
    },
  });
  assert(confirmYes.intent === 'CONFIRM_BOOKING', 'Test 30.19: "ஆமா" confirms pending booking');

  // 8. Bare Affirmative without Pending Confirmation (Must NOT trigger random booking)
  const bareYes = resolveLocalVoiceTurn({
    text: 'Yes',
    role: 'customer',
    currentRoute: '/customer',
    context: {},
  });
  assert(bareYes.intent === 'YES', 'Test 30.20: Bare "Yes" without pending confirmation resolves to conversational YES');
  assert(bareYes.intent !== 'CONFIRM_BOOKING', 'Test 30.21: Bare "Yes" does NOT create a random booking');

  // 9. Negative with Pending Confirmation
  const confirmCancel = resolveLocalVoiceTurn({
    text: 'வேண்டாம்',
    role: 'customer',
    currentRoute: '/customer/providers',
    context: {
      pendingConfirmationAction: 'CONFIRM_BOOKING',
    },
  });
  assert(confirmCancel.intent === 'CANCEL', 'Test 30.22: "வேண்டாம்" cancels pending action');

  // 10. Navigation: Back and Next
  const navBack = resolveLocalVoiceTurn({
    text: 'Back போ',
    role: 'customer',
    currentRoute: '/customer/providers',
  });
  assert(navBack.intent === 'NAVIGATE_BACK', 'Test 30.23: "Back போ" resolves to NAVIGATE_BACK');

  const navNext = resolveLocalVoiceTurn({
    text: 'Next போ',
    role: 'customer',
    currentRoute: '/customer/providers',
  });
  assert(navNext.intent === 'NEXT', 'Test 30.24: "Next போ" resolves to NEXT');

  // 11. Explicit Technician Home
  const navTechHome = resolveLocalVoiceTurn({
    text: 'Technician homeக்கு போ',
    role: 'customer',
    currentRoute: '/customer',
  });
  assert(navTechHome.intent === 'NAVIGATE_TECHNICIAN_HOME', 'Test 30.25: "Technician homeக்கு போ" resolves to NAVIGATE_TECHNICIAN_HOME');
  assert(navTechHome.action.payload?.destination === '/technician', 'Test 30.26: Destination is /technician');

  // 12. Bookings & Status Queries
  const myBookings = resolveLocalVoiceTurn({
    text: 'My bookings open பண்ணு',
    role: 'customer',
    currentRoute: '/customer',
  });
  assert(myBookings.intent === 'NAVIGATE_BOOKINGS', 'Test 30.27: "My bookings open பண்ணு" resolves to NAVIGATE_BOOKINGS');

  const bookingDetails = resolveLocalVoiceTurn({
    text: 'என் booking details காட்டு',
    role: 'customer',
    currentRoute: '/customer',
  });
  assert(bookingDetails.intent === 'NAVIGATE_BOOKINGS', 'Test 30.28: "என் booking details காட்டு" resolves to NAVIGATE_BOOKINGS');

  const bookingStatus = resolveLocalVoiceTurn({
    text: 'Booking status என்ன?',
    role: 'customer',
    currentRoute: '/customer',
  });
  assert(bookingStatus.intent === 'CHECK_BOOKING_STATUS', 'Test 30.29: "Booking status என்ன?" resolves to CHECK_BOOKING_STATUS');

  // 13. Weekly Access Pass (₹599) Voice Activation
  const weeklyPass = resolveLocalVoiceTurn({
    text: 'weekly pass activate பண்ணு',
    role: 'technician',
    currentRoute: '/technician/subscription',
  });
  assert(weeklyPass.intent === 'ACTIVATE_WEEKLY_PASS', 'Test 30.30: "weekly pass activate பண்ணு" resolves to ACTIVATE_WEEKLY_PASS');
  assert(weeklyPass.action.payload?.passType === 'WEEKLY', 'Test 30.31: Pass type is WEEKLY');
  assert(weeklyPass.action.payload?.price === 599, 'Test 30.32: Price is exactly ₹599');
}

// TEST 31: Section 23 - 100% Zero-Touch Voice Flow Verification
{
  console.log('\n--- Running Test 31: 100% Zero-Touch Voice Flow Verification ---');

  // 1. Service Mode Choice: Diagnosis vs Direct Service
  const diagMode = resolveLocalVoiceTurn({
    text: 'Diagnosis mode select பண்ணு',
    role: 'customer',
    currentRoute: '/customer/book/prov_ravi',
  });
  assert(diagMode.intent === 'SELECT_DIAGNOSIS_MODE', 'Test 31.1: "Diagnosis mode select பண்ணு" resolves to SELECT_DIAGNOSIS_MODE');

  const directService = resolveLocalVoiceTurn({
    text: 'நேரடி சேவை',
    role: 'customer',
    currentRoute: '/customer/book/prov_ravi',
  });
  assert(directService.intent === 'SELECT_DIRECT_SERVICE_MODE', 'Test 31.2: "நேரடி சேவை" resolves to SELECT_DIRECT_SERVICE_MODE');

  // 2. Booking Slot Selection
  const slot6pm = resolveLocalVoiceTurn({
    text: 'நாளைக்கு மாலை 6 மணிக்கு',
    role: 'customer',
    currentRoute: '/customer/book/prov_ravi',
  });
  assert(slot6pm.intent === 'SELECT_BOOKING_SLOT', 'Test 31.3: "நாளைக்கு மாலை 6 மணிக்கு" resolves to SELECT_BOOKING_SLOT');
  assert(slot6pm.action.payload?.slot === 'Tomorrow · 6:00 PM', 'Test 31.4: Slot payload is "Tomorrow · 6:00 PM"');

  const slot10am = resolveLocalVoiceTurn({
    text: 'Tomorrow 10 AM',
    role: 'customer',
    currentRoute: '/customer/book/prov_ravi',
  });
  assert(slot10am.intent === 'SELECT_BOOKING_SLOT', 'Test 31.5: "Tomorrow 10 AM" resolves to SELECT_BOOKING_SLOT');
  assert(slot10am.action.payload?.slot === 'Tomorrow · 10:00 AM', 'Test 31.6: Slot payload is "Tomorrow · 10:00 AM"');

  const slot11am = resolveLocalVoiceTurn({
    text: 'Day after tomorrow 11 AM',
    role: 'customer',
    currentRoute: '/customer/book/prov_ravi',
  });
  assert(slot11am.intent === 'SELECT_BOOKING_SLOT', 'Test 31.7: "Day after tomorrow 11 AM" resolves to SELECT_BOOKING_SLOT');
  assert(slot11am.action.payload?.slot === 'Day After Tomorrow · 11:00 AM', 'Test 31.8: Slot payload is "Day After Tomorrow · 11:00 AM"');

  // 3. Problem Notes Manipulation (Clear and Remove Sentence)
  const clearNotes = resolveLocalVoiceTurn({
    text: 'clear notes',
    role: 'customer',
    currentRoute: '/customer/book/prov_ravi',
  });
  assert(clearNotes.intent === 'CLEAR_PROBLEM_DESCRIPTION', 'Test 31.9: "clear notes" resolves to CLEAR_PROBLEM_DESCRIPTION');

  const removeSentence = resolveLocalVoiceTurn({
    text: 'கடைசி வரியை நீக்கு',
    role: 'customer',
    currentRoute: '/customer/book/prov_ravi',
  });
  assert(removeSentence.intent === 'REMOVE_LAST_SENTENCE', 'Test 31.10: "கடைசி வரியை நீக்கு" resolves to REMOVE_LAST_SENTENCE');

  // 4. Payment Method Selection (QR, UPI, Card)
  const payQR = resolveLocalVoiceTurn({
    text: 'NEXDO QR',
    role: 'customer',
    currentRoute: '/customer/payment/bk_01',
  });
  assert(payQR.intent === 'SELECT_PAYMENT_METHOD', 'Test 31.11: "NEXDO QR" resolves to SELECT_PAYMENT_METHOD');
  assert(payQR.action.payload?.method === 'QR', 'Test 31.12: Method is QR');

  const payUPI = resolveLocalVoiceTurn({
    text: 'Test UPI',
    role: 'customer',
    currentRoute: '/customer/payment/bk_01',
  });
  assert(payUPI.intent === 'SELECT_PAYMENT_METHOD', 'Test 31.13: "Test UPI" resolves to SELECT_PAYMENT_METHOD');
  assert(payUPI.action.payload?.method === 'UPI', 'Test 31.14: Method is UPI');

  const payCard = resolveLocalVoiceTurn({
    text: 'Test Card',
    role: 'customer',
    currentRoute: '/customer/payment/bk_01',
  });
  assert(payCard.intent === 'SELECT_PAYMENT_METHOD', 'Test 31.15: "Test Card" resolves to SELECT_PAYMENT_METHOD');
  assert(payCard.action.payload?.method === 'CARD', 'Test 31.16: Method is CARD');

  // 5. Payment Verbal Authorization with Gate
  const payAuth = resolveLocalVoiceTurn({
    text: 'pay 149',
    role: 'customer',
    currentRoute: '/customer/payment/bk_01',
  });
  assert(payAuth.intent === 'CONFIRM_PAYMENT', 'Test 31.17: "pay 149" triggers CONFIRM_PAYMENT');

  const payConfirmYes = resolveLocalVoiceTurn({
    text: 'ஆமா',
    role: 'customer',
    currentRoute: '/customer/payment/bk_01',
    context: {
      pendingConfirmationAction: 'CONFIRM_PAYMENT',
    },
  });
  assert(payConfirmYes.intent === 'CONFIRM_PAYMENT', 'Test 31.18: "ஆமா" confirms pending CONFIRM_PAYMENT');

  // 6. Technician Job Completion & Availability
  const techComplete = resolveLocalVoiceTurn({
    text: 'வேலை முடிந்தது',
    role: 'technician',
    currentRoute: '/technician/jobs',
  });
  assert(techComplete.intent === 'COMPLETE_JOB', 'Test 31.19: "வேலை முடிந்தது" resolves to COMPLETE_JOB');

  const techOnline = resolveLocalVoiceTurn({
    text: 'go online',
    role: 'technician',
    currentRoute: '/technician',
  });
  assert(techOnline.intent === 'GO_ONLINE', 'Test 31.20: "go online" resolves to GO_ONLINE');

  const techOffline = resolveLocalVoiceTurn({
    text: 'offline போ',
    role: 'technician',
    currentRoute: '/technician',
  });
  assert(techOffline.intent === 'GO_OFFLINE', 'Test 31.21: "offline போ" resolves to GO_OFFLINE');

  // 7. Results Navigation & Details
  const nextTech = resolveLocalVoiceTurn({
    text: 'next technician',
    role: 'customer',
    currentRoute: '/customer/providers',
  });
  assert(nextTech.intent === 'SHOW_NEXT_TECHNICIAN', 'Test 31.22: "next technician" resolves to SHOW_NEXT_TECHNICIAN');

  const prevTech = resolveLocalVoiceTurn({
    text: 'முந்தைய technician',
    role: 'customer',
    currentRoute: '/customer/providers',
  });
  assert(prevTech.intent === 'SHOW_PREVIOUS_TECHNICIAN', 'Test 31.23: "முந்தைய technician" resolves to SHOW_PREVIOUS_TECHNICIAN');

  const descTech = resolveLocalVoiceTurn({
    text: 'இவரோட details சொல்லு',
    role: 'customer',
    currentRoute: '/customer/providers',
    context: {
      selectedTechnician: { name: 'Ravi Kumar', rating: 4.9, experienceYears: 8 },
    },
  });
  assert(descTech.intent === 'DESCRIBE_SELECTED_TECHNICIAN', 'Test 31.24: "இவரோட details சொல்லு" resolves to DESCRIBE_SELECTED_TECHNICIAN');

  // 8. Tabs Navigation
  const tabPast = resolveLocalVoiceTurn({
    text: 'past bookings',
    role: 'customer',
    currentRoute: '/customer/bookings',
  });
  assert(tabPast.intent === 'SWITCH_TAB', 'Test 31.25: "past bookings" resolves to SWITCH_TAB');
  assert(tabPast.action.payload?.tab === 'past', 'Test 31.26: Tab payload is "past"');

  const tabActive = resolveLocalVoiceTurn({
    text: 'active requests',
    role: 'customer',
    currentRoute: '/customer/bookings',
  });
  assert(tabActive.intent === 'SWITCH_TAB', 'Test 31.27: "active requests" resolves to SWITCH_TAB');
  assert(tabActive.action.payload?.tab === 'active', 'Test 31.28: Tab payload is "active"');

  // 9. Session: Login on login screen & Logout
  const loginSubmit = resolveLocalVoiceTurn({
    text: 'sign in',
    role: 'customer',
    currentRoute: '/login',
  });
  assert(loginSubmit.intent === 'SUBMIT_LOGIN', 'Test 31.29: "sign in" on /login resolves to SUBMIT_LOGIN');

  const logoutAction = resolveLocalVoiceTurn({
    text: 'logout',
    role: 'customer',
    currentRoute: '/customer',
  });
  assert(logoutAction.intent === 'LOGOUT', 'Test 31.30: "logout" resolves to LOGOUT');
}

console.log('\n================================================================');
console.log(`TEST RESULTS: ${passedTests} / ${totalTests} PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  throw new Error(`Verification tests failed: ${passedTests}/${totalTests} passed`);
}
