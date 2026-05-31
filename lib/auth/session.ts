import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import type { User, UserRole } from '@/types';

export const SESSION_COOKIE = 'trainr_session';
const MAX_AGE = 60 * 60 * 24 * 14; // 14 days

export type SessionPayload = {
  userId: string;
  role: UserRole;
  businessId: string;
};

function encode(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

function decode(raw: string): SessionPayload | null {
  try {
    const json = Buffer.from(raw, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as SessionPayload;
    if (!parsed.userId || !parsed.role) return null;
    return {
      userId: parsed.userId,
      role: parsed.role,
      businessId: parsed.businessId ?? '',
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  return decode(raw);
}

export function applySessionCookie(
  res: NextResponse,
  payload: SessionPayload,
): NextResponse {
  res.cookies.set(SESSION_COOKIE, encode(payload), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
  return res;
}

export async function setSessionOnResponse(
  payload: SessionPayload,
): Promise<SessionPayload> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, encode(payload), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
  return payload;
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export function sessionFromUser(user: User): SessionPayload {
  return {
    userId: user.id,
    role: user.role,
    businessId: user.businessId,
  };
}
