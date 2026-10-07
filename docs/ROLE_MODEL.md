# NEXDO Single Account & Role Architecture

## 1. Unified Identity Philosophy

NEXDO rejects the traditional platform antipattern of requiring separate phone numbers, emails, or apps for customers and service providers. 

In real-world tier-2 and tier-3 Indian markets, skilled technicians (plumbers, electricians, appliance technicians) are also frequent consumers of home and trade services. Forcing them to create two accounts creates account abandonment, fragmented SMS OTPs, and disjointed payment histories.

## 2. Data Contract Specification

```typescript
export interface UserAccount {
  id: string;
  name: string;
  phone: string;
  email?: string;
  dob?: string;
  district?: string;
  avatarUrl?: string;
  createdAt: string;
  preferredLanguage: string;
  
  // Dual Profiles under a Single Identity
  customerProfile: CustomerProfile;
  technicianProfile: TechnicianProfile;
  
  // Active Operational Context
  activeRole: 'customer' | 'technician';
}
```

## 3. Post-Auth Role Selection (`/select-role`)

Upon successful authentication or when initiating a role switch from the Top Header:
1. The user is presented with two equal-weight, beautifully styled interactive cards:
   - **Customer Card**: *"I need a service done"* — Direct entry into intent-first voice booking.
   - **Technician Card**: *"I provide skilled services"* — Direct entry into demand dispatch & earnings.
2. The user's selection updates `activeRole` in `AppContext` and persists the preference in local storage.
3. The application router immediately transitions to the appropriate layout (`CustomerLayout` or `TechnicianLayout`).

## 4. Role Switch Sentry & Persistence

- Role switching is accessible at any time from the global top header via a seamless switch toggle.
- Both profiles retain their state independently: a customer's active live-tracking order remains active even if they temporarily switch to the technician portal to accept a local job.
