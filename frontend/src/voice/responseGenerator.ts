import { ParsedVoiceResult } from './intentParser';
import { ConversationalResponse, LanguageContextState, ConversationContext } from '../types/voice';
import { detectLanguage } from './entityExtractor';
import { ACTION_REGISTRY } from './actionRegistry';

export { detectLanguage };

/**
 * Generates natural, human-like responses strictly in proper Tamil script or English.
 * Eliminates all Romanized/Tanglish output strings per NEXDO language policy.
 * When a user speaks in spoken/romanized Tamil, NEXDO normalizes the response to authentic Tamil script.
 */
export function generateHumanResponse(
  parsed: ParsedVoiceResult,
  context?: ConversationContext,
  _userLanguagePreference: string = 'ta'
): {
  response: ConversationalResponse;
  languageState: LanguageContextState;
} {
  const detected = detectLanguage(parsed.rawText, context?.conversationLanguage);
  let langCode: 'ta' | 'en' = detected.code;

  let replyText = '';
  let actionSummary = '';

  const need = parsed.serviceNeed;
  const entities = parsed.extractedEntities;
  const canonicalService = parsed.canonicalService || need?.canonicalService || 'GENERAL_HOME_MAINTENANCE';

  // 1. Low confidence utterance -> Ask short clarification
  if (detected.confidence < 0.6 && !parsed.actionType) {
    replyText = langCode === 'ta'
      ? 'தமிழிலா அல்லது ஆங்கிலத்திலா தொடர விரும்புகிறீர்கள்?'
      : 'Would you like to continue in Tamil or English?';
    actionSummary = langCode === 'ta' ? 'மொழி தெளிவுபடுத்தல்' : 'Language Clarification';
  }
  // 2. EXPRESS_NEED intent
  else if (parsed.actionType === 'EXPRESS_NEED' && need) {
    if (need.clarificationNeeded || entities?.clarificationNeeded) {
      if (langCode === 'ta') {
        replyText = 'சரி. என்ன சேவை தேவைப்படுகிறது? ஏசி, எலக்ட்ரிக்கல், பிளம்பிங் அல்லது வேறேதும் வேலையா?';
        actionSummary = 'விளக்கம் தேவை';
      } else {
        replyText = 'Sure. What service do you need? AC, electrical, plumbing, or something else?';
        actionSummary = 'Need Clarification';
      }
    } else {
      const timeDisplay = entities?.timeDisplay;
      const dateStr = entities?.date;
      const urgency = entities?.urgency;
      const hasTime = Boolean(timeDisplay || urgency === 'URGENT' || dateStr);

      let enTime = '';
      let taTime = '';

      if (hasTime) {
        if (urgency === 'URGENT' || (timeDisplay && timeDisplay.includes('45 Minutes'))) {
          enTime = 'urgently within 45 minutes';
          taTime = 'உடனே 45 நிமிடங்களுக்குள்';
        } else if (/tomorrow\s*evening/i.test(parsed.rawText)) {
          enTime = 'tomorrow evening';
          taTime = 'நாளை மாலை';
        } else if (/today\s*evening/i.test(parsed.rawText)) {
          enTime = 'today evening';
          taTime = 'இன்று மாலை';
        } else if (timeDisplay && (timeDisplay.includes('PM') || timeDisplay.includes('AM'))) {
          const timeOnly = timeDisplay.replace(/^(Today|Tomorrow)\s*·\s*/i, '').trim();
          const hourMatch = timeOnly.match(/^(\d+)(?::\d+)?\s*(AM|PM)/i);
          const hourNum = hourMatch ? hourMatch[1] : '6';

          const datePrefixEn = dateStr === 'today' ? 'today ' : dateStr === 'tomorrow' ? 'tomorrow ' : '';
          const datePrefixTa = dateStr === 'today' ? 'இன்று ' : dateStr === 'tomorrow' ? 'நாளை ' : '';

          if (/evening|மாலை/i.test(parsed.rawText)) {
            enTime = `${datePrefixEn}evening`.trim();
            taTime = `${datePrefixTa}மாலை`.trim();
          } else if (/morning|காலை/i.test(parsed.rawText)) {
            enTime = `${datePrefixEn}morning`.trim();
            taTime = `${datePrefixTa}காலை`.trim();
          } else {
            enTime = `${datePrefixEn}at ${timeOnly}`.trim();
            taTime = `${datePrefixTa}${hourNum} மணிக்கு`.trim();
          }
        } else if (dateStr) {
          const dLabel = dateStr === 'today' ? 'today' : dateStr === 'tomorrow' ? 'tomorrow' : dateStr;
          enTime = dLabel;
          taTime = dateStr === 'today' ? 'இன்று' : dateStr === 'tomorrow' ? 'நாளை' : `${dateStr}-க்கு`;
        } else if (timeDisplay) {
          enTime = timeDisplay;
          taTime = `${timeDisplay}-க்கு`;
        }
      }

      switch (canonicalService) {
        case 'TV_REPAIR':
          if (hasTime) {
            replyText = langCode === 'ta'
              ? `சரி, உங்களுக்கு ${taTime} டிவி பழுது சரி செய்ய technician வேண்டும். நான் அருகிலுள்ள technician-களை காட்டுகிறேன்.`
              : `Sure. I'll show you available TV repair technicians for ${enTime}.`;
          } else {
            replyText = langCode === 'ta'
              ? 'சரி, உங்களுக்கு டிவி பழுது சரி செய்ய technician வேண்டும். நான் அருகிலுள்ள technician-களை காட்டுகிறேன்.'
              : "Sure. I'll show you available TV repair technicians.";
          }
          actionSummary = langCode === 'ta' ? 'தேவை: டிவி பழுது' : 'Need: TV Repair';
          break;

        case 'AC_REPAIR':
          if (hasTime) {
            replyText = langCode === 'ta'
              ? `சரி, உங்களுக்கு ${taTime} AC repair வேண்டும். நான் அருகிலுள்ள technician-களை காட்டுகிறேன்.`
              : `Sure. I'll show you available AC technicians for ${enTime}.`;
          } else {
            replyText = langCode === 'ta'
              ? 'சரி, உங்களுக்கு AC repair வேண்டும். நான் அருகிலுள்ள technician-களை காட்டுகிறேன்.'
              : "Sure. You need an AC repair technician. I'll show you the available technicians.";
          }
          actionSummary = langCode === 'ta' ? 'தேவை: ஏசி பழுது' : 'Need: AC Diagnostics & Repair';
          break;

        case 'AC_SERVICE':
          if (hasTime) {
            replyText = langCode === 'ta'
              ? `சரி, உங்களுக்கு ${taTime} AC service வேண்டும். நான் அருகிலுள்ள technician-களை காட்டுகிறேன்.`
              : `Sure. I'll show you available AC technicians for ${enTime}.`;
          } else {
            replyText = langCode === 'ta'
              ? 'சரி, உங்களுக்கு AC service வேண்டும். நான் அருகிலுள்ள technician-களை காட்டுகிறேன்.'
              : "Sure. You need AC service. I'll show you the available technicians.";
          }
          actionSummary = langCode === 'ta' ? 'தேவை: ஏசி சர்வீஸ்' : 'Need: AC Service';
          break;

        case 'AC_INSTALLATION':
          if (hasTime) {
            replyText = langCode === 'ta'
              ? `சரி, உங்களுக்கு ${taTime} AC installation செய்ய technician தேவை. நான் அருகிலுள்ள technician-களை காட்டுகிறேன்.`
              : `Sure. I'll show you available AC installation technicians for ${enTime}.`;
          } else {
            replyText = langCode === 'ta'
              ? 'சரி, உங்களுக்கு AC installation செய்ய technician தேவை. நான் அருகிலுள்ள technician-களை காட்டுகிறேன்.'
              : "Sure. I'll show you available AC installation specialists.";
          }
          actionSummary = langCode === 'ta' ? 'தேவை: ஏசி பொருத்துதல்' : 'Need: AC Installation';
          break;

        case 'ELECTRICIAN':
        case 'ELECTRICAL':
          if (hasTime) {
            replyText = langCode === 'ta'
              ? `சரி, உங்களுக்கு ${taTime} எலக்ட்ரீஷியன் தேவை. நான் அருகிலுள்ள technician-களை காட்டுகிறேன்.`
              : `Sure. I'll show you available electricians for ${enTime}.`;
          } else {
            replyText = langCode === 'ta'
              ? 'சரி, உங்களுக்கு எலக்ட்ரீஷியன் தேவை. நான் அருகிலுள்ள technician-களை காட்டுகிறேன்.'
              : "Sure. I'll show you available electricians nearby.";
          }
          actionSummary = langCode === 'ta' ? 'தேவை: எலக்ட்ரிக்கல் வேலை' : 'Need: Electrician';
          break;

        case 'PLUMBER':
        case 'PLUMBING':
          if (hasTime) {
            replyText = langCode === 'ta'
              ? `சரி, உங்களுக்கு ${taTime} பிளம்பிங் வேலைக்கு technician வேண்டும். நான் அருகிலுள்ள technician-களை காட்டுகிறேன்.`
              : `Sure. I'll show you available plumbers for ${enTime}.`;
          } else {
            replyText = langCode === 'ta'
              ? 'சரி, உங்களுக்கு பிளம்பிங் வேலைக்கு technician வேண்டும். நான் அருகிலுள்ள technician-களை காட்டுகிறேன்.'
              : "Sure. I'll show you available plumbers nearby.";
          }
          actionSummary = langCode === 'ta' ? 'தேவை: பிளம்பிங் வேலை' : 'Need: Plumber';
          break;

        case 'FAN_REPAIR':
          if (hasTime) {
            replyText = langCode === 'ta'
              ? `சரி, உங்களுக்கு ${taTime} ஃபேன் பழுது சரி செய்ய technician வேண்டும். நான் அருகிலுள்ள technician-களை காட்டுகிறேன்.`
              : `Sure. I'll show you available electricians for ceiling fan repair for ${enTime}.`;
          } else {
            replyText = langCode === 'ta'
              ? 'சரி, உங்களுக்கு ஃபேன் பழுது சரி செய்ய technician வேண்டும். நான் அருகிலுள்ள technician-களை காட்டுகிறேன்.'
              : "Sure. I'll show you available electricians for ceiling fan repair.";
          }
          actionSummary = langCode === 'ta' ? 'தேவை: ஃபேன் ரிப்பேர்' : 'Need: Fan Repair';
          break;

        case 'REFRIGERATOR_REPAIR':
          if (hasTime) {
            replyText = langCode === 'ta'
              ? `சரி, ${taTime} பிரிட்ஜ் பழுது சரி செய்ய டெக்னீஷியன் தேவைப்படுகிறது. அருகில் உள்ளவர்களை பார்க்கட்டுமா?`
              : `Sure, you need refrigerator repair ${enTime}. Shall I show you verified appliance technicians nearby?`;
          } else {
            replyText = langCode === 'ta'
              ? 'சரி, உங்கள் பிரிட்ஜ் பழுது சரி செய்ய டெக்னீஷியன் வேண்டும் என்று புரிந்துகொண்டேன். எப்போது வர வேண்டும்?'
              : 'Sure, I understand you need a refrigerator technician. When would you like them to come?';
          }
          actionSummary = langCode === 'ta' ? 'தேவை: பிரிட்ஜ் பழுது' : 'Need: Refrigerator Repair';
          break;

        case 'WASHING_MACHINE_REPAIR':
          if (hasTime) {
            replyText = langCode === 'ta'
              ? `சரி, ${taTime} வாஷிங் மெஷின் பழுது சரி செய்ய டெக்னீஷியன் தேவைப்படுகிறது. அருகில் உள்ளவர்களை பார்க்கட்டுமா?`
              : `Sure, you need washing machine repair ${enTime}. Shall I show you verified appliance technicians?`;
          } else {
            replyText = langCode === 'ta'
              ? 'சரி, வாஷிங் மெஷின் பழுது சரி செய்ய டெக்னீஷியன் தேவைப்படுகிறது. எப்போது வர வேண்டும்?'
              : 'Sure, I understand you need a washing machine technician. When would you like them to visit?';
          }
          actionSummary = langCode === 'ta' ? 'தேவை: வாஷிங் மெஷின்' : 'Need: Washing Machine Repair';
          break;

        case 'MICROWAVE_REPAIR':
          if (hasTime) {
            replyText = langCode === 'ta'
              ? `சரி, ${taTime} மைக்ரோவேவ் ஓவன் பழுது பார்க்க டெக்னீஷியன் தேவைப்படுகிறது. அருகில் உள்ளவர்களை பார்க்கட்டுமா?`
              : `Sure, you need microwave repair ${enTime}. Shall I show you verified appliance technicians?`;
          } else {
            replyText = langCode === 'ta'
              ? 'சரி, மைக்ரோவேவ் ஓவன் பழுது பார்க்க டெக்னீஷியன் எப்போது வர வேண்டும்?'
              : 'Sure, I understand you need microwave repair. When would you like them to visit?';
          }
          actionSummary = langCode === 'ta' ? 'தேவை: மைக்ரோவேவ் பழுது' : 'Need: Microwave Repair';
          break;

        case 'GEYSER_REPAIR':
          if (hasTime) {
            replyText = langCode === 'ta'
              ? `சரி, ${taTime} கீசர் பழுது சரி செய்ய டெக்னீஷியன் தேவைப்படுகிறது. அருகில் உள்ளவர்களை பார்க்கட்டுமா?`
              : `Sure, you need water heater or geyser repair ${enTime}. Shall I show you nearby verified technicians?`;
          } else {
            replyText = langCode === 'ta'
              ? 'சரி, கீசர் பழுது சரி செய்ய டெக்னீஷியன் எப்போது வர வேண்டும்?'
              : 'Sure, I understand you need geyser or water heater repair. When would you like them to visit?';
          }
          actionSummary = langCode === 'ta' ? 'தேவை: கீசர் பழுது' : 'Need: Geyser Repair';
          break;

        case 'BIKE_REPAIR':
          if (hasTime) {
            replyText = langCode === 'ta'
              ? `சரி, ${taTime} டூ-வீலர் சர்வீஸ் தேவைப்படுகிறது. அருகிலுள்ள மெக்கானிக் விவரங்களை பார்க்கட்டுமா?`
              : `Sure, you need two-wheeler service or starting fix ${enTime}. Shall I show nearby mechanics?`;
          } else {
            replyText = langCode === 'ta'
              ? 'சரி, டூ-வீலர் பழுது சரி செய்ய மெக்கானிக் எப்போது வர வேண்டும்?'
              : 'Sure, I understand you need two-wheeler repair. When would you like the mechanic to arrive?';
          }
          actionSummary = langCode === 'ta' ? 'தேவை: டூ-வீலர் சர்வீஸ்' : 'Need: Two-Wheeler Repair';
          break;

        default:
          if (hasTime) {
            replyText = langCode === 'ta'
              ? `சரி, ${taTime} உங்கள் வீட்டுப் பராமரிப்பு வேலைக்கு தகுதியான டெக்னீஷியனை ஏற்பாடு செய்கிறேன்.`
              : `Sure, scheduling a verified technician ${enTime}.`;
          } else {
            replyText = langCode === 'ta'
              ? 'சரி, உங்கள் தேவைக்கான சரியான டெக்னீஷியனைத் தேர்வு செய்ய உதவுகிறேன். எப்போது வர வேண்டும்?'
              : 'Sure, I can help connect you with a verified technician. When would you like them to visit?';
          }
          actionSummary = langCode === 'ta' ? 'தேவை: சேவை' : 'Need: Service';
          break;
      }
    }
  }

  // 3. Critical Action: APPROVE_ESTIMATE
  else if (parsed.actionType === 'APPROVE_ESTIMATE') {
    replyText = langCode === 'ta'
      ? '₹1,100 estimate-ஐ approve செய்யவா?'
      : 'Would you like to approve the ₹1,100 estimate?';
    actionSummary = langCode === 'ta' ? 'மதிப்பீடு ஒப்புதல்' : 'Approve Estimate';
  }

  // 4. Critical Action: CANCEL_BOOKING
  else if (parsed.actionType === 'CANCEL_BOOKING') {
    replyText = langCode === 'ta'
      ? 'இந்த முன்பதிவை ரத்து செய்யவா?'
      : 'Would you like to cancel this service booking?';
    actionSummary = langCode === 'ta' ? 'முன்பதிவு ரத்து' : 'Cancel Booking';
  }

  // 5. Critical Action: CONFIRM_BOOKING
  else if (parsed.actionType === 'CONFIRM_BOOKING') {
    replyText = langCode === 'ta'
      ? 'பதிவு முன்பதிவு உறுதி செய்யப்படுகிறது. டெக்னீஷியன் ஒதுக்கப்படுகிறார்.'
      : 'Booking confirmed. Assigning verified technician now.';
    actionSummary = langCode === 'ta' ? 'பதிவு உறுதி' : 'Booking Confirmed';
  }

  // 6. Critical Action: INITIATE_PAYMENT / PAY_DIAGNOSIS
  else if (parsed.actionType === 'INITIATE_PAYMENT' || parsed.actionType === 'PAY_DIAGNOSIS') {
    replyText = langCode === 'ta'
      ? 'கட்டணப் பக்கத்திற்குச் செல்கிறேன்.'
      : 'Opening payment screen.';
    actionSummary = langCode === 'ta' ? 'கட்டணம் செலுத்து' : 'Proceed to Payment';
  }

  // 7. Role and Language Switching
  else if (parsed.actionType === 'SWITCH_ROLE_CUSTOMER') {
    replyText =
      langCode === 'ta'
        ? 'சரி, வாடிக்கையாளர் பக்கத்திற்கு மாற்றுகிறேன்.'
        : 'Sure, switching to customer mode.';
    actionSummary = 'Customer Mode';
  } else if (parsed.actionType === 'SWITCH_ROLE_TECHNICIAN') {
    replyText =
      langCode === 'ta'
        ? 'சரி, டெக்னீஷியன் பக்கத்திற்கு மாற்றுகிறேன்.'
        : 'Sure, switching to technician mode.';
    actionSummary = 'Technician Mode';
  } else if (parsed.actionType === 'SWITCH_LANGUAGE') {
    if (parsed.payload?.language === 'ta') {
      langCode = 'ta';
      replyText = 'சரி, இனி உங்களுடன் தமிழில் பேசுகிறேன். உங்களுக்கு என்ன உதவி வேண்டும்?';
      actionSummary = 'மொழி: தமிழ்';
    } else {
      langCode = 'en';
      replyText = "Sure, I'll speak with you in English from now on. How can I help you?";
      actionSummary = 'Language: English';
    }
  }

  // 8. Navigation Actions: Exact natural matches for Customer & Technician
  else if (parsed.actionType === 'NAVIGATE_HOME' || parsed.actionType === 'GO_HOME') {
    const isAlreadyHome =
      context?.currentScreen === '/customer' ||
      context?.currentScreen === '/technician' ||
      (typeof window !== 'undefined' &&
        (window.location.pathname === '/customer' ||
          window.location.pathname === '/technician' ||
          window.location.pathname === '/'));

    if (isAlreadyHome) {
      replyText =
        langCode === 'ta'
          ? 'ஏற்கனவே முகப்புப் பக்கத்தில் தான் உள்ளீர்கள். உங்களுக்கு என்ன உதவி வேண்டும்?'
          : 'You are already on the home page. How can I help you today?';
      actionSummary = 'Home';
    } else {
      replyText = langCode === 'ta' ? 'சரி, Home-க்கு போகலாம்.' : "Sure, I'll take you home.";
      actionSummary = 'Home';
    }
  } else if (parsed.actionType === 'NAVIGATE_BOOKINGS' || parsed.actionType === 'GO_BOOKINGS' || parsed.actionType === 'OPEN_BOOKINGS') {
    replyText = langCode === 'ta' ? 'சரி, உங்க bookings-ஐ காட்டுறேன்.' : "Sure, I'll show your bookings.";
    actionSummary = 'Bookings';
  } else if (parsed.actionType === 'NAVIGATE_PROFILE' || parsed.actionType === 'GO_PROFILE' || parsed.actionType === 'OPEN_PROFILE') {
    replyText = langCode === 'ta' ? 'சரி, உங்க profile-ஐ திறக்கிறேன்.' : 'Sure, opening your profile.';
    actionSummary = 'Profile';
  } else if (parsed.actionType === 'NAVIGATE_PROVIDERS') {
    replyText = langCode === 'ta' ? 'சரி, அருகில இருக்கிற technicians-ஐ பார்க்கலாம்.' : "Okay, let's find a nearby technician.";
    actionSummary = 'Technicians';
  } else if (parsed.actionType === 'NAVIGATE_JOBS' || parsed.actionType === 'GO_JOBS' || parsed.actionType === 'SHOW_OPPORTUNITIES') {
    replyText = langCode === 'ta' ? 'சரி, உங்க jobs-ஐ காட்டுறேன்.' : 'Sure, showing your jobs.';
    actionSummary = 'Jobs';
  } else if (parsed.actionType === 'NAVIGATE_EARNINGS' || parsed.actionType === 'GO_EARNINGS' || parsed.actionType === 'SHOW_EARNINGS' || parsed.actionType === 'VIEW_EARNINGS') {
    replyText = langCode === 'ta' ? 'சரி, உங்க earnings-ஐ காட்டுறேன்.' : 'Sure, opening your earnings.';
    actionSummary = 'Earnings';
  } else if (parsed.actionType === 'NAVIGATE_SUBSCRIPTION' || parsed.actionType === 'GO_SUBSCRIPTION' || parsed.actionType === 'CHECK_SUBSCRIPTION') {
    replyText = langCode === 'ta' ? 'சரி, subscription விவரங்களை திறக்கிறேன்.' : 'Sure, opening subscription.';
    actionSummary = 'Subscription';
  } else if (parsed.actionType === 'NAVIGATE_CAPABILITIES' || parsed.actionType === 'GO_AVAILABILITY') {
    replyText = langCode === 'ta' ? 'சரி, உங்க திறன்களை திறக்கிறேன்.' : 'Sure, opening your capabilities.';
    actionSummary = 'Capabilities';
  } else if (parsed.actionType === 'NAVIGATE_BACK' || parsed.actionType === 'GO_BACK' || parsed.actionType === 'BACK') {
    replyText = langCode === 'ta' ? 'சரி, பின்னாடி போகலாம்.' : 'Sure, going back.';
    actionSummary = 'Back';
  } else if (parsed.actionType === 'NAVIGATE_EXPRESS_NEED') {
    replyText = langCode === 'ta' ? 'சரி, உங்கள் சேவைத் தேவையை சொல்லுங்கள்.' : 'Sure, express your service need.';
    actionSummary = 'Express Need';
  } else if (parsed.actionType === 'GO_SUPPORT' || parsed.actionType === 'OPEN_HELP') {
    replyText = langCode === 'ta' ? 'உதவி மையத்தைத் திறக்கிறேன்.' : 'Opening help center.';
    actionSummary = 'Help';
  }

  // 8. Tracking & Provider Selection
  else if (parsed.actionType === 'CHECK_TECHNICIAN_LOCATION') {
    const proName = context?.activeBooking?.technicianName;
    replyText = langCode === 'ta'
      ? (proName ? `டெக்னீஷியன் ${proName} வந்து கொண்டிருக்கிறார். வரைபடத்தில் நேரலையாக பார்க்கலாம்.` : 'டெக்னீஷியன் வரும் பாதையை வரைபடத்தில் திறக்கிறேன்.')
      : (proName ? `Technician ${proName} is en route. Opening live tracking map.` : 'Tracking your technician location on the live map.');
    actionSummary = langCode === 'ta' ? 'நேரலை கண்காணிப்பு' : 'Live Tracking';
  } else if (parsed.actionType === 'SHOW_ALTERNATIVES') {
    replyText = langCode === 'ta' ? 'சரி, பிற verified டெக்னீஷியன்களை உங்களுக்கு காண்பிக்கிறேன்.' : 'Showing alternative verified technicians nearby.';
    actionSummary = langCode === 'ta' ? 'பிற டெக்னீஷியன்கள்' : 'Alternatives';
  } else if (parsed.actionType === 'SELECT_PROVIDER' || parsed.actionType === 'SELECT_TECHNICIAN') {
    const idx = (parsed.payload?.index ?? 0) + 1;
    const providerName = context?.visibleProviders?.[parsed.payload?.index ?? 0]?.name;
    replyText = langCode === 'ta'
      ? (providerName ? `சரி, டெக்னீஷியன் ${providerName}-ஐ தேர்வு செய்துள்ளேன்.` : `சரி, ${idx}-வது டெக்னீஷியனை தேர்வு செய்துள்ளேன்.`)
      : (providerName ? `Selected ${providerName} for your service.` : `Selected technician #${idx}.`);
    actionSummary = langCode === 'ta' ? 'டெக்னீஷியன் தேர்வு' : 'Selected Pro';
  } else if (parsed.actionType === 'ACCEPT_REQUEST') {
    const idx = (parsed.payload?.index ?? 0) + 1;
    replyText = langCode === 'ta'
      ? `சரி, ${idx}-வது வாடிக்கையாளர் வேலையை ஏற்றுக்கொண்டீர்கள்.`
      : `Accepted job opportunity #${idx}. Navigating to active job.`;
    actionSummary = langCode === 'ta' ? 'வேலை ஏற்றுக்கொள்ளப்பட்டது' : 'Job Accepted';
  } else if (parsed.actionType === 'REJECT_REQUEST') {
    replyText = langCode === 'ta' ? 'சரி, இந்த வேலை வாய்ப்பு தவிர்க்கப்பட்டது.' : 'Passed on this job request.';
    actionSummary = langCode === 'ta' ? 'தவிர்க்கப்பட்டது' : 'Request Passed';
  } else if (parsed.actionType === 'SET_AVAILABILITY' || parsed.actionType === 'GO_ONLINE' || parsed.actionType === 'GO_OFFLINE') {
    const isOnline = parsed.actionType === 'GO_ONLINE' ? true : parsed.actionType === 'GO_OFFLINE' ? false : (parsed.payload?.isOnline ?? true);
    replyText = langCode === 'ta'
      ? (isOnline ? 'நீங்கள் இப்போது ஆன்லைனில் உள்ளீர்கள். புதிய வேலை வாய்ப்புகள் அறிவிக்கப்படும்.' : 'நீங்கள் இப்போது ஆஃப்லைனில் உள்ளீர்கள்.')
      : (isOnline ? 'You are now online and available for nearby service jobs.' : 'You are now offline. Requests paused.');
    actionSummary = isOnline ? (langCode === 'ta' ? 'ஆன்லைன்' : 'Online') : (langCode === 'ta' ? 'ஆஃப்லைன்' : 'Offline');
  }

  // 9. Check ACTION_REGISTRY for any additional registered actions (e.g. START_WORK, MARK_ARRIVED, MARK_ON_THE_WAY, VIEW_TECHNICIAN_PROFILE)
  else if (ACTION_REGISTRY.some((a) => a.id === parsed.actionType)) {
    const registryAction = ACTION_REGISTRY.find((a) => a.id === parsed.actionType)!;
    replyText = registryAction.naturalResponse[langCode];
    actionSummary = langCode === 'ta' ? registryAction.description.ta : registryAction.description.en;
  }

  // 10. Generic Fallback
  else {
    replyText = langCode === 'ta'
      ? 'மன்னிக்கவும், நீங்கள் என்ன செய்யணும்னு இன்னொரு முறை சொல்லுங்க.'
      : "Sorry, I didn't quite understand. Could you say that again?";
    actionSummary = parsed.actionType || 'Clarification';
  }

  // Determine optimal TTS voice locale
  const ttsLanguage = langCode === 'ta' ? 'ta-IN' : 'en-IN';

  const languageState: LanguageContextState = {
    detectedLanguage: langCode,
    conversationLanguage: langCode,
    preferredLanguage: langCode,
    responseLanguage: langCode,
    ttsLanguage,
    languageConfidence: detected.confidence,
  };

  return {
    response: {
      text: replyText,
      language: langCode,
      actionSummary,
      audioCue: 'success',
    },
    languageState,
  };
}
