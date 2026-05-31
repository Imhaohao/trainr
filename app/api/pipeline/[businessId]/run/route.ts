// POST /api/pipeline/:businessId/run -> { runId }
// Owner: T2. Kicks off the research→curriculum→compliance→assemble→persist
// pipeline. Returns a runId immediately and runs the pipeline in the background;
// the owner UI polls GET /status (the orchestrator's checkpointed run-status)
// for live progress. The pipeline checkpoints each stage, so a crash resumes on
// the next run rather than restarting.

import { nanoid } from 'nanoid';
import { getDb } from '@/lib/contracts/db';
import { runPipeline } from '@/lib/agents/orchestrator';
import { ok, fail } from '@/lib/http';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ businessId: string }> },
) {
  const { businessId } = await params;
  const business = await getDb().businesses.get(businessId);
  if (!business) return fail('Business not found', 404);

  const runId = `run_${nanoid(10)}`;

  // Fire-and-forget: the orchestrator writes run-status as it progresses, which
  // the poller reads. Errors are captured into run-status (and logged), not lost.
  void runPipeline(businessId, { runId }).catch((err) => {
    console.error(`[pipeline] run ${runId} failed to start:`, err);
  });

  return ok({ runId });
}
