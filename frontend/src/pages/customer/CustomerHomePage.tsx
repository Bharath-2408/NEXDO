import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Award,
  Sparkles,
  ArrowRight,
  Calendar,
  Star,
  Search,
  Mic,
  Clock,
  CheckCircle2,
  Navigation,
  Loader2,
  Zap,
  Droplet,
  Wrench,
  Scissors,
  Car,
  ShoppingBag,
  HeartHandshake,
  MoreHorizontal,
  ChevronRight,
  Check,
} from 'lucide-react';
import { useCustomer } from '../../store/CustomerContext';
import { useVoice } from '../../voice/VoiceContext';
import { Button } from '../../components/ui/Button';
import { useGeolocation } from '../../hooks/useGeolocation';
import { SERVICE_DOMAINS } from '../../constants/capabilities';

export const CustomerHomePage: React.FC = () => {
  const {
    activeBooking,
    matchedProviders,
    isLoadingProviders,
    providersError,
    fetchProviders,
    fetchNearbyProviders,
    selectProvider,
  } = useCustomer();
  const { simulateVoicePrompt, startListening } = useVoice();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomainCode, setSelectedDomainCode] = useState<string | null>(null);
  const [isGpsActive, setIsGpsActive] = useState(false);
  const geo = useGeolocation({ autoReverseGeocode: true });

  const handleUseLocation = async () => {
    const coords = await geo.getCurrentLocation();
    if (coords) {
      setIsGpsActive(true);
      await fetchNearbyProviders(coords.latitude, coords.longitude);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    simulateVoicePrompt(query);
  };

  const handleHintClick = (hintText: string) => {
    setSearchQuery(hintText);
    simulateVoicePrompt(hintText);
  };

  const handleCategoryClick = (code: string, name: string) => {
    if (selectedDomainCode === code) {
      setSelectedDomainCode(null);
    } else {
      setSelectedDomainCode(code);
      simulateVoicePrompt(`${name} service`);
    }
  };

  // Filter providers if a category is selected
  const filteredProviders = useMemo(() => {
    if (!selectedDomainCode) return matchedProviders;
    return matchedProviders.filter(
      (p) =>
        p.allCapabilities.some((c) =>
          c.toLowerCase().includes(selectedDomainCode.toLowerCase())
        ) ||
        p.primaryCapability.toLowerCase().includes(selectedDomainCode.toLowerCase())
    );
  }, [matchedProviders, selectedDomainCode]);

  const voiceHintChips = [
    'AC service venum',
    'Electrician urgently',
    'Plumber tomorrow morning',
    'TV repair',
  ];

  const popularServices = [
    {
      title: 'AC Deep Clean & Jet Service',
      tag: 'From ₹149 Diagnosis',
      hint: 'AC deep cleaning and service',
      icon: Wrench,
      accent: 'from-blue-500/10 to-indigo-500/10 text-blue-700',
    },
    {
      title: 'Ceiling Fan & Switchboard Fix',
      tag: 'Urgent / Doorstep',
      hint: 'Need an electrician to fix fan and switchboard',
      icon: Zap,
      accent: 'from-amber-500/10 to-orange-500/10 text-amber-700',
    },
    {
      title: 'Tap Leakage & Pipe Repair',
      tag: 'From ₹149 Diagnosis',
      hint: 'Plumber for tap leakage repair',
      icon: Droplet,
      accent: 'from-cyan-500/10 to-blue-500/10 text-cyan-700',
    },
    {
      title: 'Home Deep Cleaning & Sanitization',
      tag: 'Transparent Quote',
      hint: 'Deep home cleaning service',
      icon: Sparkles,
      accent: 'from-emerald-500/10 to-teal-500/10 text-emerald-700',
    },
  ];

  const getDomainIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap':
        return Zap;
      case 'Droplet':
        return Droplet;
      case 'Wrench':
        return Wrench;
      case 'Sparkles':
        return Sparkles;
      case 'Scissors':
        return Scissors;
      case 'Car':
        return Car;
      case 'ShoppingBag':
        return ShoppingBag;
      case 'HeartHandshake':
        return HeartHandshake;
      default:
        return MoreHorizontal;
    }
  };

  const getBookingStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'Service Provider accepted · ₹149 Diagnosis Fee';
      case 'DIAGNOSIS_COMPLETED':
        return 'Diagnosis complete · Awaiting estimate approval';
      case 'WORK_IN_PROGRESS':
        return 'Work in progress · Price locked ₹1,100';
      case 'WORK_COMPLETED':
        return 'Work completed · Customer payment pending';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-7 text-left pb-10">
      {/* 1. Active Booking Live Ribbon (if active) */}
      {activeBooking && activeBooking.status !== 'COMPLETED' && (
        <section aria-label="Active Booking Status">
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-white border border-blue-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs ring-4 ring-blue-100">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-600 text-white shadow-2xs">
                    {activeBooking.status}
                  </span>
                  <span className="text-xs text-blue-900 font-bold">
                    {getBookingStatusBadge(activeBooking.status)}
                  </span>
                </div>
                <h4 className="text-base font-extrabold text-[#071A36] mt-1 tracking-tight">
                  {activeBooking.serviceTitle}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5 font-medium">
                  {activeBooking.provider?.name || 'Verified Service Provider'} · {activeBooking.scheduledTime}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <Button
                size="sm"
                onClick={() => navigate(`/customer/tracking/${activeBooking.id}`)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="bg-[#071A36] hover:bg-blue-600 font-bold shadow-xs"
              >
                Track Service Provider Live
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* 2. Conversational Intent Hero Header */}
      <section className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Subtle Decorative Ambient Background Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-100/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-2xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[11px] font-bold text-blue-700 tracking-wide uppercase mb-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>Local services. Made simpler.</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-[#071A36] tracking-tight leading-tight">
            What do you need help with?
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed font-normal">
            Say what you need in natural Tamil or English. We’ll match verified service providers in your neighborhood.
          </p>
        </div>

        {/* Search & Voice Bar */}
        <form onSubmit={handleSearchSubmit} className="relative z-10 mt-6 max-w-3xl">
          <div className="relative flex items-center">
            <div className="absolute left-4 text-slate-400 pointer-events-none">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="What do you need help with? / என்ன உதவி வேண்டும்?"
              className="w-full pl-12 pr-28 py-4 bg-slate-50/90 hover:bg-white focus:bg-white border border-slate-200/90 rounded-2xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner"
            />
            <div className="absolute right-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => startListening()}
                title="Speak to NEXDO in Tamil or English"
                aria-label="Speak to NEXDO"
                className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 transition-all active:scale-95 cursor-pointer shadow-2xs group"
              >
                <Mic className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[#071A36] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                Find
              </button>
            </div>
          </div>
        </form>

        {/* Voice Hint Chips */}
        <div className="relative z-10 mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1 select-none">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Try saying:
          </span>
          {voiceHintChips.map((hint) => (
            <button
              key={hint}
              type="button"
              onClick={() => handleHintClick(hint)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100/90 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-700 border border-slate-200/90 transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              &ldquo;{hint}&rdquo;
            </button>
          ))}
        </div>
      </section>

      {/* 3. Core Service Categories Grid (Urban Company Hallmark) */}
      <section className="space-y-3.5" aria-label="Service Categories">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-[#071A36] tracking-tight">
              Explore Service Categories
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Doorstep services backed by background-verified professionals & ₹149 diagnosis guarantee.
            </p>
          </div>
          {selectedDomainCode && (
            <button
              onClick={() => setSelectedDomainCode(null)}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              Clear Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2.5 sm:gap-3">
          {SERVICE_DOMAINS.map((domain) => {
            const IconComponent = getDomainIcon(domain.iconName);
            const isSelected = selectedDomainCode === domain.code;
            return (
              <button
                key={domain.id}
                type="button"
                onClick={() => handleCategoryClick(domain.code, domain.name)}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-between group cursor-pointer focus-ring select-none min-h-[92px] ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-slate-200/80 bg-white hover:bg-slate-50 hover:border-blue-300 shadow-2xs hover:shadow-xs'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shrink-0 ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-700'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="mt-2 min-w-0 w-full">
                  <span
                    className={`block text-[11px] font-bold leading-tight truncate ${
                      isSelected ? 'text-blue-900' : 'text-slate-800'
                    }`}
                  >
                    {domain.name}
                  </span>
                  <span className="block text-[9px] font-medium text-slate-400 mt-0.5 truncate">
                    {domain.nameTamil}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Popular Services & Advance Booking Quick Actions */}
      <section className="space-y-3.5" aria-label="Popular Services">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-[#071A36] tracking-tight">
              Most Requested in Your Area
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Popular household requests with verified pros on-call today.
            </p>
          </div>
          <button
            onClick={() => navigate('/customer/express')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Express Need</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
          {popularServices.map((srv, idx) => (
            <div
              key={idx}
              onClick={() => handleHintClick(srv.hint)}
              className="nexdo-card-interactive p-4 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg bg-gradient-to-br ${srv.accent} flex items-center justify-center`}
                  >
                    <srv.icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {srv.tag}
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-[#071A36] group-hover:text-blue-600 transition-colors line-clamp-2">
                  {srv.title}
                </h3>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-bold">
                <span>Book Service</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>

        {/* Advance Booking Callout Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-[#071A36] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-blue-300 shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                Planning in advance? Schedule appointments up to 7 days ahead
              </h4>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Pick your preferred morning, afternoon, or evening time slot. ₹0 cancellation fees before dispatch.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => navigate('/customer/express')}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold shrink-0 self-start sm:self-center"
          >
            Schedule Ahead
          </Button>
        </div>
      </section>

      {/* 5. Nearby Verified Service Providers Section (Real Data Only) */}
      <section className="space-y-3.5" aria-label="Nearby Providers">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-[#071A36] flex items-center gap-2">
              <span>Nearby Verified Service Providers</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h2>
            <p className="text-xs text-slate-500">
              {isGpsActive && geo.address
                ? `Filtered by real GPS location (${geo.area || geo.city || 'Nearby'})`
                : 'On-call in Adyar & surrounding zones · Standard ₹149 diagnosis fee'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUseLocation}
              disabled={geo.loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200/80 transition-colors cursor-pointer disabled:opacity-50 select-none"
            >
              {geo.loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Navigation className="w-3.5 h-3.5" />
              )}
              <span>{geo.loading ? 'Locating...' : 'Near Me'}</span>
            </button>
            <button
              onClick={() => navigate('/customer/providers')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Service Provider Cards Grid */}
        {isLoadingProviders ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 animate-pulse space-y-3 shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-200 shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-16 bg-slate-50 rounded-xl" />
              </div>
            ))}
          </div>
        ) : providersError ? (
          <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-2">
            <p className="text-xs font-semibold text-red-700">{providersError}</p>
            <button
              onClick={() => fetchProviders()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : (filteredProviders.length === 0 || matchedProviders.length === 0) ? (
          /* Exact required string preserved for test & platform compliance */
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 shadow-xs">
            <p className="text-sm font-bold text-slate-700">
              No service providers available in your area yet.
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              We are onboarding verified professionals daily. Please check back shortly or explore another service category.
            </p>
            <button
              onClick={() => fetchProviders()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
            >
              Refresh Providers
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredProviders.slice(0, 3).map((pro) => (
              <div
                key={pro.id}
                onClick={() => {
                  selectProvider(pro);
                  navigate(`/customer/providers/${pro.id}`);
                }}
                className="nexdo-card-interactive p-4 flex flex-col justify-between group"
              >
                <div>
                  {/* Service Provider Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        {pro.avatar ? (
                          <img
                            src={pro.avatar}
                            alt={pro.name}
                            className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-2xs"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 font-extrabold text-sm flex items-center justify-center shrink-0 border border-blue-200">
                            {pro.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                        )}
                        {pro.verified && (
                          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-2xs">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-[#071A36] group-hover:text-blue-600 transition-colors truncate">
                          {pro.name}
                        </h4>
                        <p className="text-xs text-slate-500 truncate font-medium">
                          {pro.primaryCapability}
                        </p>
                      </div>
                    </div>

                    {pro.reviewCount > 0 ? (
                      <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 text-amber-800 text-xs font-bold shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{pro.rating}</span>
                      </div>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200/80 text-blue-700 text-[10px] font-bold shrink-0">
                        New Pro
                      </span>
                    )}
                  </div>

                  {/* Distance & Experience */}
                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>{pro.distanceKm} km away</span>
                    </span>
                    <span>·</span>
                    <span>{pro.experienceYears ?? 0} yrs exp</span>
                  </div>

                  {/* Pricing Structure Box */}
                  <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                        Diagnosis Fee:
                      </span>
                      <span className="font-black text-blue-700 text-sm">₹{pro.diagnosisFee || 149}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-[11px] text-slate-500">Repair Price:</span>
                      <span className="font-semibold text-slate-700 truncate max-w-[150px]">
                        {pro.repairPriceNote || 'Decided after diagnosis'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Zero Commission Footer */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>100% of payment to service provider</span>
                  </span>
                  <span className="text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                    Request &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. Urban Company-Grade Trust & Safety Guarantees */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2" aria-label="Trust & Guarantees">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-[#071A36]">₹149 Diagnosis First</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Service provider visits, diagnoses the exact fault, and provides a clear breakdown. No surprise charges.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-[#071A36]">Approval Locks The Price</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            You review parts and labour breakdown. Work starts only after you approve the locked estimate.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3">
            <Award className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-[#071A36]">₹0 Platform Commission</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            100% of your approved payment goes directly to the hardworking local service provider.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
            <Check className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-[#071A36]">Two-Step OTP Security</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Arrival verified via Diagnosis OTP. Final payout is authorized only after you inspect completed work.
          </p>
        </div>
      </section>
    </div>
  );
};
