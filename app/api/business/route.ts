// POST /api/business { ...Business } -> { business }  (generates joinCode)
// Phase 0 stub (owner: T1). Creates a Business in the active DB with a fresh,
// collision-checked join code.

import { nanoid } from 'nanoid';
import { getDb } from '@/lib/contracts/db';
import { ok, readJson } from '@/lib/http';
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
  const body = await readJson<Partial<Business>>(req);
  const db = getDb();

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
    ownerId: body.ownerId ?? '',
    createdAt: new Date().toISOString(),
    status: 'draft',
  };
  await db.businesses.create(business);

  return ok({ business });
}
