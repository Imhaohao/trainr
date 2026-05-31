// POST /api/auth/login { email, password } -> { user, business }
// Verifies stored credentials and starts a session for the matching user.

import { z } from 'zod';
import { getDb } from '@/lib/contracts/db';
import { ok, fail, readJson } from '@/lib/http';
import { findCredentialByEmail, verifyPassword, setSession } from '@/lib/auth';

const Body = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return fail('Enter your email and password.');
  const { email, password } = parsed.data;

  const cred = findCredentialByEmail(email);
  if (!cred || !verifyPassword(password, cred.passwordHash)) {
    return fail('Invalid email or password.', 401);
  }

  const db = getDb();
  const user = await db.users.get(cred.userId);
  if (!user) return fail('Account not found.', 404);

  await setSession({
    userId: user.id,
    role: user.role,
    businessId: user.businessId,
  });

  const business = user.businessId
    ? await db.businesses.get(user.businessId)
    : null;

  return ok({ user, business });
}
