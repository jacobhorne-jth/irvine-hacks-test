'use client';

import { Shield, Flame, BarChart2 } from 'lucide-react';
import { RiskScoreCard } from './RiskScoreCard';
import { RiskGauge } from './RiskGauge';
import { getRiskLabel, scoreToLevel } from '@/lib/utils';
import type { PropertyRiskReport, RiskLevel } from '@/lib/types';

interface RiskDashboardProps {
  report: PropertyRiskReport;
  hideOverall?: boolean;
}

const RISK_COLORS: Record<RiskLevel, string> = {
  low: '#22C55E',
  medium: '#F59E0B',
  high: '#F97316',
  critical: '#EF4444',
};

export function RiskDashboard({ report, hideOverall = false }: RiskDashboardProps) {
  const { titleRisk, disasterRisk, marketRisk, overallScore } = report;
  const overallLevel = scoreToLevel(overallScore);
  const levelColor = RISK_COLORS[overallLevel];

  return (
    <div className="space-y-4">
      {/* Overall score banner — hidden when page-level RiskVerdictBanner is shown */}
      {!hideOverall && <div className="border border-[#1A2035] bg-[#0B0F1C] rounded-lg p-6 reveal">
        <div className="flex items-center gap-6">
          <RiskGauge score={overallScore} level={overallLevel} size={110} />
          <div className="space-y-2">
            <p className="text-[10px] font-data text-[#3B4A65] tracking-[0.2em] uppercase">
              Overall Insurance Risk Score
            </p>
            <span
              className="inline-block text-sm font-bold font-data px-3 py-1.5 rounded border tracking-wide uppercase"
              style={{ color: levelColor, borderColor: `${levelColor}40`, background: `${levelColor}12` }}
            >
              {getRiskLabel(overallLevel)}
            </span>
            <p className="text-[10px] font-data text-[#3B4A65]">
              Title 40% · Disaster 35% · Market 25%
            </p>
          </div>
        </div>
      </div>}

      {/* Individual risk cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RiskScoreCard
          title="Title Risk"
          icon={Shield}
          score={titleRisk.score}
          level={titleRisk.level}
          breakdown={titleRisk.breakdown}
          extraInfo={
            <>
              <p>{titleRisk.factors.flipCount} flip(s)</p>
              <p>{titleRisk.factors.foreclosureCount} foreclosure(s)</p>
              <p>{titleRisk.factors.lienCount} lien(s)</p>
            </>
          }
        />
        <RiskScoreCard
          title="Disaster Risk"
          icon={Flame}
          score={disasterRisk.score}
          level={disasterRisk.level}
          breakdown={disasterRisk.breakdown}

          extraInfo={
            <>
              <p>Flood Zone: {disasterRisk.floodZone}</p>
              <p>Fire: {disasterRisk.fireHazardZone}</p>
              <p>~{disasterRisk.earthquakeProximity} mi to fault</p>
            </>
          }
        />
        <RiskScoreCard
          title="Market Risk"
          icon={BarChart2}
          score={marketRisk.score}
          level={marketRisk.level}
          breakdown={marketRisk.breakdown}
          extraInfo={
            <>
              <p>Volatility: {marketRisk.priceVolatility.toFixed(1)}% σ</p>
              <p>Avg DOM: {marketRisk.daysOnMarket} days</p>
              <p>Price cuts: {marketRisk.priceReductionRate}%</p>
            </>
          }
        />
      </div>
    </div>
  );
}
