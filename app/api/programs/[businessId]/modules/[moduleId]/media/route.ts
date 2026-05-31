import { getDb } from '@/lib/contracts/db';
import { resolveModuleMedia } from '@/lib/employee/module-media';
import { fail, ok } from '@/lib/http';

export async function GET(
  _req: Request,
  {
    params,
  }: { params: Promise<{ businessId: string; moduleId: string }> },
) {
  const { businessId, moduleId } = await params;

  const programs = await getDb().programs.list({ businessId });
  const program = programs.sort((a, b) => b.version - a.version)[0];
  if (!program) return fail('No program yet', 404);

  const module = program.modules.find((m) => m.id === moduleId);
  if (!module) return fail('Module not found', 404);

  const media = await resolveModuleMedia(businessId, module);
  return ok({ media });
}
