import React, { useState } from 'react';
import {
  Mic,
  Square,
  RotateCcw,
  X,
  Volume2,
  Loader2,
  AlertCircle,
  Check,
  CornerDownRight,
} from 'lucide-react';
import { useVoice } from '../../voice/VoiceContext';

export const FloatingVoiceButton: React.FC = () => {
  const {
    voiceState,
    statusInfo,
    activeTranscript,
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    stopSpeaking,
    replayResponse,
    resetVoice,
    activeTurn,
    activeLanguageState,
    confirmPendingAction,
    cancelPendingAction,
  } = useVoice();

  const [isDismissed, setIsDismissed] = useState(false);
  const [prevVoiceState, setPrevVoiceState] = useState(voiceState);

  // Auto-reopen card when voice becomes active again (standard React pattern)
  if (voiceState !== prevVoiceState) {
    setPrevVoiceState(voiceState);
    if (voiceState !== 'IDLE') {
      setIsDismissed(false);
    }
  }

  const handleFabClick = () => {
    if (isSpeaking) {
      // Tap while assistant is speaking -> Interrupt & start listening
      startListening();
      setIsDismissed(false);
    } else if (isListening) {
      // Tap while listening -> Stop listening
      stopListening();
    } else {
      // Tap to start listening
      startListening();
      setIsDismissed(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (isSpeaking) {
      stopSpeaking();
    }
    if (voiceState === 'SUCCESS' || voiceState === 'ERROR') {
      resetVoice();
    }
  };

  const hasContentToShow =
    !isDismissed &&
    voiceState !== 'IDLE' &&
    (activeTranscript ||
      statusInfo.conversationalResponse?.text ||
      statusInfo.description ||
      activeTurn);

  const displayTranscript =
    activeTranscript || activeTurn?.rawTranscript || statusInfo.transcript;
  const displayResponse =
    statusInfo.conversationalResponse?.text ||
    activeTurn?.responseText ||
    (voiceState === 'AI_SPEAKING' || voiceState === 'SUCCESS'
      ? statusInfo.description
      : '');
  const displayLang =
    activeLanguageState.responseLanguage === 'ta' ||
    statusInfo.languageState?.responseLanguage === 'ta'
      ? 'TA'
      : 'EN';

  return (
    <div
      className="fixed z-40 flex flex-col items-end pointer-events-none right-4 bottom-[calc(76px+env(safe-area-inset-bottom,0px))] md:right-6 md:bottom-6"
    >
      <div className="pointer-events-auto flex flex-col items-end">
        {/* Floating Context & Response Card */}
        {hasContentToShow && (
          <div
            className="mb-3 w-80 max-w-[calc(100vw-32px)] bg-[#071A36]/95 backdrop-blur-md text-white border border-slate-700/60 shadow-2xl rounded-2xl p-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-3"
            role="region"
            aria-live="polite"
            aria-label="Voice Assistant Response"
          >
            {/* Header: Status / Detected Language / Dismiss */}
            <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                    displayLang === 'TA'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  }`}
                >
                  {displayLang}
                </span>

                <span className="text-[11px] font-medium text-slate-300 truncate max-w-[170px]">
                  {voiceState === 'LISTENING' && 'கேட்கிறேன்... / Listening...'}
                  {voiceState === 'PROCESSING' && 'செயலாக்குகிறது... / Processing...'}
                  {voiceState === 'UNDERSTANDING' && 'புரிந்து கொள்கிறது... / Understanding...'}
                  {voiceState === 'AI_SPEAKING' && 'பதிலளிக்கிறது... / Speaking...'}
                  {voiceState === 'SUCCESS' && (statusInfo.conversationalResponse?.actionSummary || 'முடிந்தது / Complete')}
                  {voiceState === 'CONFIRMATION_REQUIRED' && 'உறுதிப்படுத்தவும் / Confirm'}
                  {voiceState === 'ERROR' && 'பிழை / Error'}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {displayResponse && (
                  <button
                    onClick={replayResponse}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Replay Spoken Response"
                    aria-label="Replay response"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={handleDismiss}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Close Card"
                  aria-label="Close voice response card"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* User Transcript */}
            {displayTranscript && (
              <div className="mb-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  You said:
                </span>
                <p className="text-xs text-sky-200 font-medium italic mt-0.5 line-clamp-2">
                  &ldquo;{displayTranscript}&rdquo;
                </p>
              </div>
            )}

            {/* Assistant Spoken Response */}
            {displayResponse && (
              <div className="mt-2 pt-2 border-t border-white/10">
                <div className="flex items-start gap-1.5">
                  <CornerDownRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-100 font-semibold leading-relaxed">
                    {displayResponse}
                  </p>
                </div>
              </div>
            )}

            {/* Confirmation actions if needed */}
            {voiceState === 'CONFIRMATION_REQUIRED' && (
              <div className="mt-3 flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={confirmPendingAction}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-xs cursor-pointer transition-colors"
                >
                  Confirm / உறுதி செய்
                </button>
                <button
                  onClick={cancelPendingAction}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-slate-300 cursor-pointer transition-colors"
                >
                  Cancel / ரத்து செய்
                </button>
              </div>
            )}
          </div>
        )}

        {/* The 56px x 56px Floating Microphone Button */}
        <div className="relative group">
          {/* Expanding pulse ring during listening */}
          {isListening && (
            <span className="absolute -inset-1 rounded-full bg-sky-400/40 animate-ping pointer-events-none" />
          )}

          {/* Sound wave expansion during speaking */}
          {isSpeaking && (
            <span className="absolute -inset-1 rounded-full bg-emerald-400/30 animate-pulse pointer-events-none" />
          )}

          <button
            onClick={handleFabClick}
            type="button"
            aria-label="Voice assistant / குரல் உதவி"
            title={
              isSpeaking
                ? 'Speaking… (Click to interrupt)'
                : isListening
                ? 'Listening… (Click to stop)'
                : voiceState === 'PROCESSING' || voiceState === 'UNDERSTANDING'
                ? 'Understanding…'
                : voiceState === 'ERROR'
                ? 'Error'
                : 'Tap to speak / பேச தொடங்கு'
            }
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xl focus:outline-none focus:ring-4 focus:ring-sky-400/50 active:scale-95 ${
              isListening
                ? 'bg-sky-500 text-white ring-4 ring-sky-300/50 shadow-sky-500/40'
                : isSpeaking
                ? 'bg-emerald-600 text-white ring-4 ring-emerald-300/40 shadow-emerald-600/40'
                : voiceState === 'PROCESSING' || voiceState === 'UNDERSTANDING'
                ? 'bg-indigo-600 text-white ring-4 ring-indigo-300/30 shadow-indigo-600/40'
                : voiceState === 'ERROR' || voiceState === 'RETRY'
                ? 'bg-rose-600 text-white ring-4 ring-rose-300/30 shadow-rose-600/40'
                : 'bg-[#071A36] text-white hover:bg-[#0d2a54] ring-2 ring-white/20 shadow-slate-900/40'
            }`}
          >
            {isListening ? (
              <Square className="w-5 h-5 fill-current animate-pulse" />
            ) : isSpeaking ? (
              <Volume2 className="w-6 h-6 animate-bounce" />
            ) : voiceState === 'PROCESSING' || voiceState === 'UNDERSTANDING' ? (
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            ) : voiceState === 'ERROR' || voiceState === 'RETRY' ? (
              <AlertCircle className="w-6 h-6 text-white" />
            ) : voiceState === 'SUCCESS' ? (
              <Check className="w-6 h-6 text-emerald-300" />
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
