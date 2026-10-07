import React from 'react';
import { useTechnician } from '../../store/TechnicianContext';

export const TechnicianEarningsPage: React.FC = () => {
  const { earnings } = useTechnician();

  return (
    <div className="text-left space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#071A36]">Earnings & Payouts</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          100% of service payments go directly to you with zero commission deduction.
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Today's Income
          </span>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-3xl font-black text-emerald-700">₹{earnings.todayEarnings.toLocaleString('en-IN')}</span>
          </div>
          <span className="text-xs text-slate-400">Transferred direct to your bank / UPI</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            This Week
          </span>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-3xl font-black text-[#071A36]">₹{earnings.thisWeekEarnings.toLocaleString('en-IN')}</span>
          </div>
          <span className="text-xs text-slate-400">Total jobs: {earnings.totalJobs}</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Commission Deducted
          </span>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-3xl font-black text-blue-600">₹0</span>
          </div>
          <span className="text-xs text-emerald-600 font-bold">100% Retained under Access Pass</span>
        </div>
      </div>

      {/* Recent Payouts List */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-extrabold text-[#071A36] mb-4">Recent Job Payouts</h3>
        <div className="space-y-3">
          {earnings.recentPayouts.map((p) => (
            <div
              key={p.id}
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
            >
              <div>
                <h4 className="text-sm font-bold text-slate-900">{p.jobTitle}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{p.customerMasked} · {p.date}</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-extrabold text-emerald-700">+₹{p.amount}</span>
                <span className="text-[10px] text-slate-400 block">Settled</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
