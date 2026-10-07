import React, { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}

      {/* Top Brand Bar */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between pt-2">
        <Link to="/" className="flex items-center gap-2 focus-ring rounded-lg">
          <div className="w-8 h-8 rounded-xl bg-[#071A36] flex items-center justify-center text-sky-400 font-black text-sm">
            N
          </div>
          <span className="text-base font-black tracking-tight text-[#071A36]">
            NEXDO
          </span>
        </Link>
        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Verified Platform</span>
        </div>
      </div>

      {/* Auth Content Area */}
      <main className="w-full max-w-md mx-auto my-auto py-6">
        <Outlet />
      </main>

      {/* Floating Voice Assistant */}
      <FloatingVoiceButton />

      {/* Footer Disclaimer */}
      <footer className="w-full max-w-md mx-auto text-center pb-4 text-[11px] text-slate-400">
        NEXDO Platform · One account for Customer & Technician · India 2026
      </footer>
    </div>
  );
};
