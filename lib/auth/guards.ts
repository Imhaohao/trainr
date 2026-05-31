// Session guards. Two flavours:
//   - currentSession / currentUser : non-redirecting resolvers for API routes
//     and server components that want to branch on auth state.
//   - requireOwnerPage             : for owner server components — redirects to
//     /login when there's no owner session.
//
// Demo affordance: when getDb() is backed by the seeded mock (USE_MOCKS==='true')
// and there is no real session, we resolve the demo owner so the owner area is
// one-click during the demo. This fallback is disabled for any real backend.

import { redirect } from 'next/navigation';
import { getDb } from '../contracts/db';
import { IDS } from '../mocks/fixtures';
import type { Business, User } from '../../types/index';
import { getSession, type SessionData } from './session';
import { usingMockDb } from './constants';

export async function currentSession(): Promise<SessionData | null> {
  const session = await getSession();
  if (session) return session;
  if (usingMockDb()) {
    return { userId: IDS.owner, role: 'owner', businessId: IDS.business };
  }
  return null;
}

export interface AuthContext {
  session: SessionData;
  user: User;
  business: Business | null;
}

export async function currentUser(): Promise<AuthContext | null> {
  const session = await currentSession();
  if (!session) return null;
  const db = getDb();
  const user = await db.users.get(session.userId);
  if (!user) return null;
  const business = session.businessId
    ? await db.businesses.get(session.businessId)
    : null;
  return { session, user, business };
}

// For owner-only server components. Throws a redirect when not an owner.
export async function requireOwnerPage(): Promise<AuthContext> {
  const ctx = await currentUser();
  if (!ctx || ctx.user.role !== 'owner') {
    redirect('/login');
  }
  return ctx;
}

// For owner-only API routes — returns the context or null (caller returns 401).
export async function requireApiOwner(): Promise<AuthContext | null> {
  const ctx = await currentUser();
  if (!ctx || ctx.user.role !== 'owner') return null;
  return ctx;
}

// Verifies the current owner owns the given business. Returns the business or
// null (not authed / not owner / not found / cross-business access attempt).
export async function ownedBusinessOr403(
  businessId: string,
): Promise<{ ctx: AuthContext; business: Business } | null> {
  const ctx = await requireApiOwner();
  if (!ctx) return null;
  const business = await getDb().businesses.get(businessId);
  if (!business || business.ownerId !== ctx.user.id) return null;
  return { ctx, business };
}
