'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { RefreshCw } from 'lucide-react';
import type { PortfolioEntry } from './SaveToPortfolioButton';

const HAZARD_ICONS: Record<string, string> = {
  Inland_Flood:  '💧',
  Hurricane:     '🌀',
  Earthquake:    '⛰',
  Tornado:       '🌪',
  Wildfire:      '🔥',
  Hail:          '⛈',
  Strong_Wind:   '💨',
  Coastal_Flood: '🌊',
};

const HAZARD_COLORS: Record<string, string> = {
  Inland_Flood:  '#60A5FA',
  Hurricane:     '#A78BFA',
  Earthquake:    '#F97316',
  Tornado:       '#EF4444',
  Wildfire:      '#F5A11C',
  Hail:          '#22C55E',
  Strong_Wind:   '#06B6D4',
  Coastal_Flood: '#3B82F6',
};

const HAZARD_LABELS: Record<string, string> = {
  Inland_Flood:  'Inland Flood',
  Hurricane:     'Hurricane',
  Earthquake:    'Earthquake',
  Tornado:       'Tornado',
  Wildfire:      'Wildfire',
  Hail:          'Hail',
  Strong_Wind:   'Strong Wind',
  Coastal_Flood: 'Coastal Flood',
};

const CHART_TICK = { fontSize: 10, fill: '#AABFCF', fontFamily: 'var(--font-mono)' } as const;
const CHART_GRID   = '#1A2035';
const CHART_CURSOR = '#1A203540';
const TOOLTIP_BG   = '#050A14';

// ── Aggregated hazard exposure (like HazardBreakdownChart, but averaged) ──

