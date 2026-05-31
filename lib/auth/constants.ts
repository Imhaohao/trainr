// Auth constants. The session secret is read from env with a dev fallback so
// the demo runs with zero configuration; set SESSION_SECRET in production.

export const SESSION_COOKIE = 'trainr_session';
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days

export function sessionSecret(): string {
  return process.env.SESSION_SECRET || 'trainr-dev-session-secret-change-me';
}

// Whether getDb() is currently backed by the seeded in-memory mock. When true,
// owner pages fall back to the demo owner so the dashboard is one-click without
// a real login (preserves the fixture-driven demo).
export function usingMockDb(): boolean {
  return process.env.USE_MOCKS === 'true';
}
