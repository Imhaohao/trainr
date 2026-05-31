// RTRVR.ai research adapter — implements ResearchProvider (T2).
//
// RTRVR is a cloud browser-automation / scraping service. We use its `POST
// /scrape` endpoint (https://api.rtrvr.ai/scrape): given URLs, it opens them in
// a browser cluster and returns extracted text + a structured accessibility
// ("DOM") tree + a link map per tab. We:
//   1. Resolve each research query to an authoritative seed URL + category.
//   2. Scrape it via RTRVR.
//   3. Store the structured payload to Tigris at `${businessId}/research/<id>.json`.
//   4. Condense a short summary via Claude (cacheable).
//   5. Persist a ResearchArtifact via getDb().research.create.
//
// The whole RTRVR shape is contained in this file behind ResearchProvider, so
// if their API changes only this adapter moves. Falls back to mock-research
// when RTRVR_API_KEY is missing or USE_MOCKS==='true'.

import { nanoid } from 'nanoid';
import type { ResearchProvider, ResearchQuery } from '../contracts/research';
import type { Business, ResearchArtifact, ResearchCategory } from '../../types/index';
import { getDb } from '../contracts/db';
import { getLlm } from '../contracts/llm';
import { getStorage, tigrisKeys } from './tigris';
import { mockResearch } from '../mocks/mock-research';

const DEFAULT_BASE = 'https://api.rtrvr.ai';
const SCRAPE_TIMEOUT_MS = 120_000;
const MAX_INLINE_BYTES = 5_000_000; // ask for inline payload up to 5MB (trees are big)
const SUMMARY_INPUT_CHARS = 6_000;

// ---------------------------------------------------------------------------
// RTRVR /scrape wire types (only the fields we read).
// ---------------------------------------------------------------------------
interface ScrapedTab {
  url?: string;
  title?: string;
  text?: string;
  tree?: string; // JSON-encoded accessibility/DOM tree
  elementLinkRecord?: Record<string, string>;
}
interface ScrapeResponse {
  status?: 'success' | 'error';
  tabs?: ScrapedTab[];
  metadata?: { outputTooLarge?: boolean; responseRef?: unknown };
  error?: string;
}

// ---------------------------------------------------------------------------
// Query → target resolution. Each research query maps to an authoritative seed
// URL + a category, parameterized by state where it matters (labor/harassment).
// ---------------------------------------------------------------------------
interface ResearchTarget {
  query: string;
  url: string;
  category: ResearchCategory;
  title: string;
}

const STATE_LABOR_URL: Record<string, string> = {
  CA: 'https://www.dir.ca.gov/dlse/',
  NY: 'https://dol.ny.gov/labor-standards-0',
  TX: 'https://www.twc.texas.gov/programs/wage-hour',
  WA: 'https://www.lni.wa.gov/workers-rights/',
};
const STATE_HARASSMENT_URL: Record<string, string> = {
  CA: 'https://calcivilrights.ca.gov/shpt/',
  NY: 'https://www.ny.gov/programs/combating-sexual-harassment-workplace',
};

