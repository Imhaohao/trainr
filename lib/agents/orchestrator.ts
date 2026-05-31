// Pipeline orchestrator (T2): research → curriculum → compliance → assemble →
// persist, with per-stage checkpointing to Tigris so a failure resumes instead
// of restarting (the "agent checkpointing" advantage).
//
// State surfaces:
//   - Checkpoint:  `${businessId}/program/v${n}/_checkpoint.json` — stage + partial results.
//   - Run status:  `${businessId}/program/run-status.json` — what T1's poller reads.
//   - Business.status — coarse status for the owner UI.
//   - Final program: DB (getDb().programs.create) + `${businessId}/program/v${n}/program.json`
//                    + per-module `${businessId}/program/v${n}/modules/<id>.md`.

import { nanoid } from 'nanoid';
import { getDb } from '../contracts/db';
import { getResearch } from '../contracts/research';
import { getStorage } from '../contracts/storage';
import { tigrisKeys } from '../integrations/tigris';
import { buildResearchQueries } from '../integrations/rtrvr';
import { generateCurriculum, type CurriculumResult } from './curriculum';
import { generateCompliance } from './compliance';
import { trainingProgramSchema } from './schemas';
import type {
  ComplianceSnapshot,
  OnboardingWeek,
  ResearchArtifact,
  TrainingModule,
  TrainingProgram,
} from '../../types/index';

export type PipelineStage =
  | 'idle'
  | 'research'
  | 'curriculum'
  | 'compliance'
  | 'assemble'
  | 'persist'
  | 'ready'
  | 'error';

// Coarse progress shown by the poller (GET /api/pipeline/:businessId/status).
const STAGE_PCT: Record<PipelineStage, number> = {
  idle: 0,
  research: 15,
  curriculum: 45,
  compliance: 70,
  assemble: 85,
  persist: 95,
  ready: 100,
  error: 0,
};

export interface RunStatus {
  businessId: string;
  runId: string;
  version: number;
  stage: PipelineStage;
  pct: number;
  programId?: string;
  error?: string;
  updatedAt: string;
}

interface Checkpoint {
  businessId: string;
  version: number;
  programId: string;
  runId: string;
  stage: PipelineStage;
  research?: ResearchArtifact[];
  curriculum?: CurriculumResult;
  compliance?: { modules: TrainingModule[]; snapshot: ComplianceSnapshot };
  updatedAt: string;
}

export interface PipelineResult {
  runId: string;
  version: number;
  programId: string;
  status: 'ready' | 'error';
  error?: string;
}

const RUN_STATUS_KEY = (businessId: string) =>
  `${businessId}/program/run-status.json`;
const CHECKPOINT_KEY = (businessId: string, version: number) =>
  `${businessId}/program/v${version}/_checkpoint.json`;

// ---------------------------------------------------------------------------
// Storage helpers (run status + checkpoints live in Tigris/mock storage).
// ---------------------------------------------------------------------------

async function readJson<T>(key: string): Promise<T | null> {
  try {
    const buf = await getStorage().getObject(key);
    return JSON.parse(buf.toString('utf8')) as T;
  } catch {
    return null; // not found / unreadable → treat as absent
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await getStorage().putObject(
      key,
      JSON.stringify(value, null, 2),
      'application/json',
    );
  } catch (err) {
    console.error(`[orchestrator] storage write failed for ${key}:`, err);
  }
}

export async function getRunStatus(
  businessId: string,
): Promise<RunStatus | null> {
  return readJson<RunStatus>(RUN_STATUS_KEY(businessId));
}

async function setRunStatus(status: RunStatus): Promise<void> {
  await writeJson(RUN_STATUS_KEY(status.businessId), status);
}

// ---------------------------------------------------------------------------
// Pipeline.
// ---------------------------------------------------------------------------

