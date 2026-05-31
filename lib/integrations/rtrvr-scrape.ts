// Shared RTRVR.ai POST /scrape helper — used by research and equipment catalog.

const DEFAULT_BASE = 'https://api.rtrvr.ai';
const SCRAPE_TIMEOUT_MS = 120_000;
const MAX_INLINE_BYTES = 5_000_000;
const SCRAPE_RETRIES = 3;
const RETRY_BASE_MS = 500;

type ScrapeTarget = 'auto' | 'cloud' | 'extension';

function scrapeTarget(): ScrapeTarget {
  const raw = process.env.RTRVR_SCRAPE_TARGET?.trim().toLowerCase();
  if (raw === 'cloud' || raw === 'extension' || raw === 'auto') return raw;
  // Default cloud: server-side Trainr calls must not depend on a local Chrome extension.
  return 'cloud';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableRtrvrError(message: string, status?: number): boolean {
  if (status && [408, 429, 500, 502, 503, 504].includes(status)) return true;
  return /native bridge|SCRAPE_ERROR|rate.?limit|timeout|ECONNRESET/i.test(message);
}

function shortRtrvrError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const bridge = msg.match(/"error":"([^"]+)"/);
  if (bridge?.[1]) return bridge[1];
  if (msg.length > 180) return `${msg.slice(0, 177)}…`;
  return msg;
}

export type RtrvrScrapedTab = {
  url?: string;
  title?: string;
  text?: string;
  tree?: string;
  elementLinkRecord?: Record<string, string>;
};

interface ScrapeResponse {
  status?: 'success' | 'error';
  tabs?: RtrvrScrapedTab[];
  metadata?: { outputTooLarge?: boolean; responseRef?: unknown };
  error?: string;
}

/** True when RTRVR should run (key present, mocks off). */
export function rtrvrEnabled(): boolean {
  return process.env.USE_MOCKS !== 'true' && Boolean(process.env.RTRVR_API_KEY?.trim());
}

/** Scrape a single URL via RTRVR. Returns null on failure (caller decides fallback). */
export async function rtrvrScrapeUrl(url: string): Promise<RtrvrScrapedTab | null> {
  const base = process.env.RTRVR_BASE_URL || DEFAULT_BASE;
  const target = scrapeTarget();
  let lastErr: unknown;

  for (let attempt = 1; attempt <= SCRAPE_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);

    try {
      const res = await fetch(`${base}/scrape`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RTRVR_API_KEY ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          urls: [url],
          target,
          settings: { extractionConfig: { onlyTextContent: false } },
          response: { inlineOutputMaxBytes: MAX_INLINE_BYTES },
        }),
        signal: controller.signal,
      });
      const bodyText = await res.text();
      if (!res.ok) {
        throw Object.assign(new Error(`RTRVR /scrape ${res.status}: ${bodyText}`), {
          status: res.status,
        });
      }
      const data = JSON.parse(bodyText) as ScrapeResponse & { success?: boolean; error?: string };
      if (data.success === false || data.status === 'error') {
        throw new Error(`RTRVR error: ${data.error ?? 'unknown'}`);
      }
      let tab = data.tabs?.[0];
      if (!tab && data.metadata?.responseRef) {
        tab = { url, text: '' };
      }
      if (!tab) throw new Error(`RTRVR returned no tab for ${url}`);
      return tab;
    } catch (err) {
      lastErr = err;
      const status = (err as { status?: number }).status;
      const message = shortRtrvrError(err);
      const retry = attempt < SCRAPE_RETRIES && isRetryableRtrvrError(message, status);
      if (retry) {
        console.warn(
          `[rtrvr] scrape attempt ${attempt}/${SCRAPE_RETRIES} failed for ${url} (${message}); retrying…`,
        );
        await sleep(RETRY_BASE_MS * 2 ** (attempt - 1));
        continue;
      }
      console.warn(`[rtrvr] scrape failed for ${url} (target=${target}): ${message}`);
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  console.warn(`[rtrvr] scrape failed for ${url}: ${shortRtrvrError(lastErr)}`);
  return null;
}

/** Pick the best product-preview image URL from an RTRVR-scraped tab.
 *
 * Search order (first hit wins):
 *  1. elementLinkRecord value where the KEY looks like an og:image meta selector
 *  2. Any elementLinkRecord value that is an absolute URL ending in an image ext
 *  3. Any absolute image URL buried in the serialised tree / text blob
 */
export function pickPreviewImage(tab: RtrvrScrapedTab): string | undefined {
  const links = tab.elementLinkRecord ?? {};

  // 1. OG / twitter card meta — RTRVR records these with keys like
  //    'meta[property="og:image"]' or 'meta[name="twitter:image"]'
  for (const [key, href] of Object.entries(links)) {
    if (/og:image|twitter:image/i.test(key) && href?.startsWith('http')) return href;
  }

  // 2. Any link value that is a direct image file URL
  for (const href of Object.values(links)) {
    if (href && /\.(png|jpe?g|webp)(\?|$)/i.test(href)) return href;
  }

  // 3. Scan tree / text for the first absolute https image URL
  const blob = (tab.tree ?? '') + (tab.text ?? '');
  const m = blob.match(/https?:\/\/[^\s"'<>]+\.(?:png|jpe?g|webp)(?:\?[^\s"'<>]*)?/i);
  if (m) return m[0];

  return undefined;
}
