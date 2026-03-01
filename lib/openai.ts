/**
 * OpenAI GPT-4o Risk Analysis Client
 *
 * TODO: Set OPENAI_API_KEY in .env.local to enable AI summaries.
 * Set USE_MOCK_DATA=false to use real OpenAI.
 */

import type {
  PropertyDetails,
  PropertyRiskReport,
  OwnershipHistory,
  AISummary,
  AIRecommendation,
  GPTLocationRisk,
} from './types';
import { formatCurrency, getRiskLabel } from './utils';

/**
 * Use GPT to extract the US county (name + state abbreviation) from any address string.
 * Returns null if the OpenAI key is not configured — caller should fall back to the FCC API.
 */
export async function extractCountyFromAddress(
  fullAddress: string
): Promise<{ county: string; stateAbbr: string } | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'placeholder_add_your_key') return null;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content:
              `Which US county does this address belong to?\n` +
              `Address: "${fullAddress}"\n` +
              `Return JSON only — no markdown: {"county": "<county name, no word 'County'>", "stateAbbr": "<2-letter state>"}`,
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 40,
        temperature: 0,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}');
    if (parsed.county && parsed.stateAbbr) {
      return { county: String(parsed.county), stateAbbr: String(parsed.stateAbbr) };
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchLocationRiskData(property: PropertyDetails): Promise<GPTLocationRisk> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o';

  if (!apiKey || apiKey === 'placeholder_add_your_key') {
    return getFallbackLocationRisk(property);
  }

  const prompt = `You are a real estate risk analyst with expertise in FEMA flood maps, wildfire hazard zones, USGS seismic data, and local real estate market conditions.

Given this property, return accurate risk data based on publicly known geographic and market information.

Property: ${property.address.fullAddress}
Coordinates: ${property.latitude}, ${property.longitude}

Respond with JSON only:
{
  "flood": {
    "zone": "<FEMA flood zone, e.g. X, AE, A, VE>",
    "points": <integer 5–30, higher = more flood risk>,
    "description": "<1 sentence: zone name, why this risk level, any insurance implications>"
  },
  "fire": {
    "zone": "<"none" | "moderate" | "high" | "very-high">,
    "points": <integer 3–35, higher = more fire risk>,
    "description": "<1 sentence: hazard zone designation, proximity to wildland areas, historical fire activity>"
  },
  "earthquake": {
    "proximityMiles": <estimated miles to nearest significant fault>,
    "points": <integer 10–20, higher = closer to fault / more risk>,
    "description": "<1 sentence: nearest named fault, estimated distance, typical shaking intensity>"
  },
  "market": {
    "daysOnMarket": <typical average days on market for this area>,
    "priceReductionRate": <percentage of active listings with price reductions>,
    "points": <integer 5–20, higher = less liquid / more volatile market>,
    "description": "<1 sentence: market demand, typical DOM, buyer/seller dynamic>"
  }
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a real estate risk analyst. Return only valid JSON, no markdown.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    console.error('[OpenAI] fetchLocationRiskData error:', response.status);
    return getFallbackLocationRisk(property);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  try {
    const parsed = JSON.parse(content) as GPTLocationRisk;
    // Clamp points to valid ranges so scoring stays consistent
    parsed.flood.points = Math.max(5, Math.min(30, parsed.flood.points));
    parsed.fire.points = Math.max(3, Math.min(35, parsed.fire.points));
    parsed.earthquake.points = Math.max(10, Math.min(20, parsed.earthquake.points));
    parsed.market.points = Math.max(5, Math.min(20, parsed.market.points));
    return parsed;
  } catch {
    console.error('[OpenAI] Failed to parse location risk response');
    return getFallbackLocationRisk(property);
  }
}

function getFallbackLocationRisk(property: PropertyDetails): GPTLocationRisk {
  const state = property.address.state.toUpperCase();
  const isCA = state === 'CA';
  const coastalStates = ['CA', 'FL', 'TX', 'LA', 'SC', 'NC', 'VA', 'MD', 'NJ', 'NY', 'MA'];
  const isCoastal = coastalStates.includes(state);

  return {
    flood: {
      zone: isCoastal ? 'AE' : 'X',
      points: isCoastal ? 20 : 5,
      description: isCoastal
        ? `${property.address.city} is in a coastal region with elevated flood exposure; flood insurance may be required.`
        : `${property.address.city} has minimal flood hazard based on inland location.`,
    },
    fire: {
      zone: isCA ? 'high' : 'moderate',
      points: isCA ? 22 : 10,
      description: isCA
        ? `California properties carry elevated wildfire risk, particularly near wildland-urban interface areas.`
        : `Moderate wildfire risk based on regional climate and land cover.`,
    },
    earthquake: {
      proximityMiles: isCA ? 8 : 50,
      points: isCA ? 15 : 10,
      description: isCA
        ? `California has significant seismic activity; proximity to specific faults requires local assessment.`
        : `${state} has lower seismic activity compared to the western US.`,
    },
    market: {
      daysOnMarket: 30,
      priceReductionRate: 12,
      points: 10,
      description: `${property.address.city} market conditions estimated from regional averages; local data may vary.`,
    },
  };
}

/**
 * Generate location-specific AI explanations for each FEMA hazard.
 * Uses county name, state, and actual EAL/contribution data from NRI.
 */
export async function generateHazardExplanations(
  county: string,
  stateAbbr: string,
  breakdown: Record<string, { eal_building_M: number; contribution: number }>
): Promise<Record<string, string>> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'placeholder_add_your_key') return {};

  const lines = (Object.entries(breakdown) as [string, { eal_building_M: number; contribution: number }][])
    .sort((a, b) => b[1].contribution - a[1].contribution)
    .map(([key, v]) =>
      `${key}: contribution=${v.contribution.toFixed(2)} pts, EAL=$${(v.eal_building_M * 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr`
    )
    .join('\n');

  const prompt =
    `You are a property risk analyst. For ${county} County, ${stateAbbr}, write ONE concise sentence per hazard ` +
    `explaining WHY the risk is at this level — reference real local geography, faults, climate patterns, or infrastructure specific to this county.\n\n` +
    `Hazard data (FEMA NRI):\n${lines}\n\n` +
    `Return JSON only with keys matching the hazard names exactly:\n` +
    `{"Earthquake":"...","Wildfire":"...","Inland_Flood":"...","Hurricane":"...","Tornado":"...","Hail":"...","Strong_Wind":"...","Coastal_Flood":"..."}`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 500,
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return {};
    const data = await res.json();
    return JSON.parse(data.choices?.[0]?.message?.content ?? '{}');
  } catch {
    return {};
  }
}

export async function generateAISummary(
  property: PropertyDetails,
  history: OwnershipHistory,
  report: PropertyRiskReport
): Promise<AISummary> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o';

  if (!apiKey || apiKey === 'placeholder_add_your_key') {
    return getMockAISummary(property, history, report);
  }

  const prompt = buildRiskPrompt(property, history, report);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert title insurance and property risk analyst. Provide concise, actionable risk assessments for real estate buyers and their insurance agents. Be factual, specific, and direct.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 600,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    console.error('OpenAI API error:', response.status);
    return getMockAISummary(property, history, report);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  try {
    const parsed = JSON.parse(content);
    return {
      summary: parsed.summary ?? '',
      keyRisks: parsed.keyRisks ?? [],
      recommendation: (parsed.recommendation ?? 'caution') as AIRecommendation,
      generatedAt: new Date().toISOString(),
      model,
    };
  } catch {
    return getMockAISummary(property, history, report);
  }
}

function buildRiskPrompt(
  property: PropertyDetails,
  history: OwnershipHistory,
  report: PropertyRiskReport
): string {
  return `Analyze this property for insurance risk:

PROPERTY: ${property.address.fullAddress}
Type: ${property.propertyType}, ${property.beds}bd/${property.baths}ba, ${property.sqft.toLocaleString()} sqft
Built: ${property.yearBuilt} | Estimated Value: ${formatCurrency(property.zestimate)}

OWNERSHIP HISTORY:
- ${history.totalTransfers} total transfers since ${history.oldestRecord.split('T')[0]}
- ${history.flipCount} flip(s) (sold within 24 months)
- ${history.foreclosureCount} foreclosure(s) in chain of title
- ${history.lienCount} lien(s) on record

RISK SCORES (0-100):
- Title Risk: ${report.titleRisk.score}/100 (${getRiskLabel(report.titleRisk.level)})
- Disaster Risk: ${report.disasterRisk.score}/100 (${getRiskLabel(report.disasterRisk.level)}) — Flood Zone ${report.disasterRisk.floodZone}, Fire: ${report.disasterRisk.fireHazardZone}
- Market Risk: ${report.marketRisk.score}/100 (${getRiskLabel(report.marketRisk.level)})
- Overall: ${report.overallScore}/100

Respond with JSON:
{
  "summary": "2-3 sentence risk overview for a buyer considering title insurance",
  "keyRisks": ["specific risk 1", "specific risk 2", "specific risk 3"],
  "recommendation": "proceed" | "caution" | "high-risk" | "avoid"
}`;
}

// Fallback when OpenAI key is not set
function getMockAISummary(
  property: PropertyDetails,
  history: OwnershipHistory,
  report: PropertyRiskReport
): AISummary {
  const { titleRisk, disasterRisk, marketRisk, overallScore } = report;

  let summary = '';
  let recommendation: AIRecommendation = 'proceed';
  const keyRisks: string[] = [];

  if (overallScore <= 25) {
    summary = `${property.address.fullAddress} presents minimal risk for title insurance. The property has a clean ownership history with ${history.totalTransfers} transfer(s), no foreclosures or liens, and sits in a low-hazard natural disaster zone. Standard title insurance coverage should be straightforward to obtain.`;
    recommendation = 'proceed';
  } else if (overallScore <= 50) {
    summary = `${property.address.fullAddress} carries moderate risk warranting careful review. The ownership history includes ${history.flipCount > 0 ? `${history.flipCount} short-term flip(s)` : 'several transfers'} and ${history.lienCount > 0 ? `${history.lienCount} lien(s)` : 'minor title concerns'}. Enhanced title insurance coverage is advisable.`;
    recommendation = 'caution';
  } else if (overallScore <= 75) {
    summary = `${property.address.fullAddress} presents elevated risk. With ${history.foreclosureCount > 0 ? `${history.foreclosureCount} foreclosure(s)` : 'complex ownership history'}, ${history.lienCount} lien(s), and ${history.flipCount} flip(s), a thorough title search and extended coverage policy are strongly recommended before proceeding.`;
    recommendation = 'high-risk';
  } else {
    summary = `${property.address.fullAddress} carries critical risk factors. The chain of title shows ${history.foreclosureCount} foreclosure(s), ${history.lienCount} lien(s), and ${history.flipCount} rapid flip(s). A title attorney review is essential. Obtaining comprehensive title insurance may be difficult or costly.`;
    recommendation = 'avoid';
  }

  if (titleRisk.score > 40) keyRisks.push(`Title chain complexity: ${titleRisk.factors.flipCount} flips, ${titleRisk.factors.foreclosureCount} foreclosures, ${titleRisk.factors.lienCount} liens`);
  if (disasterRisk.floodZone !== 'X') keyRisks.push(`Located in FEMA Flood Zone ${disasterRisk.floodZone} — flood insurance likely required`);
  if (disasterRisk.fireHazardZone !== 'none') keyRisks.push(`${disasterRisk.fireHazardZone.charAt(0).toUpperCase() + disasterRisk.fireHazardZone.slice(1)} Fire Hazard Severity Zone`);
  if (marketRisk.score > 40) keyRisks.push(`Price volatility: ${marketRisk.priceVolatility.toFixed(1)}% standard deviation in historical prices`);
  if (keyRisks.length === 0) keyRisks.push('No significant risk factors identified', 'Standard due diligence recommended', 'Clean title history');

  return {
    summary,
    keyRisks: keyRisks.slice(0, 4),
    recommendation,
    generatedAt: new Date().toISOString(),
    model: 'mock-analysis',
  };
}
