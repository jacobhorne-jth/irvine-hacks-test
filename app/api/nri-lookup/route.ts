import { NextRequest, NextResponse } from 'next/server';
import { getCountyByLatLng, getCountyByFips, searchCounties } from '@/lib/nri';

/**
 * Lightweight NRI hazard breakdown lookup.
 * No ATTOM call — reads only from the local NRI CSV.
 * Always returns latitude + longitude alongside breakdown so callers can
 * persist coordinates for the portfolio map.
 *
 * Priority:
 *  1. ?lat=&lng=  → FCC Census API → FIPS → local CSV  (fast, free)
 *  2. ?address=   → Nominatim geocode → lat/lng → same path above
 *  3. ?fips=      → direct local CSV lookup (instant, no coords)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat     = searchParams.get('lat');
  const lng     = searchParams.get('lng');
  const address = searchParams.get('address');
  const fips    = searchParams.get('fips');

  try {
    // ── 1. Direct FIPS lookup (fastest, no coords) ───────────────────────
    if (fips) {
      const result = getCountyByFips(fips);
      if (result) {
        return NextResponse.json({
          breakdown:       result.breakdown,
          dominant_hazard: result.dominant_hazard,
          buildValue:      result.buildValue,
        });
      }
    }

    // ── 2. Lat/lng → FCC Census Block API → FIPS → CSV ──────────────────
    if (lat && lng) {
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);
      const result = await getCountyByLatLng(parsedLat, parsedLng);
      if (result) {
        return NextResponse.json({
          breakdown:       result.breakdown,
          dominant_hazard: result.dominant_hazard,
          buildValue:      result.buildValue,
          latitude:        parsedLat,
          longitude:       parsedLng,
        });
      }
    }

    // ── 3. Address → Nominatim geocode → lat/lng ─────────────────────────
    if (address) {
      const geoUrl =
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=us`;
      const geoRes = await fetch(geoUrl, {
        headers: { 'User-Agent': 'prop-intel/1.0 (portfolio-enrichment)' },
        signal: AbortSignal.timeout(6_000),
      });

      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (Array.isArray(geoData) && geoData.length > 0) {
          const gLat = parseFloat(geoData[0].lat);
          const gLon = parseFloat(geoData[0].lon);
          const result = await getCountyByLatLng(gLat, gLon);
          if (result) {
            return NextResponse.json({
              breakdown:       result.breakdown,
              dominant_hazard: result.dominant_hazard,
              buildValue:      result.buildValue,
              latitude:        gLat,
              longitude:       gLon,
            });
          }
        }
      }

      // ── 4. Last resort: substring county search from address tokens ─────
      const stateMatch = address.match(/,\s*([A-Z]{2})\s*(?:\d{5})?$/);
      const stateAbbr  = stateMatch?.[1] ?? undefined;
      const parts      = address.split(',').map((s) => s.trim()).filter(Boolean);
      for (let i = parts.length - 2; i >= 0; i--) {
        const candidates = searchCounties(parts[i], stateAbbr);
        if (candidates.length > 0) {
          return NextResponse.json({
            breakdown:       candidates[0].breakdown,
            dominant_hazard: candidates[0].dominant_hazard,
            buildValue:      candidates[0].buildValue,
            // No coords available in this path
          });
        }
      }
    }

    return NextResponse.json({ error: 'Could not resolve NRI data' }, { status: 404 });
  } catch (err) {
    console.error('[/api/nri-lookup]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
