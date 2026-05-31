// POST /api/i18n/:businessId/translate { lang } -> { lang, translatedModuleIds }
// Phase 0 STUB — owner: T4. Replace with real translation + language-variant
// storage. For now records the requested language on the business and echoes
// which modules would be translated.

import { getDb } from '@/lib/contracts/db';
import { ok, fail, readJson } from '@/lib/http';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ businessId: string }> },
) {
  const { businessId } = await params;
  const body = await readJson<{ lang?: string }>(req);
  if (!body.lang) return fail('lang is required');

  const db = getDb();
  const business = await db.businesses.get(businessId);
  if (!business) return fail('Business not found', 404);

  if (!business.languages.includes(body.lang)) {
    await db.businesses.update(businessId, {
      languages: [...business.languages, body.lang],
    });
  }

  const programs = await db.programs.list({ businessId });
  const program = programs.sort((a, b) => b.version - a.version)[0];
  const translatedModuleIds = program?.modules.map((m) => m.id) ?? [];

  return ok({ lang: body.lang, translatedModuleIds });
}
