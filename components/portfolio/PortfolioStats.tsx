import { formatCurrency, scoreToLevel, getRiskColor } from '@/lib/utils';
import type { PortfolioEntry } from './SaveToPortfolioButton';

interface PortfolioStatsProps {
  entries: PortfolioEntry[];
}

export function PortfolioStats({ entries }: PortfolioStatsProps) {
  const count = entries.length;

  const avgScore = count
    ? Math.round(entries.reduce((s, e) => s + e.overallScore, 0) / count)
    : 0;

  const highRiskCount = entries.filter((e) => e.overallScore > 50).length;

  const avgZestimate = count
    ? Math.round(entries.reduce((s, e) => s + e.zestimate, 0) / count)
    : 0;

  const totalValue = entries.reduce((s, e) => s + e.zestimate, 0);

  const bestScore  = count ? Math.min(...entries.map((e) => e.overallScore)) : 0;
  const worstScore = count ? Math.max(...entries.map((e) => e.overallScore)) : 0;

  // Avg disaster score — only for entries that have it
  const disasterEntries = entries.filter((e) => e.disasterScore !== undefined);
  const avgDisaster = disasterEntries.length
    ? Math.round(disasterEntries.reduce((s, e) => s + e.disasterScore!, 0) / disasterEntries.length)
    : null;

  const avgColor   = getRiskColor(scoreToLevel(avgScore));
  const bestColor  = getRiskColor(scoreToLevel(bestScore));
  const worstColor = getRiskColor(scoreToLevel(worstScore));

  const row1 = [
    { label: 'Properties',     value: String(count),               color: 'var(--text-primary)' },
    { label: 'Avg Risk Score', value: String(avgScore),             color: avgColor },
    { label: 'High / Critical', value: String(highRiskCount),       color: highRiskCount > 0 ? 'var(--risk-high)' : 'var(--risk-low)' },
    { label: 'Avg AVM Est.',   value: formatCurrency(avgZestimate), color: 'var(--text-primary)' },
  ];

  const row2 = [
    { label: 'Total Value',     value: formatCurrency(totalValue),              color: 'var(--text-primary)' },
    { label: 'Best Score',      value: count ? String(bestScore) : '—',         color: bestColor },
    { label: 'Worst Score',     value: count ? String(worstScore) : '—',        color: worstColor },
    {
      label: 'Avg Disaster',
      value: avgDisaster !== null ? String(avgDisaster) : '—',
      color: avgDisaster !== null ? getRiskColor(scoreToLevel(avgDisaster)) : 'var(--text-ghost)',
    },
  ];

  return (
    <div className="border border-line bg-surface rounded-lg overflow-hidden reveal">
      <div className="px-6 py-2.5 border-b border-line">
        <p className="text-[11px] font-data text-ghost tracking-[0.2em] uppercase">
          Portfolio Overview
        </p>
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-line border-b border-line">
        {row1.map(({ label, value, color }) => (
          <div key={label} className="px-6 py-5">
            <p className="text-2xl font-bold font-data" style={{ color }}>{value}</p>
            <p className="text-xs font-data text-ghost tracking-wider uppercase mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-line">
        {row2.map(({ label, value, color }) => (
          <div key={label} className="px-6 py-4">
            <p className="text-xl font-bold font-data" style={{ color }}>{value}</p>
            <p className="text-xs font-data text-ghost tracking-wider uppercase mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
