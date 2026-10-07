import React from 'react';
import { Mic, Check, AlertCircle, Sparkles, Volume2, Square, RotateCcw } from 'lucide-react';
import { useVoice } from '../../voice/VoiceContext';

export const VoiceStatusBar: React.FC = () => {
  const {
    voiceState,
    statusInfo,
    isListening,
    isSpeaking,
    stopListening,
    stopSpeaking,
    replayResponse,
    confirmPendingAction,
    cancelPendingAction,
  } = useVoice();

  if (voiceState === 'IDLE') return null;

  return (
    <div className="w-full bg-[#071A36] text-white px-4 py-2.5 rounded-lg mb-4 flex items-center justify-between gap-3 shadow-xs animate-fade-in text-left">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center shrink-0">
          {isListening ? (
            <Mic className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
          ) : isSpeaking ? (
            <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
          ) : voiceState === 'SUCCESS' ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : voiceState === 'CONFIRMATION' || voiceState === 'CONFIRMATION_REQUIRED' ? (
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          ) : voiceState === 'ERROR' || voiceState === 'RETRY' ? (
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-sky-300" />
          )}
        </div>
        <div className="min-w-0">
          <span className="text-[10px] uppercase font-bold text-sky-300 block tracking-wider">
            {statusInfo.title}
          </span>
          <p className="text-xs text-slate-200 truncate font-medium">
            {statusInfo.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {isListening && (
          <button
            onClick={stopListening}
            className="px-2 py-1 rounded bg-white/15 hover:bg-white/20 text-[11px] font-semibold text-white transition-colors cursor-pointer"
          >
            Done
          </button>
        )}

        {isSpeaking && (
          <button
            onClick={stopSpeaking}
            className="px-2 py-1 rounded bg-rose-500/30 hover:bg-rose-500/40 text-[11px] font-semibold text-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Square className="w-2.5 h-2.5 fill-current" />
            <span>Stop</span>
          </button>
        )}

        {(voiceState === 'CONFIRMATION' || voiceState === 'CONFIRMATION_REQUIRED') && (
          <div className="flex items-center gap-1">
            <button
              onClick={confirmPendingAction}
              className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-[11px] font-semibold text-white transition-colors cursor-pointer"
            >
              Confirm
            </button>
            <button
              onClick={cancelPendingAction}
              className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

        {(voiceState === 'SUCCESS' || voiceState === 'AI_SPEAKING') && (
          <button
            onClick={replayResponse}
            className="p-1 rounded bg-white/10 hover:bg-white/20 text-sky-300 transition-colors cursor-pointer"
            title="Replay Spoken Response"
            aria-label="Replay Spoken Response"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
