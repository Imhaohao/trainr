import { resolveSimForModule } from '@/lib/employee/equipment';
import { fail, ok } from '@/lib/http';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ businessId: string; moduleId: string }> },
) {
  const { businessId, moduleId } = await params;
  const forceRefresh = new URL(req.url).searchParams.get('refresh') === '1';
  const sim = await resolveSimForModule(moduleId, businessId, { forceRefresh });
  if (!sim) return fail('No sim for this module', 404);
  return ok({ sim });
}
