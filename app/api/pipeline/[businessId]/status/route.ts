// GET /api/pipeline/:businessId/status -> { stage, pct, programId? }
// Phase 0 STUB — owner: T2. Replace with the real checkpointed status. For now
// reports "ready" with the seeded program so the owner dashboard renders.

import { getDb } from '@/lib/contracts/db';
import { ok } from '@/lib/http';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ businessId: string }> },
) {
  const { businessId } = await params;
  const programs = await getDb().programs.list({ businessId });
  const program = programs[0];
  return ok({
    stage: program ? 'ready' : 'generating',
    pct: program ? 100 : 0,
    programId: program?.id,
  });
}
