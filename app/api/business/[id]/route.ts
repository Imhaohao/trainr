// GET   /api/business/:id  -> { business }   (members of the business)
// PATCH /api/business/:id { ...partial } -> { business }   (owner only)

import { getDb } from '@/lib/contracts/db';
import { ok, fail, readJson } from '@/lib/http';
import { currentUser, ownedBusinessOr403 } from '@/lib/auth';
import type { Business } from '@/types';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await currentUser();
  if (!ctx) return fail('Not authenticated.', 401);

  const business = await getDb().businesses.get(id);
  if (!business) return fail('Business not found.', 404);
  // Members only: owner of the business or an employee who belongs to it.
  if (business.ownerId !== ctx.user.id && ctx.user.businessId !== id) {
    return fail('Forbidden.', 403);
  }
  return ok({ business });
}

// Owner-controlled fields only — joinCode/ownerId/id are never client-mutable.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const owned = await ownedBusinessOr403(id);
  if (!owned) return fail('Forbidden.', 403);

  const body = await readJson<Partial<Business>>(req);
  const patch: Partial<Business> = {
    name: body.name,
    industry: body.industry,
    address: body.address,
    state: body.state,
    employeeCount: body.employeeCount,
    demographics: body.demographics,
    languages: body.languages,
    mission: body.mission,
    roles: body.roles,
    status: body.status,
  };
  for (const k of Object.keys(patch) as (keyof Business)[]) {
    if (patch[k] === undefined) delete patch[k];
  }

  const business = await getDb().businesses.update(id, patch);
  return ok({ business });
}
