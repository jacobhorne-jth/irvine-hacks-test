import type {
  OwnershipHistory,
  PropertyDetails,
  PriceHistoryPoint,
  TitleRiskScore,
  DisasterRiskScore,
  MarketRiskScore,
  PropertyRiskReport,
  RiskBreakdownItem,
  GPTLocationRisk,
} from './types';
import { scoreToLevel } from './utils';

// ============================================================
// TITLE RISK
// Based on ownership chain complexity, flips, liens, foreclosures
// ============================================================

export function calculateTitleRisk(history: OwnershipHistory): TitleRiskScore {
  const breakdown: RiskBreakdownItem[] = [];
  let score = 0;

  // Base: each transfer adds a small amount
  const basePoints = history.totalTransfers * 3;
  score += basePoints;
  if (basePoints > 0) {
    breakdown.push({
      label: 'Ownership transfers',
      points: basePoints,
      description: `${history.totalTransfers} total ownership transfer${history.totalTransfers === 1 ? '' : 's'} on record`,
    });
  }

  // Foreclosures
  const foreclosurePoints = history.foreclosureCount * 25;
  score += foreclosurePoints;
  if (foreclosurePoints > 0) {
    breakdown.push({
      label: 'Foreclosure history',
      points: foreclosurePoints,
      description: `${history.foreclosureCount} foreclosure${history.foreclosureCount === 1 ? '' : 's'} in chain of title — creates potential cloud on title`,
    });
  }

  // Liens
  const lienPoints = history.lienCount * 20;
  score += lienPoints;
  if (lienPoints > 0) {
    breakdown.push({
      label: 'Lien history',
      points: lienPoints,
      description: `${history.lienCount} lien${history.lienCount === 1 ? '' : 's'} recorded — mechanic's liens, HOA liens, or tax liens may not have been fully resolved`,
    });
  }

  // Rapid transfers (< 6 months) — extra risk indicator
  const rapidTransfers = history.events.filter(
    (e) => e.tenureMonths != null && e.tenureMonths < 6 && e.tenureMonths > 0
  );
  const rapidPoints = rapidTransfers.length * 10;
  score += rapidPoints;
  if (rapidPoints > 0) {
    breakdown.push({
      label: 'Rapid transfers (< 6 mo)',
      points: rapidPoints,
      description: `${rapidTransfers.length} transfer${rapidTransfers.length === 1 ? '' : 's'} with ownership under 6 months — unusual activity pattern`,
    });
  }

  const capped = Math.min(score, 100);

  return {
    score: capped,
    level: scoreToLevel(capped),
    factors: {
      flipCount: history.flipCount,
      foreclosureCount: history.foreclosureCount,
      lienCount: history.lienCount,
      totalTransfers: history.totalTransfers,
      rapidTransferCount: rapidTransfers.length,
    },
    breakdown,
  };
}

// ============================================================
// DISASTER RISK
// Driven by GPT-4o location analysis — works for any US address
// ============================================================

export function calculateDisasterRisk(
  _property: PropertyDetails,
  locationRisk: GPTLocationRisk
): DisasterRiskScore {
  const { flood, fire, earthquake } = locationRisk;

  const score = Math.min(flood.points + fire.points + earthquake.points, 100);

  return {
    score,
    level: scoreToLevel(score),
    floodZone: flood.zone,
    fireHazardZone: fire.zone,
    earthquakeProximity: earthquake.proximityMiles,
    breakdown: [
      { label: 'Flood zone', points: flood.points, description: flood.description },
      { label: 'Fire hazard zone', points: fire.points, description: fire.description },
      { label: 'Seismic proximity', points: earthquake.points, description: earthquake.description },
    ],
  };
}

// ============================================================
// MARKET RISK
// Based on price volatility and market activity
// ============================================================

export function calculateMarketRisk(
  priceHistory: PriceHistoryPoint[],
  property: PropertyDetails,
  locationRisk: GPTLocationRisk
): MarketRiskScore {
  const breakdown: RiskBreakdownItem[] = [];
  let score = 0;

  // Price volatility: std deviation of YoY % changes (computed from real data)
  const sales = priceHistory
    .filter((p) => p.event === 'sale' || p.event === 'estimate')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let volatility = 0;
  if (sales.length >= 2) {
    const changes: number[] = [];
    for (let i = 1; i < sales.length; i++) {
      const pct = ((sales[i].price - sales[i - 1].price) / sales[i - 1].price) * 100;
      changes.push(pct);
    }
    const mean = changes.reduce((a, b) => a + b, 0) / changes.length;
    const variance = changes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / changes.length;
    volatility = Math.sqrt(variance);
  }

  const volatilityPoints = Math.min(Math.round(volatility * 1.5), 40);
  score += volatilityPoints;
  breakdown.push({
    label: 'Price volatility',
    points: volatilityPoints,
    description: `${volatility.toFixed(1)}% standard deviation in price changes — ${volatility < 10 ? 'stable market history' : volatility < 20 ? 'moderate price swings' : 'high price volatility observed'}`,
  });

  // Property age factor (computed from real data)
  const age = new Date().getFullYear() - property.yearBuilt;
  const agePoints = age > 50 ? 15 : age > 30 ? 10 : age > 15 ? 5 : 2;
  score += agePoints;
  breakdown.push({
    label: 'Property age',
    points: agePoints,
    description: `Built in ${property.yearBuilt} (${age} years old) — ${age > 50 ? 'older home, higher maintenance risk' : age > 30 ? 'established home, some deferred maintenance risk' : 'relatively modern construction'}`,
  });

  // Market liquidity: driven by GPT-4o — works for any city
  const { market } = locationRisk;
  score += market.points;
  breakdown.push({
    label: 'Market liquidity',
    points: market.points,
    description: market.description,
  });

  const capped = Math.min(score, 100);

  return {
    score: capped,
    level: scoreToLevel(capped),
    priceVolatility: volatility,
    daysOnMarket: market.daysOnMarket,
    priceReductionRate: market.priceReductionRate,
    breakdown,
  };
}

// ============================================================
// COMBINED REPORT
// ============================================================

export function generateRiskReport(
  property: PropertyDetails,
  history: OwnershipHistory,
  priceHistory: PriceHistoryPoint[],
  locationRisk: GPTLocationRisk
): PropertyRiskReport {
  const titleRisk = calculateTitleRisk(history);
  const disasterRisk = calculateDisasterRisk(property, locationRisk);
  const marketRisk = calculateMarketRisk(priceHistory, property, locationRisk);

  // Weighted average: title 40%, disaster 35%, market 25%
  const overallScore = Math.round(
    titleRisk.score * 0.4 +
    disasterRisk.score * 0.35 +
    marketRisk.score * 0.25
  );

  return {
    titleRisk,
    disasterRisk,
    marketRisk,
    overallScore,
    generatedAt: new Date().toISOString(),
  };
}
