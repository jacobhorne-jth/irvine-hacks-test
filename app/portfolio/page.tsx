'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trash2, ExternalLink, BarChart2, Plus, TrendingUp } from 'lucide-react';
import { formatCurrency, scoreToLevel, getRiskLabel } from '@/lib/utils';
import type { PortfolioEntry } from '@/components/portfolio/SaveToPortfolioButton';
import { PORTFOLIO_KEY } from '@/components/portfolio/SaveToPortfolioButton';
import { RiskGauge } from '@/components/risk/RiskGauge';
import type { RiskLevel } from '@/lib/types';

const RISK_COLORS: Record<RiskLevel, string> = {
  low: '#22C55E',
  medium: '#F59E0B',
  high: '#F97316',
  critical: '#EF4444',
};

const REC_LABELS: Record<string, string> = {
  proceed: 'Proceed',
  caution: 'Proceed with Caution',
  'high-risk': 'High Risk — Review',
  avoid: 'Avoid / Consult Attorney',
};

const REC_COLORS: Record<string, string> = {
  proceed: '#22C55E',
  caution: '#F59E0B',
  'high-risk': '#F97316',
  avoid: '#EF4444',
};

export default function PortfolioPage() {
  const [entries, setEntries] = useState<PortfolioEntry[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(PORTFOLIO_KEY);
      if (raw) setEntries(JSON.parse(raw));
    } catch {}
  }, []);

  function remove(id: string) {
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(next));
  }

  if (!mounted) return null;

  const avgScore = entries.length
    ? Math.round(entries.reduce((s, e) => s + e.overallScore, 0) / entries.length)
    : 0;
  const highRiskCount = entries.filter((e) => e.overallScore > 50).length;
  const avgZestimate = entries.length
    ? Math.round(entries.reduce((s, e) => s + e.zestimate, 0) / entries.length)
    : 0;
  const avgLevel = scoreToLevel(avgScore);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-data text-[#3B4A65] tracking-[0.2em] uppercase mb-2">
            Portfolio
          </p>
          <h1
            className="text-4xl font-extrabold text-white leading-tight"
            style={{ fontFamily: 'var(--font-syne)' }}
          >
            Property Portfolio
          </h1>
          <p className="text-sm font-data text-[#64748B] mt-1">
            {entries.length} propert{entries.length === 1 ? 'y' : 'ies'} tracked
          </p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-data px-3 py-2 rounded border border-[#1A2035] text-[#3B4A65] hover:border-[#F5A11C]/30 hover:text-[#F5A11C] transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Property
        </Link>
      </div>

      {entries.length === 0 ? (
        /* Empty state */
        <div className="border border-[#1A2035] bg-[#0B0F1C] rounded-lg py-24 text-center reveal">
          <BarChart2 className="h-10 w-10 text-[#1A2035] mx-auto mb-5" />
          <p className="text-sm font-data text-[#64748B] mb-1">No properties saved yet.</p>
          <p className="text-xs font-data text-[#3B4A65] mb-6">
            Analyze a property and click "Save to Portfolio" to track it here.
          </p>
          <Link
            href="/"
            className="text-xs font-data text-[#F5A11C] hover:text-[#F5A11C]/80 tracking-wider uppercase"
          >
            Analyze your first property →
          </Link>
        </div>
      ) : (
        <>
          {/* Aggregate stats banner */}
          <div className="border border-[#1A2035] bg-[#0B0F1C] rounded-lg overflow-hidden reveal">
            <div className="px-6 py-3 border-b border-[#1A2035]">
              <p className="text-[9px] font-data text-[#3B4A65] tracking-[0.2em] uppercase">
                Portfolio Overview
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#1A2035]">
              {[
                { label: 'Properties', value: entries.length.toString() },
                {
                  label: 'Avg Risk Score',
                  value: avgScore.toString(),
                  color: RISK_COLORS[avgLevel],
                },
                {
                  label: 'High / Critical',
                  value: highRiskCount.toString(),
                  color: highRiskCount > 0 ? '#F97316' : '#22C55E',
                },
                { label: 'Avg Zestimate', value: formatCurrency(avgZestimate) },
              ].map(({ label, value, color }) => (
                <div key={label} className="px-6 py-5">
                  <p
                    className="text-2xl font-bold font-data"
                    style={{ color: color ?? 'white' }}
                  >
                    {value}
                  </p>
                  <p className="text-[10px] font-data text-[#3B4A65] tracking-wider uppercase mt-1">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Risk distribution bar */}
          {entries.length > 1 && (
            <div className="border border-[#1A2035] bg-[#0B0F1C] rounded-lg p-5 reveal">
              <p className="text-[9px] font-data text-[#3B4A65] tracking-[0.2em] uppercase mb-4">
                Portfolio Risk Distribution
              </p>
              <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                {(['low', 'medium', 'high', 'critical'] as RiskLevel[]).map((level) => {
                  const count = entries.filter((e) => scoreToLevel(e.overallScore) === level).length;
                  const pct = (count / entries.length) * 100;
                  if (pct === 0) return null;
                  return (
                    <div
                      key={level}
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: RISK_COLORS[level],
                        boxShadow: `0 0 8px ${RISK_COLORS[level]}60`,
                      }}
                      title={`${getRiskLabel(level)}: ${count}`}
                    />
                  );
                })}
              </div>
              <div className="flex gap-4 mt-3 flex-wrap">
                {(['low', 'medium', 'high', 'critical'] as RiskLevel[]).map((level) => {
                  const count = entries.filter((e) => scoreToLevel(e.overallScore) === level).length;
                  if (count === 0) return null;
                  return (
                    <div key={level} className="flex items-center gap-1.5">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: RISK_COLORS[level] }}
                      />
                      <span className="text-[10px] font-data text-[#64748B]">
                        {getRiskLabel(level)}: {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Property cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {entries.map((entry, i) => {
              const level = scoreToLevel(entry.overallScore);
              const riskColor = RISK_COLORS[level];
              const recColor = REC_COLORS[entry.recommendation] ?? '#64748B';
              return (
                <div
                  key={entry.id}
                  className="border border-[#1A2035] bg-[#0B0F1C] rounded-lg overflow-hidden reveal"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  {/* Card header */}
                  <div className="px-4 py-3 border-b border-[#1A2035] flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-data text-[#F5A11C] tracking-[0.15em] uppercase">
                        {entry.propertyType.replace(/-/g, ' ')}
                      </p>
                      <p className="text-sm font-semibold text-white truncate mt-0.5">{entry.address}</p>
                      <p className="text-[11px] font-data text-[#64748B] mt-0.5">
                        {formatCurrency(entry.zestimate)}
                        {entry.beds > 0 && (
                          <span className="ml-2 text-[#3B4A65]">
                            {entry.beds}bd / {entry.baths}ba
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => remove(entry.id)}
                      className="shrink-0 p-1.5 text-[#3B4A65] hover:text-[#EF4444] transition-colors rounded"
                      title="Remove from portfolio"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Score gauge + recommendation */}
                  <div className="p-4 flex items-center gap-4">
                    <RiskGauge score={entry.overallScore} level={level} size={80} />
                    <div className="space-y-2 min-w-0">
                      <span
                        className="inline-block text-xs font-bold font-data px-2 py-0.5 rounded border tracking-wide uppercase"
                        style={{
                          color: riskColor,
                          borderColor: `${riskColor}40`,
                          background: `${riskColor}12`,
                        }}
                      >
                        {getRiskLabel(level)}
                      </span>
                      <p className="text-[11px] font-data leading-tight" style={{ color: recColor }}>
                        {REC_LABELS[entry.recommendation] ?? entry.recommendation}
                      </p>
                      <p className="text-[10px] font-data text-[#3B4A65]">
                        Saved {new Date(entry.savedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* View analysis link */}
                  <div className="px-4 pb-4">
                    <Link
                      href={`/property/${entry.id}`}
                      className="flex items-center justify-center gap-1.5 w-full text-[11px] font-data text-[#3B4A65] hover:text-[#F5A11C] py-2 border border-[#1A2035] rounded hover:border-[#F5A11C]/30 transition-all"
                    >
                      <TrendingUp className="h-3 w-3" />
                      View Full Analysis
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
