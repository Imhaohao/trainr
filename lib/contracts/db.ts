// DB contract — Insforge (impl: T1). Mock/Local fallback: lib/mocks/mock-db.ts
// FROZEN after Phase 0.

import type {
  Business,
  User,
  IntakeProfile,
  StoredFile,
  ResearchArtifact,
  TrainingProgram,
  EmployeeProgress,
  ComplianceSnapshot,
  AuditEvent,
  ChatMessage,
} from '@/types';

export interface CrudRepo<T> {
  get(id: string): Promise<T | null>;
  list(filter?: Partial<T>): Promise<T[]>;
  create(value: T): Promise<T>;
  update(id: string, patch: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

export interface DbRepository {
  businesses: CrudRepo<Business>;
  users: CrudRepo<User>;
  intake: CrudRepo<IntakeProfile>;
  files: CrudRepo<StoredFile>;
  research: CrudRepo<ResearchArtifact>;
  programs: CrudRepo<TrainingProgram>;
  progress: CrudRepo<EmployeeProgress>;
  compliance: CrudRepo<ComplianceSnapshot>;
  audit: CrudRepo<AuditEvent>;
  chat: CrudRepo<ChatMessage>;
  findBusinessByJoinCode(code: string): Promise<Business | null>;
}

// Returns Insforge when INSFORGE_API_KEY is present and USE_MOCKS !== 'true';
// otherwise the in-memory mock/Local repository (guaranteed to work with zero keys).
//
// Phase 0 ships the mock repository. Phase 1 (T1) adds InsforgeRepository (real)
// and a persistent LocalRepository under lib/db/ and selects here.
export function getDb(): DbRepository {
  const useMocks =
    process.env.USE_MOCKS === 'true' || !process.env.INSFORGE_API_KEY;
  if (useMocks) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getMockDb } = require('@/lib/mocks/mock-db') as typeof import('@/lib/mocks/mock-db');
    return getMockDb();
  }
  // T1 Phase 1: return new InsforgeRepository() here.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getMockDb } = require('@/lib/mocks/mock-db') as typeof import('@/lib/mocks/mock-db');
  return getMockDb();
}
