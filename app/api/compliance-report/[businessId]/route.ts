// GET /api/compliance-report/:businessId -> snapshot, laws, moduleTitles, opsera

import { ownedBusinessOr403 } from '@/lib/auth/guards';
import { loadComplianceReport } from '@/lib/compliance/report';
import { fail, ok } from '@/lib/http';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ businessId: string }> },
) {
  const { businessId } = await params;
  const owned = await ownedBusinessOr403(businessId);
  if (!owned) return fail('Unauthorized', 401);

  const report = await loadComplianceReport(businessId);
  if (!report) return fail('No compliance snapshot yet', 404);

  const { snapshot, laws, moduleTitles, history, opsera } = report;
  return ok({ snapshot, laws, moduleTitles, history, opsera });
}
