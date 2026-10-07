import React, { useState } from 'react';
import { Mic, Sparkles, Check, ArrowRight } from 'lucide-react';
import { VoiceFormFiller } from '../../voice/voiceFormFiller';
import { VoiceEntityExtractionResult } from '../../types/voice';
import { audioFeedback } from '../../voice/voiceEngine';

interface VoiceFormFillerCardProps {
  onApplyFields: (entities: VoiceEntityExtractionResult['entities']) => void;
  title?: string;
  subtitle?: string;
}

export const VoiceFormFillerCard: React.FC<VoiceFormFillerCardProps> = ({
  onApplyFields,
  title = 'Voice Profile Form Filling',
  subtitle = 'Speak your details naturally. NEXDO extracts and fills form fields automatically.',
}) => {
  const [extraction, setExtraction] = useState<VoiceEntityExtractionResult | null>(null);

  const demoPhrases = [
    {
      label: 'Complete Profile (Tamil)',
      phrase: 'En peyar Hariharasudhan, en date of birth 24-8-2007, en phone number 9876543210, Karur district, Tamil Nadu',
    },
    {
      label: 'Name & Phone Only',
      phrase: 'En peyar Ravi Kumar, phone number 9840122334, Chennai district, Tamil Nadu',
    },
    {
      label: 'English Natural',
      phrase: 'My name is Senthil Murugan, date of birth 15/05/1992, mobile 9791088221, Karur district',
    },
  ];

  const handleTestExtraction = (phrase: string) => {
    audioFeedback.playListeningChime();
    const result = VoiceFormFiller.extractEntities(phrase);
    setExtraction(result);
  };

  const handleConfirmAndApply = () => {
    if (extraction) {
      audioFeedback.playSuccessChime();
      onApplyFields(extraction.entities);
    }
  };

  return (
    <div className="bg-gradient-to-b from-blue-50/60 to-white rounded-2xl border border-blue-200/80 p-5 text-left mb-6">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Voice Form Filler Architecture</span>
          </div>
          <h4 className="text-base font-bold text-[#071A36]">{title}</h4>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
      </div>

      {/* Voice sample quick fill triggers */}
      <div className="my-3">
        <p className="text-[11px] font-semibold text-slate-500 mb-1.5">
          Tap a test phrase to simulate voice entity extraction:
        </p>
        <div className="flex flex-col gap-1.5">
          {demoPhrases.map((d, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleTestExtraction(d.phrase)}
              className="text-left p-2.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/50 transition-all text-xs text-slate-700 flex items-center justify-between group"
            >
              <div className="min-w-0 pr-2">
                <span className="font-bold text-[#071A36] block">{d.label}</span>
                <span className="italic text-slate-500 truncate block">"{d.phrase}"</span>
              </div>
              <Mic className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Extraction Results Preview */}
      {extraction && (
        <div className="mt-4 p-4 rounded-xl bg-white border border-blue-200 shadow-sm animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>Extracted {extraction.fieldFilledCount} Fields with {Math.round(extraction.confidence * 100)}% Confidence</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Pipeline: Voice → Tokenize → Entity Mapping
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 block">Name</span>
              <span className="font-bold text-slate-900">{extraction.entities.name || '—'}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 block">Date of Birth</span>
              <span className="font-bold text-slate-900">{extraction.entities.dob || '—'}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 block">Phone</span>
              <span className="font-bold text-slate-900">{extraction.entities.phone || '—'}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 block">District</span>
              <span className="font-bold text-slate-900">{extraction.entities.district || '—'}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleConfirmAndApply}
            className="w-full mt-3 py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-98"
          >
            <span>Auto-fill form with extracted data</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
