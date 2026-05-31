// POST /api/progress { employeeId, moduleId, status, quizScore?, simScore?, certified? } -> { progress }

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
  quizPassed?: boolean;
  simScore?: number;
  simPassed?: boolean;
  certified?: boolean;
}

export async function POST(req: Request) {
  const body = await readJson<Body>(req);
  if (!body.employeeId || !body.moduleId)
    return fail('employeeId and moduleId are required');

  const db = getDb();
  const all = await db.progress.list({ employeeId: body.employeeId });
  const existing = all.find((p) => p.moduleId === body.moduleId);

  const status: ProgressStatus = body.status ?? existing?.status ?? 'in_progress';
  const completed = status === 'completed';

  let progress: EmployeeProgress;
  if (existing) {
    progress = await db.progress.update(existing.id, {
      status,
      quizScore: body.quizScore ?? existing.quizScore,
      quizPassed: body.quizPassed ?? existing.quizPassed,
      simScore: body.simScore ?? existing.simScore,
      simPassed: body.simPassed ?? existing.simPassed,
      certified: body.certified ?? existing.certified,
      completedAt: completed
        ? (existing.completedAt ?? new Date().toISOString())
        : existing.completedAt,
    });
  } else {
    progress = await db.progress.create({
      id: `prog_${nanoid(10)}`,
      employeeId: body.employeeId,
      businessId: body.businessId ?? '',
      moduleId: body.moduleId,
      status,
      quizScore: body.quizScore,
      quizPassed: body.quizPassed,
      simScore: body.simScore,
      simPassed: body.simPassed,
      certified: body.certified,
      completedAt: completed ? new Date().toISOString() : undefined,
    });
  }

  return ok({ progress });
}
