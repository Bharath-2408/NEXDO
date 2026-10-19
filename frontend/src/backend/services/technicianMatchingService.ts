// ============================================================================
// TECHNICIAN MATCHING SERVICE
// Capability, Location, Availability, and Subscription-Aware Matching Engine
// ============================================================================

import { dbStore } from '../database/store';
import { MatchedProvider } from '../../types/customer';
import { ServiceCategoryService } from './serviceCategoryService';
import { calculateHaversineDistanceKm, estimateEtaMinutes, isValidCoordinate } from '../../utils/geoUtils';

export interface MatchingSearchParams {
  serviceCode?: string;
  area?: string;
  urgency?: 'NORMAL' | 'URGENT' | 'HIGH';
  maxDistanceKm?: number;
  radiusKm?: number;
  latitude?: number;
  longitude?: number;
  strictGps?: boolean;
  serviceMode?: 'DIAGNOSIS' | 'SERVICE';
}

export class TechnicianMatchingService {
  public static searchTechnicians(params: MatchingSearchParams): MatchedProvider[] {
    const rawCode = (params.serviceCode || 'AC_REPAIR').trim().toUpperCase();
    const serviceCategory = ServiceCategoryService.getCategoryByCode(rawCode);

    const now = new Date().toISOString();
    const hasCustomerCoords = isValidCoordinate(params.latitude, params.longitude);

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

      // 3b. GPS or Service Area filtering
      let calculatedDistance: number | null = null;
      let calculatedEta: number | null = null;

      if (hasCustomerCoords) {
        if (isValidCoordinate(tech.latitude, tech.longitude)) {
          calculatedDistance = calculateHaversineDistanceKm(
            params.latitude!,
            params.longitude!,
            tech.latitude!,
            tech.longitude!
          );
          calculatedEta = estimateEtaMinutes(calculatedDistance);

          const maxAllowed = params.radiusKm || params.maxDistanceKm || tech.radius_km || 25;
          if (calculatedDistance > maxAllowed) {
            continue; // Out of range
          }
        } else if (params.strictGps) {
          // If strict GPS radius search requested and provider has no coordinates, exclude
          continue;
        }
      }

      if (params.area && params.area.trim()) {
        const queryArea = params.area.toLowerCase().trim();
        const techAreas = (tech.service_areas || []).map((a) => a.toLowerCase().trim());
        const matchesArea =
          techAreas.some((a) => a.includes(queryArea) || queryArea.includes(a)) ||
          (tech.city && tech.city.toLowerCase().trim() === queryArea);

        if (!matchesArea && !hasCustomerCoords) {
          continue;
        }
      }

      // 4. Capabilities & Skills match (across all registered domains & capabilities)
      const capList = Array.from(dbStore.technicianCapabilities.values()).filter(
        (c) => c.technician_id === tech.id && c.active
      );
      const skillList = Array.from(dbStore.technicianSkills.values()).filter(
        (s) => s.technician_id === tech.id && s.active
      );

      const allCodes = [
        ...capList.map((c) => c.code.toUpperCase()),
        ...skillList.map((s) => s.skill_code.toUpperCase()),
      ];

      const matchesSkill = allCodes.some((capCode) => {
        return (
          capCode === rawCode ||
          capCode.includes(rawCode) ||
          rawCode.includes(capCode) ||
          (rawCode.startsWith('AC') && capCode.startsWith('AC')) ||
          (rawCode.includes('TV') && capCode.includes('TV')) ||
          (rawCode.includes('PLUMB') && capCode.includes('PLUMB')) ||
          (rawCode.includes('ELEC') && capCode.includes('ELEC')) ||
          (rawCode.includes('CLEAN') && capCode.includes('CLEAN')) ||
          (rawCode.includes('BEAUTY') && capCode.includes('BEAUTY')) ||
          (rawCode.includes('TRANSPORT') && capCode.includes('TRANSPORT')) ||
          (rawCode.includes('FOOD') && capCode.includes('FOOD')) ||
          (rawCode.includes('ASSIST') && capCode.includes('ASSIST'))
        );
      });

      if (!matchesSkill && allCodes.length > 0) {
        // Skip if capabilities exist but none match the requested service
        continue;
      }

      const allCapNames = [
        ...capList.map((c) => c.name),
        ...skillList.map((s) => s.skill_name),
      ];
      const primaryCap = allCapNames[0] || (serviceCategory ? serviceCategory.name_en : 'General Technician');

      // Rank scoring
      let score = tech.rating * 10;
      if (hasActiveSub) score += 20;
      score += Math.min(tech.experience_years * 2, 20);

      const distanceKm =
        calculatedDistance !== null
          ? calculatedDistance
          : Math.round((tech.radius_km * 0.35 + (score % 2)) * 10) / 10 || 2.5;
      const etaMinutes =
        calculatedEta !== null ? calculatedEta : Math.round(distanceKm * 8 + 10);

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
        latitude: tech.latitude,
        longitude: tech.longitude,
        locationUpdatedAt: tech.location_updated_at,
        isLocationShared: tech.is_location_shared,
      };

      // Bonus score for nearby proximity
      if (calculatedDistance !== null) {
        score += Math.max(0, 30 - calculatedDistance * 2);
      }

      matchedList.push({ provider, score });
    }

    // Sort descending by calculated score (or distance if strictly GPS query)
    if (hasCustomerCoords) {
      matchedList.sort((a, b) => a.provider.distanceKm - b.provider.distanceKm);
    } else {
      matchedList.sort((a, b) => b.score - a.score);
    }
    return matchedList.map((m) => m.provider);
  }

  /**
   * Dedicated GPS nearby provider search
   */
  public static searchNearbyTechnicians(params: {
    latitude: number;
    longitude: number;
    radiusKm?: number;
    serviceCode?: string;
  }): MatchedProvider[] {
    return this.searchTechnicians({
      latitude: params.latitude,
      longitude: params.longitude,
      radiusKm: params.radiusKm || 25,
      strictGps: true,
      serviceCode: params.serviceCode,
    });
  }

  public static async searchNearbyTechniciansAsync(params: {
    latitude: number;
    longitude: number;
    radiusKm?: number;
    serviceCode?: string;
  }): Promise<MatchedProvider[]> {
    await dbStore.fetchAllTechniciansFromRemote();
    return this.searchNearbyTechnicians(params);
  }

  public static async searchTechniciansAsync(params: MatchingSearchParams): Promise<MatchedProvider[]> {
    await dbStore.fetchAllTechniciansFromRemote();
    return this.searchTechnicians(params);
  }

  public static getTechnicianById(techId: string): MatchedProvider | undefined {
    if (!techId) return undefined;
    let resolvedTechId = techId;
    for (const [id, profile] of dbStore.technicianProfiles.entries()) {
      if (id === techId || profile.profile_id === techId) {
        resolvedTechId = id;
        break;
      }
    }
    const list = this.searchTechnicians({});
    return list.find((t) => t.id === resolvedTechId || t.id === techId);
  }

  public static async getTechnicianByIdAsync(techId: string): Promise<MatchedProvider | undefined> {
    await dbStore.fetchAllTechniciansFromRemote();
    return this.getTechnicianById(techId);
  }
}
