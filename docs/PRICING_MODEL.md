# NEXDO Technician Pricing & Subscription Model

## 1. Strategic Philosophy: 0% Commission

Traditional service aggregation platforms charge technicians exorbitant take rates (15% to 30% per completed job). This leads to:
- Disgruntled technicians who attempt to negotiate off-platform.
- Inflated prices for end customers.
- Opaque billing and distrust.

NEXDO operates on a transparent, flat-rate platform subscription with **0% commission** on completed jobs:
- **Technicians keep 100% of their service fee.**
- Technicians pay only a predictable, transparent access fee for platform dispatch and verified customer discovery.

## 2. Truthful & Compliant Communication

NEXDO enforces strict ethical marketing standards:
- **No Deceptive Guarantees**: We never claim "guaranteed work", "instant ₹50,000 monthly income", or "100% job confirmation".
- **Truthful Wording**: Subscription fees provide *"Verified Customer Access"* and *"Direct Voice Demand Dispatch"*, not guaranteed income.

## 3. Configurable Subscription Tiers

All subscription parameters are centralized in `constants/pricing.ts` and configurable without code refactoring:

```typescript
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan_daily',
    tier: 'daily',
    name: 'Daily Pass',
    priceINR: 99,
    billingCycle: 'per day',
    description: 'Perfect for technicians testing the platform or working flexible days.',
    features: [
      'Full access to all nearby voice-dispatched leads',
      '0% commission on all completed services',
      'Multi-capability job matching active for 24 hours',
      'Direct customer phone and chat connection',
      'Instant UPI payout directly from customer'
    ],
    highlightBadge: 'Flexible'
  },
  {
    id: 'plan_monthly',
    tier: 'monthly',
    name: 'Monthly Pro Pass',
    priceINR: 2499,
    billingCycle: 'per month',
    description: 'Best value for professional technicians seeking steady direct customer demand.',
    features: [
      'Unlimited 30-day access to all verified local leads',
      '0% commission on every job you accept',
      'Priority AI voice dispatch matching',
      'Add unlimited service capabilities',
      'Dedicated field technician support channel',
      'Save over ₹470 compared to daily passes'
    ],
    highlightBadge: 'Most Popular',
    recommended: true
  }
];
```
