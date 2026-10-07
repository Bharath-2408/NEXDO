import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';
import { PRICING_PLANS } from '../../constants/pricing';
import { SubscriptionPlanCard } from '../../components/technician/SubscriptionPlanCard';
import { useTechnician } from '../../store/TechnicianContext';
import { useApp } from '../../store/AppContext';
import { AccessPlan } from '../../types/pricing';

export const TechnicianSubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const { earnings, activateSubscription } = useTechnician();
  const { showToast } = useApp();

  const handleActivate = (plan: AccessPlan) => {
    activateSubscription(plan.type);
    showToast(`Activated ${plan.title}! Unlimited eligible jobs active.`, 'success');
  };

  return (
    <div className="max-w-4xl mx-auto text-left space-y-6">
      <button
        onClick={() => navigate('/technician')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Requests</span>
      </button>

      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Configurable Access Pricing Model</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#071A36]">
          Technician Access Passes
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Unlimited eligible requests during active pass period. Zero commission on customer job payouts.
        </p>
      </div>

      {/* Truthful Model Notice */}
      <div className="p-4 rounded-2xl bg-slate-100/90 border border-slate-200 text-xs text-slate-700 leading-relaxed flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[#071A36] block">Transparent Business Terms</span>
          <p className="text-slate-600 mt-0.5">
            Access pass unlocks full platform functionality and voice broadcasts without per-job commissions.
            NEXDO never promises guaranteed income or artificial job counts. Your jobs depend on actual customer demand in your coverage radius.
          </p>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {PRICING_PLANS.map((plan) => (
          <SubscriptionPlanCard
            key={plan.id}
            plan={plan}
            isCurrent={earnings.activeSubscriptionTitle.includes(
              plan.type === 'DAILY' ? 'Daily' : plan.type === 'WEEKLY' ? 'Weekly' : 'Monthly'
            )}
            onActivate={handleActivate}
          />
        ))}
      </div>
    </div>
  );
};
