import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
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
    <div className="max-w-5xl mx-auto text-left space-y-7 pb-12">
      {/* Back Breadcrumb */}
      <button
        onClick={() => navigate('/technician')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Requests</span>
      </button>

      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Transparent Partner Business Model</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-black text-[#071A36] tracking-tight">
          Service Provider Access Passes
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium max-w-xl">
          Unlimited eligible requests during active pass period. Retain 100% of customer job payouts with zero commission deductions.
        </p>
      </div>

      {/* Truthful Model Notice */}
      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs text-slate-700 leading-relaxed flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-[#071A36] text-sm block">Transparent Terms Guarantee</span>
            <p className="text-slate-600 mt-0.5 leading-relaxed font-medium">
              Access passes unlock full customer request broadcasts and direct coordination without percentage cuts.
              NEXDO does not promise artificial lead guarantees — actual jobs reflect real neighborhood demand.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 shrink-0">
          <CheckCircle2 className="w-4 h-4" />
          <span>0% Platform Commission</span>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
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
