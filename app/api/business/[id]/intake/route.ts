// POST /api/business/:id/intake { ...IntakeProfile } -> { intake }
// Phase 0 (owner: T1). Upserts the intake profile (keyed by businessId).

import { getDb } from '@/lib/contracts/db';
import { ok, fail, readJson } from '@/lib/http';
import { ownedBusinessOr403 } from '@/lib/auth';
import type { IntakeProfile } from '@/types';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const owned = await ownedBusinessOr403(id);
  if (!owned) return fail('Forbidden.', 403);

  const body = await readJson<Partial<IntakeProfile>>(req);
  const db = getDb();

  const next: IntakeProfile = {
    businessId: id,
    openingClosing: body.openingClosing,
    cleaning: body.cleaning,
    machineOperations: body.machineOperations,
    drinkProduction: body.drinkProduction,
    recipes: body.recipes ?? [],
    notes: body.notes,
    uploadedFileIds: body.uploadedFileIds ?? [],
    menuImageIds: body.menuImageIds ?? [],
  };

  const existing = await db.intake.get(id);
  const intake = existing
    ? await db.intake.update(id, next)
    : await db.intake.create(next);

  return ok({ intake });
}
