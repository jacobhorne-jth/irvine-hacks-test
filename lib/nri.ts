/**
 * FEMA National Risk Index (NRI) — County-level disaster scoring
 * Dataset: NRI_Table_Counties.csv (FEMA, 2023 release)
 *
 * Model weights and scalers trained on county-level EAL building data.
 * Scoring: normalize each hazard's expected annual loss → weight → sum → 0–100 scale.
 */

import fs from 'fs';
import path from 'path';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type HazardKey =
  | 'Inland_Flood'
  | 'Hurricane'
  | 'Earthquake'
  | 'Tornado'
  | 'Wildfire'
  | 'Hail'
  | 'Strong_Wind'
  | 'Coastal_Flood';

export interface HazardBreakdown {
  eal_building_M: number;   // expected annual building loss, $millions
  contribution: number;     // weighted contribution to overall score (0–100 scale)
}

export interface CountyDisasterScore {
  fips: string;
  state: string;
  stateAbbr: string;
  county: string;
  overall_score: number;    // 0–100
  tier: string;             // 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High'
  color: string;            // hex colour for the tier
  dominant_hazard: HazardKey;
  breakdown: Record<HazardKey, HazardBreakdown>;
  buildValue: number;       // total county building value, raw dollars
}

// ─────────────────────────────────────────────────────────────
// Model parameters (from training run on NRI county data)
// ─────────────────────────────────────────────────────────────

const WEIGHTS: Record<HazardKey, number> = {
  Inland_Flood:  0.0932,
  Hurricane:     0.2055,
  Earthquake:    0.2129,
  Tornado:       0.1754,
  Wildfire:      0.1190,
  Hail:          0.0668,
  Strong_Wind:   0.0848,
  Coastal_Flood: 0.0423,
};

const SCALERS: Record<HazardKey, { min: number; max: number }> = {
  Inland_Flood:  { min: 0, max: 3.499446 },
  Hurricane:     { min: 0, max: 20.306954 },
  Earthquake:    { min: 0, max: 5.87938 },
  Tornado:       { min: 0, max: 4.966885 },
  Wildfire:      { min: 0, max: 3.383423 },
  Hail:          { min: 0, max: 1.534185 },
  Strong_Wind:   { min: 0, max: 1.398129 },
  Coastal_Flood: { min: 0, max: 0.419592 },
};

// NRI CSV column name → hazard key
const NRI_COLUMN_MAP: Record<string, HazardKey> = {
  RFLD_EALB: 'Inland_Flood',
  HRCN_EALB: 'Hurricane',
  ERQK_EALB: 'Earthquake',
  TRND_EALB: 'Tornado',
  WFIR_EALB: 'Wildfire',
  HAIL_EALB: 'Hail',
  SWND_EALB: 'Strong_Wind',
  CFLD_EALB: 'Coastal_Flood',
};

// ─────────────────────────────────────────────────────────────
// CSV loading + caching
// ─────────────────────────────────────────────────────────────

interface NriRow {
  fips: string;
  state: string;
  stateAbbr: string;
  county: string;
  eal: Record<HazardKey, number>; // raw dollars
  buildValue: number;             // total county building value, raw dollars
}

let _cache: Map<string, NriRow> | null = null;

function loadNri(): Map<string, NriRow> {
  if (_cache) return _cache;

  const csvPath = path.join(process.cwd(), 'data-county', 'NRI_Table_Counties.csv');
  const raw = fs.readFileSync(csvPath, 'utf-8');
  const lines = raw.split('\n');

  // Strip BOM from header line if present
  const headerLine = lines[0].replace(/^\uFEFF/, '');
  const headers = headerLine.split(',');

  const idx: Record<string, number> = {};
  for (const col of ['STCOFIPS', 'STATE', 'STATEABBRV', 'COUNTY', 'BUILDVALUE', ...Object.keys(NRI_COLUMN_MAP)]) {
    idx[col] = headers.indexOf(col);
  }

  const map = new Map<string, NriRow>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(',');
    const fips = cols[idx['STCOFIPS']]?.trim();
    if (!fips || fips.length < 4) continue;

    const eal = {} as Record<HazardKey, number>;
    for (const [col, key] of Object.entries(NRI_COLUMN_MAP)) {
      eal[key] = parseFloat(cols[idx[col]] ?? '0') || 0;
    }

    map.set(fips, {
      fips,
      state:      cols[idx['STATE']]?.trim()       ?? '',
      stateAbbr:  cols[idx['STATEABBRV']]?.trim()  ?? '',
      county:     cols[idx['COUNTY']]?.trim()      ?? '',
      eal,
      buildValue: parseFloat(cols[idx['BUILDVALUE']] ?? '0') || 0,
    });
  }

  _cache = map;
  return map;
}

