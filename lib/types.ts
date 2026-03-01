// ============================================================
// CORE PROPERTY TYPES
// ============================================================

export interface PropertyAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  county?: string;
  fullAddress: string;
  slug: string;
}

export interface PropertyDetails {
  address: PropertyAddress;
  beds: number;
  baths: number;
  sqft: number;
  lotSqft: number;
  yearBuilt: number;
  propertyType: 'single-family' | 'condo' | 'townhouse' | 'multi-family';
  zestimate: number;
  lastSalePrice: number;
  lastSaleDate: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  redfinUrl?: string;
}

// ============================================================
// OWNERSHIP HISTORY & TIMELINE
// ============================================================

export type EventType =
  | 'purchase'
  | 'foreclosure'
  | 'listing'
  | 'price-reduction';

export interface OwnershipEvent {
  id: string;
  type: EventType;
  date: string;
  ownerName?: string;
  price?: number;
  tenureMonths?: number | null;
  isFlip: boolean;
  hasForeclosure: boolean;
  foreclosureDetails?: string;
  notes?: string;
}

export interface OwnershipHistory {
  propertyId: string;
  events: OwnershipEvent[];
  totalTransfers: number;
  flipCount: number;
  foreclosureCount: number;
  oldestRecord: string;
}

export interface PriceHistoryPoint {
  date: string;
  price: number;
  event: 'sale' | 'listing' | 'estimate';
}

// ============================================================
// RISK SCORING
// ============================================================

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskBreakdownItem {
  label: string;
  points: number;
  description: string;
}

export interface TitleRiskScore {
  score: number;
  level: RiskLevel;
  factors: {
    flipCount: number;
    foreclosureCount: number;
    totalTransfers: number;
    rapidTransferCount: number;
  };
  breakdown: RiskBreakdownItem[];
}

export interface DisasterRiskScore {
  score: number;
  level: RiskLevel;
  floodZone: string;
  fireHazardZone: 'none' | 'moderate' | 'high' | 'very-high';
  earthquakeProximity: number;
  breakdown: RiskBreakdownItem[];
}

export interface MarketRiskScore {
  score: number;
  level: RiskLevel;
  priceVolatility: number;
  daysOnMarket: number;
  priceReductionRate: number;
  breakdown: RiskBreakdownItem[];
}

export interface PropertyRiskReport {
  titleRisk: TitleRiskScore;
  disasterRisk: DisasterRiskScore;
  marketRisk: MarketRiskScore;
  overallScore: number;
  generatedAt: string;
}

// ============================================================
// GPT LOCATION RISK (replaces hardcoded city lookup tables)
// ============================================================

export interface GPTLocationRisk {
  flood: {
    zone: string;
    points: number;       // 5–30
    description: string;
  };
  fire: {
    zone: 'none' | 'moderate' | 'high' | 'very-high';
    points: number;       // 3–35
    description: string;
  };
  earthquake: {
    proximityMiles: number;
    points: number;       // 10–20
    description: string;
  };
  market: {
    daysOnMarket: number;
    priceReductionRate: number;
    points: number;       // 5–20
    description: string;
  };
}

// ============================================================
// AI SUMMARY
// ============================================================

export type AIRecommendation = 'proceed' | 'caution' | 'high-risk' | 'avoid';

export interface AISummary {
  summary: string;
  keyRisks: string[];
  recommendation: AIRecommendation;
  generatedAt: string;
  model: string;
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface PropertyApiResponse {
  property: PropertyDetails;
  history: OwnershipHistory;
  priceHistory: PriceHistoryPoint[];
  error?: string;
}

export interface RiskAnalysisApiResponse {
  riskReport: PropertyRiskReport;
  aiSummary: AISummary;
  error?: string;
}

// ============================================================
// APIFY RAW TYPES
// ============================================================

export interface ApifyRedfinProperty {
  address: string;
  city: string;
  state: string;
  zip: string;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  lotSize: number | null;
  yearBuilt: number | null;
  price: number | null;
  priceHistory: ApifyPriceHistoryEntry[];
  latitude: number;
  longitude: number;
  url: string;
  imageUrl: string;
  propertyType: string;
}

export interface ApifyPriceHistoryEntry {
  date: string;
  price: number;
  event: string;
  source: string;
}
