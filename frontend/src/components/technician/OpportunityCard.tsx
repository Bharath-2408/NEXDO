import React from 'react';
import { MapPin, Clock, Check, X, AlertTriangle } from 'lucide-react';
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
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 text-left transition-all duration-150 hover:border-slate-300 flex flex-col justify-between">
      <div>
        {/* Top Meta Row: Category & Urgency */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {opportunity.serviceName.includes('AC') ? 'HVAC & Cooling' : opportunity.serviceName.includes('Fan') ? 'Electrical' : 'Trade Service'}
          </span>
          {opportunity.urgency === 'URGENT' ? (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-50 text-amber-900 border border-amber-200/80 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              Urgent Request
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-emerald-700">
              Eligible Match
            </span>
          )}
        </div>

        {/* Title & Customer Issue */}
        <h3 className="text-base font-extrabold text-[#071A36] tracking-tight">
          {opportunity.serviceName}
        </h3>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          {opportunity.issueDescription}
        </p>

        {/* Structured Details Layout */}
        <div className="grid grid-cols-2 gap-3 my-4 p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Customer Area
            </span>
            <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              {opportunity.customerArea}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
              ~{opportunity.distanceKm} km from base
            </span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Requested Schedule
            </span>
            <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
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
        <div className="pb-3 border-b border-slate-100 mb-3 space-y-2.5">
          {opportunity.serviceMode === 'SERVICE' ? (
            <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-100">
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                CUSTOMER REQUEST
              </span>
              <span className="text-sm font-extrabold text-[#071A36] block mt-0.5">
                Service / Repair requested
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
                Direct service request · No diagnosis fee is mandatory
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  CUSTOMER REQUEST
                </span>
                <span className="text-sm font-extrabold text-emerald-700 block mt-0.5">
                  Diagnosis requested — ₹149
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  REPAIR PRICE
                </span>
                <span className="text-xs font-bold text-slate-700 mt-0.5 block">
                  {opportunity.approvedRepairAmount
                    ? `₹${opportunity.approvedRepairAmount}`
                    : 'Decided after diagnosis'}
                </span>
              </div>
            </div>
          )}
          <div className="text-[11px] font-semibold text-emerald-700">
            100% of approved service amount · ₹0 platform commission
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
            className="flex-1 py-2 px-3 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Pass</span>
          </button>
          <button
            type="button"
            onClick={() => onAccept(opportunity.id)}
            data-voice-action="ACCEPT_REQUEST"
            className="flex-2 py-2 px-4 rounded-lg bg-[#071A36] hover:bg-[#2563EB] text-white text-xs font-semibold shadow-2xs transition-all flex items-center justify-center gap-1.5 focus-ring active:scale-98 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Accept Request</span>
          </button>
        </div>
      </div>
    </div>
  );
};
