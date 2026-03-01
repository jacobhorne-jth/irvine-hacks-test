import { AlertTriangle, Wind, Flame, Waves, CloudLightning, Mountain, Tornado, Droplets, CloudRain } from 'lucide-react';
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
}

export function DisasterScoreCard({ score, zestimate }: Props) {
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
          <div className="flex flex-col items-center gap-1 shrink-0">
            <p className="text-[10px] font-data text-[#3B4A65] tracking-[0.2em] uppercase">
              Risk Score
            </p>
            <p
              className="text-6xl font-extrabold font-data tabular-nums leading-none"
              style={{ color: score.color }}
            >
              {score.overall_score}
            </p>
            <span
              className="text-xs font-data font-bold px-2.5 py-1 rounded-full border tracking-wide uppercase mt-1"
              style={{
                color: score.color,
                borderColor: `${score.color}40`,
                background: `${score.color}15`,
              }}
            >
              {score.tier}
            </span>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-20 bg-[#1A2035]" />

          {/* County info + dominant hazard */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-data text-[#3B4A65] tracking-[0.2em] uppercase mb-1">
              County
            </p>
            <h2 className="text-2xl font-bold text-white leading-tight">
              {score.county} County
            </h2>
            <p className="text-sm font-data text-[#64748B] mt-0.5">
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
                <p className="text-[10px] font-data text-[#3B4A65] tracking-wider uppercase">
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
            <p className="text-[10px] font-data text-[#3B4A65] tracking-[0.15em] uppercase mb-2">
              vs. national max
            </p>
            <div className="h-2 w-full bg-[#1A2035] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${score.overall_score}%`, background: score.color }}
              />
            </div>
            <p className="text-[10px] font-data text-[#3B4A65] mt-1 text-right">
              {score.overall_score} / 100
            </p>
          </div>
        </div>
      </div>

      {/* ── Hazard breakdown chart ── */}
      <div className="border border-[#1A2035] bg-[#0B0F1C] rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1A2035]">
          <p className="text-[10px] font-data text-[#3B4A65] tracking-[0.2em] uppercase mb-0.5">
            Hazard Breakdown
          </p>
          <p className="font-bold text-white" style={{ fontFamily: 'var(--font-syne)' }}>
            Expected Annual Building Loss by Peril
          </p>
        </div>
        <div className="p-6">
          <HazardBreakdownChart breakdown={score.breakdown} dominantHazard={score.dominant_hazard} />
          <p className="text-[10px] font-data text-[#3B4A65] mt-3 text-center">
            Highlighted bar = dominant hazard · Scores weighted by actuarial model
          </p>
        </div>
      </div>

      {/* ── Hazard table ── */}
      <div className="border border-[#1A2035] bg-[#0B0F1C] rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1A2035] flex items-baseline justify-between gap-4">
          <p className="font-bold text-white" style={{ fontFamily: 'var(--font-syne)' }}>
            Per-Hazard Detail
          </p>
          {hasPropertyLoss && (
            <p className="text-[10px] font-data text-[#3B4A65] shrink-0">
              est. annual loss for this property
            </p>
          )}
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
                      <p className="text-[10px] font-data text-[#3B4A65] tabular-nums">
                        {pctLabel} of value
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] font-data text-[#3B4A65] shrink-0 text-right min-w-[90px]">
                    —
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <div className="px-6 py-3 border-t border-[#1A2035]">
          <p className="text-[10px] font-data text-[#3B4A65]">
            Source: FEMA National Risk Index (2023) ·{' '}
            {hasPropertyLoss
              ? 'Per-property loss estimated from county risk rate × property value — county averages may not reflect individual parcel exposure'
              : 'Expected annual building loss for structures in the county'}
          </p>
        </div>
      </div>
    </div>
  );
}
