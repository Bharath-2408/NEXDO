import { CanonicalServiceType, CANONICAL_SERVICES } from '../taxonomy';

export interface ServiceMatchResult {
  matched: boolean;
  canonicalService?: CanonicalServiceType;
  serviceCategory?: string;
  problem?: string;
  problemDescription?: string;
  confidence: number;
  clarificationNeeded?: boolean;
  clarificationPrompt?: {
    en: string;
    ta: string;
  };
  response?: {
    en: string;
    ta: string;
  };
}

export function matchServiceIntent(
  rawText: string,
  normalized: string,
  tokens: string[]
): ServiceMatchResult {
  const lower = normalized;

  // 1. Ambiguous generic "repair" / "service" request with no appliance or trade
  const isGenericOnly =
    /^(?:repair|repair venum|service|service venum|i need repair|i need service|ரிப்பேர் வேணும்|சர்வீஸ் வேணும்|repair பண்ணனும்)$/i.test(
      normalized
    ) ||
    ((tokens.includes('repair') || tokens.includes('service') || tokens.includes('ரிப்பேர்')) &&
      tokens.length <= 3 &&
      !/\b(ac|tv|fridge|refrigerator|fan|washing|machine|microwave|geyser|bike|car|pipe|leak|wiring|electric|plumb)\b/i.test(
        lower
      ) &&
      !/[\u0B80-\u0BFF]/.test(rawText));

  if (isGenericOnly) {
    return {
      matched: true,
      canonicalService: 'GENERAL_HOME_MAINTENANCE',
      serviceCategory: 'General Maintenance',
      confidence: 0.85,
      clarificationNeeded: true,
      clarificationPrompt: {
        en: 'Sure. Which service do you need repair for — AC, TV, refrigerator, or something else?',
        ta: 'சரி. எந்த service-க்கு repair வேண்டும் — AC, TV, refrigerator அல்லது வேறு ஏதாவது?',
      },
      response: {
        en: 'Sure. Which service do you need repair for — AC, TV, refrigerator, or something else?',
        ta: 'சரி. எந்த service-க்கு repair வேண்டும் — AC, TV, refrigerator அல்லது வேறு ஏதாவது?',
      },
    };
  }

  // 2. AC Service & Problem Understanding
  const hasAc =
    /\b(ac|a\/c|air\s*con(ditioner|ditioning)?|aircon)\b/i.test(lower) ||
    /ஏசி|குளிரூட்டி/i.test(rawText);

  if (hasAc) {
    let problem = 'AC_GENERAL_REPAIR';
    let problemDescEn = 'AC repair';
    let problemDescTa = 'AC repair';

    if (/\b(cooling\s*varala|not\s*cooling|cooling\s*illa|cool\s*aagala|cool\s*varala|குளிரூட்டவில்லை|cooling\s*problem)\b/i.test(lower) || rawText.includes('cooling வரல') || rawText.includes('cool வரல')) {
      problem = 'AC_NOT_COOLING';
      problemDescEn = 'AC cooling problem';
      problemDescTa = 'AC cooling problem';
    } else if (/\b(power\s*on\s*aagala|not\s*turning\s*on|not\s*starting|dead|ஆன்\s*ஆகல)\b/i.test(lower)) {
      problem = 'AC_POWER_ISSUE';
      problemDescEn = 'AC power issue';
      problemDescTa = 'AC power problem';
    } else if (/\b(water\s*leak|leakage|thanni\s*kottuthu|கசிவு)\b/i.test(lower)) {
      problem = 'AC_WATER_LEAK';
      problemDescEn = 'AC water leakage';
      problemDescTa = 'AC water leak';
    } else if (/\b(noise|sound|sound\s*varuthu|சத்தம்)\b/i.test(lower)) {
      problem = 'AC_NOISE_ISSUE';
      problemDescEn = 'AC noise issue';
      problemDescTa = 'AC சத்தம் பிரச்சனை';
    } else if (/\b(install|uninstallation|fitting|பொருத்த)\b/i.test(lower)) {
      return {
        matched: true,
        canonicalService: 'AC_INSTALLATION',
        serviceCategory: CANONICAL_SERVICES.AC_INSTALLATION.category,
        problem: 'AC_INSTALLATION',
        problemDescription: 'AC installation',
        confidence: 0.98,
        response: {
          en: 'Sure. Finding certified AC installation specialists for you.',
          ta: 'சரி. AC installation செய்ய நிபுணர்களை தேடுகிறேன்.',
        },
      };
    } else if (/\b(service|cleaning|foam|wash|சர்வீஸ்|சுத்தம்)\b/i.test(lower) && !/\b(repair|problem|issue|not working|work aagala|வேலை செய்யல)\b/i.test(lower)) {
      return {
        matched: true,
        canonicalService: 'AC_SERVICE',
        serviceCategory: CANONICAL_SERVICES.AC_SERVICE.category,
        problem: 'AC_DEEP_CLEANING',
        problemDescription: 'AC deep cleaning',
        confidence: 0.97,
        response: {
          en: 'Sure. Finding AC deep cleaning service technicians for you.',
          ta: 'சரி. AC service technicians-ஐ தேடுகிறேன்.',
        },
      };
    }

    return {
      matched: true,
      canonicalService: 'AC_REPAIR',
      serviceCategory: CANONICAL_SERVICES.AC_REPAIR.category,
      problem,
      problemDescription: problemDescEn,
      confidence: 0.97,
      response: {
        en: `Sure. Finding nearby technicians for your ${problemDescEn}.`,
        ta:
          problem === 'AC_GENERAL_REPAIR'
            ? 'சரி, AC repairக்கு அருகிலுள்ள technicians-ஐ தேடுறேன்.'
            : `சரி, ${problemDescTa}-க்கு அருகிலுள்ள technicians-ஐ தேடுகிறேன்.`,
      },
    };
  }

  // 3. TV Service & Problem Understanding
  const hasTv =
    /\b(tv|television)\b/i.test(lower) ||
    /டிவி|தொலைக்காட்சி/i.test(rawText);

  if (hasTv) {
    let problem = 'TV_GENERAL_REPAIR';
    let problemDescEn = 'TV repair';
    let problemDescTa = 'TV repair';

    if (/\b(display|screen|display\s*varala|screen\s*varala|panel|திரை|டிஸ்ப்ளே)\b/i.test(lower) || rawText.includes('display வரல')) {
      problem = 'TV_DISPLAY_ISSUE';
      problemDescEn = 'TV display issue';
      problemDescTa = 'TV display problem';
    } else if (/\b(sound|audio|sound\s*kekala|சத்தம்\s*வரல)\b/i.test(lower)) {
      problem = 'TV_AUDIO_ISSUE';
      problemDescEn = 'TV audio issue';
      problemDescTa = 'TV sound problem';
    } else if (/\b(not working|vela seiyala|velai seiyala|work aagala|வேலை செய்யல|வேலைசெய்யல)\b/i.test(lower) || rawText.includes('வேலை செய்யல')) {
      problem = 'TV_NOT_WORKING';
      problemDescEn = 'TV not working';
      problemDescTa = 'TV வேலை செய்யவில்லை பிரச்சனை';
    }

    return {
      matched: true,
      canonicalService: 'TV_REPAIR',
      serviceCategory: CANONICAL_SERVICES.TV_REPAIR.category,
      problem,
      problemDescription: problemDescEn,
      confidence: 0.96,
      response: {
        en: `Got it. I'll find a TV repair technician for you.`,
        ta: `சரி. ${problemDescTa}-க்கு அருகிலுள்ள technicians-ஐ தேடுகிறேன்.`,
      },
    };
  }

  // 4. Refrigerator / Fridge
  const hasFridge = /\b(fridge|refrigerator)\b/i.test(lower) || /பிரிட்ஜ்|ஃபிரிட்ஜ்/i.test(rawText);
  if (hasFridge) {
    return {
      matched: true,
      canonicalService: 'REFRIGERATOR_REPAIR',
      serviceCategory: CANONICAL_SERVICES.REFRIGERATOR_REPAIR.category,
      problem: 'REFRIGERATOR_COOLING_ISSUE',
      problemDescription: 'Refrigerator repair',
      confidence: 0.96,
      response: {
        en: "Sure. Finding refrigerator repair technicians for you.",
        ta: "சரி. பிரிட்ஜ் பழுது சரி செய்ய technicians-ஐ தேடுகிறேன்.",
      },
    };
  }

  // 5. Washing Machine
  const hasWashing = /\b(washing\s*machine)\b/i.test(lower) || /வாஷிங்\s*மெஷின்/i.test(rawText);
  if (hasWashing) {
    return {
      matched: true,
      canonicalService: 'WASHING_MACHINE_REPAIR',
      serviceCategory: CANONICAL_SERVICES.WASHING_MACHINE_REPAIR.category,
      problem: 'WASHING_MACHINE_ISSUE',
      problemDescription: 'Washing machine repair',
      confidence: 0.96,
      response: {
        en: "Sure. Finding washing machine repair technicians for you.",
        ta: "சரி. வாஷிங் மெஷின் பழுது சரி செய்ய technicians-ஐ தேடுகிறேன்.",
      },
    };
  }

  // 6. Fan / Electrical
  const hasFan = /\b(fan|ceiling\s*fan|exhaust\s*fan)\b/i.test(lower) || /ஃபேன்|மின்விசிறி/i.test(rawText);
  if (hasFan) {
    return {
      matched: true,
      canonicalService: 'FAN_REPAIR',
      serviceCategory: CANONICAL_SERVICES.FAN_REPAIR.category,
      problem: 'FAN_REPAIR',
      problemDescription: 'Fan repair',
      confidence: 0.96,
      response: {
        en: "Sure. Finding fan repair electricians for you.",
        ta: "சரி. ஃபேன் பழுது சரி செய்ய எலக்ட்ரீஷியனை தேடுகிறேன்.",
      },
    };
  }

  const hasElectrical = /\b(electrician|electrical|wiring|switchboard|fuse|short\s*circuit)\b/i.test(lower) || /எலக்ட்ரீஷியன்|மின்சார/i.test(rawText);
  if (hasElectrical) {
    return {
      matched: true,
      canonicalService: 'ELECTRICIAN',
      serviceCategory: CANONICAL_SERVICES.ELECTRICIAN.category,
      problem: 'ELECTRICAL_WIRING',
      problemDescription: 'Electrical repair',
      confidence: 0.96,
      response: {
        en: "Sure. Finding verified electricians in your area.",
        ta: "சரி. உங்கள் பகுதியில் உள்ள எலக்ட்ரீஷியன்களை தேடுகிறேன்.",
      },
    };
  }

  // 7. Plumbing
  const hasPlumbing = /\b(plumber|plumbing|pipe|water\s*leak|tap|sink)\b/i.test(lower) || /பிளம்பர்|குழாய்|கசிவு/i.test(rawText);
  if (hasPlumbing) {
    return {
      matched: true,
      canonicalService: 'PLUMBER',
      serviceCategory: CANONICAL_SERVICES.PLUMBER.category,
      problem: 'PLUMBING_LEAK',
      problemDescription: 'Plumbing repair',
      confidence: 0.96,
      response: {
        en: "Sure. Finding verified plumbers in your area.",
        ta: "சரி. உங்கள் பகுதியில் உள்ள பிளம்பர்களை தேடுகிறேன்.",
      },
    };
  }

  // 8. Microwave & Geyser
  const hasMicrowave = /\b(microwave|oven)\b/i.test(lower) || /மைக்ரோவேவ்/i.test(rawText);
  if (hasMicrowave) {
    return {
      matched: true,
      canonicalService: 'MICROWAVE_REPAIR',
      serviceCategory: CANONICAL_SERVICES.MICROWAVE_REPAIR.category,
      problem: 'MICROWAVE_REPAIR',
      problemDescription: 'Microwave repair',
      confidence: 0.95,
      response: {
        en: "Sure. Finding microwave repair technicians for you.",
        ta: "சரி. மைக்ரோவேவ் பழுது சரி செய்ய technicians-ஐ தேடுகிறேன்.",
      },
    };
  }

  const hasGeyser = /\b(geyser|water\s*heater)\b/i.test(lower) || /கீசர்/i.test(rawText);
  if (hasGeyser) {
    return {
      matched: true,
      canonicalService: 'GEYSER_REPAIR',
      serviceCategory: CANONICAL_SERVICES.GEYSER_REPAIR.category,
      problem: 'GEYSER_REPAIR',
      problemDescription: 'Water heater repair',
      confidence: 0.95,
      response: {
        en: "Sure. Finding water heater repair technicians for you.",
        ta: "சரி. கீசர் பழுது சரி செய்ய technicians-ஐ தேடுகிறேன்.",
      },
    };
  }

  // 9. Cleaning
  const hasCleaning = /\b(cleaning|deep\s*clean)\b/i.test(lower) || /சுத்தம்/i.test(rawText);
  if (hasCleaning) {
    return {
      matched: true,
      canonicalService: 'CLEANING',
      serviceCategory: CANONICAL_SERVICES.CLEANING.category,
      problem: 'HOUSE_CLEANING',
      problemDescription: 'Home cleaning',
      confidence: 0.94,
      response: {
        en: "Sure. Finding professional cleaning services for you.",
        ta: "சரி. வீடு சுத்தம் செய்ய ஆட்களை தேடுகிறேன்.",
      },
    };
  }

  return { matched: false, confidence: 0 };
}
