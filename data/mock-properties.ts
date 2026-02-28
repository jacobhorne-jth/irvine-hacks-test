import type {
  PropertyDetails,
  OwnershipHistory,
  PriceHistoryPoint,
} from '@/lib/types';

// ============================================================
// PROPERTY 1: LOW RISK — Long-held family home in Irvine
// Address: 14 Clearview, Irvine, CA 92612
// ============================================================

export const mockProperty_Irvine: PropertyDetails = {
  address: {
    street: '14 Clearview',
    city: 'Irvine',
    state: 'CA',
    zip: '92612',
    fullAddress: '14 Clearview, Irvine, CA 92612',
    slug: '14-clearview-irvine-ca-92612',
  },
  beds: 4,
  baths: 3,
  sqft: 2400,
  lotSqft: 5200,
  yearBuilt: 1998,
  propertyType: 'single-family',
  zestimate: 1_450_000,
  lastSalePrice: 1_200_000,
  lastSaleDate: '2019-06-15',
  latitude: 33.6846,
  longitude: -117.8265,
  redfinUrl: 'https://www.redfin.com/CA/Irvine/14-Clearview-92612',
};

export const mockHistory_Irvine: OwnershipHistory = {
  propertyId: '14-clearview-irvine-ca-92612',
  totalTransfers: 2,
  flipCount: 0,
  foreclosureCount: 0,
  lienCount: 0,
  oldestRecord: '1998-09-01',
  events: [
    {
      id: 'evt-001',
      type: 'purchase',
      date: '1998-09-01',
      ownerName: 'Robert & Linda Chen',
      price: 380_000,
      tenureMonths: 249,
      isFlip: false,
      hasForeclosure: false,
      hasLien: false,
      notes: 'Original purchase from builder',
    },
    {
      id: 'evt-002',
      type: 'purchase',
      date: '2019-06-15',
      ownerName: 'Marcus & Jennifer Williams',
      price: 1_200_000,
      tenureMonths: null,
      isFlip: false,
      hasForeclosure: false,
      hasLien: false,
    },
  ],
};

export const mockPriceHistory_Irvine: PriceHistoryPoint[] = [
  { date: '1998-09-01', price: 380_000, event: 'sale' },
  { date: '2005-07-01', price: 620_000, event: 'estimate' },
  { date: '2009-03-01', price: 490_000, event: 'estimate' },
  { date: '2013-06-01', price: 720_000, event: 'estimate' },
  { date: '2017-04-01', price: 980_000, event: 'estimate' },
  { date: '2019-06-15', price: 1_200_000, event: 'sale' },
  { date: '2022-01-01', price: 1_380_000, event: 'estimate' },
  { date: '2024-01-01', price: 1_450_000, event: 'estimate' },
];

// ============================================================
// PROPERTY 2: HIGH RISK — Anaheim flip with foreclosure
// Address: 2201 W Ball Rd, Anaheim, CA 92804
// ============================================================

export const mockProperty_Anaheim: PropertyDetails = {
  address: {
    street: '2201 W Ball Rd',
    city: 'Anaheim',
    state: 'CA',
    zip: '92804',
    fullAddress: '2201 W Ball Rd, Anaheim, CA 92804',
    slug: '2201-w-ball-rd-anaheim-ca-92804',
  },
  beds: 3,
  baths: 2,
  sqft: 1450,
  lotSqft: 6000,
  yearBuilt: 1962,
  propertyType: 'single-family',
  zestimate: 780_000,
  lastSalePrice: 695_000,
  lastSaleDate: '2023-03-10',
  latitude: 33.8366,
  longitude: -117.9764,
  redfinUrl: 'https://www.redfin.com/CA/Anaheim/2201-W-Ball-Rd-92804',
};

export const mockHistory_Anaheim: OwnershipHistory = {
  propertyId: '2201-w-ball-rd-anaheim-ca-92804',
  totalTransfers: 5,
  flipCount: 3,
  foreclosureCount: 1,
  lienCount: 2,
  oldestRecord: '2010-01-15',
  events: [
    {
      id: 'evt-101',
      type: 'purchase',
      date: '2010-01-15',
      ownerName: 'David Nguyen',
      price: 310_000,
      tenureMonths: 38,
      isFlip: false,
      hasForeclosure: false,
      hasLien: false,
    },
    {
      id: 'evt-102',
      type: 'foreclosure',
      date: '2013-03-22',
      ownerName: 'Bank of America (REO)',
      price: 285_000,
      tenureMonths: 8,
      isFlip: true,
      hasForeclosure: true,
      hasLien: false,
      foreclosureDetails: 'NOD filed 2012-11-01. Trustee Sale 2013-03-22.',
    },
    {
      id: 'evt-103',
      type: 'purchase',
      date: '2013-11-05',
      ownerName: 'Golden State Investments LLC',
      price: 390_000,
      tenureMonths: 14,
      isFlip: true,
      hasForeclosure: false,
      hasLien: true,
      lienDetails: "Mechanic's Lien — $22,000 (Sunrise Contractors)",
    },
    {
      id: 'evt-104',
      type: 'purchase',
      date: '2015-01-20',
      ownerName: 'Rosa & Miguel Hernandez',
      price: 485_000,
      tenureMonths: 98,
      isFlip: false,
      hasForeclosure: false,
      hasLien: true,
      lienDetails: 'HOA Lien — $4,800 (resolved 2016-04-10)',
    },
    {
      id: 'evt-105',
      type: 'purchase',
      date: '2023-03-10',
      ownerName: 'SoCal Flips Inc.',
      price: 695_000,
      tenureMonths: null,
      isFlip: false,
      hasForeclosure: false,
      hasLien: false,
    },
  ],
};

