// GET /api/auth/google/callback?code=...&state=...
// Google redirects here after consent. We verify the CSRF state, exchange the
// authorization code for tokens (using the client secret), resolve the Google
// identity, find-or-create the owner User, start a session, and land them on the
// dashboard. Failures redirect back to /login with an error code.

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { nanoid } from 'nanoid';
import { getDb } from '@/lib/contracts/db';
import { setSession } from '@/lib/auth';
import {
  exchangeCodeForIdentity,
  stateMatches,
  OAUTH_STATE_COOKIE,
} from '@/lib/auth/google';
import type { User } from '@/types';

function back(origin: string, error: string): NextResponse {
  const res = NextResponse.redirect(new URL(`/login?error=${error}`, origin));
  res.cookies.delete(OAUTH_STATE_COOKIE);
  return res;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin;

  if (url.searchParams.get('error')) return back(origin, 'google_denied');

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const expected = (await cookies()).get(OAUTH_STATE_COOKIE)?.value;
  if (!code || !stateMatches(state, expected)) {
    return back(origin, 'google_state');
  }

  const identity = await exchangeCodeForIdentity(code);
  if (!identity) return back(origin, 'google_failed');

  const db = getDb();
  const email = identity.email.toLowerCase();

  // Match an existing account by email (case-insensitive) so Google sign-in
  // links to a prior email/password owner instead of duplicating them.
  const existing = (await db.users.list()).find(
    (u) => (u.email ?? '').toLowerCase() === email,
  );

  let user = existing ?? null;
  if (!user) {
    user = {
      id: `usr_${nanoid(10)}`,
      role: 'owner',
      businessId: '',
      name: identity.name,
      email,
      createdAt: new Date().toISOString(),
    } satisfies User;
    await db.users.create(user);
  }

  await setSession({
    userId: user.id,
    role: user.role,
    businessId: user.businessId,
  });

  const dest = user.role === 'owner' ? '/dashboard' : '/learn';
  const res = NextResponse.redirect(new URL(dest, origin));
  res.cookies.delete(OAUTH_STATE_COOKIE);
  return res;
}
