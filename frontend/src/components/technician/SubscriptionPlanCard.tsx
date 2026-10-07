import React from 'react';
import { Check, ShieldAlert } from 'lucide-react';
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
      className={`rounded-xl border text-left p-5 sm:p-6 flex flex-col justify-between transition-all duration-150 relative ${
        plan.recommended
          ? 'border-blue-600 bg-white shadow-sm ring-1 ring-blue-600/30'
          : 'border-slate-200 bg-white shadow-2xs hover:border-slate-300'
      }`}
    >
      {plan.badge && (
        <div className="absolute -top-2.5 left-5">
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white shadow-2xs">
            {plan.badge}
          </span>
        </div>
      )}

      <div>
        <div className="mt-1">
          <h3 className="text-lg font-extrabold text-[#071A36]">{plan.title}</h3>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{plan.tagline}</p>
        </div>

        {/* Price Typography */}
        <div className="my-5 flex items-baseline gap-1.5">
          <span className="text-3xl sm:text-4xl font-black text-[#071A36] tracking-tight">
            ₹{plan.price.toLocaleString('en-IN')}
          </span>
          <span className="text-xs font-bold text-slate-500">{plan.periodText}</span>
        </div>

        {/* Features Grouping */}
        <div className="space-y-2.5 my-4 border-t border-slate-100 pt-3.5 text-xs text-slate-700">
          {plan.features.map((feat, i) => (
            <div key={i} className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="font-medium text-slate-700">{feat}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        {/* Truthful Disclaimer */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-500 mb-4 flex items-start gap-2 leading-relaxed">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <p>{plan.truthfulDisclaimer}</p>
        </div>

        <Button
          fullWidth
          variant={plan.recommended ? 'primary' : 'outline'}
          size="md"
          onClick={() => onActivate(plan)}
        >
          {isCurrent ? 'Current Active Pass' : `Activate Access Pass (₹${plan.price})`}
        </Button>
      </div>
    </div>
  );
};
