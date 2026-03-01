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
                    <p className="text-[11px] text-[#C8D6E2] mt-0.5">
                      Avg. annual loss:{' '}
                      <span className="text-[#C8D6E2]">
                        ${(d.eal * 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
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

// ── Main export ────────────────────────────────────────────────────────────

export function PortfolioAnalytics({ entries }: { entries: PortfolioEntry[] }) {
  if (entries.length === 0) return null;

  return <AggregatedHazardChart entries={entries} />;
}
