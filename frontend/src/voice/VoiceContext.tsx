import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  VoiceState,
  VoiceStatusInfo,
  LanguageContextState,
  ConversationContext,
  ConversationTurn,
} from '../types/voice';
import { speechEngine, audioFeedback } from './voiceEngine';
import { ttsService } from './ttsService';
import { processVoiceInputViaLLM } from './voiceClient';
import { dispatchCanonicalAction } from './actionDispatcher';
import { useApp } from '../store/AppContext';
import { CanonicalAction } from '../types/actions';
import { ACTION_REGISTRY } from './actionRegistry';
import { getLanguageConfig } from './languageConfig';

interface VoiceContextType {
  voiceState: VoiceState;
  statusInfo: VoiceStatusInfo;
  activeTranscript: string;
  isListening: boolean;
  isSpeaking: boolean;
  turns: ConversationTurn[];
  activeTurn: ConversationTurn | null;
  startListening: (lang?: string) => void;
  stopListening: () => void;
  simulateVoicePrompt: (promptText: string) => void;
  speakMessage: (text: string, lang?: string, onDone?: () => void) => void;
  stopSpeaking: () => void;
  replayResponse: () => void;
  resetVoice: () => void;
  onActionDetected?: (action: CanonicalAction) => void;
  setActionCallback: (cb: (action: CanonicalAction) => void) => void;
  setPendingConfirmation: (action: CanonicalAction | null, message?: string) => void;
  confirmPendingAction: () => void;
  cancelPendingAction: () => void;
  registerPageActionHandler: (handler: (action: CanonicalAction) => boolean | Promise<boolean> | void) => () => void;
  activeLanguageState: LanguageContextState;
  conversationContext: ConversationContext;
  setConversationContext: React.Dispatch<React.SetStateAction<ConversationContext>>;
  updateConversationContext: (partial: Partial<ConversationContext>) => void;
}

const defaultLangState: LanguageContextState = {
  detectedLanguage: 'ta',
  conversationLanguage: 'ta',
  preferredLanguage: 'ta',
  responseLanguage: 'ta',
  ttsLanguage: 'ta-IN',
  languageConfidence: 0.99,
};

