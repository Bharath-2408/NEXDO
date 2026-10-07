export interface AccessPlan {
  id: string;
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  title: string;
  price: number;
  periodText: string;
  badge?: string;
  tagline: string;
  features: string[];
  truthfulDisclaimer: string;
  recommended?: boolean;
}

export interface PricingConfig {
  currency: string;
  symbol: string;
  dailyAccessPrice: number;
  weeklyAccessPrice: number;
  monthlyAccessPrice: number;
  commissionRate: number;
  guaranteeJobsClaim: false;
}
