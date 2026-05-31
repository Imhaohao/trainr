import { nanoid } from 'nanoid';

import { getDb } from '@/lib/contracts/db';
import { evaluateModuleCompletion } from '@/lib/employee/progress-utils';
import { IDS } from '@/lib/mocks/fixtures';
import type { EmployeeProgress, TrainingModule } from '@/types';

export {
  evaluateModuleCompletion,
  getJustCompletedModuleId,
  getRecentMiss,
} from '@/lib/employee/progress-utils';

export async function getEmployee(employeeId: string) {
  const db = getDb();
  return db.users.get(employeeId);
}

export async function getModule(
  moduleId: string,
  businessId: string = IDS.business,
): Promise<TrainingModule | undefined> {
  const db = getDb();
  const programs = await db.programs.list({ businessId });
  const program = programs[0];
  return program?.modules.find((m) => m.id === moduleId);
}

export async function getProgressRecord(
  employeeId: string,
  moduleId: string,
): Promise<EmployeeProgress | undefined> {
  const db = getDb();
  const all = await db.progress.list({ employeeId });
  return all.find((p) => p.moduleId === moduleId);
}

export type ProgressPatch = Partial<
  Pick<
    EmployeeProgress,
    | 'status'
    | 'quizScore'
    | 'quizPassed'
    | 'simScore'
    | 'simPassed'
    | 'completedAt'
    | 'certified'
  >
> & {
  missedQuestionIds?: string[];
};

export async function updateProgress(
  employeeId: string,
  moduleId: string,
  patch: ProgressPatch,
  businessId?: string,
): Promise<EmployeeProgress> {
  const db = getDb();
  const all = await db.progress.list({ employeeId });
  const existing = all.find((p) => p.moduleId === moduleId);

  if (existing) {
    return db.progress.update(existing.id, patch);
  }

  const employee = await getEmployee(employeeId);
  const resolvedBusinessId =
    businessId ?? employee?.businessId ?? IDS.business;

  return db.progress.create({
    id: `prog_${nanoid(10)}`,
    employeeId,
    businessId: resolvedBusinessId,
    moduleId,
    status: patch.status ?? 'in_progress',
    ...patch,
  });
}

export async function applyModuleCompletion(
  employeeId: string,
  moduleId: string,
  businessId: string,
): Promise<EmployeeProgress | undefined> {
  const mod = await getModule(moduleId, businessId);
  if (!mod) return undefined;

  const record = await getProgressRecord(employeeId, moduleId);
  if (!record) return undefined;

  const { completed, certified } = evaluateModuleCompletion(mod, record);
  if (!completed && record.status === 'completed') {
    return updateProgress(employeeId, moduleId, {
      status: 'in_progress',
      certified: false,
      completedAt: undefined,
    });
  }
  if (!completed) return record;

  return updateProgress(employeeId, moduleId, {
    status: 'completed',
    certified,
    completedAt: record.completedAt ?? new Date().toISOString(),
  });
}

