import { CanonicalServiceType, CANONICAL_SERVICES } from './taxonomy';

export interface ExtractedEntities {
  service: string;
  canonicalService: CanonicalServiceType;
  serviceCategory: string;
  date?: string;
  time?: string;
  timeDisplay?: string;
  timeRange?: string;
  location?: string;
  urgency: 'NORMAL' | 'URGENT' | 'SCHEDULED';
  role?: string;
  language: 'en' | 'ta';
  rawDialect?: 'ta' | 'ta-romanized' | 'en';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceScore: number;
  clarificationNeeded?: boolean;
  preferredTime?: string;
  clarificationPrompt?: {
    en: string;
    ta: string;
  };
}

/**
 * Detect language of utterance with high precision for Tamil script, Romanized Tamil, and English.
 * Automatically resolves both pure script Tamil and Romanized spoken Tamil to canonical 'ta'.
 */
export function detectLanguage(text: string, contextLanguage?: string): {
  code: 'ta' | 'en';
  rawDialect: 'ta' | 'ta-romanized' | 'en';
  confidence: number;
} {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    return { code: (contextLanguage as any) || 'ta', rawDialect: (contextLanguage as any) || 'ta', confidence: 0.5 };
  }

  // 1. Tamil Script detection (Unicode range 0B80 - 0BFF)
  if (/[\u0B80-\u0BFF]/.test(trimmed)) {
    return { code: 'ta', rawDialect: 'ta', confidence: 0.99 };
  }

  // 2. Romanized Tamil keywords & Tamil morphological markers (Checked BEFORE English to prevent Tanglish being classified as English)
  const romanizedTamilPatterns = [
    /\b(venum|veanum|thevai|thedu|thedunga|theadanum|thedanum|kudukka|pannu|pannunga|panren|pannuren|pannanum|pananum|pannalama|pannalam|panlam|pannalaam|pannidu|panniruken|irukku|iruku|irukkanga|irukkindrathu|seri|sari|enakku|ungakku|ungalukku|nalaikku|naalaikku|inikki|inniku|ippove|udane|romba|sariya|illai|illa|vendaam|vendam|poga|poganum|pogavendum|pogalam|poren|porom|vara|kaatu|kaatunga|kaamikattuma|kaamikiren|kaami|solunga|muthal|irandavathu|rendavathu|rendavadu|erandavathu|moondravathu|velai|velaya|velaiya|vela|sevai|aagala|aagalla|seiyala|seiyalaye|seiyyala|seiyanum|seiyyanum|panna|odala|odalaye|odale|kekala|eriyala|varala|varale|vekkala|ninnuduchu|ninnuduchi|udanchu|udaingiduchu|poiruchu|poiruchi|poiduchu|pathala|podunga|maathu|maathunga|pesu|pesunga|vandhuten|vandhutten|vanthuten|aarambikkalam|aarambikalam|aarambi|kelambu|mudichuten|mudinjidhu|mudinjiduchu|mudiyala)\b/i,
    /\b(naan|en|ennoda|enakku|ennai|enga|unga|ungala|peyar|peru|edhu|epdi|yeppadi|yaru|yenna|enna|evlo|evvalo|ethana|aama|aam|manikku|mani|aar|pathu|ezhu|aindhu|aalu|vera|adutha|raddhu|urudhi|varumanam|varumaanam|sambadhichen|sambathiyam|mukappu|pinnadi|thira|thiranga|moodu|moodunga|kattanam|paluthu|paludhu|thirakka|mooda|paaru|paarunga|po|ponga|veetuku|veettuku|veetukku|veettukku|veedu|kootitu|kootitupo|kootitu-po|ivara|ivaroada|ivarai|ivaru|ivaruku|indha|andha|idhu|adhu)\b/i,
    /(?:-?ku|-?kku|-?uku|-?sku|-?skku)\s*(?:po|ponga|vaa|kaatu|thira|paaru|pannu|book)\b/i,
    /\b\w+(?:-ku|-kku|-uku|-sku|-skku|-a|-ai|-la|-le|-oda)\b/i,
  ];

  for (const pattern of romanizedTamilPatterns) {
    if (pattern.test(trimmed)) {
      // Confirmed Tamil intent in Romanized or transliterated script
      return { code: 'ta', rawDialect: 'ta-romanized', confidence: 0.98 };
    }
  }

  // 3. Explicit English sentences that intentionally switch or initiate in English
  const explicitEnglishSentences = [
    /\b(i need|i want|please show|show me|show my|open my|go to the|go to|take me to|take me home|take me back|take me|find a|looking for|could you|would you|can you|bring me|switch to english|speak in english)\b/i,
    /^(?:go home|take me home|show bookings|show my bookings|open bookings|show jobs|show my jobs|open jobs|show earnings|show my earnings|open earnings|open profile|show profile|my profile|open subscription|show subscription|my skills|capabilities|go back|back)$/i,
    /\b(select this|choose this|show his|show her|on the way|cancel this|cancel booking|cancel this booking|start work|mark arrived|make payment)\b/i,
  ];
  const isExplicitEnglish = explicitEnglishSentences.some((p) => p.test(trimmed));
  if (isExplicitEnglish) {
    return { code: 'en', rawDialect: 'en', confidence: 0.99 };
  }

  // 4. Contextual memory: If conversation is ongoing in Tamil, maintain Tamil unless explicitly English
  if (contextLanguage === 'ta') {
    return { code: 'ta', rawDialect: 'ta-romanized', confidence: 0.92 };
  }

  // 5. Common English vocabulary check: If text contains pure English words with zero Tamil markers, it's English
  const englishVocabulary = /\b(i|we|you|need|want|find|show|book|booking|bookings|jobs|earnings|profile|technician|technicians|plumber|electrician|ac|repair|service|cleaning|maintenance|tv|refrigerator|fridge|washing\s*machine|fan|microwave|geyser|car|bike|at|on|for|in|tomorrow|today|morning|evening|night|urgent|urgently|cancel|confirm|approve|estimate|back|home|help|mode|customer|technician)\b/i;
  if (englishVocabulary.test(trimmed)) {
    return { code: 'en', rawDialect: 'en', confidence: 0.96 };
  }

  // 6. Default to English
  return { code: 'en', rawDialect: 'en', confidence: 0.90 };
}

