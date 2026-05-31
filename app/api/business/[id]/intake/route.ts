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

  const existing = await db.intake.get(id);

  const next: IntakeProfile = {
    businessId: id,
    openingClosing: body.openingClosing ?? existing?.openingClosing,
    cleaning: body.cleaning ?? existing?.cleaning,
    machineOperations:
      body.machineOperations ?? existing?.machineOperations,
    drinkProduction: body.drinkProduction ?? existing?.drinkProduction,
    recipes: body.recipes ?? existing?.recipes ?? [],
    notes: body.notes ?? existing?.notes,
    uploadedFileIds: [
      ...new Set([
        ...(existing?.uploadedFileIds ?? []),
        ...(body.uploadedFileIds ?? []),
      ]),
    ],
    menuImageIds: [
      ...new Set([
        ...(existing?.menuImageIds ?? []),
        ...(body.menuImageIds ?? []),
      ]),
    ],
    directContext: existing?.directContext,
    contextSources: existing?.contextSources,
    googleDocUrls: existing?.googleDocUrls,
  };

  const intake = existing
    ? await db.intake.update(id, next)
    : await db.intake.create(next);

  return ok({ intake });
}