// ─────────────────────────────────────────────────────────────
// Scoring
// ─────────────────────────────────────────────────────────────

function scoreRow(row: NriRow): CountyDisasterScore {
  let total = 0;
  const breakdown = {} as Record<HazardKey, HazardBreakdown>;

  for (const hazard of Object.keys(WEIGHTS) as HazardKey[]) {
    // Convert raw EAL dollars → millions for readability
    const valM = row.eal[hazard] / 1_000_000;
    const { min, max } = SCALERS[hazard];
    // norm: 0–1 representing where this county sits within the national range for this hazard
    const norm = Math.max(0, Math.min(1, (valM - min) / (max - min + 1e-8)));
    // contribution: hazard's share of the 0–100 overall score, weighted by its national importance
    // Formula: norm × weight × 100  (rounded to 2 decimal places)
    const contribution = Math.round(norm * WEIGHTS[hazard] * 100 * 100) / 100;
    breakdown[hazard] = {
      eal_building_M: Math.round(valM * 10_000) / 10_000,
      contribution,
    };
    total += contribution;
  }

  const score = Math.round(Math.max(0, Math.min(100, total)) * 10) / 10;

  const TIERS: [number, string, string][] = [
    [75, 'Very High', '#dc2626'],
    [55, 'High',      '#ea580c'],
    [35, 'Medium',    '#ca8a04'],
    [15, 'Low',       '#16a34a'],
    [0,  'Very Low',  '#15803d'],
  ];
  const [, tier, color] = TIERS.find(([min]) => score >= min) ?? [0, 'Very Low', '#15803d'];

  const dominant = (Object.entries(breakdown) as [HazardKey, HazardBreakdown][]).reduce(
    (a, b) => (b[1].contribution > a[1].contribution ? b : a)
  )[0];

  return {
    fips: row.fips,
    state: row.state,
    stateAbbr: row.stateAbbr,
    county: row.county,
    overall_score: score,
    tier,
    color,
    dominant_hazard: dominant,
    breakdown,
    buildValue: row.buildValue,
  };
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

export function getCountyByFips(fips: string): CountyDisasterScore | null {
  const map = loadNri();
  const row = map.get(fips);
  return row ? scoreRow(row) : null;
}

/** Search by county name substring + optional 2-letter state abbreviation */
export function searchCounties(
  countyName: string,
  stateAbbr?: string
): CountyDisasterScore[] {
  const map = loadNri();
  const q = countyName.toLowerCase().trim();
  const st = stateAbbr?.toUpperCase().trim();

  const results: CountyDisasterScore[] = [];
  for (const row of Array.from(map.values())) {
    if (!row.county.toLowerCase().includes(q)) continue;
    if (st && row.stateAbbr !== st) continue;
    results.push(scoreRow(row));
  }

  return results
    .sort((a, b) => b.overall_score - a.overall_score)
    .slice(0, 30);
}

/** Resolve lat/lng → county FIPS via FCC Census Block API (no key needed) */
export async function getFipsFromLatLng(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://geo.fcc.gov/api/census/block/find?latitude=${lat}&longitude=${lng}&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6_000), cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.County?.FIPS as string) ?? null;
  } catch {
    return null;
  }
}

/** Convenience: resolve lat/lng → scored county */
export async function getCountyByLatLng(
  lat: number,
  lng: number
): Promise<CountyDisasterScore | null> {
  const fips = await getFipsFromLatLng(lat, lng);
  if (!fips) return null;
  return getCountyByFips(fips);
}

/** Return all unique state abbreviations in the dataset for dropdowns */
export function getAllStates(): { abbr: string; name: string }[] {
  const map = loadNri();
  const seen = new Map<string, string>();
  for (const row of Array.from(map.values())) {
    if (row.stateAbbr && !seen.has(row.stateAbbr)) {
      seen.set(row.stateAbbr, row.state);
    }
  }
  return Array.from(seen.entries())
    .map(([abbr, name]) => ({ abbr, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
