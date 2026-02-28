'use client';

import { useState } from 'react';
import { GitBranch, TrendingUp } from 'lucide-react';
import { formatCurrency, formatDate, tenureLabel } from '@/lib/utils';
import type { OwnershipHistory, OwnershipEvent } from '@/lib/types';

// ── Color helpers ─────────────────────────────────────────────────────────

function nodeColor(e: OwnershipEvent): string {
  if (e.hasForeclosure || e.type === 'foreclosure') return '#F97316';
  if (e.isFlip) return '#EF4444';
  if (e.hasLien) return '#F59E0B';
  if (e.tenureMonths == null) return '#60A5FA';
  return '#22C55E';
}

function isFlagged(e: OwnershipEvent): boolean {
  return e.hasForeclosure || e.type === 'foreclosure' || e.isFlip || e.hasLien;
}

function getFlags(e: OwnershipEvent): { label: string; color: string }[] {
  const out: { label: string; color: string }[] = [];
  if (e.hasForeclosure || e.type === 'foreclosure')
    out.push({ label: '⚠ Foreclosure', color: '#F97316' });
  if (e.isFlip) out.push({ label: '⚡ Flip', color: '#EF4444' });
  if (e.hasLien) out.push({ label: '🔒 Lien', color: '#F59E0B' });
  return out;
}

function abbrevName(name: string): string {
  if (name.length <= 18) return name;
  const parts = name.split(/\s+/);
  if (parts.length >= 2) return `${parts[0]} ${parts[parts.length - 1]}`;
  return name.slice(0, 17) + '…';
}

// ── Node shape ────────────────────────────────────────────────────────────

function NodeShape({
  color,
  flagged,
  hovered,
  selected,
}: {
  color: string;
  flagged: boolean;
  hovered: boolean;
  selected: boolean;
}) {
  const active = hovered || selected;
  return (
    <>
      {/* Selection ring */}
      {selected && (
        <div
          className="absolute"
          style={{
            inset: -5,
            borderRadius: flagged ? 3 : '50%',
            transform: flagged ? 'rotate(45deg)' : undefined,
            border: `1.5px solid ${color}50`,
            pointerEvents: 'none',
          }}
        />
      )}
      {/* Main shape */}
      <div
        className="absolute inset-0 transition-all duration-150"
        style={{
          borderRadius: flagged ? 3 : '50%',
          transform: flagged ? 'rotate(45deg)' : undefined,
          background: `${color}${active ? '2E' : '18'}`,
          border: `1.5px solid ${color}${active ? 'CC' : '70'}`,
          boxShadow: active
            ? `0 0 0 3px ${color}22, 0 0 18px ${color}55`
            : `0 0 6px ${color}30`,
        }}
      />
    </>
  );
}

// ── Node label (alternating above/below) ─────────────────────────────────

function NodeLabel({
  event,
  color,
  above,
  selected,
  hovered,
}: {
  event: OwnershipEvent;
  color: string;
  above: boolean;
  selected: boolean;
  hovered: boolean;
}) {
  const name = event.ownerName ? abbrevName(event.ownerName) : null;
  const year = new Date(event.date).getFullYear();

  const textBlock = (
    <div className="flex flex-col items-center" style={{ gap: 2, whiteSpace: 'nowrap' }}>
      <span
        className="font-data tracking-wider"
        style={{ fontSize: 9, color: `${color}BB` }}
      >
        {year}
      </span>
      {name && (
        <span
          className="font-data"
          style={{
            fontSize: 10,
            color: selected ? '#94A3B8' : hovered ? '#64748B' : '#374151',
          }}
        >
          {name}
        </span>
      )}
      {event.price != null && (
        <span
          className="font-data font-bold"
          style={{ fontSize: 9, color: `${color}80` }}
        >
          {formatCurrency(event.price)}
        </span>
      )}
    </div>
  );

  const stem = (
    <div
      style={{
        width: 1,
        height: 14,
        background: `linear-gradient(${above ? 'to bottom' : 'to top'}, ${color}00, ${color}35)`,
        flexShrink: 0,
      }}
    />
  );

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: above ? 'column-reverse' : 'column',
        alignItems: 'center',
        gap: 2,
        ...(above
          ? { bottom: 'calc(50% + 10px)' }
          : { top: 'calc(50% + 10px)' }),
      }}
    >
      {above ? (
        <>
          {textBlock}
          {stem}
        </>
      ) : (
        <>
          {stem}
          {textBlock}
        </>
      )}
    </div>
  );
}

// ── Fixed tooltip (escapes overflow container) ────────────────────────────

