import { resolveLocalVoiceTurn } from '../src/voice/voiceClient';

const testCases = [
  // Polite English variations
  { text: "Could you kindly redirect me to the home dashboard?", role: "customer", expected: "NAVIGATE_HOME", lang: "en" },
  { text: "Please take me back to the main home screen", role: "customer", expected: "NAVIGATE_HOME", lang: "en" },
  { text: "I'd like to check my past bookings please", role: "customer", expected: "NAVIGATE_BOOKINGS", lang: "en" },
  { text: "Where can I review my previous service requests?", role: "customer", expected: "NAVIGATE_BOOKINGS", lang: "en" },
  { text: "Could you help me find a certified technician?", role: "customer", expected: "NAVIGATE_PROVIDERS", lang: "en" },
  { text: "I am looking for a professional repair technician", role: "customer", expected: "NAVIGATE_PROVIDERS", lang: "en" },
  { text: "Show me my account profile page", role: "customer", expected: "NAVIGATE_PROFILE", lang: "en" },
  
  // Technician English variations
  { text: "What assigned jobs do I currently have?", role: "technician", expected: "NAVIGATE_JOBS", lang: "en" },
  { text: "Can you display all my assigned work orders?", role: "technician", expected: "NAVIGATE_JOBS", lang: "en" },
  { text: "How much total income have I generated?", role: "technician", expected: "NAVIGATE_EARNINGS", lang: "en" },
  { text: "I want to inspect my total earnings summary", role: "technician", expected: "NAVIGATE_EARNINGS", lang: "en" },
  
  // Polite Tamil script variations
  { text: "தயவுசெய்து ஹோம் பேஜுக்கு போங்க", role: "customer", expected: "NAVIGATE_HOME", lang: "ta" },
  { text: "கொஞ்சம் புக்கிங் காட்டுங்க", role: "customer", expected: "NAVIGATE_BOOKINGS", lang: "ta" },
  { text: "ரிப்பேர் பண்ற டெக்னிஷியனை தேடுங்க", role: "customer", expected: "NAVIGATE_PROVIDERS", lang: "ta" },
  { text: "என்னோட அக்கவுண்ட் ப்ரொஃபைல் காட்டுங்க", role: "customer", expected: "NAVIGATE_PROFILE", lang: "ta" },
  { text: "இன்னைக்கு வேலைகளை கொஞ்சம் பாருங்க", role: "technician", expected: "NAVIGATE_JOBS", lang: "ta" },
  { text: "என் வருமானம் எவ்வளவுன்னு காட்டுங்க", role: "technician", expected: "NAVIGATE_EARNINGS", lang: "ta" },
  
  // Tanglish colloquial variations
  { text: "konjam home page ku kootitu ponga", role: "customer", expected: "NAVIGATE_HOME", lang: "ta" },
  { text: "en bookings list-a open pannunga", role: "customer", expected: "NAVIGATE_BOOKINGS", lang: "ta" },
  { text: "oru nalla technician-a thedunga", role: "customer", expected: "NAVIGATE_PROVIDERS", lang: "ta" },
  { text: "en profile details paakanum", role: "customer", expected: "NAVIGATE_PROFILE", lang: "ta" },
  { text: "indha technician-a select pannunga", role: "customer", expected: "SELECT_TECHNICIAN", lang: "ta" },
  { text: "naan spot-ku vandhuten", role: "technician", expected: "MARK_ARRIVED", lang: "ta" },
  { text: "velaya start pannidalaam", role: "technician", expected: "START_WORK", lang: "ta" },
  { text: "naan evlo sambadhichen", role: "technician", expected: "NAVIGATE_EARNINGS", lang: "ta" },
  { text: "yenna vela vandhuruku", role: "technician", expected: "NAVIGATE_JOBS", lang: "ta" },
];

let passed = 0;
let failed = 0;

for (const tc of testCases) {
  const result = resolveLocalVoiceTurn({
    text: tc.text,
    role: tc.role as any,
    currentRoute: tc.role === 'technician' ? '/technician' : '/customer',
  });
  const actionType = result?.action?.type;
  const langMatch = result?.language === tc.lang;
  
  if (actionType === tc.expected && langMatch) {
    console.log(`[PASS] "${tc.text}" -> ${actionType} (${result.language})`);
    passed++;
  } else {
    console.error(`[FAIL] "${tc.text}"`);
    console.error(`       Expected: ${tc.expected} (${tc.lang})`);
    console.error(`       Got:      ${actionType} (${result?.language})`);
    failed++;
  }
}

console.log(`\n================================================================`);
console.log(`ADVANCED NATURAL PHRASES: ${passed} / ${testCases.length} PASSED (${Math.round((passed / testCases.length) * 100)}%)`);
console.log(`================================================================`);

if (failed > 0) {
  process.exit(1);
}
