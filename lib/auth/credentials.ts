import { getLocalDbMutable } from '@/lib/db/local-repository';
import type { OwnerCredential } from '@/lib/db/local-store';
import { hashPassword, verifyPassword } from './password';

function useLocalCredentials(): boolean {
  return process.env.USE_MOCKS !== 'true';
}

export async function createOwnerCredential(
  userId: string,
  email: string,
  password: string,
): Promise<void> {
  if (!useLocalCredentials()) return;
  const db = getLocalDbMutable();
  const normalized = email.trim().toLowerCase();
  const rows = db.getCredentials().filter((c) => c.email !== normalized);
  rows.push({
    userId,
    email: normalized,
    passwordHash: hashPassword(password),
  });
  db.setCredentials(rows);
}

export async function findCredentialByEmail(
  email: string,
): Promise<OwnerCredential | null> {
  if (!useLocalCredentials()) return null;
  const normalized = email.trim().toLowerCase();
  return (
    getLocalDbMutable().getCredentials().find((c) => c.email === normalized) ??
    null
  );
}

export async function verifyOwnerPassword(
  email: string,
  password: string,
): Promise<OwnerCredential | null> {
  const cred = await findCredentialByEmail(email);
  if (!cred) return null;
  if (!verifyPassword(password, cred.passwordHash)) return null;
  return cred;
}
