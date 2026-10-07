import { ConversationStateMachineStage, ConversationContext } from '../../types/voice';

export interface ConversationManagerSnapshot {
  stage: ConversationStateMachineStage;
  selectedService?: string;
  problem?: string;
  selectedTechnician?: any;
  pendingAction?: {
    type: string;
    payload?: any;
    promptText?: string;
  } | null;
  conversationLanguage: 'ta' | 'en';
}

export class ConversationStateManager {
  private currentSnapshot: ConversationManagerSnapshot;

  constructor(initialLanguage: 'ta' | 'en' = 'ta') {
    this.currentSnapshot = {
      stage: 'IDLE',
      conversationLanguage: initialLanguage,
    };
  }

  getSnapshot(): ConversationManagerSnapshot {
    return { ...this.currentSnapshot };
  }

  setStage(stage: ConversationStateMachineStage) {
    this.currentSnapshot.stage = stage;
  }

  setSelectedService(service: string, problem?: string) {
    this.currentSnapshot.selectedService = service;
    this.currentSnapshot.problem = problem;
    if (this.currentSnapshot.stage === 'IDLE') {
      this.currentSnapshot.stage = 'SERVICE_IDENTIFIED';
    }
  }

  setSelectedTechnician(tech: any) {
    this.currentSnapshot.selectedTechnician = tech;
    this.currentSnapshot.stage = 'TECHNICIAN_SELECTED';
  }

  setPendingConfirmation(actionType: string, payload: any, promptText?: string) {
    this.currentSnapshot.pendingAction = {
      type: actionType,
      payload,
      promptText,
    };
    this.currentSnapshot.stage = 'BOOKING_PENDING_CONFIRMATION';
  }

  clearPendingConfirmation() {
    this.currentSnapshot.pendingAction = null;
    if (this.currentSnapshot.stage === 'BOOKING_PENDING_CONFIRMATION') {
      this.currentSnapshot.stage = this.currentSnapshot.selectedTechnician
        ? 'TECHNICIAN_SELECTED'
        : 'TECHNICIANS_DISPLAYED';
    }
  }

  confirmBooking() {
    this.currentSnapshot.stage = 'BOOKING_CONFIRMED';
    this.currentSnapshot.pendingAction = null;
  }

  syncFromContext(context: Partial<ConversationContext>) {
    if (context.conversationState) {
      this.currentSnapshot.stage = context.conversationState;
    }
    if (context.selectedService) {
      this.currentSnapshot.selectedService = context.selectedService;
    }
    if (context.problem) {
      this.currentSnapshot.problem = context.problem;
    }
    if (context.selectedTechnician) {
      this.currentSnapshot.selectedTechnician = context.selectedTechnician;
    }
    if (context.conversationLanguage === 'ta' || context.conversationLanguage === 'en') {
      this.currentSnapshot.conversationLanguage = context.conversationLanguage;
    }
  }
}
