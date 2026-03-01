import { NextRequest, NextResponse } from 'next/server';
import {
  getCountyByFips,
  searchCounties,
  getCountyByLatLng,
} from '@/lib/nri';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Option 1: direct FIPS lookup
  const fips = searchParams.get('fips');
  if (fips) {
    const result = getCountyByFips(fips.padStart(5, '0'));
    if (!result) {
      return NextResponse.json({ error: `No county found for FIPS: ${fips}` }, { status: 404 });
    }
    return NextResponse.json(result);
  }

  // Option 2: lat/lng reverse-geocode → FIPS
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  if (lat && lng) {
    const result = await getCountyByLatLng(parseFloat(lat), parseFloat(lng));
    if (!result) {
      return NextResponse.json(
        { error: 'Could not resolve county for these coordinates' },
        { status: 404 }
      );
    }
    return NextResponse.json(result);
  }

  // Option 3: county name + state abbreviation search
  const county = searchParams.get('county');
  const state = searchParams.get('state') ?? undefined;
  if (county) {
    const results = searchCounties(county, state);
    return NextResponse.json({ results });
  }

  return NextResponse.json(
    { error: 'Provide ?fips=, ?lat=&lng=, or ?county= query parameters' },
    { status: 400 }
  );
}
