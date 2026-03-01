'use client';

import Link from 'next/link';
import { Trash2, ArrowRight } from 'lucide-react';
import { formatCurrency, scoreToLevel, getRiskLabel, getRiskColor } from '@/lib/utils';
import type { PortfolioEntry } from './SaveToPortfolioButton';

const REC_LABELS: Record<string, string> = {
  proceed:     'Proceed',
  caution:     'Caution',
  'high-risk': 'High Risk',
  avoid:       'Avoid',
};

const REC_COLORS: Record<string, string> = {
  proceed:     '#22C55E',
  caution:     '#F59E0B',
  'high-risk': '#F97316',
  avoid:       '#EF4444',
};

interface PortfolioRowProps {
  entry: PortfolioEntry;
  onRemove: (id: string) => void;
  index: number;
}

export function PortfolioRow({ entry, onRemove, index }: PortfolioRowProps) {
  const level = scoreToLevel(entry.overallScore);
  const scoreColor = getRiskColor(level);
  const recColor = REC_COLORS[entry.recommendation] ?? '#C8D6E2';

  return (
    <div
      className="flex items-center gap-3 px-4 py-4 border-b border-line last:border-b-0 hover:bg-surface-2 transition-colors group reveal"
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      {/* Score */}
      <div className="shrink-0 w-11 text-center">
        <p
          className="text-2xl font-bold font-data leading-none tabular-nums"
          style={{ color: scoreColor }}
        >
          {entry.overallScore}
        </p>
        <p
          className="text-[10px] font-data tracking-wider uppercase mt-0.5"
          style={{ color: scoreColor, opacity: 0.85 }}
        >
          {level}
        </p>
      </div>

      {/* Address + details */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold text-white truncate"
          style={{ fontFamily: 'var(--font-syne)' }}
        >
          {entry.address}
        </p>
        <p className="text-[11px] font-data text-ghost mt-0.5">
          <span className="capitalize">{entry.propertyType.replace(/-/g, ' ')}</span>
          {entry.beds > 0 && <span>   {entry.beds}bd  {entry.baths}ba</span>}
          <span className="text-white tabular-nums">   {formatCurrency(entry.zestimate)}</span>
        </p>
        <p className="text-[10px] font-data text-ghost/40 mt-0.5">
          Saved {new Date(entry.savedAt).toLocaleDateString()}
        </p>
      </div>

      {/* Recommendation badge */}
      <span
        className="shrink-0 hidden sm:inline-block text-xs font-bold font-data px-2.5 py-1.5 rounded border tracking-wide uppercase"
        style={{
          color: recColor,
          borderColor: `${recColor}40`,
          background: `${recColor}12`,
        }}
      >
        {REC_LABELS[entry.recommendation] ?? entry.recommendation}
      </span>

      {/* Actions — revealed on hover */}
      <div className="shrink-0 flex items-center gap-1 opacity-30 group-hover:opacity-100 transition-opacity">
        <Link
          href={`/property/${entry.id}`}
          className="p-2 rounded text-ghost hover:text-amber hover:bg-surface-2 transition-all"
          title="View full analysis"
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <button
          onClick={() => onRemove(entry.id)}
          className="p-2 rounded text-ghost hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-all"
          title="Remove from portfolio"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
