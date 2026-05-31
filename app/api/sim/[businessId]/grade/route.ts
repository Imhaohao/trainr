// POST /api/sim/:businessId/grade { employeeId, simId, attempts } -> SimResult

import { gradeSimRun } from '@/lib/employee/sim-grading';
import { getEmployee } from '@/lib/employee/store';
import { fail, ok, readJson } from '@/lib/http';
import type { Language, SimAttempt } from '@/types/training';

interface GradeBody {
  employeeId?: string;
  simId?: string;
  attempts?: SimAttempt[];
  language?: Language;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ businessId: string }> },
) {
  const { businessId } = await params;
  const body = await readJson<GradeBody>(req);

  if (!body.employeeId || !body.simId) {
    return fail('employeeId and simId are required');
  }
  if (!Array.isArray(body.attempts) || body.attempts.length === 0) {
    return fail('attempts are required');
  }

  const employee = await getEmployee(body.employeeId);
  if (!employee || employee.businessId !== businessId) {
    return fail('Employee not found for this business', 404);
  }

  const result = await gradeSimRun(
    body.simId,
    body.employeeId,
    body.attempts,
    body.language ?? 'en',
  );

  if (!result) return fail('Sim or employee not found', 404);

  return ok(result);
}
