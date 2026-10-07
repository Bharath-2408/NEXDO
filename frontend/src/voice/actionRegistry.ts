import { CanonicalActionType } from '../types/actions';

export interface ActionDefinition {
  id: CanonicalActionType;
  category: 'navigation' | 'customer_action' | 'technician_action' | 'button_action' | 'system_action';
  role: 'customer' | 'technician' | 'any';
  route?: string;
  description: {
    en: string;
    ta: string;
  };
  semantic: {
    intentVerbs: {
      en: string[];
      ta: string[];
      tanglish: string[];
    };
    targetNouns: {
      en: string[];
      ta: string[];
      tanglish: string[];
    };
    phrases: {
      en: string[];
      ta: string[];
      tanglish: string[];
    };
  };
  contextual?: {
    relevantRoutes?: string[];
    deicticKeywords?: string[];
  };
  requiresConfirmation?: boolean;
  confirmationMessage?: {
    en: string;
    ta: string;
  };
  naturalResponse: {
    en: string;
    ta: string;
    alreadyOnPage?: {
      en: string;
      ta: string;
    };
  };
}

export const ACTION_REGISTRY: ActionDefinition[] = [
  // 1. Home Navigation
  {
    id: 'NAVIGATE_HOME',
    category: 'navigation',
    role: 'any',
    route: '/customer', // Dynamically resolves to /customer or /technician
    description: {
      en: 'Navigate to the primary home dashboard for customer or technician',
      ta: 'முகப்புப் பக்கத்திற்குச் செல்லவும்',
    },
    semantic: {
      intentVerbs: {
        en: ['go', 'open', 'show', 'take', 'head', 'navigate', 'visit', 'back', 'let', 'lets', 'return'],
        ta: ['போ', 'திற', 'காட்டு', 'வா', 'செல்லு', 'செய்', 'திரும்பு', 'கூட்டிட்டு போ', 'கூட்டிட்டுப்போ'],
        tanglish: ['po', 'ponga', 'thira', 'kaatu', 'open', 'show', 'va', 'poganum', 'kootitu po', 'kootitupo', 'poga'],
      },
      targetNouns: {
        en: ['home', 'home page', 'main page', 'dashboard', 'house'],
        ta: ['ஹோம்', 'ஹோம் பேஜ்', 'முகப்பு', 'முகப்பு பக்கம்', 'வீடு', 'முதல் பக்கம்'],
        tanglish: ['home', 'home page', 'mukappu', 'veedu', 'veetuku'],
      },
      phrases: {
        en: [
          'home',
          'go home',
          'go to home',
          'go to home page',
          'open home',
          'open home page',
          'take me home',
          'show home',
          'home page',
          "let's go home",
          'take me back home',
        ],
        ta: [
          'ஹோம்',
          'ஹோம் போ',
          'ஹோம் பேஜுக்கு போ',
          'ஹோம் பேஜ்க்கு போ',
          'ஹோம் பேஜ் திற',
          'ஹோம் ஓபன் பண்ணு',
          'வீட்டுக்கு போ',
          'முதல் பக்கத்துக்கு போ',
          'திரும்ப ஹோம் போ',
          'ஹோம் காட்டு',
          'முகப்பு பக்கத்துக்கு போ',
          'முகப்பு பக்கம் திற',
          'என்னை ஹோம் பேஜுக்கு கூட்டிட்டு போ',
        ],
        tanglish: [
          'home page ku po',
          'home ku po',
          'home-ku kootitu po',
          'home ku kootitu po',
          'naan home poganum',
          'home poganum',
          'home open pannu',
          'enna home ku kootitu po',
          'veetuku po',
          'mukappu ku po',
        ],
      },
    },
    naturalResponse: {
      en: "Sure, taking you home.",
      ta: 'சரிங்க, ஹோம் பேஜுக்கு போறேன்.',
      alreadyOnPage: {
        en: "You're already on your home page. How can I help you today?",
        ta: 'ஏற்கனவே முகப்புப் பக்கத்தில் தான் உள்ளீர்கள். உங்களுக்கு என்ன உதவி வேண்டும்?',
      },
    },
  },

  // 2. Bookings Navigation (Context-aware Customer & Technician)
  {
    id: 'NAVIGATE_BOOKINGS',
    category: 'navigation',
    role: 'any',
    route: '/customer/bookings', // Contextually resolves to /customer/bookings or /technician/jobs
    description: {
      en: 'View all scheduled, active, and past customer service bookings or technician jobs',
      ta: 'முன்பதிவுகள் அல்லது பணிகளைப் பார்க்கவும்',
    },
    semantic: {
      intentVerbs: {
        en: ['show', 'open', 'view', 'display', 'see', 'check', 'take', 'go'],
        ta: ['காட்டு', 'திற', 'பாரு', 'பார்', 'செல்லு', 'போ', 'கூட்டிட்டு போ'],
        tanglish: ['kaatu', 'thira', 'paaru', 'paar', 'open', 'show', 'po', 'kootitu po'],
      },
      targetNouns: {
        en: ['bookings', 'booking', 'my bookings', 'appointments', 'orders', 'requests', 'history'],
        ta: ['புக்கிங்', 'புக்கிங்ஸ்', 'முன்பதிவு', 'முன்பதிவுகள்', 'என் புக்கிங்', 'சேவை பதிவு'],
        tanglish: ['bookings', 'booking', 'booking-a', 'sevai pathivu', 'munpathivu'],
      },
      phrases: {
        en: [
          'bookings',
          'show bookings',
          'show my bookings',
          'open bookings',
          'open my bookings',
          'take me to bookings',
          'view bookings',
          'my bookings',
          'check my bookings',
          'go to bookings page',
        ],
        ta: [
          'புக்கிங்',
          'புக்கிங்ஸ்',
          'புக்கிங் பாரு',
          'என்னோட புக்கிங் பாரு',
          'என் booking-ஐ காட்டு',
          'என்னோட bookings காட்டு',
          'புக்கிங் காட்டு',
          'booking open பண்ணு',
          'என்ன booking இருக்கு',
          'என் முன்பதிவுகளை காட்டு',
          'புக்கிங்ஸ் காட்டு',
          'என் புக்கிங் திற',
          'என்னை புக்கிங் பேஜுக்கு கூட்டிட்டு போ',
          'புக்கிங் பேஜுக்கு போ',
          'புக்கிங்ஸ் பேஜுக்கு போ',
        ],
        tanglish: [
          'booking paaru',
          'bookings kaatu',
          'en booking-a paaru',
          'en booking paaru',
          'en booking kaatu',
          'booking open pannu',
          'bookings open pannu',
          'ennoda booking paaru',
          'bookings paaru',
          'booking-a paaru',
          'booking page ku po',
          'booking ku po',
        ],
      },
    },
    naturalResponse: {
      en: "Sure, taking you to your bookings.",
      ta: 'சரி, உங்கள் புக்கிங்ஸை காட்டுறேன்.',
    },
  },

  // 3. Providers / Technicians Search Navigation (Customer)
  {
    id: 'NAVIGATE_PROVIDERS',
    category: 'navigation',
    role: 'customer',
    route: '/customer/providers',
    description: {
      en: 'Browse and search verified nearby service technicians',
      ta: 'அருகிலுள்ள சரிபார்க்கப்பட்ட டெக்னீஷியன்களைத் தேடவும்',
    },
    semantic: {
      intentVerbs: {
        en: ['find', 'search', 'show', 'browse', 'look', 'discover', 'open', 'see'],
        ta: ['தேடு', 'காட்டு', 'பாரு', 'பார்', 'திற', 'போ'],
        tanglish: ['thedu', 'kaatu', 'paaru', 'find', 'show', 'search', 'thedu', 'po'],
      },
      targetNouns: {
        en: ['technician', 'technicians', 'mechanic', 'electrician', 'plumber', 'pros', 'providers'],
        ta: ['டெக்னிஷியன்', 'டெக்னீஷியன்', 'டெக்னீசியன்', 'மெக்கானிக்', 'தொழிலாளி', 'நிபுணர்'],
        tanglish: ['technician', 'technicians', 'technician-a', 'aalu', 'mechanic'],
      },
      phrases: {
        en: [
          'find technician',
          'search technician',
          'show technicians',
          'open technicians',
          'find a technician',
          'technician search',
          'search for a technician',
          'show nearby technicians',
          'find pros',
          'browse technicians',
          'open technician list',
          'search for service providers',
          'please find a technician',
          'i need a technician',
        ],
        ta: [
          'டெக்னிஷியன் தேடு',
          'டெக்னீஷியன் காட்டு',
          'டெக்னிஷியன்களை காட்டு',
          'டெக்னீஷியனை தேடு',
          'technician காட்டு',
          'technician தேடு',
          'டெக்னிஷியன் லிஸ்ட் திற',
          'டெக்னிஷியன்ஸ் காட்டு',
          'டெக்னிஷியன் பக்கத்துக்கு போ',
          'technician வேணும்',
          'எனக்கு technician தேவை',
          'எனக்கு ஒரு technician வேணும்',
        ],
        tanglish: [
          'technician search pannu',
          'technician-a thedu',
          'technician thedu',
          'technicians kaatu',
          'technicians-a kaatu',
          'technician list open pannu',
          'technician kaatu',
          'technician pakathuku po',
          'technician venum',
          'oru technician venum',
          'enakku technician thevai',
        ],
      },
    },
    naturalResponse: {
      en: "Sure, I'll find the technicians for you.",
      ta: 'சரி, உங்களுக்கு தகுதியான technicians-ஐ தேடுகிறேன்.',
    },
  },

  // 4. Profile Navigation
  {
    id: 'NAVIGATE_PROFILE',
    category: 'navigation',
    role: 'any',
    route: '/customer/profile', // contextually /technician/profile
    description: {
      en: 'Open user account, settings, and profile dashboard',
      ta: 'சுயவிவரப் பக்கத்தைத் திறக்கவும்',
    },
    semantic: {
      intentVerbs: {
        en: ['open', 'show', 'view', 'check', 'go', 'display'],
        ta: ['திற', 'காட்டு', 'பாரு', 'பார்', 'போ'],
        tanglish: ['open', 'kaatu', 'thira', 'paaru', 'po'],
      },
      targetNouns: {
        en: ['profile', 'account', 'user profile', 'settings', 'details'],
        ta: ['ப்ரொஃபைல்', 'ப்ரோஃபைல்', 'சுயவிவரம்', 'கணக்கு', 'என் விவரம்'],
        tanglish: ['profile', 'suya vivaram', 'en profile'],
      },
      phrases: {
        en: ['profile', 'open profile', 'my profile', 'show profile', 'show my profile', 'view profile', 'go to profile', 'open my profile'],
        ta: ['ப்ரொஃபைல்', 'ப்ரொஃபைல் காட்டு', 'என் ப்ரொஃபைல் காட்டு', 'சுயவிவரம் திற', 'ப்ரொஃபைல் போ', 'என் profile காட்டு', 'சுயவிவரத்தை காட்டு', 'ப்ரொஃபைல் பக்கத்துக்கு போ'],
        tanglish: ['profile open pannu', 'en profile kaatu', 'profile kaatu', 'profile paaru', 'en profile open pannu', 'profile ku po', 'profile pakathuku po'],
      },
    },
    naturalResponse: {
      en: 'Sure, opening your profile.',
      ta: 'சரி, உங்க profile-ஐ திறக்கிறேன்.',
    },
  },

  // 5. Jobs / Opportunities Navigation (Technician)
  {
    id: 'NAVIGATE_JOBS',
    category: 'navigation',
    role: 'technician',
    route: '/technician/jobs',
    description: {
      en: 'View assigned jobs, active executions, and nearby opportunities',
      ta: 'டெக்னீஷியன் வேலை வாய்ப்புகளைப் பார்க்கவும்',
    },
    semantic: {
      intentVerbs: {
        en: ['show', 'open', 'view', 'display', 'see', 'check', 'take', 'go'],
        ta: ['காட்டு', 'திற', 'பாரு', 'பார்', 'போ'],
        tanglish: ['kaatu', 'thira', 'paaru', 'open', 'show', 'po'],
      },
      targetNouns: {
        en: ['jobs', 'my jobs', 'available jobs', 'assigned jobs', 'tasks', 'requests', 'opportunities'],
        ta: ['வேலை', 'வேலைகள்', 'ஜாப்ஸ்', 'வேலை வாய்ப்புகள்', 'என் வேலைகள்'],
        tanglish: ['jobs', 'velai', 'en jobs', 'requests', 'job'],
      },
      phrases: {
        en: [
          'jobs',
          'show jobs',
          'open jobs',
          'my jobs',
          'available jobs',
          'show my jobs',
          'open technician jobs',
          'view jobs',
        ],
        ta: [
          'வேலைகள் பாரு',
          'ஜாப்ஸ் காட்டு',
          'ஜாப்ஸ் பாரு',
          'வேலை பாரு',
          'எனக்கு வந்த jobs காட்டு',
          'available jobs open பண்ணு',
          'வேலைகளை காட்டு',
          'என் வேலைகள் காட்டு',
        ],
        tanglish: [
          'jobs paaru',
          'jobs kaatu',
          'velai paaru',
          'en jobs kaatu',
          'available jobs open pannu',
          'jobs open pannu',
          'job-ku po',
          'job ku po',
        ],
      },
    },
    naturalResponse: {
      en: 'Okay, opening your jobs.',
      ta: 'சரி, உங்கள் ஜாப்ஸை காட்டுறேன்.',
    },
  },

  // 6. Earnings Navigation (Technician)
  {
    id: 'NAVIGATE_EARNINGS',
    category: 'navigation',
    role: 'technician',
    route: '/technician/earnings',
    description: {
      en: 'Inspect payout ledger, today earnings, and commission-free revenue',
      ta: 'வருமான விவரங்கள் மற்றும் கட்டணப் பட்டியலைப் பார்க்கவும்',
    },
    semantic: {
      intentVerbs: {
        en: ['show', 'open', 'view', 'check', 'see', 'display'],
        ta: ['காட்டு', 'திற', 'பாரு', 'பார்', 'போ'],
        tanglish: ['kaatu', 'thira', 'paaru', 'open', 'show'],
      },
      targetNouns: {
        en: ['earnings', 'my earnings', 'income', 'payout', 'money', 'revenue', 'wallet', 'earned', 'earn'],
        ta: ['வருமானம்', 'வருமானத்தை', 'வருவாய்', 'சம்பாத்தியம்', 'பணம்', 'கட்டணம்'],
        tanglish: ['earnings', 'varumanam', 'en earnings', 'income', 'panam', 'payout'],
      },
      phrases: {
        en: [
          'earnings',
          'show earnings',
          'my earnings',
          'income',
          'my income',
          'income paaru',
          'view payout',
          'show my earnings',
          'how much did i earn',
          'how much have i earned',
          'how much i earned',
          'what is my income',
          'open earnings',
        ],
        ta: [
          'வருமானம் காட்டு',
          'வருமானம் பாரு',
          'வருமானத்தை காட்டு',
          'என் வருமானம் காட்டு',
          'earnings காட்டு',
          'நான் எவ்வளவு சம்பாதித்தேன்',
        ],
        tanglish: [
          'income',
          'income paaru',
          'varumanam paaru',
          'varumanam kaatu',
          'earnings kaatu',
          'earnings paaru',
          'en earnings kaatu',
          'evlo sambadhichen',
        ],
      },
    },
    naturalResponse: {
      en: 'Sure, showing your earnings.',
      ta: 'சரி, உங்கள் வருமானத்தை காட்டுகிறேன்.',
    },
  },

  // 7. Subscription Navigation (Technician)
  {
    id: 'NAVIGATE_SUBSCRIPTION',
    category: 'navigation',
    role: 'technician',
    route: '/technician/subscription',
    description: {
      en: 'Manage daily or monthly zero-commission access pass',
      ta: 'சந்தா மற்றும் அணுகல் அட்டையை நிர்வகிக்கவும்',
    },
    semantic: {
      intentVerbs: {
        en: ['show', 'open', 'view', 'manage', 'check'],
        ta: ['காட்டு', 'திற', 'பாரு', 'பார்'],
        tanglish: ['open', 'kaatu', 'thira'],
      },
      targetNouns: {
        en: ['subscription', 'access pass', 'pass', 'plan', 'membership'],
        ta: ['சந்தா', 'அணுகல் அட்டை', 'பாஸ்', 'திட்டம்'],
        tanglish: ['subscription', 'access pass', 'santha'],
      },
      phrases: {
        en: ['subscription', 'open subscription', 'show access pass', 'check subscription'],
        ta: ['சந்தா காட்டு', 'சந்தா விவரம் திற', 'subscription காட்டு'],
        tanglish: ['subscription kaatu', 'subscription open pannu', 'access pass kaatu'],
      },
    },
    naturalResponse: {
      en: 'Sure, opening subscription.',
      ta: 'சரி, subscription விவரங்களை திறக்கிறேன்.',
    },
  },

  // 8. Capabilities Navigation (Technician)
  {
    id: 'NAVIGATE_CAPABILITIES',
    category: 'navigation',
    role: 'technician',
    route: '/technician/capabilities',
    description: {
      en: 'Manage verified multi-skills and trade availability',
      ta: 'திறன்கள் மற்றும் கிடைக்கும் தன்மையை நிர்வகிக்கவும்',
    },
    semantic: {
      intentVerbs: {
        en: ['show', 'open', 'view', 'edit', 'manage'],
        ta: ['காட்டு', 'திற', 'பாரு', 'பார்'],
        tanglish: ['open', 'kaatu', 'thira'],
      },
      targetNouns: {
        en: ['capabilities', 'skills', 'trades', 'availability'],
        ta: ['திறன்கள்', 'திறமை', 'தொழில் திறன்'],
        tanglish: ['capabilities', 'skills', 'my skills'],
      },
      phrases: {
        en: ['capabilities', 'show capabilities', 'my skills', 'open skills', 'view availability'],
        ta: ['திறன்களை காட்டு', 'திறன் பட்டியல் திற', 'capabilities காட்டு'],
        tanglish: ['capabilities kaatu', 'my skills kaatu', 'skills open pannu'],
      },
    },
    naturalResponse: {
      en: 'Sure, opening your capabilities.',
      ta: 'சரி, உங்க திறன்களை திறக்கிறேன்.',
    },
  },

  // 9. Back Navigation
  {
    id: 'NAVIGATE_BACK',
    category: 'navigation',
    role: 'any',
    description: {
      en: 'Navigate to the previous screen in browser history',
      ta: 'முந்தைய பக்கத்திற்குத் திரும்பவும்',
    },
    semantic: {
      intentVerbs: {
        en: ['go', 'take', 'navigate', 'return'],
        ta: ['போ', 'திரும்பு', 'செல்லு'],
        tanglish: ['po', 'thirumbu'],
      },
      targetNouns: {
        en: ['back', 'previous', 'last page'],
        ta: ['பின்னாடி', 'திரும்பி', 'முந்தைய பக்கம்'],
        tanglish: ['back', 'pinnadi', 'thirumbi'],
      },
      phrases: {
        en: ['back', 'go back', 'take me back', 'previous page'],
        ta: ['பின்னாடி போ', 'திரும்பிப் போ', 'திரும்பி போ', 'முந்தைய பக்கத்திற்கு போ'],
        tanglish: ['back po', 'pinnadi po', 'go back pannu'],
      },
    },
    naturalResponse: {
      en: 'Sure, going back.',
      ta: 'சரி, பின்னாடி போகலாம்.',
    },
  },

  // 10. Switch Role: Customer
  {
    id: 'SWITCH_ROLE_CUSTOMER',
    category: 'system_action',
    role: 'any',
    route: '/customer',
    description: {
      en: 'Switch platform interface mode to Customer',
      ta: 'வாடிக்கையாளர் முறைக்கு மாற்றவும்',
    },
    semantic: {
      intentVerbs: {
        en: ['switch', 'change', 'turn', 'go', 'open'],
        ta: ['மாத்து', 'மாற்று', 'போ'],
        tanglish: ['maathu', 'change', 'switch', 'po'],
      },
      targetNouns: {
        en: ['customer', 'customer mode', 'user mode', 'customer side'],
        ta: ['கஸ்டமர்', 'வாடிக்கையாளர்', 'கஸ்டமர் மோடு', 'வாடிக்கையாளர் முறை'],
        tanglish: ['customer', 'customer mode', 'customer side'],
      },
      phrases: {
        en: [
          'customer mode',
          'switch to customer',
          'go to customer',
          'switch to customer mode',
          'open customer side',
          'customer page',
        ],
        ta: [
          'கஸ்டமர் மோடுக்கு போ',
          'வாடிக்கையாளர் பயன்முறை',
          'கஸ்டமர் முறைக்கு மாத்து',
          'customer side போ',
          'கஸ்டமர் பக்கம் போ',
          'கஸ்டமர் மோடு',
        ],
        tanglish: [
          'customer page ku po',
          'customer mode-ku po',
          'customer mode ku po',
          'customer mode ku maathu',
          'customer-ku po',
          'switch to customer pannu',
        ],
      },
    },
    naturalResponse: {
      en: 'Sure, switching you to customer mode.',
      ta: 'சரி, வாடிக்கையாளர் பக்கத்திற்கு மாற்றுகிறேன்.',
    },
  },

  // 11. Switch Role: Technician
  {
    id: 'SWITCH_ROLE_TECHNICIAN',
    category: 'system_action',
    role: 'any',
    route: '/technician',
    description: {
      en: 'Switch platform interface mode to Technician',
      ta: 'டெக்னீஷியன் முறைக்கு மாற்றவும்',
    },
    semantic: {
      intentVerbs: {
        en: ['switch', 'change', 'turn', 'go', 'open'],
        ta: ['மாத்து', 'மாற்று', 'போ'],
        tanglish: ['maathu', 'change', 'switch', 'po'],
      },
      targetNouns: {
        en: ['technician', 'technician mode', 'pro mode', 'technician side'],
        ta: ['டெக்னிஷியன்', 'டெக்னீஷியன்', 'டெக்னிஷியன் மோடு', 'தொழிலாளர் முறை'],
        tanglish: ['technician', 'technician mode', 'technician side'],
      },
      phrases: {
        en: [
          'technician mode',
          'switch to technician',
          'go to technician',
          'open technician mode',
          'open technician side',
          'technician page',
        ],
        ta: [
          'டெக்னிஷியன் மோடுக்கு போ',
          'டெக்னீஷியன் பயன்முறைக்கு மாத்து',
          'technician side போ',
          'டெக்னிஷியன் பக்கம் போ',
          'டெக்னிஷியன் மோடு',
        ],
        tanglish: [
          'technician page ku po',
          'technician mode-ku po',
          'technician mode ku po',
          'technician mode ku maathu',
          'technician-ku po',
          'switch to technician pannu',
        ],
      },
    },
    naturalResponse: {
      en: 'Sure, switching you to technician mode.',
      ta: 'சரி, டெக்னிஷியன் மோடுக்கு மாற்றுறேன்.',
    },
  },

  // 12. Switch Language
  {
    id: 'SWITCH_LANGUAGE',
    category: 'system_action',
    role: 'any',
    description: {
      en: 'Switch voice assistant speech and recognition language between Tamil and English',
      ta: 'குரல் உதவியாளரின் மொழியை தமிழ் அல்லது ஆங்கிலத்திற்கு மாற்றவும்',
    },
    semantic: {
      intentVerbs: {
        en: ['switch', 'speak', 'change', 'talk', 'use'],
        ta: ['மாத்து', 'பேசு', 'பயன்படுத்து'],
        tanglish: ['maathu', 'pesu', 'use pannu'],
      },
      targetNouns: {
        en: ['language', 'tamil', 'english', 'tamil language', 'english language'],
        ta: ['மொழி', 'தமிழ்', 'ஆங்கிலம்'],
        tanglish: ['language', 'tamil', 'english'],
      },
      phrases: {
        en: ['switch to english', 'speak in english', 'speak english', 'switch to tamil', 'speak in tamil'],
        ta: ['தமிழ்ல பேசு', 'தமிழில் பேசு', 'ஆங்கிலத்தில் பேசு', 'english பேசு'],
        tanglish: ['english language use pannu', 'tamil la pesu', 'english la pesu', 'tamil ku maathu', 'english ku maathu'],
      },
    },
    naturalResponse: {
      en: "Sure, I'll speak with you in English from now on. How can I help you?",
      ta: 'சரி, இனி உங்களுடன் தமிழில் பேசுகிறேன். உங்களுக்கு என்ன உதவி வேண்டும்?',
    },
  },

  // 13. Contextual Button: SELECT_TECHNICIAN
  {
    id: 'SELECT_TECHNICIAN',
    category: 'button_action',
    role: 'customer',
    description: {
      en: 'Select and proceed to booking with the focused or ordinal technician',
      ta: 'தேர்ந்தெடுக்கப்பட்ட டெக்னீஷியனை தேர்வு செய்து முன்பதிவு செய்யவும்',
    },
    semantic: {
      intentVerbs: {
        en: ['select', 'choose', 'book', 'hire', 'pick'],
        ta: ['தேர்வு செய்', 'செலக்ட் பண்ணு', 'புக் பண்ணு', 'தேர்ந்தெடு'],
        tanglish: ['select pannu', 'choose pannu', 'book pannu', 'eduthukko'],
      },
      targetNouns: {
        en: ['this technician', 'technician', 'pro', 'provider', 'first one', 'second one'],
        ta: ['இந்த technician', 'இந்த டெக்னிஷியன்', 'இவரை', 'முதல் technician', 'முதல் ஆளு'],
        tanglish: ['indha technician', 'technician-a', 'ivara', 'first technician', 'first one'],
      },
      phrases: {
        en: [
          'select this technician',
          'choose this technician',
          'book this technician',
          'select technician',
          'choose first technician',
          'pick this pro',
          'choose technician',
        ],
        ta: [
          'இந்த technician-ஐ select பண்ணு',
          'இவரை தேர்வு பண்ணு',
          'இந்த technician-ஐ book பண்ணு',
          'முதல் technician-ஐ select பண்ணு',
          'இவரை புக் செய்',
          'இந்த டெக்னிஷியனை தேர்வு செய்',
        ],
        tanglish: [
          'indha technician-a select pannu',
          'indha technician select pannu',
          'ivara select pannu',
          'first technician choose pannu',
          'first technician select pannu',
          'ivara book pannu',
          'indha aala select pannu',
        ],
      },
    },
    contextual: {
      relevantRoutes: ['/customer/providers', '/customer/express'],
      deicticKeywords: ['this', 'first', 'second', 'இந்த', 'இவர்', 'இவரை', 'முதல்'],
    },
    naturalResponse: {
      en: 'Got it, selecting this technician.',
      ta: 'இந்த டெக்னிஷியனை தேர்வு பண்றேன்.',
    },
  },

  // 14. Contextual Button: VIEW_TECHNICIAN_PROFILE
  {
    id: 'VIEW_TECHNICIAN_PROFILE',
    category: 'button_action',
    role: 'customer',
    description: {
      en: 'View full credentials, bio, and multi-skill badges of a technician',
      ta: 'டெக்னீஷியனின் முழு விவரப் பக்கத்தைப் பார்க்கவும்',
    },
    semantic: {
      intentVerbs: {
        en: ['show', 'view', 'open', 'inspect', 'see'],
        ta: ['காட்டு', 'திற', 'பாரு', 'பார்'],
        tanglish: ['kaatu', 'open', 'thira', 'paaru'],
      },
      targetNouns: {
        en: ['his profile', 'profile', 'technician profile', 'details', 'bio'],
        ta: ['இவரோட profile', 'டெக்னிஷியன் விவரம்', 'சுயவிவரம்', 'அவரது சுயவிவரம்'],
        tanglish: ['ivara profile', 'technician profile', 'ivaroada profile', 'ivar profile'],
      },
      phrases: {
        en: [
          'show his profile',
          'view his profile',
          'view technician details',
          'show technician profile',
          'technician profile open',
          'view profile',
        ],
        ta: [
          'இவரோட profile காட்டு',
          'இந்த technician விவரம் திற',
          'டெக்னீஷியன் profile காட்டு',
        ],
        tanglish: [
          'ivaroada profile kaatu',
          'ivar profile kaatu',
          'technician profile open pannu',
          'technician details kaatu',
        ],
      },
    },
    contextual: {
      relevantRoutes: ['/customer/providers'],
      deicticKeywords: ['his', 'their', 'this', 'இவரோட', 'இந்த'],
    },
    naturalResponse: {
      en: "Opening the technician's profile.",
      ta: 'சரி, டெக்னீஷியனின் விவரப் பக்கத்தைத் திறக்கிறேன்.',
    },
  },

  // 15. Contextual Button: CANCEL_BOOKING
  {
    id: 'CANCEL_BOOKING',
    category: 'button_action',
    role: 'customer',
    requiresConfirmation: true,
    confirmationMessage: {
      en: 'Do you want me to cancel this booking?',
      ta: 'இந்த புக்கிங்கை ரத்து செய்யவா?',
    },
    description: {
      en: 'Cancel active or scheduled service booking with confirmation',
      ta: 'முன்பதிவை ரத்து செய்தல் (உறுதிப்படுத்தல் தேவை)',
    },
    semantic: {
      intentVerbs: {
        en: ['cancel', 'abort', 'stop', 'drop', 'remove'],
        ta: ['ரத்து செய்', 'கேன்சல் பண்ணு', 'நிறுத்து', 'வேண்டாம்'],
        tanglish: ['cancel pannu', 'cancel pannidu', 'vendaam'],
      },
      targetNouns: {
        en: ['booking', 'this booking', 'my booking', 'booking request', 'appointment'],
        ta: ['முன்பதிவு', 'இந்த booking', 'என் booking', 'சேவை கோரிக்கை'],
        tanglish: ['booking', 'indha booking', 'en booking'],
      },
      phrases: {
        en: [
          'cancel this booking',
          'cancel my booking',
          'cancel booking',
          'abort this service',
          'cancel this request',
        ],
        ta: [
          'இந்த booking cancel பண்ணு',
          'booking-ஐ cancel பண்ணிடு',
          'முன்பதிவை ரத்து செய்',
          'இந்த முன்பதிவு வேண்டாம்',
          'இந்த புக்கிங்கை ரத்து செய்',
        ],
        tanglish: [
          'indha booking cancel pannu',
          'booking-a cancel pannidu',
          'booking cancel pannu',
          'booking cancel',
        ],
      },
    },
    contextual: {
      relevantRoutes: ['/customer/bookings', '/customer/tracking'],
      deicticKeywords: ['this', 'my', 'இந்த', 'என்'],
    },
    naturalResponse: {
      en: "Okay, cancelling this booking.",
      ta: 'சரி, இந்த புக்கிங்கை ரத்து செய்கிறேன்.',
    },
  },

  // 16. Contextual Button: APPROVE_ESTIMATE
  {
    id: 'APPROVE_ESTIMATE',
    category: 'button_action',
    role: 'customer',
    requiresConfirmation: true,
    confirmationMessage: {
      en: 'Would you like to approve the ₹1,100 estimate?',
      ta: '₹1,100 estimate-ஐ approve செய்யவா?',
    },
    description: {
      en: 'Approve itemized parts and labour quotation and lock repair price',
      ta: 'மதிப்பீட்டை ஏற்றுக்கொண்டு விலையை உறுதிப்படுத்தவும்',
    },
    semantic: {
      intentVerbs: {
        en: ['approve', 'accept', 'confirm', 'agree', 'lock'],
        ta: ['ஒப்புக்கொள்', 'ஏற்றுக்கொள்', 'அப்ரூவ் பண்ணு', 'பூட்டு'],
        tanglish: ['approve pannu', 'accept pannu', 'ok', 'seri'],
      },
      targetNouns: {
        en: ['estimate', 'this estimate', 'quote', 'quotation', 'price', 'repair amount'],
        ta: ['மதிப்பீடு', 'எஸ்டிமேட்', 'இந்த estimate', 'தொகை', 'விலை'],
        tanglish: ['estimate', 'indha estimate', 'price', 'amount'],
      },
      phrases: {
        en: [
          'approve this estimate',
          'accept the estimate',
          'approve estimate',
          'amount okay, start work',
          'estimate is fine, proceed',
          'lock price and approve',
        ],
        ta: [
          'estimate approve பண்ணு',
          'estimate-ஐ approve பண்ணலாம்',
          'மதிப்பீட்டை ஏற்கவும்',
          'மதிப்பீட்டை ஏற்றுக்கொள்',
          'தொகை சரி, வேலையை ஆரம்பிக்கலாம்',
          'எஸ்டிமேட் ஒப்புதல் செய்',
        ],
        tanglish: [
          'estimate approve pannu',
          'estimate seri approve pannunga',
          'amount ok work start pannu',
        ],
      },
    },
    contextual: {
      relevantRoutes: ['/customer/tracking'],
      deicticKeywords: ['this', 'the', 'இந்த'],
    },
    naturalResponse: {
      en: 'Estimate approved! Price locked at ₹1,100.',
      ta: 'மதிப்பீடு ஒப்புதல் அளிக்கப்பட்டது! விலை உறுதி செய்யப்படுகிறது.',
    },
  },

  // 17. Contextual Button: START_WORK
  {
    id: 'START_WORK',
    category: 'button_action',
    role: 'technician',
    description: {
      en: 'Begin actual repair work after estimate approval without needing an OTP',
      ta: 'வேலையைத் தொடங்கவும்',
    },
    semantic: {
      intentVerbs: {
        en: ['start', 'begin', 'initiate', 'commence', 'kickoff'],
        ta: ['ஆரம்பி', 'தொடங்கு', 'ஆரம்பிக்கலாம்'],
        tanglish: ['start pannu', 'start pannalam', 'aarambikkalam', 'aaramikalam', 'start', 'aarambi'],
      },
      targetNouns: {
        en: ['work', 'job', 'repair', 'service', 'the work'],
        ta: ['வேலை', 'ரிப்பேர்', 'பணி', 'வேலையை'],
        tanglish: ['velai', 'velaya', 'work', 'job'],
      },
      phrases: {
        en: [
          'start work',
          'start the work',
          'begin the job',
          'start repair',
          'begin work',
          'let us start',
          'lets start work',
          'start working',
        ],
        ta: [
          'வேலை ஆரம்பி',
          'வேலையை ஆரம்பி',
          'வேலை தொடங்கு',
          'வேலையை ஆரம்பிக்கலாம்',
          'ரிப்பேர் தொடங்கு',
        ],
        tanglish: [
          'velai aarambikkalam',
          'velai aarambi',
          'velaya start pannalam',
          'velaiya start pannalam',
          'velaya start pannu',
          'work start pannu',
          'work start pannalam',
          'velai aaramikalam',
          'job start',
          'aarambikkalam',
        ],
      },
    },
    contextual: {
      relevantRoutes: ['/technician/jobs'],
    },
    naturalResponse: {
      en: "Alright, let's start the job.",
      ta: 'சரி, வேலை ஆரம்பிக்கலாம்.',
    },
  },

  // 18. Contextual Button: MARK_ARRIVED
  {
    id: 'MARK_ARRIVED',
    category: 'button_action',
    role: 'technician',
    description: {
      en: 'Mark technician arrival at customer doorstep',
      ta: 'வாடிக்கையாளர் வாசலில் வந்து சேர்ந்ததைப் பதிவு செய்யவும்',
    },
    semantic: {
      intentVerbs: {
        en: ['arrived', 'reach', 'reached', 'here', 'mark', 'arrive'],
        ta: ['வந்துட்டேன்', 'சேர்ந்துட்டேன்', 'பதிவு செய்'],
        tanglish: ['vandhuten', 'vandhutten', 'vanthuten', 'reach aayitten', 'here', 'vanthaachu', 'vandhaachu'],
      },
      targetNouns: {
        en: ['doorstep', 'location', 'customer address', 'arrival', 'arrived'],
        ta: ['வாசல்', 'இடம்', 'முகவரி'],
        tanglish: ['doorstep', 'location'],
      },
      phrases: {
        en: [
          "I'm here",
          'technician arrived',
          'mark arrived',
          'I reached',
          'reached location',
          'arrived',
          'i have arrived',
          "i've arrived",
          'ive arrived',
          'i ve arrived',
        ],
        ta: [
          'நான் வந்துட்டேன்',
          'வந்துட்டேன்',
          'வாசல் வந்துட்டேன்',
          'இடம் சேர்ந்துட்டேன்',
          'வந்தாச்சு',
        ],
        tanglish: [
          'naan vandhuten',
          'vandhuten',
          'naan vandhutten',
          'vanthuten',
          'naan vanthuten',
          'vandhaachu',
          'vanthaachu',
          'location reach aayitten',
          'mark arrived pannu',
        ],
      },
    },
    contextual: {
      relevantRoutes: ['/technician/jobs'],
    },
    naturalResponse: {
      en: 'Marked arrived at doorstep.',
      ta: 'சரி, நீங்கள் வந்துவிட்டதாகப் பதிவு செய்கிறேன்.',
    },
  },

  // 19. Contextual Button: MARK_ON_THE_WAY
  {
    id: 'MARK_ON_THE_WAY',
    category: 'button_action',
    role: 'technician',
    description: {
      en: 'Mark journey start and notify customer of arrival ETA',
      ta: 'பயணத்தைத் தொடங்கி வாடிக்கையாளருக்கு அறிவிக்கவும்',
    },
    semantic: {
      intentVerbs: {
        en: ['start', 'drive', 'go', 'head', 'leave'],
        ta: ['கிளம்பு', 'கிளம்பிட்டேன்', 'வழில இருக்கேன்'],
        tanglish: ['kilambitten', 'on the way', 'start journey', 'kilambiten'],
      },
      targetNouns: {
        en: ['journey', 'way', 'route', 'travel'],
        ta: ['பயணம்', 'வழி'],
        tanglish: ['journey', 'vazhi'],
      },
      phrases: {
        en: ['start journey', 'on the way', 'heading there', 'driving to location'],
        ta: ['பயணம் தொடங்கு', 'கிளம்பிட்டேன்', 'வழில இருக்கேன்', 'இப்ப கிளம்புறேன்'],
        tanglish: ['journey start pannu', 'on the way ku maathu', 'kilambitten', 'kilambiten'],
      },
    },
    contextual: {
      relevantRoutes: ['/technician/jobs'],
    },
    naturalResponse: {
      en: 'Journey started! Customer notified.',
      ta: 'பயணம் தொடங்கப்பட்டது! வாடிக்கையாளருக்கு தகவல் தெரிவிக்கிறேன்.',
    },
  },

  // 20. Contextual Button: ACCEPT_JOB
  {
    id: 'ACCEPT_REQUEST',
    category: 'button_action',
    role: 'technician',
    description: {
      en: 'Accept job opportunity and add to active technician queue',
      ta: 'வேலை வாய்ப்பை ஏற்று வரிசையில் சேர்க்கவும்',
    },
    semantic: {
      intentVerbs: {
        en: ['accept', 'take', 'agree', 'confirm'],
        ta: ['ஏற்றுக்கொள்', 'ஏத்துக்கோ', 'எடுத்துக்கோ'],
        tanglish: ['accept pannu', 'eduthukko', 'seri'],
      },
      targetNouns: {
        en: ['this job', 'job', 'request', 'opportunity', 'first job'],
        ta: ['இந்த வேலை', 'வேலை', 'ரிக்வெஸ்ட்', 'முதல் வேலை'],
        tanglish: ['indha job', 'job', 'first job'],
      },
      phrases: {
        en: [
          'accept this job',
          'take this job',
          'accept job',
          'accept first job',
          'confirm this request',
          'accept this request',
          'accept request',
        ],
        ta: [
          'இந்த job accept பண்ணு',
          'முதல் job accept பண்ணு',
          'வேலையை ஏற்றுக்கொள்',
          'இந்த வேலையை எடு',
          'இந்த வேலையை ஏத்துக்கோ',
        ],
        tanglish: [
          'job accept pannu',
          'indha job accept pannu',
          'first job accept pannu',
          'request accept pannu',
          'accept pannu',
        ],
      },
    },
    contextual: {
      relevantRoutes: ['/technician', '/technician/jobs'],
      deicticKeywords: ['this', 'first', 'இந்த', 'முதல்'],
    },
    naturalResponse: {
      en: 'Opportunity accepted! Navigating to job execution.',
      ta: 'சரி, இந்த வேலையை ஏற்கிறேன். வேலைப் பக்கத்திற்குச் செல்கிறேன்.',
    },
  },

  // 21. Contextual Button: PASS_JOB
  {
    id: 'REJECT_REQUEST',
    category: 'button_action',
    role: 'technician',
    requiresConfirmation: true,
    confirmationMessage: {
      en: 'Would you like to pass on this job opportunity?',
      ta: 'இந்த வேலையை தவிர்க்க விரும்புகிறீர்களா?',
    },
    description: {
      en: 'Pass or decline job opportunity with confirmation',
      ta: 'வேலை வாய்ப்பைத் தவிர்த்தல்',
    },
    semantic: {
      intentVerbs: {
        en: ['pass', 'reject', 'skip', 'decline', 'dismiss'],
        ta: ['தவிர்', 'வேண்டாம்', 'நிராகரி'],
        tanglish: ['pass pannu', 'skip pannu', 'vendaam'],
      },
      targetNouns: {
        en: ['this job', 'opportunity', 'request'],
        ta: ['இந்த வேலை', 'வேலை'],
        tanglish: ['indha job', 'job'],
      },
      phrases: {
        en: ['pass this job', 'reject this job', 'skip this job', 'decline request', 'pass job', 'reject request'],
        ta: ['இந்த வேலை வேண்டாம்', 'வேலையை தவிர்', 'pass பண்ணு', 'வேண்டாம்'],
        tanglish: ['indha job pass pannu', 'job pass pannu', 'skip pannu', 'job vendaam', 'pass pannu'],
      },
    },
    contextual: {
      relevantRoutes: ['/technician', '/technician/jobs'],
    },
    naturalResponse: {
      en: 'Passed job opportunity.',
      ta: 'சரி, இந்த வேலை தவிர்க்கப்பட்டது.',
    },
  },

  // 22. Contextual Button: CONFIRM_BOOKING
  {
    id: 'CONFIRM_BOOKING',
    category: 'button_action',
    role: 'customer',
    description: {
      en: 'Confirm schedule and finalize booking request to dispatch technician',
      ta: 'முன்பதிவை உறுதி செய்து டெக்னீஷியனை அழைக்கவும்',
    },
    semantic: {
      intentVerbs: {
        en: ['confirm', 'reserve', 'finalize', 'submit'],
        ta: ['உறுதி செய்', 'பதிவு செய்', 'சமர்ப்பி'],
        tanglish: ['confirm pannu', 'reserve pannu', 'urudhi sei'],
      },
      targetNouns: {
        en: ['booking', 'appointment', 'request'],
        ta: ['முன்பதிவு', 'பதிவு', 'கோரிக்கை'],
        tanglish: ['booking', 'munpathivu'],
      },
      phrases: {
        en: ['confirm booking', 'reserve booking', 'submit booking', 'finalize request'],
        ta: ['முன்பதிவை உறுதி செய்', 'booking உறுதி பண்ணு', 'பதிவை உறுதி செய்'],
        tanglish: ['booking confirm pannu', 'confirm booking', 'reserve pannu'],
      },
    },
    contextual: {
      relevantRoutes: ['/customer/book'],
    },
    naturalResponse: {
      en: 'Booking confirmed. Assigning verified technician now.',
      ta: 'பதிவு உறுதி செய்யப்படுகிறது. டெக்னீஷியன் ஒதுக்கப்படுகிறார்.',
    },
  },

  // 23. Contextual Button: INITIATE_PAYMENT
  {
    id: 'INITIATE_PAYMENT',
    category: 'button_action',
    role: 'customer',
    description: {
      en: 'Proceed to payment gateway or transaction QR scanner',
      ta: 'கட்டணப் பக்கத்திற்குச் செல்லவும்',
    },
    semantic: {
      intentVerbs: {
        en: ['pay', 'make payment', 'proceed to pay', 'checkout'],
        ta: ['செலுத்து', 'கட்டு', 'கொடு', 'பணம் செலுத்து'],
        tanglish: ['pay pannu', 'panam kudu', 'kattanam seluthu'],
      },
      targetNouns: {
        en: ['payment', 'bill', 'fee', 'money', 'qr'],
        ta: ['கட்டணம்', 'பணம்', 'பில்', 'கட்டணத் தொகை'],
        tanglish: ['payment', 'panam', 'bill'],
      },
      phrases: {
        en: ['make payment', 'pay now', 'proceed to payment', 'pay bill', 'upi pay', 'open payment', 'payment page open'],
        ta: ['பணம் செலுத்து', 'கட்டணம் செலுத்து', 'pay பண்ணு', 'பில் கட்டு', 'பணம் கட்டு'],
        tanglish: ['payment page open pannu', 'payment pannu', 'pay pannu', 'panam kudu', 'gpay pannu'],
      },
    },
    contextual: {
      relevantRoutes: ['/customer/tracking', '/customer/payment'],
    },
    naturalResponse: {
      en: 'Opening payment screen.',
      ta: 'கட்டணப் பக்கத்திற்குச் செல்கிறேன்.',
    },
  },

  // 24. Contextual Button: COMPLETE_JOB
  {
    id: 'COMPLETE_JOB',
    category: 'button_action',
    role: 'technician',
    description: {
      en: 'Mark technician work completed for final customer inspection',
      ta: 'வேலை முடிவடைந்ததாகப் பதிவு செய்யவும்',
    },
    semantic: {
      intentVerbs: {
        en: ['complete', 'finish', 'done', 'mark complete', 'close'],
        ta: ['முடி', 'முடிந்தது', 'முடித்துவிட்டேன்', 'முடித்தாச்சு'],
        tanglish: ['mudichuten', 'mudinjidhu', 'complete pannu', 'finish pannu'],
      },
      targetNouns: {
        en: ['job', 'work', 'repair', 'task', 'this job'],
        ta: ['வேலை', 'பணி', 'ரிப்பேர்'],
        tanglish: ['job', 'velai', 'work'],
      },
      phrases: {
        en: ['complete job', 'mark job completed', 'finish work', 'work is done', 'job completed'],
        ta: ['வேலை முடிந்தது', 'வேலையை முடி', 'வேலை முடிச்சாச்சு', 'பணியை முடி'],
        tanglish: ['job mudichuten', 'velai mudinjidhu', 'job complete pannu', 'work finish'],
      },
    },
    contextual: {
      relevantRoutes: ['/technician/jobs'],
    },
    naturalResponse: {
      en: 'Great work! Marking this job completed.',
      ta: 'சிறப்பு! இந்த வேலை முடிவடைந்ததாகப் பதிவு செய்கிறேன்.',
    },
  },

  // 25. Contextual Button: SUBMIT_DIAGNOSIS
  {
    id: 'SUBMIT_DIAGNOSIS',
    category: 'button_action',
    role: 'technician',
    description: {
      en: 'Submit diagnostic inspection report and identified problem',
      ta: 'பரிசோதனை அறிக்கையை சமர்ப்பிக்கவும்',
    },
    semantic: {
      intentVerbs: {
        en: ['submit', 'send', 'save', 'file'],
        ta: ['சமர்ப்பி', 'அனுப்பு', 'பதிவு செய்'],
        tanglish: ['submit pannu', 'send pannu'],
      },
      targetNouns: {
        en: ['diagnosis', 'inspection', 'diagnostic report', 'findings'],
        ta: ['பரிசோதனை', 'பரிசோதனை அறிக்கை', 'டயக்னாசிஸ்'],
        tanglish: ['diagnosis', 'inspection'],
      },
      phrases: {
        en: ['submit diagnosis', 'diagnosis done', 'send diagnosis report', 'submit inspection'],
        ta: ['பரிசோதனை அறிக்கை சமர்ப்பி', 'டயக்னாசிஸ் சமர்ப்பி', 'பரிசோதனை முடிந்தது'],
        tanglish: ['diagnosis submit pannu', 'diagnosis mudinjidhu'],
      },
    },
    contextual: {
      relevantRoutes: ['/technician/jobs'],
    },
    naturalResponse: {
      en: 'Diagnosis submitted to customer.',
      ta: 'பரிசோதனை அறிக்கை வாடிக்கையாளருக்கு அனுப்பப்பட்டது.',
    },
  },

  // 26. Contextual Button: SUBMIT_ESTIMATE
  {
    id: 'SUBMIT_ESTIMATE',
    category: 'button_action',
    role: 'technician',
    description: {
      en: 'Send parts and repair estimate to customer for lock approval',
      ta: 'மதிப்பீட்டு அறிக்கையை வாடிக்கையாளருக்கு அனுப்பவும்',
    },
    semantic: {
      intentVerbs: {
        en: ['submit', 'send', 'give', 'share'],
        ta: ['அனுப்பு', 'சமர்ப்பி', 'கொடு'],
        tanglish: ['submit pannu', 'send pannu', 'kudu'],
      },
      targetNouns: {
        en: ['estimate', 'quote', 'quotation', 'repair price', 'parts price'],
        ta: ['மதிப்பீடு', 'விலை பட்டியல்', 'எஸ்டிமேட்'],
        tanglish: ['estimate', 'quote'],
      },
      phrases: {
        en: ['submit estimate', 'send quote', 'send estimate', 'share quotation'],
        ta: ['மதிப்பீடு அனுப்பு', 'எஸ்டிமேட் சமர்ப்பி', 'விலை விவரம் அனுப்பு'],
        tanglish: ['estimate submit pannu', 'quote send pannu'],
      },
    },
    contextual: {
      relevantRoutes: ['/technician/jobs'],
    },
    naturalResponse: {
      en: 'Repair estimate sent for customer approval.',
      ta: 'சரி, மதிப்பீட்டு அறிக்கை வாடிக்கையாளர் ஒப்புதலுக்கு அனுப்பப்பட்டது.',
    },
  },

  // 27. SELECT_DIAGNOSIS_MODE
  {
    id: 'SELECT_DIAGNOSIS_MODE',
    category: 'button_action',
    role: 'customer',
    description: {
      en: 'Select diagnosis mode with upfront inspection fee',
      ta: 'பரிசோதனை கட்டணத்துடன் டயக்னாசிஸ் முறையை தேர்வு செய்யவும்',
    },
    semantic: {
      intentVerbs: {
        en: ['select', 'choose', 'pick'],
        ta: ['தேர்ந்தெடு', 'செலக்ட் பண்ணு'],
        tanglish: ['select pannu', 'choose pannu'],
      },
      targetNouns: {
        en: ['diagnosis mode', 'diagnosis', 'diagnosis option', 'inspection'],
        ta: ['டயக்னாசிஸ் முறை', 'டயக்னாசிஸ்', 'பரிசோதனை முறை'],
        tanglish: ['diagnosis mode', 'diagnosis'],
      },
      phrases: {
        en: ['select diagnosis mode', 'choose diagnosis', 'diagnosis option', 'diagnosis mode', '149 diagnosis', 'first option'],
        ta: ['டயக்னாசிஸ் மோடு', 'டயக்னாசிஸ் தேர்வு செய்', 'டயக்னாசிஸ் செலக்ட் பண்ணு', '149 ரூபாய் டயக்னாசிஸ்'],
        tanglish: ['diagnosis mode select pannu', 'diagnosis mode', 'diagnosis choose pannu'],
      },
    },
    contextual: {
      relevantRoutes: ['/customer/book'],
    },
    naturalResponse: {
      en: 'Selected Diagnosis Mode with ₹149 inspection fee.',
      ta: '₹149 பரிசோதனைக் கட்டணத்துடன் டயக்னாசிஸ் முறை தேர்ந்தெடுக்கப்பட்டது.',
    },
  },

  // 28. SELECT_DIRECT_SERVICE_MODE
  {
    id: 'SELECT_DIRECT_SERVICE_MODE',
    category: 'button_action',
    role: 'customer',
    description: {
      en: 'Select direct service mode without upfront diagnosis fee',
      ta: 'நேரடி சேவை முறையை தேர்வு செய்யவும்',
    },
    semantic: {
      intentVerbs: {
        en: ['select', 'choose', 'pick'],
        ta: ['தேர்ந்தெடு', 'செலக்ட் பண்ணு'],
        tanglish: ['select pannu', 'choose pannu'],
      },
      targetNouns: {
        en: ['direct service', 'direct repair', 'service mode', 'repair option'],
        ta: ['நேரடி சேவை', 'டைரக்ட் சர்வீஸ்'],
        tanglish: ['direct service', 'direct repair'],
      },
      phrases: {
        en: ['select direct service', 'direct repair', 'service mode', 'direct service mode', 'second option', 'direct service'],
        ta: ['நேரடி சேவை', 'நேரடி சர்வீஸ்', 'டைரக்ட் சர்வீஸ்', 'டைரக்ட் சர்வீஸ் தேர்வு செய்'],
        tanglish: ['direct service select pannu', 'direct service mode', 'direct repair'],
      },
    },
    contextual: {
      relevantRoutes: ['/customer/book'],
    },
    naturalResponse: {
      en: 'Selected Direct Service mode with zero upfront diagnosis fee.',
      ta: 'முன்பணக் கட்டணமில்லா நேரடி சேவை முறை தேர்ந்தெடுக்கப்பட்டது.',
    },
  },

  // 29. SELECT_BOOKING_SLOT
  {
    id: 'SELECT_BOOKING_SLOT',
    category: 'button_action',
    role: 'customer',
    description: {
      en: 'Select preferred appointment time slot',
      ta: 'முன்பதிவு நேரத்தை தேர்வு செய்யவும்',
    },
    semantic: {
      intentVerbs: {
        en: ['select', 'choose', 'book at', 'set time'],
        ta: ['தேர்ந்தெடு', 'நேரம் அமை'],
        tanglish: ['slot select pannu', 'time set pannu'],
      },
      targetNouns: {
        en: ['slot', 'time', 'appointment', 'window'],
        ta: ['நேரம்', 'முன்பதிவு நேரம்'],
        tanglish: ['slot', 'time'],
      },
      phrases: {
        en: ['tomorrow 6 pm', 'tomorrow 10 am', 'tomorrow 2 pm', 'day after tomorrow 11 am', 'select 6 pm slot', 'tomorrow at 6'],
        ta: ['நாளைக்கு மாலை 6 மணிக்கு', 'நாளைக்கு காலை 10 மணிக்கு', 'நாளைக்கு 2 மணிக்கு', 'நாளை மறுநாள் 11 மணிக்கு'],
        tanglish: ['naalaiki 6 manikku', 'tomorrow 6 pm slot', 'naalaiki 10 am slot'],
      },
    },
    contextual: {
      relevantRoutes: ['/customer/book'],
    },
    naturalResponse: {
      en: 'Appointment window updated.',
      ta: 'முன்பதிவு நேரம் தேர்ந்தெடுக்கப்பட்டது.',
    },
  },

  // 30. SELECT_PAYMENT_METHOD
  {
    id: 'SELECT_PAYMENT_METHOD',
    category: 'button_action',
    role: 'customer',
    description: {
      en: 'Select payment method (QR, UPI, or Card)',
      ta: 'கட்டண முறையை தேர்வு செய்யவும்',
    },
    semantic: {
      intentVerbs: {
        en: ['select', 'choose', 'pay with', 'use'],
        ta: ['தேர்ந்தெடு', 'செலுத்து'],
        tanglish: ['select pannu', 'use pannu'],
      },
      targetNouns: {
        en: ['upi', 'qr', 'card', 'payment method'],
        ta: ['யுபிஐ', 'கியூஆர்', 'கார்டு'],
        tanglish: ['upi', 'qr', 'card'],
      },
      phrases: {
        en: ['select qr', 'nexdo qr', 'select upi', 'test upi', 'select card', 'test card', 'use upi', 'use card'],
        ta: ['கியூஆர் தேர்வு செய்', 'யுபிஐ தேர்வு செய்', 'கார்டு தேர்வு செய்', 'upi செலக்ட் பண்ணு'],
        tanglish: ['qr select pannu', 'upi select pannu', 'card select pannu'],
      },
    },
    contextual: {
      relevantRoutes: ['/customer/payment'],
    },
    naturalResponse: {
      en: 'Payment method updated.',
      ta: 'கட்டண முறை மாற்றப்பட்டது.',
    },
  },

  // 31. CONFIRM_PAYMENT
  {
    id: 'CONFIRM_PAYMENT',
    category: 'button_action',
    role: 'customer',
    requiresConfirmation: true,
    description: {
      en: 'Authorize and complete payment handoff',
      ta: 'கட்டணம் செலுத்துவதை உறுதி செய்யவும்',
    },
    confirmationMessage: {
      en: 'Shall I authorize this payment?',
      ta: 'இந்தக் கட்டணத்தை உறுதி செய்து செலுத்தவா?',
    },
    semantic: {
      intentVerbs: {
        en: ['pay', 'authorize', 'confirm', 'complete'],
        ta: ['செலுத்து', 'பணம் கட்டு', 'உறுதி செய்'],
        tanglish: ['pay pannu', 'authorize pannu'],
      },
      targetNouns: {
        en: ['payment', 'bill', 'fee', 'amount'],
        ta: ['கட்டணம்', 'பணம்'],
        tanglish: ['payment', 'panam'],
      },
      phrases: {
        en: ['pay now', 'authorize payment', 'confirm payment', 'complete payment', 'pay 149', 'pay 1100'],
        ta: ['பணம் செலுத்து', 'கட்டணம் செலுத்து', 'pay பண்ணு', 'இப்போதே செலுத்து'],
        tanglish: ['pay now pannu', 'authorize pannu', 'payment confirm pannu'],
      },
    },
    contextual: {
      relevantRoutes: ['/customer/payment'],
    },
    naturalResponse: {
      en: 'Payment authorized successfully.',
      ta: 'கட்டணம் வெற்றிகரமாக செலுத்தப்பட்டது.',
    },
  },

  // 32. LOGOUT
  {
    id: 'LOGOUT',
    category: 'system_action',
    role: 'any',
    description: {
      en: 'Sign out from current session',
      ta: 'கணக்கிலிருந்து வெளியேறவும்',
    },
    semantic: {
      intentVerbs: {
        en: ['logout', 'sign out', 'exit'],
        ta: ['வெளியேறு', 'லாக் அவுட் செய்'],
        tanglish: ['logout pannu', 'sign out pannu'],
      },
      targetNouns: {
        en: ['session', 'account'],
        ta: ['கணக்கு', 'அமர்வு'],
        tanglish: ['account'],
      },
      phrases: {
        en: ['logout', 'sign out', 'log out', 'exit account'],
        ta: ['வெளியேறு', 'லாக் அவுட்', 'லாக் அவுட் பண்ணு'],
        tanglish: ['logout pannu', 'signout pannu'],
      },
    },
    naturalResponse: {
      en: 'Signing you out.',
      ta: 'சரி, கணக்கிலிருந்து வெளியேறுகிறேன்.',
    },
  },

  // 33. CLEAR_PROBLEM_DESCRIPTION
  {
    id: 'CLEAR_PROBLEM_DESCRIPTION',
    category: 'button_action',
    role: 'customer',
    description: {
      en: 'Clear problem description notes',
      ta: 'பிரச்சனை குறிப்புகளை அழிக்கவும்',
    },
    semantic: {
      intentVerbs: {
        en: ['clear', 'erase', 'reset'],
        ta: ['அழி', 'கிளியர் செய்'],
        tanglish: ['clear pannu', 'erase pannu'],
      },
      targetNouns: {
        en: ['notes', 'problem', 'description', 'issue notes'],
        ta: ['குறிப்புகள்', 'விவரங்கள்'],
        tanglish: ['notes', 'description'],
      },
      phrases: {
        en: ['clear notes', 'clear description', 'clear problem description', 'reset notes'],
        ta: ['நோட்ஸ் கிளியர்', 'விவரங்களை அழி', 'குறிப்புகளை அழி', 'கிளியர் பண்ணு'],
        tanglish: ['notes clear pannu', 'clear notes'],
      },
    },
    contextual: {
      relevantRoutes: ['/customer/book'],
    },
    naturalResponse: {
      en: 'Cleared problem notes.',
      ta: 'பிரச்சனை குறிப்புகள் அழிக்கப்பட்டன.',
    },
  },

  // 34. REMOVE_LAST_SENTENCE
  {
    id: 'REMOVE_LAST_SENTENCE',
    category: 'button_action',
    role: 'customer',
    description: {
      en: 'Remove last sentence from problem description notes',
      ta: 'கடைசி வரியை குறிப்புகளிலிருந்து நீக்கவும்',
    },
    semantic: {
      intentVerbs: {
        en: ['remove', 'delete', 'drop'],
        ta: ['நீக்கு', 'அழி'],
        tanglish: ['remove pannu', 'delete pannu'],
      },
      targetNouns: {
        en: ['last sentence', 'last line', 'last word'],
        ta: ['கடைசி வரி', 'கடைசி வாக்கியம்'],
        tanglish: ['last line', 'last sentence'],
      },
      phrases: {
        en: ['remove last sentence', 'delete last line', 'remove last line', 'delete last sentence'],
        ta: ['கடைசி வரியை நீக்கு', 'கடைசி வரியை அழி', 'கடைசி வாக்கியத்தை நீக்கு'],
        tanglish: ['last sentence remove pannu', 'last line delete pannu'],
      },
    },
    contextual: {
      relevantRoutes: ['/customer/book'],
    },
    naturalResponse: {
      en: 'Removed last sentence from problem notes.',
      ta: 'குறிப்புகளிலிருந்து கடைசி வரி நீக்கப்பட்டது.',
    },
  },
];

