import { CanonicalAction } from '../types/actions';
import { MatchedProvider } from '../types/customer';
import { JobOpportunity } from '../types/technician';

export interface ScreenContext {
  currentPath: string;
  role: 'CUSTOMER' | 'TECHNICIAN';
  visibleProviders?: MatchedProvider[];
  visibleOpportunities?: JobOpportunity[];
  activeBookingId?: string;
  activeBooking?: any;
  pendingConfirmationAction?: CanonicalAction | null;
}

export function resolveContextualAction(
  action: CanonicalAction,
  context: ScreenContext
): CanonicalAction {
  // 1. SELECT_PROVIDER / SELECT_TECHNICIAN / VIEW_TECHNICIAN_PROFILE: resolve provider from visible list by index or matching
  if (
    (action.type === 'SELECT_PROVIDER' ||
      action.type === 'SELECT_TECHNICIAN' ||
      action.type === 'VIEW_TECHNICIAN_PROFILE') &&
    context.visibleProviders &&
    context.visibleProviders.length > 0
  ) {
    const targetIdx = action.payload?.index ?? 0;
    const safeIdx = Math.min(Math.max(0, targetIdx), context.visibleProviders.length - 1);
    const provider = context.visibleProviders[safeIdx];
    if (provider) {
      return {
        ...action,
        payload: {
          ...action.payload,
          providerId: provider.id,
          provider,
          index: safeIdx,
        },
      };
    }
  }

  // 2. ACCEPT_REQUEST: resolve opportunity by index
  if (action.type === 'ACCEPT_REQUEST' && context.visibleOpportunities && context.visibleOpportunities.length > 0) {
    const targetIdx = action.payload?.index ?? 0;
    const safeIdx = Math.min(Math.max(0, targetIdx), context.visibleOpportunities.length - 1);
    const opp = context.visibleOpportunities[safeIdx];
    if (opp) {
      return {
        ...action,
        payload: {
          ...action.payload,
          opportunityId: opp.id,
          opportunity: opp,
          index: safeIdx,
        },
      };
    }
  }

  // 3. REJECT_REQUEST: resolve opportunity by index
  if (action.type === 'REJECT_REQUEST' && context.visibleOpportunities && context.visibleOpportunities.length > 0) {
    const targetIdx = action.payload?.index ?? 0;
    const safeIdx = Math.min(Math.max(0, targetIdx), context.visibleOpportunities.length - 1);
    const opp = context.visibleOpportunities[safeIdx];
    if (opp) {
      return {
        ...action,
        payload: {
          ...action.payload,
          opportunityId: opp.id,
          opportunity: opp,
          index: safeIdx,
        },
      };
    }
  }

  // 4. CHECK_TECHNICIAN_LOCATION: resolve active booking ID if not in payload
  if (action.type === 'CHECK_TECHNICIAN_LOCATION') {
    const bId = action.payload?.bookingId || context.activeBookingId || context.activeBooking?.id;
    return {
      ...action,
      payload: {
        ...action.payload,
        bookingId: bId,
      },
    };
  }

  // 5. CONFIRM_BOOKING / CANCEL_BOOKING
  if (action.type === 'CONFIRM_BOOKING' || action.type === 'CANCEL_BOOKING') {
    const bId = action.payload?.bookingId || context.activeBookingId || context.activeBooking?.id;
    return {
      ...action,
      payload: {
        ...action.payload,
        bookingId: bId,
      },
    };
  }

  // 6. Technician Job Progress Actions: START_WORK / MARK_ARRIVED / MARK_ON_THE_WAY
  if (
    action.type === 'START_WORK' ||
    action.type === 'MARK_ARRIVED' ||
    action.type === 'MARK_ON_THE_WAY'
  ) {
    const jId = action.payload?.jobId || context.activeBookingId || context.activeBooking?.id;
    return {
      ...action,
      payload: {
        ...action.payload,
        jobId: jId,
      },
    };
  }

  return action;
}
