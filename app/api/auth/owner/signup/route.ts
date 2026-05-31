// POST /api/auth/owner/signup { name, email, password? } -> { user, business: null }
// Creates an owner User, stores hashed credentials (when a password is given),
// and starts an owner session. The owner then creates their business in the
// onboarding wizard.

import { z } from 'zod';
import { nanoid } from 'nanoid';
import { getDb } from '@/lib/contracts/db';
import { ok, fail, readJson } from '@/lib/http';
import {
  hashPassword,
  saveCredential,
  findCredentialByEmail,
  setSession,
} from '@/lib/auth';
import type { User } from '@/types';

const Body = z.object({
  name: z.string().trim().min(1, 'Enter your name.'),
  email: z.string().trim().email('Enter a valid email.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? 'Invalid signup details.');
  }
  const { name, email, password } = parsed.data;

  if (findCredentialByEmail(email)) {
    return fail('An account with that email already exists.', 409);
  }

  const user: User = {
    id: `usr_${nanoid(10)}`,
    role: 'owner',
    businessId: '',
    name,
    email,
    createdAt: new Date().toISOString(),
  };
  await getDb().users.create(user);

  saveCredential(user.id, email, hashPassword(password));
  await setSession({ userId: user.id, role: 'owner', businessId: '' });

  return ok({ user, business: null });
}
