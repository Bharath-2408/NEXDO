// ============================================================================
// VOICE CONTEXT ENGINE
// Multi-turn Conversational Context, Natural Intent Extraction, and Action Router
// Backed by database sessions (conversation_sessions, conversation_messages)
// ============================================================================

import { dbStore } from '../database/store';
import {
  ConversationSessionRecord,
  ConversationMessageRecord,
  VoiceIntentRecord,
} from '../database/types';
import { TechnicianMatchingService } from './technicianMatchingService';
import { BookingService } from './bookingService';
import { resolveSemanticIntent } from '../../voice/semanticResolver';
import { detectLanguage } from '../../voice/entityExtractor';

export interface VoiceInterpretRequest {
  text: string;
  sessionToken?: string;
  role?: 'customer' | 'technician';
  currentRoute?: string;
  conversationLanguage?: string;
  context?: Record<string, any>;
}

export interface VoiceInterpretResponse {
  intent: string;
  action: string;
  language: 'ta' | 'en';
  message: string;
  requires_confirmation: boolean;
  navigation_target?: string;
  entities: Record<string, any>;
  data?: Record<string, any>;
}

export class VoiceContextEngine {
  /**
   * Retrieves or provisions an active conversation session
   */
  public static getOrCreateSession(
    token?: string,
    role: 'customer' | 'technician' = 'customer',
    currentRoute: string = '/customer',
    initialLanguage: 'ta' | 'en' = 'en'
  ): ConversationSessionRecord {
    const sessionToken = token || `sess_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    let session = Array.from(dbStore.conversationSessions.values()).find(
      (s) => s.session_token === sessionToken
    );

    if (!session) {
      session = {
        id: `cs_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        session_token: sessionToken,
        role,
        language: initialLanguage,
        current_route: currentRoute,
        state_metadata: {},
        last_active_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      dbStore.conversationSessions.set(session.id, session);
    } else {
      session.role = role;
      session.current_route = currentRoute;
      session.last_active_at = new Date().toISOString();
    }

