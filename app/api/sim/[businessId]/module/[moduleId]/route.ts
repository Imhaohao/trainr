import { getSimForModule } from '@/lib/employee/equipment';
import { fail, ok } from '@/lib/http';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ businessId: string; moduleId: string }> },
) {
  const { businessId, moduleId } = await params;
  const sim = getSimForModule(moduleId, businessId);
  if (!sim) return fail('No sim for this module', 404);
  return ok({ sim });
}
