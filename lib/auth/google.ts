// Google Sign-In — OAuth 2.0 Authorization Code flow (server-side).
//
//   1. /api/auth/google/start    -> redirect the browser to Google's consent
//      screen with a CSRF `state` (stored in a short-lived cookie).
//   2. Google redirects back to /api/auth/google/callback?code=...&state=...
//   3. We exchange the code for tokens at Google's token endpoint using the
//      client_id + client_secret (the secret never leaves the server), verify
//      the returned id_token against Google's public keys, and read the profile.
//
// Uses the official google-auth-library, which handles the token exchange and
// id_token signature/issuer/audience/expiry verification.

import { OAuth2Client } from 'google-auth-library';
import { timingSafeEqual } from 'node:crypto';

export const OAUTH_STATE_COOKIE = 'trainr_oauth_state';

const SCOPES = ['openid', 'email', 'profile'];

export interface GoogleIdentity {
  sub: string; // stable Google account id
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
}

// Public OAuth Web client ID (safe to expose). Read from either var name.
export function googleClientId(): string | undefined {
  return process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
}

// True only when both the client ID and secret are configured.
export function googleConfigured(): boolean {
  return Boolean(googleClientId() && process.env.GOOGLE_CLIENT_SECRET);
}

// Must exactly match an "Authorized redirect URI" registered in the Google Cloud
// console for this OAuth client.
export function googleRedirectUri(): string {
  const base = (process.env.APP_BASE_URL || 'http://localhost:3000').replace(
    /\/$/,
    '',
  );
  return `${base}/api/auth/google/callback`;
}

function oauthClient(): OAuth2Client {
  return new OAuth2Client({
    clientId: googleClientId(),
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: googleRedirectUri(),
  });
}

// The Google consent-screen URL to redirect the user to.
export function buildGoogleAuthUrl(state: string): string {
  return oauthClient().generateAuthUrl({
    scope: SCOPES,
    state,
    access_type: 'online',
    include_granted_scopes: true,
    prompt: 'select_account',
  });
}

// Constant-time comparison of the returned `state` against the cookie value.
export function stateMatches(received: string | null, expected: string | undefined): boolean {
  if (!received || !expected) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Exchanges the authorization `code` for tokens (using the client secret) and
// returns the verified Google identity, or null on any failure.
export async function exchangeCodeForIdentity(
  code: string,
): Promise<GoogleIdentity | null> {
  const client = oauthClient();

  let idToken: string | null | undefined;
  try {
    const { tokens } = await client.getToken(code);
    idToken = tokens.id_token;
  } catch {
    return null;
  }
  if (!idToken) return null;

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: googleClientId(),
    });
    const p = ticket.getPayload();
    if (!p || !p.sub || !p.email) return null;
    if (p.email_verified === false) return null;
    return {
      sub: p.sub,
      email: p.email,
      emailVerified: p.email_verified ?? false,
      name: p.name || p.email.split('@')[0],
      picture: p.picture,
    };
  } catch {
    return null;
  }
}