export const mockPriceHistory_Anaheim: PriceHistoryPoint[] = [
  { date: '2010-01-15', price: 310_000, event: 'sale' },
  { date: '2013-03-22', price: 285_000, event: 'sale' },
  { date: '2013-11-05', price: 390_000, event: 'sale' },
  { date: '2015-01-20', price: 485_000, event: 'sale' },
  { date: '2020-06-01', price: 560_000, event: 'estimate' },
  { date: '2022-09-01', price: 720_000, event: 'estimate' },
  { date: '2023-03-10', price: 695_000, event: 'sale' },
  { date: '2024-01-01', price: 780_000, event: 'estimate' },
];

// ============================================================
// PROPERTY 3: MEDIUM RISK — Newport Beach condo with one lien
// Address: 891 Iris Ave, Newport Beach, CA 92625
// ============================================================

export const mockProperty_Newport: PropertyDetails = {
  address: {
    street: '891 Iris Ave',
    city: 'Newport Beach',
    state: 'CA',
    zip: '92625',
    fullAddress: '891 Iris Ave, Newport Beach, CA 92625',
    slug: '891-iris-ave-newport-beach-ca-92625',
  },
  beds: 2,
  baths: 2,
  sqft: 1100,
  lotSqft: 0,
  yearBuilt: 2004,
  propertyType: 'condo',
  zestimate: 1_150_000,
  lastSalePrice: 980_000,
  lastSaleDate: '2021-08-20',
  latitude: 33.6189,
  longitude: -117.9298,
  redfinUrl: 'https://www.redfin.com/CA/Newport-Beach/891-Iris-Ave-92625',
};

export const mockHistory_Newport: OwnershipHistory = {
  propertyId: '891-iris-ave-newport-beach-ca-92625',
  totalTransfers: 3,
  flipCount: 1,
  foreclosureCount: 0,
  lienCount: 1,
  oldestRecord: '2004-08-12',
  events: [
    {
      id: 'evt-201',
      type: 'purchase',
      date: '2004-08-12',
      ownerName: 'Patricia & James Fitzgerald',
      price: 620_000,
      tenureMonths: 130,
      isFlip: false,
      hasForeclosure: false,
      hasLien: false,
      notes: 'New construction purchase',
    },
    {
      id: 'evt-202',
      type: 'purchase',
      date: '2015-06-01',
      ownerName: 'Coastal Ventures LLC',
      price: 810_000,
      tenureMonths: 19,
      isFlip: true,
      hasForeclosure: false,
      hasLien: true,
      lienDetails: 'IRS Tax Lien — $31,500 (resolved at closing)',
    },
    {
      id: 'evt-203',
      type: 'purchase',
      date: '2021-08-20',
      ownerName: 'Aiden & Sophie Park',
      price: 980_000,
      tenureMonths: null,
      isFlip: false,
      hasForeclosure: false,
      hasLien: false,
    },
  ],
};

export const mockPriceHistory_Newport: PriceHistoryPoint[] = [
  { date: '2004-08-12', price: 620_000, event: 'sale' },
  { date: '2009-05-01', price: 540_000, event: 'estimate' },
  { date: '2012-08-01', price: 650_000, event: 'estimate' },
  { date: '2015-06-01', price: 810_000, event: 'sale' },
  { date: '2017-01-01', price: 880_000, event: 'estimate' },
  { date: '2019-06-01', price: 890_000, event: 'listing' },
  { date: '2021-08-20', price: 980_000, event: 'sale' },
  { date: '2024-01-01', price: 1_150_000, event: 'estimate' },
];

// ============================================================
// LOOKUP MAP — keyed by partial address match for mock routing
// ============================================================

export interface MockPropertyRecord {
  property: PropertyDetails;
  history: OwnershipHistory;
  priceHistory: PriceHistoryPoint[];
}

export const MOCK_PROPERTIES: MockPropertyRecord[] = [
  {
    property: mockProperty_Irvine,
    history: mockHistory_Irvine,
    priceHistory: mockPriceHistory_Irvine,
  },
  {
    property: mockProperty_Anaheim,
    history: mockHistory_Anaheim,
    priceHistory: mockPriceHistory_Anaheim,
  },
  {
    property: mockProperty_Newport,
    history: mockHistory_Newport,
    priceHistory: mockPriceHistory_Newport,
  },
];

export function findMockProperty(addressQuery: string): MockPropertyRecord {
  // Normalize: lowercase, strip commas, collapse whitespace, replace spaces→dashes
  const normalize = (s: string) =>
    s.toLowerCase().replace(/,/g, ' ').replace(/\s+/g, ' ').trim();

  const query = normalize(addressQuery);

  for (const record of MOCK_PROPERTIES) {
    const addr = normalize(record.property.address.fullAddress);
    const slug = record.property.address.slug.toLowerCase();
    const city = record.property.address.city.toLowerCase();

    if (
      addr === query ||
      addr.includes(query) ||
      query.includes(addr) ||
      slug.includes(query.replace(/\s+/g, '-')) ||
      query.includes(city)
    ) {
      return record;
    }
  }

  // Default to Anaheim (high risk) as the interesting demo case
  return MOCK_PROPERTIES[1];
}
