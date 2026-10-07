export type VoiceState =
  | 'IDLE'
  | 'LISTENING'
  | 'PROCESSING'
  | 'UNDERSTANDING'
  | 'CONFIRMATION_REQUIRED'
  | 'EXECUTING'
  | 'AI_SPEAKING'
  | 'WAITING_FOR_USER'
  | 'CONFIRMATION'
  | 'SUCCESS'
  | 'ERROR'
  | 'RETRY';

export interface LanguageContextState {
  detectedLanguage: string;
  conversationLanguage: string;
  preferredLanguage: string;
  responseLanguage: string;
  ttsLanguage: string;
  languageConfidence: number;
}

export interface ConversationalResponse {
  text: string;
  language: string;
  actionSummary?: string;
  audioCue?: 'success' | 'clarify' | 'alert';
}

export interface VoiceStatusInfo {
  state: VoiceState;
  title: string;
  description: string;
  transcript: string;
  confidence: number;
  pendingAction?: string;
  errorMessage?: string;
  conversationalResponse?: ConversationalResponse;
  languageState?: LanguageContextState;
}

export interface VoiceEntityExtractionResult {
  rawTranscript: string;
  language: string;
  entities: {
    name?: string;
    dob?: string;
    phone?: string;
    district?: string;
    service?: string;
    time?: string;
    location?: string;
  };
  confidence: number;
  fieldFilledCount: number;
}

export interface ConversationTurn {
  turnId: string;
  timestamp: number;
  rawTranscript: string;
  normalizedTranscript: string;
  detectedLanguage: 'ta' | 'ta-en' | 'en';
  languageConfidence: number;
  intent: string;
  canonicalService?: string;
  entities: Record<string, any>;
  contextSnapshot: ConversationContext;
  action: {
    type: string;
    payload?: any;
    source: 'VOICE' | 'UI';
    timestamp: number;
  };
  actionResult?: any;
  responseText: string;
  responseLanguage: 'ta' | 'en';
  ttsLocale: string;
  ttsStatus: 'PENDING' | 'SPEAKING' | 'COMPLETED' | 'ERROR' | 'SKIPPED';
  requiresConfirmation?: boolean;
}

export type ConversationStateMachineStage =
  | 'IDLE'
  | 'SERVICE_IDENTIFIED'
  | 'SEARCHING_TECHNICIANS'
  | 'TECHNICIANS_DISPLAYED'
  | 'TECHNICIAN_SELECTED'
  | 'BOOKING_IN_PROGRESS'
  | 'BOOKING_PENDING_CONFIRMATION'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_COMPLETED'
  | 'PAYMENT_PENDING';

export interface ConversationContext {
  currentScreen?: string;
  role?: 'customer' | 'technician';
  conversationState?: ConversationStateMachineStage;
  selectedService?: string;
  problem?: string;
  selectedTechnician?: any;
  visibleProviders?: any[];
  visibleOpportunities?: any[];
  activeBooking?: { id: string; service: string; status?: string; technicianName?: string; time?: string; amount?: number; [key: string]: any };
  activeNeed?: any;
  pendingConfirmation?: { actionType: string; payload: any; prompt: string };
  pendingConfirmationAction?: string | null;
  lastAction?: { type: string; payload?: any };
  conversationLanguage?: string;
  turns?: ConversationTurn[];
  activeTurn?: ConversationTurn | null;
}

