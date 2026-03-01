import { NextRequest, NextResponse } from 'next/server';
import { findMockProperty } from '@/data/mock-properties';
import { fetchAttomPropertyData } from '@/lib/attom';
import { fetchRedfinData } from '@/lib/apify';
import { extractCountyFromAddress, generateHazardExplanations } from '@/lib/openai';
import { searchCounties, getCountyByLatLng } from '@/lib/nri';
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

  // Defaults to mock mode — set USE_MOCK_DATA=false in .env.local to use live ATTOM data
  const useMock = process.env.USE_MOCK_DATA !== 'false';

  if (useMock) {
    const mockRecord = findMockProperty(address);
    // Resolve NRI county risk for mock properties too
    const nriRisk = await resolveNriRisk(
      mockRecord.property.address.fullAddress,
      mockRecord.property.latitude,
      mockRecord.property.longitude
    );
    return NextResponse.json({
      property: mockRecord.property,
      history: mockRecord.history,
      priceHistory: mockRecord.priceHistory,
      ...(nriRisk ? { nriRisk } : {}),
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

    // If zestimate is still 0 (ATTOM didn't return a saleAmt for the latest transfer),
    // fall back to the most recent price visible on the chart.
    if (result.property.zestimate === 0 && result.priceHistory.length > 0) {
      result.property.zestimate = result.priceHistory[result.priceHistory.length - 1].price;
    }

    // Resolve NRI county disaster risk (non-critical — skip on error)
    const nriRisk = await resolveNriRisk(
      address,
      result.property.latitude,
      result.property.longitude
    );
    if (nriRisk) (result as unknown as Record<string, unknown>).nriRisk = nriRisk;

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[/api/property]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Resolve NRI county disaster score for a property.
 * 1. FCC Census API using lat/lng — always accurate, no API key needed.
 * 2. Fall back to GPT county name extraction if FCC fails.
 */
async function resolveNriRisk(address: string, lat: number, lng: number) {
  try {
    // Primary: FCC Census Block API — deterministic, uses exact coordinates
    const fccResult = await getCountyByLatLng(lat, lng);
    if (fccResult) {
      console.log(`[NRI] FCC resolved lat=${lat},lng=${lng} → ${fccResult.county}, ${fccResult.stateAbbr} (FIPS ${fccResult.fips})`);
      const hazardExplanations = await generateHazardExplanations(fccResult.county, fccResult.stateAbbr, fccResult.breakdown);
      return { ...fccResult, hazardExplanations };
    }

    // Fallback: GPT extracts county name from address string (requires OPENAI_API_KEY)
    const gptCounty = await extractCountyFromAddress(address);
    if (gptCounty) {
      const results = searchCounties(gptCounty.county, gptCounty.stateAbbr);
      if (results.length > 0) {
        console.log(`[NRI] GPT resolved "${address}" → ${gptCounty.county}, ${gptCounty.stateAbbr} (FIPS ${results[0].fips})`);
        const hazardExplanations = await generateHazardExplanations(results[0].county, results[0].stateAbbr, results[0].breakdown);
        return { ...results[0], hazardExplanations };
      }
    }

    return null;
  } catch {
    return null;
  }
}
