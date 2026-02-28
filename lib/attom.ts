/**
 * ATTOM Data Solutions API Integration
 * Docs: https://api.developer.attomdata.com/docs
 *
 * Field names verified against live API responses (free trial tier).
 * Key differences from docs examples:
 *  - USE /saleshistory/basichistory (not /detail) — returns full history (all transfers)
 *    /saleshistory/detail only returns 1 record on free tier
 *  - basichistory amount fields are camelCase: saleAmt, saleTransType, saleRecDate
 *    (detail uses all-lowercase — different endpoint, different casing)
 *  - lat/lng is under `location`, not `address`
 *  - yearbuilt is under `summary`, not `building`
 *  - basichistory returns buyerName/sellerName as top-level string fields
 *  - current owner also available via /property/detailowner (owner.owner1.fullname)
 */

import type {
  PropertyDetails,
  OwnershipHistory,
  OwnershipEvent,
  PriceHistoryPoint,
} from './types';
import { addressToSlug } from './utils';

const ATTOM_BASE = 'https://api.gateway.attomdata.com/propertyapi/v1.0.0';

// ─────────────────────────────────────────────────────────────
// Raw ATTOM response shapes — field names from live API
// ─────────────────────────────────────────────────────────────

interface AttomAddress {
  line1?: string;
  line2?: string;
  locality?: string;
  countrySubd?: string;
  postal1?: string;
}

interface AttomLocation {
  latitude?: string;
  longitude?: string;
}

interface AttomBuilding {
  rooms?: { beds?: number; bathstotal?: number; bathsfull?: number };
  size?: { universalsize?: number; bldgsize?: number; lotsize2?: number };
}

interface AttomSummary {
  yearbuilt?: number;
  proptype?: string;
  propsubtype?: string;
  propertyType?: string;
}

// basichistory amount sub-fields are camelCase (unlike /detail which uses all-lowercase)
interface AttomSaleAmount {
  saleAmt?: number;
  saleTransType?: string;   // "Resale", "New Construction", "REO/Bank Owned", "Foreclosure", etc.
  saleRecDate?: string;
  saleDocType?: string;
  saleDocNum?: string;
  saleDisclosureType?: number;
}

interface AttomSaleHistoryEntry {
  sequence?: number;        // 1 = most recent
  saleTransDate?: string;
  saleSearchDate?: string;
  buyerName?: string;       // available in basichistory
  sellerName?: string;      // available in basichistory
  amount?: AttomSaleAmount;
}

interface AttomOwnerPerson {
  fullname?: string;
  lastname?: string;
  firstnameandmi?: string;
}

interface AttomOwner {
  owner1?: AttomOwnerPerson;
  owner2?: AttomOwnerPerson;
  corporateindicator?: string;
}

interface AttomEventEntry {
  eventDate?: string;
  eventType?: string;
  amount?: { eventAmt?: number };
  eventDescription?: string;
}

interface AttomProperty {
  identifier?: { attomId?: number; fips?: string; apn?: string };
  address?: AttomAddress;
  location?: AttomLocation;
  building?: AttomBuilding;
  summary?: AttomSummary;
  owner?: AttomOwner;
  salehistory?: AttomSaleHistoryEntry[];
  allevents?: { eventHistory?: AttomEventEntry[] };
}

interface AttomApiResponse {
  status?: { code?: number; msg?: string };
  property?: AttomProperty[];
}

// ─────────────────────────────────────────────────────────────
// HTTP helper
// ─────────────────────────────────────────────────────────────

