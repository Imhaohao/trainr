// PATCH /api/programs/:businessId/modules/:moduleId (owner edit) -> { module }
// Phase 0 STUB — owner: T2. Applies the patch to the module within the program
// and persists. Used by the owner dashboard's inline module editor.

import { getDb } from '@/lib/contracts/db';
import { ok, fail, readJson } from '@/lib/http';
import type { TrainingModule } from '@/types';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ businessId: string; moduleId: string }> },
) {
  const { businessId, moduleId } = await params;
  const patch = await readJson<Partial<TrainingModule>>(req);
  const db = getDb();

  const programs = await db.programs.list({ businessId });
  const program = programs.sort((a, b) => b.version - a.version)[0];
  if (!program) return fail('No program', 404);

  const idx = program.modules.findIndex((m) => m.id === moduleId);
  if (idx === -1) return fail('Module not found', 404);

  const updated: TrainingModule = {
    ...program.modules[idx],
    ...patch,
    id: moduleId,
    programId: program.id,
  };
  program.modules[idx] = updated;
  await db.programs.update(program.id, { modules: program.modules });

  return ok({ module: updated });
}
