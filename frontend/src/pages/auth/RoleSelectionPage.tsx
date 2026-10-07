import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Wrench, ArrowRight, ShieldCheck } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { useVoice } from '../../voice/VoiceContext';
import { UserRole } from '../../types/account';

export const RoleSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectRole, user, showToast } = useApp();
  const { registerPageActionHandler, updateConversationContext } = useVoice();

  const handleRoleSelect = (role: UserRole) => {
    selectRole(role);
    if (role === 'CUSTOMER') {
      showToast('Continuing in Customer Mode', 'info');
      navigate('/customer');
    } else {
      showToast('Continuing in Technician Mode', 'info');
      navigate('/technician');
    }
  };

  useEffect(() => {
    updateConversationContext({
      currentScreen: '/select-role',
    });

    const unregister = registerPageActionHandler((action) => {
      if (action.type === 'SWITCH_ROLE_CUSTOMER') {
        handleRoleSelect('CUSTOMER');
        return true;
      }
      if (action.type === 'SWITCH_ROLE_TECHNICIAN') {
        handleRoleSelect('TECHNICIAN');
        return true;
      }
      return false;
    });

    return unregister;
  }, [registerPageActionHandler, updateConversationContext]);

  return (
    <div className="max-w-2xl mx-auto text-center py-6 px-3 sm:px-4">
      {/* Header & Single Account Notice */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-3 select-none">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>One Account · Dual Access</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#071A36] tracking-tight">
          How do you want to use NEXDO today?
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-2 max-w-md mx-auto leading-relaxed">
          Welcome, {user.name}. Your single verified account allows you to book services or provide skilled services at any time.
        </p>
      </div>

      {/* Two Primary Role Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
        {/* CUSTOMER CARD */}
        <button
          onClick={() => handleRoleSelect('CUSTOMER')}
          className="group p-5 sm:p-6 rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all duration-150 focus-ring active:scale-[0.99] flex flex-col justify-between cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200/60 group-hover:bg-[#071A36] group-hover:text-white group-hover:border-transparent transition-colors">
                <User className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
                Customer View
              </span>
            </div>

            <h3 className="text-base font-extrabold text-[#071A36] tracking-tight">
              CUSTOMER
            </h3>
            <p className="text-xs font-semibold text-blue-600 mt-0.5">
              Book services when you need them.
            </p>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Just say what you need using natural voice or text. Get matched with top local verified technicians with upfront pricing.
            </p>
          </div>

          <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-700 group-hover:text-blue-800">
            <span>Continue as Customer</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        {/* TECHNICIAN CARD */}
        <button
          onClick={() => handleRoleSelect('TECHNICIAN')}
          className="group p-5 sm:p-6 rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all duration-150 focus-ring active:scale-[0.99] flex flex-col justify-between cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="w-11 h-11 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200 group-hover:bg-[#071A36] group-hover:text-white group-hover:border-transparent transition-colors">
                <Wrench className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
                Pro View
              </span>
            </div>

            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-[#071A36] tracking-tight">
                TECHNICIAN
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200/60">
                0% Commission
              </span>
            </div>
            <p className="text-xs font-semibold text-blue-600 mt-0.5">
              Find eligible service opportunities and work.
            </p>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Receive voice-dispatched customer requests across your capabilities. Unlimited eligible jobs with daily or monthly access passes.
            </p>
          </div>

          <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-700 group-hover:text-blue-800">
            <span>Continue as Technician</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>
      </div>

      <p className="text-[11px] text-slate-400 mt-6">
        You can effortlessly switch roles at any time from the top navigation bar.
      </p>
    </div>
  );
};
