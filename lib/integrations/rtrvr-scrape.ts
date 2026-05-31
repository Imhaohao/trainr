// Shared RTRVR.ai POST /scrape helper — used by research and equipment catalog.

const DEFAULT_BASE = 'https://api.rtrvr.ai';
const SCRAPE_TIMEOUT_MS = 120_000;
const MAX_INLINE_BYTES = 5_000_000;

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
        settings: { extractionConfig: { onlyTextContent: false } },
        response: { inlineOutputMaxBytes: MAX_INLINE_BYTES },
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`RTRVR /scrape ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as ScrapeResponse;
    if (data.status === 'error') throw new Error(`RTRVR error: ${data.error}`);
    let tab = data.tabs?.[0];
    if (!tab && data.metadata?.responseRef) {
      tab = { url, text: '' };
    }
    if (!tab) throw new Error(`RTRVR returned no tab for ${url}`);
    return tab;
  } catch (err) {
    console.error(`[rtrvr] scrape failed for ${url}:`, err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Pick the first image URL from RTRVR link map (product previews). */
export function pickPreviewImage(tab: RtrvrScrapedTab): string | undefined {
  const links = tab.elementLinkRecord ?? {};
  for (const href of Object.values(links)) {
    if (/\.(png|jpe?g|webp)(\?|$)/i.test(href)) return href;
  }
  return undefined;
}
