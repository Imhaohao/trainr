// POST /api/progress { employeeId, moduleId, status, quizScore? } -> { progress }
// Phase 0 STUB — owner: T3. Upserts an EmployeeProgress row in the active DB.

import { nanoid } from 'nanoid';
import { getDb } from '@/lib/contracts/db';
import { ok, fail, readJson } from '@/lib/http';
import type { EmployeeProgress, ProgressStatus } from '@/types';

interface Body {
  employeeId?: string;
  businessId?: string;
  moduleId?: string;
  status?: ProgressStatus;
  quizScore?: number;
}

export async function POST(req: Request) {
  const body = await readJson<Body>(req);
  if (!body.employeeId || !body.moduleId)
    return fail('employeeId and moduleId are required');

  const db = getDb();
  const all = await db.progress.list({ employeeId: body.employeeId });
  const existing = all.find((p) => p.moduleId === body.moduleId);

  const status: ProgressStatus = body.status ?? 'in_progress';
  const completed = status === 'completed';

  let progress: EmployeeProgress;
  if (existing) {
    progress = await db.progress.update(existing.id, {
      status,
      quizScore: body.quizScore ?? existing.quizScore,
      completedAt: completed ? new Date().toISOString() : existing.completedAt,
    });
  } else {
    progress = await db.progress.create({
      id: `prog_${nanoid(10)}`,
      employeeId: body.employeeId,
      businessId: body.businessId ?? '',
      moduleId: body.moduleId,
      status,
      quizScore: body.quizScore,
      completedAt: completed ? new Date().toISOString() : undefined,
    });
  }

  return ok({ progress });
}
