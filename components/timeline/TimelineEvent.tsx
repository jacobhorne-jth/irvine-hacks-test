import { AlertTriangle, Home, Clock, DollarSign } from 'lucide-react';
import { formatCurrency, formatDate, tenureLabel } from '@/lib/utils';
import type { OwnershipEvent } from '@/lib/types';

interface TimelineEventProps {
  event: OwnershipEvent;
  isFirst: boolean;
  isLast: boolean;
}

export function TimelineEvent({ event }: TimelineEventProps) {
  const isForeclosure = event.hasForeclosure || event.type === 'foreclosure';
  const isFlip = event.isFlip;

  const dotColor = isForeclosure
    ? '#F97316'
    : isFlip
    ? '#EF4444'
    : event.tenureMonths == null
    ? '#60A5FA'
    : '#22C55E';

  const DotIcon = isForeclosure ? AlertTriangle : Home;

  return (
    <div className="relative flex gap-4 pb-5 pl-10 last:pb-0">
      {/* Dot */}
      <div
        className="absolute left-0 top-1 h-5 w-5 rounded-full flex items-center justify-center shrink-0"
        style={{
          background: `${dotColor}20`,
          border: `1px solid ${dotColor}60`,
          boxShadow: `0 0 8px ${dotColor}30`,
        }}
      >
        <DotIcon className="h-2.5 w-2.5" style={{ color: dotColor }} />
      </div>

      {/* Card */}
      <div className="flex-1 min-w-0 bg-[#060810] rounded border border-[#1A2035] p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              {event.ownerName && (
                <span className="font-semibold text-sm text-white font-data truncate">{event.ownerName}</span>
              )}
              {event.tenureMonths == null && (
                <EventBadge color="#60A5FA">Current owner</EventBadge>
              )}
              {isFlip && <EventBadge color="#EF4444">⚡ Flip</EventBadge>}
              {isForeclosure && <EventBadge color="#F97316">⚠ Foreclosure</EventBadge>}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] font-data text-[#C8D6E2]">
              {event.date && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {formatDate(event.date)}
                </span>
              )}
              {event.tenureMonths !== undefined && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {tenureLabel(event.tenureMonths)}
                </span>
              )}
            </div>
          </div>

          {event.price != null && (
            <div className="text-right shrink-0">
              <p className="font-bold text-sm font-data text-white">{formatCurrency(event.price)}</p>
              <p className="text-xs font-data text-[#AABFCF]">purchase price</p>
            </div>
          )}
        </div>

        {event.foreclosureDetails && (
          <div className="mt-2 text-[11px] font-data text-[#F97316] bg-[#F97316]/8 rounded px-2 py-1 border border-[#F97316]/20">
            {event.foreclosureDetails}
          </div>
        )}
        {event.notes && !event.foreclosureDetails && (
          <div className="mt-2 text-[11px] font-data text-[#C8D6E2]">{event.notes}</div>
        )}
      </div>
    </div>
  );
}

function EventBadge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="text-xs font-data px-1.5 py-0.5 rounded border leading-none"
      style={{ color, borderColor: `${color}40`, background: `${color}12` }}
    >
      {children}
    </span>
  );
}