function searchUrl(query: string): string {
  // DuckDuckGo's HTML endpoint is scrapeable and returns a usable link map.
  return `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
}

/** Prefix queries with `url:` to scrape a URL directly (business site, etc.). */
export function directScrapeQuery(url: string): string {
  return `url:${url}`;
}

function resolveTarget(query: string, state: string): ResearchTarget {
  if (query.startsWith('url:')) {
    const url = query.slice(4).trim();
    const host = (() => {
      try {
        return new URL(url).hostname.replace(/^www\./, '');
      } catch {
        return url;
      }
    })();
    return {
      query,
      url,
      category: 'industry_standard',
      title: `Business source: ${host}`,
    };
  }

  const q = query.toLowerCase();
  const st = (state || '').toUpperCase();
  const mk = (url: string, category: ResearchCategory, title: string) => ({
    query,
    url,
    category,
    title,
  });

  if (/starbucks|competitor|chain onboarding|barista.*(onboard|train)/.test(q))
    return mk(
      'https://www.starbucks.com/careers/working-at-starbucks/',
      'competitor',
      'Starbucks barista onboarding & training structure',
    );
  if (/servsafe|food.?handler|food safety cert/.test(q))
    return mk(
      'https://www.servsafe.com/ServSafe-Food-Handler',
      'compliance',
      'ServSafe / food handler certification',
    );
  if (/\bosha\b|occupational safety/.test(q))
    return mk(
      'https://www.osha.gov/restaurant-industry',
      'compliance',
      'OSHA restaurant & food-service safety',
    );
  if (/\bada\b|disabilit|accessib/.test(q))
    return mk(
      'https://www.ada.gov/resources/title-iii-primer/',
      'compliance',
      'ADA Title III — accessible service',
    );
  if (/harassment|sb.?1343|sexual harassment/.test(q))
    return mk(
      STATE_HARASSMENT_URL[st] ?? 'https://www.eeoc.gov/harassment',
      'compliance',
      `Workplace harassment prevention${st ? ` (${st})` : ''}`,
    );
  if (/labor|wage|\bbreak|meal|rest period|employment law|onboarding requirement/.test(q))
    return mk(
      STATE_LABOR_URL[st] ?? 'https://www.dol.gov/general/topic/wages',
      'compliance',
      `${st || 'US'} labor & onboarding requirements`,
    );
  if (/youtube|transcript|tutorial|video/.test(q))
    return mk(searchUrl(`${query} site:youtube.com`), 'industry_standard', query);
  if (/recipe|ratio|drink.?(prep|build)|standardi[sz]ed/.test(q))
    return mk(searchUrl(query), 'industry_standard', 'Standardized drink-prep / recipe ratios');
  if (/association|national restaurant/.test(q))
    return mk('https://restaurant.org/education-and-resources/', 'industry_standard', 'Industry-association materials');

  // Default: treat as an industry-standard web search.
  return mk(searchUrl(query), 'industry_standard', query);
}

/**
 * Curated research query set for a business, parameterized by industry + state.
 * The orchestrator can use this to populate ResearchQuery.queries; research()
 * also falls back to it when no queries are supplied.
 */
export function buildResearchQueries(industry: string, state: string): string[] {
  const st = state || 'your state';
  return [
    `${industry} barista onboarding and training structure (Starbucks model)`,
    'ServSafe food handler certification requirements',
    `${st} labor laws, meal and rest breaks, and onboarding requirements`,
    `${industry} drink-prep tutorials and barista technique (YouTube transcripts)`,
    'standardized drink-prep and recipe ratio sources',
    `OSHA, ADA, and workplace harassment prevention requirements for ${st}`,
  ];
}

/**
 * Business-specific research: scrape the owner's site, local listing signals,
 * and nearby competitors — then layer compliance/industry defaults on top.
 */
export function buildBusinessResearchQueries(business: Business): string[] {
  const queries: string[] = [];
  const { name, industry, state, address, website, mission } = business;
  const locationHint = [name, address, state].filter(Boolean).join(' ');

  if (website?.trim()) {
    const url = website.trim().match(/^https?:\/\//i)
      ? website.trim()
      : `https://${website.trim()}`;
    queries.push(directScrapeQuery(url));
  }

  if (name && address) {
    queries.push(
      `${name} ${address} menu services hours`,
      `${name} ${state} reviews what to order`,
      `similar ${industry.replace(/_/g, ' ')} businesses near ${address} competitor training`,
      `${industry.replace(/_/g, ' ')} employee onboarding best practices ${state}`,
    );
  } else if (name) {
    queries.push(
      `${name} ${industry.replace(/_/g, ' ')} business overview`,
      `competitors to ${name} ${state} ${industry.replace(/_/g, ' ')}`,
    );
  }

  if (mission?.trim()) {
    queries.push(`${name} ${mission.slice(0, 80)} company culture values`);
  }

  if (locationHint) {
    queries.push(`${locationHint} yelp google maps listing`);
  }

  // Compliance + industry benchmarks (deduped below).
  return [...queries, ...buildResearchQueries(industry, state)];
}

