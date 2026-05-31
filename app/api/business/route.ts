// POST /api/business { ...Business } -> { business }
// Creates a Business owned by the current owner session, with a fresh,
// collision-checked join code, then links it to the owner and refreshes the
// session so subsequent owner requests are scoped to this business.

import { nanoid } from 'nanoid';
import { getDb } from '@/lib/contracts/db';
import { ok, fail, readJson } from '@/lib/http';
import { requireApiOwner, setSession } from '@/lib/auth';
import type { Business } from '@/types';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars

async function uniqueJoinCode(
  exists: (code: string) => Promise<boolean>,
): Promise<string> {
  for (let i = 0; i < 25; i++) {
    let code = '';
    for (let j = 0; j < 6; j++)
      code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    if (!(await exists(code))) return code;
  }
  return `B${nanoid(5).toUpperCase()}`;
}

export async function POST(req: Request) {
  const ctx = await requireApiOwner();
  if (!ctx) return fail('Owner session required.', 401);

  const db = getDb();

  // One business per owner: if they already have one, return it (idempotent —
  // re-entering onboarding shouldn't create duplicates). Edits go via PATCH.
  if (ctx.user.businessId) {
    const existing = await db.businesses.get(ctx.user.businessId);
    if (existing) return ok({ business: existing });
  }

  const body = await readJson<Partial<Business>>(req);

  const joinCode = await uniqueJoinCode(
    async (c) => (await db.findBusinessByJoinCode(c)) !== null,
  );

  const business: Business = {
    id: `biz_${nanoid(10)}`,
    name: body.name ?? 'Untitled Business',
    industry: body.industry ?? '',
    address: body.address ?? '',
    state: body.state ?? '',
    employeeCount: body.employeeCount ?? 0,
    demographics: body.demographics,
    languages: body.languages ?? ['en'],
    mission: body.mission,
    roles: body.roles ?? [],
    joinCode,
    ownerId: ctx.user.id,
    createdAt: new Date().toISOString(),
    status: 'draft',
  };
  await db.businesses.create(business);

  await db.users.update(ctx.user.id, { businessId: business.id });
  await setSession({
    userId: ctx.user.id,
    role: 'owner',
    businessId: business.id,
  });

  return ok({ business });
}
