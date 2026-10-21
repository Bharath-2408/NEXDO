import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  ShieldCheck,
  Award,
  Clock,
  MapPin,
  Wrench,
  CheckCircle2,
} from 'lucide-react';
import { useCustomer } from '../../store/CustomerContext';
import { Button } from '../../components/ui/Button';

export const ProviderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getProviderById, selectProvider } = useCustomer();
  const navigate = useNavigate();

  const provider = id ? getProviderById(id) : null;

  if (!provider) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <h3 className="text-lg font-bold text-slate-800">Service Provider Not Found</h3>
        <p className="text-xs text-slate-500">
          The requested service provider could not be found or is not currently active.
        </p>
        <button
          onClick={() => navigate('/customer/providers')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer"
        >
          View Available Providers
        </button>
      </div>
    );
  }

  const handleBook = () => {
    selectProvider(provider);
    navigate(`/customer/book/${provider.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto text-left space-y-6 pb-12">
      {/* Top Navigation */}
      <button
        onClick={() => navigate('/customer/providers')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Matches</span>
      </button>

      {/* Main Profile Header Card */}
      <div className="nexdo-card overflow-hidden">
        {/* Top banner accent */}
        <div className="h-20 bg-linear-to-r from-[#071A36] via-blue-900 to-indigo-900 relative">
          <div className="absolute top-3 right-4 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30 flex items-center gap-1 backdrop-blur-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Available for Booking
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-8 -mt-10 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-end gap-4">
              <div className="relative">
                <img
                  src={provider.avatar}
                  alt={provider.name}
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md bg-white"
                />
                {provider.verified && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-[#071A36] tracking-tight">{provider.name}</h1>
                  {provider.verified && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                      Verified Pro
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-blue-700 mt-0.5">{provider.primaryCapability}</p>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex items-center gap-3 text-xs bg-slate-50 p-2 rounded-xl border border-slate-200/80 w-fit">
              {provider.reviewCount > 0 ? (
                <div className="flex items-center gap-1 font-bold text-slate-800">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>{provider.rating}</span>
                  <span className="text-slate-400 font-normal">({provider.reviewCount})</span>
                </div>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold">
                  New Pro
                </span>
              )}
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1 text-slate-600 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{provider.experienceYears ?? 0} yrs exp</span>
              </div>
              {provider.distanceKm !== undefined && (
                <>
                  <span className="text-slate-300">|</span>
                  <div className="flex items-center gap-1 text-slate-600 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>~{provider.distanceKm} km</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* About / Bio */}
          <div className="py-5 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Professional Background
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              {provider.bio || `${provider.name} is a background-verified local service technician with verified hands-on expertise across ${provider.allCapabilities.join(', ')}. Committed to punctual arrival, transparent quotes, and zero hidden platform markups.`}
            </p>
          </div>

          {/* Verified Multi-Skill Capabilities */}
          <div className="py-5 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Verified Capabilities ({provider.allCapabilities.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {provider.allCapabilities.map((cap, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                >
                  <Wrench className="w-3 h-3 text-blue-600" />
                  <span>{cap}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Trust Guarantee Card */}
          <div className="my-5 p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border border-blue-200/80 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#071A36]">NEXDO 30-Day Service Guarantee</span>
                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">Included</span>
              </div>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                If the repaired issue reoccurs within 30 days of service, {provider.name} will re-inspect and resolve it with ₹0 additional diagnosis fee.
              </p>
            </div>
          </div>

          {/* Transparent Pricing Breakdown */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Transparent Pricing Structure
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-blue-900 tracking-wider">
                      Diagnosis & Inspection
                    </span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">Standard</span>
                  </div>
                  <div className="text-2xl font-black text-blue-900 mt-1">₹{provider.diagnosisFee || 149}</div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Covers door-to-door transit, comprehensive fault inspection, and itemized quotation.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">
                      Repair & Parts Price
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Price Locked</span>
                  </div>
                  <div className="text-sm font-bold text-slate-800 mt-2">Itemized after diagnosis</div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Service provider quotes parts + labour. Work begins only after your explicit approval.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50/80 px-3.5 py-2 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>100% of approved payout goes to {provider.name} · ₹0 platform commission deducted</span>
            </div>

            {/* Direct Booking CTA */}
            <div className="pt-2">
              <Button
                fullWidth
                size="lg"
                data-voice-action="SELECT_TECHNICIAN"
                onClick={handleBook}
                className="bg-[#071A36] hover:bg-blue-600 text-white font-bold text-sm shadow-md h-12"
              >
                Proceed to Book {provider.name}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
