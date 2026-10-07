import { CanonicalAction } from '../types/actions';
import { parseVoiceInput } from './intentParser';
import { generateHumanResponse, detectLanguage } from './responseGenerator';
import { resolveSemanticIntent } from './semanticResolver';
import { nexdoApi } from '../api/nexdoApi';

export interface VoiceRequestPayload {
  text: string;
  role: 'customer' | 'technician';
  currentRoute: string;
  conversationLanguage?: string;
  context?: Record<string, any>;
}

export interface StructuredVoiceResult {
  language: 'ta' | 'en';
  intent: string;
  entities: Record<string, any>;
  response: string;
  action: CanonicalAction;
  confidence: number;
  requiresConfirmation?: boolean;
}

/**
 * Resolves voice intent via Backend LLM Endpoint (/api/voice)
 * with robust local fallback for sandbox/offline execution.
 * Zero secrets or API credentials in frontend client code.
 */
export async function processVoiceInputViaLLM(
  payload: VoiceRequestPayload
): Promise<StructuredVoiceResult> {
  const trimmed = payload.text.trim();
  if (!trimmed) {
    throw new Error('Empty voice input');
  }

  // 1. Attempt Backend API Endpoint (/api/voice/interpret) to sync session context
  try {
    const data = await nexdoApi.voice.interpret({
      text: trimmed,
      role: payload.role,
      currentRoute: payload.currentRoute,
      conversationLanguage: payload.conversationLanguage,
      context: payload.context,
    });

    if (data && data.intent && (data.message || data.response)) {
      const responseText = data.message || data.response;
      return {
        language: data.language === 'ta' ? 'ta' : 'en',
        intent: data.intent,
        entities: data.entities || {},
        response: responseText,
        action: {
          type: (data.action?.type || data.intent) as any,
          payload: data.action?.payload || data.entities || {},
          source: 'VOICE',
          timestamp: Date.now(),
        },
        confidence: data.confidence || 0.98,
        requiresConfirmation: Boolean(data.requires_confirmation || data.requiresConfirmation),
      };
    }
  } catch (err) {
    // If backend call fails, proceed to local semantic engine
    console.warn('[VoiceClient] Backend interpretation failed, falling back to local engine:', err);
  }

  // 2. Client-side fallback engine
  return resolveLocalVoiceTurn(payload);
}

/**
 * Client-Side Structured Engine producing the exact same StructuredVoiceResult schema
 */
export function resolveLocalVoiceTurn(
  payload: VoiceRequestPayload
): StructuredVoiceResult {
  const contextSnapshot = {
    role: payload.role,
    currentScreen: payload.currentRoute,
    currentPath: payload.currentRoute,
    conversationLanguage: payload.conversationLanguage,
    ...payload.context,
  };

  const semantic = resolveSemanticIntent(payload.text, contextSnapshot);
  if (semantic.confidence >= 0.65 || semantic.actionType === 'RETRY' || semantic.actionType === 'HELP') {
    return {
      language: semantic.language,
      intent: semantic.actionType,
      entities: semantic.payload || {},
      response: semantic.response,
      action: semantic.action,
      confidence: semantic.confidence,
      requiresConfirmation: semantic.requiresConfirmation,
    };
  }

  const parsed = parseVoiceInput(payload.text, contextSnapshot);
  const human = generateHumanResponse(parsed, contextSnapshot);

  const detectedLang = detectLanguage(payload.text, payload.conversationLanguage);
  const finalLanguage: 'ta' | 'en' =
    parsed.actionType === 'SWITCH_LANGUAGE' && parsed.payload?.language
      ? (parsed.payload.language as 'ta' | 'en')
      : human.languageState.responseLanguage === 'ta' || detectedLang.code === 'ta'
      ? 'ta'
      : 'en';

  const canonicalAction: CanonicalAction = {
    type: parsed.actionType,
    payload: parsed.serviceNeed || parsed.payload || {},
    source: 'VOICE',
    timestamp: Date.now(),
  };

  return {
    language: finalLanguage,
    intent: parsed.actionType,
    entities: parsed.extractedEntities || {},
    response: human.response.text,
    action: canonicalAction,
    confidence: parsed.confidence || 0.95,
  };
}
