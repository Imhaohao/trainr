// POST /api/auth/owner/signup { name, email, password? } -> { user }

import { nanoid } from 'nanoid';
import { getDb } from '@/lib/contracts/db';
import { createOwnerCredential } from '@/lib/auth/credentials';
import {
  applySessionCookie,
  sessionFromUser,
} from '@/lib/auth/session';
import { ok, fail, readJson } from '@/lib/http';
import type { User } from '@/types';

export async function POST(req: Request) {
  const body = await readJson<{
    name?: string;
    email?: string;
    password?: string;
  }>(req);

  if (!body.email?.trim()) return fail('Email is required');
  if (!body.name?.trim()) return fail('Name is required');

  const db = getDb();
  const existing = (await db.users.list()).find(
    (u) => u.email?.toLowerCase() === body.email!.trim().toLowerCase(),
  );
  if (existing) return fail('An account with this email already exists', 409);

  const user: User = {
    id: `usr_${nanoid(10)}`,
    role: 'owner',
    businessId: '',
    name: body.name.trim(),
    email: body.email.trim().toLowerCase(),
    createdAt: new Date().toISOString(),
  };
  await db.users.create(user);

  if (body.password) {
    await createOwnerCredential(user.id, user.email!, body.password);
  }

  const res = ok({ user, business: null });
  return applySessionCookie(res, sessionFromUser(user));
}
