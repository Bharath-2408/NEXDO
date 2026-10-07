import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { FloatingVoiceButton } from '../../components/voice/FloatingVoiceButton';
import { Toast } from '../../components/ui/Toast';
import { useApp } from '../../store/AppContext';
import { useVoice } from '../../voice/VoiceContext';

export const SplashPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast, clearToast } = useApp();
  const { startListening, updateConversationContext, registerPageActionHandler } = useVoice();

  useEffect(() => {
    updateConversationContext({
      currentScreen: '/',
      role: 'customer',
    });

    const unregister = registerPageActionHandler((action) => {
      if (action.type === 'NAVIGATE_ONBOARDING' || action.type === 'CONTINUE' || action.type === 'START_BOOKING') {
        navigate('/onboarding');
        return true;
      }
      if (action.type === 'NAVIGATE_LOGIN' || action.type === 'SUBMIT_LOGIN') {
        navigate('/login');
        return true;
      }
      if (action.type === 'SWITCH_ROLE_CUSTOMER') {
        navigate('/customer');
        return true;
      }
      if (action.type === 'SWITCH_ROLE_TECHNICIAN') {
        navigate('/technician');
        return true;
      }
      return false;
    });

    return unregister;
  }, [navigate, updateConversationContext, registerPageActionHandler]);

  return (
    <div className="min-h-screen bg-[#071A36] text-white flex flex-col justify-between p-6 sm:p-10 select-none">
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}

      {/* Top Brand Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-sky-400 font-black text-xl border border-white/15">
            N
          </div>
          <span className="text-xl font-black tracking-tight text-white">NEXDO</span>
        </div>
        <span className="px-3 py-1 rounded-full bg-white/10 text-sky-300 text-xs font-semibold border border-white/15">
          Startup Foundation
        </span>
      </div>

      {/* Hero Center Statement */}
      <div className="max-w-md mx-auto my-auto text-center py-10">
        <button
          type="button"
          onClick={() => startListening()}
          className="w-20 h-20 rounded-3xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center mx-auto mb-6 shadow-xl relative cursor-pointer hover:bg-blue-600/50 hover:scale-105 transition-all focus:outline-none"
          title="Click to speak"
          aria-label="Click to speak with NEXDO voice assistant"
        >
          <Mic className="w-10 h-10 text-sky-300 animate-pulse" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-[#071A36]" />
        </button>

        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
          Just say what you need.
        </h1>
        <p className="text-slate-300 text-sm sm:text-base mt-3 leading-relaxed">
          Voice-first, intent-driven service coordination. No manual category browsing. Just tell NEXDO and get it handled.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-sky-200">
          <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">Voice-First</span>
          <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">Single Account</span>
          <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">Tamil & English (MVP)</span>
          <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">Zero Commission</span>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="max-w-sm w-full mx-auto space-y-3">
        <Button
          fullWidth
          size="lg"
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg"
          onClick={() => navigate('/onboarding')}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Get Started
        </Button>
        <button
          onClick={() => navigate('/login')}
          className="w-full py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
        >
          Already have an account? Sign In
        </button>
      </div>

      {/* Floating Voice Assistant */}
      <FloatingVoiceButton />
    </div>
  );
};
