import { CanonicalServiceType } from '../voice/taxonomy';

export interface ServiceNeed {
  rawTranscript: string;
  normalizedService: string;
  serviceCategory: string;
  urgency: 'NORMAL' | 'URGENT' | 'SCHEDULED';
  preferredTime: string;
  location: string;
  specificIssue?: string;
  estimatedCostRange: string;
  clarificationNeeded?: boolean;
  canonicalService?: CanonicalServiceType;
}

export interface MatchedProvider {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  etaMinutes: number;
  verified: boolean;
  primaryCapability: string;
  allCapabilities: string[];
  diagnosisFee?: number;
  repairPriceNote?: string;
  estimatedPrice: number;
  experienceYears: number;
  phone: string;
  bio: string;
  badges: string[];
}

export type BookingStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'TECHNICIAN_ON_THE_WAY'
  | 'ARRIVED'
  | 'DIAGNOSING'
  | 'ESTIMATE_PENDING'
  | 'APPROVED'
  | 'WORK_IN_PROGRESS'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_RECEIVED'
  | 'OTP_PENDING'
  | 'COMPLETED'
  | 'CANCELLED'
  // Intermediate lifecycle statuses
  | 'MATCHING'
  | 'TECHNICIAN_SELECTED'
  | 'PENDING_CONFIRMATION'
  // Legacy / convenience aliases
  | 'MATCHED'
  | 'CONFIRMED'
  | 'EN_ROUTE'
  | 'IN_PROGRESS';

export interface DiagnosisDetails {
  fee: number; // default ₹149
  findings?: string;
  isPaid: boolean;
  otp: string;
  isVerified: boolean;
  diagnosedAt?: string;
}

export interface EstimateDetails {
  parts: number; // e.g. ₹700
  labour: number; // e.g. ₹400
  total: number; // e.g. ₹1,100
  description: string;
  isApproved: boolean;
  approvedAt?: string;
  isPriceLocked: boolean;
}

export interface PaymentDetails {
  status: 'PENDING' | 'RECEIVED' | 'FAILED';
  amount: number;
  transactionId: string;
  qrCodeData: string;
  isSandbox: boolean;
  paidAt?: string;
  method?: string;
}

export interface FinalOtpDetails {
  code: string;
  isVerified: boolean;
  verifiedAt?: string;
}

export type ServiceMode = 'DIAGNOSIS' | 'SERVICE';

export interface Booking {
  id: string;
  referenceCode: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  provider: MatchedProvider;
  serviceTitle: string;
  scheduledTime: string;
  address: string;
  status: BookingStatus;
  estimatedPrice: number;
  otpCode: string;
  createdAt: string;
  serviceMode?: ServiceMode;
  notes?: string;
  diagnosis?: DiagnosisDetails;
  estimate?: EstimateDetails;
  payment?: PaymentDetails;
  finalOtp?: FinalOtpDetails;
  review?: {
    rating: number;
    comment: string;
    tags: string[];
  };
}
