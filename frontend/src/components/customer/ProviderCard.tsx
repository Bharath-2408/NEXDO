import React from 'react';
import { Star, MapPin, Clock, ShieldCheck, Briefcase } from 'lucide-react';
import { MatchedProvider } from '../../types/customer';
import { Button } from '../ui/Button';

interface ProviderCardProps {
  provider: MatchedProvider;
  onSelect: (provider: MatchedProvider) => void;
  onViewDetails: (provider: MatchedProvider) => void;
  index: number;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  onSelect,
  onViewDetails,
  index,
}) => {
  const isAvailableNow = provider.etaMinutes <= 35;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-blue-300 transition-all p-5 text-left group">
      {/* Top Header Row */}
      <div className="flex items-start gap-3.5">
        <div className="relative shrink-0">
          <img
            src={provider.avatar}
            alt={provider.name}
            className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-2xs"
          />
          {provider.verified && (
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 fill-emerald-100" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[11px] font-bold text-slate-400 font-mono">#{index + 1}</span>
              <h3 className="text-base font-bold text-[#071A36] truncate group-hover:text-blue-600 transition-colors">
                {provider.name}
              </h3>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 shrink-0">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-xs font-bold text-amber-900">{provider.rating}</span>
              <span className="text-[10px] text-slate-500 font-medium">({provider.reviewCount})</span>
            </div>
          </div>

          <p className="text-xs font-semibold text-blue-700 mt-0.5 truncate">
            {provider.primaryCapability}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-medium">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              {provider.experienceYears || 5}+ yrs exp
            </span>
            <span className="flex items-center gap-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {provider.distanceKm} km away
            </span>
            <span className="flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              ETA ~{provider.etaMinutes} mins
            </span>
          </div>
        </div>
      </div>

      {/* Availability Status & Skill Pills */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {provider.allCapabilities.slice(0, 3).map((cap, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/80 text-[11px] font-medium text-slate-600"
            >
              {cap}
            </span>
          ))}
        </div>

        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 flex items-center gap-1 ${
            isAvailableNow
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isAvailableNow ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          {isAvailableNow ? 'Available Now' : 'Next Slot'}
        </span>
      </div>

      {/* Pricing Model & Canonical Action CTAs */}
      <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-left">
          <div className="p-2 rounded-lg bg-emerald-50/80 border border-emerald-200">
            <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-800 block">
              DIAGNOSIS FEE
            </span>
            <span className="text-base font-extrabold text-emerald-700">
              ₹{provider.diagnosisFee || 149}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">
              REPAIR PRICE
            </span>
            <span className="text-xs font-bold text-slate-700 block mt-0.5">
              Decided after diagnosis
            </span>
          </div>
        </div>

        <div className="text-[11px] font-semibold text-emerald-700">
          100% of approved service amount · ₹0 platform commission
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(provider)}
            className="text-xs"
            data-voice-action="VIEW_TECHNICIAN_PROFILE"
          >
            View Profile
          </Button>
          <Button
            size="sm"
            onClick={() => onSelect(provider)}
            className="bg-[#071A36] hover:bg-[#2563EB] text-xs font-bold"
            data-voice-action="SELECT_TECHNICIAN"
          >
            Select Technician
          </Button>
        </div>
      </div>
    </div>
  );
};
