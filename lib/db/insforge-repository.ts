// InsforgeRepository — real DbRepository backed by Insforge's PostgREST-style
// Database API (https://docs.insforge.dev/sdks/rest/database).
//
//   Base URL : process.env.INSFORGE_API_URL   (e.g. https://<app>.insforge.app)
//   Auth     : Authorization: Bearer <INSFORGE_API_KEY>   (anon key or JWT)
//   CRUD     : GET/POST/PATCH/DELETE /api/database/records/{table}
//              - POST bodies are arrays; we send `Prefer: return=representation`
//              - filters use PostgREST DSL, e.g. ?id=eq.<value>
//
// Selected by getDb() when INSFORGE_API_KEY is present and USE_MOCKS !== 'true'.
//
// BLOCKED: requires (1) confirmed Insforge project URL + key, and (2) the tables
// below to exist in the project's `public` schema with jsonb columns for nested
// fields (Business.roles, TrainingProgram.modules, etc.). Until creds land this
// is unexercised — see docs/INTEGRATION_LOG.md. The shape follows the published
// REST contract so it should work once a project is provisioned.

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

const TABLE_PREFIX = process.env.INSFORGE_TABLE_PREFIX ?? 'trainr_';

function baseUrl(): string {
  const url = process.env.INSFORGE_API_URL;
  if (!url) throw new Error('INSFORGE_API_URL is not set');
  return url.replace(/\/$/, '');
}

function headers(extra?: Record<string, string>): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.INSFORGE_API_KEY ?? ''}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

function recordsUrl(table: string, query?: Record<string, string>): string {
  const qs = query
    ? '?' +
      Object.entries(query)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&')
    : '';
  return `${baseUrl()}/api/database/records/${TABLE_PREFIX}${table}${qs}`;
}

// PostgREST equality filter encoding: { field: value } -> field=eq.value
function eqFilters(filter?: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  if (!filter) return out;
  for (const [k, v] of Object.entries(filter)) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'object') continue; // can't filter nested fields server-side
    out[k] = `eq.${String(v)}`;
  }
  return out;
}

class InsforgeCollection<T extends object> implements CrudRepo<T> {
  constructor(
    private readonly table: string,
    private readonly idField: keyof T,
  ) {}

  private idEq(id: string): Record<string, string> {
    return { [String(this.idField)]: `eq.${id}` };
  }

  async get(id: string): Promise<T | null> {
    const res = await fetch(recordsUrl(this.table, { ...this.idEq(id), limit: '1' }), {
      headers: headers(),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Insforge get ${this.table} failed: ${res.status}`);
    const rows = (await res.json()) as T[];
    return rows[0] ?? null;
  }

  async list(filter?: Partial<T>): Promise<T[]> {
    const res = await fetch(
      recordsUrl(this.table, {
        ...eqFilters(filter as Record<string, unknown>),
        limit: '1000',
      }),
      { headers: headers(), cache: 'no-store' },
    );
    if (!res.ok) throw new Error(`Insforge list ${this.table} failed: ${res.status}`);
    return (await res.json()) as T[];
  }

  async create(value: T): Promise<T> {
    const res = await fetch(recordsUrl(this.table), {
      method: 'POST',
      headers: headers({ Prefer: 'return=representation' }),
      body: JSON.stringify([value]),
    });
    if (!res.ok) throw new Error(`Insforge create ${this.table} failed: ${res.status}`);
    const rows = (await res.json()) as T[];
    return rows[0] ?? value;
  }

  async update(id: string, patch: Partial<T>): Promise<T> {
    const res = await fetch(recordsUrl(this.table, this.idEq(id)), {
      method: 'PATCH',
      headers: headers({ Prefer: 'return=representation' }),
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(`Insforge update ${this.table} failed: ${res.status}`);
    const rows = (await res.json()) as T[];
    if (!rows[0]) throw new Error(`Insforge update ${this.table}: not found ${id}`);
    return rows[0];
  }

  async delete(id: string): Promise<void> {
    const res = await fetch(recordsUrl(this.table, this.idEq(id)), {
      method: 'DELETE',
      headers: headers(),
    });
    if (!res.ok) throw new Error(`Insforge delete ${this.table} failed: ${res.status}`);
  }
}

class InsforgeRepository implements DbRepository {
  businesses = new InsforgeCollection<Business>('businesses', 'id');
  users = new InsforgeCollection<User>('users', 'id');
  intake = new InsforgeCollection<IntakeProfile>('intake', 'businessId');
  files = new InsforgeCollection<StoredFile>('files', 'id');
  research = new InsforgeCollection<ResearchArtifact>('research', 'id');
  programs = new InsforgeCollection<TrainingProgram>('programs', 'id');
  progress = new InsforgeCollection<EmployeeProgress>('progress', 'id');
  compliance = new InsforgeCollection<ComplianceSnapshot>('compliance', 'id');
  audit = new InsforgeCollection<AuditEvent>('audit', 'id');
  chat = new InsforgeCollection<ChatMessage>('chat', 'id');

  async findBusinessByJoinCode(code: string): Promise<Business | null> {
    const rows = await this.businesses.list({
      joinCode: code.trim().toUpperCase(),
    } as Partial<Business>);
    return rows[0] ?? null;
  }
}

const g = globalThis as unknown as { __trainrInsforgeDb?: InsforgeRepository };

export function getInsforgeRepository(): DbRepository {
  if (!g.__trainrInsforgeDb) g.__trainrInsforgeDb = new InsforgeRepository();
  return g.__trainrInsforgeDb;
}
