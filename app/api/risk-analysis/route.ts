import { NextRequest, NextResponse } from 'next/server';
import { generateRiskReport } from '@/lib/risk-calculator';
import { generateAISummary, fetchLocationRiskData } from '@/lib/openai';
import { scoreToLevel } from '@/lib/utils';
import type { PropertyDetails, OwnershipHistory, PriceHistoryPoint, RiskAnalysisApiResponse } from '@/lib/types';

interface RiskAnalysisRequestBody {
  property: PropertyDetails;
  history: OwnershipHistory;
  priceHistory: PriceHistoryPoint[];
  nriDisasterScore?: number;
}

export async function POST(request: NextRequest) {
  let body: RiskAnalysisRequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { property, history, priceHistory, nriDisasterScore } = body;

  if (!property || !history || !priceHistory) {
    return NextResponse.json(
      { error: 'Request body must include property, history, and priceHistory' },
      { status: 400 }
    );
  }

  try {
    const locationRisk = await fetchLocationRiskData(property);
    const riskReport = generateRiskReport(property, history, priceHistory, locationRisk);

    // Override disaster score with FEMA NRI value when available — more accurate than GPT estimate
    if (nriDisasterScore != null) {
      const nriScore = Math.round(nriDisasterScore);
      riskReport.disasterRisk.score = nriScore;
      riskReport.disasterRisk.level = scoreToLevel(nriScore);
      riskReport.overallScore = Math.round(riskReport.titleRisk.score * 0.5 + nriScore * 0.5);
    }

    const aiSummary = await generateAISummary(property, history, riskReport);

    const result: RiskAnalysisApiResponse = { riskReport, aiSummary };
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[/api/risk-analysis]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
