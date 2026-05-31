// POST /api/pipeline/:businessId/run -> { runId }
// Phase 0 STUB — owner: T2. Replace body with the real research→curriculum→
// compliance orchestrator. For now returns a fake runId and flips the business
// status so the owner UI can poll /status.

import { nanoid } from 'nanoid';
import { getDb } from '@/lib/contracts/db';
import { ok } from '@/lib/http';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ businessId: string }> },
) {
  const { businessId } = await params;
  const db = getDb();
  const business = await db.businesses.get(businessId);
  if (business) await db.businesses.update(businessId, { status: 'researching' });
  return ok({ runId: `run_${nanoid(10)}` });
}
