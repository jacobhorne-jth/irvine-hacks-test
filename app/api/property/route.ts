import { NextRequest, NextResponse } from 'next/server';
import { findMockProperty } from '@/data/mock-properties';
import { fetchAttomPropertyData } from '@/lib/attom';
import { fetchRedfinData } from '@/lib/apify';
import type { PropertyApiResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address || address.trim().length < 5) {
    return NextResponse.json(
      { error: 'Address query parameter is required (min 5 characters)' },
      { status: 400 }
    );
  }

  const useMock = process.env.USE_MOCK_DATA !== 'false';

  if (useMock) {
    const mockRecord = findMockProperty(address);
    return NextResponse.json({
      property: mockRecord.property,
      history: mockRecord.history,
      priceHistory: mockRecord.priceHistory,
    });
  }

  try {
    // ── Live mode ──
    // ATTOM is the primary source for ownership data (required).
    // Apify/Redfin is secondary — adds photos & listing details (optional).
    // Both run in parallel; if Apify fails/is unconfigured we still return good data.

    const [attomData, redfinData] = await Promise.all([
      fetchAttomPropertyData(address),
      fetchRedfinData(address),   // returns null if APIFY_API_TOKEN not set
    ]);

    const result: PropertyApiResponse = {
      property: attomData.property,
      history: attomData.history,
      priceHistory: attomData.priceHistory,
    };

    // Enrich with Redfin data where available
    if (redfinData) {
      // Prefer Redfin for photos and the listing URL
      if (redfinData.imageUrl) result.property.imageUrl = redfinData.imageUrl;
      if (redfinData.url) result.property.redfinUrl = redfinData.url;

      // If ATTOM price history is sparse, supplement with Redfin's
      if (result.priceHistory.length < 2 && redfinData.priceHistory?.length) {
        const redfinPoints = redfinData.priceHistory
          .filter((p) => p.price > 0)
          .map((p) => ({
            date: p.date,
            price: p.price,
            event: p.event.toLowerCase().includes('sold')
              ? ('sale' as const)
              : p.event.toLowerCase().includes('list')
              ? ('listing' as const)
              : ('estimate' as const),
          }));

        // Merge and deduplicate by date
        const merged = [...result.priceHistory, ...redfinPoints];
        const seen = new Set<string>();
        result.priceHistory = merged
          .filter((p) => {
            if (seen.has(p.date)) return false;
            seen.add(p.date);
            return true;
          })
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[/api/property]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
