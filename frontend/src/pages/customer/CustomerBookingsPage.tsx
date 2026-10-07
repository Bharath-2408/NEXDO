import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronRight } from 'lucide-react';
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
    <div className="text-left space-y-5">
      <div>
        <h2 className="text-2xl font-black text-[#071A36]">My Service Bookings</h2>
        <p className="text-xs text-slate-500 mt-1">Track scheduled appointments and past service history.</p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {currentList.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-3xl border border-slate-200">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">No {activeTab} bookings found</p>
          <p className="text-xs text-slate-400 mt-1">Tell NEXDO what you need to book a verified technician.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentList.map((bk) => (
            <div
              key={bk.id}
              onClick={() => navigate(`/customer/tracking/${bk.id}`)}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <img
                  src={bk.provider.avatar}
                  alt={bk.provider.name}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {bk.status}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {bk.serviceMode === 'SERVICE' ? 'Service / Repair' : 'Diagnosis'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Ref: {bk.referenceCode}</span>
                  </div>
                  <h4 className="text-base font-bold text-[#071A36] mt-1">{bk.serviceTitle}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pro: <span className="font-semibold text-slate-800">{bk.provider.name}</span> · {bk.scheduledTime}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="text-right">
                  <span className="text-base font-extrabold text-[#071A36]">
                    {bk.serviceMode === 'SERVICE'
                      ? (bk.estimate?.isApproved ? `₹${bk.estimate.total}` : 'Direct Service')
                      : (bk.estimate?.isApproved ? `₹${bk.estimate.total}` : `₹${bk.diagnosis?.fee || 149}`)}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-medium">
                    {bk.serviceMode === 'SERVICE'
                      ? (bk.estimate?.isApproved ? 'Approved Total' : 'Estimate Pending')
                      : (bk.estimate?.isApproved ? 'Approved Total' : 'Diagnosis Fee')}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
