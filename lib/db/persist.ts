// Tiny JSON-file persistence helper for the Local (zero-dependency) backends.
// Writes live under `.data/` at the repo root (gitignored). Best-effort: if the
// filesystem is read-only (e.g. some serverless targets) it degrades to
// in-memory only and logs once, never throwing into a request path.

import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), '.data');

export function loadJson<T>(file: string, fallback: T): T {
  try {
    const p = path.join(DATA_DIR, file);
    if (!fs.existsSync(p)) return fallback;
    return JSON.parse(fs.readFileSync(p, 'utf8')) as T;
  } catch (err) {
    console.error(`[trainr] failed to read ${file}, using fallback`, err);
    return fallback;
  }
}

export function saveJson(file: string, data: unknown): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`[trainr] failed to persist ${file} (continuing in-memory)`, err);
  }
}
