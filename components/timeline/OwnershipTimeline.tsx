'use client';

import { GitBranch, TrendingUp } from 'lucide-react';
import { TimelineEvent } from './TimelineEvent';
import type { OwnershipHistory } from '@/lib/types';

interface OwnershipTimelineProps {
  history: OwnershipHistory;
}

export function OwnershipTimeline({ history }: OwnershipTimelineProps) {
  const sorted = [...history.events].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="border border-[#1A2035] bg-[#0B0F1C] rounded-lg overflow-hidden reveal reveal-delay-3">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#1A2035]">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GitBranch className="h-4 w-4 text-[#60A5FA]" />
              <span className="font-bold text-white" style={{ fontFamily: 'var(--font-syne)' }}>
                Ownership Timeline
              </span>
            </div>
            <p className="text-[11px] font-data text-[#3B4A65]">
              Records dating to {new Date(history.oldestRecord).getFullYear()}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Tag value={history.totalTransfers} label="transfers" />
            {history.flipCount > 0 && (
              <Tag value={history.flipCount} label={`flip${history.flipCount > 1 ? 's' : ''}`} color="#EF4444" />
            )}
            {history.foreclosureCount > 0 && (
              <Tag value={history.foreclosureCount} label={`foreclosure${history.foreclosureCount > 1 ? 's' : ''}`} color="#F97316" />
            )}
            {history.lienCount > 0 && (
              <Tag value={history.lienCount} label={`lien${history.lienCount > 1 ? 's' : ''}`} color="#F59E0B" />
            )}
            {history.flipCount === 0 && history.foreclosureCount === 0 && history.lienCount === 0 && (
              <span className="flex items-center gap-1 text-[11px] font-data px-2.5 py-1 rounded border border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E]">
                <TrendingUp className="h-3 w-3" />
                Clean title
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Events */}
      <div className="relative">
        {/* Vertical line — aligned with dot centers */}
        <div className="absolute left-[30px] top-5 bottom-5 w-px bg-[#1A2035]" />
        <div className="px-5 py-5 space-y-0">
          {sorted.map((event, index) => (
            <TimelineEvent
              key={event.id}
              event={event}
              isFirst={index === 0}
              isLast={index === sorted.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Tag({ value, label, color }: { value: number; label: string; color?: string }) {
  const c = color ?? '#60A5FA';
  return (
    <span
      className="text-[11px] font-data px-2.5 py-1 rounded border"
      style={{ color: c, borderColor: `${c}40`, background: `${c}12` }}
    >
      <span className="font-bold">{value}</span> {label}
    </span>
  );
}
