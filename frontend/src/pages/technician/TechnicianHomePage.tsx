import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Power, Navigation, AlertCircle, ShieldCheck, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { useTechnician } from '../../store/TechnicianContext';
import { OpportunityCard } from '../../components/technician/OpportunityCard';
import { VoiceAnnouncementBanner } from '../../components/technician/VoiceAnnouncementBanner';
import { Button } from '../../components/ui/Button';

export const TechnicianHomePage: React.FC = () => {
  const {
    opportunities,
    acceptOpportunity,
    rejectOpportunity,
    isOnline,
    toggleOnline,
    isLocationSharing,
    currentLocation,
    locationError,
    toggleLocationSharing,
    earnings,
    capabilities,
  } = useTechnician();
  const navigate = useNavigate();

  const activeCapsCount = capabilities.filter((c) => c.active).length;

  return (
    <div className="text-left space-y-6 pb-12">
      {/* 1. Top Availability & Access Status Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-[#071A36] tracking-tight">
              Service Provider Dashboard
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {isOnline ? '● Online · Receiving Requests' : '○ Offline'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Eligible service opportunities matching your {activeCapsCount} active capabilities within your coverage radius.
          </p>
        </div>

        {/* Online Toggle & Access Pass Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            size="sm"
            variant={isOnline ? 'outline' : 'primary'}
            leftIcon={<Power className="w-3.5 h-3.5" />}
            onClick={toggleOnline}
            className={isOnline ? 'font-bold' : 'bg-[#071A36] hover:bg-emerald-600 font-bold'}
          >
            {isOnline ? 'Go Offline' : 'Go Online'}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate('/technician/subscription')}
            className="font-bold border border-slate-200"
          >
            Pass: {earnings.activeSubscriptionTitle.split(' ')[0]}
          </Button>
        </div>
      </div>

      {/* 2. Live GPS Broadcasting Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3.5">
          <div
            className={`p-3 rounded-2xl ${
              isLocationSharing
                ? 'bg-emerald-50 text-emerald-600 ring-4 ring-emerald-100'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            <Navigation className={`w-5 h-5 ${isLocationSharing ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-extrabold text-[#071A36]">Live GPS Location Broadcast</h4>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                  isLocationSharing
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {isLocationSharing ? 'Broadcasting Active' : 'Off'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed font-medium">
              {isLocationSharing
                ? currentLocation?.accuracy
                  ? `Broadcasting GPS coordinates (accuracy ±${Math.round(currentLocation.accuracy)}m)`
                  : 'Broadcasting live location for assigned bookings'
                : 'Turn on to broadcast your real-time ETA and location to customers with active bookings.'}
            </p>
            {locationError && (
              <p className="text-xs text-amber-700 font-bold mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{locationError}</span>
              </p>
            )}
          </div>
        </div>

        <div className="self-end sm:self-auto shrink-0">
          <Button
            size="sm"
            variant={isLocationSharing ? 'outline' : 'primary'}
            disabled={!isOnline}
            onClick={() => toggleLocationSharing()}
            className={isLocationSharing ? 'font-bold' : 'bg-emerald-600 hover:bg-emerald-700 font-bold'}
          >
            {isLocationSharing ? 'Stop Location Sharing' : 'Share My Live Location'}
          </Button>
        </div>
      </div>

      {/* 3. Voice Announcement Banner */}
      {opportunities.length > 0 && (
        <VoiceAnnouncementBanner
          opportunity={opportunities[0]}
          announcementTamil={opportunities[0].announcementTamil}
          announcementEnglish={opportunities[0].announcementEnglish}
        />
      )}

      {/* 4. Relevant Eligible Opportunities */}
      <section className="space-y-3.5" aria-label="Available Requests">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#071A36] tracking-tight">
              Available Service Requests ({opportunities.length})
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Demand-based requests. Acceptance is first-response among verified service providers.
            </p>
          </div>
        </div>

        {opportunities.length === 0 ? (
          /* Exact required string preserved for test & platform compliance */
          <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/90 shadow-xs max-w-lg mx-auto p-8 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-300 flex items-center justify-center mx-auto mb-2">
              <Bell className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold text-slate-700">No new service requests</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              Keep your status Online. New customer requests will broadcast with voice announcements.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {opportunities.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                onAccept={(id) => {
                  acceptOpportunity(id);
                  navigate('/technician/jobs');
                }}
                onReject={rejectOpportunity}
              />
            ))}
          </div>
        )}
      </section>

      {/* 5. Today's Activity & Zero Commission Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">
            Today's Earnings
          </span>
          <span className="text-2xl font-black text-emerald-700 mt-0.5 block tracking-tight">
            ₹{earnings.todayEarnings}
          </span>
          <span className="text-[10px] text-slate-500 font-semibold">100% Retained</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">
            Eligible Requests
          </span>
          <span className="text-2xl font-black text-blue-700 mt-0.5 block tracking-tight">
            {opportunities.length} Available
          </span>
          <span className="text-[10px] text-slate-500 font-semibold">Nearby Zone</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">
            Active Capabilities
          </span>
          <span className="text-2xl font-black text-slate-800 mt-0.5 block tracking-tight">
            {activeCapsCount} Skills
          </span>
          <button
            onClick={() => navigate('/technician/capabilities')}
            className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
          >
            Manage Skills →
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">
            Platform Fee
          </span>
          <span className="text-2xl font-black text-slate-800 mt-0.5 block tracking-tight">
            0%
          </span>
          <span className="text-[10px] text-emerald-700 font-black">Zero Commission</span>
        </div>
      </div>
    </div>
  );
};
