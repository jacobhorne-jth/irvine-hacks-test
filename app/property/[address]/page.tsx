import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PropertyOverviewCard } from '@/components/property/PropertyOverviewCard';
import { PropertyMap } from '@/components/property/PropertyMap';
import { OwnershipTimeline } from '@/components/timeline/OwnershipTimeline';
import { RiskDashboard } from '@/components/risk/RiskDashboard';
import { RiskHeatmapGrid } from '@/components/risk/RiskHeatmapGrid';
import { PriceHistoryChart } from '@/components/risk/PriceHistoryChart';
import { AISummaryCard } from '@/components/ai/AISummaryCard';
import { SaveToPortfolioButton } from '@/components/portfolio/SaveToPortfolioButton';
import type { PropertyApiResponse, RiskAnalysisApiResponse } from '@/lib/types';

interface PageProps {
  params: { address: string };
}

async function fetchPropertyData(address: string): Promise<PropertyApiResponse | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001';
  try {
    const res = await fetch(
      `${baseUrl}/api/property?address=${encodeURIComponent(address)}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchRiskAnalysis(
  propertyData: PropertyApiResponse
): Promise<RiskAnalysisApiResponse | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${baseUrl}/api/risk-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        property: propertyData.property,
        history: propertyData.history,
        priceHistory: propertyData.priceHistory,
      }),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function PropertyPage({ params }: PageProps) {
  // decode the full address — commas and spaces are preserved from the search form
  const addressQuery = decodeURIComponent(params.address);

  const propertyData = await fetchPropertyData(addressQuery);

  if (!propertyData || propertyData.error) {
    notFound();
  }

  const riskData = await fetchRiskAnalysis(propertyData);

  const { property, history, priceHistory } = propertyData;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Top bar: back nav + save button */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-data text-[#3B4A65] hover:text-[#F5A11C] transition-colors tracking-wider uppercase"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          New search
        </Link>
        {riskData && !riskData.error && (
          <SaveToPortfolioButton
            entry={{
              id: params.address,
              address: addressQuery,
              overallScore: riskData.riskReport.overallScore,
              recommendation: riskData.aiSummary.recommendation,
              propertyType: property.propertyType,
              zestimate: property.zestimate,
              beds: property.beds,
              baths: property.baths,
            }}
          />
        )}
      </div>

      {/* Property overview */}
      <PropertyOverviewCard property={property} />

      {/* Map */}
      <PropertyMap
        latitude={property.latitude}
        longitude={property.longitude}
        address={property.address.fullAddress}
      />

      {/* Risk Dashboard + Heatmap */}
      {riskData && !riskData.error && (
        <section className="space-y-4">
          <p className="text-[10px] font-data text-[#3B4A65] tracking-[0.2em] uppercase">Risk Analysis</p>
          <RiskDashboard report={riskData.riskReport} />
          <RiskHeatmapGrid report={riskData.riskReport} />
        </section>
      )}

      {/* Price history */}
      {priceHistory.length > 1 && <PriceHistoryChart data={priceHistory} />}

      {/* Ownership Timeline */}
      <section className="space-y-3">
        <p className="text-[10px] font-data text-[#3B4A65] tracking-[0.2em] uppercase">Chain of Title</p>
        <OwnershipTimeline history={history} />
      </section>

      {/* AI Summary */}
      {riskData && !riskData.error && (
        <AISummaryCard summary={riskData.aiSummary} />
      )}

      {/* Data disclaimer */}
      <p className="text-[10px] font-data text-[#3B4A65] text-center pb-4 leading-relaxed">
        Property data sourced from ATTOM Data Solutions. Disaster risk assessed by GPT-4o from property coordinates.
        Risk scores are algorithmic estimates for informational use only — not a substitute for professional title search, legal review, or licensed insurance underwriting.
      </p>
    </div>
  );
}

export function generateMetadata({ params }: PageProps) {
  const address = decodeURIComponent(params.address).replace(/-/g, ' ');
  return {
    title: `${address} — PROP.INTEL`,
    description: `Risk analysis and ownership timeline for ${address}`,
  };
}
