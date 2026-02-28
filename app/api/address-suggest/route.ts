import { NextRequest } from 'next/server';

// Redfin autocomplete row shape
interface RedfinRow {
  url?: string;
  name?: string;
  subName?: string;
}

interface RedfinSection {
  rows?: RedfinRow[];
}

interface RedfinResponse {
  payload?: {
    sections?: RedfinSection[];
  };
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 3) return Response.json([]);

  try {
    const url =
      `https://www.redfin.com/stingray/do/location-autocomplete` +
      `?location=${encodeURIComponent(q)}&count=10&v=2&al=1&ooa=true`;

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        Accept: 'application/json',
      },
      next: { revalidate: 10 },
      signal: AbortSignal.timeout(6_000),
    });

    if (!res.ok) return Response.json([]);

    // Redfin prefixes its JSON with "{}&&" as XSS protection — strip it
    const raw = await res.text();
    const json: RedfinResponse = JSON.parse(raw.replace(/^\{\}&&/, ''));

    const sections = json?.payload?.sections ?? [];
    const suggestions: string[] = [];

    for (const section of sections) {
      for (const row of section.rows ?? []) {
        const u = row.url ?? '';

        // Skip non-property rows (cities, zipcodes, neighborhoods, schools, etc.)
        if (
          !u ||
          u.includes('/city/') ||
          u.includes('/zipcode/') ||
          u.includes('/neighborhood/') ||
          u.includes('/school/') ||
          u.includes('/county/')
        ) {
          continue;
        }

        if (!row.name) continue;

        // Combine street name + city/state subName into a single address string
        const label = row.subName ? `${row.name}, ${row.subName}` : row.name;
        suggestions.push(label);

        if (suggestions.length >= 5) break;
      }
      if (suggestions.length >= 5) break;
    }

    return Response.json([...new Set(suggestions)]);
  } catch {
    return Response.json([]);
  }
}
