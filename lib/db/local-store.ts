// JSON file persistence for LocalRepository (`.data/trainr-db.json`).

import fs from 'node:fs';
import path from 'node:path';
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

export interface OwnerCredential {
  userId: string;
  email: string;
  passwordHash: string;
}

export interface LocalDbSnapshot {
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
  credentials: OwnerCredential[];
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'trainr-db.json');

function emptySnapshot(): LocalDbSnapshot {
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
    credentials: [],
  };
}

let cache: LocalDbSnapshot | null = null;

export function loadLocalSnapshot(): LocalDbSnapshot {
  if (cache) return cache;
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      cache = { ...emptySnapshot(), ...JSON.parse(raw) } as LocalDbSnapshot;
      return cache;
    }
  } catch (err) {
    console.warn('[trainr] Failed to read local DB, starting fresh:', err);
  }
  cache = emptySnapshot();
  return cache;
}

export function saveLocalSnapshot(snapshot: LocalDbSnapshot): void {
  cache = snapshot;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(snapshot, null, 2), 'utf8');
}

export function replaceLocalSnapshot(snapshot: LocalDbSnapshot): void {
  saveLocalSnapshot(snapshot);
}

export function getLocalDbPath(): string {
  return DB_FILE;
}
