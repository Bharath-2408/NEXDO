import { CanonicalAction } from '../types/actions';
import { NavigateFunction } from 'react-router-dom';

export interface ActionDispatcherDependencies {
  navigate: NavigateFunction;
  role?: 'customer' | 'technician';
  currentRoute?: string;
  onExpressNeed?: (need: any) => void;
  onSelectProvider?: (providerId: string) => void;
  onConfirmBooking?: (providerId?: string) => void;
  onCancelBooking?: (bookingId?: string) => void;
  onApproveEstimate?: (bookingId?: string) => void;
  onAcceptOpportunity?: (oppId: string) => void;
  onRejectOpportunity?: (oppId: string) => void;
  onSetAvailability?: (online: boolean) => void;
  onActivateSubscription?: (type: 'DAILY' | 'WEEKLY' | 'MONTHLY') => void;
  onSystemConfirm?: () => void;
  onSystemCancel?: () => void;
  onStartWork?: (jobId?: string) => void;
  onMarkArrived?: (jobId?: string) => void;
  onMarkOnTheWay?: (jobId?: string) => void;
  onCompleteJob?: (jobId?: string) => void;
  onLogout?: () => void;
  onViewTechnicianProfile?: (providerId?: string) => void;
  onSwitchLanguage?: (lang: string) => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export function dispatchCanonicalAction(
  action: CanonicalAction,
  deps: ActionDispatcherDependencies
) {
  console.log('[CanonicalActionDispatcher] Executing action:', action, 'with role:', deps.role);

  const isTechnician =
    deps.role === 'technician' ||
    (typeof window !== 'undefined' && window.location.pathname.startsWith('/technician'));

  switch (action.type) {
    // 0. Role and Language Switching
    case 'SWITCH_ROLE_CUSTOMER':
      if (deps.currentRoute !== '/customer') {
        deps.navigate('/customer');
        deps.showToast('Switched to Customer Mode');
      }
      break;

    case 'SWITCH_ROLE_TECHNICIAN':
      if (deps.currentRoute !== '/technician') {
        deps.navigate('/technician');
        deps.showToast('Switched to Technician Mode');
      }
      break;

    case 'SWITCH_LANGUAGE': {
      const target = action.payload?.language === 'ta' ? 'ta' : 'en';
      if (deps.onSwitchLanguage) {
        deps.onSwitchLanguage(target);
      }
      deps.showToast(target === 'ta' ? 'மொழி தமிழுக்கு மாற்றப்பட்டது' : 'Language set to English', 'success');
      break;
    }

    // 1. Home Navigation
    case 'NAVIGATE_HOME':
    case 'GO_HOME':
      if (isTechnician) {
        if (deps.currentRoute !== '/technician') {
          deps.navigate('/technician');
          deps.showToast('Navigated to Technician Home');
        }
      } else {
        if (deps.currentRoute !== '/customer') {
          deps.navigate('/customer');
          deps.showToast('Navigated to Customer Home');
        }
      }
      break;

    case 'NAVIGATE_TECHNICIAN_HOME':
      deps.navigate('/technician');
      deps.showToast('Navigated to Technician Home');
      break;

    // 2. Bookings / Jobs Navigation
    case 'NAVIGATE_BOOKINGS':
    case 'GO_BOOKINGS':
    case 'OPEN_BOOKINGS':
    case 'VIEW_BOOKINGS':
    case 'VIEW_BOOKING_DETAILS':
      if (isTechnician) {
        deps.navigate('/technician/jobs');
        deps.showToast('Opening Assigned Jobs');
      } else {
        deps.navigate('/customer/bookings');
        deps.showToast('Opening Customer Bookings');
      }
      break;

    case 'CHECK_BOOKING_STATUS':
      if (isTechnician) {
        deps.navigate('/technician/jobs');
        deps.showToast('Checking Assigned Jobs Status');
      } else {
        deps.navigate('/customer/bookings');
        deps.showToast('Checking Current Booking Status');
      }
      break;

    // 3. Profile Navigation
    case 'NAVIGATE_PROFILE':
    case 'GO_PROFILE':
    case 'OPEN_PROFILE':
      if (isTechnician) {
        deps.navigate('/technician/profile');
        deps.showToast('Opening Technician Profile');
      } else {
        deps.navigate('/customer/profile');
        deps.showToast('Opening Customer Profile');
      }
      break;

    // 4. Providers / Technicians Navigation
    case 'NAVIGATE_PROVIDERS':
    case 'SEARCH_TECHNICIANS':
      deps.navigate('/customer/providers');
      deps.showToast('Showing Verified Technicians');
      break;

    // 5. Express Need Navigation
    case 'NAVIGATE_EXPRESS_NEED':
    case 'SEARCH_SERVICE':
    case 'EXPRESS_NEED':
    case 'CREATE_REQUEST':
      if (deps.onExpressNeed) deps.onExpressNeed(action.payload);
      deps.navigate('/customer/express');
      break;

    // 6. Live Tracking Navigation
    case 'NAVIGATE_TRACKING':
    case 'CHECK_TECHNICIAN_LOCATION':
      deps.navigate('/customer/tracking/bk_active_01');
      deps.showToast('Tracking technician en route');
      break;

    // 7. Jobs Navigation (Technician)
    case 'NAVIGATE_JOBS':
    case 'GO_JOBS':
    case 'SHOW_OPPORTUNITIES':
      deps.navigate('/technician/jobs');
      deps.showToast('Showing Eligible Opportunities');
      break;

    // 8. Earnings Navigation (Technician)
    case 'NAVIGATE_EARNINGS':
    case 'GO_EARNINGS':
    case 'SHOW_EARNINGS':
    case 'VIEW_EARNINGS':
      deps.navigate('/technician/earnings');
      deps.showToast('Opening Technician Earnings');
      break;

    // 9. Subscription Navigation (Technician)
    case 'NAVIGATE_SUBSCRIPTION':
    case 'GO_SUBSCRIPTION':
    case 'CHECK_SUBSCRIPTION':
    case 'OPEN_ACCESS_PASS':
      deps.navigate('/technician/subscription');
      deps.showToast('Showing Access Passes');
      break;

    case 'ACTIVATE_DAILY_PASS':
      if (deps.onActivateSubscription) deps.onActivateSubscription('DAILY');
      deps.navigate('/technician/subscription');
      deps.showToast('Activated Daily Access Pass (₹99)', 'success');
      break;

    case 'ACTIVATE_WEEKLY_PASS':
      if (deps.onActivateSubscription) deps.onActivateSubscription('WEEKLY');
      deps.navigate('/technician/subscription');
      deps.showToast('Activated Weekly Access Pass (₹599)', 'success');
      break;

    case 'ACTIVATE_MONTHLY_PASS':
      if (deps.onActivateSubscription) deps.onActivateSubscription('MONTHLY');
      deps.navigate('/technician/subscription');
      deps.showToast('Activated Monthly Unlimited Access Pass (₹2,499)', 'success');
      break;

    // 10. Capabilities Navigation (Technician)
    case 'NAVIGATE_CAPABILITIES':
    case 'GO_AVAILABILITY':
      deps.navigate('/technician/capabilities');
      deps.showToast('Showing Skills & Availability');
      break;

    // 11. Back Navigation
    case 'NAVIGATE_BACK':
    case 'GO_BACK':
    case 'BACK':
      deps.navigate(-1);
      deps.showToast('Going back');
      break;

    // 12. Support & Utilities
    case 'GO_SETTINGS':
      if (isTechnician) {
        deps.navigate('/technician/profile');
      } else {
        deps.navigate('/customer/profile');
      }
      deps.showToast('Opening Settings');
      break;
    case 'GO_NOTIFICATIONS':
    case 'OPEN_NOTIFICATIONS':
      deps.showToast('You have 0 unread notifications', 'info');
      break;
    case 'GO_SUPPORT':
    case 'OPEN_HELP':
      deps.showToast('NEXDO Support: Call 1800-NEXDO-PRO or chat with helpdesk', 'info');
      break;
    case 'GO_ACTIVITY':
    case 'OPEN_ACTIVITY':
      deps.navigate('/customer/bookings');
      deps.showToast('Opening Service Activity');
      break;
    case 'NEXT':
      deps.showToast('Showing next available option', 'info');
      break;
    case 'PREVIOUS':
      deps.showToast('Showing previous option', 'info');
      break;

    // Customer Actions
    case 'SELECT_PROVIDER':
    case 'SELECT_TECHNICIAN':
    case 'SELECT_FIRST_TECHNICIAN':
    case 'SELECT_NEAREST_TECHNICIAN':
      if (action.payload?.providerId) {
        if (deps.onSelectProvider) {
          deps.onSelectProvider(action.payload.providerId);
        } else {
          deps.navigate(`/customer/book/${action.payload.providerId}`);
        }
        deps.showToast(`Selected technician ${action.payload.provider?.name || ''}`.trim(), 'success');
      } else {
        deps.navigate('/customer/providers');
      }
      break;
    case 'START_BOOKING':
    case 'REQUEST_BOOKING':
      if (action.payload?.providerId) {
        deps.navigate(`/customer/book/${action.payload.providerId}`);
        deps.showToast(`Booking ${action.payload.provider?.name || 'technician'}`, 'info');
      } else {
        deps.navigate('/customer/providers');
      }
      break;
    case 'VIEW_TECHNICIAN_PROFILE':
      if (action.payload?.providerId) {
        if (deps.onViewTechnicianProfile) {
          deps.onViewTechnicianProfile(action.payload.providerId);
        } else {
          deps.navigate(`/customer/providers/${action.payload.providerId}`);
        }
        deps.showToast(`Opening profile of ${action.payload.provider?.name || 'technician'}`, 'info');
      } else {
        deps.navigate('/customer/providers');
      }
      break;
    case 'SHOW_ALTERNATIVES':
      deps.navigate('/customer/providers');
      deps.showToast('Showing alternative verified pros');
      break;
    case 'CONFIRM_BOOKING':
      if (deps.onConfirmBooking) {
        deps.onConfirmBooking(action.payload?.providerId);
      } else if (action.payload?.providerId) {
        deps.navigate(`/customer/book/${action.payload.providerId}`);
      } else {
        deps.navigate('/customer/providers');
      }
      break;
    case 'CANCEL_BOOKING':
      if (deps.onCancelBooking) deps.onCancelBooking(action.payload?.bookingId);
      break;
    case 'APPROVE_ESTIMATE':
      if (deps.onApproveEstimate) {
        deps.onApproveEstimate(action.payload?.bookingId);
      } else {
        deps.showToast('Estimate Approved! Price locked at ₹1,100.', 'success');
      }
      break;
    case 'INITIATE_PAYMENT':
    case 'PAY_DIAGNOSIS':
      deps.navigate(`/customer/payment/${action.payload?.bookingId || 'bk_active_01'}`);
      break;

    // Technician Actions
    case 'ACCEPT_REQUEST':
      if (deps.onAcceptOpportunity && action.payload?.opportunityId) {
        deps.onAcceptOpportunity(action.payload.opportunityId);
      }
      break;
    case 'REJECT_REQUEST':
      if (deps.onRejectOpportunity && action.payload?.opportunityId) {
        deps.onRejectOpportunity(action.payload.opportunityId);
      }
      break;
    case 'START_WORK':
      if (deps.onStartWork) {
        deps.onStartWork(action.payload?.jobId);
      } else {
        deps.showToast('Work started. Tracking active repair.', 'success');
      }
      break;
    case 'MARK_ARRIVED':
      if (deps.onMarkArrived) {
        deps.onMarkArrived(action.payload?.jobId);
      } else {
        deps.showToast('Marked arrived at customer location', 'success');
      }
      break;
    case 'MARK_ON_THE_WAY':
      if (deps.onMarkOnTheWay) {
        deps.onMarkOnTheWay(action.payload?.jobId);
      } else {
        deps.showToast('Journey started! Customer notified.', 'info');
      }
      break;
    case 'GO_ONLINE':
      if (deps.onSetAvailability) deps.onSetAvailability(true);
      deps.showToast('You are now Online and receiving eligible requests');
      break;
    case 'GO_OFFLINE':
      if (deps.onSetAvailability) deps.onSetAvailability(false);
      deps.showToast('You are now Offline');
      break;

    case 'COMPLETE_JOB':
    case 'MARK_JOB_COMPLETED':
      if (deps.onCompleteJob) {
        deps.onCompleteJob(action.payload?.jobId);
      } else {
        deps.showToast('Job marked completed! Payout credit authorized.', 'success');
      }
      break;

    case 'LOGOUT':
      if (deps.onLogout) {
        deps.onLogout();
      } else {
        deps.navigate('/login');
        deps.showToast('Logged out successfully', 'info');
      }
      break;

    case 'NAVIGATE_LOGIN':
      deps.navigate('/login');
      deps.showToast('Navigated to Login screen', 'info');
      break;

    case 'SUBMIT_LOGIN':
      deps.navigate('/select-role');
      deps.showToast('Logged in successfully', 'success');
      break;

    case 'NAVIGATE_SIGNUP':
      deps.navigate('/signup');
      deps.showToast('Navigated to Sign Up screen', 'info');
      break;

    case 'NAVIGATE_FORGOT_PASSWORD':
      deps.navigate('/forgot-password');
      deps.showToast('Navigated to Forgot Password screen', 'info');
      break;

    case 'NAVIGATE_ONBOARDING':
      deps.navigate('/onboarding');
      deps.showToast('Getting Started with NEXDO', 'info');
      break;

    case 'NAVIGATE_ROLE_SELECTION':
      deps.navigate('/select-role');
      deps.showToast('Choose Persona', 'info');
      break;

    case 'SHOW_NEXT_TECHNICIAN':
      deps.showToast('Showing next technician', 'info');
      break;

    case 'SHOW_PREVIOUS_TECHNICIAN':
      deps.showToast('Showing previous technician', 'info');
      break;

    case 'DESCRIBE_SELECTED_TECHNICIAN':
      deps.showToast('Describing technician qualifications', 'info');
      break;

    case 'SWITCH_TAB':
      deps.showToast(`Switched view to ${action.payload?.tab || 'requested tab'}`, 'info');
      break;

    // System Actions
    case 'CONFIRM':
    case 'YES':
      if (deps.onSystemConfirm) deps.onSystemConfirm();
      break;
    case 'CANCEL':
    case 'NO':
      if (deps.onSystemCancel) deps.onSystemCancel();
      break;

    default:
      console.warn('[ActionDispatcher] Unhandled action:', action.type);
      break;
  }
}