    return session;
  }

  /**
   * Main interpretation entry point
   */
  public static async interpret(
    request: VoiceInterpretRequest
  ): Promise<VoiceInterpretResponse> {
    const rawText = (request.text || '').trim();
    const role =
      request.role ||
      (request.currentRoute?.startsWith('/technician') ? 'technician' : 'customer');
    const currentRoute = request.currentRoute || (role === 'technician' ? '/technician' : '/customer');
    const requestedLang = (request.conversationLanguage as 'ta' | 'en') || (request.context?.conversationLanguage as 'ta' | 'en');
    const session = this.getOrCreateSession(request.sessionToken, role, currentRoute, requestedLang || 'en');

    let lang: 'ta' | 'en';
    if (requestedLang === 'ta') {
      const isExplicitSwitchEn = /(?:switch\s*to\s*english|speak\s*(?:in\s*)?english|english-?la\s*pesu|speak\s*english|ஆங்கிலத்திற்கு\s*மாறு|ஆங்கிலத்தில்\s*பேசு|^english$)/i.test(rawText.trim());
      lang = isExplicitSwitchEn ? 'en' : 'ta';
    } else if (requestedLang === 'en') {
      const isExplicitSwitchTa = /(?:switch\s*to\s*tamil|speak\s*(?:in\s*)?tamil|tamil-?la\s*pesu|speak\s*tamil|தமிழுக்கு\s*மாறு|தமிழில்\s*பேசு|^தமிழ்$)/i.test(rawText.trim());
      lang = isExplicitSwitchTa ? 'ta' : 'en';
    } else {
      const langDetect = detectLanguage(rawText, 'en');
      lang = langDetect.code === 'ta' ? 'ta' : 'en';
    }
    session.language = lang;

    const lower = rawText.toLowerCase().trim();
    const metadata = session.state_metadata || {};

    // ------------------------------------------------------------------------
    // 1. MULTI-TURN CONTEXT RESOLUTION (Relative references & Pending Actions)
    // ------------------------------------------------------------------------

    // A. Pending Action Confirmation ("ஆமா", "ஆம்", "ஆமாம்", "book பண்ணு", "confirm", "yes")
    const isAffirmative = [
      'ஆமா',
      'ஆம்',
      'ஆமாம்',
      'சரி',
      'பண்ணு',
      'பண்ணலாம்',
      'book பண்ணு',
      'புக் பண்ணு',
      'yes',
      'confirm',
      'okay',
      'go ahead',
    ].some((w) => lower === w || lower.startsWith(w + ' ') || lower.endsWith(' ' + w) || lower.includes(w));

    const isNegative = [
      'வேண்டாம்',
      'cancel',
      'cancel பண்ணு',
      'விடு',
      'வேண்டாம் பண்ணாத',
      'no',
    ].some((w) => lower === w || lower.startsWith(w + ' ') || lower.endsWith(' ' + w) || lower.includes(w));

    if (metadata.pendingAction) {
      if (isAffirmative) {
        const pending = metadata.pendingAction;
        session.state_metadata.pendingAction = null;

        if (pending.type === 'CONFIRM_BOOKING') {
          const techId = pending.technicianId || metadata.selectedTechnicianId || 'prov_senthil';
          const newBooking = BookingService.createBooking({
            technicianId: techId,
            serviceTitle: pending.serviceTitle || 'Air Conditioner Diagnostics & Repair',
            scheduledTime: 'Within 45 mins',
            address: '42, Sengunthapuram 3rd Cross, Karur',
            serviceMode: pending.serviceMode || 'DIAGNOSIS',
          });

          const msg =
            lang === 'ta'
              ? 'சரி, booking-ஐ தொடர்கிறேன்.'
              : 'Sure, proceeding with your booking.';

          this.logTurn(session.id, rawText, msg, 'CONFIRM_BOOKING', 'CONFIRM_BOOKING');

          return {
            intent: 'CONFIRM_BOOKING',
            action: 'CONFIRM_BOOKING',
            language: lang,
            message: msg,
            requires_confirmation: false,
            navigation_target: '/customer/track',
            entities: { bookingId: newBooking.id, providerId: techId, technicianId: techId },
            data: { booking: newBooking },
          };
        }

        if (pending.type === 'CANCEL_BOOKING') {
          const bookingId = pending.bookingId || 'bk_seed_001';
          try {
            BookingService.cancelBooking(bookingId, 'User requested cancellation');
          } catch {
            // Ignore if missing
          }
          const msg =
            lang === 'ta'
              ? 'முன்பதிவு ரத்து செய்யப்பட்டது.'
              : 'Your booking has been cancelled.';

          this.logTurn(session.id, rawText, msg, 'CANCEL_BOOKING', 'CANCEL_BOOKING');

          return {
            intent: 'CANCEL_BOOKING',
            action: 'CANCEL_BOOKING',
            language: lang,
            message: msg,
            requires_confirmation: false,
            navigation_target: '/customer/bookings',
            entities: { bookingId },
          };
        }
      } else if (isNegative) {
        const wasBooking = metadata.pendingAction?.type === 'CONFIRM_BOOKING';
        session.state_metadata.pendingAction = null;
        const msg =
          wasBooking
            ? (lang === 'ta' ? 'சரி, booking cancel பண்ணிட்டேன்.' : 'Okay, booking cancelled.')
            : (lang === 'ta' ? 'சரி, செயல்முறை ரத்து செய்யப்பட்டது.' : 'Alright, the action was cancelled.');

        this.logTurn(session.id, rawText, msg, 'CANCEL', 'CANCEL');

        return {
          intent: 'CANCEL',
          action: 'CANCEL',
          language: lang,
          message: msg,
          requires_confirmation: false,
          entities: {},
        };
      }
    }

    // B. Second Technician Booking ("ரெண்டாவது technician-ஐ book பண்ணணும்", "second technician-ஐ book பண்ணணும்", "இரண்டாவது technician-ஐ book பண்ணணும்")
    const isSecondTechnicianBooking =
      (lower.includes('ரெண்டாவது') || lower.includes('இரண்டாவது') || lower.includes('second')) &&
      (lower.includes('book') || lower.includes('புக்'));

    if (isSecondTechnicianBooking) {
      const allTechs = (metadata.matchedTechnicians && metadata.matchedTechnicians.length > 1)
        ? metadata.matchedTechnicians
        : TechnicianMatchingService.searchTechnicians({});
      const selected = allTechs[1] || allTechs[0];

      session.state_metadata.selectedTechnicianId = selected.id;
      session.state_metadata.selectedTechnicianName = selected.name;
      session.state_metadata.pendingAction = {
        type: 'CONFIRM_BOOKING',
        technicianId: selected.id,
        technicianName: selected.name,
        serviceTitle: 'Air Conditioner Diagnostics & Repair',
        serviceMode: 'DIAGNOSIS',
      };

      const msg =
        lang === 'ta'
          ? 'சரி. இந்த technician-ஐ book பண்ணலாமா?'
          : `Sure. Would you like to confirm booking technician ${selected.name}?`;

      this.logTurn(session.id, rawText, msg, 'CONFIRM_BOOKING', 'PROMPT_CONFIRMATION');

      return {
        intent: 'CONFIRM_BOOKING',
        action: 'CONFIRM_BOOKING',
        language: lang,
        message: msg,
        requires_confirmation: true,
        navigation_target: `/customer/book/${selected.id}`,
        entities: { technicianId: selected.id, technicianName: selected.name, index: 1 },
      };
    }

    // C. First Technician Reference Selection ("முதல் ஆளை பார்ப்போம்", "முதல் ஆள்", "first technician")
    const isFirstTechnicianRef =
      (lower.includes('முதல் ஆள்') ||
        lower.includes('முதல் ஆளை') ||
        lower.includes('first technician') ||
        lower.includes('first person') ||
        lower.includes('first one')) &&
      !lower.includes('book');

    if (isFirstTechnicianRef && metadata.matchedTechnicians && metadata.matchedTechnicians.length > 0) {
      const selected = metadata.matchedTechnicians[0];
      session.state_metadata.selectedTechnicianId = selected.id;
      session.state_metadata.selectedTechnicianName = selected.name;

      const msg =
        lang === 'ta'
          ? `முதல் டெக்னீசியன் ${selected.name}-ஐ தேர்வு செய்துள்ளேன். விவரங்களை காட்டுகிறேன்.`
          : `Selected the first technician, ${selected.name}. Showing profile details.`;

      this.logTurn(session.id, rawText, msg, 'SELECT_TECHNICIAN', 'SELECT_TECHNICIAN');

      return {
        intent: 'SELECT_TECHNICIAN',
        action: 'SELECT_TECHNICIAN',
        language: lang,
        message: msg,
        requires_confirmation: false,
        navigation_target: `/customer/provider/${selected.id}`,
        entities: { technicianId: selected.id, technicianName: selected.name, index: 0 },
        data: { technician: selected },
      };
    }

    // D. Second Technician Reference Selection ("ரெண்டாவது ஆளை காட்டு", "இரண்டாவது ஆளை", "second technician")
    const isSecondTechnicianRef =
      (lower.includes('ரெண்டாவது') ||
        lower.includes('இரண்டாவது') ||
        lower.includes('second technician') ||
        lower.includes('second person') ||
        lower.includes('second one')) &&
      !lower.includes('book');

    if (isSecondTechnicianRef) {
      const allTechs = (metadata.matchedTechnicians && metadata.matchedTechnicians.length > 1)
        ? metadata.matchedTechnicians
        : TechnicianMatchingService.searchTechnicians({});
      const selected = allTechs[1] || allTechs[0];

      session.state_metadata.selectedTechnicianId = selected.id;
      session.state_metadata.selectedTechnicianName = selected.name;

      const msg =
        lang === 'ta'
          ? `இரண்டாவது டெக்னீசியன் ${selected.name}-ஐ தேர்வு செய்துள்ளேன். விவரங்களை காட்டுகிறேன்.`
          : `Selected the second technician, ${selected.name}. Showing profile details.`;

      this.logTurn(session.id, rawText, msg, 'SELECT_TECHNICIAN', 'SELECT_TECHNICIAN');

      return {
        intent: 'SELECT_TECHNICIAN',
        action: 'SELECT_TECHNICIAN',
        language: lang,
        message: msg,
        requires_confirmation: false,
        navigation_target: `/customer/provider/${selected.id}`,
        entities: { technicianId: selected.id, technicianName: selected.name, index: 1 },
        data: { technician: selected },
      };
    }

    // E. Pronoun Booking Reference ("இவரை book பண்ணலாம்", "இந்த technician-ஐ book பண்ணு", "book this technician", "இவரை book பண்ணணும்", "இவரை புக் பண்ணு", "book பண்ணலாம்", "book பண்ணு")
    const isPronounBooking =
      lower.includes('இவரை book') ||
      lower.includes('இவரை புக்') ||
      lower.includes('இந்த ஆளை book') ||
      lower.includes('book this technician') ||
      lower.includes('book this person') ||
      lower.includes('இந்த technician-ஐ book') ||
      lower.includes('book பண்ணலாம்') ||
      lower.includes('புக் பண்ணலாம்') ||
      lower.includes('இவரை book பண்ணணும்') ||
      (lower.includes('book') && (lower.includes('இவரை') || lower.includes('இந்த')));

    if (isPronounBooking) {
      const techName = metadata.selectedTechnicianName || 'Ravi Kumar';
      const techId = metadata.selectedTechnicianId || 'prov_ravi';

      session.state_metadata.pendingAction = {
        type: 'CONFIRM_BOOKING',
        technicianId: techId,
        technicianName: techName,
        serviceTitle: 'Air Conditioner Diagnostics & Repair',
        serviceMode: 'DIAGNOSIS',
      };

      const msg =
        lang === 'ta'
          ? `சரி. டெக்னீசியன் ${techName}-ஐ book செய்யட்டுமா?`
          : `Sure. Would you like to confirm booking technician ${techName}?`;

      this.logTurn(session.id, rawText, msg, 'CONFIRM_BOOKING', 'PROMPT_CONFIRMATION');

      return {
        intent: 'CONFIRM_BOOKING',
        action: 'CONFIRM_BOOKING',
        language: lang,
        message: msg,
        requires_confirmation: true,
        navigation_target: `/customer/book/${techId}`,
        entities: { technicianId: techId, technicianName: techName },
      };
    }

    // D. Multi-turn Follow-up: User previously asked to search technicians ("Technician தேடு"), assistant asked which service, now user says "AC" or "TV"
    if (metadata.awaitingServiceType) {
      let matchedCode = '';
      if (lower.includes('ac') || lower.includes('ஏசி')) matchedCode = 'AC_REPAIR';
      else if (lower.includes('tv') || lower.includes('டிவி')) matchedCode = 'TV_REPAIR';
      else if (lower.includes('plumb') || lower.includes('பைப்') || lower.includes('குழாய்')) matchedCode = 'PLUMBING';

      if (matchedCode) {
        session.state_metadata.awaitingServiceType = false;
        const matchedTechs = TechnicianMatchingService.searchTechnicians({ serviceCode: matchedCode });
        session.state_metadata.matchedTechnicians = matchedTechs;

        const serviceNameTa = matchedCode === 'AC_REPAIR' ? 'AC repair' : matchedCode === 'TV_REPAIR' ? 'TV repair' : 'Plumbing';
        const serviceNameEn = matchedCode === 'AC_REPAIR' ? 'AC repair' : matchedCode === 'TV_REPAIR' ? 'TV repair' : 'Plumbing';
        const msg =
          lang === 'ta'
            ? `சரி, ${serviceNameTa} technicians-ஐ தேடுகிறேன். அருகில் உள்ளவர்களை காட்டுகிறேன்.`
            : `Searching for ${serviceNameEn} technicians. Showing nearby available experts.`;

        this.logTurn(session.id, rawText, msg, 'SEARCH_TECHNICIAN', 'SEARCH_TECHNICIAN');

        return {
          intent: 'SEARCH_TECHNICIAN',
          action: 'NAVIGATE',
          language: lang,
          message: msg,
          requires_confirmation: false,
          navigation_target: '/customer/providers',
          entities: { service: matchedCode },
          data: { matchedTechnicians: matchedTechs },
        };
      }
    }

    // ------------------------------------------------------------------------
    // 2. CANONICAL SEMANTIC RESOLVER & INTENT PARSING
    // ------------------------------------------------------------------------
    const semantic = resolveSemanticIntent(rawText, {
      role,
      currentScreen: currentRoute,
      currentPath: currentRoute,
      conversationLanguage: lang,
      ...request.context,
    });

    // Special Handling: Ambiguous Technician Search ("Technician தேடு" without service specified)
    if (
      (lower === 'technician தேடு' || lower === 'technician thedu' || lower === 'find a technician' || lower === 'find technician') &&
      !lower.includes('ac') &&
      !lower.includes('tv')
    ) {
      session.state_metadata.awaitingServiceType = true;
      const msg =
        lang === 'ta'
          ? 'சரி, உங்களுக்கு எந்த service-க்கு technician வேண்டும்? AC, TV அல்லது வேறு ஏதாவது?'
          : 'Sure, which service do you need a technician for? AC, TV, or something else?';

      this.logTurn(session.id, rawText, msg, 'CLARIFICATION', 'CLARIFICATION');

      return {
        intent: 'CLARIFICATION',
        action: 'CLARIFICATION',
        language: lang,
        message: msg,
        requires_confirmation: false,
        entities: {},
      };
    }

    // If intent is service request or technician search, save matched technicians in session state
    if (
      semantic.actionType === 'EXPRESS_NEED' ||
      semantic.actionType === 'NAVIGATE_PROVIDERS' ||
      semantic.actionType === 'SELECT_NEAREST_TECHNICIAN'
    ) {
      const code = semantic.payload?.canonicalService || 'AC_REPAIR';
      const matched = TechnicianMatchingService.searchTechnicians({ serviceCode: code });
      session.state_metadata.matchedTechnicians = matched;
      if (matched.length > 0) {
        session.state_metadata.selectedTechnicianId = matched[0].id;
        session.state_metadata.selectedTechnicianName = matched[0].name;
      }
    }

    // If intent requires confirmation, store pendingAction in session metadata
    if (semantic.requiresConfirmation) {
      session.state_metadata.pendingAction = {
        type: semantic.actionType,
        payload: semantic.payload,
      };
    }

    // ------------------------------------------------------------------------
    // 3. ROLE CONTEXT SECURITY CHECK
    // ------------------------------------------------------------------------
    if (role === 'customer' && this.isTechnicianOnlyAction(semantic.actionType)) {
      const msg =
        lang === 'ta'
          ? 'இந்த செயல்பாடு டெக்னீசியன்களுக்கு மட்டுமே உரியது.'
          : 'This action is available only in technician mode.';

      return {
        intent: 'ACCESS_DENIED',
        action: 'RETRY',
        language: lang,
        message: msg,
        requires_confirmation: false,
        entities: {},
      };
    }

    if (role === 'technician' && this.isCustomerOnlyAction(semantic.actionType)) {
      const msg =
        lang === 'ta'
          ? 'இந்த செயல்பாடு வாடிக்கையாளர்களுக்கு மட்டுமே உரியது.'
          : 'This action is available only in customer mode.';

      return {
        intent: 'ACCESS_DENIED',
        action: 'RETRY',
        language: lang,
        message: msg,
        requires_confirmation: false,
        entities: {},
      };
    }

    // Map navigation target based on role & action
    const navTarget = this.resolveNavigationTarget(semantic.actionType, role, semantic.payload);

    this.logTurn(
      session.id,
      rawText,
      semantic.response,
      semantic.actionType,
      semantic.actionType,
      semantic.payload
    );

    const finalPayload = semantic.payload || semantic.action?.payload || {};

    return {
      intent: semantic.actionType,
      action: semantic.actionType,
      language: semantic.language,
      message: semantic.response,
      requires_confirmation: Boolean(semantic.requiresConfirmation),
      navigation_target: navTarget,
      entities: finalPayload,
      data: finalPayload,
    };
  }

  private static isTechnicianOnlyAction(actionType: string): boolean {
    const techActions = [
      'NAVIGATE_JOBS',
      'NAVIGATE_EARNINGS',
      'NAVIGATE_SUBSCRIPTION',
      'ACCEPT_REQUEST',
      'REJECT_REQUEST',
      'START_WORK',
      'MARK_ARRIVED',
      'MARK_ON_THE_WAY',
      'ACTIVATE_WEEKLY_PASS',
      'ACTIVATE_DAILY_PASS',
      'ACTIVATE_MONTHLY_PASS',
    ];
    return techActions.includes(actionType);
  }

  private static isCustomerOnlyAction(actionType: string): boolean {
    const custActions = [
      'NAVIGATE_PROVIDERS',
      'EXPRESS_NEED',
      'SELECT_NEAREST_TECHNICIAN',
      'SELECT_TECHNICIAN',
      'APPROVE_ESTIMATE',
      'INITIATE_PAYMENT',
    ];
    return custActions.includes(actionType);
  }

  private static resolveNavigationTarget(
    actionType: string,
    role: 'customer' | 'technician',
    payload?: any
  ): string | undefined {
    switch (actionType) {
      case 'NAVIGATE_HOME':
        return role === 'technician' ? '/technician' : '/customer';
      case 'NAVIGATE_TECHNICIAN_HOME':
        return '/technician';
      case 'NAVIGATE_BOOKINGS':
        return role === 'technician' ? '/technician/jobs' : '/customer/bookings';
      case 'NAVIGATE_PROVIDERS':
        return '/customer/providers';
      case 'NAVIGATE_PROFILE':
        return role === 'technician' ? '/technician/profile' : '/customer/profile';
      case 'NAVIGATE_JOBS':
        return '/technician/jobs';
      case 'NAVIGATE_EARNINGS':
        return '/technician/earnings';
      case 'NAVIGATE_SUBSCRIPTION':
        return '/technician/subscription';
      case 'SWITCH_ROLE_CUSTOMER':
        return '/customer';
      case 'SWITCH_ROLE_TECHNICIAN':
        return '/technician';
      case 'EXPRESS_NEED':
        return '/customer/express';
      case 'SELECT_NEAREST_TECHNICIAN':
      case 'SELECT_TECHNICIAN':
        return payload?.technicianId || payload?.providerId
          ? `/customer/provider/${payload.technicianId || payload.providerId}`
          : '/customer/providers';
      case 'CONFIRM_BOOKING':
        return payload?.technicianId || payload?.providerId
          ? `/customer/book/${payload.technicianId || payload.providerId}`
          : '/customer/providers';
      case 'INITIATE_PAYMENT':
        return '/customer/track';
      default:
        return undefined;
    }
  }

  private static logTurn(
    sessionId: string,
    userText: string,
    assistantText: string,
    intent: string,
    actionType: string,
    entities: any = {}
  ) {
    const userMsg: ConversationMessageRecord = {
      id: `msg_u_${Date.now()}`,
      session_id: sessionId,
      speaker: 'user',
      text: userText,
      language: 'ta',
      intent,
      action_type: actionType,
      entities,
      created_at: new Date().toISOString(),
    };
    dbStore.conversationMessages.set(userMsg.id, userMsg);

    const asstMsg: ConversationMessageRecord = {
      id: `msg_a_${Date.now()}`,
      session_id: sessionId,
      speaker: 'assistant',
      text: assistantText,
      language: 'ta',
      intent,
      action_type: actionType,
      entities,
      created_at: new Date().toISOString(),
    };
    dbStore.conversationMessages.set(asstMsg.id, asstMsg);

    const voiceIntent: VoiceIntentRecord = {
      id: `vi_${Date.now()}`,
      session_id: sessionId,
      raw_transcript: userText,
      detected_language: 'ta',
      canonical_intent: intent,
      confidence: 0.95,
      matched_action: actionType,
      requires_confirmation: false,
      resolution_source: 'NEXDO_BACKEND_CONTEXT_ENGINE',
      created_at: new Date().toISOString(),
    };
    dbStore.voiceIntents.set(voiceIntent.id, voiceIntent);
  }
}
