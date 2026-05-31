// GET /api/audit/:businessId -> { events: AuditEvent[] }
// Phase 0 STUB — owner: T4. Reads the audit trail for a business.

import { getDb } from '@/lib/contracts/db';
import { ok } from '@/lib/http';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ businessId: string }> },
) {
  const { businessId } = await params;
  const events = (await getDb().audit.list({ businessId })).sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1,
  );
  return ok({ events });
}
