import React, { useState } from 'react';
import { Play, Square, Sparkles, Wrench, Clock, MapPin, IndianRupee } from 'lucide-react';
import { useVoice } from '../../voice/VoiceContext';
import { useApp } from '../../store/AppContext';
import { JobOpportunity } from '../../types/technician';

interface VoiceAnnouncementBannerProps {
  opportunity?: JobOpportunity;
  announcementTamil?: string;
  announcementEnglish?: string;
}

export const VoiceAnnouncementBanner: React.FC<VoiceAnnouncementBannerProps> = ({
  opportunity,
  announcementTamil: propTamil,
  announcementEnglish: propEnglish,
}) => {
  const { speakMessage, isSpeaking, stopSpeaking } = useVoice();
  const { selectedLanguage } = useApp();
  const [isPlaying, setIsPlaying] = useState(false);

  if (!opportunity && !propTamil && !propEnglish) {
    return null;
  }

  const isTamilMode = selectedLanguage.code.toLowerCase().startsWith('ta');
  const serviceMode = opportunity?.serviceMode || (opportunity?.diagnosisFee ? 'DIAGNOSIS' : 'SERVICE');
  const isDiagnosis = serviceMode === 'DIAGNOSIS';

  const announcementTamil =
    opportunity?.announcementTamil ||
    propTamil ||
    (isDiagnosis
      ? `உங்களுக்கு ஒரு புதிய ${opportunity?.serviceName || 'சேவை'} request வந்திருக்கு. நேரம்: ${opportunity?.requestedTime}. தூரம் ${opportunity?.distanceKm} கி.மீ. பரிசோதனைக் கட்டணம் ₹${opportunity?.diagnosisFee || 149}. Accept பண்ணலாமா?`
      : `உங்களுக்கு ஒரு புதிய நேரடி ${opportunity?.serviceName || 'சேவை'} request வந்திருக்கு. நேரம்: ${opportunity?.requestedTime}. தூரம் ${opportunity?.distanceKm} கி.மீ. நேரடி சர்வீஸ் கோரப்பட்டுள்ளது. Accept பண்ணலாமா?`);

  const announcementEnglish =
    opportunity?.announcementEnglish ||
    propEnglish ||
    (isDiagnosis
      ? `New ${opportunity?.serviceName || 'service'} request. Scheduled: ${opportunity?.requestedTime}. Distance: ${opportunity?.distanceKm} km. Diagnosis fee ₹${opportunity?.diagnosisFee || 149}. Would you like to accept?`
      : `New direct ${opportunity?.serviceName || 'service'} request. Scheduled: ${opportunity?.requestedTime}. Distance: ${opportunity?.distanceKm} km. Direct service requested. Would you like to accept?`);

  const handlePlayVoice = () => {
    if (isPlaying || isSpeaking) {
      stopSpeaking();
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    if (isTamilMode) {
      speakMessage(announcementTamil, 'ta-IN', () => {
        setIsPlaying(false);
      });
    } else {
      speakMessage(announcementEnglish, 'en-IN', () => {
        setIsPlaying(false);
      });
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 shadow-md text-left mb-6 relative overflow-hidden border border-blue-800/60">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-800 text-sky-300 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>{isTamilMode ? 'AI குரல் அறிவிப்பு (Tamil Audio)' : 'AI Voice Broadcast'}</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                isDiagnosis
                  ? 'bg-amber-400/20 text-amber-200 border border-amber-400/30'
                  : 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30'
              }`}
            >
              {isDiagnosis ? 'Diagnosis Mode' : 'Direct Service'}
            </span>
          </div>

          {/* Structured Request Chips */}
          {opportunity && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-800/80 text-blue-100 font-semibold border border-blue-700/50">
                <Wrench className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>{opportunity.serviceName}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-800/80 text-blue-100 font-semibold border border-blue-700/50">
                <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>{opportunity.requestedTime}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-800/80 text-blue-100 font-semibold border border-blue-700/50">
                <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>{opportunity.distanceKm} km</span>
              </span>
              {isDiagnosis && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-900/60 text-amber-200 font-semibold border border-amber-500/40">
                  <IndianRupee className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>₹{opportunity.diagnosisFee || 149} Diagnosis Fee</span>
                </span>
              )}
            </div>
          )}

          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-semibold text-blue-50 leading-relaxed">
              "{isTamilMode ? announcementTamil : announcementEnglish}"
            </p>
            <p className="text-[11px] text-blue-200/80 italic">
              {isTamilMode ? `English: "${announcementEnglish}"` : `Tamil: "${announcementTamil}"`}
            </p>
          </div>
        </div>

        <button
          onClick={handlePlayVoice}
          className="p-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shrink-0 transition-all active:scale-95 focus-ring shadow-lg"
          aria-label="Listen to voice announcement"
          title="Play voice announcement"
        >
          {isPlaying ? <Square className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
        </button>
      </div>
    </div>
  );
};
