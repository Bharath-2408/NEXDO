import { AccessPlan, PricingConfig } from '../types/pricing';

export const PRICING_CONFIG: PricingConfig = {
  currency: 'INR',
  symbol: '₹',
  dailyAccessPrice: 99,
  weeklyAccessPrice: 599,
  monthlyAccessPrice: 2499,
  commissionRate: 0,
  guaranteeJobsClaim: false,
};

export const PRICING_PLANS: AccessPlan[] = [
  {
    id: 'daily_pass',
    type: 'DAILY',
    title: 'Daily Access Pass',
    price: PRICING_CONFIG.dailyAccessPrice,
    periodText: 'per day',
    tagline: 'Unlimited eligible jobs during active 24-hour access',
    badge: 'Flexible Day Pass',
    features: [
      'Unlimited eligible job requests during your active day',
      'Zero commission — keep 100% of customer job earnings',
      'Real-time voice & audio incoming job announcements',
      'Direct customer phone & navigation coordinates',
      'Instant payout handoff on service completion',
    ],
    truthfulDisclaimer:
      'Unlimited access allows receiving all requests matching your capabilities and area without artificial caps. It does not guarantee customer request volume or job allocations.',
    recommended: false,
  },
  {
    id: 'weekly_pass',
    type: 'WEEKLY',
    title: 'Weekly Access Pass',
    price: PRICING_CONFIG.weeklyAccessPrice,
    periodText: 'per week',
    tagline: 'High flexibility for active weekly service schedules',
    badge: 'Best Flexibility',
    features: [
      '7 days uninterrupted eligible job access',
      'Save over ₹90 compared to daily renewals',
      'Zero commission — keep 100% of customer job earnings',
      'Real-time voice & audio incoming job announcements',
      'Direct customer phone & navigation coordinates',
      'Instant payout handoff on service completion',
    ],
    truthfulDisclaimer:
      'Provides continuous platform access for 7 days with zero per-job commission. Service demand depends on local customer requests and is not guaranteed.',
    recommended: false,
  },
  {
    id: 'monthly_pass',
    type: 'MONTHLY',
    title: 'Monthly Access Pass',
    price: PRICING_CONFIG.monthlyAccessPrice,
    periodText: 'per month',
    tagline: 'Best value for dedicated full-time service professionals',
    badge: 'Most Popular',
    features: [
      '30 days uninterrupted eligible job access',
      'Save over ₹470 compared to daily renewals',
      'Zero commission — keep 100% of customer job earnings',
      'Priority capability matching in your service radius',
      'Voice announcements in your preferred local language',
      'Dedicated partner phone support line',
    ],
    truthfulDisclaimer:
      'Provides continuous platform access for 30 days with no per-job commission. Service demand depends on local customer requests and is not guaranteed.',
    recommended: true,
  },
];
