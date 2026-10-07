// ============================================================================
// SUBSCRIPTION SERVICE
// Technician Access Passes (DAILY ₹99, WEEKLY ₹599, MONTHLY ₹2499)
// Stored in backend database (Supabase PostgreSQL / Nexdo Store)
// ============================================================================

import { dbStore } from '../database/store';
import {
  SubscriptionPlanRecord,
  TechnicianSubscriptionRecord,
} from '../database/types';

export class SubscriptionService {
  public static listPlans(): SubscriptionPlanRecord[] {
    return Array.from(dbStore.subscriptionPlans.values()).filter((p) => p.is_active);
  }

  public static getPlanByTier(
    tier: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  ): SubscriptionPlanRecord | undefined {
    return Array.from(dbStore.subscriptionPlans.values()).find(
      (p) => p.tier === tier && p.is_active
    );
  }

  public static getTechnicianActiveSubscription(
    technicianId: string
  ): TechnicianSubscriptionRecord | null {
    const now = new Date().toISOString();
    const subs = Array.from(dbStore.technicianSubscriptions.values()).filter(
      (s) => s.technician_id === technicianId && s.is_active && s.expires_at >= now
    );
    if (subs.length === 0) return null;
    // Return latest active
    return subs.sort(
      (a, b) => new Date(b.expires_at).getTime() - new Date(a.expires_at).getTime()
    )[0];
  }

  public static activateSubscription(
    technicianId: string,
    tier: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  ): TechnicianSubscriptionRecord {
    const plan = this.getPlanByTier(tier);
    if (!plan) {
      throw new Error(`Invalid subscription tier: ${tier}`);
    }

    const durationDays = plan.period_days || (tier === 'DAILY' ? 1 : tier === 'WEEKLY' ? 7 : 30);
    const now = new Date();
    const expires = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const newSub: TechnicianSubscriptionRecord = {
      id: `sub_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      technician_id: technicianId,
      plan_id: plan.id,
      plan_type: tier,
      price: plan.price,
      is_active: true,
      activated_at: now.toISOString(),
      expires_at: expires.toISOString(),
      payment_reference: `TXN_SUB_${tier}_${Date.now()}`,
      created_at: now.toISOString(),
    };

    dbStore.technicianSubscriptions.set(newSub.id, newSub);
    return newSub;
  }
}
