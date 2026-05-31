// GET /api/auth/me -> { user } (current session)

import { getDb } from '@/lib/contracts/db';
import { ok, fail } from '@/lib/http';
import { getSession } from '@/lib/auth/session';

export async function GET() {
  const session = await getSession();
  if (!session) return fail('Not authenticated', 401);
  const user = await getDb().users.get(session.userId);
  if (!user) return fail('Not authenticated', 401);
  return ok({ user });
}
