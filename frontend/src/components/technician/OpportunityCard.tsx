import React from 'react';
import { MapPin, Clock, Check, X, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { JobOpportunity } from '../../types/technician';

interface OpportunityCardProps {
  opportunity: JobOpportunity;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  onAccept,
  onReject,
}) => {
  return (
    <div className="nexdo-card hover:border-slate-300 p-5 sm:p-6 text-left flex flex-col justify-between transition-all group relative overflow-hidden">
      {/* Top Accent Strip */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-80" />

      <div>
        {/* Top Meta Row: Category & Urgency */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            {opportunity.serviceName.includes('AC')
              ? 'HVAC & Cooling'
              : opportunity.serviceName.includes('Fan')
              ? 'Electrical'
              : 'Trade Service'}
          </span>
          {opportunity.urgency === 'URGENT' ? (
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-50 text-amber-900 border border-amber-200/90 flex items-center gap-1 shadow-2xs">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              <span>Urgent Request</span>
            </span>
          ) : (
            <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Eligible Match</span>
            </span>
          )}
        </div>

        {/* Title & Customer Issue */}
        <h3 className="text-base sm:text-lg font-black text-[#071A36] tracking-tight group-hover:text-blue-600 transition-colors">
          {opportunity.serviceName}
        </h3>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
          {opportunity.issueDescription}
        </p>

        {/* Structured Details Layout */}
        <div className="grid grid-cols-2 gap-3 my-4 p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Customer Area
            </span>
            <span className="font-extrabold text-slate-900 flex items-center gap-1 mt-0.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              {opportunity.customerArea}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
              ~{opportunity.distanceKm} km from base
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Requested Schedule
            </span>
            <span className="font-extrabold text-slate-900 flex items-center gap-1 mt-0.5 truncate">
              <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              {opportunity.requestedTime}
            </span>
            <span className="text-[10px] text-emerald-700 block mt-0.5 font-bold">
              ₹0 Commission
            </span>
          </div>
        </div>
      </div>

      <div>
        {/* Pricing Model & Customer Choice */}
        <div className="pb-3 border-b border-slate-100 mb-3.5 space-y-2.5">
          {opportunity.serviceMode === 'SERVICE' ? (
            <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200/80">
              <span className="text-[10px] font-black text-blue-900 uppercase tracking-wider block">
                CUSTOMER REQUEST
              </span>
              <span className="text-sm font-black text-[#071A36] block mt-0.5">
                Service / Repair requested
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
                Direct service request · No diagnosis fee is mandatory
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 shadow-2xs">
                <span className="text-[10px] font-black text-emerald-900 uppercase tracking-wider block">
                  CUSTOMER REQUEST
                </span>
                <span className="text-sm font-black text-emerald-700 block mt-0.5">
                  Diagnosis requested — ₹149
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  REPAIR PRICE
                </span>
                <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">
                  {opportunity.approvedRepairAmount
                    ? `₹${opportunity.approvedRepairAmount}`
                    : 'Decided after diagnosis'}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700">
            <span>100% of approved service amount · ₹0 platform commission</span>
          </div>

          <div className="text-[10px] text-slate-400 font-mono italic">
            Voice: "First job accept pannuren"
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onReject(opportunity.id)}
            data-voice-action="REJECT_REQUEST"
            className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-600 transition-colors flex items-center justify-center gap-1 cursor-pointer active:scale-98"
          >
            <X className="w-3.5 h-3.5" />
            <span>Pass</span>
          </button>
          <button
            type="button"
            onClick={() => onAccept(opportunity.id)}
            data-voice-action="ACCEPT_REQUEST"
            className="flex-2 py-2.5 px-4 rounded-xl bg-[#071A36] hover:bg-blue-600 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 focus-ring active:scale-98 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Accept Request</span>
          </button>
        </div>
      </div>
    </div>
  );
};