const initialStatusInfo: VoiceStatusInfo = {
  state: 'IDLE',
  title: 'Just say what you need',
  description: 'Tap microphone or speak naturally in Tamil or English',
  transcript: '',
  confidence: 1,
  languageState: defaultLangState,
};

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast, selectedLanguage, setLanguage } = useApp();

  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [statusInfo, setStatusInfo] = useState<VoiceStatusInfo>(initialStatusInfo);
  const [activeTranscript, setActiveTranscript] = useState<string>('');
  const [activeLanguageState, setActiveLanguageState] = useState<LanguageContextState>(defaultLangState);
  const [conversationContext, setConversationContext] = useState<ConversationContext>({});
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [activeTurn, setActiveTurn] = useState<ConversationTurn | null>(null);

  // Synchronize Voice Context with selected language from AppContext (Selected language is Source of Truth)
  useEffect(() => {
    const langCode: 'ta' | 'en' = selectedLanguage.code.toLowerCase().startsWith('ta') ? 'ta' : 'en';
    const cfg = getLanguageConfig(langCode);
    setActiveLanguageState((prev) => {
      if (prev.conversationLanguage === langCode) return prev;
      return {
        detectedLanguage: langCode,
        conversationLanguage: langCode,
        preferredLanguage: langCode,
        responseLanguage: langCode,
        ttsLanguage: cfg.ttsLocale,
        languageConfidence: 1,
      };
    });
    setStatusInfo((prev) => {
      if (prev.state === 'IDLE') {
        return {
          ...prev,
          title: cfg.statusPrompts.idleTitle,
          description: cfg.statusPrompts.idleDescription,
        };
      }
      return prev;
    });
    setConversationContext((prev) => ({
      ...prev,
      conversationLanguage: langCode,
    }));
  }, [selectedLanguage]);

  const conversationContextRef = useRef<ConversationContext>(conversationContext);
  useEffect(() => {
    conversationContextRef.current = conversationContext;
  }, [conversationContext]);

  const actionCallbackRef = useRef<((action: CanonicalAction) => void) | null>(null);
  const pageActionHandlersRef = useRef<((action: CanonicalAction) => boolean | Promise<boolean> | void)[]>([]);
  const pendingActionRef = useRef<CanonicalAction | null>(null);
  const lastSpokenResponseRef = useRef<{ text: string; lang: string } | null>(null);
  const isSpeakingRef = useRef<boolean>(false);

  const registerPageActionHandler = useCallback((handler: (action: CanonicalAction) => boolean | Promise<boolean> | void) => {
    pageActionHandlersRef.current.push(handler);
    return () => {
      pageActionHandlersRef.current = pageActionHandlersRef.current.filter((h) => h !== handler);
    };
  }, []);

  const updateConversationContext = useCallback((partial: Partial<ConversationContext>) => {
    setConversationContext((prev) => {
      const updated = { ...prev, ...partial };
      conversationContextRef.current = updated;
      return updated;
    });
  }, []);

  const setActionCallback = useCallback((cb: (action: CanonicalAction) => void) => {
    actionCallbackRef.current = cb;
  }, []);

  const stopSpeaking = useCallback(() => {
    isSpeakingRef.current = false;
    ttsService.stopSpeaking();
    if (voiceState === 'AI_SPEAKING') {
      setVoiceState('IDLE');
    }
  }, [voiceState]);

  const replayResponse = useCallback(() => {
    if (lastSpokenResponseRef.current && lastSpokenResponseRef.current.text) {
      setVoiceState('AI_SPEAKING');
      isSpeakingRef.current = true;
      ttsService.speakResponse(lastSpokenResponseRef.current.text, {
        lang: lastSpokenResponseRef.current.lang,
        onStart: () => {
          isSpeakingRef.current = true;
          setVoiceState('AI_SPEAKING');
        },
        onEnd: () => {
          isSpeakingRef.current = false;
          setVoiceState('IDLE');
        },
        onError: () => {
          isSpeakingRef.current = false;
          setVoiceState('IDLE');
        },
      });
    }
  }, []);

  const resetVoice = useCallback(() => {
    isSpeakingRef.current = false;
    speechEngine.stop();
    ttsService.stopSpeaking();
    setVoiceState('IDLE');
    setStatusInfo(initialStatusInfo);
    setActiveTranscript('');
  }, []);

  // Core Per-Turn Execution Engine
  const handleParsedInput = useCallback(
    async (transcript: string) => {
      const cleanTranscript = transcript.trim();
      if (!cleanTranscript) return;

      // 1. Move to PROCESSING
      setVoiceState('PROCESSING');
      setStatusInfo({
        state: 'PROCESSING',
        title: 'Understanding what you need...',
        description: 'Analyzing request, matching capabilities & service area',
        transcript: cleanTranscript,
        confidence: 0.95,
        languageState: activeLanguageState,
      });

      try {
        const isTech = location.pathname.startsWith('/technician');
        const activeRole: 'customer' | 'technician' = isTech ? 'technician' : 'customer';

        const result = await processVoiceInputViaLLM({
          text: cleanTranscript,
          role: activeRole,
          currentRoute: location.pathname,
          conversationLanguage: activeLanguageState.conversationLanguage,
          context: conversationContextRef.current,
        });

        // 2. Move to UNDERSTANDING
        setVoiceState('UNDERSTANDING');

        const isSwitchLang = result.action.type === 'SWITCH_LANGUAGE';
        const targetLang: 'ta' | 'en' = isSwitchLang
          ? (result.action.payload?.language === 'ta' ? 'ta' : 'en')
          : (activeLanguageState.conversationLanguage === 'ta' ? 'ta' : 'en');
        const langCfg = getLanguageConfig(targetLang);
        const ttsLang = langCfg.ttsLocale;

        if (isSwitchLang) {
          setLanguage(targetLang);
        }

        const newLangState: LanguageContextState = {
          detectedLanguage: isSwitchLang ? targetLang : (result.language || targetLang),
          conversationLanguage: targetLang,
          preferredLanguage: targetLang,
          responseLanguage: targetLang,
          ttsLanguage: ttsLang,
          languageConfidence: result.confidence || 0.99,
        };
        setActiveLanguageState(newLangState);

        const updatedContextDelta: Partial<ConversationContext> = {
          conversationLanguage: targetLang,
        };

        if (result.action.type === 'EXPRESS_NEED' || result.action.type === 'SEARCH_SERVICE') {
          updatedContextDelta.selectedService =
            result.entities?.canonicalService || result.action.payload?.canonicalService;
          updatedContextDelta.problem = result.entities?.problem || result.action.payload?.problem;
          updatedContextDelta.conversationState = 'TECHNICIANS_DISPLAYED';
          if (result.action.payload) {
            updatedContextDelta.activeNeed = result.action.payload;
          }
        } else if (
          result.action.type === 'SELECT_TECHNICIAN' ||
          result.action.type === 'SELECT_FIRST_TECHNICIAN' ||
          result.action.type === 'SELECT_NEAREST_TECHNICIAN'
        ) {
          if (result.action.payload?.provider) {
            updatedContextDelta.selectedTechnician = result.action.payload.provider;
            updatedContextDelta.conversationState = 'TECHNICIAN_SELECTED';
          }
        } else if (result.action.type === 'CONFIRM_BOOKING') {
          const isBookingConfirmPrompt =
            result.response.includes('உறுதி செய்யவா') ||
            result.response.includes('confirm') ||
            result.response.includes('book செய்யவா');
          if (isBookingConfirmPrompt) {
            updatedContextDelta.conversationState = 'BOOKING_PENDING_CONFIRMATION';
            updatedContextDelta.pendingConfirmationAction = 'CONFIRM_BOOKING';
          } else {
            updatedContextDelta.conversationState = 'BOOKING_CONFIRMED';
            updatedContextDelta.pendingConfirmationAction = null;
          }
        }

        updateConversationContext(updatedContextDelta);

        // Check if requires confirmation (e.g. CANCEL_BOOKING, REJECT_REQUEST, APPROVE_ESTIMATE, CONFIRM_PAYMENT, or CONFIRM_BOOKING asking confirmation)
        const isBookingConfirmPrompt =
          result.action.type === 'CONFIRM_BOOKING' &&
          (result.response.includes('உறுதி செய்யவா') ||
            result.response.includes('confirm') ||
            result.response.includes('book செய்யவா') ||
            result.response.includes('book பண்ணலாமா'));

        const actionDef = ACTION_REGISTRY.find((a) => a.id === result.action.type);
        const requiresConfirmation = Boolean(
          result.requiresConfirmation ||
          actionDef?.requiresConfirmation ||
          isBookingConfirmPrompt
        );

        const turn: ConversationTurn = {
          turnId: `turn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          timestamp: Date.now(),
          rawTranscript: cleanTranscript,
          normalizedTranscript: result.entities?.service || cleanTranscript,
          detectedLanguage: targetLang,
          languageConfidence: result.confidence,
          intent: result.intent,
          canonicalService: result.entities?.service,
          entities: result.entities,
          contextSnapshot: { ...conversationContextRef.current },
          action: result.action,
          responseText: result.response,
          responseLanguage: targetLang,
          ttsLocale: ttsLang,
          ttsStatus: 'SPEAKING',
          requiresConfirmation,
        };

        console.log(`[VOICE TURN #${turns.length + 1}]`, {
          turnId: turn.turnId,
          transcript: cleanTranscript,
          detectedLanguage: turn.detectedLanguage,
          intent: turn.intent,
          canonicalService: turn.canonicalService,
          entities: turn.entities,
          action: turn.action.type,
          response: turn.responseText,
          ttsLocale: turn.ttsLocale,
          requiresConfirmation: turn.requiresConfirmation,
        });

        setTurns((prev) => [...prev, turn]);
        setActiveTurn(turn);

        if (requiresConfirmation) {
          setVoiceState('CONFIRMATION_REQUIRED');
          updateConversationContext({
            pendingConfirmationAction: result.action.type,
            conversationState: 'BOOKING_PENDING_CONFIRMATION',
          });
          const confirmMsg =
            result.response ||
            (result.language === 'ta'
              ? actionDef?.confirmationMessage?.ta
              : actionDef?.confirmationMessage?.en) ||
            'Confirmation Required';

          setStatusInfo({
            state: 'CONFIRMATION_REQUIRED',
            title: langCfg.statusPrompts.confirmationTitle || (targetLang.startsWith('ta') ? 'உறுதிப்படுத்த வேண்டும்' : 'Confirmation Required'),
            description: confirmMsg,
            transcript: cleanTranscript,
            confidence: 0.95,
            conversationalResponse: { text: result.response, actionSummary: result.intent, language: result.language },
            languageState: newLangState,
          });

          pendingActionRef.current = result.action;
          lastSpokenResponseRef.current = { text: confirmMsg, lang: ttsLang };

          isSpeakingRef.current = true;
          ttsService.speakResponse(confirmMsg, {
            lang: ttsLang,
            onStart: () => {
              isSpeakingRef.current = true;
            },
            onEnd: () => {
              isSpeakingRef.current = false;
            },
            onError: () => {
              isSpeakingRef.current = false;
            },
          });
          return;
        }

        // 3. Move to AI_SPEAKING with True Audio Output
        setVoiceState('AI_SPEAKING');
        audioFeedback.playSuccessChime();

        setStatusInfo({
          state: 'AI_SPEAKING',
          title: result.intent,
          description: result.response,
          transcript: cleanTranscript,
          confidence: result.confidence,
          conversationalResponse: { text: result.response, actionSummary: result.intent, language: result.language },
          languageState: newLangState,
        });

        lastSpokenResponseRef.current = {
          text: result.response,
          lang: ttsLang,
        };

        // Reset any prior pending confirmation if executing another action
        updateConversationContext({
          pendingConfirmationAction: undefined,
          conversationState: 'IDLE',
        });
        pendingActionRef.current = null;

        // Dispatch canonical action: page handlers first, layout callback second, fallback to direct dispatch
        let handledByPage = false;
        const pageHandlers = [...pageActionHandlersRef.current];
        for (let i = pageHandlers.length - 1; i >= 0; i--) {
          try {
            const res = pageHandlers[i](result.action);
            if (res) {
              handledByPage = true;
              break;
            }
          } catch (err) {
            console.error('[VoiceContext] Error in page action handler:', err);
          }
        }

        if (!handledByPage) {
          if (actionCallbackRef.current) {
            actionCallbackRef.current(result.action);
          } else {
            dispatchCanonicalAction(result.action, {
              navigate,
              role: activeRole,
              currentRoute: location.pathname,
              showToast,
              onSwitchLanguage: (lang) => setLanguage(lang),
            });
          }
        }

        // Trigger real SpeechSynthesis audio
        isSpeakingRef.current = true;
        ttsService.speakResponse(result.response, {
          lang: ttsLang,
          onStart: () => {
            isSpeakingRef.current = true;
            setVoiceState('AI_SPEAKING');
          },
          onEnd: () => {
            isSpeakingRef.current = false;
            setVoiceState('SUCCESS');
            setTimeout(() => {
              setVoiceState('IDLE');
            }, 6000);
          },
          onError: () => {
            isSpeakingRef.current = false;
            setVoiceState('SUCCESS');
            setTimeout(() => {
              setVoiceState('IDLE');
            }, 6000);
          },
        });
      } catch (err) {
        console.error('[VoiceContext] Error in voice loop:', err);
        setVoiceState('ERROR');
        audioFeedback.playErrorChime();
        setStatusInfo({
          state: 'ERROR',
          title: 'Processing error',
          description: 'Could not process voice request. Please try again.',
          transcript: cleanTranscript,
          confidence: 0,
        });
        setTimeout(() => setVoiceState('IDLE'), 3000);
      }
    },
    [activeLanguageState, turns.length, updateConversationContext, location.pathname, navigate, showToast, setLanguage]
  );

  const startListening = useCallback(
    (lang?: string) => {
      // Voice Interruption: Cancel speech immediately and start listening
      if (isSpeakingRef.current || ttsService.isSpeaking()) {
        console.log('[VoiceContext] Interrupted assistant speech to start listening');
        ttsService.stopSpeaking();
        isSpeakingRef.current = false;
      }

      audioFeedback.playListeningChime();

      const activeLang = activeLanguageState.conversationLanguage === 'ta' ? 'ta' : 'en';
      const cfg = getLanguageConfig(activeLang);
      const targetLang =
        lang && lang !== 'auto'
          ? (lang.startsWith('ta') ? 'ta-IN' : 'en-IN')
          : cfg.sttLocale;

      setVoiceState('LISTENING');
      setActiveTranscript('');
      setStatusInfo({
        state: 'LISTENING',
        title: cfg.statusPrompts.listeningTitle,
        description: cfg.statusPrompts.listeningDescription,
        transcript: '',
        confidence: 1,
        languageState: activeLanguageState,
      });

      if (speechEngine.isSupported()) {
        speechEngine.start(targetLang, {
          onStart: () => {},
          onResult: (transcript, isFinal) => {
            setActiveTranscript(transcript);
            if (isFinal) {
              // Immediately stop listening to prevent loop / audio bleed
              speechEngine.stop();
              handleParsedInput(transcript);
            }
          },
          onError: (_err: string) => {
            setVoiceState('RETRY');
            audioFeedback.playErrorChime();
            setStatusInfo({
              state: 'RETRY',
              title: targetLang.startsWith('ta') ? 'சரியாகக் கேட்கவில்லை' : 'Could not hear clearly',
              description: targetLang.startsWith('ta') ? 'தயவுசெய்து மீண்டும் பேச மைக்ரோஃபோனைத் தொடவும் அல்லது கீழே தட்டச்சு செய்யவும்' : 'Please tap microphone to try speaking again, or type your request below',
              transcript: '',
              confidence: 0,
            });
            setTimeout(() => setVoiceState('IDLE'), 3000);
          },
          onEnd: () => {
            if (voiceState === 'LISTENING') {
              setVoiceState('IDLE');
            }
          },
        });
      } else {
        // Report real environment status instead of injecting mock audio
        setVoiceState('ERROR');
        audioFeedback.playErrorChime();
        setStatusInfo({
          state: 'ERROR',
          title: 'Speech Recognition Unavailable',
          description: 'Microphone access is not supported or not granted in this browser. Please type your request in the box below.',
          transcript: '',
          confidence: 0,
        });
        setTimeout(() => setVoiceState('IDLE'), 3500);
      }
    },
    [handleParsedInput, activeLanguageState, voiceState]
  );

  const stopListening = useCallback(() => {
    speechEngine.stop();
    if (voiceState === 'LISTENING') {
      setVoiceState('PROCESSING');
      if (activeTranscript) {
        handleParsedInput(activeTranscript);
      } else {
        resetVoice();
      }
    }
  }, [voiceState, activeTranscript, handleParsedInput, resetVoice]);

  const simulateVoicePrompt = useCallback(
    (promptText: string) => {
      ttsService.stopSpeaking();
      audioFeedback.playListeningChime();
      setVoiceState('LISTENING');
      setActiveTranscript(promptText);

      setTimeout(() => {
        handleParsedInput(promptText);
      }, 250);
    },
    [handleParsedInput]
  );

  const activeTurnRef = useRef<ConversationTurn | null>(null);
  useEffect(() => {
    activeTurnRef.current = activeTurn;
  }, [activeTurn]);

  const statusInfoRef = useRef<VoiceStatusInfo>(statusInfo);
  useEffect(() => {
    statusInfoRef.current = statusInfo;
  }, [statusInfo]);

  useEffect(() => {
    (window as any).__simulateVoicePrompt = simulateVoicePrompt;
    (window as any).__handleParsedInput = handleParsedInput;
    (window as any).__navigate = navigate;
    (window as any).__getActiveTurn = () => activeTurnRef.current;
    (window as any).__getStatusInfo = () => statusInfoRef.current;
    return () => {
      delete (window as any).__simulateVoicePrompt;
      delete (window as any).__handleParsedInput;
      delete (window as any).__navigate;
      delete (window as any).__getActiveTurn;
      delete (window as any).__getStatusInfo;
    };
  }, [simulateVoicePrompt, handleParsedInput, navigate]);

  const speakMessage = useCallback(
    (text: string, lang?: string, onDone?: () => void) => {
      const targetLang =
        lang ||
        activeLanguageState.ttsLanguage ||
        (activeLanguageState.conversationLanguage === 'ta' ? 'ta-IN' : 'en-IN');
      isSpeakingRef.current = true;
      setVoiceState('AI_SPEAKING');
      const isTa = targetLang.toLowerCase().startsWith('ta');
      setStatusInfo((prev) => ({
        ...prev,
        state: 'AI_SPEAKING',
        title: isTa ? 'NEXDO குரல் பேசுகிறது' : 'NEXDO Voice Speaking',
        description: text,
      }));

      lastSpokenResponseRef.current = { text, lang: targetLang };

      ttsService.speakResponse(text, {
        lang: targetLang,
        onStart: () => {
          isSpeakingRef.current = true;
          setVoiceState('AI_SPEAKING');
        },
        onEnd: () => {
          isSpeakingRef.current = false;
          setVoiceState('IDLE');
          if (onDone) onDone();
        },
        onError: () => {
          isSpeakingRef.current = false;
          setVoiceState('IDLE');
          if (onDone) onDone();
        },
      });
    },
    [activeLanguageState]
  );

  const setPendingConfirmation = useCallback(
    (action: CanonicalAction | null, message?: string) => {
      pendingActionRef.current = action;
      if (action) {
        const isTa = activeLanguageState.conversationLanguage === 'ta';
        setVoiceState('CONFIRMATION');
        setStatusInfo({
          state: 'CONFIRMATION',
          title: isTa ? 'உறுதிப்படுத்த வேண்டும்' : 'Confirmation Needed',
          description: message || (isTa ? 'இந்த செயலைச் செய்ய உறுதிப்படுத்தவும்' : 'Please confirm to execute this action'),
          transcript: '',
          confidence: 1,
        });
      } else {
        setVoiceState('IDLE');
      }
    },
    [activeLanguageState]
  );

  const confirmPendingAction = useCallback(() => {
    if (pendingActionRef.current) {
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      setVoiceState('SUCCESS');
      audioFeedback.playSuccessChime();
      const isTa = activeLanguageState.conversationLanguage === 'ta';
      setStatusInfo({
        state: 'SUCCESS',
        title: isTa ? 'உறுதி செய்யப்பட்டது!' : 'Confirmed!',
        description: isTa ? 'செயல் வெற்றிகரமாக உறுதி செய்யப்பட்டது' : 'Action confirmed successfully',
        transcript: '',
        confidence: 1,
      });

      let handledByPage = false;
      const pageHandlers = [...pageActionHandlersRef.current];
      for (let i = pageHandlers.length - 1; i >= 0; i--) {
        try {
          const res = pageHandlers[i](action);
          if (res) {
            handledByPage = true;
            break;
          }
        } catch (err) {
          console.error('[VoiceContext] Error in page action handler during confirmation:', err);
        }
      }

      if (!handledByPage) {
        if (actionCallbackRef.current) {
          actionCallbackRef.current(action);
        } else {
          const isTech = location.pathname.startsWith('/technician');
          dispatchCanonicalAction(action, {
            navigate,
            role: isTech ? 'technician' : 'customer',
            currentRoute: location.pathname,
            showToast,
          });
        }
      }

      setTimeout(() => {
        setVoiceState('IDLE');
      }, 1500);
    }
  }, [location.pathname, navigate, showToast, activeLanguageState]);

  const cancelPendingAction = useCallback(() => {
    pendingActionRef.current = null;
    updateConversationContext({ pendingConfirmationAction: null, conversationState: 'IDLE' });
    setVoiceState('IDLE');
    const isTa = activeLanguageState.conversationLanguage === 'ta';
    const cfg = getLanguageConfig(isTa ? 'ta' : 'en');
    setStatusInfo({
      state: 'IDLE',
      title: cfg.statusPrompts.idleTitle,
      description: cfg.statusPrompts.idleDescription,
      transcript: '',
      confidence: 1,
      languageState: activeLanguageState,
    });
  }, [updateConversationContext, activeLanguageState]);

  return (
    <VoiceContext.Provider
      value={{
        voiceState,
        statusInfo,
        activeTranscript,
        isListening: voiceState === 'LISTENING',
        isSpeaking: voiceState === 'AI_SPEAKING',
        turns,
        activeTurn,
        startListening,
        stopListening,
        simulateVoicePrompt,
        speakMessage,
        stopSpeaking,
        replayResponse,
        resetVoice,
        setActionCallback,
        registerPageActionHandler,
        setPendingConfirmation,
        confirmPendingAction,
        cancelPendingAction,
        activeLanguageState,
        conversationContext,
        setConversationContext,
        updateConversationContext,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = (): VoiceContextType => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
};
