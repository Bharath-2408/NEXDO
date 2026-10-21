import React from 'react';
import { Check, ShieldAlert, Sparkles } from 'lucide-react';
import { AccessPlan } from '../../types/pricing';
import { Button } from '../ui/Button';

interface SubscriptionPlanCardProps {
  plan: AccessPlan;
  isCurrent?: boolean;
  onActivate: (plan: AccessPlan) => void;
}

export const SubscriptionPlanCard: React.FC<SubscriptionPlanCardProps> = ({
  plan,
  isCurrent,
  onActivate,
}) => {
  return (
    <div
      className={`rounded-3xl border text-left p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 relative ${
        plan.recommended
          ? 'border-blue-600 bg-white shadow-md ring-2 ring-blue-600/20'
          : 'border-slate-200/90 bg-white shadow-2xs hover:border-slate-300'
      }`}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-6">
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-xs flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>{plan.badge}</span>
          </span>
        </div>
      )}

      <div>
        <div className="mt-1">
          <h3 className="text-xl font-black text-[#071A36] tracking-tight">{plan.title}</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">{plan.tagline}</p>
        </div>

        {/* Price Typography */}
        <div className="my-5 flex items-baseline gap-1.5 pb-4 border-b border-slate-100">
          <span className="text-3xl sm:text-4xl font-black text-[#071A36] tracking-tight">
            ₹{plan.price.toLocaleString('en-IN')}
          </span>
          <span className="text-xs font-bold text-slate-500">{plan.periodText}</span>
        </div>

        {/* Zero Commission Callout */}
        <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-[11px] font-bold text-emerald-800 flex items-center gap-1.5 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          <span>₹0 Commission · 100% Payout Retention</span>
        </div>

        {/* Features Grouping */}
        <div className="space-y-3 mb-6 text-xs text-slate-700">
          {plan.features.map((feat, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
              <span className="font-semibold text-slate-800 leading-snug">{feat}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        {/* Truthful Disclaimer */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 mb-4 flex items-start gap-2 leading-relaxed">
          <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p>{plan.truthfulDisclaimer}</p>
        </div>

        <Button
          fullWidth
          variant={plan.recommended ? 'primary' : 'outline'}
          size="md"
          onClick={() => onActivate(plan)}
          className={`py-3 font-bold text-xs ${
            plan.recommended
              ? 'bg-[#071A36] hover:bg-blue-600 text-white shadow-xs'
              : 'border-slate-300'
          }`}
        >
          {isCurrent ? 'Current Active Pass' : `Activate Access Pass (₹${plan.price})`}
        </Button>
      </div>
    </div>
  );
};