function AggregatedHazardChart({ entries }: { entries: PortfolioEntry[] }) {
  const withData = entries.filter((e) => e.hazardBreakdown != null);

  if (withData.length === 0) {
    return (
      <div className="border border-line bg-surface rounded-lg p-5 reveal">
        <p className="text-[11px] font-data text-ghost tracking-[0.2em] uppercase mb-1">
          Hazard Breakdown
        </p>
        <p className="text-base font-bold text-white mb-4" style={{ fontFamily: 'var(--font-syne)' }}>
          Avg. Annual Building Loss by Peril
        </p>
        <div className="h-64 flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line">
          <RefreshCw className="h-5 w-5 text-ghost" />
          <p className="text-xs font-data text-ghost text-center leading-relaxed">
            Loading hazard data…
          </p>
        </div>
        <p className="text-xs font-data text-ghost text-center mt-3">
          Highlighted bar = dominant hazard · Scores via ridge regression on FEMA county EAL
        </p>
      </div>
    );
  }

  const totals: Record<string, { contrib: number; eal: number; count: number }> = {};
  for (const entry of withData) {
    for (const [hazard, vals] of Object.entries(entry.hazardBreakdown!)) {
      if (!totals[hazard]) totals[hazard] = { contrib: 0, eal: 0, count: 0 };
      totals[hazard].contrib += vals.contribution;
      totals[hazard].eal    += vals.eal_building_M;
      totals[hazard].count  += 1;
    }
  }

  const data = Object.entries(totals)
    .map(([hazard, v]) => ({
      hazard,
      label:        HAZARD_LABELS[hazard] ?? hazard,
      contribution: parseFloat((v.contrib / v.count).toFixed(2)),
      eal:          v.eal / v.count,
    }))
    .sort((a, b) => b.contribution - a.contribution);

  const topHazard = data[0]?.hazard ?? '';

  return (
    <div className="border border-line bg-surface rounded-lg p-5 reveal">
      <p className="text-[11px] font-data text-ghost tracking-[0.2em] uppercase mb-1">
        Hazard Breakdown
      </p>
      <p className="text-base font-bold text-white mb-1" style={{ fontFamily: 'var(--font-syne)' }}>
        Avg. Annual Building Loss by Peril
      </p>
      <p className="text-xs font-data text-dim mb-4">
        Averaged across {withData.length} propert{withData.length === 1 ? 'y' : 'ies'} in portfolio
      </p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
            <XAxis
              dataKey="label"
              tick={CHART_TICK}
              tickLine={false}
              axisLine={false}
              angle={-35}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              tick={CHART_TICK}
              tickLine={false}
              axisLine={false}
              width={30}
            />
            <Tooltip
              cursor={{ fill: CHART_CURSOR }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                const color = HAZARD_COLORS[d.hazard] ?? '#AABFCF';
                return (
                  <div className="rounded-lg p-3 font-data shadow-xl max-w-[260px]"
                    style={{ background: TOOLTIP_BG, border: `1px solid ${color}40`, boxShadow: `0 8px 24px #00000080, 0 0 0 1px ${color}20` }}>
                    <p className="text-sm font-bold mb-1" style={{ color }}>{d.label}</p>
                    <p className="text-[11px] text-[#C8D6E2]">
                      Avg. score contribution:{' '}
                      <span className="text-white font-semibold">{d.contribution.toFixed(2)}</span>
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="contribution" radius={[3, 3, 0, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.hazard}
                  fill={
                    entry.hazard === topHazard
                      ? (HAZARD_COLORS[entry.hazard] ?? '#AABFCF')
                      : `${HAZARD_COLORS[entry.hazard] ?? '#AABFCF'}80`
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[11px] font-data text-dim text-center mt-1">
        Highlighted bar = dominant hazard · Scores via ridge regression on FEMA county EAL
      </p>
    </div>
  );
}

// ── Per-hazard loss table (portfolio aggregate) ────────────────────────────

function HazardLossTable({ entries }: { entries: PortfolioEntry[] }) {
  // Only include entries that have all three values needed for the loss formula:
  //   hazardBreakdown  — per-hazard EAL from NRI lookup
  //   buildValue       — total county building stock value (for scaling the county EAL)
  //   zestimate        — property AVM value (the numerator of the scaled loss)
  // Entries saved before buildValue was added are backfilled automatically on page load.
  const scalable = entries.filter(
    (e) => e.hazardBreakdown && e.buildValue && e.buildValue > 0 && e.zestimate > 0
  );
  if (scalable.length === 0) return null;

  // For each hazard, compute avg per-property annual loss across scalable entries
  const hazards = Object.keys(scalable[0].hazardBreakdown!);

  const rows = hazards.map((hazard) => {
    let totalLoss = 0;
    let totalContrib = 0;
    let count = 0;
    for (const e of scalable) {
      const h = e.hazardBreakdown![hazard];
      if (!h) continue;
      // Per-property loss: (hazard_EAL_$ / county_building_stock_$) × property_AVM_$
      const propLoss = (h.eal_building_M * 1_000_000 / e.buildValue!) * e.zestimate;
      totalLoss += propLoss;
      totalContrib += h.contribution;
      count++;
    }
    const avgContrib = count > 0 ? totalContrib / count : 0;
    return { hazard, totalLoss, avgContrib };
  }).sort((a, b) => b.avgContrib - a.avgContrib);

  const maxContrib = rows[0]?.avgContrib ?? 1;

  const lossLabel = (v: number) =>
    v >= 1_000 ? `~$${(v / 1_000).toFixed(1)}K/yr`
    : v >= 1   ? `~$${v.toFixed(0)}/yr`
    : '<$1/yr';

  return (
    <div className="border border-line bg-surface rounded-lg overflow-hidden reveal">
      {/* Card header */}
      <div className="px-6 py-4 border-b border-line">
        <div className="flex items-baseline justify-between gap-4 mb-1">
          <p className="font-bold text-white" style={{ fontFamily: 'var(--font-syne)' }}>
            Per-Hazard Detail
          </p>
          <span className="text-[9px] font-data tracking-[0.15em] uppercase px-2 py-0.5 rounded border border-[#F5A11C30] bg-[#F5A11C08] text-[#F5A11C99] shrink-0">
            Ridge Regression · FEMA NRI 2023
          </span>
        </div>
        <p className="text-[11px] font-data text-dim">
          EAL estimated via ridge regression on county exposure · Property loss = (EAL ÷ county stock) × AVM
        </p>
      </div>

      {/* Column headers */}
      <div className="px-6 py-2 flex items-center gap-4 bg-[#080C15] border-b border-line">
        <div className="w-7 shrink-0" />
        <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
          <p className="text-[9px] font-data text-ghost tracking-[0.15em] uppercase">Hazard</p>
          <p className="text-[9px] font-data text-ghost tracking-[0.15em] uppercase">Model Score</p>
        </div>
        <div className="shrink-0 text-right min-w-[100px]">
          <p className="text-[9px] font-data text-ghost tracking-[0.15em] uppercase">Est. Annual Loss</p>
        </div>
      </div>

      <div className="divide-y divide-line">
        {rows.map(({ hazard, totalLoss, avgContrib }) => {
          const color = HAZARD_COLORS[hazard] ?? '#AABFCF';
          const label = HAZARD_LABELS[hazard] ?? hazard;
          const icon  = HAZARD_ICONS[hazard] ?? '•';
          const pct   = maxContrib > 0 ? (avgContrib / maxContrib) * 100 : 0;
          const totalPortfolioValue = scalable.reduce((s, e) => s + e.zestimate, 0);
          const propLossPct = totalPortfolioValue > 0 ? (totalLoss / totalPortfolioValue) * 100 : 0;

          return (
            <div key={hazard} className="px-6 py-3 flex items-center gap-4">
              <div
                className="w-7 h-7 rounded flex items-center justify-center shrink-0 text-sm"
                style={{ background: `${color}15`, border: `1px solid ${color}25` }}
              >
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs font-data tabular-nums" style={{ color }}>
                    {avgContrib.toFixed(2)} pts
                  </p>
                </div>
                <div className="h-1.5 w-full bg-[#1A2035] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
              <div className="shrink-0 text-right min-w-[100px]">
                <p className="text-[11px] font-data tabular-nums" style={{ color }}>
                  {lossLabel(totalLoss)}
                </p>
                {propLossPct > 0 && (
                  <p className="text-[10px] font-data text-ghost tabular-nums">
                    {propLossPct < 0.01 ? '<0.01' : propLossPct.toFixed(3)}%/yr of value
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-6 py-3 border-t border-line">
        <p className="text-[10px] font-data text-ghost">
          Source: FEMA NRI (2023) · Score: min-max normalized county EAL × hazard weight, summed to 0–100 · Loss: county hazard rate × property AVM · Totalled across {scalable.length} propert{scalable.length === 1 ? 'y' : 'ies'}
        </p>
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────

export function PortfolioAnalytics({ entries }: { entries: PortfolioEntry[] }) {
  if (entries.length === 0) return null;

  return <HazardLossTable entries={entries} />;
}
