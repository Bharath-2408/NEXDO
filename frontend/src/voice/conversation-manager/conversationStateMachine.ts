import { ConversationStateMachineStage, ConversationContext } from '../../types/voice';
import { matchConfirmationIntent } from '../intent-engine/confirmationIntents';
import { CanonicalAction } from '../../types/actions';

export interface StateMachineTurnResult {
  handled: boolean;
  nextStage?: ConversationStateMachineStage;
  action?: CanonicalAction;
  response?: {
    en: string;
    ta: string;
  };
  confidence: number;
}

export function evaluateStateMachineTurn(
  normalized: string,
  tokens: string[],
  context: ConversationContext,
  userLang: 'ta' | 'en'
): StateMachineTurnResult {
  const currentStage: ConversationStateMachineStage =
    context.conversationState ||
    (context.pendingConfirmationAction || context.pendingConfirmation
      ? 'BOOKING_PENDING_CONFIRMATION'
      : context.selectedTechnician
      ? 'TECHNICIAN_SELECTED'
      : context.visibleProviders && context.visibleProviders.length > 0
      ? 'TECHNICIANS_DISPLAYED'
      : 'IDLE');

  const conf = matchConfirmationIntent(normalized, tokens);

  // 1. Pending Confirmation Handling (Section 7)
  if (currentStage === 'BOOKING_PENDING_CONFIRMATION' || context.pendingConfirmationAction || context.pendingConfirmation) {
    if (conf.isAffirmative) {
      const selectedTech = context.selectedTechnician || (context.visibleProviders && context.visibleProviders[0]);
      const targetId = selectedTech?.id || 'prov_ravi';
      const techName = selectedTech?.name || 'ரவி குமார்';

      return {
        handled: true,
        nextStage: 'BOOKING_CONFIRMED',
        action: {
          type: 'CONFIRM_BOOKING',
          payload: {
            providerId: targetId,
            provider: selectedTech,
          },
          source: 'VOICE',
          timestamp: Date.now(),
        },
        confidence: 0.99,
        response: {
          en: `Booking confirmed with ${techName}! The technician has been notified.`,
          ta: `சரி. ${techName}-க்கு booking confirm பண்ணுகிறேன். டெக்னிஷியன் விரைவில் வருகை தருவார்.`,
        },
      };
    }

    if (conf.isNegative) {
      return {
        handled: true,
        nextStage: context.selectedTechnician ? 'TECHNICIAN_SELECTED' : 'TECHNICIANS_DISPLAYED',
        action: {
          type: 'CANCEL',
          payload: {},
          source: 'VOICE',
          timestamp: Date.now(),
        },
        confidence: 0.99,
        response: {
          en: 'Booking cancelled. How else can I help you?',
          ta: 'சரி, புக்கிங் செயல் ரத்து செய்யப்பட்டது. உங்களுக்கு வேறு என்ன உதவி வேண்டும்?',
        },
      };
    }
  }

  // 2. Affirmative said without pending confirmation (Section 7 requirement: must NOT randomly trigger a booking)
  if (conf.isAffirmative && currentStage !== 'BOOKING_PENDING_CONFIRMATION') {
    return {
      handled: true,
      nextStage: currentStage,
      action: {
        type: 'YES',
        payload: {},
        source: 'VOICE',
        timestamp: Date.now(),
      },
      confidence: 0.92,
      response: {
        en: 'Yes! How can I help you with your home services today?',
        ta: 'சொல்லுங்க! உங்களுக்கு எந்த சேவையில் உதவி வேண்டும்?',
      },
    };
  }

  return {
    handled: false,
    confidence: 0,
  };
}
