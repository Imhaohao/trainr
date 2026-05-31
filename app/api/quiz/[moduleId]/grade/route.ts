// POST /api/quiz/:moduleId/grade { employeeId, businessId, answers, language } -> grade result

import { gradeQuiz } from '@/lib/coach/grading';
import { fail, ok, readJson } from '@/lib/http';
import type { Language } from '@/types/training';

interface GradeBody {
  businessId?: string;
  employeeId?: string;
  answers?: Record<string, number | string>;
  language?: Language;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ moduleId: string }> },
) {
  const { moduleId } = await params;
  const body = await readJson<GradeBody>(req);

  if (!body.employeeId) return fail('employeeId is required');
  if (!body.businessId) return fail('businessId is required');

  const result = await gradeQuiz({
    moduleId,
    employeeId: body.employeeId,
    businessId: body.businessId,
    answers: body.answers ?? {},
    language: body.language,
  });

  if (!result) return fail('Quiz or employee not found', 404);

  return ok(result);
}
