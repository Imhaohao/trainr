// Lightweight server-side proxy that returns the og:image for a product URL.
// Used by ModuleEquipmentShowcase when an asset has no stored previewImageUrl
// (e.g. fixture assets or RTRVR-catalogued items without an uploaded GLB).
//
// GET /api/og-image?url=<encoded-product-url>
//   → 302 redirect to the og:image found on that page
//   → 404 if no og:image meta tag is found
//   → 400 if `url` param is missing or not http(s)
//
// The Next.js data-cache caches the upstream fetch for 24 h so repeated
// renders don't hammer Daz 3D / CGTrader.

import { type NextRequest, NextResponse } from 'next/server';

const OG_PATTERNS = [
  /<meta\s+property="og:image"\s+content="([^"]+)"/i,
  /<meta\s+content="([^"]+)"\s+property="og:image"/i,
  /<meta\s+property="og:image:secure_url"\s+content="([^"]+)"/i,
  /<meta\s+content="([^"]+)"\s+property="og:image:secure_url"/i,
  /<meta\s+name="twitter:image"\s+content="([^"]+)"/i,
  /<meta\s+content="([^"]+)"\s+name="twitter:image"/i,
];

function extractOgImage(html: string): string | undefined {
  for (const re of OG_PATTERNS) {
    const m = html.match(re);
    if (m?.[1]) return m[1];
  }
  return undefined;
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('url') ?? '';
  if (!raw || !/^https?:\/\//i.test(raw)) {
    return NextResponse.json({ error: 'missing or invalid url' }, { status: 400 });
  }

  try {
    const res = await fetch(raw, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; Trainrbot/1.0; +https://trainr.app)',
        Accept: 'text/html,application/xhtml+xml',
      },
      // Cache at the Next.js data layer for 24 h; no credentials leak.
      next: { revalidate: 86_400 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `upstream ${res.status}` }, { status: 404 });
    }

    // Only read the first 64 KB — enough for <head> where og:image lives.
    const reader = res.body?.getReader();
    if (!reader) return NextResponse.json({ error: 'no body' }, { status: 502 });

    let html = '';
    let bytes = 0;
    while (bytes < 65_536) {
      const { done, value } = await reader.read();
      if (done) break;
      html += new TextDecoder().decode(value);
      bytes += value.byteLength;
      if (html.includes('</head>')) break;
    }
    reader.cancel().catch(() => null);

    const imageUrl = extractOgImage(html);
    if (!imageUrl) {
      return NextResponse.json({ error: 'no og:image found' }, { status: 404 });
    }

    return NextResponse.redirect(imageUrl, { status: 302 });
  } catch (err) {
    console.error('[og-image] fetch failed for', raw, err);
    return NextResponse.json({ error: 'fetch failed' }, { status: 502 });
  }
}
