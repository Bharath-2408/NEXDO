import React, { useState } from 'react';
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
} from 'lucide-react';
import { useCustomer } from '../../store/CustomerContext';
import { useVoice } from '../../voice/VoiceContext';
import { Button } from '../../components/ui/Button';

export const CustomerHomePage: React.FC = () => {
  const { activeBooking, matchedProviders } = useCustomer();
  const { simulateVoicePrompt, startListening } = useVoice();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');

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

  const voiceHintChips = [
    'AC service venum',
    'Electrician urgently',
    'Plumber tomorrow morning',
    'TV repair',
  ];

  const getBookingStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'Technician accepted · ₹149 Diagnosis Fee';
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
    <div className="space-y-6 text-left pb-6">
      {/* 1. Active Booking Preview Banner (if exists and active) */}
      {activeBooking && activeBooking.status !== 'COMPLETED' && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-600 text-white">
                  {activeBooking.status}
                </span>
                <span className="text-xs text-blue-900 font-semibold">
                  {getBookingStatusBadge(activeBooking.status)}
                </span>
              </div>
              <h4 className="text-base font-bold text-[#071A36] mt-1">
                {activeBooking.serviceTitle}
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                {activeBooking.provider?.name || 'Verified Technician'} · {activeBooking.scheduledTime}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <Button
              size="sm"
              onClick={() => navigate(`/customer/tracking/${activeBooking.id}`)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Track Pro Live
            </Button>
          </div>
        </div>
      )}

      {/* 2. Conversational Intent Input Area */}
      <section className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs">
        <div className="max-w-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block mb-1">
            Voice-First Home Services
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#071A36] tracking-tight">
            What do you need help with?
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Say what you need in natural Tamil or English. We’ll match verified pros in your neighborhood.
          </p>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSearchSubmit} className="mt-5">
          <div className="relative flex items-center">
            <div className="absolute left-3.5 text-slate-400 pointer-events-none">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="What do you need help with? / என்ன உதவி வேண்டும்?"
              className="w-full pl-11 pr-24 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
            />
            <div className="absolute right-2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => startListening()}
                title="Speak to NEXDO"
                aria-label="Speak to NEXDO"
                className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors cursor-pointer"
              >
                <Mic className="w-4 h-4" />
              </button>
              <button
                type="submit"
                className="px-3 py-2 rounded-lg bg-[#071A36] hover:bg-[#0d2a54] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Find
              </button>
            </div>
          </div>
        </form>

        {/* Voice Hint Chips */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-slate-400 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Try saying:
          </span>
          {voiceHintChips.map((hint) => (
            <button
              key={hint}
              type="button"
              onClick={() => handleHintClick(hint)}
              className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 border border-slate-200/80 transition-colors cursor-pointer"
            >
              &ldquo;{hint}&rdquo;
            </button>
          ))}
        </div>
      </section>

      {/* 3. Nearby Verified Pros Section */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-[#071A36] flex items-center gap-2">
              <span>Nearby Verified Pros</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h2>
            <p className="text-xs text-slate-500">
              On-call in Adyar & surrounding zones · Standard ₹149 diagnosis fee
            </p>
          </div>
          <button
            onClick={() => navigate('/customer/providers')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pro Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(matchedProviders.length > 0 ? matchedProviders.slice(0, 3) : []).map((pro) => (
            <div
              key={pro.id}
              onClick={() => navigate(`/customer/providers/${pro.id}`)}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Pro Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-extrabold text-sm flex items-center justify-center shrink-0">
                      {pro.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#071A36] group-hover:text-blue-600 transition-colors">
                        {pro.name}
                      </h4>
                      <p className="text-xs text-slate-500">{pro.primaryCapability}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-amber-700 text-xs font-bold shrink-0">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span>{pro.rating}</span>
                  </div>
                </div>

                {/* Distance & Experience */}
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>{pro.distanceKm} km away</span>
                  </span>
                  <span>·</span>
                  <span>{pro.experienceYears} yrs exp</span>
                </div>

                {/* Pricing Structure Box */}
                <div className="mt-3.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-700 font-medium">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                      Diagnosis Fee:
                    </span>
                    <span className="font-extrabold text-blue-700">₹149</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-[11px] text-slate-500">Repair Price:</span>
                    <span className="font-semibold text-slate-700">Decided after diagnosis</span>
                  </div>
                </div>
              </div>

              {/* Zero Commission Footer */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>100% of payment to pro</span>
                </span>
                <span className="text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                  Request &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Trust & Safety Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-2.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-[#071A36]">₹149 Diagnosis First</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Technician visits, diagnoses the exact fault, and provides a clear breakdown. No surprise charges.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-[#071A36]">Approval Locks The Price</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            You review parts and labour breakdown. Work starts only after you approve the locked estimate.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-2.5">
            <Award className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-[#071A36]">₹0 Platform Commission</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            100% of your approved payment goes directly to the hardworking local pro.
          </p>
        </div>
      </section>
    </div>
  );
};
