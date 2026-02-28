import { NextRequest } from 'next/server';

interface RadarAddress {
  formattedAddress?: string;
  number?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

interface RadarResponse {
  addresses?: RadarAddress[];
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 3) return Response.json([]);

  const apiKey = process.env.RADAR_API_KEY;
  if (!apiKey) return Response.json([]);

  try {
    const url =
      `https://api.radar.io/v1/search/autocomplete` +
      `?query=${encodeURIComponent(q)}&country=US&layers=fine&limit=8`;

    const res = await fetch(url, {
      headers: {
        Authorization: apiKey,
        Accept: 'application/json',
      },
      next: { revalidate: 10 },
      signal: AbortSignal.timeout(6_000),
    });

    if (!res.ok) return Response.json([]);

    const json: RadarResponse = await res.json();
    const addresses = json.addresses ?? [];

    const suggestions = addresses
      .filter((a) => a.number && a.street) // must have a house number to be a real address
      .map((a) => {
        const parts: string[] = [`${a.number} ${a.street}`];
        if (a.city) parts.push(a.city);
        if (a.state) parts.push(a.state);
        return parts.join(', ');
      })
      .slice(0, 5);

    return Response.json(Array.from(new Set(suggestions)));
  } catch {
    return Response.json([]);
  }
}
