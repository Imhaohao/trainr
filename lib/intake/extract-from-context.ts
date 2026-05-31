// Parse owner handbook / Google Doc text into structured intake fields.
// Server-only — uses Anthropic via getLlm(). Client code should import
// types/helpers from ./extract-types instead.

import 'server-only';

import { getLlm } from '@/lib/contracts/llm';
import type { LanguageCode, Recipe } from '@/types';
import { INDUSTRIES } from '@/lib/intake/industries';
import {
  extractSchema,
  type ExtractedIntake,
  type IntakeExtractResult,
} from '@/lib/intake/extract-types';

export type { ExtractedIntake, IntakeExtractResult } from '@/lib/intake/extract-types';
export { toBusinessRoles } from '@/lib/intake/extract-types';

function parseJsonFromLlm(raw: string): ExtractedIntake | null {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = extractSchema.safeParse(JSON.parse(jsonMatch[0]));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function matchIndustry(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const ind of INDUSTRIES) {
    if (lower.includes(ind.toLowerCase().slice(0, 12))) return ind;
  }
  if (/bubble tea|boba|milk tea|tea shop/.test(lower)) {
    return 'Food & Beverage (Bubble Tea / Cafe)';
  }
  if (/restaurant|qsr|fast food/.test(lower)) return 'Restaurant / QSR';
  return undefined;
}

