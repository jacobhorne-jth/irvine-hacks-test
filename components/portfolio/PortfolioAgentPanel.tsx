'use client';

import { useState, useRef } from 'react';
import { Sparkles, X, Loader2, CheckCircle2 } from 'lucide-react';
import type { PortfolioEntry } from './SaveToPortfolioButton';
import type { PropertyAnnotation, FlagType } from '@/lib/portfolio-annotations';

type AgentState = 'idle' | 'running' | 'done';

interface ProgressState {
  current: number;
  total: number;
  address: string;
  phase: string;
}

interface PortfolioAgentPanelProps {
  entries: PortfolioEntry[];
  onAnnotationUpdate: (address: string, annotation: Partial<PropertyAnnotation>) => void;
  onPropertyAdd: (entry: PortfolioEntry) => void;
  onClear: () => void;
  onHighlightProperty: (address: string | null) => void;
}

export function PortfolioAgentPanel({
  entries,
  onAnnotationUpdate,
  onPropertyAdd,
  onClear,
  onHighlightProperty,
}: PortfolioAgentPanelProps) {
  const [state, setState] = useState<AgentState>('idle');
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [completedAddresses, setCompletedAddresses] = useState<string[]>([]);
  const [synthesis, setSynthesis] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  async function runAgent() {
    if (entries.length === 0) return;
    setState('running');
    setProgress(null);
    setCompletedAddresses([]);
    setSynthesis('');

    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/portfolio-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolio: entries }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error('Agent request failed');

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let synthBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const raw = decoder.decode(value, { stream: true });
        const lines = raw.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let event: Record<string, unknown>;
          try {
            event = JSON.parse(line.slice(6));
          } catch {
            continue;
          }

          switch (event.type) {
            case 'progress':
              setProgress({
                current: event.current as number,
                total: event.total as number,
                address: event.address as string,
                phase: event.phase as string,
              });
              break;

            case 'highlight_property':
              onHighlightProperty((event.address as string | null) ?? null);
              // When highlight clears, mark that property as completed
              if (!event.address) {
                setProgress((prev) => {
                  if (prev) {
                    setCompletedAddresses((c) => [...c, prev.address]);
                  }
                  return prev;
                });
              }
              break;

            case 'action': {
              const tool = event.tool as string;
              const payload = event.payload as Record<string, unknown>;

              if (tool === 'flag_property') {
                const addr = payload.address as string;
                const flagType = payload.flagType as FlagType;
                const reason = payload.reason as string;
                onAnnotationUpdate(addr, {
                  flag: { type: flagType, reason, timestamp: new Date().toISOString() },
                });
              } else if (tool === 'add_negotiation_note') {
                const addr = payload.address as string;
                const note = payload.note as string;
                onAnnotationUpdate(addr, {
                  note: { text: note, timestamp: new Date().toISOString() },
                });
              } else if (tool === 'add_to_portfolio') {
                const entry = payload.entry as PortfolioEntry;
                onPropertyAdd(entry);
              }
              break;
            }

            case 'text':
              synthBuffer += event.delta as string;
              setSynthesis(synthBuffer);
              break;

            case 'done':
              onHighlightProperty(null);
              setState('done');
              setSynthesis(synthBuffer);
              break;

            case 'error':
              onHighlightProperty(null);
              setState('done');
              break;
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setState('done');
      }
      onHighlightProperty(null);
    }
  }

  function handleClear() {
    abortRef.current?.abort();
    setState('idle');
    setProgress(null);
    setCompletedAddresses([]);
    setSynthesis('');
    onHighlightProperty(null);
    onClear();
  }

  // ── Idle ─────────────────────────────────────────────────────────────────
  if (state === 'idle') {
    return (
      <div className="border border-line bg-surface rounded-lg p-5 flex items-center justify-between reveal">
        <div>
          <p className="text-xs font-data text-ghost tracking-[0.2em] uppercase mb-1">AI Agent</p>
          <p className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-syne)' }}>
            Portfolio Review
          </p>
          <p className="text-xs font-data text-dim mt-0.5">
            AI scans each property, flags risks, adds negotiation notes, and suggests safer alternatives.
          </p>
        </div>
        <button
          onClick={runAgent}
          disabled={entries.length === 0}
          className="flex items-center gap-2 text-xs font-data font-bold px-4 py-2.5 rounded border border-amber/40 bg-amber/10 text-amber hover:bg-amber/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 ml-4"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Run AI Review
        </button>
      </div>
    );
  }

  const pct = progress ? Math.round((progress.current / progress.total) * 100) : 0;

  // ── Running / Done ────────────────────────────────────────────────────────
  return (
    <div className="border border-amber/30 bg-surface rounded-lg overflow-hidden reveal">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-line flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {state === 'running' ? (
            <Loader2 className="h-3.5 w-3.5 text-amber animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E]" />
          )}
          <span className="text-xs font-data text-ghost tracking-[0.2em] uppercase">
            AI Portfolio Review
          </span>
        </div>
        {state === 'done' && (
          <button
            onClick={handleClear}
            className="text-xs font-data text-ghost hover:text-[#EF4444] px-2 py-1 rounded transition-colors flex items-center gap-1"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* ── Progress block (while running) ── */}
        {state === 'running' && progress && (
          <div className="space-y-3">
            {/* Property counter */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-data text-ghost tracking-widest uppercase">
                Reviewing property {progress.current} of {progress.total}
              </span>
              <span className="text-xs font-data text-amber tabular-nums">{pct}%</span>
            </div>

            {/* Progress bar */}
            <div className="h-0.5 bg-line rounded-full overflow-hidden">
              <div
                className="h-full bg-amber rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Current address */}
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 text-amber animate-spin shrink-0" />
              <p className="text-xs font-data text-white truncate">{progress.address}</p>
              <span className="text-xs font-data text-ghost shrink-0">{progress.phase}</span>
            </div>

            {/* Completed properties mini-list */}
            {completedAddresses.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-line">
                {completedAddresses.map((addr) => (
                  <div key={addr} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-[#22C55E] shrink-0" />
                    <p className="text-[11px] font-data text-dim truncate">{addr}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Done state: completed list ── */}
        {state === 'done' && completedAddresses.length > 0 && !synthesis && (
          <div className="space-y-1">
            {completedAddresses.map((addr) => (
              <div key={addr} className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-[#22C55E] shrink-0" />
                <p className="text-[11px] font-data text-dim truncate">{addr}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Synthesis ── */}
        {synthesis && (
          <div className={completedAddresses.length > 0 ? 'border-t border-line pt-4' : ''}>
            <p className="text-[11px] font-data text-ghost tracking-[0.2em] uppercase mb-2">
              Portfolio Summary
            </p>
            <p className="text-xs font-data text-dim leading-relaxed whitespace-pre-wrap">
              {synthesis}
              {state === 'running' && (
                <span className="inline-block w-1.5 h-3.5 bg-amber/70 ml-0.5 animate-pulse align-middle" />
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
