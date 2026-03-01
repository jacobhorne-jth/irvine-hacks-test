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

// AI explainability blurbs — high/low variants per hazard
const HAZARD_EXPLAIN: Record<HazardKey, { high: string; low: string }> = {
  Earthquake: {
    high: 'County sits near active fault systems (e.g. San Andreas or Newport-Inglewood). High seismic EAL reflects significant ground-shaking exposure for local structures.',
    low:  'Low seismic activity in this county. Distant from major active faults; building loss from earthquakes is statistically minimal.',
  },
  Wildfire: {
    high: 'Dry chaparral, Santa Ana wind events, and limited defensible space drive elevated wildfire EAL. WUI neighborhoods are most exposed.',
    low:  'Limited wildland-urban interface and lower fuel load keep wildfire loss potential low for this county.',
  },
  Inland_Flood: {
    high: 'Flash flooding risk is elevated — atmospheric river events and inadequate stormwater infrastructure contribute to high expected annual building losses.',
    low:  'Floodplain exposure is limited in this county; most parcels sit outside FEMA Special Flood Hazard Areas.',
  },
  Hurricane: {
    high: 'County is in or near a hurricane-prone corridor. Storm surge and high-wind damage drive significant expected annual losses.',
    low:  'Direct hurricane landfalls are rare here; contribution to overall risk score is minimal.',
  },
  Tornado: {
    high: 'Tornado frequency and intensity in this county produce notable expected annual building losses compared to national averages.',
    low:  'Tornadoes are uncommon in this region; contribution to building EAL is negligible.',
  },
  Hail: {
    high: 'Frequent severe thunderstorm cells produce damaging hail; roofing and exterior damage losses are above average here.',
    low:  'Hail events are infrequent or low-intensity in this county, resulting in minimal expected annual loss.',
  },
  Strong_Wind: {
    high: 'Recurring high-wind events (derechos, downslope winds) create elevated structural and roof damage exposure across the county.',
    low:  'Wind speeds rarely reach damaging thresholds here; strong-wind EAL contribution is low.',
  },
  Coastal_Flood: {
    high: 'Low-lying coastal elevation and storm-surge exposure push coastal flood EAL above the national median for this county.',
    low:  'Limited coastal low-lying area keeps storm-surge and coastal flood losses well below average.',
  },
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
  hazardExplanations?: Record<string, string>;
}

interface TooltipPayload {
  value: number;
  payload: { hazard: HazardKey; contribution: number; eal: number; explanations?: Record<string, string> };
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
  const color = HAZARD_COLORS[d.hazard];
  // Prefer live AI explanation, fall back to static blurbs
  const aiBlurb = d.explanations?.[d.hazard];
  const staticExplain = HAZARD_EXPLAIN[d.hazard];
  const blurb = aiBlurb ?? (staticExplain ? (d.contribution >= 5 ? staticExplain.high : staticExplain.low) : null);
  return (
    <div
      className="rounded-lg p-3 font-data shadow-xl max-w-[260px]"
      style={{
        background: '#050A14',
        border: `1px solid ${color}40`,
        boxShadow: `0 8px 24px #00000080, 0 0 0 1px ${color}20`,
      }}
    >
      <p className="text-sm font-bold mb-1" style={{ color }}>{HAZARD_LABELS[d.hazard]}</p>
      <p className="text-[11px] text-[#B0C0D0]">
        Score contribution: <span className="text-white font-semibold">{d.contribution.toFixed(2)}</span>
      </p>
      <p className="text-[11px] text-[#B0C0D0] mt-0.5">
        Avg. annual loss: <span className="text-[#B0C0D0]">${(d.eal * 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
      </p>
      {blurb && (
        <p className="text-[10px] text-[#B0C0D0] mt-2 leading-relaxed border-t border-[#1A2035] pt-2">
          {blurb}
        </p>
      )}
    </div>
  );
}

export function HazardBreakdownChart({ breakdown, dominantHazard, hazardExplanations }: Props) {
  const data = (Object.entries(breakdown) as [HazardKey, HazardBreakdown][])
    .map(([hazard, vals]) => ({
      hazard,
      label: HAZARD_LABELS[hazard],
      contribution: vals.contribution,
      eal: vals.eal_building_M,
      explanations: hazardExplanations,
    }))
    .sort((a, b) => b.contribution - a.contribution);

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1A2035" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#8EA5BE', fontFamily: 'var(--font-mono)' }}
            tickLine={false}
            axisLine={false}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#8EA5BE', fontFamily: 'var(--font-mono)' }}
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