function TooltipFixed({
  event,
  pos,
}: {
  event: OwnershipEvent;
  pos: { x: number; y: number };
}) {
  const color = nodeColor(event);
  const flags = getFlags(event);
  const isCurrent = event.tenureMonths == null;

  return (
    <div
      className="fixed pointer-events-none z-[9999]"
      style={{
        left: pos.x,
        top: pos.y - 10,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div
        className="relative rounded-lg px-3 py-2.5 border"
        style={{
          background: '#050A14',
          borderColor: `${color}40`,
          boxShadow: `0 8px 32px #00000080, 0 0 0 1px ${color}20`,
          minWidth: 156,
          maxWidth: 240,
        }}
      >
        {/* Down caret */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 border-r border-b"
          style={{
            bottom: -6,
            background: '#050A14',
            borderColor: `${color}40`,
          }}
        />

        {event.ownerName && (
          <p className="text-[12px] font-semibold font-data text-white mb-1 leading-tight">
            {event.ownerName}
          </p>
        )}

        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-data text-[#4A5568]">
            {formatDate(event.date)}
            {isCurrent
              ? ' · Current owner'
              : event.tenureMonths != null
              ? ` · ${tenureLabel(event.tenureMonths)}`
              : ''}
          </span>
          {event.price != null && (
            <span className="text-[11px] font-bold font-data" style={{ color }}>
              {formatCurrency(event.price)}
            </span>
          )}
        </div>

        {flags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {flags.map((f) => (
              <span
                key={f.label}
                className="text-[9px] font-data px-1.5 py-0.5 rounded border leading-none"
                style={{
                  color: f.color,
                  borderColor: `${f.color}40`,
                  background: `${f.color}15`,
                }}
              >
                {f.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Detail drawer ─────────────────────────────────────────────────────────

function DetailDrawer({ event, color }: { event: OwnershipEvent; color: string }) {
  const flags = getFlags(event);
  const isCurrent = event.tenureMonths == null;

  return (
    <div
      className="mx-6 mb-5 rounded-lg border overflow-hidden"
      style={{
        borderColor: `${color}25`,
        background: `${color}08`,
        borderLeftWidth: 3,
        borderLeftColor: color,
      }}
    >
      <div className="px-4 py-3">
        {/* Owner + flags row */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: color, boxShadow: `0 0 6px ${color}60` }}
          />
          <span className="text-[13px] font-semibold font-data text-white leading-tight">
            {event.ownerName ?? 'Unknown owner'}
          </span>
          {isCurrent && (
            <span
              className="text-[9px] font-data px-1.5 py-0.5 rounded border"
              style={{ color: '#60A5FA', borderColor: '#60A5FA40', background: '#60A5FA15' }}
            >
              Current owner
            </span>
          )}
          {flags.map((f) => (
            <span
              key={f.label}
              className="text-[9px] font-data px-1.5 py-0.5 rounded border"
              style={{ color: f.color, borderColor: `${f.color}40`, background: `${f.color}15` }}
            >
              {f.label}
            </span>
          ))}
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] font-data">
          <span>
            <span className="text-[#3B4A65]">Purchased  </span>
            <span className="text-[#64748B]">{formatDate(event.date)}</span>
          </span>
          {event.price != null && (
            <span>
              <span className="text-[#3B4A65]">Price  </span>
              <span className="font-bold" style={{ color }}>
                {formatCurrency(event.price)}
              </span>
            </span>
          )}
          {event.tenureMonths != null && (
            <span>
              <span className="text-[#3B4A65]">Tenure  </span>
              <span className="text-[#64748B]">{tenureLabel(event.tenureMonths)}</span>
            </span>
          )}
        </div>

        {/* Foreclosure detail */}
        {event.foreclosureDetails && (
          <div
            className="mt-2 text-[11px] font-data rounded px-2.5 py-1.5 border"
            style={{ color: '#F97316', background: '#F9731610', borderColor: '#F9731630' }}
          >
            {event.foreclosureDetails}
          </div>
        )}

        {/* Lien detail */}
        {event.lienDetails && (
          <div
            className="mt-2 text-[11px] font-data rounded px-2.5 py-1.5 border"
            style={{ color: '#F59E0B', background: '#F59E0B10', borderColor: '#F59E0B30' }}
          >
            {event.lienDetails}
          </div>
        )}

        {/* General notes */}
        {event.notes && !event.foreclosureDetails && !event.lienDetails && (
          <p className="mt-1.5 text-[11px] font-data text-[#475569]">{event.notes}</p>
        )}
      </div>
    </div>
  );
}

// ── NOW marker ────────────────────────────────────────────────────────────

function NowMarker() {
  return (
    <div
      className="absolute flex flex-col items-center pointer-events-none"
      style={{ right: 0, top: 82 }}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{
            background: '#60A5FA15',
            border: '1.5px solid #60A5FA55',
            boxShadow: '0 0 8px #60A5FA30',
          }}
        />
        <div
          className="absolute w-2.5 h-2.5 rounded-full animate-ping"
          style={{ background: '#60A5FA18' }}
        />
      </div>
      <span
        className="font-data tracking-widest"
        style={{ fontSize: 8, color: '#60A5FA70', marginTop: 3, textTransform: 'uppercase' }}
      >
        now
      </span>
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────

function Header({ history }: { history: OwnershipHistory }) {
  return (
    <div className="px-6 py-4 border-b border-[#1A2035]">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GitBranch className="h-4 w-4 text-[#60A5FA]" />
            <span
              className="font-bold text-white"
              style={{ fontFamily: 'var(--font-syne)' }}
            >
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
            <Tag
              value={history.flipCount}
              label={`flip${history.flipCount > 1 ? 's' : ''}`}
              color="#EF4444"
            />
          )}
          {history.foreclosureCount > 0 && (
            <Tag
              value={history.foreclosureCount}
              label={`foreclosure${history.foreclosureCount > 1 ? 's' : ''}`}
              color="#F97316"
            />
          )}
          {history.lienCount > 0 && (
            <Tag
              value={history.lienCount}
              label={`lien${history.lienCount > 1 ? 's' : ''}`}
              color="#F59E0B"
            />
          )}
          {history.flipCount === 0 &&
            history.foreclosureCount === 0 &&
            history.lienCount === 0 && (
              <span className="flex items-center gap-1 text-[11px] font-data px-2.5 py-1 rounded border border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E]">
                <TrendingUp className="h-3 w-3" />
                Clean title
              </span>
            )}
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

// ── Main export ───────────────────────────────────────────────────────────

export function OwnershipTimeline({ history }: { history: OwnershipHistory }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Sort oldest → newest for left-to-right layout
  const events = [...history.events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const timeMin = new Date(events[0].date).getTime();
  const timeMax = Date.now();

  // Returns 0–100 representing position along the time axis
  const getPct = (d: string) =>
    ((new Date(d).getTime() - timeMin) / (timeMax - timeMin)) * 100;

  const lastEvent = events[events.length - 1];
  const lastPct = getPct(lastEvent.date);

  // Minimum track width keeps nodes from colliding
  const minWidth = Math.max(events.length * 150, 540);

  const selectedEvent = selectedId
    ? (events.find((e) => e.id === selectedId) ?? null)
    : null;
  const hoveredEvent = hoveredId
    ? (events.find((e) => e.id === hoveredId) ?? null)
    : null;

  // Track center Y — nodes sit here, labels extend above/below
  const CENTER_Y = 90;

  return (
    <>
      <div className="border border-[#1A2035] bg-[#0B0F1C] rounded-lg overflow-hidden reveal reveal-delay-3">
        <Header history={history} />

        {/* Scrollable track area */}
        <div className="overflow-x-auto px-6 pb-4 pt-2">
          <div className="relative" style={{ minWidth, height: 180 }}>

            {/* Solid line: oldest event → last event */}
            <div
              className="absolute"
              style={{
                top: CENTER_Y - 1,
                left: 0,
                width: `${lastPct}%`,
                height: 2,
                background: 'linear-gradient(90deg, #1A2438, #2A3C58)',
              }}
            />

            {/* Dashed tail: last event → NOW (current owner ongoing tenure) */}
            <div
              className="absolute"
              style={{
                top: CENTER_Y - 1,
                left: `${lastPct}%`,
                right: '28px',
                height: 2,
                backgroundImage:
                  'repeating-linear-gradient(90deg, #2A3C58 0, #2A3C58 5px, transparent 5px, transparent 11px)',
              }}
            />

            <NowMarker />

            {/* Commit nodes */}
            {events.map((event, index) => {
              const pct = getPct(event.date);
              const color = nodeColor(event);
              const flagged = isFlagged(event);
              const hovered = hoveredId === event.id;
              const selected = selectedId === event.id;
              // Even index = label above track, odd = label below
              const labelAbove = index % 2 === 0;
              const nodeSize = flagged ? 18 : 16;

              return (
                <div
                  key={event.id}
                  className="absolute"
                  style={{
                    left: `${pct}%`,
                    top: 0,
                    height: '100%',
                    transform: 'translateX(-50%)',
                  }}
                >
                  {/* Invisible larger hit area for easier interaction */}
                  <div
                    className="absolute rounded-full cursor-pointer"
                    style={{
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: nodeSize + 16,
                      height: nodeSize + 16,
                    }}
                    onMouseEnter={(e) => {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setTooltipPos({
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                      });
                      setHoveredId(event.id);
                    }}
                    onMouseLeave={() => {
                      setHoveredId(null);
                      setTooltipPos(null);
                    }}
                    onClick={() =>
                      setSelectedId((prev) => (prev === event.id ? null : event.id))
                    }
                  />

                  {/* Visual node */}
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: nodeSize,
                      height: nodeSize,
                    }}
                  >
                    <NodeShape
                      color={color}
                      flagged={flagged}
                      hovered={hovered}
                      selected={selected}
                    />
                  </div>

                  {/* Alternating label */}
                  <NodeLabel
                    event={event}
                    color={color}
                    above={labelAbove}
                    selected={selected}
                    hovered={hovered}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail drawer — slides open below track on click */}
        <div
          className="transition-all duration-300 ease-in-out overflow-hidden"
          style={{
            maxHeight: selectedEvent ? '300px' : '0px',
            opacity: selectedEvent ? 1 : 0,
          }}
        >
          {selectedEvent && (
            <DetailDrawer event={selectedEvent} color={nodeColor(selectedEvent)} />
          )}
        </div>
      </div>

      {/* Tooltip rendered as sibling — escapes card's overflow context */}
      {hoveredEvent && tooltipPos && (
        <TooltipFixed event={hoveredEvent} pos={tooltipPos} />
      )}
    </>
  );
}
