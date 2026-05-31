import { resolveEquipmentSim } from '@/lib/employee/equipment';
import { simDebrief } from '@/lib/coach/llm';
import {
  stepCorrectFeedback,
  stepWrongFeedback,
} from '@/lib/coach/mock-fallback';
import {
  applyModuleCompletion,
  getEmployee,
  updateProgress,
} from '@/lib/employee/store';
import type { Language, SimAttempt, SimResult, SimStepFeedback } from '@/types/training';

export async function gradeSimRun(
  simId: string,
  employeeId: string,
  attempts: SimAttempt[],
  language: Language = 'en',
): Promise<SimResult | undefined> {
  const employee = await getEmployee(employeeId);
  if (!employee || employee.role !== 'employee') return undefined;

  const sim = await resolveEquipmentSim(simId, employee.businessId);
  if (!sim || sim.businessId !== employee.businessId) return undefined;

  const attemptByStep = new Map(attempts.map((a) => [a.stepId, a.actionId]));

  const perStep: SimStepFeedback[] = sim.steps.map((step) => {
    const chosen = attemptByStep.get(step.id);
    const isHazard =
      chosen !== undefined &&
      (step.hazardActionIds?.includes(chosen) ?? false);
    const correct =
      chosen !== undefined &&
      chosen === step.correctActionId &&
      !isHazard;

    let feedback: string;
    if (correct) {
      feedback = stepCorrectFeedback(language);
    } else if (chosen === undefined) {
      feedback =
        language === 'es'
          ? 'Sin respuesta para este paso.'
          : language === 'zh-Hans'
            ? '此步骤未作答。'
            : 'No answer recorded for this step.';
    } else {
      feedback = stepWrongFeedback(step, language, isHazard);
    }

    return { stepId: step.id, correct, feedback };
  });

  const correctSteps = perStep.filter((s) => s.correct).length;
  const score =
    sim.steps.length === 0
      ? 0
      : Math.round((correctSteps / sim.steps.length) * 100);
  const passed = score >= sim.passScore;

  const partial: SimResult = {
    simId,
    score,
    passed,
    perStep,
    skill: 'scenario-coach',
  };

  partial.debrief = await simDebrief(
    partial,
    sim,
    language,
    employee.businessId,
  );

  await updateProgress(
    employeeId,
    sim.moduleId,
    {
      simScore: score,
      simPassed: passed,
      status: 'in_progress',
    },
    employee.businessId,
  );

  await applyModuleCompletion(employeeId, sim.moduleId, employee.businessId);

  return partial;
}
