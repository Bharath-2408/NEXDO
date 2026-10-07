import { CanonicalAction, CanonicalActionType } from '../types/actions';
import { ACTION_REGISTRY, ActionDefinition } from './actionRegistry';
import { detectLanguage } from './entityExtractor';
import { extractEntitiesAndIntent } from './entityExtractor';
import { CANONICAL_SERVICES } from './taxonomy';
import { evaluateStateMachineTurn } from './conversation-manager/conversationStateMachine';
import { matchNavigationIntent } from './intent-engine/navigationIntents';
import { matchServiceIntent } from './intent-engine/serviceIntents';
import { matchBookingIntent } from './intent-engine/bookingIntents';
import { matchTechnicianIntent } from './intent-engine/technicianIntents';
import { MOCK_MATCHED_PROVIDERS } from '../constants/mockData';

export interface SemanticResolutionContext {
  role?: 'customer' | 'technician';
  currentScreen?: string;
  currentPath?: string;
  conversationLanguage?: string;
  visibleProviders?: any[];
  visibleOpportunities?: any[];
  activeBooking?: any;
  pendingConfirmationAction?: CanonicalActionType | null;
  [key: string]: any;
}

export interface SemanticResolutionResult {
  actionType: CanonicalActionType;
  action: CanonicalAction;
  confidence: number;
  response: string;
  language: 'ta' | 'en';
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
  payload?: any;
  rawText: string;
}

/**
 * Normalizes text and strips stacked agglutinative case markers, plural endings,
 * and verbal auxiliaries in Tamil and Romanized Tamil (Tanglish)
 * so that stems match canonical intent concepts cleanly.
 */
export function normalizeUtterance(text: string): {
  normalized: string;
  tokens: string[];
  stemmedTokens: string[];
} {
  const cleaned = text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const tokens = cleaned.split(' ').filter(Boolean);

  const stemmedTokens = tokens.map((token) => {
    let t = token;

    // 1. Strip stacked agglutinative Tanglish suffixes
    t = t.replace(/(?:-?skku|-?sku|-?suku|-?uku|-?kku|-?ku)$/, '');
    t = t.replace(/(?:-?sai|-?sa|-?ya|-?ye|-?a|-?ai|-?ah)$/, '');
    t = t.replace(/(?:-?la|-?le)$/, '');
    t = t.replace(/(?:-?oda|-?udaiya|-?udaya)$/, '');
    t = t.replace(/(?:-?nga|-?ungale|-?gal|-?gala)$/, '');
    t = t.replace(/(?:-?idu|-?pannu|-?panren|-?pannalam|-?panlam|-?pannanum)$/, '');

    // 2. Strip stacked agglutinative Tamil script suffixes
    t = t.replace(/(?:ஸ்க்கு|ஸ்களுக்கு|ஸுக்கு|க்கு|கு)$/, '');
    t = t.replace(/(?:ஸை|ஸ்களை|ஐ)$/, '');
    t = t.replace(/(?:இல்|ல்|ல|லே)$/, '');
    t = t.replace(/(?:உடைய|இலிருந்து|இன்)$/, '');
    t = t.replace(/(?:கள்|களுக்கு|களை|ஸ்)$/, '');
    t = t.replace(/ஆல்$/, '');

    // Agglutinative conjunctive/additive suffix (-um, -மும், -வும்)
    if (t === 'சத்தமும்') return 'சத்தம்';
    if (t.endsWith('um') && t.length > 3) t = t.replace(/um$/, '');
    if (t.endsWith('மும்') && t.length > 4) t = t.replace(/மும்$/, 'ம்');
    if (t.endsWith('வும்') && t.length > 4) t = t.replace(/வும்$/, '');

    // 3. Morphological Tanglish variants
    if (t === 'poganum' || t === 'pogavendum' || t === 'poga' || t === 'poren' || t === 'porom' || t === 'ponga') return 'po';
    if (t === 'vandhuten' || t === 'vandhutten' || t === 'vanthuten' || t === 'vanthutten' || t === 'vandhaachu' || t === 'vanthaachu') return 'vandhuten';
    if (t === 'aarambikkalam' || t === 'aarambikalam' || t === 'aarambikkalaam' || t === 'aarambi') return 'aarambi';
    if (t === 'varumaanam' || t === 'varumanathai' || t === 'varumaanathai' || t === 'varumanathuku' || t === 'varuvai') return 'varumanam';
    if (t === 'paakanum' || t === 'paarkalam' || t === 'paar' || t === 'paarunga') return 'paaru';
    if (t === 'kaatunga' || t === 'kaattunga' || t === 'kaattu' || t === 'kaamikiren' || t === 'kaami') return 'kaatu';
    if (t === 'kootitu' || t === 'kootitupo' || t === 'kootitu-po' || t === 'kootikitu' || t === 'kootituponga') return 'kootitu';
    if (t === 'thedu' || t === 'thedunga' || t === 'theadanum') return 'thedu';
    if (t === 'vela' || t === 'velai' || t === 'velaya' || t === 'velay' || t === 'velaiku') return 'velai';
    if (t === 'venum' || t === 'veanum' || t === 'thevai' || t === 'vendum') return 'venum';
    if (t === 'iruku' || t === 'irukku' || t === 'irukkanga' || t === 'vandhuruku' || t === 'vandhiruku' || t === 'vandhuchu') return 'iruku';
    if (t === 'pannalam' || t === 'pannalaam' || t === 'panlam' || t === 'panniruken') return 'pannu';
    if (t === 'earned' || t === 'earning' || t === 'earn' || t === 'made') return 'earnings';
    if (t === 'arrived' || t === 'arrive' || t === 'reached' || t === 'reach') return 'arrived';
    if (t === 'sambadhichen' || t === 'sambathiyam' || t === 'sambadhika') return 'varumanam';
    if (t === 'enna' || t === 'yenna' || t === 'ethana') return 'enna';
    if (t === 'evlo' || t === 'evvalo') return 'evlo';

    // 4. Normalize common Tamil script variants to canonical stems
    if (t === 'வருமானத்தை' || t === 'வருமானத்துக்கு' || t === 'வருவாய்' || t === 'சம்பாத்தியம்' || t === 'சம்பாதித்தேன்' || t === 'சம்பாதிச்சேன்') return 'வருமானம்';
    if (t === 'மதிப்பீட்டை' || t === 'மதிப்பீடுக்கு' || t === 'மதிப்பீடுகள்') return 'மதிப்பீடு';
    if (t === 'வேலைகளை' || t === 'வேலைக்கு' || t === 'வேலைகள்' || t === 'வேலையை' || t === 'பணிகள்') return 'வேலை';
    if (t === 'டெக்னீஷியனை' || t === 'டெக்னிஷியனை' || t === 'டெக்னிஷியன்களை' || t === 'டெக்னிஷியனுக்கு') return 'டெக்னிஷியன்';
    if (t === 'புக்கிங்கை' || t === 'புக்கிங்ஸ்' || t === 'முன்பதிவுகள்' || t === 'முன்பதிவு' || t === 'புக்கிங்க்ஸ்') return 'புக்கிங்';
    if (t === 'வீட்டுக்கு' || t === 'வீடுக்கு' || t === 'வீட்ல') return 'வீடு';
    if (t === 'முகப்புக்கு' || t === 'முகப்புல') return 'முகப்பு';
    if (t === 'ஜாப்ஸ்') return 'jobs';
    if (t === 'திறங்கள்' || t === 'திறன்களை') return 'திறன்கள்';
    if (t === 'போகணும்' || t === 'போகலாம்' || t === 'போங்க' || t === 'செல்ல') return 'போ';
    if (t === 'பார்க்கணும்' || t === 'பார்க்கலாம்' || t === 'பாருங்க') return 'பாரு';
    if (t === 'காட்டுங்க' || t === 'காமி' || t === 'காமிங்க') return 'காட்டு';
    if (t === 'தேடுங்க' || t === 'தேட') return 'தேடு';
    if (t === 'வேண்டும்') return 'வேணும்';
    if (t === 'வந்துட்டேன்' || t === 'வந்தாச்சு' || t === 'வந்துவிட்டேன்') return 'வந்துட்டேன்';
    if (t === 'ஆரம்பிக்கலாம்' || t === 'தொடங்கு') return 'ஆரம்பி';

    return t;
  });

  return {
    normalized: cleaned,
    tokens,
    stemmedTokens,
  };
}

/**
 * Extracts ordinal references (first, second, third / 1st, 2nd, 3rd / muthal, irandavathu / முதல், இரண்டாவது)
 */
export function extractOrdinalIndex(tokens: string[], stemmedTokens: string[]): number | undefined {
  const all = [...tokens, ...stemmedTokens];
  for (const t of all) {
    if (['first', '1st', 'one', 'muthal', 'முதல்', 'முதலில்', 'ஒன்றாவது', '1'].includes(t)) {
      return 0;
    }
    if (['second', '2nd', 'two', 'irandavathu', 'இரண்டாவது', 'ரெண்டாவது', '2'].includes(t)) {
      return 1;
    }
    if (['third', '3rd', 'three', 'moondravathu', 'மூன்றாவது', '3'].includes(t)) {
      return 2;
    }
  }
  return undefined;
}

/**
 * Checks if utterance contains deictic pointers (this, his, their, indha, ivar, ivara, இந்த, இவர், இவரை)
 */
