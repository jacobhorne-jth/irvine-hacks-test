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
          Highlighted bar = dominant hazard · Scores weighted by actuarial model
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
      <p className="text-xs font-data text-ghost text-center mt-1">
        Highlighted bar = dominant hazard · Scores weighted by actuarial model
      </p>
    </div>
  );
}

// ── Per-hazard loss table (portfolio aggregate) ────────────────────────────

function HazardLossTable({ entries }: { entries: PortfolioEntry[] }) {
  // Only entries with full data for scaling
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
      const propLoss = (h.eal_building_M * 1_000_000 / e.buildValue!) * e.zestimate;
      totalLoss += propLoss;
      totalContrib += h.contribution;
      count++;
    }
    const avgLoss = count > 0 ? totalLoss / count : 0;
    const avgContrib = count > 0 ? totalContrib / count : 0;
    return { hazard, avgLoss, avgContrib };
  }).sort((a, b) => b.avgContrib - a.avgContrib);

  const maxContrib = rows[0]?.avgContrib ?? 1;

  const lossLabel = (v: number) =>
    v >= 1_000 ? `~$${(v / 1_000).toFixed(1)}K/yr`
    : v >= 1   ? `~$${v.toFixed(0)}/yr`
    : '<$1/yr';

  return (
    <div className="border border-line bg-surface rounded-lg overflow-hidden reveal">
      <div className="px-6 py-4 border-b border-line flex items-baseline justify-between gap-4">
        <p className="font-bold text-white" style={{ fontFamily: 'var(--font-syne)' }}>
          Per-Hazard Detail
        </p>
        <p className="text-[10px] font-data text-ghost shrink-0">
          avg. annual loss across portfolio
        </p>
      </div>
      <div className="divide-y divide-line">
        {rows.map(({ hazard, avgLoss, avgContrib }) => {
          const color = HAZARD_COLORS[hazard] ?? '#AABFCF';
          const label = HAZARD_LABELS[hazard] ?? hazard;
          const icon  = HAZARD_ICONS[hazard] ?? '•';
          const pct   = maxContrib > 0 ? (avgContrib / maxContrib) * 100 : 0;
          const propLossPct = scalable.length > 0
            ? scalable.reduce((s, e) => {
                const h = e.hazardBreakdown![hazard];
                return s + (h ? (h.eal_building_M * 1_000_000 / e.buildValue!) * 100 : 0);
              }, 0) / scalable.length
            : 0;

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
                  {lossLabel(avgLoss)}
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
          Source: FEMA National Risk Index (2023) · Per-property loss estimated from county risk rate × AVM value · Averaged across {scalable.length} propert{scalable.length === 1 ? 'y' : 'ies'}
        </p>
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────

export function PortfolioAnalytics({ entries }: { entries: PortfolioEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div className="space-y-4">
      <AggregatedHazardChart entries={entries} />
      <HazardLossTable entries={entries} />
    </div>
  );
}
