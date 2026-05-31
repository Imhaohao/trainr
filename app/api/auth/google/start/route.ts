// GET /api/auth/google/start
// Begins the Google OAuth flow: stores a random CSRF `state` in a short-lived
// httpOnly cookie and redirects the browser to Google's consent screen.

import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import {
  buildGoogleAuthUrl,
  googleConfigured,
  OAUTH_STATE_COOKIE,
} from '@/lib/auth/google';

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;

  if (!googleConfigured()) {
    return NextResponse.redirect(
      new URL('/login?error=google_unconfigured', origin),
    );
  }

  const state = randomBytes(16).toString('base64url');
  const res = NextResponse.redirect(buildGoogleAuthUrl(state));
  res.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600, // 10 minutes to complete the round-trip
  });
  return res;
}
