// POST /api/deploy/:businessId/publish -> { version, pdfUrls, auditId }
// Phase 0 STUB — owner: T4. Replace with validate→PDF→version bump→audit. For
// now bumps the program/business to "published" and records an audit event.

import { nanoid } from 'nanoid';
import { getDb } from '@/lib/contracts/db';
import { ok, fail } from '@/lib/http';
import type { AuditEvent } from '@/types';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ businessId: string }> },
) {
  const { businessId } = await params;
  const db = getDb();

  const programs = await db.programs.list({ businessId });
  const program = programs.sort((a, b) => b.version - a.version)[0];
  if (!program) return fail('No program to publish', 404);

  await db.programs.update(program.id, { status: 'published' });
  await db.businesses.update(businessId, { status: 'published' });

  const audit: AuditEvent = {
    id: `audit_${nanoid(10)}`,
    businessId,
    actorId: 'system',
    action: 'program.published',
    detail: `Published program v${program.version} (stub).`,
    programVersion: program.version,
    createdAt: new Date().toISOString(),
  };
  await db.audit.create(audit);

  return ok({
    version: program.version,
    pdfUrls: [`${businessId}/pdf/handbook-v${program.version}.pdf`],
    auditId: audit.id,
  });
}
