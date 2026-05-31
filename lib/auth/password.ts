import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 } as const;
const KEY_LEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, KEY_LEN, SCRYPT_PARAMS).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, expectedHex] = parts;
  const expected = Buffer.from(expectedHex, 'hex');
  const actual = scryptSync(password, salt, expected.length, SCRYPT_PARAMS);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
