'use client';

import { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';

export interface PortfolioEntry {
  id: string;           // URL-encoded address slug (used as localStorage key)
  address: string;      // decoded display address
  savedAt: string;      // ISO timestamp
  overallScore: number;
  recommendation: string;
  propertyType: string;
  zestimate: number;
  beds: number;
  baths: number;
  // Location (for portfolio map)
  latitude?: number;
  longitude?: number;
  // Risk component scores (for analytics)
  titleScore?: number;
  disasterScore?: number;
  marketScore?: number;
  // Detailed breakdowns (for aggregated portfolio charts)
  hazardBreakdown?: Record<string, { contribution: number; eal_building_M: number }>;
  dominantHazard?: string;
  buildValue?: number;   // county total building value — needed for per-property loss scaling
  titleBreakdown?: Array<{ label: string; points: number }>;
}

export const PORTFOLIO_KEY = 'prop_intel_portfolio';

interface SaveToPortfolioButtonProps {
  entry: Omit<PortfolioEntry, 'savedAt'>;
}

export function SaveToPortfolioButton({ entry }: SaveToPortfolioButtonProps) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PORTFOLIO_KEY);
      if (raw) {
        const entries: PortfolioEntry[] = JSON.parse(raw);
        setSaved(entries.some((e) => e.id === entry.id));
      }
    } catch {}
  }, [entry.id]);

  function toggle() {
    try {
      const raw = localStorage.getItem(PORTFOLIO_KEY);
      const entries: PortfolioEntry[] = raw ? JSON.parse(raw) : [];
      if (saved) {
        const next = entries.filter((e) => e.id !== entry.id);
        localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(next));
        setSaved(false);
      } else {
        const newEntry: PortfolioEntry = { ...entry, savedAt: new Date().toISOString() };
        const next = [newEntry, ...entries.filter((e) => e.id !== entry.id)];
        localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(next));
        setSaved(true);
      }
    } catch {}
  }

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-1.5 text-xs font-data px-3 py-1.5 rounded border transition-all ${
        saved
          ? 'border-[#F5A11C]/40 bg-[#F5A11C]/10 text-[#F5A11C]'
          : 'border-[#1A2035] bg-[#0B0F1C] text-[#AABFCF] hover:border-[#F5A11C]/30 hover:text-[#F5A11C]'
      }`}
    >
      {saved ? (
        <BookmarkCheck className="h-3.5 w-3.5" />
      ) : (
        <Bookmark className="h-3.5 w-3.5" />
      )}
      {saved ? 'Saved to Portfolio' : 'Save to Portfolio'}
    </button>
  );
}
