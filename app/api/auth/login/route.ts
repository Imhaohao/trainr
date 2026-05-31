// POST /api/auth/login { email, password? } -> { user }
// Phase 0 stub (owner: T1). Returns the demo owner. Phase 1 (T1): verify
// credentials via Insforge/Local auth and set an httpOnly session cookie.

import { getDb } from '@/lib/contracts/db';
import { ok, readJson } from '@/lib/http';
import { IDS } from '@/lib/mocks/fixtures';

export async function POST(req: Request) {
  await readJson(req);
  const db = getDb();
  const user = await db.users.get(IDS.owner);
  return ok({ user });
}
