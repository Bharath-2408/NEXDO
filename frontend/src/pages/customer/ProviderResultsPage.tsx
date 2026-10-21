import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Users,
  Navigation,
  Loader2,
  Search,
  Filter,
  CheckCircle2,
  Edit2,
  RotateCcw,
} from 'lucide-react';
import { useCustomer } from '../../store/CustomerContext';
import { ProviderCard } from '../../components/customer/ProviderCard';
import { MatchedProvider } from '../../types/customer';
import { useGeolocation } from '../../hooks/useGeolocation';
import { SERVICE_DOMAINS } from '../../constants/capabilities';

export const ProviderResultsPage: React.FC = () => {
  const {
    matchedProviders,
    selectProvider,
    activeNeed,
    isLoadingProviders,
    providersError,
    fetchProviders,
    fetchNearbyProviders,
  } = useCustomer();
  const navigate = useNavigate();

  const [isGpsActive, setIsGpsActive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState('');
  const [availableNowOnly, setAvailableNowOnly] = useState(false);

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

  // Filter providers according to category, search text, and availability
  const filteredList = useMemo(() => {
    return matchedProviders.filter((prov) => {
      // Category filter
      if (selectedCategory !== 'ALL') {
        const matchesCategory =
          prov.primaryCapability.toLowerCase().includes(selectedCategory.toLowerCase()) ||
          prov.allCapabilities.some((c) =>
            c.toLowerCase().includes(selectedCategory.toLowerCase())
          );
        if (!matchesCategory) return false;
      }

      // Available now filter
      if (availableNowOnly && (prov.etaMinutes ?? 99) > 35) {
        return false;
      }

      // Search text filter
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        const matchesQuery =
          prov.name.toLowerCase().includes(q) ||
          prov.primaryCapability.toLowerCase().includes(q) ||
          prov.allCapabilities.some((c) => c.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [matchedProviders, selectedCategory, availableNowOnly, searchFilter]);

  return (
    <div className="text-left space-y-5 pb-10">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={() => navigate('/customer/express')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors w-fit cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Intent</span>
        </button>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleUseLocation}
            disabled={geo.loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-full border border-blue-200/80 transition-colors cursor-pointer disabled:opacity-50 select-none shadow-2xs"
          >
            {geo.loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Navigation className="w-3.5 h-3.5 text-blue-600" />
            )}
            <span>{geo.loading ? 'Locating...' : isGpsActive ? 'Near My GPS' : 'Near My Location'}</span>
          </button>
          <span className="text-xs font-bold text-blue-800 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200/80 shadow-2xs">
            {matchedProviders.length} Verified Service Providers Available
          </span>
        </div>
      </div>

      {/* Main Title & Context Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#071A36] tracking-tight">
            Matching Service Providers
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Showing service providers in your area with verified capabilities for {activeNeed?.normalizedService || 'your service'}.
          </p>
        </div>

        {activeNeed && (
          <div className="inline-flex items-center gap-2 p-2 rounded-xl bg-slate-100 text-xs text-slate-700 border border-slate-200 shrink-0 self-start sm:self-auto">
            <span className="text-slate-500">Request:</span>
            <span className="font-bold text-[#071A36] max-w-[180px] truncate">
              {activeNeed.normalizedService}
            </span>
            <button
              onClick={() => navigate('/customer/express')}
              className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-white transition-colors"
              title="Edit Service Request"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Search & Fast Filters Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Quick Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search by provider name or skill..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Availability Toggle */}
          <button
            type="button"
            onClick={() => setAvailableNowOnly(!availableNowOnly)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 select-none ${
              availableNowOnly
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${availableNowOnly ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span>Available Now (&lt;35 mins)</span>
          </button>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer select-none ${
              selectedCategory === 'ALL'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
            }`}
          >
            All Services
          </button>

          {SERVICE_DOMAINS.map((domain) => (
            <button
              key={domain.id}
              type="button"
              onClick={() => setSelectedCategory(domain.code)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer select-none ${
                selectedCategory === domain.code
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
              }`}
            >
              {domain.name}
            </button>
          ))}
        </div>
      </div>

      {/* Voice Selection Tip Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 text-xs text-blue-900 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="font-medium">
            Voice Navigation: Say <em>"இரண்டாவது நபரைத் தேர்ந்தெடு"</em> or <em>"Select the first service provider"</em>
          </span>
        </div>
      </div>

      {/* Providers List / Loading / Error / Empty State */}
      {isLoadingProviders ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 animate-pulse space-y-3.5 shadow-2xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-14 bg-slate-50 rounded-xl" />
            </div>
          ))}
        </div>
      ) : providersError ? (
        <div className="p-8 bg-red-50 border border-red-200 rounded-3xl text-center space-y-3 max-w-lg mx-auto shadow-xs">
          <p className="text-sm font-bold text-red-700">{providersError}</p>
          <button
            onClick={() => fetchProviders()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
          >
            Retry
          </button>
        </div>
      ) : matchedProviders.length === 0 ? (
        /* Exact required empty state text for test & platform compliance */
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              No service providers available in your area yet.
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              We are onboarding verified professionals daily. Please check back shortly or explore another service category.
            </p>
          </div>
          <button
            onClick={() => fetchProviders()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            Refresh Providers
          </button>
        </div>
      ) : filteredList.length === 0 ? (
        /* Filter-empty state (allows clearing filters) */
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-md mx-auto space-y-3 shadow-xs">
          <Filter className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">
            No service providers match the current filters
          </h4>
          <p className="text-xs text-slate-500">
            Try clearing your search query or selecting "All Services".
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('ALL');
              setSearchFilter('');
              setAvailableNowOnly(false);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredList.map((prov, idx) => (
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
