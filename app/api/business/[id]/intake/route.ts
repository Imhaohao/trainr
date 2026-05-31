// GET  /api/business/:id/intake -> { intake }
// POST /api/business/:id/intake { ...IntakeProfile } -> { intake }

import { getDb } from '@/lib/contracts/db';
import { assertBusinessAccess, requireOwner } from '@/lib/auth/guards';
import { ok, fail, readJson } from '@/lib/http';
import type { IntakeProfile } from '@/types';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireOwner();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const denied = await assertBusinessAccess(auth.ctx, id);
  if (denied) return denied;

  const intake = await getDb().intake.get(id);
  if (!intake) return fail('Intake not found', 404);
  return ok({ intake });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireOwner();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const denied = await assertBusinessAccess(auth.ctx, id);
  if (denied) return denied;

  const body = await readJson<Partial<IntakeProfile>>(req);
  const db = getDb();

  const existing = await db.intake.get(id);
  const next: IntakeProfile = {
    businessId: id,
    openingClosing: body.openingClosing ?? existing?.openingClosing,
    cleaning: body.cleaning ?? existing?.cleaning,
    machineOperations: body.machineOperations ?? existing?.machineOperations,
    drinkProduction: body.drinkProduction ?? existing?.drinkProduction,
    recipes: body.recipes ?? existing?.recipes ?? [],
    notes: body.notes ?? existing?.notes,
    directContext: body.directContext ?? existing?.directContext,
    contextSources: body.contextSources ?? existing?.contextSources,
    googleDocUrls: body.googleDocUrls ?? existing?.googleDocUrls,
    uploadedFileIds:
      body.uploadedFileIds ?? existing?.uploadedFileIds ?? [],
    menuImageIds: body.menuImageIds ?? existing?.menuImageIds ?? [],
  };

  const intake = existing
    ? await db.intake.update(id, next)
    : await db.intake.create(next);

  return ok({ intake });
}
