export type UserRole = 'CUSTOMER' | 'TECHNICIAN';

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  dob?: string;
  address: string;
  city: string;
  district: string;
  pincode: string;
  preferredLanguage: string;
  voiceAutoConfirm: boolean;
  savedAddresses: Array<{
    id: string;
    label: string;
    address: string;
    isDefault: boolean;
  }>;
}

export interface Capability {
  id: string;
  code: string;
  name: string;
  category: string;
  experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';
  isCertified: boolean;
  active: boolean;
}

export interface SubscriptionState {
  planId: string;
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  title: string;
  price: number;
  activatedAt: string;
  expiresAt: string;
  isActive: boolean;
  unlimitedJobs: boolean;
}

export interface TechnicianProfile {
  id: string;
  name: string;
  phone: string;
  dob?: string;
  address: string;
  city: string;
  district: string;
  pincode: string;
  capabilities: Capability[];
  serviceAreas: string[];
  radiusKm: number;
  experienceYears: number;
  rating: number;
  completedJobsCount: number;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  availabilityStatus: 'ONLINE' | 'OFFLINE';
  activeSubscription: SubscriptionState | null;
  languagesSpoken: string[];
}

export interface UserAccount {
  id: string;
  name: string;
  phone: string;
  dob?: string;
  email?: string;
  avatarUrl?: string;
  createdAt: string;
  customerProfile: CustomerProfile;
  technicianProfile: TechnicianProfile;
}
