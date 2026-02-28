/**
 * Apify Redfin Scraper Integration
 * Actor: rigelbytes/redfin-scraper
 *
 * Flow:
 *  1. Use Redfin's search autocomplete to resolve address → property URL (no key needed)
 *  2. Pass that URL to the Apify actor as a startUrl
 *  3. Parse the scraped output for photos, listing details, and price history
 *
 * Requires: APIFY_API_TOKEN in .env.local
 * If token is missing, this module returns null and ATTOM fills the gap.
 */

export interface RedfinScrapedProperty {
  url?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  lotSize?: number | null;
  yearBuilt?: number | null;
  price?: number | null;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  propertyType?: string;
  priceHistory?: Array<{
    date: string;
    price: number;
    event: string;
  }>;
}

/**
 * Step 1 — Resolve a plain-text address to a Redfin property URL.
 * Uses Redfin's public autocomplete endpoint — no API key required.
 */
export async function resolveRedfinUrl(address: string): Promise<string | null> {
  const encoded = encodeURIComponent(address);
  const url = `https://www.redfin.com/stingray/do/location-autocomplete?location=${encoded}&count=5&v=2`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        Accept: 'application/json',
      },
      // 10 second timeout
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) return null;

    // Redfin prefixes its JSON with "{}&&" as XSS protection — strip it
    const raw = await res.text();
    const jsonStr = raw.replace(/^\{\}&&/, '');
    const json = JSON.parse(jsonStr);

    const sections: Array<{
      rows?: Array<{ url?: string; type?: string; subType?: string }>;
    }> = json?.payload?.sections ?? [];

    // First pass: prefer exact property-level rows (/home/)
    for (const section of sections) {
      for (const row of section.rows ?? []) {
        if (row.url?.includes('/home/')) {
          return `https://www.redfin.com${row.url}`;
        }
      }
    }

    // Second pass: any non-area result (not city/zip/neighborhood/school)
    for (const section of sections) {
      for (const row of section.rows ?? []) {
        const u = row.url ?? '';
        if (u && !u.includes('/city/') && !u.includes('/zipcode/') && !u.includes('/neighborhood/') && !u.includes('/school/')) {
          return `https://www.redfin.com${u}`;
        }
      }
    }

    return null;
  } catch (err) {
    console.warn('[Apify] Redfin autocomplete failed:', err);
    return null;
  }
}

/**
 * Step 2 — Run the Apify actor with the resolved Redfin property URL.
 */
async function runApifyRedfinScraper(
  redfinUrl: string
): Promise<RedfinScrapedProperty | null> {
  const token = process.env.APIFY_API_TOKEN!;
  // rigelbytes/redfin-scraper → API uses ~ separator
  const actorId = (process.env.APIFY_ACTOR_ID ?? 'rigelbytes/redfin-scraper').replace('/', '~');

  // run-sync-get-dataset-items: runs the actor and streams back the dataset
  const endpoint = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${token}&timeout=60&memory=256`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startUrls: [{ url: redfinUrl }],
      proxyConfiguration: { useApifyProxy: true },
    }),
    signal: AbortSignal.timeout(70_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apify ${res.status}: ${text.slice(0, 300)}`);
  }

  const items: RedfinScrapedProperty[] = await res.json();
  return items?.[0] ?? null;
}

/**
 * Public API — full pipeline: address → Redfin URL → Apify scrape
 * Returns null (gracefully) if APIFY_API_TOKEN is not set.
 */
export async function fetchRedfinData(
  address: string
): Promise<RedfinScrapedProperty | null> {
  const token = process.env.APIFY_API_TOKEN;
  if (!token || token.startsWith('placeholder')) return null;

  try {
    const redfinUrl = await resolveRedfinUrl(address);
    if (!redfinUrl) {
      console.warn('[Apify] Could not resolve Redfin URL for:', address);
      return null;
    }

    console.log('[Apify] Scraping:', redfinUrl);
    return await runApifyRedfinScraper(redfinUrl);
  } catch (err) {
    console.error('[Apify] Failed:', err);
    return null;
  }
}
