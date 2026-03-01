import { ArrowLeft, CheckCircle, AlertTriangle, AlertCircle, XCircle, SearchX } from 'lucide-react';
import Link from 'next/link';
import { AddressSearchForm } from '@/components/search/AddressSearchForm';
import { PropertyOverviewCard } from '@/components/property/PropertyOverviewCard';
import { PropertyMap } from '@/components/property/PropertyMap';
import { OwnershipTimeline } from '@/components/timeline/OwnershipTimeline';
import { RiskHeatmapGrid } from '@/components/risk/RiskHeatmapGrid';
import { PriceHistoryChart } from '@/components/risk/PriceHistoryChart';
import { AISummaryCard } from '@/components/ai/AISummaryCard';
import { SaveToPortfolioButton } from '@/components/portfolio/SaveToPortfolioButton';
import { DisasterScoreCard } from '@/components/disaster/DisasterScoreCard';
import { getRiskLabel, getRiskColor } from '@/lib/utils';
import type { PropertyApiResponse, RiskAnalysisApiResponse, PropertyRiskReport, AISummary } from '@/lib/types';
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
  const nriRisk = (propertyData as unknown as { nriRisk?: CountyDisasterScore }).nriRisk;

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

      {/* ── Property overview ── */}
      <PropertyOverviewCard property={property} />

      {/* ── Chain of title ── */}
      <section className="space-y-3">
        <p className="text-[10px] font-data text-ghost tracking-[0.2em] uppercase">Chain of Title</p>
        <OwnershipTimeline history={history} />
      </section>

      {/* ── Map ── */}
      <PropertyMap
        latitude={property.latitude}
        longitude={property.longitude}
        address={property.address.fullAddress}
      />

      {/* ── Price history ── */}
      {priceHistory.length > 1 && <PriceHistoryChart data={priceHistory} />}

      {/* ── Risk verdict + factor breakdown (title + disaster only) ── */}
      {riskData && !riskData.error && (
        <section className="space-y-4">
          <RiskVerdictBanner report={riskData.riskReport} summary={riskData.aiSummary} />
          <p className="text-[10px] font-data text-ghost tracking-[0.2em] uppercase">Risk Breakdown</p>
          <RiskHeatmapGrid report={riskData.riskReport} />
        </section>
      )}

      {/* ── NRI Natural Disaster Risk ── */}
      {nriRisk && (
        <section className="space-y-3">
          <p className="text-[10px] font-data text-ghost tracking-[0.2em] uppercase">Natural Disaster Risk</p>
          <DisasterScoreCard score={nriRisk} zestimate={property.zestimate} />
        </section>
      )}

      {/* ── AI Summary ── */}
      {riskData && !riskData.error && (
        <AISummaryCard summary={riskData.aiSummary} />
      )}

      {/* ── Disclaimer ── */}
      <p className="text-[10px] font-data text-ghost text-center pb-4 leading-relaxed">
        Property data sourced from ATTOM Data Solutions. Disaster risk assessed by AI from property coordinates.
        Risk scores are algorithmic estimates for informational use only — not a substitute for professional title search, legal review, or licensed insurance underwriting.
      </p>
    </div>
  );
}

// ── Risk Verdict Banner ────────────────────────────────────────────────────
// Surfaces the most critical output — overall score, level, recommendation,
// and the three sub-scores — before any property detail noise.

const REC_CONFIG: Record<string, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = {
  proceed:     { label: 'Proceed',                  icon: CheckCircle,   color: '#22C55E' },
  caution:     { label: 'Proceed with Caution',     icon: AlertTriangle, color: '#F59E0B' },
  'high-risk': { label: 'High Risk — Review',       icon: AlertCircle,   color: '#F97316' },
  avoid:       { label: 'Avoid / Consult Attorney', icon: XCircle,       color: '#EF4444' },
};

function RiskVerdictBanner({
  report,
  summary,
}: {
  report: PropertyRiskReport;
  summary: AISummary;
}) {
  const { titleRisk } = report;
  const rec = REC_CONFIG[summary.recommendation] ?? REC_CONFIG['caution'];
  const RecIcon = rec.icon;
  const accentColor = getRiskColor(titleRisk.level);

  // Top 2 factors by points — used as the inline explanation bullets
  const topFactors = [...titleRisk.breakdown]
    .sort((a, b) => b.points - a.points)
    .slice(0, 2);

  return (
    <div className="relative border border-line bg-surface rounded-lg overflow-hidden reveal">
      <div className="h-1 w-full" style={{ background: accentColor }} />

      <div className="px-6 py-6 flex items-center gap-6">
        {/* Title risk score */}
        <div className="border border-line rounded-lg px-8 py-5 text-center bg-surface-deep shrink-0">
          <p className="text-[10px] font-data text-ghost tracking-[0.15em] uppercase mb-3">
            Title Risk
          </p>
          <p
            className="text-5xl font-extrabold font-data leading-none tabular-nums"
            style={{ color: accentColor }}
          >
            {titleRisk.score}
          </p>
          <p className="text-xs font-data mt-2" style={{ color: accentColor }}>
            {getRiskLabel(titleRisk.level)}
          </p>
        </div>

        {/* Key contributors */}
        <div className="flex-1 space-y-2.5">
          {topFactors.map((factor) => (
            <div key={factor.label} className="flex items-start gap-2.5">
              <span
                className="mt-0.5 shrink-0 text-[9px] font-bold font-data px-1.5 py-0.5 rounded border tabular-nums"
                style={{
                  color: accentColor,
                  borderColor: `${accentColor}40`,
                  background: `${accentColor}12`,
                }}
              >
                {factor.points} pts
              </span>
              <p className="text-xs font-data text-[#94A3B8] leading-snug">
                {factor.description}
              </p>
            </div>
          ))}
        </div>

        {/* Recommendation badge */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <p className="text-[10px] font-data text-ghost tracking-[0.2em] uppercase">
            Risk Assessment
          </p>
          <span
            className="inline-flex items-center gap-1.5 text-xs font-bold font-data px-3 py-1.5 rounded border tracking-wide uppercase"
            style={{
              color: rec.color,
              borderColor: `${rec.color}40`,
              background: `${rec.color}12`,
            }}
          >
            <RecIcon className="h-3.5 w-3.5" />
            {rec.label}
          </span>
        </div>
      </div>
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
        <p>· Example: <span className="text-[#64748B]">2201 W Ball Rd, Anaheim, CA 92804</span></p>
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
