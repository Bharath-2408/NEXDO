import { CanonicalActionType } from '../types/actions';
import { ServiceNeed } from '../types/customer';
import { ConversationContext } from '../types/voice';
import { CanonicalServiceType, CANONICAL_SERVICES } from './taxonomy';
import { extractEntitiesAndIntent, ExtractedEntities } from './entityExtractor';
import { resolveSemanticIntent } from './semanticResolver';

export interface ParsedVoiceResult {
  actionType: CanonicalActionType;
  payload?: any;
  serviceNeed?: ServiceNeed;
  rawText: string;
  matchedCategory?: string;
  confidence: number;
  canonicalService?: CanonicalServiceType;
  extractedEntities?: ExtractedEntities;
}

export function parseVoiceInput(input: string, context?: ConversationContext): ParsedVoiceResult {
  // 0. Natural Language Semantic Intent Resolution (Action Registry)
  const semantic = resolveSemanticIntent(input, {
    role: context?.role,
    currentScreen: context?.currentScreen,
    currentPath: context?.currentScreen,
    conversationLanguage: context?.conversationLanguage,
    visibleProviders: context?.visibleProviders,
    visibleOpportunities: context?.visibleOpportunities,
    activeBooking: context?.activeBooking,
    pendingConfirmationAction: (context as any)?.pendingConfirmationAction,
  });

  if (semantic.confidence >= 0.65 && semantic.actionType !== 'EXPRESS_NEED') {
    return {
      actionType: semantic.actionType,
      payload: semantic.payload,
      rawText: input,
      confidence: semantic.confidence,
      matchedCategory: semantic.actionType,
    };
  }

  const text = input.trim().toLowerCase();

  // 1. Critical Booking, Estimate & Payment Management Intents
  if (/(?:(?:₹|rs\.?|rupees?)?\s*1,?100\s*)?estimate\s*(approve|accept|seri|confirm)|approve\s*estimate|மதிப்பீட்டை\s*ஏற்கவும்|estimate\s*approve\s*pannu(nga)?/i.test(text)) {
    return {
      actionType: 'APPROVE_ESTIMATE',
      rawText: input,
      confidence: 0.98,
      payload: { amount: 1100, bookingId: context?.activeBooking?.id }
    };
  }
  if (/(?:cancel\s*booking|booking\s*cancel|indha\s*booking(?:-a)?\s*cancel\s*pannu(nga)?|இந்த\s*booking-?ஐ\s*cancel\s*பண்ணு|இந்த\s*முன்பதிவை\s*ரத்து\s*செய்|ரத்து\s*செய்)/i.test(text)) {
    return {
      actionType: 'CANCEL_BOOKING',
      rawText: input,
      confidence: 0.98,
      payload: { bookingId: context?.activeBooking?.id }
    };
  }
  if (/booking\s*(reserve|confirm)|reserve\s*booking|confirm\s*booking|urudhi\s*sei|reserve\s*pannu(nga)?/i.test(text)) {
    return {
      actionType: 'CONFIRM_BOOKING',
      rawText: input,
      confidence: 0.98,
      payload: { bookingId: context?.activeBooking?.id }
    };
  }
  if (/(?:(?:₹|rs\.?|rupees?)?\s*1,?100\s*)?pay|make\s*payment|kattanam\s*seluthu|panam\s*kudu|பணம்\s*செலுத்து|gpay|upi\s*pay/i.test(text)) {
    return {
      actionType: 'INITIATE_PAYMENT',
      rawText: input,
      confidence: 0.96,
      payload: { bookingId: context?.activeBooking?.id }
    };
  }

  // 2. Technician Tracking & Location Inquiry
  if (/technician\s*(enga|where|eppoppo)|track\s*technician|location\s*(kaatu|enga)|enga\s*irukkaru|where\s*is\s*(the\s*)?technician/i.test(text)) {
    return {
      actionType: 'CHECK_TECHNICIAN_LOCATION',
      rawText: input,
      confidence: 0.96,
      payload: { bookingId: context?.activeBooking?.id }
    };
  }

  // 3. Alternative Provider Request
  if (/another\s*technician|veru\s*technician|vera\s*aalu|alternatives?|adutha\s*technician|other\s*technician/i.test(text)) {
    return {
      actionType: 'SHOW_ALTERNATIVES',
      rawText: input,
      confidence: 0.95
    };
  }

  // 4. Provider Selection by Ordinal / Reference
  if (/first\s*one\s*select|muthal\s*(technician|one|aalu)|choose\s*first|select\s*first/i.test(text)) {
    return {
      actionType: 'SELECT_PROVIDER',
      payload: { index: 0 },
      rawText: input,
      confidence: 0.95,
      extractedEntities: {
        service: 'Selected Provider #1',
        canonicalService: 'GENERAL_HOME_MAINTENANCE',
        serviceCategory: 'General Repair',
        urgency: 'SCHEDULED',
        language: 'en',
        confidence: 'HIGH',
        confidenceScore: 0.95,
      }
    };
  }
  if (/second\s*one\s*select|irandavathu\s*(technician|one|aalu)|choose\s*second|select\s*second/i.test(text)) {
    return {
      actionType: 'SELECT_PROVIDER',
      payload: { index: 1 },
      rawText: input,
      confidence: 0.95,
      extractedEntities: {
        service: 'Selected Provider #2',
        canonicalService: 'GENERAL_HOME_MAINTENANCE',
        serviceCategory: 'General Repair',
        urgency: 'SCHEDULED',
        language: 'en',
        confidence: 'HIGH',
        confidenceScore: 0.95,
      }
    };
  }
  if (/third\s*one\s*select|moondravathu\s*(technician|one|aalu)|choose\s*third|select\s*third/i.test(text)) {
    return {
      actionType: 'SELECT_PROVIDER',
      payload: { index: 2 },
      rawText: input,
      confidence: 0.95,
      extractedEntities: {
        service: 'Selected Provider #3',
        canonicalService: 'GENERAL_HOME_MAINTENANCE',
        serviceCategory: 'General Repair',
        urgency: 'SCHEDULED',
        language: 'en',
        confidence: 'HIGH',
        confidenceScore: 0.95,
      }
    };
  }

  // 5. Technician Opportunity Accept / Reject
  if (/first\s*job\s*accept|accept\s*first\s*job|muthal\s*request\s*accept|first\s*request\s*accept|accept\s*request/i.test(text)) {
    return {
      actionType: 'ACCEPT_REQUEST',
      payload: { index: 0 },
      rawText: input,
      confidence: 0.95,
    };
  }
  if (/second\s*job\s*accept|accept\s*second\s*job|irandavathu\s*request\s*accept/i.test(text)) {
    return {
      actionType: 'ACCEPT_REQUEST',
      payload: { index: 1 },
      rawText: input,
      confidence: 0.95,
    };
  }
  if (/reject\s*(request|job)|pass\s*(request|job)|vendaam|reject\s*pannu/i.test(text)) {
    return {
      actionType: 'REJECT_REQUEST',
      payload: { index: 0 },
      rawText: input,
      confidence: 0.94,
    };
  }

  // 6. Technician Availability Toggle
  if (/go\s*online|online\s*po|online\s*aagu|start\s*duty/i.test(text)) {
    return {
      actionType: 'SET_AVAILABILITY',
      payload: { isOnline: true },
      rawText: input,
      confidence: 0.95
    };
  }
  if (/go\s*offline|offline\s*po|offline\s*aagu|stop\s*duty/i.test(text)) {
    return {
      actionType: 'SET_AVAILABILITY',
      payload: { isOnline: false },
      rawText: input,
      confidence: 0.95
    };
  }

  // 7. Role and Language Switching
  // Role Switch to Technician Mode
  if (
    /(?:technician\s*(?:mode|பயன்முறை)(?:\s*(?:-?ku|uku))?\s*(?:maathu|change|switch)|switch\s*to\s*technician(?:\s*mode)?|technician-?ah\s*maathu|டெக்னீஷியன்\s*(?:mode|பயன்முறை)(?:\s*மாத்து)?|(?:டெக்னிஷியன்|டெக்னீஷியன்|technician)\s*(?:mode|மோடு|பயன்முறை)(?:\s*(?:-?க்கு|க்கு|-?ku|uku))?\s*(?:போ|மாத்து|மாற்று|change|switch|go))/i.test(
      text
    )
  ) {
    return { actionType: 'SWITCH_ROLE_TECHNICIAN', rawText: input, confidence: 0.98 };
  }

  // Role Switch to Customer Mode
  if (
    /(?:customer\s*(?:mode|பயன்முறை)(?:\s*(?:-?ku|uku))?\s*(?:maathu|change|switch)|switch\s*to\s*customer(?:\s*mode)?|customer-?ah\s*maathu|வாடிக்கையாளர்\s*(?:mode|பயன்முறை)(?:\s*மாத்து)?|(?:கஸ்டமர்|வாடிக்கையாளர்|customer)\s*(?:mode|மோடு|பயன்முறை)(?:\s*(?:-?க்கு|க்கு|-?ku|uku))?\s*(?:போ|மாத்து|மாற்று|change|switch|go))/i.test(
      text
    )
  ) {
    return { actionType: 'SWITCH_ROLE_CUSTOMER', rawText: input, confidence: 0.98 };
  }

  // Language Switch to English
  if (
    /(?:english(?:\s*language)?(?:\s*(?:use\s*(?:pannu|பண்ணு)|pesu|பேசு|la\s*pesu|speak|switch))|switch\s*to\s*english|speak\s*(?:in\s*)?english)/i.test(
      text
    )
  ) {
    return {
      actionType: 'SWITCH_LANGUAGE',
      payload: { language: 'en' },
      rawText: input,
      confidence: 0.98,
    };
  }

  // Language Switch to Tamil
  if (
    /(?:tamil(?:\s*language)?(?:\s*(?:use\s*(?:pannu|பண்ணு)|pesu|பேசு|la\s*pesu|speak|switch))|switch\s*to\s*tamil|speak\s*(?:in\s*)?tamil|தமிழ்ல\s*பேசு|தமிழில்\s*பேசு)/i.test(
      text
    )
  ) {
    return {
      actionType: 'SWITCH_LANGUAGE',
      payload: { language: 'ta' },
      rawText: input,
      confidence: 0.98,
    };
  }

  // 8. Navigation Commands (supports natural multi-lingual variations for Customer & Technician)
  // A. Home Navigation
  if (
    /(?:^|\b)(?:home(?:\s*page)?(?:\s*(?:-?ku|uku))?\s*(?:po|ponga|open|thira)|veet+uk+u(?:\s*(?:-?ku|uku))?\s*po|go\s*(?:to\s*)?(?:the\s*)?home(?:\s*page)?|take\s*me\s*home|வீட்டுக்கு\s*போ|முகப்பு(?:\s*பக்க(?:த்)?து(?:க்)?கு\s*போ|\s*பக்க(?:த்)?தி(?:ற்)?கு\s*போ|\s*பக்கம்\s*திற|\s*போ)?|mukappu(?:\s*(?:-?ku|uku))?\s*po|(?:ஹோம்|முகப்பு)(?:\s*(?:பக்கம்|பேஜ்))?(?:\s*(?:-?க்கு|க்கு))?\s*(?:போ|திற|open|go)|home(?:\s*page)?\s*போ)(?:$|\b)/i.test(
      text
    )
  ) {
    return { actionType: 'NAVIGATE_HOME', rawText: input, confidence: 0.98 };
  }

  // B. Bookings Navigation (Customer)
  if (
    /(?:^|\b)(?:(?:my|en|enga|unga|show|open)?\s*bookings?(?:\s*(?:kaatu|open|thira|show))?|என்\s*bookings\s*காட்டு|bookings\s*காட்டு|என்\s*முன்பதிவுகளை\s*காட்டு|முன்பதிவு(?:கள்)?|sevai\s*pathivu|(?:என்|என்னோட|என்\s*உடைய)?\s*(?:புக்கிங்(?:கள்|ஸ்)?|bookings?|முன்பதிவு(?:கள்)?)\s*(?:பாரு|பார்|காட்டு|திற|open|show))(?:$|\b)/i.test(
      text
    )
  ) {
    return { actionType: 'NAVIGATE_BOOKINGS', rawText: input, confidence: 0.98 };
  }

  // C. Profile Navigation
  if (
    /(?:^|\b)(?:(?:my|en|enga|open|show)?\s*profile(?:\s*(?:open|pannunga|pannu|kaatu|thira|show|po))?|என்\s*profile\s*காட்டு|என்\s*profile\s*திற|சுயவிவரத்தை\s*காட்டு|சுயவிவரம்|suya\s*vivaram|(?:என்|என்னோட)?\s*(?:ப்ரொஃபைல்|ப்ரோஃபைல்|சுயவிவரம்|profile)(?:\s*(?:-?க்கு|க்கு))?\s*(?:போ|காட்டு|திற|பாரு|பார்|open))(?:$|\b)/i.test(
      text
    )
  ) {
    return { actionType: 'NAVIGATE_PROFILE', rawText: input, confidence: 0.98 };
  }

  // D. Providers / Technicians Navigation (Customer)
  if (
    /(?:^|\b)(?:technicians?(?:-?a|-?galai|-?kalai)?\s*(?:kaatu|show|thedu)|show\s*technicians?|find\s*(?:a\s*)?technicians?|search\s*(?:a\s*)?technicians?|டெக்னீஷியன்களை\s*காட்டு|டெக்னீஷியனை\s*காட்டு|டெக்னீஷியன்\s*காட்டு|(?:டெக்னிஷியன்|டெக்னீஷியன்|டெக்னீசியன்)(?:களை|ை)?\s*(?:தேடு|காட்டு|பார்|பாரு|find|show|thedu))(?:$|\b)/i.test(
      text
    )
  ) {
    return { actionType: 'NAVIGATE_PROVIDERS', rawText: input, confidence: 0.98 };
  }

  // E. Jobs Navigation (Technician)
  if (
    /(?:^|\b)(?:(?:my|en|show|open)?\s*jobs?(?:\s*(?:kaatu|open|show|pannu))?|என்\s*jobs\s*காட்டு|jobs\s*காட்டு|வேலைகளை\s*காட்டு|வேலை\s*வாய்ப்பு(?:கள்)?|(?:என்|என்னோட)?\s*(?:ஜாப்ஸ்?|jobs?|வேலைகள்?|வேலை)\s*(?:பாரு|பார்|காட்டு|திற|open|show))(?:$|\b)/i.test(
      text
    )
  ) {
    return { actionType: 'NAVIGATE_JOBS', rawText: input, confidence: 0.98 };
  }

  // F. Earnings Navigation (Technician)
  if (
    /(?:^|\b)(?:(?:my|en|show|open)?\s*earnings?(?:\s*(?:kaatu|open|show|pannu))?|என்\s*earnings\s*காட்டு|earnings\s*காட்டு|வருமானத்தை\s*காட்டு|என்\s*வருமானம்|வருமானம்|varumanam|(?:என்|என்னோட)?\s*(?:வருமானம்|வருமானத்தை|earnings?)\s*(?:பாரு|பார்|காட்டு|திற|open|show))(?:$|\b)/i.test(
      text
    )
  ) {
    return { actionType: 'NAVIGATE_EARNINGS', rawText: input, confidence: 0.98 };
  }

  // G. Subscription Navigation (Technician)
  if (
    /(?:^|\b)(?:subscription(?:\s*(?:open|kaatu|pannu|show))?|access\s*pass(?:\s*(?:kaatu|open))?|சந்தா)(?:$|\b)/i.test(
      text
    )
  ) {
    return { actionType: 'NAVIGATE_SUBSCRIPTION', rawText: input, confidence: 0.98 };
  }

  // H. Capabilities / Skills Navigation (Technician)
  if (
    /(?:^|\b)(?:capabilities(?:\s*(?:kaatu|open|show))?|my\s*skills|skills(?:\s*kaatu)?|திறன்களை\s*காட்டு|availability(?:\s*kaatu)?)(?:$|\b)/i.test(
      text
    )
  ) {
    return { actionType: 'NAVIGATE_CAPABILITIES', rawText: input, confidence: 0.98 };
  }

  // I. Back Navigation
  if (
    /(?:^|\b)(?:back(?:\s*po)?|go\s*back|பின்னாடி\s*போ|திரும்பிப்\s*போ|திரும்பி\s*போ|pinnadi\s*po)(?:$|\b)/i.test(
      text
    )
  ) {
    return { actionType: 'NAVIGATE_BACK', rawText: input, confidence: 0.98 };
  }

  // J. Support & Utilities
  if (/(?:^|\b)(?:help|support|udhavi(?:\s*venum)?|உதவி(?:\s*வேண்டும்)?|உதவி\s*மையம்|help\s*desk)(?:$|\b)/i.test(text)) {
    return { actionType: 'GO_SUPPORT', rawText: input, confidence: 0.96 };
  }
  if (/settings?\s*(open|po|kaatu)|amaivugal/i.test(text)) {
    return { actionType: 'GO_SETTINGS', rawText: input, confidence: 0.95 };
  }
  if (/notifications?\s*(open|kaatu)|arivippu(gal)?/i.test(text)) {
    return { actionType: 'GO_NOTIFICATIONS', rawText: input, confidence: 0.95 };
  }

  // 8. Short Confirmation / Cancellation
  if (/^(?:confirm|yes|aama|sari|ok|done|seri)$/i.test(text)) {
    return { actionType: 'CONFIRM', rawText: input, confidence: 0.92 };
  }
  if (/^(?:cancel|no|vendaam|illai|stop|vendam)$/i.test(text)) {
    return { actionType: 'CANCEL', rawText: input, confidence: 0.92 };
  }

  // 9. Structured Semantic Signal Detection & Entity Extraction (NEED -> UNDERSTAND)
  const entities = extractEntitiesAndIntent(input);

  // Contextual continuation: if the current utterance specifies a time/date but no new service,
  // and we already have an activeNeed in context, merge time into that current request.
  if (
    entities.clarificationNeeded &&
    (entities.time || entities.date || entities.timeDisplay || entities.urgency === 'URGENT') &&
    context?.activeNeed
  ) {
    const parentNeed = context.activeNeed;
    const parentCanonical = (parentNeed.canonicalService || 'GENERAL_HOME_MAINTENANCE') as CanonicalServiceType;

    const mergedTimeDisplay = entities.timeDisplay;
    const mergedDate = entities.date;
    const dateLabel = mergedDate
      ? mergedDate.charAt(0).toUpperCase() + mergedDate.slice(1)
      : undefined;

    let preferredTime: string | undefined = undefined;
    if (entities.urgency === 'URGENT') {
      preferredTime = 'Within 45 Minutes (Urgent)';
    } else if (dateLabel && mergedTimeDisplay) {
      preferredTime = `${dateLabel} · ${mergedTimeDisplay}`;
    } else if (mergedTimeDisplay) {
      preferredTime = mergedTimeDisplay;
    } else if (dateLabel) {
      preferredTime = dateLabel;
    } else {
      preferredTime = parentNeed.preferredTime;
    }

    const mergedEntities: ExtractedEntities = {
      ...entities,
      service: parentNeed.normalizedService,
      canonicalService: parentCanonical,
      serviceCategory: parentNeed.serviceCategory,
      time: entities.time,
      timeDisplay: entities.timeDisplay,
      date: entities.date,
      urgency: entities.urgency === 'URGENT' ? 'URGENT' : 'SCHEDULED',
      confidence: 'HIGH',
      confidenceScore: 0.95,
      clarificationNeeded: false,
      preferredTime,
    };

    const mergedNeed: ServiceNeed = {
      ...parentNeed,
      preferredTime: preferredTime || 'Scheduled',
      urgency: mergedEntities.urgency,
      specificIssue: `${parentNeed.specificIssue || parentNeed.normalizedService} (Time specified: ${input})`,
      clarificationNeeded: false,
    };

    return {
      actionType: 'EXPRESS_NEED',
      serviceNeed: mergedNeed,
      rawText: input,
      matchedCategory: mergedNeed.serviceCategory,
      confidence: 0.95,
      canonicalService: parentCanonical,
      extractedEntities: mergedEntities,
    };
  }

  const serviceInfo = CANONICAL_SERVICES[entities.canonicalService];

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

  const serviceNeed: ServiceNeed = {
    rawTranscript: input,
    normalizedService: entities.service,
    serviceCategory: entities.serviceCategory,
    urgency: entities.urgency,
    preferredTime: preferredTime || (entities.time ? 'Scheduled' : 'Flexible / To be scheduled'),
    location: 'Adyar / Karur Service Zone',
    specificIssue: input,
    estimatedCostRange: serviceInfo.estimatedCostRange,
    clarificationNeeded: entities.clarificationNeeded,
    canonicalService: entities.canonicalService,
  };

  return {
    actionType: 'EXPRESS_NEED',
    serviceNeed,
    rawText: input,
    matchedCategory: entities.serviceCategory,
    confidence: entities.confidenceScore,
    canonicalService: entities.canonicalService,
    extractedEntities: {
      ...entities,
      preferredTime,
    },
  };
}
