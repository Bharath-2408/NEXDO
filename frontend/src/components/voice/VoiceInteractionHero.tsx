import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  Square,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { useVoice } from '../../voice/VoiceContext';
import { VoiceWaveform } from './VoiceWaveform';

export const VoiceInteractionHero: React.FC = () => {
  const {
    voiceState,
    statusInfo,
    startListening,
    stopListening,
    stopSpeaking,
    replayResponse,
    simulateVoicePrompt,
    isListening,
    isSpeaking,
    activeLanguageState,
    confirmPendingAction,
    cancelPendingAction,
    activeTranscript,
  } = useVoice();

  const [textInput, setTextInput] = useState('');

  const samplePrompts = [
    { label: 'AC Service (Tamil)', text: 'எனக்கு AC சர்வீஸ் வேண்டும்', lang: 'ta' },
    { label: 'TV Repair (Spoken)', text: 'TV repair venum', lang: 'ta' },
    { label: 'Fan Repair (English)', text: 'Need an electrician to fix fan', lang: 'en' },
    { label: 'My Bookings', text: 'என் முன்பதிவுகளைக் காட்டு', lang: 'ta' },
    { label: 'Track Tech', text: 'Where is my technician?', lang: 'en' },
    { label: 'Plumber', text: 'Plumbing leak fix venum', lang: 'ta' },
  ];

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    simulateVoicePrompt(textInput.trim());
    setTextInput('');
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 text-center relative overflow-hidden">
      {/* Background ambient accent */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-50 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-50/50 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Header Statement */}
      <div className="max-w-xl mx-auto mb-5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-2.5 select-none">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Voice-First Service Coordination</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#071A36] tracking-tight">
          Just say what you need.
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm mt-1.5 leading-relaxed max-w-md mx-auto">
          Speak naturally in <strong>Tamil</strong> or <strong>English</strong>. NEXDO identifies your problem, locates verified technicians, and coordinates your service in seconds.
        </p>
      </div>

      {/* Primary Voice Mic Control */}
      <div className="flex flex-col items-center justify-center my-4 sm:my-6">
        <div className="relative flex items-center justify-center">
          {/* Active pulse ring when listening */}
          {isListening && (
            <div className="absolute -inset-3 rounded-full border-2 border-blue-500/50 animate-ping" />
          )}

          {/* Speaking ring when AI is speaking */}
          {isSpeaking && (
            <div className="absolute -inset-3 rounded-full border-2 border-emerald-500/50 animate-pulse" />
          )}

          <button
            onClick={() => {
              if (isListening) {
                stopListening();
              } else if (isSpeaking) {
                stopSpeaking();
              } else {
                startListening();
              }
            }}
            className={`relative z-10 w-22 h-22 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center transition-all duration-200 focus-ring shadow-md cursor-pointer select-none ${
              isListening
                ? 'bg-blue-600 text-white shadow-blue-500/30 ring-4 ring-blue-100 scale-105'
                : isSpeaking
                ? 'bg-emerald-600 text-white shadow-emerald-500/30 ring-4 ring-emerald-100'
                : 'bg-[#071A36] text-white hover:bg-[#0c2a54] hover:scale-105 active:scale-95'
            }`}
            aria-label={
              isListening
                ? 'Stop listening'
                : isSpeaking
                ? 'Stop speaking'
                : 'Start speaking what you need'
            }
          >
            {isListening ? (
              <MicOff className="w-8 h-8 text-white" />
            ) : isSpeaking ? (
              <Volume2 className="w-8 h-8 text-white animate-bounce" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
            <span className="text-[10px] font-bold mt-1 tracking-wide opacity-95">
              {isListening ? 'Stop' : isSpeaking ? 'Speaking...' : 'Speak'}
            </span>
          </button>
        </div>

        {/* State Label & Conversational Response */}
        <div className="mt-4 min-h-[64px] max-w-lg mx-auto flex flex-col items-center justify-center px-4 w-full">
          {/* 1. LISTENING */}
          {isListening && (
            <div className="flex flex-col items-center animate-fade-in w-full">
              <VoiceWaveform isActive={true} color="#2563EB" />
              <p className="text-xs font-semibold text-blue-700 tracking-wide mt-2">
                Listening... Speak naturally in Tamil or English
              </p>
              {activeTranscript && (
                <p className="text-xs font-mono bg-blue-50 text-blue-900 px-3 py-1 rounded-md mt-1.5 max-w-sm truncate">
                  "{activeTranscript}"
                </p>
              )}
            </div>
          )}

          {/* 2. PROCESSING or UNDERSTANDING */}
          {(voiceState === 'PROCESSING' || voiceState === 'UNDERSTANDING') && (
            <div className="flex items-center gap-2 text-slate-700 animate-pulse">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
              <p className="text-xs font-semibold text-slate-700">
                {voiceState === 'PROCESSING'
                  ? 'Processing audio...'
                  : 'Understanding your intent and entities...'}
              </p>
            </div>
          )}

          {/* 3. CONFIRMATION REQUIRED (Critical Action Confirmation Card) */}
          {(voiceState === 'CONFIRMATION_REQUIRED' || voiceState === 'CONFIRMATION') && (
            <div className="w-full p-4 rounded-2xl bg-amber-50 border border-amber-300 text-left animate-fade-in shadow-xs">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider mb-1.5">
                <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Confirmation Required / உறுதிப்படுத்தவும்</span>
              </div>
              <p className="text-sm font-semibold text-amber-950 mb-3 leading-relaxed">
                {statusInfo.description}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={confirmPendingAction}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirm / உறுதி செய்</span>
                </button>
                <button
                  onClick={cancelPendingAction}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel / ரத்து செய்</span>
                </button>
              </div>
            </div>
          )}

          {/* 4. AI SPEAKING or SUCCESS (Normalized Tamil script or English response) */}
          {(voiceState === 'AI_SPEAKING' || voiceState === 'SUCCESS') && (
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-left animate-fade-in w-full shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 text-blue-900 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    NEXDO ({activeLanguageState.responseLanguage === 'ta' ? 'தமிழ்' : 'English'})
                  </span>
                </div>
                {/* Audio Controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={replayResponse}
                    className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer"
                    title="Replay Voice Response"
                    aria-label="Replay Voice Response"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  {isSpeaking && (
                    <button
                      onClick={stopSpeaking}
                      className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                      title="Stop Speaking"
                      aria-label="Stop Speaking"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-900 leading-relaxed">
                "{statusInfo.description}"
              </p>
            </div>
          )}

          {/* 5. ERROR or RETRY */}
          {(voiceState === 'ERROR' || voiceState === 'RETRY') && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-left w-full flex items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <p className="text-xs text-rose-900 font-medium">
                  {statusInfo.description || 'Could not understand clearly.'}
                </p>
              </div>
              <button
                onClick={() => startListening()}
                className="px-3 py-1 bg-white border border-rose-300 text-rose-700 rounded-lg text-xs font-semibold shrink-0 hover:bg-rose-100 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* 6. IDLE default tip */}
          {voiceState === 'IDLE' && (
            <p className="text-xs text-slate-500 font-medium italic">
              Try saying: <span className="text-[#071A36] font-semibold">"எனக்கு AC சர்வீஸ் வேண்டும்"</span> or <span className="text-[#071A36] font-semibold">"Need TV repair tomorrow"</span>
            </p>
          )}
        </div>
      </div>

      {/* Text Input Fallback */}
      <form onSubmit={handleManualSubmit} className="max-w-md mx-auto relative mt-2">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type your service need (e.g. AC சர்வீஸ் வேண்டும் or TV repair)..."
            className="flex-1 bg-transparent px-3 py-1.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!textInput.trim()}
            className="bg-[#071A36] text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0 flex items-center gap-1.5 text-xs font-semibold"
            aria-label="Submit need"
          >
            <span>Ask</span>
            <Send className="w-3 h-3" />
          </button>
        </div>
      </form>

      {/* Natural Conversational Quick Samples */}
      <div className="mt-5 max-w-lg mx-auto">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Suggested Requests (Tap to test)
        </p>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => simulateVoicePrompt(prompt.text)}
              className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 text-[11px] font-medium border border-slate-200 hover:border-blue-200 transition-all focus-ring text-left cursor-pointer active:scale-98"
              title={prompt.text}
            >
              <span>{prompt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
