import React, { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Home } from 'lucide-react';
import { FloatingVoiceButton } from '../components/voice/FloatingVoiceButton';
import { Toast } from '../components/ui/Toast';
import { useApp } from '../store/AppContext';
import { useVoice } from '../voice/VoiceContext';

export const AuthLayout: React.FC = () => {
  const { toast, clearToast } = useApp();
  const { updateConversationContext } = useVoice();
  const location = useLocation();

  useEffect(() => {
    updateConversationContext({
      currentScreen: location.pathname,
      role: 'customer',
    });
  }, [location.pathname, updateConversationContext]);

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-between px-4 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-x-hidden">
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}

      {/* Top Brand & Navigation Header (560–640px centered alignment) */}
      <header className="w-full max-w-[600px] mx-auto flex flex-wrap items-center justify-between gap-3 pt-1 sm:pt-2">
        <div className="flex items-center gap-3">
          <Link
            to="/?public=1"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-slate-700 hover:text-[#071A36] text-xs sm:text-sm font-bold shadow-2xs transition-all focus-ring"
            aria-label="Return to NEXDO Public Home Page"
          >
            <Home className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Home</span>
          </Link>

          <Link to="/?public=1" className="flex items-center gap-2 focus-ring rounded-lg">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#071A36] flex items-center justify-center text-sky-400 font-black text-sm sm:text-base shadow-xs">
              N
            </div>
            <span className="text-base sm:text-lg font-black tracking-tight text-[#071A36]">
              NEXDO
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs font-bold text-emerald-800">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Verified Platform</span>
        </div>
      </header>

      {/* Auth Content Area (Centered 600px max width for laptop & desktop) */}
      <main className="w-full max-w-[600px] mx-auto my-auto py-6 sm:py-8">
        <Outlet />
      </main>

      {/* Floating Voice Assistant */}
      <FloatingVoiceButton />

      {/* Footer Disclaimer kept comfortably separated from the card */}
      <footer className="w-full max-w-[600px] mx-auto text-center pt-4 pb-2 text-xs text-slate-500">
        NEXDO Platform · Voice-First Everyday Services · Zero Booking Commission · 2026
      </footer>
    </div>
  );
};

