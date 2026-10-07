import React, { useState } from 'react';
import { Check, Globe, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { SUPPORTED_LANGUAGES, FUTURE_ROADMAP_LANGUAGES } from '../../constants/languages';
import { useApp } from '../../store/AppContext';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({ isOpen, onClose }) => {
  const { selectedLanguage, setLanguage } = useApp();
  const [showRoadmap, setShowRoadmap] = useState(false);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Language / மொழி தேர்வு" maxWidth="md">
      <div className="text-left space-y-4">
        <div>
          <p className="text-xs text-slate-500">
            NEXDO supports native voice & intent interaction in <strong>Tamil</strong> and <strong>English</strong>.
          </p>
        </div>

        {/* Active MVP Languages */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Active Languages (MVP)
          </label>
          <div className="grid grid-cols-1 gap-2.5">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = selectedLanguage.code === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    onClose();
                  }}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all duration-150 focus-ring cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/80 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      isSelected ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {lang.code === 'ta' ? 'த' : 'En'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-[#080B10]">{lang.nativeName}</span>
                        <span className="text-xs font-semibold text-slate-500">({lang.name})</span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          Voice Ready
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {lang.code === 'ta' 
                          ? 'குரல் மற்றும் உரை ஒருங்கிணைப்பு (Tamil Nadu)' 
                          : 'Voice & text intent coordination (Pan-India)'}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Future Indian Scheduled Languages (Roadmap) */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowRoadmap(!showRoadmap)}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 hover:text-slate-800 py-1 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              Upcoming Scheduled Languages ({FUTURE_ROADMAP_LANGUAGES.length})
            </span>
            {showRoadmap ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showRoadmap && (
            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <p className="text-[11px] text-slate-500 mb-2">
                NEXDO is architected to expand to all 22 Indian Scheduled Languages in subsequent phases.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                {FUTURE_ROADMAP_LANGUAGES.map((fLang) => (
                  <div
                    key={fLang.code}
                    className="p-2 bg-white rounded-lg border border-slate-200 text-left text-xs opacity-75"
                  >
                    <span className="font-semibold text-slate-700 block">{fLang.nativeName}</span>
                    <span className="text-[10px] text-slate-400">{fLang.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
