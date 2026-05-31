// Employee training extensions — equipment sim, coach citations, progress gates.
// Core entities remain in types/index.ts; import LanguageCode as Language here.

import type { EmployeeProgress, LanguageCode, TrainingModule } from './index';

export type ModuleProgress = EmployeeProgress & {
  missedQuestionIds?: string[];
};

export function asModuleProgress(row: EmployeeProgress): ModuleProgress {
  return row as ModuleProgress;
}

export function findModule(
  modules: TrainingModule[],
  moduleId: string,
): TrainingModule | undefined {
  return modules.find((m) => m.id === moduleId);
}

export function missedQuestionPrompt(
  mod: TrainingModule,
  questionId: string,
): string | undefined {
  return mod.quiz?.questions.find((q) => q.id === questionId)?.prompt;
}

export type Language = LanguageCode;

export type SimAction = {
  id: string;
  label: string;
  labelVariants?: Partial<Record<Language, string>>;
  icon?: string;
};

export type SimStep = {
  id: string;
  prompt: string;
  promptVariants?: Partial<Record<Language, string>>;
  actions: SimAction[];
  correctActionId: string;
  hazardActionIds?: string[];
  hint?: string;
  hintVariants?: Partial<Record<Language, string>>;
  citationModuleId?: string;
};

export type SimSource = {
  kind: 'fixture' | 'mcp' | 'rtrvr';
  ref: string;
  retrievedAt: string;
};

export type EquipmentMachineAsset = {
  id: string;
  name: string;
  category: string;
  propName?: string;
  provider: 'daz3d' | 'cgtrader' | 'sketchfab' | 'other';
  productUrl: string;
  formats?: string[];
  previewImageUrl?: string;
  notes?: string;
};

export type EquipmentSim = {
  id: string;
  businessId: string;
  moduleId: string;
  name: string;
  nameVariants?: Partial<Record<Language, string>>;
  description: string;
  descriptionVariants?: Partial<Record<Language, string>>;
  passScore: number;
  steps: SimStep[];
  source: SimSource;
  /** RTRVR-discovered 3D model sources (Daz / CGTrader listings). */
  assets?: EquipmentMachineAsset[];
  /** GLB export workflow markdown when catalog was built via RTRVR. */
  exportGuide?: string;
};

export type SimAttempt = { stepId: string; actionId: string };

export type ModuleCitation = {
  moduleId: string;
  title: string;
  snippet?: string;
};

export type ModuleCitationBackedText = {
  text: string;
  citations: ModuleCitation[];
};

export type SimStepFeedback = {
  stepId: string;
  correct: boolean;
  feedback: string;
};

export type SimResult = {
  simId: string;
  score: number;
  passed: boolean;
  perStep: SimStepFeedback[];
  debrief?: ModuleCitationBackedText;
  skill: 'scenario-coach';
};
