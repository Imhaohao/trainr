import { getLlm } from '@/lib/contracts/llm';
import { loadSkill } from './load-skill';
import { gradeQuizAnswerMock } from './coach-chat-mock';
import {
  applyModuleCompletion,
  getEmployee,
  getModule,
  updateProgress,
} from '@/lib/employee/store';
import type { Language } from '@/types/training';

export type QuizGradeInput = {
  moduleId: string;
  employeeId: string;
  businessId: string;
  answers: Record<string, number | string>;
  language?: Language;
};

export type QuizGradeResult = {
  score: number;
  passed: boolean;
  perQuestion: {
    id: string;
    correct: boolean | null;
    needsReview: boolean;
    feedback?: string;
  }[];
  feedback: string;
  missedQuestionIds: string[];
};

async function gradeFreeResponse(
  rubric: string,
  answer: string,
  language?: Language,
): Promise<{ correct: boolean; feedback: string }> {
  const useMocks =
    process.env.USE_MOCKS === 'true' || !process.env.ANTHROPIC_API_KEY?.trim();

  if (useMocks) {
    return gradeQuizAnswerMock({ type: 'free_response', rubric }, answer);
  }

  try {
    const raw = await getLlm().generate({
      system: `${loadSkill('quiz-grader')}\n\nRubric:\n${rubric}`,
      messages: [{ role: 'user', content: answer }],
      maxTokens: 256,
    });
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('no json');
    const parsed = JSON.parse(jsonMatch[0]) as {
      correct?: boolean;
      feedback?: string;
    };
    return {
      correct: Boolean(parsed.correct),
      feedback: parsed.feedback ?? 'Graded.',
    };
  } catch {
    return gradeQuizAnswerMock({ type: 'free_response', rubric }, answer);
  }
}

export async function gradeQuiz(
  input: QuizGradeInput,
): Promise<QuizGradeResult | undefined> {
  const { moduleId, employeeId, businessId, answers } = input;

  const employee = await getEmployee(employeeId);
  if (!employee || employee.businessId !== businessId) return undefined;

  const mod = await getModule(moduleId, businessId);
  if (!mod?.quiz) return undefined;

  const perQuestion: QuizGradeResult['perQuestion'] = [];

  for (const q of mod.quiz.questions) {
    if (q.type === 'multiple_choice') {
      const correct = Number(answers[q.id]) === q.correctIndex;
      perQuestion.push({
        id: q.id,
        correct,
        needsReview: false,
        feedback: correct
          ? 'Correct!'
          : 'Not quite — review the module and try again.',
      });
      continue;
    }

    const text = String(answers[q.id] ?? '').trim();
    const graded = await gradeFreeResponse(q.rubric ?? '', text, input.language);
    perQuestion.push({
      id: q.id,
      correct: graded.correct,
      needsReview: false,
      feedback: graded.feedback,
    });
  }

  const gradable = perQuestion.filter((p) => p.correct !== null);
  const score =
    gradable.length === 0
      ? 0
      : Math.round(
          (gradable.filter((p) => p.correct).length / gradable.length) * 100,
        );
  const passed = score >= 70;

  const missedQuestionIds = perQuestion
    .filter((p) => p.correct === false)
    .map((p) => p.id);

  await updateProgress(
    employeeId,
    moduleId,
    {
      quizScore: score,
      quizPassed: passed,
      status: passed ? 'in_progress' : 'in_progress',
      missedQuestionIds: passed ? [] : missedQuestionIds,
    },
    businessId,
  );

  await applyModuleCompletion(employeeId, moduleId, businessId);

  return {
    score,
    passed,
    perQuestion,
    missedQuestionIds,
    feedback: passed
      ? 'Quiz passed — great work!'
      : 'Review the module and try again. You need 70% to pass.',
  };
}

export { evaluateModuleCompletion } from '@/lib/employee/progress-utils';
