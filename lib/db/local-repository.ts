// File-backed DbRepository — default when USE_MOCKS is off and Insforge is unset.

import type { CrudRepo, DbRepository } from '@/lib/contracts/db';
import type {
  AuditEvent,
  Business,
  ChatMessage,
  ComplianceSnapshot,
  EmployeeProgress,
  IntakeProfile,
  ResearchArtifact,
  StoredFile,
  TrainingProgram,
  User,
} from '@/types';
import {
  loadLocalSnapshot,
  saveLocalSnapshot,
  type LocalDbSnapshot,
  type OwnerCredential,
} from './local-store';

type WithId = { id: string };

function matches<T extends object>(item: T, filter?: Partial<T>): boolean {
  if (!filter) return true;
  return Object.entries(filter).every(([k, v]) => {
    if (v === undefined) return true;
    return (item as Record<string, unknown>)[k] === v;
  });
}

class PersistingRepo<T extends object> implements CrudRepo<T> {
  constructor(
    private readonly key: keyof LocalDbSnapshot,
    private readonly idOf: (value: T) => string,
    private readonly getRows: () => T[],
    private readonly setRows: (rows: T[]) => void,
  ) {}

  async get(id: string): Promise<T | null> {
    const row = this.getRows().find((v) => this.idOf(v) === id);
    return row ? structuredClone(row) : null;
  }

  async list(filter?: Partial<T>): Promise<T[]> {
    return this.getRows()
      .filter((v) => matches(v, filter))
      .map((v) => structuredClone(v));
  }

  async create(value: T): Promise<T> {
    const rows = this.getRows();
    const id = this.idOf(value);
    if (rows.some((v) => this.idOf(v) === id)) {
      throw new Error(`Already exists: ${id}`);
    }
    const next = structuredClone(value);
    rows.push(next);
    this.setRows(rows);
    return structuredClone(next);
  }

  async update(id: string, patch: Partial<T>): Promise<T> {
    const rows = this.getRows();
    const idx = rows.findIndex((v) => this.idOf(v) === id);
    if (idx === -1) throw new Error(`Not found: ${id}`);
    const updated = { ...rows[idx], ...patch } as T;
    rows[idx] = updated;
    this.setRows(rows);
    return structuredClone(updated);
  }

  async delete(id: string): Promise<void> {
    const rows = this.getRows().filter((v) => this.idOf(v) !== id);
    this.setRows(rows);
  }
}

class LocalDbRepository implements DbRepository {
  private snapshot: LocalDbSnapshot;

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

  constructor(initial?: LocalDbSnapshot) {
    this.snapshot = initial ?? loadLocalSnapshot();
    const persist = () => saveLocalSnapshot(this.snapshot);
    const byId = <T extends WithId>(v: T) => v.id;

    const repo = <T extends object>(
      key: keyof LocalDbSnapshot,
      idOf: (v: T) => string,
    ) =>
      new PersistingRepo<T>(
        key,
        idOf,
        () => this.snapshot[key] as T[],
        (rows) => {
          (this.snapshot[key] as T[]) = rows;
          persist();
        },
      );

    this.businesses = repo('businesses', byId);
    this.users = repo('users', byId);
    this.intake = repo('intake', (v) => v.businessId);
    this.files = repo('files', byId);
    this.research = repo('research', byId);
    this.programs = repo('programs', byId);
    this.progress = repo('progress', byId);
    this.compliance = repo('compliance', byId);
    this.audit = repo('audit', byId);
    this.chat = repo('chat', byId);
  }

  async findBusinessByJoinCode(code: string): Promise<Business | null> {
    const norm = code.trim().toUpperCase();
    const hit = this.snapshot.businesses.find(
      (b) => b.joinCode.toUpperCase() === norm,
    );
    return hit ? structuredClone(hit) : null;
  }

  getCredentials(): OwnerCredential[] {
    return structuredClone(this.snapshot.credentials);
  }

  setCredentials(credentials: OwnerCredential[]): void {
    this.snapshot.credentials = credentials;
    saveLocalSnapshot(this.snapshot);
  }
}

const g = globalThis as unknown as { __trainrLocalDb?: LocalDbRepository };

export function getLocalDb(): DbRepository {
  if (!g.__trainrLocalDb) {
    g.__trainrLocalDb = new LocalDbRepository();
  }
  return g.__trainrLocalDb;
}

export function getLocalDbMutable(): LocalDbRepository {
  return g.__trainrLocalDb ?? new LocalDbRepository();
}

export function resetLocalDb(snapshot?: LocalDbSnapshot): DbRepository {
  g.__trainrLocalDb = new LocalDbRepository(snapshot);
  return g.__trainrLocalDb;
}
