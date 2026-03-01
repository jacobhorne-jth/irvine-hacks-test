'use client';

import { useState } from 'react';
import { OwnershipTimeline } from '@/components/timeline/OwnershipTimeline';
import { PriceHistoryChart } from '@/components/risk/PriceHistoryChart';
import { DisasterScoreCard } from '@/components/disaster/DisasterScoreCard';
import { RiskVerdictBanner } from '@/components/risk/RiskVerdictBanner';
import type { OwnershipHistory, PriceHistoryPoint, PropertyRiskReport, AISummary } from '@/lib/types';
import type { CountyDisasterScore } from '@/lib/nri';

type Tab = 'title' | 'hazard';

interface PropertyDetailTabsProps {
  history: OwnershipHistory;
  priceHistory: PriceHistoryPoint[];
  riskReport: PropertyRiskReport;
  summary: AISummary;
  nriRisk?: (CountyDisasterScore & { hazardExplanations?: Record<string, string> }) | null;
  zestimate: number;
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'title',  label: 'Title Risk' },
  { id: 'hazard', label: 'Hazard Risk' },
];

export function PropertyDetailTabs({
  history,
  priceHistory,
  riskReport,
  summary,
  nriRisk,
  zestimate,
}: PropertyDetailTabsProps) {
  const [active, setActive] = useState<Tab>('title');

  return (
    <div className="border border-[#1A2035] bg-[#0B0F1C] rounded-lg overflow-hidden">

      {/* ── Tab bar ── */}
      <div className="flex items-center gap-2 border-b border-[#1A2035] px-4 py-3 bg-[#060810]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`px-5 py-2 text-sm font-bold font-data rounded transition-all tracking-wide ${
              active === tab.id
                ? 'bg-[#F5A11C] text-[#080B14] shadow-[0_0_12px_#F5A11C60]'
                : 'text-[#6B7FA8] border border-[#1A2035] bg-[#0B0F1C] hover:border-[#F5A11C]/50 hover:text-[#F5A11C] hover:bg-[#F5A11C]/8'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="p-4 space-y-4">
        {active === 'title' ? (
          <>
            <RiskVerdictBanner report={riskReport} summary={summary} />
            <section className="space-y-3">
              <p className="text-xs font-data text-[#AABFCF] tracking-[0.2em] uppercase">
                Chain of Title
              </p>
              <OwnershipTimeline history={history} avmValue={zestimate} />
            </section>
            {priceHistory.length > 1 && (
              <section className="space-y-3">
                <p className="text-xs font-data text-[#AABFCF] tracking-[0.2em] uppercase">
                  Price History
                </p>
                <PriceHistoryChart data={priceHistory} avmValue={zestimate} />
              </section>
            )}
            {/* Title risk breakdown bullets */}
            <section className="space-y-2">
              <p className="text-xs font-data text-[#AABFCF] tracking-[0.2em] uppercase">
                Title Risk Factors
              </p>
              <div className="border border-[#1A2035] rounded-lg divide-y divide-[#1A2035]">
                {riskReport.titleRisk.breakdown.map((factor) => (
                  <div key={factor.label} className="flex items-center justify-between px-4 py-3 gap-4">
                    <p className="text-xs font-data text-[#C8D6E2] leading-snug">{factor.description}</p>
                    <span
                      className="shrink-0 text-xs font-bold font-data px-2 py-0.5 rounded border tabular-nums"
                      style={{
                        color: factor.points > 0 ? '#F97316' : '#22C55E',
                        borderColor: factor.points > 0 ? '#F9731640' : '#22C55E40',
                        background: factor.points > 0 ? '#F9731612' : '#22C55E12',
                      }}
                    >
                      {factor.points > 0 ? `+${factor.points}` : '0'} pts
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            {nriRisk ? (
              <DisasterScoreCard
                score={nriRisk}
                zestimate={zestimate}
                hazardExplanations={nriRisk.hazardExplanations}
              />
            ) : (
              <div className="py-12 text-center text-sm font-data text-[#AABFCF]">
                No hazard data available for this location.
              </div>
            )}
            {/* Disaster breakdown bullets — only shown when NRI data is unavailable */}
            {!nriRisk && (
              <section className="space-y-2">
                <p className="text-xs font-data text-[#AABFCF] tracking-[0.2em] uppercase">
                  Hazard Risk Factors
                </p>
                <div className="border border-[#1A2035] rounded-lg divide-y divide-[#1A2035]">
                  {riskReport.disasterRisk.breakdown.map((factor) => (
                    <div key={factor.label} className="flex items-center justify-between px-4 py-3 gap-4">
                      <p className="text-xs font-data text-[#C8D6E2] leading-snug">{factor.description}</p>
                      <span
                        className="shrink-0 text-xs font-bold font-data px-2 py-0.5 rounded border tabular-nums"
                        style={{
                          color: factor.points > 10 ? '#F97316' : '#F5A11C',
                          borderColor: factor.points > 10 ? '#F9731640' : '#F5A11C40',
                          background: factor.points > 10 ? '#F9731612' : '#F5A11C12',
                        }}
                      >
                        {factor.points} pts
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
