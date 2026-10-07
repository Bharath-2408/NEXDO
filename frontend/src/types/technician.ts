export interface JobOpportunity {
  id: string;
  serviceName: string;
  category: string;
  customerArea: string;
  distanceKm: number;
  requestedTime: string;
  diagnosisFee: number;
  repairPriceDecidedAfterDiagnosis: boolean;
  approvedRepairAmount?: number;
  estimatedPayout?: number;
  urgency: 'NORMAL' | 'URGENT' | 'HIGH';
  status: 'ELIGIBLE' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
  requiredCapability: string;
  customerNameMasked: string;
  issueDescription: string;
  serviceMode?: 'DIAGNOSIS' | 'SERVICE';
  announcementTamil: string;
  announcementEnglish: string;
}

export interface TechnicianEarnings {
  todayEarnings: number;
  thisWeekEarnings: number;
  thisMonthEarnings: number;
  totalJobs: number;
  platformFeeCharged: number;
  activeSubscriptionTitle: string;
  recentPayouts: Array<{
    id: string;
    date: string;
    jobTitle: string;
    amount: number;
    customerMasked: string;
  }>;
}
