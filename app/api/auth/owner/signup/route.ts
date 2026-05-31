// POST /api/auth/owner/signup { name, email, password? } -> { user, business? }
// Phase 0 stub (owner: T1). Returns the demo owner so the signup flow works.
// Phase 1 (T1): create a real User via getDb().users, set a session cookie.

import { nanoid } from 'nanoid';
import { getDb } from '@/lib/contracts/db';
import { ok, readJson } from '@/lib/http';
import type { User } from '@/types';

export async function POST(req: Request) {
  const body = await readJson<{ name?: string; email?: string }>(req);
  const db = getDb();

  const user: User = {
    id: `usr_${nanoid(10)}`,
    role: 'owner',
    businessId: '',
    name: body.name ?? 'New Owner',
    email: body.email,
    createdAt: new Date().toISOString(),
  };
  await db.users.create(user);

  return ok({ user, business: null });
}
