// BLOCKED(mcp): getEquipmentSim() returns a clearly-labeled fixture today. The interface
// is MCP-ready: when an equipment/operating-procedure MCP server is available, replace the
// fixture lookup with an MCP tool call returning the same EquipmentSim shape, scoped by
// business_id, with source.kind="mcp" and source.ref/retrievedAt populated from the server.

import { IDS } from '@/lib/mocks/fixtures';
import { equipmentSimFixtures } from '@/lib/employee/equipment-fixture';
import type { EquipmentSim } from '@/types/training';

const DEFAULT_BUSINESS_ID = IDS.business;

function scopedSims(businessId: string): EquipmentSim[] {
  return equipmentSimFixtures.filter((s) => s.businessId === businessId);
}

export function getEquipmentSim(
  simId: string,
  businessId: string = DEFAULT_BUSINESS_ID,
): EquipmentSim | undefined {
  return scopedSims(businessId).find((s) => s.id === simId);
}

export function getSimForModule(
  moduleId: string,
  businessId: string = DEFAULT_BUSINESS_ID,
): EquipmentSim | undefined {
  return scopedSims(businessId).find((s) => s.moduleId === moduleId);
}

export function listEquipmentSims(
  businessId: string = DEFAULT_BUSINESS_ID,
): EquipmentSim[] {
  return scopedSims(businessId);
}
