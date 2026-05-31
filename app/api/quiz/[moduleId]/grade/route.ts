// POST /api/quiz/:moduleId/grade { answers } -> { score, perQuestion, feedback }
// Phase 0 STUB — owner: T3. Grades multiple-choice deterministically against
// the program fixture; free-response is marked for review. T3 replaces with
// rubric grading via the LLM + Claude Skills.

import { getDb } from '@/lib/contracts/db';
import { ok, fail, readJson } from '@/lib/http';
import { IDS } from '@/lib/mocks/fixtures';

interface GradeBody {
  businessId?: string;
  answers: Record<string, number | string>;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ moduleId: string }> },
) {
  const { moduleId } = await params;
  const body = await readJson<GradeBody>(req);
  const answers = body.answers ?? {};

  const db = getDb();
  const programs = await db.programs.list({
    businessId: body.businessId ?? IDS.business,
  });
  const program = programs[0];
  const mod = program?.modules.find((m) => m.id === moduleId);
  if (!mod?.quiz) return fail('Quiz not found', 404);

  const perQuestion = mod.quiz.questions.map((q) => {
    if (q.type === 'multiple_choice') {
      const correct = Number(answers[q.id]) === q.correctIndex;
      return { id: q.id, correct, needsReview: false };
    }
    return { id: q.id, correct: null, needsReview: true };
  });

  const gradable = perQuestion.filter((p) => p.correct !== null);
  const score =
    gradable.length === 0
      ? 0
      : Math.round(
          (gradable.filter((p) => p.correct).length / gradable.length) * 100,
        );

  return ok({
    score,
    perQuestion,
    feedback:
      'Auto-graded multiple choice. Free-response answers are pending review.',
  });
}
