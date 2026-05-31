// POST /api/auth/employee/join { joinCode, name } -> { user, businessId }

import { nanoid } from 'nanoid';
import { getDb } from '@/lib/contracts/db';
import {
  applySessionCookie,
  sessionFromUser,
} from '@/lib/auth/session';
import { ok, fail, readJson } from '@/lib/http';
import type { User } from '@/types';

export async function POST(req: Request) {
  const body = await readJson<{ joinCode?: string; name?: string }>(req);
  if (!body.joinCode) return fail('joinCode is required');
  if (!body.name?.trim()) return fail('name is required');

  const db = getDb();
  const business = await db.findBusinessByJoinCode(body.joinCode);
  if (!business) return fail('Invalid join code', 404);

  const user: User = {
    id: `usr_${nanoid(10)}`,
    role: 'employee',
    businessId: business.id,
    name: body.name.trim(),
    createdAt: new Date().toISOString(),
  };
  await db.users.create(user);

  const res = ok({ user, businessId: business.id });
  return applySessionCookie(res, sessionFromUser(user));
}
