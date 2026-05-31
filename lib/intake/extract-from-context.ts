// Parse owner handbook / Google Doc text into structured intake fields.
// Server-only — uses Anthropic via getLlm(). Client code should import
// types/helpers from ./extract-types instead.

import 'server-only';

import { getLlm } from '@/lib/contracts/llm';
import type { LanguageCode, Recipe } from '@/types';
import { INDUSTRIES } from '@/lib/intake/industries';
import {
  type ExtractedIntake,
  type IntakeExtractResult,
} from '@/lib/intake/extract-types';

export type { ExtractedIntake, IntakeExtractResult } from '@/lib/intake/extract-types';
export { toBusinessRoles } from '@/lib/intake/extract-types';

// Strip our own context-block delimiters ("--- file.pdf ---") and OCR noise
// ("Tab 1") so the model doesn't mistake them for a business name.
function cleanContextText(text: string): string {
  return text
    .split('\n')
    .filter((line) => {
      const t = line.trim();
      if (/^---\s.*\s---$/.test(t)) return false; // context block header
      if (/^tab\s+\d+$/i.test(t)) return false; // Google Doc tab marker
      return true;
    })
    .join('\n')
    .trim();
}

// A business name should never be a filename or a leftover delimiter.
function looksLikeFilenameOrDelimiter(value: string): boolean {
  const t = value.trim();
  return (
    t.startsWith('---') ||
    t.endsWith('---') ||
    /\.(pdf|docx?|txt|png|jpe?g)\b/i.test(t)
  );
}

function tryParse(s: string): unknown | null {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

// Best-effort repair of truncated JSON: close any open string, drop a dangling
// key/colon/comma, and append the missing closing brackets in the right order.
function repairTruncatedJson(input: string): string {
  let inStr = false;
  let esc = false;
  const stack: string[] = [];
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '{') stack.push('}');
    else if (c === '[') stack.push(']');
    else if (c === '}' || c === ']') stack.pop();
  }

  let out = input;
  if (inStr) out += '"';
  out = out.replace(/\s+$/, '');
  // A dangling key with no value: drop it (e.g. `{"a":1,"partial"` -> `{"a":1`).
  out = out.replace(/([[{,])\s*"[^"]*"$/, '$1');
  // A dangling colon: give it a null value (e.g. `"a":` -> `"a":null`).
  if (out.endsWith(':')) out += 'null';
  // Trailing comma or open-bracket boundary.
  out = out.replace(/,\s*$/, '');

  while (stack.length) out += stack.pop();
  return out;
}

// Extract a JSON object from an LLM reply that may be fenced, prose-wrapped, or
// truncated by the token limit. Returns the first parseable object or null.
function parseLlmObject(raw: string): Record<string, unknown> | null {
  let s = raw.trim();
  // Strip ```json … ``` fences.
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  const start = s.indexOf('{');
  if (start === -1) return null;
  s = s.slice(start);

  // 1) Direct parse, 2) greedy first-to-last brace, 3) truncation repair.
  const candidates = [s];
  const lastBrace = s.lastIndexOf('}');
  if (lastBrace > 0) candidates.push(s.slice(0, lastBrace + 1));
  candidates.push(repairTruncatedJson(s));

  for (const candidate of candidates) {
    const parsed = tryParse(candidate);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  }
  return null;
}

function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function asCount(v: unknown): number | undefined {
  const n =
    typeof v === 'number'
      ? v
      : typeof v === 'string'
        ? parseInt(v.replace(/[^\d]/g, ''), 10)
        : NaN;
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function asStringArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .filter(Boolean);
  return out.length ? out : undefined;
}

// Lenient field-by-field mapping so a single malformed field never discards the
// whole extraction (unlike a strict schema parse).
function coerceExtracted(obj: Record<string, unknown>): ExtractedIntake {
  const name = asString(obj.name);
  const rolesRaw = Array.isArray(obj.roles) ? obj.roles : [];
  const roles = rolesRaw
    .map((r) => {
      if (!r || typeof r !== 'object') return null;
      const rec = r as Record<string, unknown>;
      const title = asString(rec.title);
      if (!title) return null;
      return {
        title,
        customerFacing:
          typeof rec.customerFacing === 'boolean' ? rec.customerFacing : undefined,
        description: asString(rec.description),
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const recipesRaw = Array.isArray(obj.recipes) ? obj.recipes : [];
  const recipes: Recipe[] = recipesRaw
    .map((r) => {
      if (!r || typeof r !== 'object') return null;
      const rec = r as Record<string, unknown>;
      const recipeName = asString(rec.name);
      if (!recipeName) return null;
      return {
        name: recipeName,
        ingredients: asStringArray(rec.ingredients) ?? [],
        steps: asStringArray(rec.steps) ?? [],
      };
    })
    .filter((r): r is Recipe => r !== null);

  return {
    name: name && !looksLikeFilenameOrDelimiter(name) ? name : undefined,
    industry: asString(obj.industry),
    address: asString(obj.address),
    state: asString(obj.state),
    employeeCount: asCount(obj.employeeCount),
    demographics: asString(obj.demographics),
    mission: asString(obj.mission),
    languages: asStringArray(obj.languages),
    roles: roles.length ? roles : undefined,
    openingClosing: asString(obj.openingClosing),
    cleaning: asString(obj.cleaning),
    machineOperations: asString(obj.machineOperations),
    drinkProduction: asString(obj.drinkProduction),
    notes: asString(obj.notes),
    recipes: recipes.length ? recipes : undefined,
  };
}

function parseJsonFromLlm(raw: string): ExtractedIntake | null {
  const obj = parseLlmObject(raw);
  if (!obj) return null;
  return coerceExtracted(obj);
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
  const firstUsable = lines.find(
    (l) => l.length < 80 && !looksLikeFilenameOrDelimiter(l),
  );
  const name = nameLine
    ? nameLine.replace(/^[^:]+:\s*/i, '').trim()
    : firstUsable;

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
  const text = cleanContextText(documentText.trim());
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
    system: `You extract structured business onboarding data from owner documents
(employee handbooks, SOPs, recipe sheets). The document may concatenate several
files. Return ONLY valid JSON matching this shape (omit fields you cannot fill):
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
Rules:
- Fill every field the document supports. Synthesize the operations fields
  (openingClosing, cleaning, machineOperations, drinkProduction) into clear,
  readable multi-line instructions rather than copying raw fragments.
- Capture ALL roles and ALL recipes you find, not just the first one.
- NEVER use a file name, document title, or "--- ... ---" delimiter as "name".
  If the business name isn't clearly stated, omit "name".
- Use multiline strings only inside JSON string values. Do not invent data.`,
    messages: [
      {
        role: 'user',
        content: `Extract onboarding fields from this document:\n\n${text.slice(0, 40_000)}`,
      },
    ],
    maxTokens: 8_000,
  });

  const parsed = parseJsonFromLlm(raw);
  if (!parsed) {
    console.warn(
      '[intake/extract] LLM JSON parse failed; falling back to heuristic extractor.',
    );
  }
  const extracted = parsed ?? mockExtractFromContext(text);
  if (extracted.languages) {
    extracted.languages = normalizeLanguages(extracted.languages) as string[];
  }
  return { extracted, filledFields: filledKeys(extracted) };
}
