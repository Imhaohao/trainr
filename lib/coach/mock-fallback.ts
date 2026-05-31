import type { Language } from '@/types/training';
import type {
  EquipmentSim,
  ModuleCitation,
  ModuleCitationBackedText,
  SimResult,
  SimStep,
} from '@/types/training';

function pickVariant<T extends { [key: string]: unknown }>(
  base: string,
  variants: Partial<Record<Language, string>> | undefined,
  language: Language,
): string {
  return variants?.[language] ?? base;
}

function stepLabel(step: SimStep, language: Language): string {
  return pickVariant(step.prompt, step.promptVariants, language);
}

function actionLabel(
  step: SimStep,
  actionId: string,
  language: Language,
): string {
  const action = step.actions.find((a) => a.id === actionId);
  if (!action) return actionId;
  return pickVariant(action.label, action.labelVariants, language);
}

const SAFETY_STOP: Partial<Record<Language, string>> = {
  en: 'Safety stop — this choice violates our food-safety or quality standard. Stop and follow the approved procedure.',
  es: 'Parada de seguridad — esta opción viola nuestro estándar de seguridad alimentaria o calidad. Detente y sigue el procedimiento aprobado.',
  'zh-Hans': '安全停止——此选择违反食品安全或质量标准。请停下并按批准流程操作。',
};

export function generateSimDebriefMock(
  simResult: SimResult,
  sim: EquipmentSim,
  language: Language,
): ModuleCitationBackedText {
  const lang = language in SAFETY_STOP ? language : 'en';
  const failed = simResult.perStep.find((s) => !s.correct);
  const correctCount = simResult.perStep.filter((s) => s.correct).length;

  const citations: ModuleCitation[] = sim.steps
    .filter((s) => s.citationModuleId)
    .map((s) => ({
      moduleId: s.citationModuleId!,
      title: s.citationModuleId!.replace('mod_', '').replace(/_/g, ' '),
    }));

  if (simResult.passed) {
    const textByLang: Partial<Record<Language, string>> = {
      en: `Strong run — you completed all ${sim.steps.length} station steps correctly. You followed the station card, kept food-safe habits, and knew to ask the shift lead when something was unclear. Keep that rhythm on rush shifts.`,
      es: `Buen recorrido — completaste correctamente los ${sim.steps.length} pasos de la estación. Seguiste la tarjeta, mantuviste hábitos seguros y supiste preguntar al encargado cuando algo no estaba claro.`,
      'zh-Hans': `表现很好——你正确完成了全部 ${sim.steps.length} 个工位步骤。遵循工位卡、保持安全习惯，并在不清楚时懂得询问值班组长。`,
    };
    return {
      text: textByLang[lang] ?? textByLang.en!,
      citations: citations.slice(0, 2),
    };
  }

  const failedStep = failed
    ? sim.steps.find((s) => s.id === failed.stepId)
    : undefined;

  if (failedStep) {
    const correctAction = actionLabel(
      failedStep,
      failedStep.correctActionId,
      lang,
    );
    const wasHazard = failedStep.hazardActionIds?.length
      ? failed!.feedback.includes('Safety') ||
        failed!.feedback.includes('Parada') ||
        failed!.feedback.includes('安全')
      : false;

    const textByLang: Partial<Record<Language, string>> = {
      en: wasHazard
        ? `You got ${correctCount}/${sim.steps.length} steps right, but step "${stepLabel(failedStep, lang)}" triggered a safety stop. Next time: ${correctAction}. When anything on the station card is unclear, ask the shift lead — never guess.`
        : `You got ${correctCount}/${sim.steps.length} steps. On "${stepLabel(failedStep, lang)}", the right move is: ${correctAction}. Review the station card and ask your shift lead when unsure.`,
      es: wasHazard
        ? `Acertaste ${correctCount}/${sim.steps.length} pasos, pero "${stepLabel(failedStep, lang)}" activó una parada de seguridad. La acción correcta: ${correctAction}. Pregunta al encargado cuando tengas dudas.`
        : `Acertaste ${correctCount}/${sim.steps.length} pasos. En "${stepLabel(failedStep, lang)}", lo correcto es: ${correctAction}.`,
      'zh-Hans': wasHazard
        ? `${correctCount}/${sim.steps.length} 步正确，但「${stepLabel(failedStep, lang)}」触发了安全停止。正确做法：${correctAction}。不清楚时问值班组长。`
        : `${correctCount}/${sim.steps.length} 步正确。「${stepLabel(failedStep, lang)}」应选择：${correctAction}。`,
    };
    return {
      text: textByLang[lang] ?? textByLang.en!,
      citations: citations.filter(
        (c) => c.moduleId === failedStep.citationModuleId,
      ),
    };
  }

  return {
    text:
      lang === 'es'
        ? 'Sigue practicando con la tarjeta de estación a la vista.'
        : lang === 'zh-Hans'
          ? '继续练习，工位卡放在手边。'
          : 'Keep practicing with the station card in view.',
    citations,
  };
}

export function safetyStopMessage(language: Language): string {
  return SAFETY_STOP[language] ?? SAFETY_STOP.en!;
}

export function stepCorrectFeedback(language: Language): string {
  const map: Partial<Record<Language, string>> = {
    en: 'Correct — nice work on this step.',
    es: 'Correcto — buen trabajo en este paso.',
    'zh-Hans': '正确——这一步做得很好。',
  };
  return map[language] ?? map.en!;
}

export function stepWrongFeedback(
  step: SimStep,
  language: Language,
  isHazard: boolean,
): string {
  if (isHazard) return safetyStopMessage(language);
  const correct = actionLabel(step, step.correctActionId, language);
  const map: Partial<Record<Language, string>> = {
    en: `Not quite — the approved action here is: ${correct}.`,
    es: `Casi — la acción aprobada aquí es: ${correct}.`,
    'zh-Hans': `不太对——此处应：${correct}。`,
  };
  return map[language] ?? map.en!;
}
