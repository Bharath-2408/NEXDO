// ============================================================================
// NEXDO TECHNICIAN PRESENCE & HEARTBEAT ENGINE
// Real server-authoritative presence tracking: ONLINE on dashboard entry,
// periodic heartbeats, automated timeout to OFFLINE, and manual toggles.
// ============================================================================

import { dbStore } from '../database/store';
import { TechnicianProfileRecord } from '../database/types';

export class PresenceService {
  public static readonly DEFAULT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Sets technician presence to ONLINE and updates last_seen_at
   */
  public static setOnline(technicianIdOrUserId: string): TechnicianProfileRecord {
    const tech = this.resolveTechnician(technicianIdOrUserId);
    if (!tech) {
      throw new Error('Technician profile not found');
    }

    const now = new Date().toISOString();
    tech.availability_status = 'ONLINE';
    tech.last_seen_at = now;
    tech.updated_at = now;

    dbStore.syncToRemote('technician_profiles', tech);

    dbStore.logAudit({
      user_id: tech.profile_id,
      action: 'TECHNICIAN_ONLINE',
      status: 'SUCCESS',
      metadata: { technician_id: tech.id },
    });

    return tech;
  }

  /**
   * Sets technician presence to OFFLINE
   */
  public static setOffline(technicianIdOrUserId: string): TechnicianProfileRecord {
    const tech = this.resolveTechnician(technicianIdOrUserId);
    if (!tech) {
      throw new Error('Technician profile not found');
    }

    const now = new Date().toISOString();
    tech.availability_status = 'OFFLINE';
    tech.last_seen_at = now;
    tech.updated_at = now;

    dbStore.syncToRemote('technician_profiles', tech);

    dbStore.logAudit({
      user_id: tech.profile_id,
      action: 'TECHNICIAN_OFFLINE',
      status: 'SUCCESS',
      metadata: { technician_id: tech.id },
    });

    return tech;
  }

  /**
   * Refreshes technician heartbeat to prevent automatic offline timeout
   */
  public static heartbeat(technicianIdOrUserId: string): { status: 'ONLINE' | 'OFFLINE'; lastSeenAt: string } {
    const tech = this.resolveTechnician(technicianIdOrUserId);
    if (!tech) {
      throw new Error('Technician profile not found');
    }

    const now = new Date().toISOString();
    tech.last_seen_at = now;
    tech.updated_at = now;

    return {
      status: tech.availability_status,
      lastSeenAt: now,
    };
  }

  /**
   * Scans all technicians and marks those whose heartbeat has expired as OFFLINE
   */
  public static sweepTimeouts(timeoutMs: number = this.DEFAULT_TIMEOUT_MS): number {
    const now = Date.now();
    let timedOutCount = 0;

    for (const tech of dbStore.technicianProfiles.values()) {
      if (tech.availability_status === 'ONLINE') {
        const lastSeen = tech.last_seen_at ? new Date(tech.last_seen_at).getTime() : 0;
        if (now - lastSeen > timeoutMs) {
          tech.availability_status = 'OFFLINE';
          tech.updated_at = new Date().toISOString();
          timedOutCount++;
        }
      }
    }

    return timedOutCount;
  }

  /**
   * Resolves technician record by either technician id or user profile id
   */
  private static resolveTechnician(identifier: string): TechnicianProfileRecord | undefined {
    // 1. Direct technician ID match
    const byId = dbStore.technicianProfiles.get(identifier);
    if (byId) return byId;

    // 2. By profile_id (user_id)
    return dbStore.getTechnicianProfileByUserId(identifier);
  }
}
