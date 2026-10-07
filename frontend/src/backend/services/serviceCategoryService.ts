// ============================================================================
// SERVICE CATEGORY SERVICE
// Dynamic service catalog retrieval and management
// ============================================================================

import { dbStore } from '../database/store';
import { ServiceCategoryRecord } from '../database/types';

export class ServiceCategoryService {
  public static listCategories(): ServiceCategoryRecord[] {
    return Array.from(dbStore.serviceCategories.values())
      .filter((c) => c.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  public static getCategoryByCode(code: string): ServiceCategoryRecord | undefined {
    const normalized = code.trim().toUpperCase();
    return Array.from(dbStore.serviceCategories.values()).find(
      (c) => c.code.toUpperCase() === normalized
    );
  }

  public static getCategoryById(id: string): ServiceCategoryRecord | undefined {
    return dbStore.serviceCategories.get(id);
  }
}
