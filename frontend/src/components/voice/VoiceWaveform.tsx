import React from 'react';

interface VoiceWaveformProps {
  isActive: boolean;
  color?: string;
  barCount?: number;
}

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({
  isActive,
  color = '#2563EB',
  barCount = 5,
}) => {
  return (
    <div className="flex items-center justify-center gap-1 h-8 px-2" aria-hidden="true">
      {Array.from({ length: barCount }).map((_, i) => (
        <span
          key={i}
          className="w-1 rounded-full transition-all duration-300"
          style={{
            backgroundColor: color,
            height: isActive ? `${12 + (i % 3) * 10}px` : '4px',
            animation: isActive ? `pulse-bar 0.9s ease-in-out infinite ${i * 0.15}s` : 'none',
          }}
        />
      ))}
      <style>{`
        @keyframes pulse-bar {
          0%, 100% { height: 6px; }
          50% { height: 26px; }
        }
      `}</style>
    </div>
  );
};
