// GET  /api/business/:id -> { business }
// PATCH /api/business/:id { ...partial } -> { business }

import { getDb } from '@/lib/contracts/db';
import { assertBusinessAccess, requireOwner } from '@/lib/auth/guards';
import { ok, fail, readJson } from '@/lib/http';
import type { Business } from '@/types';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireOwner();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const denied = await assertBusinessAccess(auth.ctx, id);
  if (denied) return denied;

  const business = await getDb().businesses.get(id);
  if (!business) return fail('Business not found', 404);
  return ok({ business });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireOwner();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const denied = await assertBusinessAccess(auth.ctx, id);
  if (denied) return denied;

  const patch = await readJson<Partial<Business>>(req);
  const db = getDb();
  const existing = await db.businesses.get(id);
  if (!existing) return fail('Business not found', 404);
  const business = await db.businesses.update(id, patch);
  return ok({ business });
}
