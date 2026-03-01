import { AlertTriangle, Wind, Flame, Waves, CloudLightning, Mountain, Tornado, Droplets } from 'lucide-react';
import { HazardBreakdownChart } from './HazardBreakdownChart';
import type { CountyDisasterScore, HazardKey } from '@/lib/nri';

const HAZARD_ICONS: Record<HazardKey, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Inland_Flood:  Droplets,
  Hurricane:     Wind,
  Earthquake:    Mountain,
  Tornado:       Tornado,
  Wildfire:      Flame,
  Hail:          CloudLightning,
  Strong_Wind:   Wind,
  Coastal_Flood: Waves,
};

const HAZARD_LABELS: Record<HazardKey, string> = {
  Inland_Flood:  'Inland Flood',
  Hurricane:     'Hurricane',
  Earthquake:    'Earthquake',
  Tornado:       'Tornado',
  Wildfire:      'Wildfire',
  Hail:          'Hail',
  Strong_Wind:   'Strong Wind',
  Coastal_Flood: 'Coastal Flood',
};

const HAZARD_COLORS: Record<HazardKey, string> = {
  Inland_Flood:  '#60A5FA',
  Hurricane:     '#A78BFA',
  Earthquake:    '#F97316',
  Tornado:       '#EF4444',
  Wildfire:      '#F5A11C',
  Hail:          '#22C55E',
  Strong_Wind:   '#06B6D4',
  Coastal_Flood: '#3B82F6',
};

interface Props {
  score: CountyDisasterScore;
  zestimate?: number;
  hazardExplanations?: Record<string, string>;
}

