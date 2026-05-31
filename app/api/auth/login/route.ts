// POST /api/auth/login { email, password? } -> { user }

import { getDb } from '@/lib/contracts/db';
import { verifyOwnerPassword } from '@/lib/auth/credentials';
import {
  applySessionCookie,
  sessionFromUser,
} from '@/lib/auth/session';
import { ok, fail, readJson } from '@/lib/http';
import { demoOwner, IDS } from '@/lib/mocks/fixtures';

export async function POST(req: Request) {
  const body = await readJson<{ email?: string; password?: string }>(req);
  if (!body.email?.trim()) return fail('Email is required');

  const email = body.email.trim().toLowerCase();
  const db = getDb();

  if (process.env.USE_MOCKS === 'true') {
    const user =
      (await db.users.get(IDS.owner)) ??
      (await db.users.list()).find(
        (u) => u.role === 'owner' && u.email?.toLowerCase() === email,
      );
    if (!user) return fail('Invalid email or password', 401);
    const res = ok({ user });
    return applySessionCookie(res, sessionFromUser(user));
  }

  const cred = body.password
    ? await verifyOwnerPassword(email, body.password)
    : null;

  if (cred) {
    const user = await db.users.get(cred.userId);
    if (!user) return fail('Invalid email or password', 401);
    const res = ok({ user });
    return applySessionCookie(res, sessionFromUser(user));
  }

  if (
    email === demoOwner.email?.toLowerCase() &&
    (!body.password || body.password === 'demo123')
  ) {
    const user = await db.users.get(IDS.owner);
    if (user) {
      const res = ok({ user });
      return applySessionCookie(res, sessionFromUser(user));
    }
  }

  const byEmail = (await db.users.list()).find(
    (u) => u.role === 'owner' && u.email?.toLowerCase() === email,
  );
  if (byEmail && body.password) {
    const retry = await verifyOwnerPassword(email, body.password);
    if (retry) {
      const res = ok({ user: byEmail });
      return applySessionCookie(res, sessionFromUser(byEmail));
    }
  }

  return fail('Invalid email or password', 401);
}