function mockExtractFromContext(text: string): ExtractedIntake {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const joined = text.toLowerCase();

  const nameLine = lines.find((l) =>
    /^(business|company|store|location)\s*[:—-]/i.test(l),
  );
  const name = nameLine
    ? nameLine.replace(/^[^:]+:\s*/i, '').trim()
    : lines[0]?.length < 80
      ? lines[0]
      : undefined;

  const addressMatch = text.match(
    /\d{1,5}\s+[\w\s.]+\s*,\s*[\w\s]+,\s*[A-Z]{2}\s*\d{5}/,
  );

  const employeeMatch = text.match(
    /(\d{1,4})\s*(employees|staff|team members)/i,
  );

  const roles: ExtractedIntake['roles'] = [];
  for (const line of lines) {
    const roleMatch = line.match(/^(barista|cashier|manager|shift lead)\b/i);
    if (roleMatch) {
      roles.push({
        title: roleMatch[1].charAt(0).toUpperCase() + roleMatch[1].slice(1).toLowerCase(),
        customerFacing: /barista|cashier|server/i.test(roleMatch[1]),
      });
    }
  }

  const recipes: Recipe[] = [];
  const recipeBlocks = text.split(/(?:^|\n)(?:recipe|drink)\s*[:#]/gi);
  for (const block of recipeBlocks.slice(1, 4)) {
    const blockLines = block.trim().split('\n').filter(Boolean);
    const recipeName = blockLines[0]?.replace(/^[-*]\s*/, '').trim();
    if (recipeName && recipeName.length < 80) {
      recipes.push({
        name: recipeName,
        ingredients: blockLines
          .slice(1, 6)
          .filter((l) => /^[-*•]/.test(l))
          .map((l) => l.replace(/^[-*•]\s*/, '')),
        steps: [],
      });
    }
  }

  return {
    name,
    industry: matchIndustry(joined),
    address: addressMatch?.[0],
    state: addressMatch?.[0]?.match(/,\s*([A-Z]{2})\s*\d{5}/)?.[1],
    employeeCount: employeeMatch ? Number(employeeMatch[1]) : undefined,
    mission: lines.find((l) => /mission|values|vibe/i.test(l))?.slice(0, 500),
    openingClosing: /open|close|opening|closing/i.test(joined)
      ? lines
          .filter((l) => /open|close|shift/i.test(l))
          .slice(0, 8)
          .join('\n') || undefined
      : undefined,
    cleaning: /clean|sanitize|wash/i.test(joined)
      ? lines.filter((l) => /clean|sanitize/i.test(l)).slice(0, 8).join('\n')
      : undefined,
    machineOperations: /machine|sealer|blender|equipment/i.test(joined)
      ? lines.filter((l) => /machine|sealer|blender/i.test(l)).slice(0, 8).join('\n')
      : undefined,
    drinkProduction: /drink|boba|recipe|build/i.test(joined)
      ? lines.filter((l) => /drink|build|pearls|syrup/i.test(l)).slice(0, 10).join('\n')
      : undefined,
    roles: roles.length ? roles : undefined,
    recipes: recipes.length ? recipes : undefined,
  };
}

const LANG_MAP: Record<string, LanguageCode> = {
  english: 'en',
  en: 'en',
  spanish: 'es',
  es: 'es',
  espanol: 'es',
  vietnamese: 'vi',
  vi: 'vi',
  'simplified chinese': 'zh-Hans',
  'zh-hans': 'zh-Hans',
  mandarin: 'zh-Hans',
  'traditional chinese': 'zh-Hant',
  'zh-hant': 'zh-Hant',
};

function normalizeLanguages(raw?: string[]): LanguageCode[] | undefined {
  if (!raw?.length) return undefined;
  const out = new Set<LanguageCode>();
  for (const tag of raw) {
    const key = tag.trim().toLowerCase();
    const code = LANG_MAP[key] ?? (tag as LanguageCode);
    if (code) out.add(code);
  }
  return out.size ? [...out] : undefined;
}

function filledKeys(data: ExtractedIntake): string[] {
  const keys: string[] = [];
  if (data.name?.trim()) keys.push('name');
  if (data.industry?.trim()) keys.push('industry');
  if (data.address?.trim()) keys.push('address');
  if (data.state?.trim()) keys.push('state');
  if (data.employeeCount && data.employeeCount > 0) keys.push('employeeCount');
  if (data.demographics?.trim()) keys.push('demographics');
  if (data.mission?.trim()) keys.push('mission');
  if (data.languages?.length) keys.push('languages');
  if (data.roles?.length) keys.push('roles');
  if (data.openingClosing?.trim()) keys.push('openingClosing');
  if (data.cleaning?.trim()) keys.push('cleaning');
  if (data.machineOperations?.trim()) keys.push('machineOperations');
  if (data.drinkProduction?.trim()) keys.push('drinkProduction');
  if (data.recipes?.length) keys.push('recipes');
  return keys;
}

export async function extractIntakeFromContext(
  documentText: string,
): Promise<IntakeExtractResult> {
  const text = documentText.trim();
  if (!text) {
    return { extracted: {}, filledFields: [] };
  }

  const useMocks =
    process.env.USE_MOCKS === 'true' || !process.env.ANTHROPIC_API_KEY?.trim();

  if (useMocks) {
    const extracted = mockExtractFromContext(text);
    return { extracted, filledFields: filledKeys(extracted) };
  }

  const llm = getLlm();
  const industryList = INDUSTRIES.join(' | ');
  const raw = await llm.generate({
    system: `You extract structured business onboarding data from owner documents.
Return ONLY valid JSON matching this shape (omit unknown fields):
{
  "name": string,
  "industry": one of [${industryList}],
  "address": string,
  "state": US state 2-letter code,
  "employeeCount": number,
  "demographics": string,
  "mission": string,
  "languages": string[],
  "roles": [{ "title": string, "customerFacing": boolean, "description": string }],
  "openingClosing": string,
  "cleaning": string,
  "machineOperations": string,
  "drinkProduction": string,
  "notes": string,
  "recipes": [{ "name": string, "ingredients": string[], "steps": string[] }]
}
Use multiline strings only inside JSON string values. Do not invent data not supported by the document.`,
    messages: [
      {
        role: 'user',
        content: `Extract onboarding fields from this document:\n\n${text.slice(0, 24_000)}`,
      },
    ],
    maxTokens: 2048,
  });

  const parsed = parseJsonFromLlm(raw);
  const extracted = parsed ?? mockExtractFromContext(text);
  if (extracted.languages) {
    extracted.languages = normalizeLanguages(extracted.languages) as string[];
  }
  return { extracted, filledFields: filledKeys(extracted) };
}
