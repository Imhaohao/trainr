// In-memory DbRepository — the guaranteed-working fallback for Phase 0 / dev.
// Seeded with the Happy Lemon fixture. A module-level singleton so every
// getDb() call in a process shares the same data (mutations persist within a run).

import type { CrudRepo, DbRepository } from '@/lib/contracts/db';
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
import { demoFixture } from './fixtures';

// IntakeProfile is keyed by businessId (no `id`), so its repo uses businessId as id.
type WithId = { id: string };

function matches<T extends object>(item: T, filter?: Partial<T>): boolean {
  if (!filter) return true;
  return Object.entries(filter).every(([k, v]) => {
    if (v === undefined) return true;
    return (item as Record<string, unknown>)[k] === v;
  });
}

class InMemoryRepo<T extends object> implements CrudRepo<T> {
  private store = new Map<string, T>();

  constructor(
    private readonly idOf: (value: T) => string,
    seed: T[] = [],
  ) {
    for (const v of seed) this.store.set(idOf(v), structuredClone(v));
  }

  async get(id: string): Promise<T | null> {
    const v = this.store.get(id);
    return v ? structuredClone(v) : null;
  }

  async list(filter?: Partial<T>): Promise<T[]> {
    return [...this.store.values()]
      .filter((v) => matches(v, filter))
      .map((v) => structuredClone(v));
  }

  async create(value: T): Promise<T> {
    const id = this.idOf(value);
    this.store.set(id, structuredClone(value));
    return structuredClone(value);
  }

  async update(id: string, patch: Partial<T>): Promise<T> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Not found: ${id}`);
    const next = { ...existing, ...patch } as T;
    this.store.set(id, next);
    return structuredClone(next);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}

class MockDbRepository implements DbRepository {
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

  constructor() {
    const f = demoFixture;
    const byId = <T extends WithId>(v: T) => v.id;
    this.businesses = new InMemoryRepo<Business>(byId, [f.business]);
    this.users = new InMemoryRepo<User>(byId, f.users);
    this.intake = new InMemoryRepo<IntakeProfile>((v) => v.businessId, [f.intake]);
    this.files = new InMemoryRepo<StoredFile>(byId, f.files);
    this.research = new InMemoryRepo<ResearchArtifact>(byId, f.research);
    this.programs = new InMemoryRepo<TrainingProgram>(byId, [f.program]);
    this.progress = new InMemoryRepo<EmployeeProgress>(byId, f.progress);
    this.compliance = new InMemoryRepo<ComplianceSnapshot>(byId, [f.compliance]);
    this.audit = new InMemoryRepo<AuditEvent>(byId, f.audit);
    this.chat = new InMemoryRepo<ChatMessage>(byId, f.chat);
  }

  async findBusinessByJoinCode(code: string): Promise<Business | null> {
    const all = await this.businesses.list();
    const norm = code.trim().toUpperCase();
    return all.find((b) => b.joinCode.toUpperCase() === norm) ?? null;
  }
}

// Singleton across the process (survives HMR via globalThis).
const g = globalThis as unknown as { __trainrMockDb?: MockDbRepository };

export function getMockDb(): DbRepository {
  if (!g.__trainrMockDb) g.__trainrMockDb = new MockDbRepository();
  return g.__trainrMockDb;
}

// Test/seed helper: drop all in-memory state and re-seed from the fixture.
export function resetMockDb(): DbRepository {
  g.__trainrMockDb = new MockDbRepository();
  return g.__trainrMockDb;
}