export function DisasterScoreCard({ score, zestimate, hazardExplanations }: Props) {
  const DomIcon = HAZARD_ICONS[score.dominant_hazard] ?? AlertTriangle;

  // Whether we can compute per-property estimates
  const hasPropertyLoss = !!(zestimate && zestimate > 0 && score.buildValue > 0);

  // Sort hazards by contribution descending
  const sortedHazards = (Object.entries(score.breakdown) as [HazardKey, { eal_building_M: number; contribution: number }][])
    .sort((a, b) => b[1].contribution - a[1].contribution);

  return (
    <div className="space-y-4">
      {/* ── Overall score banner ── */}
      <div className="border border-[#1A2035] bg-[#0B0F1C] rounded-lg overflow-hidden">
        <div className="h-1 w-full" style={{ background: score.color }} />

        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Big score */}
          <div className="border border-[#1A2035] rounded-lg px-8 py-5 text-center bg-[#060810] shrink-0">
            <p className="text-xs font-data text-[#AABFCF] tracking-[0.15em] uppercase mb-3">
              Hazard Risk
            </p>
            <p
              className="text-5xl font-extrabold font-data tabular-nums leading-none"
              style={{ color: score.color }}
            >
              {score.overall_score}
            </p>
            <p className="text-xs font-data mt-2" style={{ color: score.color }}>
              {score.tier}
            </p>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-20 bg-[#1A2035]" />

          {/* County info + dominant hazard */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-data text-[#AABFCF] tracking-[0.2em] uppercase mb-1">
              County
            </p>
            <h2 className="text-2xl font-bold text-white leading-tight">
              {score.county} County
            </h2>
            <p className="text-sm font-data text-[#C8D6E2] mt-0.5">
              {score.state} · FIPS {score.fips}
            </p>

            <div className="mt-4 flex items-center gap-2">
              <div
                className="w-7 h-7 rounded flex items-center justify-center shrink-0"
                style={{
                  background: `${HAZARD_COLORS[score.dominant_hazard]}20`,
                  border: `1px solid ${HAZARD_COLORS[score.dominant_hazard]}40`,
                }}
              >
                <DomIcon
                  className="h-3.5 w-3.5"
                  style={{ color: HAZARD_COLORS[score.dominant_hazard] }}
                />
              </div>
              <div>
                <p className="text-xs font-data text-[#AABFCF] tracking-wider uppercase">
                  Dominant hazard
                </p>
                <p className="text-sm font-semibold text-white">
                  {HAZARD_LABELS[score.dominant_hazard]}
                </p>
              </div>
            </div>
          </div>

          {/* Score bar */}
          <div className="shrink-0 w-full sm:w-32">
            <p className="text-xs font-data text-[#AABFCF] tracking-[0.15em] uppercase mb-2">
              vs. national max
            </p>
            <div className="h-2 w-full bg-[#1A2035] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${score.overall_score}%`, background: score.color }}
              />
            </div>
            <p className="text-xs font-data text-[#AABFCF] mt-1 text-right">
              {score.overall_score} / 100
            </p>
          </div>
        </div>
      </div>

      {/* ── Hazard breakdown chart ── */}
      <div className="border border-[#1A2035] bg-[#0B0F1C] rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1A2035]">
          <p className="text-xs font-data text-[#AABFCF] tracking-[0.2em] uppercase mb-0.5">
            Hazard Breakdown
          </p>
          <p className="font-bold text-white" style={{ fontFamily: 'var(--font-syne)' }}>
            Expected Annual Building Loss by Peril
          </p>
        </div>
        <div className="p-6">
          <HazardBreakdownChart
            breakdown={score.breakdown}
            dominantHazard={score.dominant_hazard}
            hazardExplanations={hazardExplanations}
            buildValue={score.buildValue}
            propertyValue={zestimate}
          />
          <p className="text-xs font-data text-[#AABFCF] mt-3 text-center">
            Highlighted bar = dominant hazard · Scores via ridge regression on FEMA county EAL
          </p>
        </div>
      </div>

      {/* ── Hazard table ── */}
      <div className="border border-[#1A2035] bg-[#0B0F1C] rounded-lg overflow-hidden">
        {/* Card header */}
        <div className="px-6 py-4 border-b border-[#1A2035]">
          <div className="flex items-baseline justify-between gap-4 mb-1">
            <p className="font-bold text-white" style={{ fontFamily: 'var(--font-syne)' }}>
              Per-Hazard Detail
            </p>
            <span className="text-[11px] font-data tracking-[0.15em] uppercase px-2 py-0.5 rounded border border-[#F5A11C30] bg-[#F5A11C08] text-[#F5A11C99] shrink-0">
              Ridge Regression · FEMA NRI 2023
            </span>
          </div>
          <p className="text-[11px] font-data text-[#C8D6E2]">
            EAL estimated via ridge regression on county exposure · score = normalized output × hazard weight
            {hasPropertyLoss && ' · Property loss = (EAL ÷ county stock) × AVM'}
          </p>
        </div>

        {/* Column headers */}
        <div className="px-6 py-2 flex items-center gap-4 bg-[#080C15] border-b border-[#1A2035]">
          <div className="w-7 shrink-0" />
          <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
            <p className="text-[11px] font-data text-[#AABFCF] tracking-[0.15em] uppercase">Hazard</p>
            <p className="text-[11px] font-data text-[#AABFCF] tracking-[0.15em] uppercase">Model Score</p>
          </div>
          <div className="shrink-0 text-right min-w-[90px]">
            <p className="text-[11px] font-data text-[#AABFCF] tracking-[0.15em] uppercase">
              {hasPropertyLoss ? 'Est. Annual Loss' : '—'}
            </p>
          </div>
        </div>

        <div className="divide-y divide-[#1A2035]">
          {sortedHazards.map(([hazard, vals]) => {
            const Icon = HAZARD_ICONS[hazard] ?? AlertTriangle;
            const color = HAZARD_COLORS[hazard];
            const maxContrib = sortedHazards[0][1].contribution;
            const pct = maxContrib > 0 ? (vals.contribution / maxContrib) * 100 : 0;

            // Per-property estimate: (hazard EAL / county total building value) × property value
            const hazardEalDollars = vals.eal_building_M * 1_000_000;
            const propLoss = hasPropertyLoss
              ? (hazardEalDollars / score.buildValue) * zestimate!
              : 0;
            const propLossPct = hasPropertyLoss
              ? (hazardEalDollars / score.buildValue) * 100
              : 0;

            const lossLabel = hasPropertyLoss
              ? propLoss >= 1_000
                ? `~$${(propLoss / 1_000).toFixed(1)}K/yr`
                : propLoss >= 1
                ? `~$${propLoss.toFixed(0)}/yr`
                : '<$1/yr'
              : null;

            const pctLabel = hasPropertyLoss && propLossPct > 0
              ? propLossPct < 0.01
                ? `<0.01%/yr`
                : `${propLossPct.toFixed(3)}%/yr`
              : null;

            return (
              <div key={hazard} className="px-6 py-3 flex items-center gap-4">
                <div
                  className="w-7 h-7 rounded flex items-center justify-center shrink-0"
                  style={{ background: `${color}15`, border: `1px solid ${color}25` }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-white">{HAZARD_LABELS[hazard]}</p>
                    <p className="text-xs font-data tabular-nums" style={{ color }}>
                      {vals.contribution.toFixed(2)} pts
                    </p>
                  </div>
                  <div className="h-1.5 w-full bg-[#1A2035] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
                {lossLabel ? (
                  <div className="shrink-0 text-right min-w-[90px]">
                    <p className="text-[11px] font-data tabular-nums" style={{ color }}>
                      {lossLabel}
                    </p>
                    {pctLabel && (
                      <p className="text-xs font-data text-[#AABFCF] tabular-nums">
                        {pctLabel} of value
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] font-data text-[#AABFCF] shrink-0 text-right min-w-[90px]">
                    —
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <div className="px-6 py-3 border-t border-[#1A2035]">
          <p className="text-xs font-data text-[#AABFCF]">
            Source: FEMA NRI (2023) · Score: min-max normalized county EAL × hazard weight, summed to 0–100 ·{' '}
            {hasPropertyLoss
              ? 'Loss: county hazard rate × property AVM — county averages may not reflect individual parcel exposure'
              : 'Expected annual building loss for all structures in the county'}
          </p>
        </div>
      </div>
    </div>
  );
}
