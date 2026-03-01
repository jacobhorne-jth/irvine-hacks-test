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
import type { HazardKey, HazardBreakdown } from '@/lib/nri';

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
  breakdown: Record<HazardKey, HazardBreakdown>;
  dominantHazard: HazardKey;
}

interface TooltipPayload {
  value: number;
  payload: { hazard: HazardKey; contribution: number; eal: number };
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#0D1120] border border-[#1A2035] rounded p-3 font-data shadow-lg min-w-[180px]">
      <p className="text-sm font-bold text-white mb-1">{HAZARD_LABELS[d.hazard]}</p>
      <p className="text-[11px] text-[#94A3B8]">
        Score contribution: <span className="text-white font-semibold">{d.contribution.toFixed(2)}</span>
      </p>
      <p className="text-[11px] text-[#64748B] mt-0.5">
        Avg. annual loss: <span className="text-[#94A3B8]">${(d.eal * 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
      </p>
    </div>
  );
}

export function HazardBreakdownChart({ breakdown, dominantHazard }: Props) {
  const data = (Object.entries(breakdown) as [HazardKey, HazardBreakdown][])
    .map(([hazard, vals]) => ({
      hazard,
      label: HAZARD_LABELS[hazard],
      contribution: vals.contribution,
      eal: vals.eal_building_M,
    }))
    .sort((a, b) => b.contribution - a.contribution);

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1A2035" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#3B4A65', fontFamily: 'var(--font-mono)' }}
            tickLine={false}
            axisLine={false}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#3B4A65', fontFamily: 'var(--font-mono)' }}
            tickLine={false}
            axisLine={false}
            width={30}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1A203540' }} />
          <Bar dataKey="contribution" radius={[3, 3, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.hazard}
                fill={
                  entry.hazard === dominantHazard
                    ? HAZARD_COLORS[entry.hazard]
                    : `${HAZARD_COLORS[entry.hazard]}80`
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
