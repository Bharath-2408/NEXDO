import { CanonicalActionType } from '../../types/actions';

export interface NavigationMatchResult {
  matched: boolean;
  actionType?: CanonicalActionType;
  confidence: number;
  destination?: string;
  response?: {
    en: string;
    ta: string;
  };
}

export function matchNavigationIntent(
  normalized: string,
  tokens: string[],
  stemmedTokens: string[],
  role: 'customer' | 'technician' = 'customer',
  currentPath: string = ''
): NavigationMatchResult {
  // 1. Back Navigation
  const hasDestinationNoun = /\b(home|house|veedu|mukappu|bookings|profile|earnings|jobs|ஹோம்|வீடு|முகப்பு|புக்கிங்|வேலை|வருமானம்)\b/i.test(normalized);
  const isBackIntent =
    !hasDestinationNoun &&
    (/\b(back|go back|back po|take me back|pinnadi|pinnadi po|previous page|previous screen)\b/i.test(normalized) ||
      tokens.some((t) => ['பின்னாடி', 'பின்னால்', 'முந்தைய', 'திரும்பு'].includes(t)) ||
      (tokens.includes('back') && (tokens.includes('போ') || tokens.includes('po') || tokens.length <= 2)));

  if (isBackIntent) {
    return {
      matched: true,
      actionType: 'NAVIGATE_BACK',
      confidence: 0.95,
      response: {
        en: 'Sure, going back.',
        ta: 'சரி, பின்னாடி போகலாம்.',
      },
    };
  }

  // 2. Technician Home Explicit Intent
  const isTechHome =
    (/\b(technician home|technician page|technician dashboard|technician side|technician home ku po|technician dashboard kaatu)\b/i.test(normalized) ||
      (tokens.some((t) => ['டெக்னிஷியன்', 'டெக்னீஷியன்'].includes(t)) &&
        tokens.some((t) => ['ஹோம்', 'டேஷ்போர்டு', 'பக்கம்'].includes(t)))) &&
    !/\b(mode|switch|மாத்து|மாற்று)\b/i.test(normalized);

  if (isTechHome) {
    return {
      matched: true,
      actionType: 'NAVIGATE_TECHNICIAN_HOME',
      confidence: 0.98,
      destination: '/technician',
      response: {
        en: 'Opening Technician Dashboard.',
        ta: 'டெக்னிஷியன் முகப்பு பக்கத்திற்கு செல்கிறேன்.',
      },
    };
  }

  // 3. Home Navigation Intent
  const hasHomeNoun =
    /\b(home|homepage|home page|main page|dashboard|start page|house|mukappu|veedu|veetuku|veettuku)\b/i.test(normalized) ||
    tokens.some((t) => ['ஹோம்', 'ஹோம்பேஜ்', 'முகப்பு', 'வீடு'].includes(t)) ||
    stemmedTokens.includes('home') ||
    stemmedTokens.includes('veedu') ||
    stemmedTokens.includes('முகப்பு') ||
    stemmedTokens.includes('ஹோம்');

  const hasHomeVerb =
    /\b(go|open|take me|show|head|visit|navigate|po|ponga|thira|kaatu|poganum|kootitu)\b/i.test(normalized) ||
    tokens.some((t) => ['போ', 'திற', 'காட்டு', 'கூட்டிட்டு'].includes(t)) ||
    stemmedTokens.includes('po') ||
    stemmedTokens.includes('kaatu') ||
    stemmedTokens.includes('kootitu') ||
    tokens.length <= 2;

  if (hasHomeNoun && hasHomeVerb) {
    const dest = role === 'technician' ? '/technician' : '/customer';
    const isAlreadyThere = currentPath === dest || currentPath === `${dest}/`;
    return {
      matched: true,
      actionType: 'NAVIGATE_HOME',
      confidence: 0.96,
      destination: dest,
      response: {
        en: isAlreadyThere ? "You're already on your home page. How can I help you today?" : "Sure, taking you home.",
        ta: isAlreadyThere ? 'ஏற்கனவே முகப்புப் பக்கத்தில் தான் உள்ளீர்கள். உங்களுக்கு என்ன உதவி வேண்டும்?' : 'சரிங்க, ஹோம் பேஜுக்கு போறேன்.',
      },
    };
  }

  // 4. Booking Status & Details Intent
  const isBookingStatusQuery =
    /\b(booking status|status enna|enga irukku|where is my booking|en booking enga|track pro|track technician)\b/i.test(normalized) ||
    (tokens.some((t) => ['புக்கிங்', 'booking'].includes(t)) &&
      tokens.some((t) => ['ஸ்டேட்டஸ்', 'நிலை', 'எங்கே', 'எங்க', 'status', 'enga'].includes(t)));

  if (isBookingStatusQuery) {
    return {
      matched: true,
      actionType: 'CHECK_BOOKING_STATUS',
      confidence: 0.95,
      destination: '/customer/bookings',
      response: {
        en: 'Checking your current booking status.',
        ta: 'உங்கள் புக்கிங் நிலையை பார்க்கிறேன்.',
      },
    };
  }

  // 5. Bookings / Jobs Intent
  const hasBookingNoun =
    /\b(booking|bookings|my bookings|appointments?|orders?|booking history|history|munpathivu)\b/i.test(normalized) ||
    tokens.some((t) => ['புக்கிங்', 'புக்கிங்ஸ்', 'முன்பதிவு', 'முன்பதிவுகள்'].includes(t)) ||
    stemmedTokens.includes('booking') ||
    stemmedTokens.includes('புக்கிங்');

  if (hasBookingNoun) {
    if (role === 'technician') {
      return {
        matched: true,
        actionType: 'NAVIGATE_JOBS',
        confidence: 0.94,
        destination: '/technician/jobs',
        response: {
          en: 'Sure, opening your jobs.',
          ta: 'சரி, உங்கள் ஜாப்ஸை காட்டுறேன்.',
        },
      };
    }
    return {
      matched: true,
      actionType: 'NAVIGATE_BOOKINGS',
      confidence: 0.95,
      destination: '/customer/bookings',
      response: {
        en: 'Sure, taking you to your bookings.',
        ta: 'சரி, உங்கள் புக்கிங்ஸை காட்டுறேன்.',
      },
    };
  }

  const hasJobsNoun =
    /\b(jobs?|my jobs|available jobs|assigned jobs|work orders?|tasks?)\b/i.test(normalized) ||
    tokens.some((t) => ['வேலை', 'வேலைகள்', 'ஜாப்ஸ்'].includes(t)) ||
    stemmedTokens.includes('job') ||
    stemmedTokens.includes('velai');

  if (hasJobsNoun && role === 'technician') {
    return {
      matched: true,
      actionType: 'NAVIGATE_JOBS',
      confidence: 0.94,
      destination: '/technician/jobs',
      response: {
        en: 'Sure, opening your jobs.',
        ta: 'சரி, உங்கள் ஜாப்ஸை காட்டுறேன்.',
      },
    };
  }

  // 6. Profile Intent
  const hasProfileNoun =
    /\b(profile|my profile|account|my account|settings|suyavivaram)\b/i.test(normalized) ||
    tokens.some((t) => ['சுயவிவரம்', 'ப்ரொஃபைல்', 'ப்ரோஃபைல்', 'கணக்கு'].includes(t)) ||
    stemmedTokens.includes('profile') ||
    stemmedTokens.includes('சுயவிவரம்');

  const isThirdPerson = /\b(his|their|this|avar|avara|ivar|ivara|ivaroada)\b/i.test(normalized) ||
    tokens.some((t) => ['இவர்', 'இவரை', 'அவர்', 'அவரை', 'இவரோட'].includes(t));

  if (hasProfileNoun && !isThirdPerson) {
    const dest = role === 'technician' ? '/technician/profile' : '/customer/profile';
    return {
      matched: true,
      actionType: 'NAVIGATE_PROFILE',
      confidence: 0.94,
      destination: dest,
      response: {
        en: 'Opening your profile.',
        ta: 'சரி, சுயவிவரப் பக்கத்தைத் திறக்கிறேன்.',
      },
    };
  }

  // 7. Access Pass Intent (Technician)
  const isAccessPassIntent =
    /\b(access pass|subscription|pass|passes|pass kaatu|subscription kaatu|paas)\b/i.test(normalized) ||
    tokens.some((t) => ['பாஸ்', 'சப்ஸ்கிரிப்ஷன்'].includes(t));

  if (isAccessPassIntent && role === 'technician') {
    return {
      matched: true,
      actionType: 'OPEN_ACCESS_PASS',
      confidence: 0.95,
      destination: '/technician/subscription',
      response: {
        en: 'Showing Technician Access Passes.',
        ta: 'டெக்னிஷியன் அணுகல் பாஸ்களை காட்டுகிறேன்.',
      },
    };
  }

  // 8. Notifications Intent
  const isNotificationsIntent =
    /\b(notification|notifications|alerts|messages|arivippugal)\b/i.test(normalized) ||
    tokens.some((t) => ['அறிவிப்புகள்', 'நோட்டிபிகேஷன்'].includes(t));

  if (isNotificationsIntent) {
    return {
      matched: true,
      actionType: 'OPEN_NOTIFICATIONS',
      confidence: 0.93,
      response: {
        en: 'Checking your notifications.',
        ta: 'உங்கள் அறிவிப்புகளை பார்க்கிறேன்.',
      },
    };
  }

  // 9. Next & Previous
  if (/\b(next|adutha|aduthu|அடுத்த|அடுத்தது)\b/i.test(normalized) && tokens.length <= 3) {
    return {
      matched: true,
      actionType: 'NEXT',
      confidence: 0.92,
      response: {
        en: 'Moving to the next item.',
        ta: 'அடுத்த பகுதிக்கு செல்கிறேன்.',
      },
    };
  }

  if (/\b(previous|munthaiya|முந்தைய|முந்தையது)\b/i.test(normalized) && tokens.length <= 3) {
    return {
      matched: true,
      actionType: 'PREVIOUS',
      confidence: 0.92,
      response: {
        en: 'Moving to the previous item.',
        ta: 'முந்தைய பகுதிக்கு செல்கிறேன்.',
      },
    };
  }

  return { matched: false, confidence: 0 };
}