/**
 * Normalizes date reference from multilingual utterance
 */
export function extractDate(text: string): { date?: string; label?: string } {
  const t = text.toLowerCase();
  if (/\b(today|inikki|inniku|இன்று|இன்றைக்கு)\b/i.test(t)) {
    return { date: 'today', label: 'Today' };
  }
  if (/\b(tomorrow|nalaikku|naalaikku|நாளைக்கு|நாளை)\b/i.test(t)) {
    return { date: 'tomorrow', label: 'Tomorrow' };
  }
  if (/\b(tonight|இன்றிரவு)\b/i.test(t)) {
    return { date: 'tonight', label: 'Tonight' };
  }
  return {};
}

/**
 * Normalizes time and time-range references from multilingual utterance
 */
export function extractTime(text: string): {
  time?: string;
  timeDisplay?: string;
  timeRange?: string;
  urgency?: 'NORMAL' | 'URGENT' | 'SCHEDULED';
} {
  const t = text.toLowerCase();

  // 1. Check for immediate urgency
  if (/urgent|immediately|udane|ippove|உடனே|இப்போதே/i.test(t)) {
    return {
      urgency: 'URGENT',
      timeDisplay: 'Within 45 Minutes (Urgent)',
      timeRange: 'urgent',
    };
  }

  let time: string | undefined;
  let timeDisplay: string | undefined;
  let timeRange: string | undefined;

  // 2. Specific Hour extraction
  // 6 PM / 18:00
  if (
    /(?:6|six|aar|aaru)\s*(?:manikku|pm|o'clock|மணிக்கு|மணி)/i.test(t) ||
    /6\s*pm/i.test(t) ||
    /\b18:00\b/.test(t) ||
    /மாலை\s*6\s*மணி/i.test(t)
  ) {
    time = '18:00';
    timeDisplay = '6:00 PM';
    timeRange = 'evening';
  }
  // 7 PM / 19:00
  else if (
    /(?:7|seven|ezhu)\s*(?:manikku|pm|o'clock|மணிக்கு|மணி)/i.test(t) ||
    /7\s*pm/i.test(t) ||
    /\b19:00\b/.test(t) ||
    /மாலை\s*7\s*மணி/i.test(t)
  ) {
    time = '19:00';
    timeDisplay = '7:00 PM';
    timeRange = 'evening';
  }
  // 5 PM / 17:00
  else if (
    /(?:5|five|aindhu)\s*(?:manikku|pm|o'clock|மணிக்கு|மணி)/i.test(t) ||
    /5\s*pm/i.test(t) ||
    /\b17:00\b/.test(t) ||
    /மாலை\s*5\s*மணி/i.test(t)
  ) {
    time = '17:00';
    timeDisplay = '5:00 PM';
    timeRange = 'evening';
  }
  // 8 PM / 20:00
  else if (
    /(?:8|eight|ettu)\s*(?:manikku|pm|o'clock|மணிக்கு|மணி)/i.test(t) ||
    /8\s*pm/i.test(t) ||
    /\b20:00\b/.test(t) ||
    /இரவு\s*8\s*மணி/i.test(t)
  ) {
    time = '20:00';
    timeDisplay = '8:00 PM';
    timeRange = 'night';
  }
  // 10 AM / 10:00
  else if (
    /(?:10|ten|pathu)\s*(?:manikku|am|o'clock|மணிக்கு|மணி)/i.test(t) ||
    /10\s*am/i.test(t) ||
    /\b10:00\b/.test(t) ||
    /காலை\s*10\s*மணி/i.test(t)
  ) {
    time = '10:00';
    timeDisplay = '10:00 AM';
    timeRange = 'morning';
  }
  // 11 AM / 11:00
  else if (
    /(?:11|eleven|padhinondru)\s*(?:manikku|am|o'clock|மணிக்கு|மணி)/i.test(t) ||
    /11\s*am/i.test(t) ||
    /\b11:00\b/.test(t) ||
    /காலை\s*11\s*மணி/i.test(t)
  ) {
    time = '11:00';
    timeDisplay = '11:00 AM';
    timeRange = 'morning';
  }
  // 12 PM / 12:00
  else if (
    /(?:12|twelve|panirendu)\s*(?:manikku|pm|o'clock|மணிக்கு|மணி)/i.test(t) ||
    /12\s*pm/i.test(t) ||
    /\b12:00\b/.test(t)
  ) {
    time = '12:00';
    timeDisplay = '12:00 PM';
    timeRange = 'afternoon';
  }
  // 2 PM / 14:00
  else if (
    /(?:2|two|rendu)\s*(?:manikku|pm|o'clock|மணிக்கு|மணி)/i.test(t) ||
    /2\s*pm/i.test(t) ||
    /\b14:00\b/.test(t) ||
    /மதியம்\s*2\s*மணி/i.test(t)
  ) {
    time = '14:00';
    timeDisplay = '2:00 PM';
    timeRange = 'afternoon';
  }
  // 3 PM / 15:00
  else if (
    /(?:3|three|moonu)\s*(?:manikku|pm|o'clock|மணிக்கு|மணி)/i.test(t) ||
    /3\s*pm/i.test(t) ||
    /\b15:00\b/.test(t) ||
    /மதியம்\s*3\s*மணி/i.test(t)
  ) {
    time = '15:00';
    timeDisplay = '3:00 PM';
    timeRange = 'afternoon';
  }
  // 4 PM / 16:00
  else if (
    /(?:4|four|naalu)\s*(?:manikku|pm|o'clock|மணிக்கு|மணி)/i.test(t) ||
    /4\s*pm/i.test(t) ||
    /\b16:00\b/.test(t) ||
    /மாலை\s*4\s*மணி/i.test(t)
  ) {
    time = '16:00';
    timeDisplay = '4:00 PM';
    timeRange = 'evening';
  }

  // 3. Fallback to broad ranges if no exact hour matched
  if (!time) {
    if (/morning|kaalai|kaalaila|காலை/i.test(t)) {
      time = '10:00';
      timeDisplay = '10:00 AM';
      timeRange = 'morning';
    } else if (/evening|maalaikku|sayanthiram|மாலை/i.test(t)) {
      time = '18:00';
      timeDisplay = '6:00 PM';
      timeRange = 'evening';
    } else if (/afternoon|madhiyam|மதியம்/i.test(t)) {
      time = '14:00';
      timeDisplay = '2:00 PM';
      timeRange = 'afternoon';
    } else if (/night|iravu|இரவு/i.test(t)) {
      time = '20:00';
      timeDisplay = '8:00 PM';
      timeRange = 'night';
    }
  }

  return {
    time,
    timeDisplay,
    timeRange,
    urgency: time ? 'SCHEDULED' : 'NORMAL',
  };
}

/**
 * Extracts canonical service intent and all structured entities from raw input
 */
export function extractEntitiesAndIntent(input: string): ExtractedEntities {
  const text = input.trim();
  const lower = text.toLowerCase();
  const langInfo = detectLanguage(text);
  const lang = langInfo.code;

  const dateInfo = extractDate(text);
  const timeInfo = extractTime(text);

  let canonicalService: CanonicalServiceType = 'GENERAL_HOME_MAINTENANCE';
  let role: string | undefined;
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
  let confidenceScore = 0.85;
  let clarificationNeeded = false;

  // -------------------------------------------------------------
  // 1. AC Service Signals (English, Tamil, Tanglish, Mixed)
  // -------------------------------------------------------------
  const hasAcSignal =
    /\b(ac|a\/c|air\s*con(ditioner|ditioning)?|aircon)\b/i.test(lower) ||
    /ஏசி|குளிரூட்டி/i.test(text);

  if (hasAcSignal) {
    // A. AC Installation
    if (/install|uninstallation|fitting/i.test(lower) || /பொருத்த|மாற்ற/i.test(text)) {
      canonicalService = 'AC_INSTALLATION';
      role = 'AC installation specialist';
      confidence = 'HIGH';
      confidenceScore = 0.98;
    }
    // B. AC Deep Cleaning / Routine Service
    else if (
      (/service|servicing|cleaning|wash|foam/i.test(lower) || /சர்வீஸ்|சுத்தம்/i.test(text)) &&
      !(/repair|technician|problem|issue|not cooling|cool aagala|cool aagalla|cooling illa|work aagala|velai seiyala/i.test(lower) || /ரிப்பேர்|பழுது/i.test(text))
    ) {
      canonicalService = 'AC_SERVICE';
      role = 'AC technician';
      confidence = 'HIGH';
      confidenceScore = 0.96;
    }
    // C. AC Repair / Diagnostics (Explicit repair, technician, cooling failure, or problem)
    else {
      canonicalService = 'AC_REPAIR';
      role = 'AC technician';
      confidence = 'HIGH';
      confidenceScore = 0.97;
    }
  }

  // -------------------------------------------------------------
  // 2. Electrician & Electrical
  // -------------------------------------------------------------
  else if (/\belectrician\b/i.test(lower) || /எலக்ட்ரீஷியன்/i.test(text)) {
    canonicalService = 'ELECTRICIAN';
    role = 'electrician';
    confidence = 'HIGH';
    confidenceScore = 0.96;
  } else if (/\b(electrical|wiring|switchboard|mcb|fuse|current\s*illa)\b/i.test(lower) || /மின்சார/i.test(text)) {
    canonicalService = 'ELECTRICAL';
    role = 'electrician';
    confidence = 'HIGH';
    confidenceScore = 0.95;
  } else if (/\b(fan|ceiling\s*fan|exhaust\s*fan|regulator)\b/i.test(lower) || /ஃபேன்|மின்விசிறி/i.test(text)) {
    canonicalService = 'FAN_REPAIR';
    role = 'electrician';
    confidence = 'HIGH';
    confidenceScore = 0.96;
  }

  // -------------------------------------------------------------
  // 3. Plumber & Plumbing
  // -------------------------------------------------------------
  else if (/\bplumber\b/i.test(lower) || /பிளம்பர்/i.test(text)) {
    canonicalService = 'PLUMBER';
    role = 'plumber';
    confidence = 'HIGH';
    confidenceScore = 0.96;
  } else if (/\b(plumbing|pipe|leakage|water\s*tap|tap|drainage)\b/i.test(lower) || /குழாய்|கசிவு/i.test(text)) {
    canonicalService = 'PLUMBING';
    role = 'plumber';
    confidence = 'HIGH';
    confidenceScore = 0.95;
  }

  // -------------------------------------------------------------
  // 4. Appliances: Refrigerator, Washing Machine, TV, Microwave, Geyser
  // -------------------------------------------------------------
  else if (/\b(fridge|refrigerator)\b/i.test(lower) || /ஃபிரிட்ஜ்|பிரிட்ஜ்/i.test(text)) {
    canonicalService = 'REFRIGERATOR_REPAIR';
    role = 'appliance technician';
    confidence = 'HIGH';
    confidenceScore = 0.96;
  } else if (/\b(washing\s*machine)\b/i.test(lower) || /வாஷிங்\s*மெஷின்|சலவை\s*இயந்திரம்/i.test(text)) {
    canonicalService = 'WASHING_MACHINE_REPAIR';
    role = 'appliance technician';
    confidence = 'HIGH';
    confidenceScore = 0.96;
  } else if (/\b(tv|television)\b/i.test(lower) || /டிவி|தொலைக்காட்சி/i.test(text)) {
    canonicalService = 'TV_REPAIR';
    role = 'electronics technician';
    confidence = 'HIGH';
    confidenceScore = 0.94;
  } else if (/\bmicrowave\b/i.test(lower) || /மைக்ரோவேவ்/i.test(text)) {
    canonicalService = 'MICROWAVE_REPAIR';
    role = 'appliance technician';
    confidence = 'HIGH';
    confidenceScore = 0.94;
  } else if (/\b(geyser|water\s*heater)\b/i.test(lower) || /கீசர்/i.test(text)) {
    canonicalService = 'GEYSER_REPAIR';
    role = 'plumber / electrician';
    confidence = 'HIGH';
    confidenceScore = 0.94;
  } else if (/\bappliance\b/i.test(lower) || /ஹோம்\s*அப்ளையன்ஸ்/i.test(text)) {
    canonicalService = 'APPLIANCE_REPAIR';
    role = 'appliance technician';
    confidence = 'MEDIUM';
    confidenceScore = 0.85;
  }

  // -------------------------------------------------------------
  // 5. Automotive: Bike & Car
  // -------------------------------------------------------------
  else if (/\b(bike|two\s*wheeler|scooter|activa)\b/i.test(lower) || /இருசக்கர|பைக்/i.test(text)) {
    canonicalService = 'BIKE_REPAIR';
    role = 'two-wheeler mechanic';
    confidence = 'HIGH';
    confidenceScore = 0.95;
  } else if (/\b(car|four\s*wheeler)\b/i.test(lower) || /கார்|வாகனம்/i.test(text)) {
    canonicalService = 'CAR_REPAIR';
    role = 'car mechanic';
    confidence = 'HIGH';
    confidenceScore = 0.95;
  }

  // -------------------------------------------------------------
  // 6. Cleaning
  // -------------------------------------------------------------
  else if (/\b(cleaning|deep\s*clean)\b/i.test(lower) || /வீடு\s*சுத்தம்|சுத்தம்/i.test(text)) {
    canonicalService = 'CLEANING';
    role = 'cleaning specialist';
    confidence = 'HIGH';
    confidenceScore = 0.93;
  }

  // -------------------------------------------------------------
  // 7. General / Low-Confidence Problem at home (Needs clarification)
  // -------------------------------------------------------------
  else {
    canonicalService = 'GENERAL_HOME_MAINTENANCE';
    role = 'maintenance technician';
    confidence = 'LOW';
    confidenceScore = 0.4;
    clarificationNeeded = true;
  }

  const serviceInfo = CANONICAL_SERVICES[canonicalService];

  // Compose user-facing preferred time string only if date or time exists
  let preferredTime: string | undefined = undefined;
  if (timeInfo.urgency === 'URGENT') {
    preferredTime = 'Within 45 Minutes (Urgent)';
  } else if (timeInfo.timeDisplay && dateInfo.label) {
    preferredTime = `${dateInfo.label} · ${timeInfo.timeDisplay}`;
  } else if (timeInfo.timeDisplay) {
    preferredTime = timeInfo.timeDisplay;
  } else if (dateInfo.label) {
    preferredTime = dateInfo.label;
  }

  return {
    service: serviceInfo.title,
    canonicalService,
    serviceCategory: serviceInfo.category,
    date: dateInfo.date,
    time: timeInfo.time,
    timeDisplay: timeInfo.timeDisplay,
    timeRange: timeInfo.timeRange,
    urgency: timeInfo.urgency || (timeInfo.time ? 'SCHEDULED' : 'NORMAL'),
    role: role || serviceInfo.defaultRole,
    language: lang,
    rawDialect: langInfo.rawDialect,
    confidence,
    confidenceScore,
    clarificationNeeded,
    preferredTime,
    clarificationPrompt: clarificationNeeded
      ? {
          en: 'Sure. What service do you need? AC, electrical, plumbing, or something else?',
          ta: 'சரி. என்ன சேவை தேவைப்படுகிறது? ஏசி, எலக்ட்ரிக்கல், பிளம்பிங் அல்லது வேறேதும் வேலையா?',
        }
      : undefined,
  };
}
