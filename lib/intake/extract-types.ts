// Shared intake extraction types and helpers — safe for client components.

import { nanoid } from 'nanoid';
import { z } from 'zod';
import type { BusinessRole } from '@/types';

export const extractSchema = z.object({
  name: z.string().optional(),
  industry: z.string().optional(),
  address: z.string().optional(),
  state: z.string().optional(),
  employeeCount: z.number().optional(),
  demographics: z.string().optional(),
  mission: z.string().optional(),
  languages: z.array(z.string()).optional(),
  roles: z
    .array(
      z.object({
        title: z.string(),
        customerFacing: z.boolean().optional(),
        description: z.string().optional(),
      }),
    )
    .optional(),
  openingClosing: z.string().optional(),
  cleaning: z.string().optional(),
  machineOperations: z.string().optional(),
  drinkProduction: z.string().optional(),
  notes: z.string().optional(),
  recipes: z
    .array(
      z.object({
        name: z.string(),
        ingredients: z.array(z.string()).optional(),
        steps: z.array(z.string()).optional(),
      }),
    )
    .optional(),
});

export type ExtractedIntake = z.infer<typeof extractSchema>;

export interface IntakeExtractResult {
  extracted: ExtractedIntake;
  filledFields: string[];
}

export function toBusinessRoles(
  roles: NonNullable<ExtractedIntake['roles']>,
): BusinessRole[] {
  return roles.map((r) => ({
    id: `role_${nanoid(6)}`,
    title: r.title.trim(),
    customerFacing: r.customerFacing ?? false,
    description: r.description?.trim() || undefined,
  }));
}
