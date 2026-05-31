// POST /api/business/:id/context
// Import direct context from a Google Doc link (public share required).

import { getDb } from '@/lib/contracts/db';
import { assertBusinessAccess, requireOwner } from '@/lib/auth/guards';
import {
  appendContextSource,
  fetchGoogleDocText,
} from '@/lib/intake/context-extract';
import { ok, fail, readJson } from '@/lib/http';
import type { IntakeProfile } from '@/types';

interface ContextBody {
  googleDocUrl?: string;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireOwner();
  if (!auth.ok) return auth.response;
  const { id: businessId } = await params;
  const denied = await assertBusinessAccess(auth.ctx, businessId);
  if (denied) return denied;

  const body = await readJson<ContextBody>(req);
  const url = body.googleDocUrl?.trim();
  if (!url) return fail('Missing googleDocUrl');

  let extractedText: string;
  try {
    extractedText = await fetchGoogleDocText(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not read Google Doc';
    return fail(message, 400);
  }

  const db = getDb();
  const existing = await db.intake.get(businessId);
  const patch = appendContextSource(
    existing,
    {
      type: 'google_doc',
      label: `Google Doc: ${url.slice(0, 60)}${url.length > 60 ? '…' : ''}`,
      url,
      extractedAt: new Date().toISOString(),
    },
    extractedText,
  );

  const googleDocUrls = [...(existing?.googleDocUrls ?? [])];
  if (!googleDocUrls.includes(url)) googleDocUrls.push(url);

  const next: IntakeProfile = {
    businessId,
    uploadedFileIds: existing?.uploadedFileIds ?? [],
    menuImageIds: existing?.menuImageIds ?? [],
    ...existing,
    ...patch,
    googleDocUrls,
  };

  const intake = existing
    ? await db.intake.update(businessId, next)
    : await db.intake.create(next);

  return ok({
    intake,
    extractedChars: extractedText.length,
    preview: extractedText.slice(0, 400),
  });
}
