import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Users, Navigation, Loader2 } from 'lucide-react';
import { useCustomer } from '../../store/CustomerContext';
import { ProviderCard } from '../../components/customer/ProviderCard';
import { MatchedProvider } from '../../types/customer';
import { useGeolocation } from '../../hooks/useGeolocation';

export const ProviderResultsPage: React.FC = () => {
  const { matchedProviders, selectProvider, activeNeed, isLoadingProviders, providersError, fetchProviders, fetchNearbyProviders } = useCustomer();
  const navigate = useNavigate();

  const [isGpsActive, setIsGpsActive] = useState(false);
  const geo = useGeolocation({ autoReverseGeocode: true });

  const handleUseLocation = async () => {
    const coords = await geo.getCurrentLocation();
    if (coords) {
      setIsGpsActive(true);
      await fetchNearbyProviders(coords.latitude, coords.longitude, undefined, activeNeed?.serviceCategory);
    }
  };

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
        <div className="flex items-center gap-2">
          <button
            onClick={handleUseLocation}
            disabled={geo.loading}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-full border border-blue-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            {geo.loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Navigation className="w-3.5 h-3.5" />
            )}
            <span>{geo.loading ? 'Locating...' : isGpsActive ? 'Near My GPS' : 'Near My Location'}</span>
          </button>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            {matchedProviders.length} Verified Service Providers Available
          </span>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-black text-[#071A36]">
          Matching Service Providers
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Showing service providers in your area with verified capabilities for {activeNeed?.normalizedService || 'your service'}.
        </p>
      </div>

      {/* Voice Selection Tip Banner */}
      <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Voice Navigation: Say <em>"இரண்டாவது நபரைத் தேர்ந்தெடு"</em> or <em>"Select the first service provider"</em></span>
        </div>
      </div>

      {/* Providers List / Loading / Error / Empty State */}
      {isLoadingProviders ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-5 animate-pulse space-y-3">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-10 bg-slate-50 rounded-xl" />
            </div>
          ))}
        </div>
      ) : providersError ? (
        <div className="p-8 bg-red-50 border border-red-200 rounded-3xl text-center space-y-3 max-w-lg mx-auto">
          <p className="text-sm font-bold text-red-700">{providersError}</p>
          <button
            onClick={() => fetchProviders()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : matchedProviders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              No service providers available in your area yet.
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              We are onboarding verified professionals daily. Please check back shortly or explore another service category.
            </p>
          </div>
          <button
            onClick={() => fetchProviders()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Refresh Providers
          </button>
        </div>
      ) : (
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
      )}
    </div>
  );
};
