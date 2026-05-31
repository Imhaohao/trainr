// POST /api/auth/employee/join { joinCode, name } -> { user, businessId }
// Phase 0 stub (owner: T1). Resolves the business by join code against the
// mock DB and creates a no-password employee user. Phase 1 (T1): set an
// employee session cookie.

import { nanoid } from 'nanoid';
import { getDb } from '@/lib/contracts/db';
import { ok, fail, readJson } from '@/lib/http';
import type { User } from '@/types';

export async function POST(req: Request) {
  const body = await readJson<{ joinCode?: string; name?: string }>(req);
  if (!body.joinCode) return fail('joinCode is required');

  const db = getDb();
  const business = await db.findBusinessByJoinCode(body.joinCode);
  if (!business) return fail('Invalid join code', 404);

  const user: User = {
    id: `usr_${nanoid(10)}`,
    role: 'employee',
    businessId: business.id,
    name: body.name ?? 'New Teammate',
    createdAt: new Date().toISOString(),
  };
  await db.users.create(user);

  return ok({ user, businessId: business.id });
}