function dedupeQueries(queries: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const q of queries) {
    const key = q.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(q);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Scrape + persist a single target.
// ---------------------------------------------------------------------------
async function scrapeTarget(
  target: ResearchTarget,
  businessId: string,
): Promise<ResearchArtifact | null> {
  const base = process.env.RTRVR_BASE_URL || DEFAULT_BASE;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);

  let tab: ScrapedTab | undefined;
  try {
    const res = await fetch(`${base}/scrape`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RTRVR_API_KEY ?? ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        urls: [target.url],
        settings: { extractionConfig: { onlyTextContent: false } },
        response: { inlineOutputMaxBytes: MAX_INLINE_BYTES },
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`RTRVR /scrape ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as ScrapeResponse;
    if (data.status === 'error') throw new Error(`RTRVR error: ${data.error}`);
    tab = data.tabs?.[0];
    if (!tab && data.metadata?.responseRef) {
      // Payload exceeded the inline cap; we keep what metadata we have rather
      // than fail the whole run. (Fetching the storage ref is a future upgrade.)
      tab = { url: target.url, text: '' };
    }
    if (!tab) throw new Error('RTRVR returned no tab for ' + target.url);
  } catch (err) {
    console.error(`[rtrvr] scrape failed for ${target.url}:`, err);
    return null;
  } finally {
    clearTimeout(timer);
  }

  const id = `res_${nanoid(10)}`;
  const structuredKey = tigrisKeys.research(businessId, id);
  const payload = {
    query: target.query,
    url: target.url,
    category: target.category,
    scrapedAt: new Date().toISOString(),
    tab,
  };

  try {
    await getStorage().putObject(
      structuredKey,
      JSON.stringify(payload),
      'application/json',
    );
  } catch (err) {
    console.error(`[rtrvr] storage put failed for ${structuredKey}:`, err);
  }

  const summary = await condense(tab.text ?? '', target);

  const artifact: ResearchArtifact = {
    id,
    businessId,
    category: target.category,
    source: tab.url ?? target.url,
    title: tab.title?.trim() || target.title,
    summary,
    structuredKey,
    createdAt: new Date().toISOString(),
  };

  try {
    await getDb().research.create(artifact);
  } catch (err) {
    console.error(`[rtrvr] db create failed for ${id}:`, err);
  }
  return artifact;
}

// Quick Claude condense of scraped text. System prompt is stable → cacheable.
const CONDENSE_SYSTEM =
  'You condense scraped web pages into a 2-3 sentence summary of the facts ' +
  'relevant to building an employee training program for a small business. ' +
  'Be concrete and neutral. Output plain text only, no preamble.';

async function condense(text: string, target: ResearchTarget): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) {
    return `Reference for "${target.query}" (${target.category}). Source: ${target.url}.`;
  }
  try {
    return (
      await getLlm().generate({
        system: CONDENSE_SYSTEM,
        cache: true,
        maxTokens: 300,
        messages: [
          {
            role: 'user',
            content: `Topic: ${target.query}\nSource: ${target.url}\n\nPage content:\n${trimmed.slice(0, SUMMARY_INPUT_CHARS)}`,
          },
        ],
      })
    ).trim();
  } catch (err) {
    console.error('[rtrvr] condense failed:', err);
    return `Reference for "${target.query}" (${target.category}). Source: ${target.url}.`;
  }
}

// ---------------------------------------------------------------------------
// Provider + factory.
// ---------------------------------------------------------------------------
async function research(input: ResearchQuery): Promise<ResearchArtifact[]> {
  const queries = dedupeQueries(
    input.queries.length > 0
      ? input.queries
      : buildResearchQueries(input.industry, input.state),
  );
  const targets = queries.map((q) => resolveTarget(q, input.state));

  // RTRVR runs parallel browser sessions; fire targets concurrently and keep
  // whatever succeeds (one bad URL must not sink the whole research run).
  const settled = await Promise.all(
    targets.map((t) => scrapeTarget(t, input.businessId)),
  );
  const artifacts = settled.filter((a): a is ResearchArtifact => a !== null);

  // RTRVR is rate-limited and occasionally returns empty/error tabs. If every
  // target failed, the curriculum stage would have zero external grounding —
  // fall back to the curated mock research so the pipeline still produces a
  // grounded program. Real RTRVR results are always preferred when present.
  if (artifacts.length === 0) {
    console.warn(
      '[rtrvr] all scrapes returned no artifacts — falling back to mock research',
    );
    return mockResearch.research(input);
  }
  return artifacts;
}

export const rtrvrResearch: ResearchProvider = { research };

/**
 * Resolve the active ResearchProvider: real RTRVR when a key is present and
 * mocks aren't forced, otherwise the in-memory mock. Single source of truth;
 * `lib/contracts/research.ts#getResearch` delegates here.
 */
export function getResearch(): ResearchProvider {
  const useMocks =
    process.env.USE_MOCKS === 'true' || !process.env.RTRVR_API_KEY;
  return useMocks ? mockResearch : rtrvrResearch;
}