export async function runPipeline(
  businessId: string,
  opts: { runId?: string } = {},
): Promise<PipelineResult> {
  const db = getDb();
  const business = await db.businesses.get(businessId);
  if (!business) {
    throw new Error(`runPipeline: business not found: ${businessId}`);
  }

  // Resume if a prior run is mid-flight; otherwise start the next version.
  const prior = await getRunStatus(businessId);
  const resuming =
    prior !== null && prior.stage !== 'ready' && prior.stage !== 'error';
  const version = resuming ? prior!.version : await nextVersion(db, businessId);
  // Inherit the prior runId only when resuming; a fresh run gets a fresh id.
  const runId =
    opts.runId ?? (resuming ? prior!.runId : `run_${nanoid(10)}`);

  let checkpoint =
    (await readJson<Checkpoint>(CHECKPOINT_KEY(businessId, version))) ?? null;
  const programId = checkpoint?.programId ?? `prog_${nanoid(10)}`;

  const status = (stage: PipelineStage, extra?: Partial<RunStatus>): RunStatus => ({
    businessId,
    runId,
    version,
    stage,
    pct: STAGE_PCT[stage],
    programId: extra?.programId,
    error: extra?.error,
    updatedAt: new Date().toISOString(),
  });

  const saveCheckpoint = async (
    stage: PipelineStage,
    patch: Partial<Checkpoint>,
  ): Promise<void> => {
    checkpoint = {
      businessId,
      version,
      programId,
      runId,
      stage,
      research: checkpoint?.research,
      curriculum: checkpoint?.curriculum,
      compliance: checkpoint?.compliance,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    await writeJson(CHECKPOINT_KEY(businessId, version), checkpoint);
  };

  try {
    // --- Stage 1: research ------------------------------------------------
    await setRunStatus(status('research'));
    await db.businesses.update(businessId, { status: 'researching' });
    let research = checkpoint?.research;
    if (!research) {
      research = await getResearch().research({
        businessId,
        industry: business.industry,
        state: business.state,
        queries: buildResearchQueries(business.industry, business.state),
      });
      await saveCheckpoint('research', { research });
    }

    // --- Stage 2: curriculum ---------------------------------------------
    await setRunStatus(status('curriculum'));
    await db.businesses.update(businessId, { status: 'generating' });
    let curriculum = checkpoint?.curriculum;
    if (!curriculum) {
      const intake = (await db.intake.get(businessId)) ?? undefined;
      curriculum = await generateCurriculum({
        businessId,
        programId,
        programVersion: version,
        business: {
          name: business.name,
          industry: business.industry,
          state: business.state,
          mission: business.mission,
          roles: business.roles,
        },
        intake,
        research,
        startOrder: 1,
      });
      await saveCheckpoint('curriculum', { curriculum });
    }

    // --- Stage 3: compliance ---------------------------------------------
    await setRunStatus(status('compliance'));
    let compliance = checkpoint?.compliance;
    if (!compliance) {
      const result = await generateCompliance({
        businessId,
        programId,
        programVersion: version,
        state: business.state,
        industry: business.industry,
        employeeCount: business.employeeCount,
        businessName: business.name,
        research,
        startOrder: curriculum.modules.length + 1,
      });
      compliance = { modules: result.modules, snapshot: result.snapshot };
      await saveCheckpoint('compliance', { compliance });
    }
    // Persist compliance snapshot to Tigris (DB persistence happens inside generateCompliance).
    await writeJson(tigrisKeys.compliance(businessId, version), compliance.snapshot);

    // --- Stage 4: assemble program ---------------------------------------
    await setRunStatus(status('assemble', { programId }));
    const program = assembleProgram({
      programId,
      businessId,
      version,
      curriculum,
      complianceModules: compliance.modules,
    });

    // Validate the assembled program meets the DoD requirements.
    const validated = trainingProgramSchema.safeParse(program);
    if (!validated.success) {
      throw new Error(
        `[orchestrator] assembled program failed validation: ${validated.error.issues.map((i) => i.message).join('; ')}`,
      );
    }

    await saveCheckpoint('assemble', {});

    // --- Stage 5: persist -------------------------------------------------
    await setRunStatus(status('persist', { programId }));
    await persistProgram(program);
    await db.businesses.update(businessId, { status: 'ready' });

    await saveCheckpoint('ready', {});
    await setRunStatus(status('ready', { programId }));
    return { runId, version, programId, status: 'ready' };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[orchestrator] pipeline failed (resumable):`, message);
    // Leave the checkpoint intact so the next run resumes from the last stage.
    await setRunStatus(status('error', { programId, error: message }));
    return { runId, version, programId, status: 'error', error: message };
  }
}

// ---------------------------------------------------------------------------
// Assembly + persistence.
// ---------------------------------------------------------------------------

function assembleProgram(args: {
  programId: string;
  businessId: string;
  version: number;
  curriculum: CurriculumResult;
  complianceModules: TrainingModule[];
}): TrainingProgram {
  const modules: TrainingModule[] = [
    ...args.curriculum.modules,
    ...args.complianceModules,
  ].sort((a, b) => a.order - b.order);

  // Add a final "compliance & your rights" week if there are compliance modules.
  const scheduleWeeks: OnboardingWeek[] = [...args.curriculum.scheduleWeeks];
  if (args.complianceModules.length) {
    scheduleWeeks.push({
      week: scheduleWeeks.length + 1,
      goals: ['Understand the laws that protect you and our customers'],
      moduleIds: args.complianceModules.map((m) => m.id),
    });
  }

  return {
    id: args.programId,
    businessId: args.businessId,
    version: args.version,
    modules,
    scheduleWeeks,
    status: 'ready',
    generatedAt: new Date().toISOString(),
  };
}

async function persistProgram(program: TrainingProgram): Promise<void> {
  const db = getDb();
  const storage = getStorage();
  const { businessId, version } = program;

  // DB is the source of truth (upsert).
  const existing = await db.programs.get(program.id);
  if (existing) await db.programs.update(program.id, program);
  else await db.programs.create(program);

  // Tigris: full program + per-module markdown (organizational memory).
  await writeJson(tigrisKeys.program(businessId, version), program);
  await Promise.all(
    program.modules.map((m) =>
      storage
        .putObject(
          tigrisKeys.module(businessId, version, m.id),
          m.contentMarkdown,
          'text/markdown',
        )
        .catch((err) =>
          console.error(`[orchestrator] module md write failed (${m.id}):`, err),
        ),
    ),
  );
}

async function nextVersion(
  db: ReturnType<typeof getDb>,
  businessId: string,
): Promise<number> {
  const programs = await db.programs.list({ businessId });
  const max = programs.reduce((m, p) => Math.max(m, p.version), 0);
  return max + 1;
}
