// GET /api/compliance-report/:businessId -> { snapshot, laws }
// Phase 0 STUB — owner: T4 (governance/snapshot read). Returns the latest
// compliance snapshot for the business.

import { getDb } from '@/lib/contracts/db';
import { ok, fail } from '@/lib/http';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ businessId: string }> },
) {
  const { businessId } = await params;
  const snapshots = await getDb().compliance.list({ businessId });
  const snapshot = snapshots.sort((a, b) => b.programVersion - a.programVersion)[0];
  if (!snapshot) return fail('No compliance snapshot yet', 404);
  return ok({ snapshot, laws: snapshot.appliedLaws });
}
