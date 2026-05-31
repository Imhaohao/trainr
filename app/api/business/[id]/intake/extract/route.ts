// POST /api/business/:id/intake/extract
// Structure fields from parsed directContext (PDF / Google Doc).

import { getDb } from '@/lib/contracts/db';
import { ownedBusinessOr403 } from '@/lib/auth';
import { extractIntakeFromContext } from '@/lib/intake/extract-from-context';
import { ok, fail } from '@/lib/http';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: businessId } = await params;
  const owned = await ownedBusinessOr403(businessId);
  if (!owned) return fail('Forbidden.', 403);

  const intake = await getDb().intake.get(businessId);
  const text = intake?.directContext?.trim();
  if (!text) {
    return fail(
      'Upload a PDF or import a Google Doc first, then try again.',
      400,
    );
  }

  const result = await extractIntakeFromContext(text);
  return ok(result);
}