export function containsDeicticPointer(tokens: string[], stemmedTokens: string[]): boolean {
  const deicticSet = new Set([
    'this',
    'his',
    'their',
    'indha',
    'ivar',
    'ivara',
    'ivaroada',
    'avar',
    'avara',
    'இந்த',
    'இவர்',
    'இவரை',
    'இவரோட',
    'அவர்',
    'அவரை',
  ]);
  return tokens.some((t) => deicticSet.has(t)) || stemmedTokens.some((t) => deicticSet.has(t));
}

/**
 * Core Semantic Intent Resolver
 * Intent-First Natural Language Understanding with deep semantic concept clustering,
 * contextual role awareness, agglutinative lemmatization, and same-language responses.
 */
export function resolveSemanticIntent(
  rawInput: string,
  context: SemanticResolutionContext = {}
): SemanticResolutionResult {
  const currentPath = context.currentPath || context.currentScreen || '';
  const currentRole = context.role || (currentPath.startsWith('/technician') ? 'technician' : 'customer');

  // 1. Language Switching Intent Check
  const trimmed = rawInput.trim();
  const isSwitchToEnglish =
    /(?:english(?:\s*language)?(?:\s*(?:use\s*(?:pannu|பண்ணு)|pesu|பேசு|la\s*pesu|speak|switch))|switch\s*to\s*english|speak\s*(?:in\s*)?english|ஆங்கிலத்திற்கு\s*மாறு|ஆங்கிலத்தில்\s*பேசு|english-?க்கு\s*மாறு|english\s*(?:la|il)\s*pesu|^english$)/i.test(trimmed);

  const isSwitchToTamil =
    /(?:tamil(?:\s*language)?(?:\s*(?:use\s*(?:pannu|பண்ணு)|pesu|பேசு|la\s*pesu|speak|switch))|switch\s*to\s*tamil|speak\s*(?:in\s*)?tamil|தமிழ்ல\s*பேசு|தமிழில்\s*பேசு|தமிழுக்கு\s*மாறு|தமிழ்\s*மொழி|^tamil$|^தமிழ்$)/i.test(trimmed);

  if (isSwitchToEnglish) {
    return {
      actionType: 'SWITCH_LANGUAGE',
      action: {
        type: 'SWITCH_LANGUAGE',
        payload: { language: 'en' },
        source: 'VOICE',
        timestamp: Date.now(),
      },
      confidence: 0.99,
      response: "Sure, I'll speak with you in English from now on. How can I help you?",
      language: 'en',
      payload: { language: 'en' },
      rawText: rawInput,
    };
  }

  if (isSwitchToTamil) {
    return {
      actionType: 'SWITCH_LANGUAGE',
      action: {
        type: 'SWITCH_LANGUAGE',
        payload: { language: 'ta' },
        source: 'VOICE',
        timestamp: Date.now(),
      },
      confidence: 0.99,
      response: 'சரி, இனி உங்களுடன் தமிழில் பேசுகிறேன். உங்களுக்கு என்ன உதவி வேண்டும்?',
      language: 'ta',
      payload: { language: 'ta' },
      rawText: rawInput,
    };
  }

  // 1b. Active Language Resolution: Selected Language is Source of Truth
  let userLang: 'ta' | 'en';
  if (context.conversationLanguage === 'en' || context.language === 'en' || context.language === 'en-IN') {
    userLang = 'en';
  } else if (context.conversationLanguage === 'ta' || context.language === 'ta' || context.language === 'ta-IN') {
    const langDetect = detectLanguage(rawInput, 'ta');
    userLang = langDetect.code === 'en' ? 'en' : 'ta';
  } else {
    const detected = detectLanguage(rawInput, 'en');
    userLang = detected.code === 'ta' ? 'ta' : 'en';
  }

  const { normalized, tokens, stemmedTokens } = normalizeUtterance(rawInput);
  const detectedIndex = extractOrdinalIndex(tokens, stemmedTokens);

  // 2. Pending Confirmation Resolution
  if (context.pendingConfirmationAction) {
    const isAffirmative =
      /^(?:yes|confirm|ok|okay|done|seri|sari|aama|aamam|aam|proceed|agree|approve|book pannu|book|pannu|confirm pannu|sari pannu|seri pannu)$/i.test(normalized) ||
      /^(?:ஆம்|ஆமா|ஆமாம்|சரி|சரிங்க|உறுதி|பண்ணு|புக் பண்ணு|உறுதி செய்)$/i.test(normalized) ||
      (tokens.length <= 2 && (tokens.includes('ஆமா') || tokens.includes('ஆம்') || tokens.includes('சரி') || tokens.includes('seri') || tokens.includes('sari') || tokens.includes('aama') || tokens.includes('yes') || tokens.includes('confirm') || tokens.includes('ok'))) ||
      /^(?:ஆமா|ஆம்|சரி|yes|ok),?\s*(?:book|புக்|தொடர்)/i.test(normalized) ||
      rawInput === 'ஆமா' || rawInput === 'ஆம்' || rawInput === 'சரி';
    const isNegative =
      /^(?:no|cancel|stop|abort|vendaam|vendam|illai|cancel pannu|வேண்டாம்|இல்லை|ரத்து|வேணாம்)$/i.test(normalized) ||
      (tokens.length <= 2 && (tokens.includes('வேண்டாம்') || tokens.includes('இல்லை') || tokens.includes('no') || tokens.includes('cancel') || tokens.includes('vendam') || tokens.includes('vendaam')));

    if (isAffirmative) {
      const pendingId = context.pendingConfirmationAction;
      let confirmResponse = '';
      if (pendingId === 'CANCEL_BOOKING') {
        confirmResponse = userLang === 'ta' ? 'சரி, இந்த booking-ஐ cancel பண்றேன்.' : "Okay, I'll cancel this booking.";
      } else if (pendingId === 'APPROVE_ESTIMATE') {
        confirmResponse = userLang === 'ta' ? 'மதிப்பீடு ஒப்புதல் அளிக்கப்பட்டது! விலை உறுதி செய்யப்படுகிறது.' : 'Estimate approved! Price locked at ₹1,100.';
      } else if (pendingId === 'REJECT_REQUEST') {
        confirmResponse = userLang === 'ta' ? 'சரி, இந்த வேலை தவிர்க்கப்பட்டது.' : 'Passed on this job request.';
      } else if (pendingId === 'CONFIRM_BOOKING') {
        confirmResponse = userLang === 'ta' ? 'சரி, booking-ஐ தொடர்கிறேன்.' : 'Sure, proceeding with your booking.';
      } else if (pendingId === 'CONFIRM_PAYMENT') {
        confirmResponse = userLang === 'ta' ? 'சரி, கட்டணம் செலுத்தப்படுகிறது.' : 'Payment confirmed and processing.';
      } else {
        confirmResponse = userLang === 'ta' ? 'செயல் உறுதிப்படுத்தப்பட்டது.' : 'Action confirmed.';
      }

      const confirmedProviderId = context.selectedTechnician?.id || (context.visibleProviders && context.visibleProviders[0]?.id) || 'prov_senthil';

      return {
        actionType: pendingId,
        action: {
          type: pendingId,
          payload: { bookingId: context.activeBooking?.id, providerId: confirmedProviderId, provider: context.selectedTechnician },
          source: 'VOICE',
          timestamp: Date.now(),
        },
        confidence: 0.99,
        response: confirmResponse,
        language: userLang,
        rawText: rawInput,
      };
    }

    if (isNegative) {
      const cancelResponse =
        context.pendingConfirmationAction === 'CONFIRM_BOOKING'
          ? (userLang === 'ta' ? 'சரி, booking cancel பண்ணிட்டேன்.' : 'Okay, booking cancelled.')
          : (userLang === 'ta' ? 'சரி, செயல் ரத்து செய்யப்பட்டது.' : 'Cancelled. How else can I help?');
      return {
        actionType: 'CANCEL',
        action: {
          type: 'CANCEL',
          payload: {},
          source: 'VOICE',
          timestamp: Date.now(),
        },
        confidence: 0.99,
        response: cancelResponse,
        language: userLang,
        rawText: rawInput,
      };
    }
  }

  // 2b. Select Nearest Technician
  const isNearestIntent =
    /\b(nearest|nearest one|closest|near me|அருகிலுள்ள|பக்கத்தில்|கிட்டக்க)\b/i.test(normalized) &&
    (tokens.includes('technician') || tokens.includes('pro') || tokens.includes('one') || tokens.includes('காட்டு') || tokens.includes('தேடு') || tokens.includes('செலக்ட்'));

  if (isNearestIntent) {
    return {
      actionType: 'SELECT_NEAREST_TECHNICIAN',
      action: {
        type: 'SELECT_NEAREST_TECHNICIAN',
        payload: { isNearest: true, index: 0 },
        source: 'VOICE',
        timestamp: Date.now(),
      },
      confidence: 0.98,
      response:
        userLang === 'ta'
          ? 'அருகிலுள்ள டெக்னிஷியன் தேர்ந்தெடுக்கப்பட்டார்.'
          : 'Selected the nearest verified technician.',
      language: userLang,
      payload: { isNearest: true, index: 0 },
      rawText: rawInput,
    };
  }

  // 2c. Direct Technician Booking Action ("இந்த technician-ஐ book பண்ணு", "book him", "ரெண்டாவது technician-ஐ book பண்ணணும்")
  const isDirectBookAction =
    /\b(book him|book this technician|book this person|book technician|book pannu|book pannunga|book pannalam|book panlam|book pannanum|book pannidu|ivara book|avara book|avare book|ivare book|அவரை book|இவரை book|இவரை புக்|இந்த technician.*book|நான் இவரையே book பண்ணுறேன்)\b/i.test(
      normalized
    ) ||
    /book பண்ணணும்|புக் பண்ணணும்|புக் பண்ணு|book பண்ணலாம்|book பண்ணு/i.test(rawInput) ||
    (tokens.includes('book') &&
      tokens.some((t) => ['him', 'this', 'ivar', 'ivara', 'avar', 'avara', 'avare', 'indha', 'இவரை', 'அவரை', 'இந்த', 'second', 'first', 'ரெண்டாவது', 'இரண்டாவது', 'முதல்'].includes(t)));

  if (isDirectBookAction) {
    const allProviders = (context.visibleProviders && context.visibleProviders.length > 0)
      ? context.visibleProviders
      : MOCK_MATCHED_PROVIDERS;
    const effIndex = detectedIndex !== undefined ? detectedIndex : 0;
    const targetTech = (detectedIndex !== undefined && allProviders[effIndex])
      ? allProviders[effIndex]
      : (context.selectedTechnician || allProviders[0]);
    return {
      actionType: 'CONFIRM_BOOKING',
      action: {
        type: 'CONFIRM_BOOKING',
        payload: { providerId: targetTech?.id, provider: targetTech, index: effIndex },
        source: 'VOICE',
        timestamp: Date.now(),
      },
      confidence: 0.96,
      response:
        userLang === 'ta'
          ? (targetTech?.name ? `சரி. டெக்னீசியன் ${targetTech.name}-ஐ book பண்ணலாமா?` : 'சரி. இந்த technician-ஐ book பண்ணலாமா?')
          : (targetTech?.name ? `Sure. Would you like to confirm booking technician ${targetTech.name}?` : 'Sure. Would you like to confirm booking this technician?'),
      language: userLang,
      requiresConfirmation: true,
      payload: { providerId: targetTech?.id, provider: targetTech, index: effIndex },
      rawText: rawInput,
    };
  }

  // 2d. Explicit Technician Home
  const isTechHome =
    (/\b(technician home|technician page|technician dashboard|technician side|technician home ku po|technician dashboard kaatu)\b/i.test(normalized) ||
      (tokens.some((t) => ['டெக்னிஷியன்', 'டெக்னீஷியன்', 'technician'].includes(t)) &&
        tokens.some((t) => ['ஹோம்', 'டேஷ்போர்டு', 'பக்கம்', 'home'].includes(t)))) &&
    !/\b(mode|switch|மாத்து|மாற்று)\b/i.test(normalized);

  if (isTechHome) {
    return {
      actionType: 'NAVIGATE_TECHNICIAN_HOME',
      action: {
        type: 'NAVIGATE_TECHNICIAN_HOME',
        payload: { destination: '/technician' },
        source: 'VOICE',
        timestamp: Date.now(),
      },
      confidence: 0.98,
      response:
        userLang === 'ta'
          ? 'டெக்னிஷியன் முகப்பு பக்கத்திற்கு செல்கிறேன்.'
          : 'Opening Technician Dashboard.',
      language: userLang,
      payload: { destination: '/technician' },
      rawText: rawInput,
    };
  }

  // 2e. Booking Status Query
  const isBookingStatusQuery =
    /\b(booking status|status enna|enga irukku|where is my booking|en booking enga|track pro|track technician)\b/i.test(normalized) ||
    ((tokens.includes('புக்கிங்') || tokens.includes('booking')) &&
      (tokens.includes('status') || tokens.includes('ஸ்டேட்டஸ்') || tokens.includes('நிலை') || tokens.includes('எங்கே') || tokens.includes('எங்க') || tokens.includes('enna') || tokens.includes('என்ன')));

  if (isBookingStatusQuery) {
    return {
      actionType: 'CHECK_BOOKING_STATUS',
      action: {
        type: 'CHECK_BOOKING_STATUS',
        payload: { destination: '/customer/bookings' },
        source: 'VOICE',
        timestamp: Date.now(),
      },
      confidence: 0.96,
      response:
        userLang === 'ta'
          ? 'உங்கள் புக்கிங் நிலையை பார்க்கிறேன்.'
          : 'Checking your current booking status.',
      language: userLang,
      payload: { destination: '/customer/bookings' },
      rawText: rawInput,
    };
  }

  // 2f. Session & Auth Intents
  if (/\b(logout|sign out|log out|வெளியேறு|லாக் அவுட்)\b/i.test(normalized)) {
    return {
      actionType: 'LOGOUT',
      action: {
        type: 'LOGOUT',
        payload: {},
        source: 'VOICE',
        timestamp: Date.now(),
      },
      confidence: 0.98,
      response: userLang === 'ta' ? 'சரி, கணக்கிலிருந்து வெளியேறுகிறேன்.' : 'Signing you out.',
      language: userLang,
      rawText: rawInput,
    };
  }

  if (/\b(sign in|login|log in|உள்நுழை)\b/i.test(normalized)) {
    if (currentPath === '/login') {
      return {
        actionType: 'SUBMIT_LOGIN',
        action: {
          type: 'SUBMIT_LOGIN',
          payload: {},
          source: 'VOICE',
          timestamp: Date.now(),
        },
        confidence: 0.98,
        response: userLang === 'ta' ? 'உள்நுழைகிறேன்.' : 'Signing in now.',
        language: userLang,
        rawText: rawInput,
      };
    } else {
      return {
        actionType: 'NAVIGATE_LOGIN',
        action: {
          type: 'NAVIGATE_LOGIN',
          payload: { destination: '/login' },
          source: 'VOICE',
          timestamp: Date.now(),
        },
        confidence: 0.98,
        response: userLang === 'ta' ? 'உள்நுழைவு பக்கத்திற்கு செல்கிறேன்.' : 'Opening sign in page.',
        language: userLang,
        rawText: rawInput,
      };
    }
  }

  if (/\b(sign up|signup|create account|பதிவு செய்|புதிய கணக்கு)\b/i.test(normalized)) {
    return {
      actionType: 'NAVIGATE_SIGNUP',
      action: {
        type: 'NAVIGATE_SIGNUP',
        payload: { destination: '/signup' },
        source: 'VOICE',
        timestamp: Date.now(),
      },
      confidence: 0.98,
      response: userLang === 'ta' ? 'பதிவு பக்கத்திற்கு செல்கிறேன்.' : 'Opening account registration.',
      language: userLang,
      rawText: rawInput,
    };
  }

  if (/\b(forgot password|password reset|பாஸ்வர்ட் மறந்து)\b/i.test(normalized)) {
    return {
      actionType: 'NAVIGATE_FORGOT_PASSWORD',
      action: {
        type: 'NAVIGATE_FORGOT_PASSWORD',
        payload: { destination: '/forgot-password' },
        source: 'VOICE',
        timestamp: Date.now(),
      },
      confidence: 0.98,
      response: userLang === 'ta' ? 'கடவுச்சொல் மீட்பு பக்கத்திற்கு செல்கிறேன்.' : 'Opening password reset.',
      language: userLang,
      rawText: rawInput,
    };
  }

  if (/\b(get started|start|onboarding|தொடங்கு)\b/i.test(normalized) && (currentPath === '/' || currentPath === '')) {
    return {
      actionType: 'NAVIGATE_ONBOARDING',
      action: {
        type: 'NAVIGATE_ONBOARDING',
        payload: { destination: '/onboarding' },
        source: 'VOICE',
        timestamp: Date.now(),
      },
      confidence: 0.98,
      response: userLang === 'ta' ? 'தொடங்குகிறேன்.' : 'Getting started with NEXDO.',
      language: userLang,
      rawText: rawInput,
    };
  }

  // 2g. Technician Operational Intents (Complete Job, Online/Offline)
  if (/\b(complete job|job completed|mark completed|finish work|work done|வேலை முடிந்தது|வேலை முடிச்சாச்சு|வேலை முடிஞ்சிருச்சு)\b/i.test(normalized)) {
    return {
      actionType: 'COMPLETE_JOB',
      action: {
        type: 'COMPLETE_JOB',
        payload: { jobId: context.activeBooking?.id },
        source: 'VOICE',
        timestamp: Date.now(),
      },
      confidence: 0.98,
      response: userLang === 'ta' ? 'சிறப்பு! வேலை முடிவடைந்ததாகப் பதிவு செய்கிறேன்.' : 'Great work! Marking this job completed.',
      language: userLang,
      rawText: rawInput,
    };
  }

  if (/\b(go online|set online)\b/i.test(normalized) || normalized.includes('online po') || normalized.includes('ஆன்லைன் போ') || normalized.includes('online போ')) {
    return {
      actionType: 'GO_ONLINE',
      action: {
        type: 'GO_ONLINE',
        payload: {},
        source: 'VOICE',
        timestamp: Date.now(),
      },
      confidence: 0.98,
      response: userLang === 'ta' ? 'நீங்கள் இப்போது ஆன்லைனில் உள்ளீர்கள்.' : 'You are now online and ready for requests.',
      language: userLang,
      rawText: rawInput,
    };
  }

  if (/\b(go offline|set offline)\b/i.test(normalized) || normalized.includes('offline po') || normalized.includes('ஆஃப்லைன் போ') || normalized.includes('offline போ')) {
    return {
      actionType: 'GO_OFFLINE',
      action: {
        type: 'GO_OFFLINE',
        payload: {},
        source: 'VOICE',
        timestamp: Date.now(),
      },
      confidence: 0.98,
      response: userLang === 'ta' ? 'நீங்கள் இப்போது ஆஃப்லைனில் உள்ளீர்கள்.' : 'You are now offline.',
      language: userLang,
      rawText: rawInput,
    };
  }

  // 2h. Provider List Navigation & Details
  if (/\b(next technician|next pro|next person)\b/i.test(normalized) || normalized.includes('அடுத்த technician') || normalized.includes('அடுத்த நபர்') || normalized.includes('அடுத்த pro')) {
    return {
      actionType: 'SHOW_NEXT_TECHNICIAN',
      action: {
        type: 'SHOW_NEXT_TECHNICIAN',
        payload: {},
        source: 'VOICE',
        timestamp: Date.now(),
      },
      confidence: 0.96,
      response: userLang === 'ta' ? 'அடுத்த டெக்னிஷியனை காட்டுகிறேன்.' : 'Showing next available technician.',
      language: userLang,
      rawText: rawInput,
    };
  }

  if (/\b(previous technician|previous pro)\b/i.test(normalized) || normalized.includes('முந்தைய technician') || normalized.includes('முந்தைய pro')) {
    return {
      actionType: 'SHOW_PREVIOUS_TECHNICIAN',
      action: {
        type: 'SHOW_PREVIOUS_TECHNICIAN',
        payload: {},
        source: 'VOICE',
        timestamp: Date.now(),
      },
      confidence: 0.96,
      response: userLang === 'ta' ? 'முந்தைய டெக்னிஷியனை காட்டுகிறேன்.' : 'Showing previous technician.',
      language: userLang,
      rawText: rawInput,
    };
  }

  if (/\b(describe technician|tell me about him|tell me about this pro)\b/i.test(normalized) || normalized.includes('இவரோட details') || normalized.includes('இவரைப் பற்றி') || normalized.includes('details சொல்லு')) {
    const prov = context.selectedTechnician || (context.visibleProviders && context.visibleProviders[0]);
    const descTextEn = prov
      ? `${prov.name} is a verified pro with ${prov.rating} rating and ${prov.experienceYears} years of experience.`
      : 'This is a verified service professional with proven expertise.';
    const descTextTa = prov
      ? `${prov.name} ${prov.rating} மதிப்பீடும் ${prov.experienceYears} வருட அனுபவமும் கொண்ட சான்றளிக்கப்பட்ட டெக்னிஷியன்.`
      : 'இவர் பல வருட அனுபவம் கொண்ட சான்றளிக்கப்பட்ட டெக்னிஷியன்.';
    return {
      actionType: 'DESCRIBE_SELECTED_TECHNICIAN',
      action: {
        type: 'DESCRIBE_SELECTED_TECHNICIAN',
        payload: { provider: prov },
        source: 'VOICE',
        timestamp: Date.now(),
      },
      confidence: 0.96,
      response: userLang === 'ta' ? descTextTa : descTextEn,
      language: userLang,
      rawText: rawInput,
    };
  }

  // 2i. Tabs Navigation
  const isPastTab =
    /\b(past bookings|previous bookings|service history|past requests|past bookings show|previous service requests|past services)\b/i.test(normalized) ||
    normalized.includes('முந்தைய bookings காட்டு') ||
    normalized.includes('past bookings காட்டு') ||
    normalized.includes('முந்தைய புக்கிங்ஸ்') ||
    normalized.includes('முந்தைய bookings') ||
    normalized.includes('முந்தைய முன்பதிவு') ||
    normalized.includes('வரலாறு') ||
    normalized === 'past' ||
    (tokens.includes('past') && (tokens.includes('bookings') || tokens.includes('booking') || tokens.includes('requests') || tokens.includes('show') || tokens.includes('காட்டு'))) ||
    (tokens.includes('previous') && (tokens.includes('bookings') || tokens.includes('booking') || tokens.includes('requests')));

  if (isPastTab) {
    return {
      actionType: 'SWITCH_TAB',
      action: {
        type: 'SWITCH_TAB',
        payload: { tab: 'past' },
        source: 'VOICE',
        timestamp: Date.now(),
      },
      confidence: 0.98,
      response: userLang === 'ta' ? 'முந்தைய சேவை விவரங்களைக் காட்டுகிறேன்.' : 'Showing your past service history.',
      language: userLang,
      payload: { tab: 'past' },
      rawText: rawInput,
    };
  }

  const isActiveTab =
    /\b(active requests|active bookings|current bookings|active requests show|current requests|open requests|ongoing bookings)\b/i.test(normalized) ||
    normalized.includes('active bookings காட்டு') ||
    normalized.includes('நடப்பு bookings காட்டு') ||
    normalized.includes('active bookings') ||
    normalized.includes('நடப்பு புக்கிங்ஸ்') ||
    normalized.includes('நடப்பு முன்பதிவு') ||
    normalized === 'active' ||
    (tokens.includes('active') && (tokens.includes('bookings') || tokens.includes('booking') || tokens.includes('requests') || tokens.includes('show') || tokens.includes('காட்டு'))) ||
    (tokens.includes('current') && (tokens.includes('bookings') || tokens.includes('booking') || tokens.includes('requests')));

  if (isActiveTab) {
    return {
      actionType: 'SWITCH_TAB',
      action: {
        type: 'SWITCH_TAB',
        payload: { tab: 'active' },
        source: 'VOICE',
        timestamp: Date.now(),
      },
      confidence: 0.98,
      response: userLang === 'ta' ? 'நடப்பு முன்பதிவுகளைக் காட்டுகிறேன்.' : 'Showing your active booking requests.',
      language: userLang,
      payload: { tab: 'active' },
      rawText: rawInput,
    };
  }

  // 2j. Notes Manipulation (Clear / Remove line)
  const isClearNotes =
    /\b(clear notes|clear problem|clear description|clear special instructions)\b/i.test(normalized) ||
    normalized.includes('நோட்ஸ் கிளியர்') ||
    normalized.includes('இதை clear') ||
    normalized.includes('விவரங்களை அழி') ||
    normalized.includes('குறிப்புகளை அழி') ||
    (tokens.includes('clear') && (tokens.includes('notes') || tokens.includes('description') || tokens.includes('problem')));

  if (isClearNotes) {
    return {
      actionType: 'CLEAR_PROBLEM_DESCRIPTION',
      action: {
        type: 'CLEAR_PROBLEM_DESCRIPTION',
        payload: {},
        source: 'VOICE',
        timestamp: Date.now(),
      },
      confidence: 0.98,
      response: userLang === 'ta' ? 'பிரச்சனை குறிப்புகள் அழிக்கப்பட்டன.' : 'Cleared problem notes.',
      language: userLang,
      rawText: rawInput,
    };
  }

  const isRemoveSentence =
    /\b(remove last sentence|delete last sentence|delete last line|remove last line)\b/i.test(normalized) ||
    normalized.includes('கடைசி வரியை நீக்கு') ||
    normalized.includes('கடைசி வரியை அழி') ||
    normalized.includes('கடைசி வாக்கியத்தை நீக்கு');

  if (isRemoveSentence) {
    return {
      actionType: 'REMOVE_LAST_SENTENCE',
      action: {
        type: 'REMOVE_LAST_SENTENCE',
        payload: {},
        source: 'VOICE',
        timestamp: Date.now(),
      },
      confidence: 0.98,
      response: userLang === 'ta' ? 'குறிப்புகளிலிருந்து கடைசி வரி நீக்கப்பட்டது.' : 'Removed last sentence from problem notes.',
      language: userLang,
      rawText: rawInput,
    };
  }

  // 2k. Notes Appending on /customer/book
  if (currentPath.includes('/book') && !isDirectBookAction) {
    const isNotesQuery =
      (/\b(cooling|water leak|sound|noise|leak|notes|fault|issue|problem|broken|refrigerant)\b/i.test(normalized) ||
        tokens.some((t) => ['சத்தம்', 'சத்தமும்', 'இரைச்சல்', 'குளிரல', 'வரல', 'வருது', 'ஒழுகி', 'நோட்ஸ்', 'குறிப்பு', 'பிரச்சனை'].includes(t)) ||
        stemmedTokens.some((t) => ['சத்தம்', 'சத்தமும்', 'இரைச்சல்', 'நோட்ஸ்'].includes(t)) ||
        rawInput.includes('சத்தமும்') ||
        rawInput.includes('சத்தம்') ||
        rawInput.includes('வருது') ||
        rawInput.includes('வரல') ||
        rawInput.includes('இரைச்சல்')) &&
      !/\b(home|bookings|technician|profile|earnings|cancel|book|confirm)\b/i.test(normalized);

    if (isNotesQuery) {
      return {
        actionType: 'APPEND_PROBLEM_DESCRIPTION',
        action: {
          type: 'APPEND_PROBLEM_DESCRIPTION',
          payload: { text: rawInput, description: rawInput },
          source: 'VOICE',
          timestamp: Date.now(),
        },
        confidence: 0.94,
        response:
          userLang === 'ta'
            ? 'சரி, பிரச்சனை விவரங்களில் சேர்த்துள்ளேன்.'
            : 'Added that note to your problem description.',
        language: userLang,
        payload: { text: rawInput, description: rawInput },
        rawText: rawInput,
      };
    }
  }

  // 2b. State Machine Turn Evaluation (for active booking confirmation stage)
  if (context.conversationState === 'BOOKING_PENDING_CONFIRMATION' || context.pendingConfirmation) {
    const smTurn = evaluateStateMachineTurn(normalized, tokens, context, userLang);
    if (smTurn.handled && smTurn.action) {
      return {
        actionType: smTurn.action.type,
        action: smTurn.action,
        confidence: smTurn.confidence,
        response: smTurn.response ? smTurn.response[userLang] : 'Action confirmed.',
        language: userLang,
        payload: smTurn.action.payload,
        rawText: rawInput,
      };
    }
  }

  // 3. Ambiguous Generic "Repair" Request (Section 8: "Repair வேணும்" -> Prompt Clarification)
  const hasSpecificAppliance =
    /\b(ac|air\s*conditioner|cooler|cooling|tv|television|fridge|refrigerator|fan|ceiling\s*fan|washing\s*machine|microwave|oven|geyser|water\s*heater|heater|bike|motorcycle|scooter|car|pipe|tap|sink|leak|leakage|wiring|switchboard|fuse|plumb|electric)\b/i.test(
      normalized
    ) ||
    (/[\u0B80-\u0BFF]/.test(rawInput) &&
      /\b(ஏசி|டிவி|பிரிட்ஜ்|ஃபேன்|விசிறி|வாஷிங்\s*மெஷின்|மைக்ரோவேவ்|கீசர்|பைக்|கார்|குழாய்|கசிவு|வயரிங்|ஸ்விட்ச்)\b/i.test(
        normalized
      ));

  const isAmbiguousRepair =
    !hasSpecificAppliance &&
    (/^(?:repair|repair venum|repair thevai|service|service venum|i need repair|i need service|ரிப்பேர் வேணும்|சர்வீஸ் வேணும்|repair பண்ணனும்|எனக்கு repair வேணும்)$/i.test(
      normalized
    ) ||
      ((tokens.includes('repair') || tokens.includes('ரிப்பேர்')) &&
        tokens.length <= 3 &&
        !tokens.includes('start')));

  if (isAmbiguousRepair) {
    const clarifyMsg =
      userLang === 'ta'
        ? 'சரி. என்ன சேவை தேவைப்படுகிறது? ஏசி, எலக்ட்ரிக்கல், பிளம்பிங் அல்லது வேறேதும் வேலையா?'
        : 'Sure. What service do you need? AC, electrical, plumbing, or something else?';

    return {
      actionType: 'HELP',
      action: {
        type: 'HELP',
        payload: { clarificationNeeded: true },
        source: 'VOICE',
        timestamp: Date.now(),
      },
      confidence: 0.95,
      response: clarifyMsg,
      language: userLang,
      rawText: rawInput,
    };
  }

  // 4. Specific Appliance Breakdown or Service Need (EXPRESS_NEED)
  if (hasSpecificAppliance) {
    const entities = extractEntitiesAndIntent(rawInput);
    const srvMatch = matchServiceIntent(rawInput, normalized, tokens);
    const canonicalService = srvMatch.canonicalService || entities.canonicalService;
    const serviceInfo = CANONICAL_SERVICES[canonicalService] || CANONICAL_SERVICES.GENERAL_HOME_MAINTENANCE;

    let preferredTime: string | undefined = undefined;
    if (entities.urgency === 'URGENT') {
      preferredTime = 'Within 45 Minutes (Urgent)';
    } else if (entities.date && entities.timeDisplay) {
      const d = entities.date.charAt(0).toUpperCase() + entities.date.slice(1);
      preferredTime = `${d} · ${entities.timeDisplay}`;
    } else if (entities.timeDisplay) {
      preferredTime = entities.timeDisplay;
    } else if (entities.date) {
      preferredTime = entities.date.charAt(0).toUpperCase() + entities.date.slice(1);
    }

    const serviceNeed = {
      rawTranscript: rawInput,
      normalizedService: serviceInfo.title,
      serviceCategory: srvMatch.serviceCategory || entities.serviceCategory,
      urgency: entities.urgency,
      preferredTime: preferredTime || (entities.time ? 'Scheduled' : 'Flexible / To be scheduled'),
      location: 'Adyar / Karur Service Zone',
      specificIssue: srvMatch.problemDescription || rawInput,
      estimatedCostRange: serviceInfo.estimatedCostRange,
      clarificationNeeded: entities.clarificationNeeded || srvMatch.clarificationNeeded,
      canonicalService,
      problem: srvMatch.problem || 'GENERAL_ISSUE',
    };

    let needResponse = '';
    if (serviceNeed.clarificationNeeded) {
      needResponse =
        userLang === 'ta'
          ? 'சரி. என்ன சேவை தேவைப்படுகிறது? ஏசி, எலக்ட்ரிக்கல், பிளம்பிங் அல்லது வேறேதும் வேலையா?'
          : 'Sure. What service do you need? AC, electrical, plumbing, or something else?';
    } else {
      const taServiceMap: Record<string, string> = {
        TV_REPAIR: 'டிவி பழுது சரி செய்ய technician',
        AC_REPAIR: 'AC repair',
        AC_SERVICE: 'AC service',
        AC_INSTALLATION: 'AC installation செய்ய technician',
        ELECTRICIAN: 'எலக்ட்ரீஷியன்',
        ELECTRICAL: 'எலக்ட்ரீஷியன்',
        PLUMBER: 'பிளம்பிங் வேலைக்கு technician',
        PLUMBING: 'பிளம்பிங் வேலைக்கு technician',
        FAN_REPAIR: 'ஃபேன் பழுது சரி செய்ய technician',
        REFRIGERATOR_REPAIR: 'பிரிட்ஜ் பழுது சரி செய்ய technician',
        WASHING_MACHINE_REPAIR: 'வாஷிங் மெஷின் பழுது சரி செய்ய technician',
        MICROWAVE_REPAIR: 'மைக்ரோவேவ் ஓவன் பழுது சரி செய்ய technician',
        GEYSER_REPAIR: 'கீசர் பழுது சரி செய்ய technician',
        BIKE_REPAIR: 'டூ-வீலர் சர்வீஸ் மெக்கானிக்',
      };

      const enServiceMap: Record<string, string> = {
        TV_REPAIR: 'TV repair technicians',
        AC_REPAIR: 'AC repair technicians',
        AC_SERVICE: 'AC service technicians',
        AC_INSTALLATION: 'AC installation specialists',
        ELECTRICIAN: 'electricians',
        ELECTRICAL: 'electricians',
        PLUMBER: 'plumbers',
        PLUMBING: 'plumbers',
        FAN_REPAIR: 'ceiling fan repair technicians',
        REFRIGERATOR_REPAIR: 'refrigerator repair technicians',
        WASHING_MACHINE_REPAIR: 'washing machine repair technicians',
        MICROWAVE_REPAIR: 'microwave repair technicians',
        GEYSER_REPAIR: 'water heater technicians',
        BIKE_REPAIR: 'two-wheeler mechanics',
      };

      const taTarget = taServiceMap[canonicalService] || 'technician';
      const enTarget = enServiceMap[canonicalService] || 'technicians';

      needResponse =
        userLang === 'ta'
          ? `சரி, உங்களுக்கு ${taTarget} வேண்டும். நான் அருகிலுள்ள technician-களை காட்டுகிறேன்.`
          : `Sure. I'll show you available ${enTarget}.`;
    }

    const canonicalAction: CanonicalAction = {
      type: 'EXPRESS_NEED',
      payload: serviceNeed,
      source: 'VOICE',
      timestamp: Date.now(),
    };

    return {
      actionType: 'EXPRESS_NEED',
      action: canonicalAction,
      confidence: Math.max(0.70, entities.confidenceScore),
      response: needResponse,
      language: userLang,
      payload: serviceNeed,
      rawText: rawInput,
    };
  }

  // 3. High-level Semantic Speech Acts & Semantic Features
  const isThirdPersonOrDeictic = /\b(his|their|this|pro|technician|avar|avara|ivar|ivara|ivaroada)\b/i.test(normalized) ||
    tokens.some((t) => ['இந்த', 'இவர்', 'இவரை', 'இவரோட', 'அவர்', 'அவரை'].includes(t));
  const isFirstPerson = /\b(my|en|enga|ennoda)\b/i.test(normalized) ||
    tokens.some((t) => ['என்', 'என்னோட', 'எனக்கு', 'என்னை', 'சுய'].includes(t));

  const hasCancelVerb = /\b(cancel|abort|stop|drop|vendaam)\b/i.test(normalized) ||
    tokens.some((t) => ['ரத்து', 'வேண்டாம்', 'கேன்சல்'].includes(t));
  const hasAcceptVerb = /\b(accept|take|agree|confirm)\b/i.test(normalized) ||
    tokens.some((t) => ['ஏற்றுக்கொள்', 'ஏத்துக்கோ', 'எடுத்துக்கோ', 'சரி'].includes(t));
  const hasRejectVerb = /\b(pass|reject|skip|decline|dismiss|vendaam)\b/i.test(normalized) ||
    tokens.some((t) => ['தவிர்', 'வேண்டாம்', 'நிராகரி'].includes(t));
  const hasArrivedVerb = /\b(arrived|arrive|reached|reach|doorstep|vandhuten|vanthuten)\b/i.test(normalized) ||
    tokens.some((t) => ['வந்துட்டேன்', 'வந்தாச்சு'].includes(t)) || stemmedTokens.includes('vandhuten') || stemmedTokens.includes('வந்துட்டேன்');
  const hasStartWorkVerb = /\b(start work|start the work|begin work|begin the job|start repair|velai aarambikkalam|velaya start|aarambikkalam|aarambi)\b/i.test(normalized) ||
    tokens.some((t) => ['ஆரம்பி', 'தொடங்கு'].includes(t)) || stemmedTokens.includes('aarambi') || stemmedTokens.includes('ஆரம்பி');

  const hasNavigateAct = /\b(go|take me|open|show|view|see|check|display|track|bring me|visit|navigate|head|back|return|where can i see|where are|can you take me|i want to go|i want to|redirect|kindly redirect|inspect|review|po|ponga|thira|kaatu|paaru|open|show|poganum|kootitu)\b/i.test(normalized) ||
    tokens.some((t) => ['போ', 'திற', 'காட்டு', 'பாரு', 'பார்', 'செல்லு', 'திரும்பு', 'கூட்டிட்டு'].includes(t)) ||
    stemmedTokens.includes('po') || stemmedTokens.includes('kaatu') || stemmedTokens.includes('paaru') || stemmedTokens.includes('kootitu') ||
    stemmedTokens.includes('போ') || stemmedTokens.includes('காட்டு') || stemmedTokens.includes('பாரு');

  const hasQueryAmountAct = /\b(how much|what did i|what have i|how much have i|how much did i|how much i made|how much have i made|how much i earned|what did i earn|evlo|evvalo|total earnings|total income|earnings summary)\b/i.test(normalized) ||
    tokens.some((t) => ['எவ்வளவு', 'எவ்ளோ', 'evlo', 'evvalo'].includes(t)) || stemmedTokens.includes('evlo');

  const hasQueryJobsAct = /\b(what jobs do i have|what jobs|what work|what do i have|what is there|what jobs have|what tasks|what assigned jobs|what assigned work|assigned jobs|assigned work|work orders|enna vela iruku|enna vela|yenna vela)\b/i.test(normalized) ||
    (tokens.some((t) => ['வேலை', 'வேலைகள்', 'ஜாப்ஸ்'].includes(t)) && (tokens.includes('இருக்கு') || tokens.includes('பாரு') || tokens.includes('என்ன') || normalized.includes('என்ன வேலை'))) ||
    (stemmedTokens.includes('enna') && stemmedTokens.includes('velai'));

  const hasNeedDiscoveryAct = /\b(find|search|look for|need|want|help me find|hire|browse|someone who can repair|someone to repair|thedu|venum|thevai)\b/i.test(normalized) ||
    tokens.some((t) => ['தேடு', 'வேணும்', 'வேண்டும்', 'தேவை', 'thedu', 'venum', 'thevai'].includes(t)) ||
    stemmedTokens.includes('thedu') || stemmedTokens.includes('venum') || stemmedTokens.includes('தேடு') || stemmedTokens.includes('வேணும்');

  // Concept Match Checkers
  const hasConceptHome = /\b(home|home page|main page|dashboard|start page|house|mukappu|veedu|veetuku)\b/i.test(normalized) ||
    tokens.some((t) => ['ஹோம்', 'முகப்பு', 'வீடு'].includes(t)) ||
    stemmedTokens.includes('home') || stemmedTokens.includes('veedu') || stemmedTokens.includes('முகப்பு') || stemmedTokens.includes('ஹோம்') || stemmedTokens.includes('வீடு');

  const hasConceptBookings = /\b(booking|bookings|appointment|appointments|order|orders|service request|service requests|previous service request|previous service requests|previous request|previous requests|past request|past requests|request history|booking history|service history|order history|munpathivu|sevai pathivu)\b/i.test(normalized) ||
    tokens.some((t) => ['புக்கிங்', 'புக்கிங்ஸ்', 'முன்பதிவு', 'முன்பதிவுகள்'].includes(t)) ||
    stemmedTokens.includes('booking') || stemmedTokens.includes('புக்கிங்') || stemmedTokens.includes('முன்பதிவு');

  const hasConceptProviders = /\b(technician|technicians|mechanic|electrician|plumber|repairman|someone who can repair|someone to repair|repair person|specialist|pro|pros|provider|providers|handyman)\b/i.test(normalized) ||
    tokens.some((t) => ['டெக்னிஷியன்', 'டெக்னீஷியன்', 'டெக்னிஷியன்கள்', 'மெக்கானிக்', 'தொழிலாளி', 'நிபுணர்'].includes(t)) ||
    stemmedTokens.includes('technician') || stemmedTokens.includes('டெக்னிஷியன்');

  const hasConceptProfile = /\b(profile|my profile|account|my account|settings|personal details|user details|user profile|suyavivaram)\b/i.test(normalized) ||
    tokens.some((t) => ['சுயவிவரம்', 'ப்ரொஃபைல்', 'ப்ரோஃபைல்', 'கணக்கு'].includes(t)) ||
    stemmedTokens.includes('profile') || stemmedTokens.includes('சுயவிவரம்') || stemmedTokens.includes('ப்ரொஃபைல்');

  const hasConceptJobs = /\b(job|jobs|my jobs|available jobs|assigned jobs|task|tasks|work|my work|the work|work orders?|assigned work|opportunities|requests|velai|vela)\b/i.test(normalized) ||
    tokens.some((t) => ['வேலை', 'வேலைகள்', 'ஜாப்ஸ்', 'பணிகள்'].includes(t)) ||
    stemmedTokens.includes('job') || stemmedTokens.includes('velai') || stemmedTokens.includes('வேலை');

  const hasConceptEarnings = /\b(earnings|earning|my earnings|income|my income|payout|payouts|revenue|money|wage|salary|wallet|balance|earn|earned|made|made so far|amount made|varumanam|sambadhichen)\b/i.test(normalized) ||
    tokens.some((t) => ['வருமானம்', 'வருவாய்', 'சம்பாத்தியம்', 'பணம்', 'கட்டணம்'].includes(t)) ||
    stemmedTokens.includes('earnings') || stemmedTokens.includes('varumanam') || stemmedTokens.includes('வருமானம்');

  const hasConceptSwitchCustomer = /\b(switch to customer|customer mode|take me to customer mode|i want customer mode|change to customer|customer mode ku po|customer mode ku maathu|customer ku po)\b/i.test(normalized) ||
    tokens.some((t) => ['கஸ்டமர்', 'வாடிக்கையாளர்'].includes(t)) && (normalized.includes('மோடு') || normalized.includes('mode') || normalized.includes('போ') || normalized.includes('மாற்று'));

  const hasConceptSwitchTechnician = /\b(switch to technician|technician mode|take me to technician mode|i want technician mode|change to technician|technician mode ku po|technician mode ku maathu|technician ku po)\b/i.test(normalized) ||
    tokens.some((t) => ['டெக்னிஷியன்'].includes(t)) && (normalized.includes('மோடு') || normalized.includes('mode') || normalized.includes('போ') || normalized.includes('மாற்று'));

  const hasConceptBack = /\b(back|go back|back po|take me back|pinnadi)\b/i.test(normalized) ||
    tokens.some((t) => ['பின்னால்', 'திரும்பு'].includes(t));

  // 4. Candidate Evaluation Against ACTION_REGISTRY
  interface ScoredCandidate {
    def: ActionDefinition;
    score: number;
    rawScore: number;
    matchType: 'semantic_intent' | 'exact_phrase' | 'substring_phrase' | 'verb_noun';
  }

  const candidates: ScoredCandidate[] = [];

  for (const def of ACTION_REGISTRY) {
    let score = 0;
    let matchType: ScoredCandidate['matchType'] = 'verb_noun';

    // A. Role matching
    if (def.role === 'any') {
      score += 0.05;
    } else if (def.role === currentRole) {
      score += 0.20;
    } else {
      const isSwitch = def.id === 'SWITCH_ROLE_CUSTOMER' || def.id === 'SWITCH_ROLE_TECHNICIAN';
      if (!isSwitch) {
        score -= 0.40; // Significant penalty for wrong role
      }
    }

    // B. Route Context Bonus
    if (def.contextual?.relevantRoutes) {
      const matchesScreen = def.contextual.relevantRoutes.some((route: string) =>
        currentPath.startsWith(route) || currentPath === route
      );
      if (matchesScreen) {
        score += 0.15;
      }
    }

    // C. Strict Safety Negative Constraints
    // CANCEL_BOOKING MUST have an explicit cancel verb
    if (def.id === 'CANCEL_BOOKING') {
      if (!hasCancelVerb) continue;
      if (hasConceptBookings) {
        score += 0.85;
        matchType = 'semantic_intent';
      }
    }

    // ACCEPT_REQUEST MUST have an explicit acceptance verb
    if (def.id === 'ACCEPT_REQUEST') {
      if (!hasAcceptVerb) continue;
      if (hasConceptJobs || /\b(job|request|opportunity)\b/i.test(normalized)) {
        score += 0.85;
        matchType = 'semantic_intent';
      }
    }

    // REJECT_REQUEST MUST have an explicit rejection verb
    if (def.id === 'REJECT_REQUEST') {
      if (!hasRejectVerb) continue;
      if (hasConceptJobs || /\b(job|request|opportunity)\b/i.test(normalized)) {
        score += 0.85;
        matchType = 'semantic_intent';
      }
    }

    // MARK_ARRIVED MUST have arrival verb
    if (def.id === 'MARK_ARRIVED') {
      if (hasArrivedVerb) {
        score += 0.85;
        matchType = 'semantic_intent';
      }
    }

    // START_WORK MUST have start work verb
    if (def.id === 'START_WORK') {
      if (hasStartWorkVerb) {
        score += 0.85;
        matchType = 'semantic_intent';
      }
    }

    // VIEW_TECHNICIAN_PROFILE vs NAVIGATE_PROFILE
    if (def.id === 'VIEW_TECHNICIAN_PROFILE') {
      if (isFirstPerson) continue; // "my profile" must NEVER match technician's profile
      if (isThirdPersonOrDeictic && (hasConceptProfile || /\b(details|bio|விவரம்)\b/i.test(normalized))) {
        score += 0.85;
        matchType = 'semantic_intent';
      }
    }

    if (def.id === 'NAVIGATE_PROFILE') {
      if (isThirdPersonOrDeictic && !isFirstPerson) {
        score -= 0.50; // Deictic/third-person points to someone else
      }
    }

    // D. Direct Semantic Intent Resolvers
    // NAVIGATE_HOME
    if (def.id === 'NAVIGATE_HOME') {
      if (hasConceptHome && (hasNavigateAct || tokens.length <= 3)) {
        score += 0.85;
        matchType = 'semantic_intent';
      }
    }

    // NAVIGATE_BOOKINGS
    if (def.id === 'NAVIGATE_BOOKINGS') {
      const isWorkOrderJobQuery = currentRole === 'technician' && /\b(work orders?|assigned work)\b/i.test(normalized);
      if (hasConceptBookings && !hasCancelVerb && !isWorkOrderJobQuery) {
        score += 0.85;
        matchType = 'semantic_intent';
      }
    }

    // NAVIGATE_PROVIDERS
    if (def.id === 'NAVIGATE_PROVIDERS') {
      if (hasConceptProviders && (hasNeedDiscoveryAct || hasNavigateAct || tokens.length <= 3)) {
        score += 0.85;
        matchType = 'semantic_intent';
      }
    }

    // NAVIGATE_PROFILE
    if (def.id === 'NAVIGATE_PROFILE') {
      if (hasConceptProfile && !isThirdPersonOrDeictic) {
        score += 0.85;
        matchType = 'semantic_intent';
      }
    }

    // NAVIGATE_JOBS
    if (def.id === 'NAVIGATE_JOBS') {
      if (currentRole === 'technician') {
        const hasWorkOrderQuery = /\b(work orders?|assigned work|assigned jobs)\b/i.test(normalized);
        if ((hasConceptJobs || hasWorkOrderQuery) && (hasQueryJobsAct || hasNavigateAct || hasWorkOrderQuery || tokens.length <= 2)) {
          if (!hasAcceptVerb && !hasStartWorkVerb && !hasRejectVerb) {
            score += 0.85;
            matchType = 'semantic_intent';
          }
        }
      }
    }

    // NAVIGATE_EARNINGS
    if (def.id === 'NAVIGATE_EARNINGS') {
      if (currentRole === 'technician') {
        const hasEarningsInspect = /\b(inspect|summary|total earnings|my earnings|my income)\b/i.test(normalized);
        if (hasConceptEarnings && (hasQueryAmountAct || hasNavigateAct || hasEarningsInspect || tokens.length <= 2)) {
          score += 0.85;
          matchType = 'semantic_intent';
        }
      }
    }

    // ROLE SWITCHES
    if (def.id === 'SWITCH_ROLE_CUSTOMER' && hasConceptSwitchCustomer) {
      score += 0.95;
      matchType = 'semantic_intent';
    }
    if (def.id === 'SWITCH_ROLE_TECHNICIAN' && hasConceptSwitchTechnician) {
      score += 0.95;
      matchType = 'semantic_intent';
    }

    // NAVIGATE_BACK
    if (def.id === 'NAVIGATE_BACK' && hasConceptBack) {
      if (!hasConceptHome && !hasConceptBookings && !hasConceptProfile && !hasConceptJobs && !hasConceptEarnings && !hasConceptProviders) {
        score += 0.90;
        matchType = 'semantic_intent';
      }
    }

    // E. Registry Phrases Evaluation
    const allPhrases = [
      ...def.semantic.phrases.en,
      ...def.semantic.phrases.ta,
      ...def.semantic.phrases.tanglish,
    ].map((p) => p.toLowerCase());

    const exactMatch = allPhrases.some((p) => {
      const pClean = p.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’]/g, ' ').replace(/\s+/g, ' ').trim();
      return pClean === normalized;
    });

    if (exactMatch) {
      score += 0.85;
      matchType = 'exact_phrase';
    } else {
      const substringMatch = allPhrases.some((p) => {
        const pClean = p.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’]/g, ' ').replace(/\s+/g, ' ').trim();
        const pTokens = pClean.split(' ').filter(Boolean);
        if (pTokens.length > 1) {
          return normalized.includes(pClean) || pClean.includes(normalized);
        }
        return false;
      });

      if (substringMatch) {
        score += 0.70;
        matchType = 'substring_phrase';
      }
    }

    // F. Fallback Verb + Noun Token Matching
    const allVerbs = [
      ...def.semantic.intentVerbs.en,
      ...def.semantic.intentVerbs.ta,
      ...def.semantic.intentVerbs.tanglish,
    ].map((v) => v.toLowerCase());

    const allNouns = [
      ...def.semantic.targetNouns.en,
      ...def.semantic.targetNouns.ta,
      ...def.semantic.targetNouns.tanglish,
    ].map((n) => n.toLowerCase());

    const hasVerb = allVerbs.some((verb) =>
      tokens.includes(verb) || stemmedTokens.includes(verb) || normalized.includes(verb)
    );

    const hasNoun = allNouns.some((noun) =>
      tokens.includes(noun) || stemmedTokens.includes(noun) || normalized.includes(noun)
    );

    if (hasVerb && hasNoun) {
      score += 0.50;
    } else if (hasNoun) {
      score += 0.30;
    } else if (hasVerb) {
      score += 0.15;
    }

    const rawScore = score;
    const finalScore = Math.min(0.99, Math.max(0, score));
    if (finalScore >= 0.45) {
      candidates.push({ def, score: finalScore, rawScore, matchType });
    }
  }

  // Sort candidates by rawScore descending
  candidates.sort((a, b) => b.rawScore - a.rawScore);
  const bestCandidate = candidates[0];

  // 5. High Confidence Match Found (score >= 0.65)
  if (bestCandidate && bestCandidate.score >= 0.65) {
    const actionDef = bestCandidate.def;

    // A. Check if already on page for navigation actions
    let isAlreadyOnPage = false;
    if (actionDef.category === 'navigation' && actionDef.route) {
      if (actionDef.id === 'NAVIGATE_HOME') {
        const homeRoute = currentRole === 'technician' ? '/technician' : '/customer';
        isAlreadyOnPage = currentPath === homeRoute || currentPath === `${homeRoute}/`;
      } else {
        isAlreadyOnPage = currentPath === actionDef.route || currentPath.startsWith(actionDef.route);
      }
    }

    // B. Build natural response text
    let naturalResponseText = '';
    if (actionDef.id === 'NAVIGATE_BOOKINGS') {
      if (currentRole === 'technician') {
        naturalResponseText = userLang === 'ta' ? 'சரி, உங்கள் ஜாப்ஸை காட்டுறேன்.' : 'Sure, opening your jobs.';
      } else {
        naturalResponseText = userLang === 'ta' ? 'சரி, உங்கள் புக்கிங்ஸை காட்டுறேன்.' : 'Sure, taking you to your bookings.';
      }
    } else if (actionDef.id === 'NAVIGATE_HOME') {
      naturalResponseText = isAlreadyOnPage && actionDef.naturalResponse.alreadyOnPage
        ? actionDef.naturalResponse.alreadyOnPage[userLang]
        : (userLang === 'ta' ? 'சரிங்க, ஹோம் பேஜுக்கு போறேன்.' : 'Sure, taking you home.');
    } else if (isAlreadyOnPage && actionDef.naturalResponse.alreadyOnPage) {
      naturalResponseText = actionDef.naturalResponse.alreadyOnPage[userLang];
    } else if (actionDef.requiresConfirmation && actionDef.confirmationMessage) {
      naturalResponseText = actionDef.confirmationMessage[userLang];
    } else {
      naturalResponseText = actionDef.naturalResponse[userLang];
    }

    // C. Build payload
    const payload: Record<string, any> = {};
    const effectiveIndex = detectedIndex ?? 0;

    if (actionDef.id === 'SELECT_TECHNICIAN') {
      payload.index = effectiveIndex;
      const allProviders = (context.visibleProviders && context.visibleProviders.length > 0)
        ? context.visibleProviders
        : MOCK_MATCHED_PROVIDERS;
      const p = allProviders[Math.min(effectiveIndex, allProviders.length - 1)];
      payload.providerId = p.id;
      payload.provider = p;
    } else if (actionDef.id === 'ACCEPT_REQUEST' || actionDef.id === 'REJECT_REQUEST') {
      payload.index = effectiveIndex;
      if (context.visibleOpportunities && context.visibleOpportunities.length > 0) {
        const opp = context.visibleOpportunities[Math.min(effectiveIndex, context.visibleOpportunities.length - 1)];
        payload.opportunityId = opp.id;
        payload.opportunity = opp;
      }
    } else if (actionDef.id === 'APPROVE_ESTIMATE') {
      payload.amount = 1100;
      payload.bookingId = context.activeBooking?.id;
    } else if (actionDef.id === 'CANCEL_BOOKING') {
      payload.bookingId = context.activeBooking?.id;
    } else if (actionDef.id === 'START_WORK' || actionDef.id === 'MARK_ARRIVED' || actionDef.id === 'MARK_ON_THE_WAY') {
      payload.jobId = context.activeBooking?.id;
    } else if (actionDef.id === 'SWITCH_ROLE_CUSTOMER') {
      payload.role = 'customer';
    } else if (actionDef.id === 'SWITCH_ROLE_TECHNICIAN') {
      payload.role = 'technician';
    } else if (actionDef.id === 'SELECT_BOOKING_SLOT') {
      if (/\b(6\s*pm|6:00\s*pm|6\s*மணி|மாலை\s*6)\b/i.test(normalized) || normalized.includes('6 மணிக்கு')) {
        payload.slot = 'Tomorrow · 6:00 PM';
      } else if (/\b(10\s*am|10:00\s*am|10\s*மணி|காலை\s*10)\b/i.test(normalized) || normalized.includes('10 மணிக்கு')) {
        payload.slot = 'Tomorrow · 10:00 AM';
      } else if (/\b(2\s*pm|2:00\s*pm|2\s*மணி|மதியம்\s*2)\b/i.test(normalized) || normalized.includes('2 மணிக்கு')) {
        payload.slot = 'Tomorrow · 2:00 PM';
      } else if (/\b(day after tomorrow|11\s*am|11:00\s*am)\b/i.test(normalized) || normalized.includes('மறுநாள்') || normalized.includes('11 மணிக்கு')) {
        payload.slot = 'Day After Tomorrow · 11:00 AM';
      } else {
        payload.slot = 'Tomorrow · 6:00 PM';
      }
    } else if (actionDef.id === 'SELECT_PAYMENT_METHOD') {
      if (/\b(qr|nexdo qr)\b/i.test(normalized) || normalized.includes('கியூஆர்')) {
        payload.method = 'QR';
      } else if (/\b(upi|test upi|gpay|phonepe|paytm)\b/i.test(normalized) || normalized.includes('யுபிஐ') || normalized.includes('யூபிஐ')) {
        payload.method = 'UPI';
      } else if (/\b(card|test card|credit|debit)\b/i.test(normalized) || normalized.includes('கார்டு')) {
        payload.method = 'CARD';
      }
    }

    const canonicalAction: CanonicalAction = {
      type: actionDef.id,
      payload,
      source: 'VOICE',
      timestamp: Date.now(),
    };

    return {
      actionType: actionDef.id,
      action: canonicalAction,
      confidence: bestCandidate.score,
      response: naturalResponseText,
      language: userLang,
      requiresConfirmation: actionDef.requiresConfirmation,
      confirmationMessage: actionDef.confirmationMessage ? actionDef.confirmationMessage[userLang] : undefined,
      payload,
      rawText: rawInput,
    };
  }

  // 6. Modular Intent Engine Matchers (fallback when registry candidate scoring does not reach 0.65)
  // A. Technician Specific Operational Intents (passes, etc.)
  const techMatch = matchTechnicianIntent(normalized, tokens, stemmedTokens);
  if (techMatch.matched && techMatch.actionType && techMatch.confidence >= 0.85) {
    return {
      actionType: techMatch.actionType,
      action: {
        type: techMatch.actionType,
        payload: techMatch.payload || {},
        source: 'VOICE',
        timestamp: Date.now(),
      },
      confidence: techMatch.confidence,
      response: techMatch.response ? techMatch.response[userLang] : 'Executed.',
      language: userLang,
      payload: techMatch.payload,
      rawText: rawInput,
    };
  }

  // B. Booking & Technician Selection Intents (Nearest tech, book him, ordinal choice, etc.)
  const bookMatch = matchBookingIntent(normalized, tokens, stemmedTokens, detectedIndex, {
    selectedTechnician: context.selectedTechnician,
    visibleProviders: context.visibleProviders,
    currentPath,
  });
  if (bookMatch.matched && bookMatch.actionType && bookMatch.confidence >= 0.85) {
    let prov = context.selectedTechnician;
    if (bookMatch.providerIndex !== undefined && context.visibleProviders && context.visibleProviders.length > 0) {
      const safeIdx = Math.min(bookMatch.providerIndex, context.visibleProviders.length - 1);
      prov = context.visibleProviders[safeIdx];
    }
    const effPayload = {
      ...bookMatch.payload,
      index: bookMatch.providerIndex,
      providerId: prov?.id,
      provider: prov,
      isNearest: bookMatch.isNearest,
    };
    return {
      actionType: bookMatch.actionType,
      action: {
        type: bookMatch.actionType,
        payload: effPayload,
        source: 'VOICE',
        timestamp: Date.now(),
      },
      confidence: bookMatch.confidence,
      response: bookMatch.response ? bookMatch.response[userLang] : 'Selected.',
      language: userLang,
      requiresConfirmation: bookMatch.requiresConfirmation,
      payload: effPayload,
      rawText: rawInput,
    };
  }

  // C. Navigation Intent (Technician home, booking status, next, previous)
  const navMatch = matchNavigationIntent(normalized, tokens, stemmedTokens, currentRole, currentPath);
  if (navMatch.matched && navMatch.actionType && navMatch.confidence >= 0.85) {
    return {
      actionType: navMatch.actionType,
      action: {
        type: navMatch.actionType,
        payload: { destination: navMatch.destination },
        source: 'VOICE',
        timestamp: Date.now(),
      },
      confidence: navMatch.confidence,
      response: navMatch.response ? navMatch.response[userLang] : 'Navigating.',
      language: userLang,
      payload: { destination: navMatch.destination },
      rawText: rawInput,
    };
  }

  // D. Bare Affirmative / Negative (Section 7: "yes" / "no" without pending confirmation)
  if (tokens.length <= 3) {
    const isBareAffirmative =
      /^(?:yes|ok|okay|aama|aamam|seri|sari|ஆம்|சரி|சரிங்க|ஆமா|ஆமாம்|confirm)$/i.test(normalized) ||
      tokens.every((t) => ['yes', 'ok', 'okay', 'aama', 'seri', 'sari', 'சரி', 'ஆமா'].includes(t));
    const isBareNegative =
      /^(?:no|cancel|vendaam|vendam|illai|illa|வேண்டாம்|இல்லை|ரத்து)$/i.test(normalized) ||
      tokens.every((t) => ['no', 'cancel', 'vendaam', 'வேண்டாம்', 'இல்லை'].includes(t));

    if (isBareAffirmative) {
      return {
        actionType: 'YES',
        action: {
          type: 'YES',
          payload: {},
          source: 'VOICE',
          timestamp: Date.now(),
        },
        confidence: 0.95,
        response:
          userLang === 'ta'
            ? 'சொல்லுங்க! உங்களுக்கு எந்த சேவையில் உதவி வேண்டும்?'
            : 'Yes! How can I help you with your home services today?',
        language: userLang,
        rawText: rawInput,
      };
    }

    if (isBareNegative) {
      return {
        actionType: 'NO',
        action: {
          type: 'NO',
          payload: {},
          source: 'VOICE',
          timestamp: Date.now(),
        },
        confidence: 0.95,
        response:
          userLang === 'ta'
            ? 'சரி. உங்களுக்கு ஏதேனும் உதவி தேவைப்பட்டால் சொல்லுங்கள்.'
            : 'Okay. Let me know if you need any help.',
        language: userLang,
        rawText: rawInput,
      };
    }
  }

  // 7. Medium Confidence (0.45 <= score < 0.65) -> Short Clarification
  if (bestCandidate && bestCandidate.score >= 0.45) {
    const clarifyMsg =
      userLang === 'ta'
        ? 'நீங்கள் புக்கிங்ஸைப் பார்க்கணுமா அல்லது டெக்னிஷியனை தேடணுமா?'
        : 'Would you like to view your bookings or find a technician?';

    return {
      actionType: 'HELP',
      action: {
        type: 'HELP',
        payload: { attemptedAction: bestCandidate.def.id },
        source: 'VOICE',
        timestamp: Date.now(),
      },
      confidence: bestCandidate.score,
      response: clarifyMsg,
      language: userLang,
      rawText: rawInput,
    };
  }

  // 8. Low Confidence Safe Fallback (< 0.45) -> Do NOT navigate randomly
  const fallbackMsg =
    userLang === 'ta'
      ? 'மன்னிக்கவும், நீங்கள் என்ன செய்யணும்னு இன்னொரு முறை சொல்லுங்க.'
      : "Sorry, I didn't quite understand. Could you say that again?";

  return {
    actionType: 'RETRY',
    action: {
      type: 'RETRY',
      payload: {},
      source: 'VOICE',
      timestamp: Date.now(),
    },
    confidence: 0.30,
    response: fallbackMsg,
    language: userLang,
    rawText: rawInput,
  };
}
