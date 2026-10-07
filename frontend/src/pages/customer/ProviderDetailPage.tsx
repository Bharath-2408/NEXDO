import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, ShieldCheck, Award } from 'lucide-react';
import { useCustomer } from '../../store/CustomerContext';
import { Button } from '../../components/ui/Button';

export const ProviderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getProviderById, selectProvider } = useCustomer();
  const navigate = useNavigate();

  const provider = (id ? getProviderById(id) : null) || getProviderById('prov_ravi');

  if (!provider) {
    return <div className="py-10 text-center text-slate-500">Provider not found</div>;
  }

  const handleBook = () => {
    selectProvider(provider);
    navigate(`/customer/book/${provider.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto text-left space-y-6">
      <button
        onClick={() => navigate('/customer/providers')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Matches</span>
      </button>

      {/* Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-slate-100">
          <img
            src={provider.avatar}
            alt={provider.name}
            className="w-20 h-20 rounded-3xl object-cover border border-slate-200 shadow-sm"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-[#071A36]">{provider.name}</h2>
              {provider.verified && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Pro
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-blue-700 mt-0.5">{provider.primaryCapability}</p>

            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span className="font-bold text-slate-900">{provider.rating}</span> ({provider.reviewCount} reviews)
              </span>
              <span>·</span>
              <span>{provider.experienceYears} Years Experience</span>
              <span>·</span>
              <span>~{provider.distanceKm} km away</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="py-4 border-b border-slate-100">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">About Technician</h4>
          <p className="text-sm text-slate-700 leading-relaxed">{provider.bio}</p>
        </div>

        {/* Verified Capabilities */}
        <div className="py-4 border-b border-slate-100">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Multi-Skill Capabilities ({provider.allCapabilities.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {provider.allCapabilities.map((cap, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-800"
              >
                {cap}
              </span>
            ))}
          </div>
        </div>

        {/* Guarantee Banner */}
        <div className="my-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
          <Award className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[#071A36] block">NEXDO 30-Day Service Guarantee</span>
            <p className="mt-0.5 text-slate-500">
              Includes free re-inspection if the same issue reoccurs within 30 days of completion.
            </p>
          </div>
        </div>

        {/* Pricing Model & CTA */}
        <div className="pt-3 border-t border-slate-200 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200">
              <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                DIAGNOSIS FEE
              </span>
              <span className="text-xl font-black text-emerald-700">₹{provider.diagnosisFee || 149}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                REPAIR PRICE
              </span>
              <span className="text-xs font-bold text-slate-700 block mt-1">Decided after diagnosis</span>
            </div>
          </div>
          <div className="text-xs font-semibold text-emerald-700">
            100% of approved service amount · ₹0 platform commission
          </div>
          <Button fullWidth size="lg" onClick={handleBook}>
            Proceed to Book {provider.name}
          </Button>
        </div>
      </div>
    </div>
  );
};
