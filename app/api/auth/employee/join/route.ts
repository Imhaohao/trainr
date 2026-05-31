// POST /api/auth/employee/join { joinCode, name } -> { user, businessId }
// Resolves the business by join code and creates a no-password employee user,
// then starts an employee session (low-friction onboarding by design).

import { z } from 'zod';
import { nanoid } from 'nanoid';
import { getDb } from '@/lib/contracts/db';
import { ok, fail, readJson } from '@/lib/http';
import { setSession } from '@/lib/auth';
import type { User } from '@/types';

const Body = z.object({
  joinCode: z.string().trim().min(1),
  name: z.string().trim().min(1),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return fail('Enter your join code and name.');
  const { joinCode, name } = parsed.data;

  const db = getDb();
  const business = await db.findBusinessByJoinCode(joinCode);
  if (!business) return fail('Invalid join code — check with your manager.', 404);

  const user: User = {
    id: `usr_${nanoid(10)}`,
    role: 'employee',
    businessId: business.id,
    name,
    createdAt: new Date().toISOString(),
  };
  await db.users.create(user);

  await setSession({
    userId: user.id,
    role: 'employee',
    businessId: business.id,
  });

  return ok({ user, businessId: business.id });
}
