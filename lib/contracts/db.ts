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
} from '../../types/index';
import { getMockDb } from '../mocks/mock-db';
import { getLocalRepository } from '../db/local-repository';
import { getInsforgeRepository } from '../db/insforge-repository';

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

// Backend selection (T1 Phase 1):
//   USE_MOCKS === 'true'                 -> in-memory mock seeded with the Happy
//                                           Lemon fixture (one-click demo).
//   else INSFORGE_API_URL + _API_KEY set -> InsforgeRepository (real PostgREST).
//   else                                 -> LocalRepository (persistent JSON
//                                           under .data/, zero external keys).
//
// Both URL and key are required for Insforge — selecting it with only one set
// would throw on the first request. The mock and Local repositories pass the
// same smoke test; the demo runs fully even if Insforge creds never arrive.
export function getDb(): DbRepository {
  if (process.env.USE_MOCKS === 'true') return getMockDb();
  if (process.env.INSFORGE_API_KEY && process.env.INSFORGE_API_URL) {
    return getInsforgeRepository();
  }
  return getLocalRepository();
}
