'use client';

import { useState } from 'react';
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

// ── Fixed tooltip that escapes overflow:hidden containers ─────────────────
function FactorTooltip({
  description,
  color,
  pos,
}: {
  description: string;
  color: string;
  pos: { x: number; y: number };
}) {
  return (
    <div
      className="fixed pointer-events-none z-[9999]"
      style={{
        left: pos.x,
        top: pos.y - 8,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div
        className="relative rounded-lg px-3 py-2 border text-[11px] font-data leading-relaxed"
        style={{
          background: '#050A14',
          borderColor: `${color}40`,
          boxShadow: `0 8px 24px #00000080, 0 0 0 1px ${color}20`,
          color: '#C8D6E2',
          maxWidth: 260,
        }}
      >
        {/* Down caret */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-r border-b"
          style={{ bottom: -5, background: '#050A14', borderColor: `${color}40` }}
        />
        {description}
      </div>
    </div>
  );
}

export function RiskHeatmapGrid({ report }: RiskHeatmapGridProps) {
  const [tooltip, setTooltip] = useState<{
    description: string;
    color: string;
    pos: { x: number; y: number };
  } | null>(null);

  return (
    <>
      <div className="border border-[#1A2035] bg-[#0B0F1C] rounded-lg overflow-hidden reveal">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1A2035] flex items-center justify-between">
          <div>
            <p className="text-xs font-data text-[#AABFCF] tracking-[0.2em] uppercase">
              Risk Factor Matrix
            </p>
            <p className="text-[11px] font-data text-[#C8D6E2] mt-0.5">
              Hover a bar for explanation
            </p>
          </div>
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3">
            {LEVELS.map((l) => (
              <div key={l.label} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
                <span className="text-[11px] font-data text-[#AABFCF] tracking-wider">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 divide-[#1A2035]">
          {CATEGORIES.map(({ label, accent, breakdownKey }) => {
            const { breakdown, score } = report[breakdownKey];
            return (
              <div key={breakdownKey} className="p-5 space-y-4">
                {/* Column header */}
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-bold font-data tracking-[0.15em] uppercase"
                    style={{ color: accent }}
                  >
                    {label}
                  </span>
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
                          <span className="text-[11px] font-data text-[#D8DDE8] truncate">
                            {item.label}
                          </span>
                          <span
                            className="shrink-0 text-[11px] font-bold font-data px-1.5 py-0.5 rounded border"
                            style={{
                              color: lv.color,
                              borderColor: `${lv.color}40`,
                              background: `${lv.color}15`,
                            }}
                          >
                            {item.points} pts
                          </span>
                        </div>

                        {/* Heatmap bar — hover shows explanation tooltip */}
                        <div
                          className="h-2 bg-[#0D1120] rounded-full overflow-hidden border border-[#1A2035] cursor-help"
                          onMouseEnter={(e) => {
                            if (!item.description) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            setTooltip({
                              description: item.description,
                              color: lv.color,
                              pos: { x: rect.left + rect.width / 2, y: rect.top },
                            });
                          }}
                          onMouseLeave={() => setTooltip(null)}
                        >
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
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tooltip rendered outside card to escape overflow:hidden */}
      {tooltip && (
        <FactorTooltip
          description={tooltip.description}
          color={tooltip.color}
          pos={tooltip.pos}
        />
      )}
    </>
  );
}
