import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useCustomer } from '../../store/CustomerContext';
import { ProviderCard } from '../../components/customer/ProviderCard';
import { MatchedProvider } from '../../types/customer';

export const ProviderResultsPage: React.FC = () => {
  const { matchedProviders, selectProvider, activeNeed } = useCustomer();
  const navigate = useNavigate();

  const handleSelect = (provider: MatchedProvider) => {
    selectProvider(provider);
    navigate(`/customer/book/${provider.id}`);
  };

  const handleViewDetails = (provider: MatchedProvider) => {
    selectProvider(provider);
    navigate(`/customer/providers/${provider.id}`);
  };

  return (
    <div className="text-left space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/customer/express')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Intent</span>
        </button>
        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
          {matchedProviders.length} Verified Pros Available
        </span>
      </div>

      <div>
        <h2 className="text-2xl font-black text-[#071A36]">
          Matching Service Professionals
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Showing technicians in your area with verified capabilities for {activeNeed?.normalizedService || 'your service'}.
        </p>
      </div>

      {/* Voice Selection Tip Banner */}
      <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Voice Navigation: Say <em>"இரண்டாவது நபரைத் தேர்ந்தெடு"</em> or <em>"Select the first technician"</em></span>
        </div>
      </div>

      {/* Providers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matchedProviders.map((prov, idx) => (
          <ProviderCard
            key={prov.id}
            provider={prov}
            index={idx}
            onSelect={handleSelect}
            onViewDetails={handleViewDetails}
          />
        ))}
      </div>
    </div>
  );
};
