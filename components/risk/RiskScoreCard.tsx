'use client';

import { RiskGauge } from './RiskGauge';
import { getRiskLabel } from '@/lib/utils';
import type { RiskLevel, RiskBreakdownItem } from '@/lib/types';
import type { LucideIcon } from 'lucide-react';

const RISK_COLORS: Record<RiskLevel, string> = {
  low: '#22C55E',
  medium: '#F59E0B',
  high: '#F97316',
  critical: '#EF4444',
};

interface RiskScoreCardProps {
  title: string;
  icon: LucideIcon;
  score: number;
  level: RiskLevel;
  breakdown: RiskBreakdownItem[];
  extraInfo?: React.ReactNode;
  badge?: string;
}

export function RiskScoreCard({ title, icon: Icon, score, level, breakdown, extraInfo, badge }: RiskScoreCardProps) {
  const levelColor = RISK_COLORS[level];

  return (
    <div className="border border-[#1A2035] bg-[#0B0F1C] rounded-lg overflow-hidden reveal">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[#1A2035] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-[#8EA5BE]" />
          <span className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-syne)' }}>
            {title}
          </span>
        </div>
        {badge && (
          <span className="text-[10px] font-data px-2 py-0.5 rounded border border-[#60A5FA]/30 bg-[#60A5FA]/10 text-[#60A5FA]">
            {badge}
          </span>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Gauge — centered, bigger */}
        <div className="flex flex-col items-center gap-3">
          <RiskGauge score={score} level={level} size={180} />
          <div className="flex flex-col items-center gap-2 -mt-1">
            <span
              className="inline-block text-xs font-bold font-data px-2.5 py-1 rounded border tracking-wide uppercase"
              style={{ color: levelColor, borderColor: `${levelColor}40`, background: `${levelColor}12` }}
            >
              {getRiskLabel(level)}
            </span>
            {extraInfo && (
              <div className="text-[11px] font-data text-[#8EA5BE] space-y-0.5 leading-relaxed text-center">
                {extraInfo}
              </div>
            )}
          </div>
        </div>

        {/* Breakdown */}
        {breakdown.length > 0 && (
          <div className="space-y-2.5 border-t border-[#1A2035] pt-3">
            <p className="text-[9px] font-data text-[#8EA5BE] tracking-[0.2em] uppercase">Risk Factors</p>
            {breakdown.map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[#D8DDE8] font-data">{item.label}</p>
                  <p className="text-[11px] font-data text-[#B0C0D0] leading-tight mt-0.5">{item.description}</p>
                </div>
                <span
                  className={`shrink-0 text-[10px] font-bold font-data px-1.5 py-0.5 rounded border ${
                    item.points >= 20
                      ? 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30'
                      : item.points >= 10
                      ? 'bg-[#F97316]/10 text-[#F97316] border-[#F97316]/30'
                      : 'bg-[#1A2035] text-[#B0C0D0] border-[#1A2035]'
                  }`}
                >
                  +{item.points}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
