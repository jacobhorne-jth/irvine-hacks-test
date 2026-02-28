import { NextRequest } from 'next/server';

interface GooglePrediction {
  description: string;
}

interface GoogleResponse {
  predictions?: GooglePrediction[];
  status?: string;
  error_message?: string;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 3) return Response.json([]);

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return Response.json([]);

  try {
    const url =
      `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
      `?input=${encodeURIComponent(q)}&types=address&components=country:us&language=en&key=${apiKey}`;

    const res = await fetch(url, {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(6_000),
    });

    if (!res.ok) return Response.json([]);

    const json: GoogleResponse = await res.json();

    if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
      console.error('[address-suggest] status:', json.status, json.error_message ?? '');
      return Response.json([]);
    }

    const suggestions = (json.predictions ?? [])
      .map((p) => p.description.replace(/, USA$/, ''))
      .slice(0, 5);

    return Response.json(suggestions);
  } catch (e) {
    console.error('[address-suggest] fetch error:', e);
    return Response.json([]);
  }
}
