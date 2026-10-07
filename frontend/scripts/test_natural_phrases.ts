import { resolveLocalVoiceTurn } from '../src/voice/voiceClient.ts';

const testPhrases = [
  { text: "Can you take me to the page where I can see all my previous service requests?", role: "customer", expected: "NAVIGATE_BOOKINGS" },
  { text: "I want to see how much I've made so far", role: "technician", expected: "NAVIGATE_EARNINGS" },
  { text: "Can you take me to my bookings?", role: "customer", expected: "NAVIGATE_BOOKINGS" },
  { text: "என்னை என்னோட புக்கிங்ஸ்க்கு கூட்டிட்டு போ", role: "customer", expected: "NAVIGATE_BOOKINGS" },
  { text: "I want to see how much I've earned", role: "technician", expected: "NAVIGATE_EARNINGS" },
  { text: "என்னோட ப்ரொஃபைல் காட்டு", role: "customer", expected: "NAVIGATE_PROFILE" },
  { text: "எனக்கு ஒரு டெக்னிஷியன் வேணும்", role: "customer", expected: "NAVIGATE_PROVIDERS" },
  { text: "find someone who can repair this", role: "customer", expected: "NAVIGATE_PROVIDERS" },
  { text: "help me find a technician", role: "customer", expected: "NAVIGATE_PROVIDERS" },
  { text: "technician venum", role: "customer", expected: "NAVIGATE_PROVIDERS" },
  { text: "what jobs do I have", role: "technician", expected: "NAVIGATE_JOBS" },
  { text: "open my work", role: "technician", expected: "NAVIGATE_JOBS" },
  { text: "enna vela iruku", role: "technician", expected: "NAVIGATE_JOBS" },
  { text: "naan evlo earn panniruken", role: "technician", expected: "NAVIGATE_EARNINGS" },
  { text: "varumanam evlo", role: "technician", expected: "NAVIGATE_EARNINGS" },
  { text: "I need a technician", role: "customer", expected: "NAVIGATE_PROVIDERS" },
  { text: "home", role: "customer", expected: "NAVIGATE_HOME" },
  { text: "can you take me to home", role: "customer", expected: "NAVIGATE_HOME" },
  { text: "home page please", role: "customer", expected: "NAVIGATE_HOME" },
  { text: "home poganum", role: "customer", expected: "NAVIGATE_HOME" },
  { text: "where can I see my bookings", role: "customer", expected: "NAVIGATE_BOOKINGS" },
  { text: "show my account", role: "customer", expected: "NAVIGATE_PROFILE" },
  { text: "en profile open pannu", role: "customer", expected: "NAVIGATE_PROFILE" },
  { text: "show me technicians", role: "customer", expected: "NAVIGATE_PROVIDERS" },
  { text: "what did I earn", role: "technician", expected: "NAVIGATE_EARNINGS" },
  { text: "I want customer mode", role: "technician", expected: "SWITCH_ROLE_CUSTOMER" },
  { text: "take me to customer mode", role: "technician", expected: "SWITCH_ROLE_CUSTOMER" },
  { text: "I want technician mode", role: "customer", expected: "SWITCH_ROLE_TECHNICIAN" },
  { text: "take me to technician mode", role: "customer", expected: "SWITCH_ROLE_TECHNICIAN" },
];

console.log("Testing natural phrases against current implementation:\n");
let passed = 0;
for (const tc of testPhrases) {
  const currentRoute = tc.role === 'technician' ? '/technician' : '/customer';
  const res = resolveLocalVoiceTurn({
    text: tc.text,
    role: tc.role,
    currentRoute,
  });

  const ok = res.intent === tc.expected;
  if (ok) passed++;
  console.log(`${ok ? '[PASS]' : '[FAIL]'} "${tc.text}" (Role: ${tc.role}) => Intent: ${res.intent} (Exp: ${tc.expected}), Conf: ${res.confidence.toFixed(2)}, Lang: ${res.language}`);
  if (!ok) {
    console.log(`       Got response: "${res.response}"`);
  }
}
console.log(`\nResult: ${passed}/${testPhrases.length} passed.`);
