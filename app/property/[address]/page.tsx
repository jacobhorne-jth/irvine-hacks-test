import { ArrowLeft, SearchX } from 'lucide-react';
import Link from 'next/link';
import { AddressSearchForm } from '@/components/search/AddressSearchForm';
import { PropertyOverviewCard } from '@/components/property/PropertyOverviewCard';
import { PropertyMap } from '@/components/property/PropertyMap';
import { AISummaryCard } from '@/components/ai/AISummaryCard';
import { SaveToPortfolioButton } from '@/components/portfolio/SaveToPortfolioButton';
import { PropertyDetailTabs } from '@/components/property/PropertyDetailTabs';
import type { PropertyApiResponse, RiskAnalysisApiResponse } from '@/lib/types';
import type { CountyDisasterScore } from '@/lib/nri';

interface PageProps {
  params: { address: string };
}

async function fetchPropertyData(address: string): Promise<PropertyApiResponse | null> {
  const port = process.env.PORT ?? '3000';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `http://localhost:${port}`;
  try {
    const res = await fetch(
      `${baseUrl}/api/property?address=${encodeURIComponent(address)}`,
      { cache: 'no-store' }
    );
    // Always parse JSON — error responses carry a message we want to show
    return res.json();
  } catch {
    return null;
  }
}

async function fetchRiskAnalysis(
  propertyData: PropertyApiResponse
): Promise<RiskAnalysisApiResponse | null> {
  const port = process.env.PORT ?? '3000';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `http://localhost:${port}`;
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
  const addressQuery = decodeURIComponent(params.address);

  const propertyData = await fetchPropertyData(addressQuery);

  if (!propertyData || propertyData.error) {
    return <PropertyNotFound address={addressQuery} message={propertyData?.error} />;
  }

  const riskData = await fetchRiskAnalysis(propertyData);

  const { property, history, priceHistory } = propertyData;
  const nriRiskRaw = (propertyData as unknown as { nriRisk?: CountyDisasterScore & { hazardExplanations?: Record<string, string> } }).nriRisk;
  const nriRisk = nriRiskRaw ?? null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">

      {/* ── Navigation bar ── */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-data text-ghost hover:text-amber transition-colors tracking-wider uppercase"
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

      {/* ── Property overview + Map side by side ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch">
        <div className="lg:col-span-3">
          <PropertyOverviewCard property={property} />
        </div>
        <div className="lg:col-span-2 h-full min-h-[220px]">
          <PropertyMap
            latitude={property.latitude}
            longitude={property.longitude}
            address={property.address.fullAddress}
          />
        </div>
      </div>

      {/* ── AI Summary ── */}
      {riskData && !riskData.error && (
        <AISummaryCard summary={riskData.aiSummary} />
      )}

      {/* ── Tabbed detail: Title Risk / Hazard Risk ── */}
      {riskData && !riskData.error && (
        <PropertyDetailTabs
          history={history}
          priceHistory={priceHistory}
          riskReport={riskData.riskReport}
          summary={riskData.aiSummary}
          nriRisk={nriRisk}
          zestimate={property.zestimate}
        />
      )}

      {/* ── Disclaimer ── */}
      <p className="text-[10px] font-data text-ghost text-center pb-4 leading-relaxed">
        Property data sourced from ATTOM Data Solutions. Disaster risk assessed by AI from property coordinates.
        Risk scores are algorithmic estimates for informational use only — not a substitute for professional title search, legal review, or licensed insurance underwriting.
      </p>
    </div>
  );
}


// ── Property Not Found ────────────────────────────────────────────────────

function PropertyNotFound({ address, message }: { address: string; message?: string }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 flex flex-col items-center text-center gap-6">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ background: '#F9731615', border: '1px solid #F9731630' }}
      >
        <SearchX className="h-7 w-7" style={{ color: '#F97316' }} />
      </div>

      <div className="space-y-2">
        <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-syne)' }}>
          Property not found
        </h1>
        <p className="text-sm font-data text-[#64748B]">
          No records found for{' '}
          <span className="text-[#94A3B8] font-semibold">&ldquo;{address}&rdquo;</span>
        </p>
        {message && !message.includes(address) && (
          <p className="text-xs font-data text-[#3B4A65] mt-1">{message}</p>
        )}
      </div>

      <div
        className="w-full rounded-lg border border-[#1A2035] bg-[#0B0F1C] p-4 text-left text-xs font-data text-[#3B4A65] space-y-1"
      >
        <p className="text-[#475569] font-semibold mb-2">Tips for a better match:</p>
        <p>· Include full street number, name, city, state and zip</p>
        <p>· Example: <span className="text-[#64748B]">1642 Peacock Ave, Sunnyvale, CA 94087</span></p>
        <p>· Avoid abbreviations — use <span className="text-[#64748B]">Street</span> not <span className="text-[#64748B]">St</span></p>
      </div>

      <AddressSearchForm />

      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-data text-[#3B4A65] hover:text-[#F5A11C] transition-colors tracking-wider uppercase"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to home
      </Link>
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
