import type { EmployeeProgress, TrainingModule } from '@/types';
import type { ModuleProgress } from '@/types/training';

/** Completed/certified only when every gate the module defines is passed. */
export function evaluateModuleCompletion(
  mod: TrainingModule,
  record: Pick<
    EmployeeProgress,
    'quizPassed' | 'simPassed' | 'quizScore' | 'simScore'
  >,
): { completed: boolean; certified: boolean } {
  const quizGate = mod.quiz ? record.quizPassed === true : true;
  const simGate = mod.simId ? record.simPassed === true : true;
  const completed = quizGate && simGate;
  return { completed, certified: completed };
}

/** Last completed module in program order (most recently finished). */
export function getJustCompletedModuleId(
  progress: ModuleProgress[],
  modules: TrainingModule[],
): string | undefined {
  const order = new Map(modules.map((m) => [m.id, m.order]));
  const completed = progress
    .filter((p) => p.status === 'completed' && p.completedAt)
    .sort((a, b) => {
      const ta = a.completedAt ? Date.parse(a.completedAt) : 0;
      const tb = b.completedAt ? Date.parse(b.completedAt) : 0;
      if (tb !== ta) return tb - ta;
      return (order.get(b.moduleId) ?? 0) - (order.get(a.moduleId) ?? 0);
    });
  return completed[0]?.moduleId;
}

/** Most recent quiz miss with stored question ids. */
export function getRecentMiss(
  progress: ModuleProgress[],
): { moduleId: string; questionId: string } | null {
  const withMisses = progress.filter(
    (p) => p.missedQuestionIds && p.missedQuestionIds.length > 0,
  );
  const row = withMisses.sort((a, b) => {
    const ta = a.completedAt ? Date.parse(a.completedAt) : 0;
    const tb = b.completedAt ? Date.parse(b.completedAt) : 0;
    return tb - ta;
  })[0];
  if (!row?.missedQuestionIds?.length) return null;
  return { moduleId: row.moduleId, questionId: row.missedQuestionIds[0]! };
}
