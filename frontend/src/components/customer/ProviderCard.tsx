import React from 'react';
import { Star, MapPin, Clock, ShieldCheck, Briefcase, CheckCircle2 } from 'lucide-react';
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
  const isAvailableNow = (provider.etaMinutes ?? 99) <= 35;

  return (
    <div className="nexdo-card hover:border-blue-300 hover:shadow-md transition-all p-5 sm:p-6 text-left flex flex-col justify-between group relative overflow-hidden">
      {/* Subtle top accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div>
        {/* Top Header Row */}
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            {provider.avatar ? (
              <img
                src={provider.avatar}
                alt={provider.name}
                className="w-14 h-14 rounded-2xl object-cover border border-slate-200/90 shadow-2xs"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 font-black text-base flex items-center justify-center border border-blue-200 shadow-2xs">
                {provider.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
            )}
            {provider.verified && (
              <div
                className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-2xs"
                title="Background Verified Professional"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600 fill-emerald-100" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[11px] font-black text-slate-400 font-mono select-none">
                  #{index + 1}
                </span>
                <h3 className="text-base font-extrabold text-[#071A36] truncate group-hover:text-blue-600 transition-colors">
                  {provider.name}
                </h3>
              </div>

              {/* Rating or New Pro Badge */}
              {provider.reviewCount > 0 ? (
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/90 shrink-0">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span className="text-xs font-black text-amber-900">{provider.rating}</span>
                  <span className="text-[10px] text-slate-500 font-medium">({provider.reviewCount})</span>
                </div>
              ) : (
                <span className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200/80 text-[10px] font-bold text-blue-700 shrink-0">
                  New Pro
                </span>
              )}
            </div>

            <p className="text-xs font-bold text-blue-700 mt-0.5 truncate">
              {provider.primaryCapability}
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                <span>{provider.experienceYears ?? 0} yrs exp</span>
              </span>
              {provider.distanceKm !== undefined && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{provider.distanceKm} km away</span>
                </span>
              )}
              {provider.etaMinutes !== undefined && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>ETA ~{provider.etaMinutes} mins</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Capabilities Pills & Availability Badge */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {provider.allCapabilities.slice(0, 3).map((cap, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/80 text-[11px] font-medium text-slate-700 truncate max-w-[150px]"
              >
                {cap}
              </span>
            ))}
          </div>

          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 flex items-center gap-1.5 ${
              isAvailableNow
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                : 'bg-amber-50 text-amber-800 border border-amber-200/80'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isAvailableNow ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span>{isAvailableNow ? 'Available Now' : 'Next Slot'}</span>
          </span>
        </div>

        {/* Pricing Model Box */}
        <div className="mt-3.5 p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 text-left space-y-1.5">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-white border border-emerald-200/80 shadow-2xs">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-800 block">
                DIAGNOSIS FEE
              </span>
              <span className="text-base font-black text-emerald-700">
                ₹{provider.diagnosisFee || 149}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 block">
                REPAIR PRICE
              </span>
              <span className="text-xs font-bold text-slate-800 block mt-0.5 truncate">
                {provider.repairPriceNote || 'Decided after diagnosis'}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight pt-0.5">
            Service provider visits and diagnoses the exact issue. Work starts only upon your estimate approval.
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-700">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% of payment to service provider</span>
          </span>
          <span className="text-slate-400 font-medium">₹0 Commission</span>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(provider)}
            className="text-xs font-semibold"
            data-voice-action="VIEW_TECHNICIAN_PROFILE"
          >
            View Profile
          </Button>
          <Button
            size="sm"
            onClick={() => onSelect(provider)}
            className="bg-[#071A36] hover:bg-blue-600 text-xs font-bold shadow-xs active:scale-98"
            data-voice-action="SELECT_TECHNICIAN"
          >
            Select Service Provider
          </Button>
        </div>
      </div>
    </div>
  );
};
