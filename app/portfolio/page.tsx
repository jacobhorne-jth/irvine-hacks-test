'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Plus, BarChart2 } from 'lucide-react';
import { scoreToLevel, getRiskColor } from '@/lib/utils';
import type { PortfolioEntry } from '@/components/portfolio/SaveToPortfolioButton';
import { PORTFOLIO_KEY } from '@/components/portfolio/SaveToPortfolioButton';
import { PortfolioStats } from '@/components/portfolio/PortfolioStats';
import { PortfolioRow } from '@/components/portfolio/PortfolioRow';
import { PortfolioMap } from '@/components/portfolio/PortfolioMap';
import { PortfolioAnalytics } from '@/components/portfolio/PortfolioAnalytics';
import type { RiskLevel } from '@/lib/types';

const RISK_COLORS: Record<RiskLevel, string> = {
  low:      '#22C55E',
  medium:   '#F59E0B',
  high:     '#F97316',
  critical: '#EF4444',
};

export default function PortfolioPage() {
  const [entries, setEntries] = useState<PortfolioEntry[]>([]);
  const [mounted, setMounted] = useState(false);
  // Track which entry IDs we've already attempted to enrich (prevents duplicate fetches)
  const enrichingRef = useRef(new Set<string>());

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(PORTFOLIO_KEY);
      if (raw) setEntries(JSON.parse(raw));
    } catch {}
  }, []);

  // Auto-enrich entries missing hazard breakdown data via lightweight NRI lookup
  useEffect(() => {
    if (!mounted) return;
    const missing = entries.filter(
      (e) => (e.hazardBreakdown == null || e.buildValue == null) && !enrichingRef.current.has(e.id)
    );
    if (missing.length === 0) return;

    for (const e of missing) enrichingRef.current.add(e.id);

    void Promise.all(
      missing.map(async (entry) => {
        const params = new URLSearchParams();
        if (entry.latitude != null && entry.longitude != null) {
          params.set('lat', String(entry.latitude));
          params.set('lng', String(entry.longitude));
        } else {
          params.set('address', entry.address);
        }
        try {
          const res = await fetch(`/api/nri-lookup?${params}`);
          if (!res.ok) return null;
          const nri = await res.json();
          if (!nri.breakdown) return null;
          return {
            id:              entry.id,
            hazardBreakdown: nri.breakdown,
            dominantHazard:  nri.dominant_hazard,
            buildValue:      nri.buildValue,
            // Persist resolved coords so the map can pin this property
            ...(nri.latitude  != null && { latitude:  nri.latitude  }),
            ...(nri.longitude != null && { longitude: nri.longitude }),
          };
        } catch {
          return null;
        }
      })
    ).then((results) => {
      const updates = results.filter(Boolean);
      if (!updates.length) return;
      setEntries((prev) => {
        const next = prev.map((e) => {
          const u = updates.find((r) => r?.id === e.id);
          return u ? { ...e, ...u } : e;
        });
        localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(next));
        return next;
      });
    });
  }, [mounted, entries.length]); // re-run when new properties are added

  function remove(id: string) {
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(next));
  }

  if (!mounted) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-data text-ghost tracking-[0.2em] uppercase mb-2">
            Portfolio
          </p>
          <h1
            className="text-4xl font-extrabold text-white leading-tight"
            style={{ fontFamily: 'var(--font-syne)' }}
          >
            Property Portfolio
          </h1>
          <p className="text-sm font-data text-dim mt-1">
            {entries.length} propert{entries.length === 1 ? 'y' : 'ies'} tracked
          </p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-data px-3 py-2 rounded border border-line text-ghost hover:border-amber/30 hover:text-amber transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Property
        </Link>
      </div>

      {entries.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <PortfolioStats entries={entries} />

          {entries.length > 1 && <RiskDistributionBar entries={entries} />}

          {/* ── Portfolio Map ── */}
          {entries.some((e) => e.latitude != null && e.longitude != null) && (
            <div>
              <p className="text-xs font-data text-ghost tracking-[0.2em] uppercase mb-3">
                Property Locations
              </p>
              <div className="h-72">
                <PortfolioMap entries={entries} />
              </div>
            </div>
          )}

          {/* ── Analytics Dashboard ── */}
          <PortfolioAnalytics entries={entries} />

          {/* ── Property list ── */}
          <div>
            <p className="text-xs font-data text-ghost tracking-[0.2em] uppercase mb-3">
              Tracked Properties
            </p>
            <div className="border border-line bg-surface rounded-lg overflow-hidden">
              {entries.map((entry, i) => (
                <PortfolioRow key={entry.id} entry={entry} onRemove={remove} index={i} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="border border-line bg-surface rounded-lg py-24 text-center reveal">
      <BarChart2 className="h-10 w-10 text-line mx-auto mb-5" />
      <p className="text-sm font-data text-dim mb-1">No properties saved yet.</p>
      <p className="text-xs font-data text-ghost mb-6">
        Analyze a property and click &ldquo;Save to Portfolio&rdquo; to track it here.
      </p>
      <Link
        href="/"
        className="text-xs font-data text-amber hover:text-amber/80 tracking-wider uppercase"
      >
        Analyze your first property →
      </Link>
    </div>
  );
}

// ── Risk distribution bar ─────────────────────────────────────────────────

function RiskDistributionBar({ entries }: { entries: PortfolioEntry[] }) {
  const levels: RiskLevel[] = ['low', 'medium', 'high', 'critical'];

  return (
    <div className="border border-line bg-surface rounded-lg p-5 reveal">
      <p className="text-[11px] font-data text-ghost tracking-[0.2em] uppercase mb-4">
        Portfolio Risk Distribution
      </p>
      <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
        {levels.map((level) => {
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
              title={`${level}: ${count}`}
            />
          );
        })}
      </div>
      <div className="flex gap-4 mt-3 flex-wrap">
        {levels.map((level) => {
          const count = entries.filter((e) => scoreToLevel(e.overallScore) === level).length;
          if (count === 0) return null;
          return (
            <div key={level} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: RISK_COLORS[level] }} />
              <span className="text-xs font-data text-dim capitalize">
                {level}: {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
