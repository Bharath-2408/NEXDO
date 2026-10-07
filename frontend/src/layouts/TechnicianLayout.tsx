import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { TopHeader } from '../components/navigation/TopHeader';
import { BottomNavigation } from '../components/navigation/BottomNavigation';
import { FloatingVoiceButton } from '../components/voice/FloatingVoiceButton';
import { Toast } from '../components/ui/Toast';
import { useApp } from '../store/AppContext';
import { useVoice } from '../voice/VoiceContext';
import { dispatchCanonicalAction } from '../voice/actionDispatcher';
import { resolveContextualAction } from '../voice/contextResolver';
import { useTechnician } from '../store/TechnicianContext';

export const TechnicianLayout: React.FC = () => {
  const { toast, clearToast, showToast } = useApp();
  const { setActionCallback, updateConversationContext } = useVoice();
  const {
    opportunities,
    activeJob,
    acceptOpportunity,
    rejectOpportunity,
    setOnlineStatus,
    startWork,
    advanceTechnicianStep,
    activateSubscription,
  } = useTechnician();
  const navigate = useNavigate();
  const location = useLocation();

  // Synchronize Live Conversation Context
  useEffect(() => {
    updateConversationContext({
      currentScreen: location.pathname,
      role: 'technician',
      visibleOpportunities: opportunities.map((o) => ({
        id: o.id,
        title: o.serviceName,
        category: o.category,
        diagnosisFee: `₹${o.diagnosisFee || 149}`,
        repairPrice: o.approvedRepairAmount ? `₹${o.approvedRepairAmount}` : 'Decided after diagnosis',
        payout: o.approvedRepairAmount || o.diagnosisFee || 149,
        distance: `${o.distanceKm} km`,
      })),
      activeBooking: activeJob
        ? {
            id: activeJob.id,
            service: activeJob.serviceName,
            status: activeJob.status,
            technicianName: 'You',
            time: activeJob.requestedTime,
          }
        : undefined,
    });
  }, [location.pathname, opportunities, activeJob, updateConversationContext]);

  useEffect(() => {
    setActionCallback((action) => {
      const resolved = resolveContextualAction(action, {
        currentPath: window.location.pathname,
        role: 'TECHNICIAN',
        visibleOpportunities: opportunities,
        activeBookingId: activeJob?.id,
        activeBooking: activeJob,
      });

      dispatchCanonicalAction(resolved, {
        navigate,
        role: 'technician',
        currentRoute: location.pathname,
        onAcceptOpportunity: (oppId) => {
          acceptOpportunity(oppId);
          showToast('Opportunity accepted! Navigating to Job Details', 'success');
          navigate('/technician/jobs');
        },
        onRejectOpportunity: (oppId) => {
          rejectOpportunity(oppId);
          showToast('Passed request', 'info');
        },
        onStartWork: (jobId) => {
          const targetId = jobId || activeJob?.id || 'job_accepted_01';
          startWork(targetId);
          showToast('Job started! Proceeding with repair work.', 'success');
        },
        onMarkArrived: (jobId) => {
          const targetId = jobId || activeJob?.id || 'job_accepted_01';
          advanceTechnicianStep(targetId, 'ARRIVED');
          showToast('Marked arrived at doorstep', 'success');
        },
        onMarkOnTheWay: (jobId) => {
          const targetId = jobId || activeJob?.id || 'job_accepted_01';
          advanceTechnicianStep(targetId, 'TECHNICIAN_ON_THE_WAY');
          showToast('Started journey. Customer notified.', 'info');
        },
        onCompleteJob: (jobId) => {
          const targetId = jobId || activeJob?.id || 'job_accepted_01';
          advanceTechnicianStep(targetId, 'COMPLETED');
          showToast('Marked job completed! Awaiting customer verification.', 'success');
        },
        onLogout: () => {
          navigate('/login');
          showToast('Logged out successfully', 'info');
        },
        onSetAvailability: setOnlineStatus,
        onActivateSubscription: activateSubscription,
        showToast,
      });
    });
  }, [opportunities, activeJob, navigate, location.pathname, setActionCallback, acceptOpportunity, rejectOpportunity, setOnlineStatus, startWork, advanceTechnicianStep, activateSubscription, showToast]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 pb-24 sm:pb-28">
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
      <TopHeader />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-5">
        <Outlet />
      </main>
      <FloatingVoiceButton />
      <BottomNavigation />
    </div>
  );
};
