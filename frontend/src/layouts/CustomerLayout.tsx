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
import { useCustomer } from '../store/CustomerContext';

export const CustomerLayout: React.FC = () => {
  const { toast, clearToast, showToast } = useApp();
  const { setActionCallback, updateConversationContext } = useVoice();
  const {
    matchedProviders,
    selectedProvider,
    selectProvider,
    getProviderById,
    activeBooking,
    cancelBooking,
    setActiveNeed,
    approveEstimate,
    createBooking,
  } = useCustomer();
  const navigate = useNavigate();
  const location = useLocation();

  // Synchronize Live Conversation Context
  useEffect(() => {
    updateConversationContext({
      currentScreen: location.pathname,
      role: 'customer',
      visibleProviders: matchedProviders,
      activeBooking: activeBooking
        ? {
            id: activeBooking.id,
            service: activeBooking.serviceTitle,
            status: activeBooking.status,
            technicianName: activeBooking.provider?.name,
            time: activeBooking.scheduledTime,
          }
        : undefined,
    });
  }, [location.pathname, matchedProviders, activeBooking, updateConversationContext]);

  useEffect(() => {
    setActionCallback((action) => {
      const resolved = resolveContextualAction(action, {
        currentPath: window.location.pathname,
        role: 'CUSTOMER',
        visibleProviders: matchedProviders,
        activeBookingId: activeBooking?.id,
        activeBooking,
      });

      dispatchCanonicalAction(resolved, {
        navigate,
        role: 'customer',
        currentRoute: location.pathname,
        onExpressNeed: (need) => {
          if (need) {
            setActiveNeed(need);
          }
          navigate('/customer/express');
        },
        onCancelBooking: (id) => {
          const targetId = id || activeBooking?.id;
          if (targetId) cancelBooking(targetId);
          showToast('Booking cancelled', 'warning');
        },
        onApproveEstimate: (id) => {
          const targetId = id || activeBooking?.id;
          if (targetId) {
            approveEstimate(targetId);
            showToast('Estimate Approved! Price locked at ₹1,100.', 'success');
          }
        },
        onSelectProvider: (providerId) => {
          const prov =
            (providerId ? (matchedProviders.find((p) => p.id === providerId) || getProviderById(providerId)) : null) ||
            selectedProvider;
          if (prov) {
            selectProvider(prov);
            navigate(`/customer/book/${prov.id}`);
          } else {
            navigate(`/customer/book/${providerId}`);
          }
        },
        onConfirmBooking: (providerId) => {
          const targetProv =
            (providerId ? (matchedProviders.find((p) => p.id === providerId) || getProviderById(providerId)) : null) ||
            selectedProvider ||
            matchedProviders[0];
          if (targetProv) {
            selectProvider(targetProv);
            navigate(`/customer/book/${targetProv.id}`);
          } else {
            navigate('/customer/providers');
          }
        },
        onViewTechnicianProfile: (providerId) => {
          navigate(`/customer/providers/${providerId}`);
        },
        onLogout: () => {
          navigate('/login');
          showToast('Logged out successfully', 'info');
        },
        showToast,
      });
    });
  }, [matchedProviders, selectedProvider, selectProvider, getProviderById, activeBooking, navigate, location.pathname, setActionCallback, cancelBooking, setActiveNeed, approveEstimate, createBooking, showToast]);

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
