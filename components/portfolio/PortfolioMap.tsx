'use client';

import dynamic from 'next/dynamic';
import type { PortfolioEntry } from './SaveToPortfolioButton';

const MapInner = dynamic(() => import('./PortfolioMapInner'), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[300px] rounded-xl bg-surface border border-line flex items-center justify-center">
      <span className="text-xs font-data text-ghost">Loading map...</span>
    </div>
  ),
});

export function PortfolioMap({ entries }: { entries: PortfolioEntry[] }) {
  return <MapInner entries={entries} />;
}
