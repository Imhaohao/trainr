// Stateless signed-cookie session. The cookie value is
// `<base64url(payload)>.<HMAC-SHA256(payload)>`; tampering invalidates it.
// Set/clear happen in Route Handlers & Server Actions (where cookies are
// writable); reads work anywhere via next/headers cookies().

import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
  sessionSecret,
} from './constants';
import type { UserRole } from '../../types/index';

export interface SessionData {
  userId: string;
  role: UserRole;
  businessId: string;
}

function sign(payloadB64: string): string {
  return createHmac('sha256', sessionSecret())
    .update(payloadB64)
    .digest('base64url');
}

function encode(data: SessionData): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function decode(token: string): SessionData | null {
  const dot = token.lastIndexOf('.');
  if (dot < 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as SessionData;
  } catch {
    return null;
  }
}

export async function setSession(data: SessionData): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, encode(data), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE_SEC,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionData | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return decode(token);
}
