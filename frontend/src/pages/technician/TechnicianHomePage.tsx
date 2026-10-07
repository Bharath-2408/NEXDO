import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Power } from 'lucide-react';
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
    earnings,
    capabilities,
  } = useTechnician();
  const navigate = useNavigate();

  const activeCapsCount = capabilities.filter((c) => c.active).length;

  return (
    <div className="text-left space-y-5 pb-6">
      {/* 1. Top Availability & Access State */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-[#071A36]">
              Technician Operations
            </h2>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                isOnline ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {isOnline ? '● Online · Receiving Requests' : '○ Offline'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Eligible service opportunities matching your {activeCapsCount} active capabilities within your coverage radius.
          </p>
        </div>

        {/* Online Toggle & Access Pass Button */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isOnline ? 'outline' : 'primary'}
            leftIcon={<Power className="w-3.5 h-3.5" />}
            onClick={toggleOnline}
          >
            {isOnline ? 'Go Offline' : 'Go Online'}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate('/technician/subscription')}
          >
            Pass: {earnings.activeSubscriptionTitle.split(' ')[0]}
          </Button>
        </div>
      </div>

      {/* 2. Voice Announcement Banner */}
      {opportunities.length > 0 && (
        <VoiceAnnouncementBanner
          opportunity={opportunities[0]}
          announcementTamil={opportunities[0].announcementTamil}
          announcementEnglish={opportunities[0].announcementEnglish}
        />
      )}

      {/* 3. Relevant Eligible Opportunities */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-extrabold text-[#071A36]">
              Eligible Service Opportunities ({opportunities.length})
            </h3>
            <p className="text-xs text-slate-500">
              Demand-based requests. Acceptance is first-response among verified technicians.
            </p>
          </div>
        </div>

        {opportunities.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-xl border border-slate-200 shadow-2xs">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No new requests in your area right now</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
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
      </div>

      {/* 4. Today's Activity & Zero Commission Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Today's Earnings</span>
          <span className="text-lg font-black text-emerald-700 mt-0.5 block">
            ₹{earnings.todayEarnings}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">100% Retained</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Eligible Requests</span>
          <span className="text-lg font-black text-blue-700 mt-0.5 block">
            {opportunities.length} Available
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Nearby Zone</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Active Capabilities</span>
          <span className="text-lg font-black text-slate-800 mt-0.5 block">
            {activeCapsCount} Skills
          </span>
          <button
            onClick={() => navigate('/technician/capabilities')}
            className="text-[10px] font-semibold text-blue-600 hover:underline cursor-pointer"
          >
            Manage Skills →
          </button>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Platform Fee</span>
          <span className="text-lg font-black text-slate-800 mt-0.5 block">0%</span>
          <span className="text-[10px] text-emerald-700 font-bold">Zero Commission</span>
        </div>
      </div>
    </div>
  );
};
