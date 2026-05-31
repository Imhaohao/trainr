import type { NextResponse } from 'next/server';
import { getDb } from '@/lib/contracts/db';
import { fail } from '@/lib/http';
import type { User } from '@/types';
import { getSession, type SessionPayload } from './session';

export type OwnerContext = {
  session: SessionPayload;
  user: User;
};

export type OwnerAuthResult =
  | { ok: true; ctx: OwnerContext }
  | { ok: false; response: NextResponse };

export async function requireOwner(): Promise<OwnerAuthResult> {
  const session = await getSession();
  if (!session || session.role !== 'owner') {
    return { ok: false, response: fail('Owner authentication required', 401) };
  }
  const user = await getDb().users.get(session.userId);
  if (!user || user.role !== 'owner') {
    return { ok: false, response: fail('Owner authentication required', 401) };
  }
  return { ok: true, ctx: { session, user } };
}

export async function assertBusinessAccess(
  ctx: OwnerContext,
  businessId: string,
): Promise<NextResponse | null> {
  const business = await getDb().businesses.get(businessId);
  if (!business) return fail('Business not found', 404);
  if (business.ownerId !== ctx.user.id) return fail('Forbidden', 403);
  return null;
}
