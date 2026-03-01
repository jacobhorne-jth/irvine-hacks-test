import { formatCurrency, scoreToLevel, getRiskColor } from '@/lib/utils';
import type { PortfolioEntry } from './SaveToPortfolioButton';

interface PortfolioStatsProps {
  entries: PortfolioEntry[];
}

export function PortfolioStats({ entries }: PortfolioStatsProps) {
  const totalValue = entries.reduce((s, e) => s + e.zestimate, 0);

  // Expected Annual Loss — same formula as DisasterScoreCard per-hazard detail
  const totalEAL = entries.reduce((sum, e) => {
    if (!e.hazardBreakdown || !e.buildValue || e.buildValue === 0 || e.zestimate === 0) return sum;
    const propLoss = Object.values(e.hazardBreakdown).reduce((h, v) => {
      return h + (v.eal_building_M * 1_000_000 / e.buildValue!) * e.zestimate;
    }, 0);
    return sum + propLoss;
  }, 0);

  const lossRate = totalValue > 0 ? (totalEAL / totalValue) * 100 : 0;
  const hasEAL = entries.some(
    (e) => e.hazardBreakdown && e.buildValue && e.buildValue > 0
  );

  // Avg title risk
  const titleEntries = entries.filter((e) => e.titleScore !== undefined);
  const avgTitleScore = titleEntries.length
    ? Math.round(titleEntries.reduce((s, e) => s + e.titleScore!, 0) / titleEntries.length)
    : null;
  const titleLevel = avgTitleScore !== null ? scoreToLevel(avgTitleScore) : null;
  const titleColor = titleLevel ? getRiskColor(titleLevel) : 'var(--text-ghost)';

  // Avg disaster risk
  const disasterEntries = entries.filter((e) => e.disasterScore !== undefined);
  const avgDisasterScore = disasterEntries.length
    ? Math.round(disasterEntries.reduce((s, e) => s + e.disasterScore!, 0) / disasterEntries.length)
    : null;
  const disasterLevel = avgDisasterScore !== null ? scoreToLevel(avgDisasterScore) : null;
  const disasterColor = disasterLevel ? getRiskColor(disasterLevel) : 'var(--text-ghost)';

  return (
    <div className="border border-line bg-surface rounded-lg overflow-hidden reveal">
      <div className="px-6 py-2.5 border-b border-line">
        <p className="text-[11px] font-data text-ghost tracking-[0.2em] uppercase">
          Portfolio Overview
        </p>
      </div>

      {/* Main stats row */}
      <div className="grid grid-cols-2 divide-x divide-line border-b border-line">

        {/* Left — portfolio value + EAL */}
        <div className="px-6 py-6">
          <p className="text-[9px] font-data text-ghost tracking-[0.2em] uppercase mb-1">
            Gross Value
          </p>
          <p className="text-3xl font-extrabold font-data text-white">
            {formatCurrency(totalValue)}
          </p>
          {hasEAL && (
            <div
              className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded border"
              style={{ borderColor: '#EF444440', background: '#EF444412' }}
            >
              <span className="text-sm font-bold font-data tabular-nums" style={{ color: '#EF4444' }}>
                ▼ {formatCurrency(Math.round(totalEAL))}/yr
              </span>
              <span className="text-xs font-data" style={{ color: '#EF4444', opacity: 0.7 }}>
                -{lossRate.toFixed(2)}%/yr expected loss
              </span>
            </div>
          )}
        </div>

        {/* Right — avg title risk + avg disaster risk */}
        <div className="divide-y divide-line">
          <div className="px-6 py-5">
            <p className="text-[9px] font-data text-ghost tracking-[0.2em] uppercase mb-1">
              Avg Title Risk
            </p>
            {avgTitleScore !== null ? (
              <>
                <p className="text-2xl font-extrabold font-data" style={{ color: titleColor }}>
                  {avgTitleScore}
                </p>
                <p className="text-xs font-data mt-0.5 capitalize" style={{ color: titleColor, opacity: 0.75 }}>
                  {titleLevel}
                </p>
              </>
            ) : (
              <p className="text-2xl font-extrabold font-data text-ghost">—</p>
            )}
          </div>
          <div className="px-6 py-5">
            <p className="text-[9px] font-data text-ghost tracking-[0.2em] uppercase mb-1">
              Avg Disaster Risk
            </p>
            {avgDisasterScore !== null ? (
              <>
                <p className="text-2xl font-extrabold font-data" style={{ color: disasterColor }}>
                  {avgDisasterScore}
                </p>
                <p className="text-xs font-data mt-0.5 capitalize" style={{ color: disasterColor, opacity: 0.75 }}>
                  {disasterLevel}
                </p>
              </>
            ) : (
              <p className="text-2xl font-extrabold font-data text-ghost">—</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