async function attomGet(path: string, params: Record<string, string>): Promise<AttomApiResponse> {
  const key = process.env.ATTOM_API_KEY;
  if (!key || key.startsWith('placeholder')) {
    throw new Error('ATTOM_API_KEY not set');
  }

  const qs = new URLSearchParams(params).toString();
  const url = `${ATTOM_BASE}${path}?${qs}`;

  const res = await fetch(url, {
    headers: { apikey: key, Accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ATTOM ${res.status} on ${path}: ${text.slice(0, 300)}`);
  }

  return res.json();
}

/**
 * Split "123 Main St, Irvine, CA 92612" → { address1: "123 Main St", address2: "Irvine CA 92612" }
 */
function splitAddress(fullAddress: string): { address1: string; address2: string } {
  const commaIdx = fullAddress.indexOf(',');
  if (commaIdx !== -1) {
    const address1 = fullAddress.slice(0, commaIdx).trim();
    const address2 = fullAddress.slice(commaIdx + 1).trim().replace(/,/g, ' ').replace(/\s+/g, ' ');
    return { address1, address2 };
  }

  // No-comma fallback — anchor on zip + state
  const parts = fullAddress.trim().split(/\s+/);
  const zipIdx = parts.findLastIndex((p) => /^\d{5}$/.test(p));
  const stateIdx = zipIdx > 0 ? zipIdx - 1 : parts.findLastIndex((p) => /^[A-Za-z]{2}$/.test(p));

  if (stateIdx > 1) {
    const cityStateZip = parts.slice(stateIdx).join(' ');
    const cityStart = stateIdx - 1;
    const street = parts.slice(0, cityStart).join(' ');
    const city = parts[cityStart];
    return { address1: street, address2: `${city} ${cityStateZip}` };
  }

  const mid = Math.ceil(parts.length / 2);
  return { address1: parts.slice(0, mid).join(' '), address2: parts.slice(mid).join(' ') };
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

export interface AttomPropertyData {
  property: PropertyDetails;
  history: OwnershipHistory;
  priceHistory: PriceHistoryPoint[];
}

export async function fetchAttomPropertyData(
  fullAddress: string
): Promise<AttomPropertyData> {
  const { address1, address2 } = splitAddress(fullAddress);
  const params = { address1, address2 };

  console.log('[ATTOM] Querying:', { address1, address2 });

  // 3 parallel calls: property detail, full sale history (basichistory = all transfers), current owner
  // NOTE: /saleshistory/detail only returns 1 record on free tier; basichistory returns all
  const [detailRes, historyRes, ownerRes] = await Promise.all([
    attomGet('/property/detail', params).catch((e) => {
      console.error('[ATTOM] property/detail failed:', e.message);
      return null;
    }),
    attomGet('/saleshistory/basichistory', params).catch((e) => {
      console.error('[ATTOM] saleshistory/basichistory failed:', e.message);
      return null;
    }),
    attomGet('/property/detailowner', params).catch((e) => {
      console.warn('[ATTOM] detailowner failed (may need upgrade):', e.message);
      return null;
    }),
  ]);

  const propDetail = detailRes?.property?.[0];
  const propHistory = historyRes?.property?.[0];
  const propOwner = ownerRes?.property?.[0];

  console.log('[ATTOM] propDetail.building:', JSON.stringify(propDetail?.building, null, 2));
  console.log('[ATTOM] propDetail.summary:', JSON.stringify(propDetail?.summary, null, 2));

  if (!propDetail && !propHistory) {
    throw new Error(`ATTOM found no data for: ${fullAddress}`);
  }

  // ── Property Details ──
  const addr = propDetail?.address ?? propHistory?.address ?? {};
  const loc = propDetail?.location ?? propHistory?.location ?? {};
  const building = propDetail?.building ?? {};
  const summary = propDetail?.summary ?? {};

  const street = addr.line1 ?? fullAddress.split(',')[0]?.trim() ?? fullAddress;
  const city = addr.locality ?? address2.split(' ')[0] ?? '';
  const state = addr.countrySubd ?? 'CA';
  const zip = addr.postal1 ?? '';
  const slug = addressToSlug(`${street} ${city} ${state} ${zip}`);

  const saleHistory = propHistory?.salehistory ?? propDetail?.salehistory ?? [];
  const mostRecentSale = saleHistory[0];

  const propTypeRaw = (summary.proptype ?? '').toUpperCase();
  const propertyType = propTypeRaw.includes('CONDO')
    ? 'condo'
    : propTypeRaw.includes('TOWN')
    ? 'townhouse'
    : propTypeRaw.includes('MULTI') || propTypeRaw.includes('DUPLEX')
    ? 'multi-family'
    : 'single-family';

  const property: PropertyDetails = {
    address: {
      street,
      city,
      state,
      zip,
      fullAddress: `${street}, ${city}, ${state} ${zip}`.trim(),
      slug,
    },
    beds: building.rooms?.beds ?? 0,
    baths: building.rooms?.bathstotal ?? 0,
    sqft: building.size?.universalsize ?? building.size?.bldgsize ?? 0,
    lotSqft: building.size?.lotsize2 ?? 0,   // lotsize2 = sq ft, lotsize1 = acres
    yearBuilt: summary.yearbuilt ?? 0,         // yearbuilt is under summary, not building
    propertyType,
    zestimate: mostRecentSale?.amount?.saleAmt ?? 0,
    lastSalePrice: mostRecentSale?.amount?.saleAmt ?? 0,
    lastSaleDate: mostRecentSale?.saleTransDate ?? new Date().toISOString().split('T')[0],
    latitude: parseFloat(loc.latitude ?? '') || 33.7,   // lat/lng is under location, not address
    longitude: parseFloat(loc.longitude ?? '') || -117.8,
    redfinUrl: undefined,
  };

  // ── Current owner name from detailowner ──
  const currentOwnerName = buildOwnerName(propOwner?.owner);

  // ── Ownership history from basichistory (full chain of title) ──
  // basichistory returns all transfers; amount fields are camelCase (saleAmt, saleTransType, saleRecDate)
  const events: OwnershipEvent[] = [];
  let flipCount = 0;
  let foreclosureCount = 0;
  let prevOwnerCount = 0; // tracks sequential numbering independent of loop index

  // Pre-filter: skip pure financing events (refinances, not actual property transfers)
  const transfers = saleHistory.filter((s) => {
    const t = (s.amount?.saleTransType ?? '').toUpperCase();
    return !t.includes('STAND ALONE FINANCE') && !t.includes('REFINANCE');
  });

  for (let i = 0; i < transfers.length; i++) {
    const sale = transfers[i];

    // Tenure = gap between this sale date and the previous (newer) sale
    let tenureMonths: number | null = null;
    if (i > 0) {
      const thisDate = new Date(sale.saleTransDate ?? '');
      const prevDate = new Date(transfers[i - 1].saleTransDate ?? '');
      if (!isNaN(thisDate.getTime()) && !isNaN(prevDate.getTime())) {
        tenureMonths = Math.round(
          (prevDate.getTime() - thisDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
        );
      }
    }

    // basichistory uses camelCase: saleTransType (not saletranstype)
    const transType = (sale.amount?.saleTransType ?? '').toUpperCase();
    const isForeclosure =
      transType.includes('FORECLOSURE') ||
      transType.includes('REO') ||
      transType.includes('BANK') ||
      transType.includes('SHERIFF');

    const isFlip = tenureMonths !== null && tenureMonths < 24;
    if (isFlip) flipCount++;
    if (isForeclosure) foreclosureCount++;

    // Most recent entry = current owner (use real name if available from detailowner)
    // Older entries = "Previous Owner 1", "Previous Owner 2", etc. (sequential, no gaps)
    let ownerName: string;
    if (i === 0) {
      ownerName = currentOwnerName ?? 'Current Owner';
    } else {
      prevOwnerCount++;
      ownerName = `Previous Owner ${prevOwnerCount}`;
    }

    events.push({
      id: `attom-${i}`,
      type: isForeclosure ? 'foreclosure' : 'purchase',
      date: sale.saleTransDate ?? '',
      ownerName,
      price: sale.amount?.saleAmt ?? undefined,
      tenureMonths: i === 0 ? null : tenureMonths,
      isFlip,
      hasForeclosure: isForeclosure,
      hasLien: false,
      foreclosureDetails: isForeclosure
        ? `${sale.amount?.saleTransType} — recorded ${sale.amount?.saleRecDate ?? ''}`
        : undefined,
      notes: !isForeclosure && sale.amount?.saleTransType
        ? sale.amount.saleTransType
        : undefined,
    });
  }

  // ── Optional: lien events ──
  let lienCount = 0;
  try {
    const eventsRes = await attomGet('/allevents/detail', params);
    const allEvents: AttomEventEntry[] = eventsRes?.property?.[0]?.allevents?.eventHistory ?? [];
    const lienEvents = allEvents.filter((e) => {
      const t = (e.eventType ?? '').toUpperCase();
      return t.includes('LIEN') || t.includes('NOD') || t.includes('NTS');
    });

    lienCount = lienEvents.length;

    for (const lienEvt of lienEvents) {
      if (!lienEvt.eventDate) continue;
      const lienDate = new Date(lienEvt.eventDate).getTime();
      let bestIdx = 0;
      let bestDelta = Infinity;
      for (let i = 0; i < events.length; i++) {
        const delta = Math.abs(lienDate - new Date(events[i].date).getTime());
        if (delta < bestDelta) { bestDelta = delta; bestIdx = i; }
      }
      const amt = lienEvt.amount?.eventAmt ? ` — $${lienEvt.amount.eventAmt.toLocaleString()}` : '';
      events[bestIdx].hasLien = true;
      events[bestIdx].lienDetails = [
        events[bestIdx].lienDetails,
        `${lienEvt.eventType}${amt}`,
      ].filter(Boolean).join('; ');
    }
  } catch {
    console.warn('[ATTOM] allevents/detail not on this plan — lien data skipped');
  }

  const history: OwnershipHistory = {
    propertyId: slug,
    events,
    totalTransfers: events.length,
    flipCount,
    foreclosureCount,
    lienCount,
    oldestRecord: events[events.length - 1]?.date ?? new Date().toISOString().split('T')[0],
  };

  const priceHistory: PriceHistoryPoint[] = saleHistory
    .filter((s) => s.saleTransDate && s.amount?.saleAmt)
    .map((s) => ({
      date: s.saleTransDate!,
      price: s.amount!.saleAmt!,
      event: 'sale' as const,
    }))
    .reverse();

  return { property, history, priceHistory };
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function buildOwnerName(owner?: AttomOwner): string | null {
  if (!owner) return null;
  const o1 = owner.owner1?.fullname?.trim();
  const o2 = owner.owner2?.fullname?.trim();
  if (o1 && o2) return toTitleCase(`${o1} & ${o2}`);
  if (o1) return toTitleCase(o1);
  return null;
}


function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
