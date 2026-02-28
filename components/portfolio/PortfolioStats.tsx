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

  const avgColor = getRiskColor(scoreToLevel(avgScore));

  const stats = [
    { label: 'Properties',    value: String(count),                  color: 'var(--text-primary)' },
    { label: 'Avg Risk Score', value: String(avgScore),               color: avgColor },
    { label: 'High / Critical', value: String(highRiskCount),        color: highRiskCount > 0 ? 'var(--risk-high)' : 'var(--risk-low)' },
    { label: 'Avg Zestimate',  value: formatCurrency(avgZestimate),  color: 'var(--text-primary)' },
  ];

  return (
    <div className="border border-line bg-surface rounded-lg overflow-hidden reveal">
      <div className="px-6 py-2.5 border-b border-line">
        <p className="text-[9px] font-data text-ghost tracking-[0.2em] uppercase">
          Portfolio Overview
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-line">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="px-6 py-5">
            <p className="text-2xl font-bold font-data" style={{ color }}>{value}</p>
            <p className="text-[10px] font-data text-ghost tracking-wider uppercase mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
