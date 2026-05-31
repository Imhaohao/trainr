// GET /api/programs/:businessId -> { program }
// Phase 0 STUB — owner: T2 (generation). Reads the latest program from the DB.

import { getDb } from '@/lib/contracts/db';
import { ok, fail } from '@/lib/http';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ businessId: string }> },
) {
  const { businessId } = await params;
  const programs = await getDb().programs.list({ businessId });
  const program = programs.sort((a, b) => b.version - a.version)[0];
  if (!program) return fail('No program yet', 404);
  return ok({ program });
}
