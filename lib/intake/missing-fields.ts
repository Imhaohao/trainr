// Labels for intake fields still empty after document import or manual entry.

export interface IntakeFieldSnapshot {
  name: string;
  address: string;
  employeeCount: number;
  mission: string;
  demographics: string;
  rolesCount: number;
  openingClosing: string;
  cleaning: string;
  machineOperations: string;
  drinkProduction: string;
  recipesCount: number;
}

export function computeMissingIntakeFields(
  snap: IntakeFieldSnapshot,
): string[] {
  const missing: string[] = [];
  if (!snap.name.trim()) missing.push('Business name');
  if (!snap.address.trim()) missing.push('Address');
  if (!snap.employeeCount || snap.employeeCount < 1) {
    missing.push('Number of employees');
  }
  if (!snap.rolesCount) missing.push('At least one role');
  if (!snap.openingClosing.trim()) missing.push('Opening & closing procedures');
  if (!snap.cleaning.trim()) missing.push('Cleaning routines');
  if (!snap.machineOperations.trim()) missing.push('Machine operations');
  if (!snap.drinkProduction.trim()) missing.push('Drink / product production');
  if (!snap.recipesCount) missing.push('At least one recipe');
  return missing;
}
