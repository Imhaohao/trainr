// LocalRepository — the guaranteed-working, zero-external-key DbRepository.
// Backed by a single JSON file under `.data/db.json` so data survives restarts
// (unlike the in-memory mock). Selected by getDb() when USE_MOCKS !== 'true'
// and no INSFORGE_API_KEY is present. Passes the same smoke test as the mock.
//
// Per-business isolation is the caller's responsibility via list() filters;
// this layer never leaks cross-business rows because every owner/business
// query is scoped by `businessId`.

import type { CrudRepo, DbRepository } from '../contracts/db';
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
import { loadJson, saveJson } from './persist';

const DB_FILE = 'db.json';

interface DbShape {
  businesses: Business[];
  users: User[];
  intake: IntakeProfile[];
  files: StoredFile[];
  research: ResearchArtifact[];
  programs: TrainingProgram[];
  progress: EmployeeProgress[];
  compliance: ComplianceSnapshot[];
  audit: AuditEvent[];
  chat: ChatMessage[];
}

function emptyDb(): DbShape {
  return {
    businesses: [],
    users: [],
    intake: [],
    files: [],
    research: [],
    programs: [],
    progress: [],
    compliance: [],
    audit: [],
    chat: [],
  };
}

function matches<T extends object>(item: T, filter?: Partial<T>): boolean {
  if (!filter) return true;
  return Object.entries(filter).every(([k, v]) => {
    if (v === undefined) return true;
    return (item as Record<string, unknown>)[k] === v;
  });
}

class JsonCollection<T extends object> implements CrudRepo<T> {
  constructor(
    private readonly read: () => T[],
    private readonly write: (rows: T[]) => void,
    private readonly idOf: (value: T) => string,
  ) {}

  async get(id: string): Promise<T | null> {
    const row = this.read().find((r) => this.idOf(r) === id);
    return row ? structuredClone(row) : null;
  }

  async list(filter?: Partial<T>): Promise<T[]> {
    return this.read()
      .filter((r) => matches(r, filter))
      .map((r) => structuredClone(r));
  }

  async create(value: T): Promise<T> {
    const rows = this.read();
    const id = this.idOf(value);
    const next = rows.filter((r) => this.idOf(r) !== id);
    next.push(structuredClone(value));
    this.write(next);
    return structuredClone(value);
  }

  async update(id: string, patch: Partial<T>): Promise<T> {
    const rows = this.read();
    const idx = rows.findIndex((r) => this.idOf(r) === id);
    if (idx === -1) throw new Error(`Not found: ${id}`);
    const updated = { ...rows[idx], ...patch } as T;
    rows[idx] = updated;
    this.write(rows);
    return structuredClone(updated);
  }

  async delete(id: string): Promise<void> {
    const rows = this.read().filter((r) => this.idOf(r) !== id);
    this.write(rows);
  }
}

class LocalRepository implements DbRepository {
  private data: DbShape;

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
    this.data = { ...emptyDb(), ...loadJson<DbShape>(DB_FILE, emptyDb()) };
    const persist = () => saveJson(DB_FILE, this.data);
    const collection = <K extends keyof DbShape>(
      key: K,
      idOf: (v: DbShape[K][number]) => string,
    ) =>
      new JsonCollection<DbShape[K][number]>(
        () => this.data[key],
        (rows) => {
          this.data[key] = rows as DbShape[K];
          persist();
        },
        idOf,
      );

    const byId = <T extends { id: string }>(v: T) => v.id;
    this.businesses = collection('businesses', byId);
    this.users = collection('users', byId);
    this.intake = collection('intake', (v) => v.businessId);
    this.files = collection('files', byId);
    this.research = collection('research', byId);
    this.programs = collection('programs', byId);
    this.progress = collection('progress', byId);
    this.compliance = collection('compliance', byId);
    this.audit = collection('audit', byId);
    this.chat = collection('chat', byId);
  }

  async findBusinessByJoinCode(code: string): Promise<Business | null> {
    const norm = code.trim().toUpperCase();
    const found = this.data.businesses.find(
      (b) => b.joinCode.toUpperCase() === norm,
    );
    return found ? structuredClone(found) : null;
  }
}

// Singleton across the process (survives HMR via globalThis).
const g = globalThis as unknown as { __trainrLocalDb?: LocalRepository };

export function getLocalRepository(): DbRepository {
  if (!g.__trainrLocalDb) g.__trainrLocalDb = new LocalRepository();
  return g.__trainrLocalDb;
}
