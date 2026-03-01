'use client';

import type { PropertyRiskReport } from '@/lib/types';

interface RiskHeatmapGridProps {
  report: PropertyRiskReport;
}

const LEVELS = [
  { max: 10, color: '#22C55E', label: 'LOW' },
  { max: 20, color: '#F59E0B', label: 'MED' },
  { max: 30, color: '#F97316', label: 'HIGH' },
  { max: Infinity, color: '#EF4444', label: 'CRIT' },
];

function getLevel(points: number) {
  return LEVELS.find((l) => points < l.max) ?? LEVELS[LEVELS.length - 1];
}

const CATEGORIES = [
  {
    key: 'title',
    label: 'Title Risk',
    accent: '#A78BFA',
    breakdownKey: 'titleRisk' as const,
  },
];

export function RiskHeatmapGrid({ report }: RiskHeatmapGridProps) {
  return (
    <div className="border border-[#1A2035] bg-[#0B0F1C] rounded-lg overflow-hidden reveal">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#1A2035] flex items-center justify-between">
        <div>
          <p className="text-[10px] font-data text-[#3B4A65] tracking-[0.2em] uppercase">
            Risk Factor Matrix
          </p>
          <p className="text-[11px] font-data text-[#64748B] mt-0.5">
            All risk sub-factors scored 0–30+
          </p>
        </div>
        {/* Legend */}
        <div className="hidden sm:flex items-center gap-3">
          {LEVELS.map((l) => (
            <div key={l.label} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
              <span className="text-[9px] font-data text-[#3B4A65] tracking-wider">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: 3 columns */}
      <div className="grid grid-cols-1 divide-[#1A2035]">
        {CATEGORIES.map(({ label, accent, breakdownKey, badge }) => {
          const { breakdown, score } = report[breakdownKey];
          return (
            <div key={breakdownKey} className="p-5 space-y-4">
              {/* Column header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-bold font-data tracking-[0.15em] uppercase"
                    style={{ color: accent }}
                  >
                    {label}
                  </span>
                  {badge && (
                    <span className="text-[9px] font-data px-1.5 py-0.5 rounded border border-[#60A5FA]/30 bg-[#60A5FA]/10 text-[#60A5FA]">
                      {badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-bold font-data text-white">{score}/100</span>
              </div>

              {/* Factor rows */}
              <div className="space-y-3">
                {breakdown.map((item, i) => {
                  const lv = getLevel(item.points);
                  const pct = Math.min((item.points / 35) * 100, 100);
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[11px] font-data text-[#D8DDE8] truncate">{item.label}</span>
                        <span
                          className="shrink-0 text-[9px] font-bold font-data px-1.5 py-0.5 rounded border"
                          style={{
                            color: lv.color,
                            borderColor: `${lv.color}40`,
                            background: `${lv.color}15`,
                          }}
                        >
                          {item.points} pts
                        </span>
                      </div>
                      {/* Heatmap bar */}
                      <div className="h-1.5 bg-[#0D1120] rounded-full overflow-hidden border border-[#1A2035]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: lv.color,
                            boxShadow: item.points > 0 ? `0 0 8px ${lv.color}60` : 'none',
                            transition: 'width 0.8s ease',
                          }}
                        />
                      </div>
                      <p className="text-[10px] font-data text-[#3B4A65] leading-tight mt-1">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
