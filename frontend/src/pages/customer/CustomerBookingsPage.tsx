import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronRight, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import { useCustomer } from '../../store/CustomerContext';
import { useVoice } from '../../voice/VoiceContext';
import { useApp } from '../../store/AppContext';
import { Tabs } from '../../components/ui/Tabs';

export const CustomerBookingsPage: React.FC = () => {
  const { bookings } = useCustomer();
  const { registerPageActionHandler, updateConversationContext } = useVoice();
  const { showToast } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active');

  const activeList = bookings.filter((b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED');
  const pastList = bookings.filter((b) => b.status === 'COMPLETED' || b.status === 'CANCELLED');

  const tabs = [
    { id: 'active', label: 'Active Requests', badge: activeList.length },
    { id: 'past', label: 'Service History', badge: pastList.length },
  ];

  const currentList = activeTab === 'active' ? activeList : pastList;

  useEffect(() => {
    updateConversationContext({
      currentScreen: '/customer/bookings',
      role: 'customer',
    });

    const unregister = registerPageActionHandler((action) => {
      if (action.type === 'SWITCH_TAB') {
        const target = (action.payload?.tab || '').toLowerCase();
        if (target.includes('past') || target.includes('history')) {
          setActiveTab('past');
          showToast('Switched to Service History', 'info');
          return true;
        }
        if (target.includes('active') || target.includes('current')) {
          setActiveTab('active');
          showToast('Switched to Active Requests', 'info');
          return true;
        }
      }
      return false;
    });

    return unregister;
  }, [registerPageActionHandler, updateConversationContext, showToast]);

  return (
    <div className="text-left space-y-6 pb-12">
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#071A36] tracking-tight">
          My Service Bookings
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          Track real-time appointments, doorstep arrival, and historical service records.
        </p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {currentList.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/90 shadow-xs max-w-lg mx-auto p-8 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            No {activeTab === 'active' ? 'active' : 'past'} bookings found
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Tell NEXDO what you need in Tamil or English to book a background-verified neighborhood professional.
          </p>
          <button
            onClick={() => navigate('/customer')}
            className="mt-3 px-5 py-2.5 bg-[#071A36] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Explore Services
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {currentList.map((bk) => (
            <div
              key={bk.id}
              onClick={() => navigate(`/customer/tracking/${bk.id}`)}
              className="nexdo-card-interactive p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  {bk.provider?.avatar ? (
                    <img
                      src={bk.provider.avatar}
                      alt={bk.provider.name}
                      className="w-13 h-13 rounded-2xl object-cover border border-slate-200 shadow-2xs"
                    />
                  ) : (
                    <div className="w-13 h-13 rounded-2xl bg-blue-100 text-blue-800 font-black text-sm flex items-center justify-center border border-blue-200 shadow-2xs">
                      {bk.provider?.name ? bk.provider.name.slice(0, 2) : 'SP'}
                    </div>
                  )}
                  {bk.provider?.verified && (
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-2xs">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        bk.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : bk.status === 'CANCELLED'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {bk.status}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {bk.serviceMode === 'SERVICE' ? 'Service / Repair' : 'Diagnosis'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Ref: {bk.referenceCode}</span>
                  </div>

                  <h4 className="text-base font-extrabold text-[#071A36] group-hover:text-blue-600 transition-colors mt-1 truncate">
                    {bk.serviceTitle}
                  </h4>

                  <p className="text-xs text-slate-500 mt-0.5 font-medium flex items-center gap-2">
                    <span>
                      Service Provider: <strong className="text-slate-800">{bk.provider?.name}</strong>
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {bk.scheduledTime}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="text-left sm:text-right">
                  <span className="text-base font-black text-[#071A36] block">
                    {bk.serviceMode === 'SERVICE'
                      ? bk.estimate?.isApproved
                        ? `₹${bk.estimate.total}`
                        : 'Direct Service'
                      : bk.estimate?.isApproved
                      ? `₹${bk.estimate.total}`
                      : `₹${bk.diagnosis?.fee || 149}`}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    {bk.serviceMode === 'SERVICE'
                      ? bk.estimate?.isApproved
                        ? 'Approved Total'
                        : 'Estimate Pending'
                      : bk.estimate?.isApproved
                      ? 'Approved Total'
                      : 'Diagnosis Fee'}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-blue-50 text-slate-400 group-hover:text-blue-600 flex items-center justify-center transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
