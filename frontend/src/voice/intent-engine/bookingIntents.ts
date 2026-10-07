import { CanonicalActionType } from '../../types/actions';

export interface BookingMatchResult {
  matched: boolean;
  actionType?: CanonicalActionType;
  confidence: number;
  providerIndex?: number;
  isNearest?: boolean;
  requiresSelectionClarification?: boolean;
  payload?: any;
  requiresConfirmation?: boolean;
  response?: {
    en: string;
    ta: string;
  };
}

export function matchBookingIntent(
  normalized: string,
  tokens: string[],
  stemmedTokens: string[],
  ordinalIndex: number | undefined,
  context: {
    selectedTechnician?: any;
    visibleProviders?: any[];
    currentPath?: string;
  } = {}
): BookingMatchResult {
  // 0a. Slot Selection
  // Custom slot: Saturday morning 10 AM / சனிக்கிழமை காலை 10 மணி
  if (
    (/\b(saturday|சனி|சனிக்கிழமை)\b/i.test(normalized)) &&
    (/\b(10\s*am|10:00\s*am|10\s*மணி|காலை\s*10|morning\s*10)\b/i.test(normalized) || normalized.includes('10 மணி') || normalized.includes('காலை 10'))
  ) {
    return {
      matched: true,
      actionType: 'SELECT_BOOKING_SLOT',
      confidence: 0.98,
      payload: { slot: 'Saturday · 10:00 AM' },
      response: {
        en: 'Selected appointment window: Saturday at 10:00 AM.',
        ta: 'சனிக்கிழமை காலை 10:00 மணி நேரம் தேர்ந்தெடுக்கப்பட்டது.',
      },
    };
  }

  // Tomorrow at 6 PM / நாளைக்கு மாலை 6 மணிக்கு / நாளைக்கு 6 மணி
  if (
    /\b(6\s*pm|6:00\s*pm|6\s*clock|மாலை\s*6|6\s*மணி|6\s*manikku|6\s*mani)\b/i.test(normalized) ||
    normalized.includes('6 மணி') ||
    normalized.includes('மாலை 6') ||
    normalized.includes('6 மணிக்கு') ||
    (normalized.includes('நாளை') && normalized.includes('6'))
  ) {
    return {
      matched: true,
      actionType: 'SELECT_BOOKING_SLOT',
      confidence: 0.96,
      payload: { slot: 'Tomorrow · 6:00 PM' },
      response: {
        en: 'Selected appointment window: Tomorrow at 6:00 PM.',
        ta: 'நாளை மாலை 6:00 மணி நேரம் தேர்ந்தெடுக்கப்பட்டது.',
      },
    };
  }

  // Tomorrow at 10 AM / நாளை காலை 10 மணி
  if (
    /\b(10\s*am|10:00\s*am|காலை\s*10|10\s*மணி|10\s*manikku|10\s*mani)\b/i.test(normalized) ||
    normalized.includes('10 மணி') ||
    normalized.includes('காலை 10') ||
    normalized.includes('10 மணிக்கு') ||
    (normalized.includes('நாளை') && normalized.includes('10'))
  ) {
    return {
      matched: true,
      actionType: 'SELECT_BOOKING_SLOT',
      confidence: 0.96,
      payload: { slot: 'Tomorrow · 10:00 AM' },
      response: {
        en: 'Selected appointment window: Tomorrow at 10:00 AM.',
        ta: 'நாளை காலை 10:00 மணி நேரம் தேர்ந்தெடுக்கப்பட்டது.',
      },
    };
  }

  // Tomorrow at 2 PM / நாளை மதியம் 2 மணி
  if (
    /\b(2\s*pm|2:00\s*pm|மதியம்\s*2|2\s*மணி|2\s*manikku|2\s*mani)\b/i.test(normalized) ||
    normalized.includes('2 மணி') ||
    normalized.includes('மதியம் 2') ||
    normalized.includes('2 மணிக்கு') ||
    (normalized.includes('நாளை') && normalized.includes('2'))
  ) {
    return {
      matched: true,
      actionType: 'SELECT_BOOKING_SLOT',
      confidence: 0.96,
      payload: { slot: 'Tomorrow · 2:00 PM' },
      response: {
        en: 'Selected appointment window: Tomorrow at 2:00 PM.',
        ta: 'நாளை மதியம் 2:00 மணி நேரம் தேர்ந்தெடுக்கப்பட்டது.',
      },
    };
  }

  // Day after tomorrow / நாளை மறுநாள் 11 AM
  if (
    (/\b(day after tomorrow|11\s*am|11:00\s*am|நாளை\s*மறுநாள்|மறுநாள்)\b/i.test(normalized) &&
      (normalized.includes('11') || normalized.includes('slot') || normalized.includes('day after') || normalized.includes('மறுநாள்')))
  ) {
    return {
      matched: true,
      actionType: 'SELECT_BOOKING_SLOT',
      confidence: 0.96,
      payload: { slot: 'Day After Tomorrow · 11:00 AM' },
      response: {
        en: 'Selected appointment window: Day After Tomorrow at 11:00 AM.',
        ta: 'நாளை மறுநாள் காலை 11:00 மணி நேரம் தேர்ந்தெடுக்கப்பட்டது.',
      },
    };
  }

  // 0b. Service Mode Selection
  const isDiagnosisMode =
    /\b(diagnosis mode|select diagnosis|diagnosis fee|149 fee|149 diagnosis|first option|டயக்னாசிஸ்|டயக்னோசிஸ்|149 ரூபாய்)\b/i.test(
      normalized
    ) || (tokens.includes('diagnosis') && !tokens.includes('submit'));

  if (isDiagnosisMode) {
    return {
      matched: true,
      actionType: 'SELECT_DIAGNOSIS_MODE',
      confidence: 0.96,
      response: {
        en: 'Selected Diagnosis Mode with ₹149 inspection fee.',
        ta: '₹149 பரிசோதனைக் கட்டணத்துடன் டயக்னாசிஸ் முறை தேர்ந்தெடுக்கப்பட்டது.',
      },
    };
  }

  const isDirectServiceMode =
    /\b(direct service|direct repair|service repair|service mode|second option|நேரடி சேவை|டைரக்ட் சர்வீஸ்|நேரடி சர்வீஸ்)\b/i.test(
      normalized
    ) || (tokens.includes('direct') && (tokens.includes('service') || tokens.includes('repair')));

  if (isDirectServiceMode) {
    return {
      matched: true,
      actionType: 'SELECT_DIRECT_SERVICE_MODE',
      confidence: 0.96,
      response: {
        en: 'Selected Direct Service mode with zero upfront diagnosis fee.',
        ta: 'முன்பணக் கட்டணமில்லா நேரடி சேவை முறை தேர்ந்தெடுக்கப்பட்டது.',
      },
    };
  }

  // 0c. Notes manipulation
  const isClearNotes =
    /\b(clear notes|clear problem description|clear description|clear special instructions|நோட்ஸ் கிளியர்|இதை clear|விவரங்களை அழி)\b/i.test(
      normalized
    ) ||
    (tokens.includes('clear') &&
      (tokens.includes('notes') || tokens.includes('problem') || tokens.includes('description') || tokens.includes('instructions')));

  if (isClearNotes) {
    return {
      matched: true,
      actionType: 'CLEAR_PROBLEM_DESCRIPTION',
      confidence: 0.96,
      response: {
        en: 'Cleared problem notes.',
        ta: 'பிரச்சனை குறிப்புகள் அழிக்கப்பட்டன.',
      },
    };
  }

  const isRemoveLastSentence =
    /\b(remove last sentence|delete last sentence|delete last line|remove last line|கடைசி வரியை நீக்கு|கடைசி வரியை அழி)\b/i.test(
      normalized
    );

  if (isRemoveLastSentence) {
    return {
      matched: true,
      actionType: 'REMOVE_LAST_SENTENCE',
      confidence: 0.96,
      response: {
        en: 'Removed last sentence from problem notes.',
        ta: 'குறிப்புகளிலிருந்து கடைசி வரி நீக்கப்பட்டது.',
      },
    };
  }

  // 0d. Payment Method Selection
  const isQrMethod =
    /\b(qr|qr code|nexdo qr|கியூஆர்)\b/i.test(normalized) &&
    !/\b(generate|scan|code data)\b/i.test(normalized);

  if (isQrMethod) {
    return {
      matched: true,
      actionType: 'SELECT_PAYMENT_METHOD',
      confidence: 0.96,
      payload: { method: 'QR' },
      response: {
        en: 'Selected NEXDO QR code payment method.',
        ta: 'NEXDO QR கட்டண முறை தேர்ந்தெடுக்கப்பட்டது.',
      },
    };
  }

  const isUpiMethod =
    /\b(upi|test upi|gpay|google pay|phonepe|paytm|யூபிஐ|யுபிஐ)\b/i.test(normalized);

  if (isUpiMethod) {
    return {
      matched: true,
      actionType: 'SELECT_PAYMENT_METHOD',
      confidence: 0.96,
      payload: { method: 'UPI' },
      response: {
        en: 'Selected Sandbox UPI payment method.',
        ta: 'டெஸ்ட் UPI கட்டண முறை தேர்ந்தெடுக்கப்பட்டது.',
      },
    };
  }

  const isCardMethod =
    /\b(card|test card|credit card|debit card|கார்டு)\b/i.test(normalized);

  if (isCardMethod) {
    return {
      matched: true,
      actionType: 'SELECT_PAYMENT_METHOD',
      confidence: 0.96,
      payload: { method: 'CARD' },
      response: {
        en: 'Selected Sandbox Card payment method.',
        ta: 'டெஸ்ட் கார்டு கட்டண முறை தேர்ந்தெடுக்கப்பட்டது.',
      },
    };
  }

  // 0e. Payment Authorization
  const isAuthorizePayment =
    /\b(pay now|authorize payment|confirm payment|complete payment|pay 149|pay 1100|பணம் செலுத்து|கட்டணம் செலுத்து|pay பண்ணு)\b/i.test(
      normalized
    ) ||
    (tokens.includes('pay') &&
      (tokens.includes('now') || tokens.includes('pannu') || tokens.includes('149') || tokens.includes('1100')));

  if (isAuthorizePayment) {
    return {
      matched: true,
      actionType: 'CONFIRM_PAYMENT',
      confidence: 0.96,
      requiresConfirmation: true,
      response: {
        en: 'Shall I authorize this payment?',
        ta: 'இந்தக் கட்டணத்தை உறுதி செய்து செலுத்தவா?',
      },
    };
  }

  // 1. Cancel Booking
  const hasCancelVerb =
    /\b(cancel|vendaam|abort|drop)\b/i.test(normalized) ||
    tokens.some((t) => ['ரத்து', 'வேண்டாம்', 'கேன்சல்'].includes(t));

  const hasBookingNoun =
    /\b(booking|bookings|appointment|order)\b/i.test(normalized) ||
    tokens.some((t) => ['புக்கிங்', 'புக்கிங்ஸ்', 'முன்பதிவு'].includes(t));

  if (hasCancelVerb && hasBookingNoun) {
    return {
      matched: true,
      actionType: 'CANCEL_BOOKING',
      confidence: 0.95,
      response: {
        en: 'Do you want me to cancel this booking?',
        ta: 'இந்த புக்கிங்கை ரத்து செய்யவா?',
      },
    };
  }

  // 1b. Explicit Confirm Booking Action
  const isExplicitConfirmBooking =
    /\b(confirm booking|booking confirm|reserve booking|submit booking|finalize request)\b/i.test(normalized) ||
    (tokens.includes('confirm') && tokens.includes('booking')) ||
    (tokens.some((t) => ['உறுதி', 'confirm'].includes(t)) && tokens.some((t) => ['புக்கிங்', 'booking', 'முன்பதிவு'].includes(t)));

  if (isExplicitConfirmBooking) {
    return {
      matched: true,
      actionType: 'CONFIRM_BOOKING',
      confidence: 0.98,
      response: {
        en: 'Booking confirmed. Assigning verified technician now.',
        ta: 'பதிவு உறுதி செய்யப்படுகிறது. டெக்னீஷியன் ஒதுக்கப்படுகிறார்.',
      },
    };
  }

  // 2. Select Nearest Technician
  const isNearestIntent =
    /\b(nearest|nearest one|closest|near me|அருகிலுள்ள|பக்கத்தில்|கிட்டக்க)\b/i.test(normalized);

  if (isNearestIntent && (tokens.includes('technician') || tokens.includes('one') || tokens.includes('காட்டு') || tokens.includes('select') || tokens.includes('தேடு'))) {
    return {
      matched: true,
      actionType: 'SELECT_NEAREST_TECHNICIAN',
      confidence: 0.96,
      providerIndex: 0,
      isNearest: true,
      response: {
        en: 'Selected the nearest verified technician.',
        ta: 'அருகிலுள்ள டெக்னிஷியன் தேர்ந்தெடுக்கப்பட்டார்.',
      },
    };
  }

  // 3. Select First / Second / Third Technician
  if (ordinalIndex !== undefined) {
    const isSelectionVerb =
      /\b(select|choose|pick|book|open|show|தேர்ந்தெடு|புக்|காட்டு)\b/i.test(normalized) ||
      tokens.length <= 4;

    if (isSelectionVerb) {
      const idxTextEn = ordinalIndex === 0 ? 'first' : ordinalIndex === 1 ? 'second' : 'third';
      const idxTextTa = ordinalIndex === 0 ? 'முதல்' : ordinalIndex === 1 ? 'இரண்டாவது' : 'மூன்றாவது';

      return {
        matched: true,
        actionType: 'SELECT_TECHNICIAN',
        confidence: 0.95,
        providerIndex: ordinalIndex,
        response: {
          en: `Selected the ${idxTextEn} technician. Would you like to book him?`,
          ta: `${idxTextTa} டெக்னிஷியன் தேர்ந்தெடுக்கப்பட்டார். இவரை புக் செய்யவா?`,
        },
      };
    }
  }

  // 3b. Explicit Select This Technician without ordinal ("Select this technician", "Indha technician-a select pannu")
  const isSelectThisTech =
    /\b(select this technician|select technician|indha technician.*select|இந்த technician.*select|இந்த டெக்னிஷியனை தேர்ந்தெடு)\b/i.test(
      normalized
    ) ||
    ((tokens.includes('select') || tokens.includes('தேர்ந்தெடு')) &&
      (tokens.includes('technician') || tokens.includes('டெக்னிஷியன்') || tokens.includes('டெக்னிஷியனை')));

  if (isSelectThisTech) {
    return {
      matched: true,
      actionType: 'SELECT_TECHNICIAN',
      confidence: 0.96,
      providerIndex: 0,
      response: {
        en: 'Selected technician. Would you like to book him?',
        ta: 'டெக்னிஷியன் தேர்ந்தெடுக்கப்பட்டார். இவரை புக் செய்யவா?',
      },
    };
  }

  // 3c. Payment Action
  const isPaymentAction =
    /\b(make payment|initiate payment|payment page|pay now|payment open|பணம் செலுத்து|பேமெண்ட்)\b/i.test(normalized) ||
    (tokens.includes('payment') &&
      (tokens.includes('make') || tokens.includes('page') || tokens.includes('open') || tokens.includes('pannu')));

  if (isPaymentAction) {
    return {
      matched: true,
      actionType: 'INITIATE_PAYMENT',
      confidence: 0.96,
      response: {
        en: 'Opening payment and checkout screen.',
        ta: 'கட்டணம் செலுத்தும் பக்கத்தை திறக்கிறேன்.',
      },
    };
  }

  // 4. Booking Request ("Book him", "Book this technician", "இந்த technician-ஐ book பண்ணு", "இவரை book பண்ணலாம்", "avare book pannu")
  const isBookingAction =
    /\b(book him|book this technician|book this person|book technician|book pannu|book pannunga|book pannalam|book panlam|book pannidu|ivara book|avara book|avare book|ivare book|அவரை book|இவரை book|இந்த technician.*book|நான் இவரையே book பண்ணுறேன்)\b/i.test(
      normalized
    ) ||
    (tokens.includes('book') &&
      tokens.some((t) => ['him', 'this', 'ivar', 'ivara', 'avar', 'avara', 'avare', 'indha', 'இவரை', 'அவரை', 'இந்த'].includes(t)));

  if (isBookingAction) {
    if (context.selectedTechnician) {
      const techName = context.selectedTechnician.name || 'technician';
      return {
        matched: true,
        actionType: 'CONFIRM_BOOKING',
        confidence: 0.96,
        response: {
          en: `Sure. Shall I confirm the booking with ${techName}?`,
          ta: `சரி. ${techName}-க்கு புக்கிங்கை உறுதி செய்யவா?`,
        },
      };
    }

    if (context.visibleProviders && context.visibleProviders.length > 0) {
      // Top technician in visible list
      const topTech = context.visibleProviders[0];
      return {
        matched: true,
        actionType: 'SELECT_TECHNICIAN',
        confidence: 0.92,
        providerIndex: 0,
        response: {
          en: `Selected ${topTech.name}. Shall I confirm this booking?`,
          ta: `${topTech.name} தேர்ந்தெடுக்கப்பட்டார். இந்த புக்கிங்கை உறுதி செய்யவா?`,
        },
      };
    }

    // No technician selected and none visible
    return {
      matched: true,
      actionType: 'NAVIGATE_PROVIDERS',
      confidence: 0.85,
      requiresSelectionClarification: true,
      response: {
        en: 'Who would you like to book? Please select a technician first.',
        ta: 'யாரை book செய்ய வேண்டும்? முதலில் technician-ஐ select பண்ணலாம்.',
      },
    };
  }

  // 5. Deictic Profile View ("show his profile", "show their profile")
  const isViewProProfile =
    /\b(his profile|their profile|technician profile|avar profile|ivara pathi|அவர் விவரம்|அவரது சுயவிவரம்)\b/i.test(
      normalized
    );

  if (isViewProProfile) {
    return {
      matched: true,
      actionType: 'VIEW_TECHNICIAN_PROFILE',
      confidence: 0.94,
      providerIndex: 0,
      response: {
        en: "Showing technician's profile and credentials.",
        ta: 'டெக்னிஷியனின் சுயவிவரத்தை காட்டுகிறேன்.',
      },
    };
  }

  return { matched: false, confidence: 0 };
}
