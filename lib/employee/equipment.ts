// Equipment sim resolver — fixture by default; RTRVR catalog when key + USE_MOCKS=false.

import { equipmentSimFixtures } from '@/lib/employee/equipment-fixture';
import {
  resolveEquipmentSim as resolveViaRtrvr,
  resolveSimForModule as resolveModuleViaRtrvr,
} from '@/lib/integrations/equipment-rtrvr';
import { rtrvrEnabled } from '@/lib/integrations/rtrvr-scrape';
import type { EquipmentSim } from '@/types/training';

export function getEquipmentSimFixture(
  simId: string,
  businessId: string,
): EquipmentSim | undefined {
  return equipmentSimFixtures
    .filter((s) => s.businessId === businessId)
    .find((s) => s.id === simId);
}

export function getSimForModuleFixture(
  moduleId: string,
  businessId: string,
): EquipmentSim | undefined {
  return equipmentSimFixtures
    .filter((s) => s.businessId === businessId)
    .find((s) => s.moduleId === moduleId);
}

/** Sync accessor — static fixtures only (tests / mock mode). */
export function getEquipmentSim(
  simId: string,
  businessId: string,
): EquipmentSim | undefined {
  return getEquipmentSimFixture(simId, businessId);
}

export function getSimForModule(
  moduleId: string,
  businessId: string,
): EquipmentSim | undefined {
  return getSimForModuleFixture(moduleId, businessId);
}

/** Async resolver — tries RTRVR catalog cache, then fixture. */
export async function resolveEquipmentSim(
  simId: string,
  businessId: string,
  opts?: { forceRefresh?: boolean },
): Promise<EquipmentSim | undefined> {
  if (rtrvrEnabled()) {
    const live = await resolveViaRtrvr(simId, businessId, opts);
    if (live) return live;
  }
  return getEquipmentSimFixture(simId, businessId);
}

export async function resolveSimForModule(
  moduleId: string,
  businessId: string,
  opts?: { forceRefresh?: boolean },
): Promise<EquipmentSim | undefined> {
  if (rtrvrEnabled()) {
    const live = await resolveModuleViaRtrvr(moduleId, businessId, opts);
    if (live) return live;
  }
  return getSimForModuleFixture(moduleId, businessId);
}

export function listEquipmentSims(businessId: string): EquipmentSim[] {
  return equipmentSimFixtures.filter((s) => s.businessId === businessId);
}
