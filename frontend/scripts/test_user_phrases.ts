import { resolveLocalVoiceTurn } from '../src/voice/voiceClient';

const testCases = [
  // English Navigation
  { text: "go home", role: "customer", expected: "NAVIGATE_HOME" },
  { text: "go to home", role: "customer", expected: "NAVIGATE_HOME" },
  { text: "take me home", role: "customer", expected: "NAVIGATE_HOME" },
  { text: "open home", role: "customer", expected: "NAVIGATE_HOME" },
  { text: "open the home page", role: "customer", expected: "NAVIGATE_HOME" },
  { text: "I want to go home", role: "customer", expected: "NAVIGATE_HOME" },
  { text: "Can you take me to the home page?", role: "customer", expected: "NAVIGATE_HOME" },
  
  // Bookings
  { text: "show my bookings", role: "customer", expected: "NAVIGATE_BOOKINGS" },
  { text: "open my bookings", role: "customer", expected: "NAVIGATE_BOOKINGS" },
  { text: "I need my bookings", role: "customer", expected: "NAVIGATE_BOOKINGS" },
  { text: "Show me my bookings", role: "customer", expected: "NAVIGATE_BOOKINGS" },

  // Technician / Providers
  { text: "find a technician", role: "customer", expected: "NAVIGATE_PROVIDERS" },
  { text: "search for a technician", role: "customer", expected: "NAVIGATE_PROVIDERS" },
  { text: "Can you open the technician search?", role: "customer", expected: "NAVIGATE_PROVIDERS" },

  // Profile
  { text: "open my profile", role: "customer", expected: "NAVIGATE_PROFILE" },
  { text: "Take me to my profile", role: "customer", expected: "NAVIGATE_PROFILE" },

  // Jobs
  { text: "show my jobs", role: "technician", expected: "NAVIGATE_JOBS" },
  { text: "Show the jobs", role: "technician", expected: "NAVIGATE_JOBS" },

  // Earnings
  { text: "show my earnings", role: "technician", expected: "NAVIGATE_EARNINGS" },
  { text: "How much have I earned?", role: "technician", expected: "NAVIGATE_EARNINGS" },

  // Roles
  { text: "switch to customer", role: "technician", expected: "SWITCH_ROLE_CUSTOMER" },
  { text: "switch to technician", role: "customer", expected: "SWITCH_ROLE_TECHNICIAN" },

  // Tamil
  { text: "ஹோம் போ", role: "customer", expected: "NAVIGATE_HOME" },
  { text: "ஹோம் பேஜுக்கு போ", role: "customer", expected: "NAVIGATE_HOME" },
  { text: "என்னை ஹோம் பேஜுக்கு கூட்டிட்டு போ", role: "customer", expected: "NAVIGATE_HOME" },
  { text: "புக்கிங் காட்டு", role: "customer", expected: "NAVIGATE_BOOKINGS" },
  { text: "என்னோட புக்கிங் பாரு", role: "customer", expected: "NAVIGATE_BOOKINGS" },
  { text: "டெக்னிஷியனை தேடு", role: "customer", expected: "NAVIGATE_PROVIDERS" },
  { text: "ப்ரொஃபைல் காட்டு", role: "customer", expected: "NAVIGATE_PROFILE" },
  { text: "வேலைகள் காட்டு", role: "technician", expected: "NAVIGATE_JOBS" },
  { text: "வருமானம் காட்டு", role: "technician", expected: "NAVIGATE_EARNINGS" },
  { text: "கஸ்டமர் மோடுக்கு போ", role: "technician", expected: "SWITCH_ROLE_CUSTOMER" },
  { text: "டெக்னிஷியன் மோடுக்கு போ", role: "customer", expected: "SWITCH_ROLE_TECHNICIAN" },

  // Tanglish
  { text: "home ku po", role: "customer", expected: "NAVIGATE_HOME" },
  { text: "home page ku po", role: "customer", expected: "NAVIGATE_HOME" },
  { text: "ennai home ku kootitu po", role: "customer", expected: "NAVIGATE_HOME" },
  { text: "booking paaru", role: "customer", expected: "NAVIGATE_BOOKINGS" },
  { text: "en booking kaatu", role: "customer", expected: "NAVIGATE_BOOKINGS" },
  { text: "technician thedu", role: "customer", expected: "NAVIGATE_PROVIDERS" },
  { text: "profile kaatu", role: "customer", expected: "NAVIGATE_PROFILE" },
  { text: "jobs paaru", role: "technician", expected: "NAVIGATE_JOBS" },
  { text: "varumanam kaatu", role: "technician", expected: "NAVIGATE_EARNINGS" },
  { text: "customer mode ku po", role: "technician", expected: "SWITCH_ROLE_CUSTOMER" },
  { text: "technician mode ku po", role: "customer", expected: "SWITCH_ROLE_TECHNICIAN" },

  // Action buttons
  { text: "accept this job", role: "technician", expected: "ACCEPT_REQUEST" },
  { text: "naan vandhuten", role: "technician", expected: "MARK_ARRIVED" },
  { text: "I've arrived", role: "technician", expected: "MARK_ARRIVED" },
  { text: "start the work", role: "technician", expected: "START_WORK" },
  { text: "velaya start pannalam", role: "technician", expected: "START_WORK" },
];

let failed = 0;
for (const tc of testCases) {
  const currentRoute = tc.role === 'technician' ? '/technician' : '/customer';
  const res = resolveLocalVoiceTurn({
    text: tc.text,
    role: tc.role as any,
    currentRoute,
  });
  if (res.intent === tc.expected) {
    console.log(`[PASS] "${tc.text}" -> ${res.intent} (${res.language}) => "${res.response}"`);
  } else {
    failed++;
    console.error(`[FAIL] "${tc.text}" -> Expected ${tc.expected}, got ${res.intent} (score: ${res.confidence})`);
  }
}

console.log(`\nResults: ${testCases.length - failed}/${testCases.length} passed`);
if (failed > 0) process.exit(1);
