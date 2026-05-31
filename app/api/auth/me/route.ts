// GET /api/auth/me -> { user, business }  (current session, or 401)

import { ok, fail } from '@/lib/http';
import { currentUser } from '@/lib/auth';

export async function GET() {
  const ctx = await currentUser();
  if (!ctx) return fail('Not authenticated.', 401);
  return ok({ user: ctx.user, business: ctx.business });
}
