// Credential store for owner email/password login. Kept separate from the
// `User` entity (which is frozen and has no password field) and from the
// DbRepository contract. Backed by `.data/credentials.json` with a globalThis
// cache; the demo owner is seeded lazily so login works out-of-the-box.

import { loadJson, saveJson } from '../db/persist';
import { hashPassword } from './password';
import { usingMockDb } from './constants';
import { IDS, demoOwner } from '../mocks/fixtures';

const CRED_FILE = 'credentials.json';
const DEMO_PASSWORD = 'demo1234';

export interface Credential {
  userId: string;
  email: string; // stored lowercased
  passwordHash: string;
}

interface CredStore {
  credentials: Credential[];
}

const g = globalThis as unknown as { __trainrCreds?: CredStore };

function store(): CredStore {
  if (!g.__trainrCreds) {
    g.__trainrCreds = loadJson<CredStore>(CRED_FILE, { credentials: [] });
    // In mock mode the demo owner User exists in the fixture-backed DB, so the
    // matching credential can be auto-seeded for one-click demo login. On the
    // Local/Insforge backends the User only exists after `npm run seed`, which
    // also provisions this credential via ensureDemoCredential() — so we avoid
    // seeding a credential whose backing User isn't present.
    if (usingMockDb()) seedDemo(g.__trainrCreds);
  }
  return g.__trainrCreds;
}

function persist(): void {
  if (g.__trainrCreds) saveJson(CRED_FILE, g.__trainrCreds);
}

// Seed the Happy Lemon owner so the demo login (xiao@happylemon-demo.com /
// demo1234) works. Idempotent.
function seedDemo(s: CredStore): void {
  if (!demoOwner.email) return;
  const email = demoOwner.email.toLowerCase();
  if (s.credentials.some((c) => c.email === email)) return;
  s.credentials.push({
    userId: IDS.owner,
    email,
    passwordHash: hashPassword(DEMO_PASSWORD),
  });
}

// Explicitly provision the demo credential (used by scripts/seed.ts so demo
// login works on the persistent Local/Insforge backends after seeding).
export function ensureDemoCredential(): void {
  const s = store();
  seedDemo(s);
  persist();
}

export function findCredentialByEmail(email: string): Credential | null {
  const norm = email.trim().toLowerCase();
  return store().credentials.find((c) => c.email === norm) ?? null;
}

export function saveCredential(
  userId: string,
  email: string,
  passwordHash: string,
): void {
  const s = store();
  const norm = email.trim().toLowerCase();
  const existing = s.credentials.find((c) => c.email === norm);
  if (existing) {
    existing.userId = userId;
    existing.passwordHash = passwordHash;
  } else {
    s.credentials.push({ userId, email: norm, passwordHash });
  }
  persist();
}
