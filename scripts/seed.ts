/**
 * Seed the active DB (mock/Local/Insforge, per env) with the Happy Lemon demo
 * fixture. Idempotent: upserts each entity by id.
 *
 * Run with:  npx tsx scripts/seed.ts
 * (Uses relative imports so it works without tsconfig path-alias resolution.)
 */
import { getDb } from '../lib/contracts/db';
import type { CrudRepo } from '../lib/contracts/db';
import { demoFixture } from '../lib/mocks/fixtures';
import { ensureDemoCredential } from '../lib/auth/local-store';

async function upsert<T extends { id: string }>(
  repo: CrudRepo<T>,
  rows: T[],
): Promise<void> {
  for (const row of rows) {
    const existing = await repo.get(row.id);
    if (existing) await repo.update(row.id, row);
    else await repo.create(row);
  }
}

async function main() {
  const db = getDb();
  const f = demoFixture;

  await upsert(db.businesses, [f.business]);
  await upsert(db.users, f.users);
  // intake is keyed by businessId
  {
    const existing = await db.intake.get(f.intake.businessId);
    if (existing) await db.intake.update(f.intake.businessId, f.intake);
    else await db.intake.create(f.intake);
  }
  await upsert(db.files, f.files);
  await upsert(db.research, f.research);
  await upsert(db.programs, [f.program]);
  await upsert(db.progress, f.progress);
  await upsert(db.compliance, [f.compliance]);
  await upsert(db.audit, f.audit);
  await upsert(db.chat, f.chat);

  // Provision the demo owner's login credential (xiao@happylemon-demo.com /
  // demo1234) so login works on the persistent backends, not just mock mode.
  ensureDemoCredential();

  const businesses = await db.businesses.list();
  const programs = await db.programs.list();
  console.log(
    `Seeded: ${businesses.length} business(es), ${f.users.length} users, ` +
      `${programs[0]?.modules.length ?? 0} modules, join code ${f.business.joinCode}.`,
  );
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
