// GET /api/pipeline/:businessId/status -> { stage, pct, programId? }
// Owner: T2. Reads the orchestrator's checkpointed run-status (written to
// Tigris). Falls back to the latest persisted program if no run has been
// recorded yet (e.g. seeded demo business).

import { getDb } from '@/lib/contracts/db';
import { getRunStatus } from '@/lib/agents/orchestrator';
import { ok, fail } from '@/lib/http';
import { ownedBusinessOr403 } from '@/lib/auth';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ businessId: string }> },
) {
  const { businessId } = await params;

  // Owner-only (T1 cross-track security patch — see INTEGRATION_LOG). The owner
  // dashboard polls this; only the owning owner may read pipeline status.
  const owned = await ownedBusinessOr403(businessId);
  if (!owned) return fail('Forbidden.', 403);

  const run = await getRunStatus(businessId);
  if (run) {
    return ok({
      stage: run.stage,
      pct: run.pct,
      programId: run.programId,
      version: run.version,
      error: run.error,
    });
  }

  // No run recorded — report the latest persisted program (or idle).
  const programs = await getDb().programs.list({ businessId });
  const program = programs.sort((a, b) => b.version - a.version)[0];
  return ok({
    stage: program ? 'ready' : 'idle',
    pct: program ? 100 : 0,
    programId: program?.id,
    version: program?.version,
  });
}
