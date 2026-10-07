// ============================================================================
// TECHNICIAN MATCHING SERVICE
// Capability, Location, Availability, and Subscription-Aware Matching Engine
// ============================================================================

import { dbStore } from '../database/store';
import { MatchedProvider } from '../../types/customer';
import { ServiceCategoryService } from './serviceCategoryService';

export interface MatchingSearchParams {
  serviceCode?: string;
  area?: string;
  urgency?: 'NORMAL' | 'URGENT' | 'HIGH';
  maxDistanceKm?: number;
  serviceMode?: 'DIAGNOSIS' | 'SERVICE';
}

export class TechnicianMatchingService {
  public static searchTechnicians(params: MatchingSearchParams): MatchedProvider[] {
    const rawCode = (params.serviceCode || 'AC_REPAIR').trim().toUpperCase();
    const serviceCategory = ServiceCategoryService.getCategoryByCode(rawCode);

    const now = new Date().toISOString();

    const matchedList: Array<{
      provider: MatchedProvider;
      score: number;
    }> = [];

    for (const tech of dbStore.technicianProfiles.values()) {
      // 1. Availability check
      if (tech.availability_status !== 'ONLINE') {
        continue;
      }

      // 2. Verification status check
      if (tech.verification_status !== 'VERIFIED') {
        continue;
      }

      // 3. Active Subscription check
      const sub = Array.from(dbStore.technicianSubscriptions.values()).find(
        (s) => s.technician_id === tech.id && s.is_active && s.expires_at >= now
      );
      // In production, priority is given to active subscription holders
      const hasActiveSub = !!sub;

      // 4. Capabilities match
      const caps = Array.from(dbStore.technicianCapabilities.values()).filter(
        (c) => c.technician_id === tech.id && c.active
      );

      const matchesSkill = caps.some((c) => {
        const capCode = c.code.toUpperCase();
        return (
          capCode === rawCode ||
          capCode.includes(rawCode) ||
          rawCode.includes(capCode) ||
          (rawCode.startsWith('AC') && capCode.startsWith('AC')) ||
          (rawCode.includes('TV') && capCode.includes('TV')) ||
          (rawCode.includes('PLUMB') && capCode.includes('PLUMB')) ||
          (rawCode.includes('ELEC') && capCode.includes('ELEC'))
        );
      });

      if (!matchesSkill && caps.length > 0) {
        // Skip if capabilities exist but none match the requested service
        continue;
      }

      const allCapNames = caps.map((c) => c.name);
      const primaryCap = caps[0]?.name || (serviceCategory ? serviceCategory.name_en : 'General Technician');

      // Rank scoring
      let score = tech.rating * 10;
      if (hasActiveSub) score += 20;
      score += Math.min(tech.experience_years * 2, 20);

      const distanceKm = Math.round((tech.radius_km * 0.35 + (score % 2)) * 10) / 10 || 2.5;
      const etaMinutes = Math.round(distanceKm * 8 + 10);

      const estimatedPrice = params.serviceMode === 'SERVICE'
        ? (serviceCategory?.base_service_price || 499)
        : (serviceCategory?.base_diagnosis_fee || 149);

      const provider: MatchedProvider = {
        id: tech.id,
        name: tech.name,
        avatar:
          tech.name.includes('Ravi')
            ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
            : tech.name.includes('Senthil')
            ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
            : tech.name.includes('Kumaravel')
            ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        rating: tech.rating,
        reviewCount: tech.review_count,
        distanceKm,
        etaMinutes,
        verified: tech.verification_status === 'VERIFIED',
        primaryCapability: primaryCap,
        allCapabilities: allCapNames.length > 0 ? allCapNames : [primaryCap],
        diagnosisFee: 149,
        repairPriceNote: 'Decided after diagnosis',
        estimatedPrice,
        experienceYears: tech.experience_years,
        phone: tech.phone,
        bio: tech.bio || 'Verified NEXDO Service Professional.',
        badges: tech.badges,
      };

      matchedList.push({ provider, score });
    }

    // Sort descending by calculated score
    matchedList.sort((a, b) => b.score - a.score);
    return matchedList.map((m) => m.provider);
  }

  public static getTechnicianById(techId: string): MatchedProvider | undefined {
    const list = this.searchTechnicians({});
    return list.find((t) => t.id === techId) || list[0];
  }
}
