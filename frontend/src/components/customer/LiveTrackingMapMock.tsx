import React from 'react';
import { Navigation, Phone } from 'lucide-react';
import { Booking } from '../../types/customer';

interface LiveTrackingMapMockProps {
  booking: Booking;
  onAdvanceStep?: () => void;
}

export const LiveTrackingMapMock: React.FC<LiveTrackingMapMockProps> = ({
  booking,
  onAdvanceStep,
}) => {
  return (
    <div className="w-full bg-slate-900 rounded-3xl overflow-hidden relative border border-slate-700/80 shadow-md">
      {/* Visual map simulation grid */}
      <div className="h-64 sm:h-72 w-full bg-[#0d1b2a] relative overflow-hidden flex items-center justify-center">
        {/* Road line grid */}
        <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2563EB" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          {/* Simulated route path */}
          <path
            d="M 50 200 C 150 150, 200 80, 320 120"
            fill="none"
            stroke="#38BDF8"
            strokeWidth="4"
            strokeDasharray="6 4"
          />
        </svg>

        {/* Customer Location Pin */}
        <div className="absolute top-16 right-16 sm:right-28 flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-black animate-bounce">
            🏠
          </div>
          <span className="px-2 py-0.5 rounded-full bg-slate-900/90 text-white text-[10px] font-semibold mt-1">
            Your Location
          </span>
        </div>

        {/* Technician Moving Pin */}
        <div className="absolute bottom-16 left-12 sm:left-24 flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white relative">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping absolute" />
            <Navigation className="w-5 h-5 text-white transform rotate-45" />
          </div>
          <span className="px-2 py-0.5 rounded-full bg-blue-900/90 text-sky-200 text-[10px] font-semibold mt-1">
            {booking.provider.name} (~18m)
          </span>
        </div>

        {/* Live Distance Overlay */}
        <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-left text-white text-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live GPS Tracking (Adyar Sector 4)</span>
        </div>
      </div>

      {/* Technician quick communication bar */}
      <div className="p-4 bg-slate-800 text-white flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <img
            src={booking.provider.avatar}
            alt={booking.provider.name}
            className="w-12 h-12 rounded-xl object-cover border border-slate-600"
          />
          <div className="text-left">
            <h4 className="font-bold text-sm text-white">{booking.provider.name}</h4>
            <p className="text-xs text-sky-300">{booking.serviceTitle}</p>
            <span className="text-[11px] text-slate-400">OTP Code: {booking.otpCode}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <a
            href={`tel:${booking.provider.phone}`}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call</span>
          </a>
          {onAdvanceStep && (
            <button
              onClick={onAdvanceStep}
              className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-sky-300 border border-slate-600 transition-colors"
            >
              Simulate Progress Step →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
