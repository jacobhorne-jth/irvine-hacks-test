'use client';

import { Bot, CheckCircle, AlertCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { AISummary, AIRecommendation } from '@/lib/types';

interface AISummaryCardProps {
  summary: AISummary;
}

const recConfig: Record<AIRecommendation, {
  label: string;
  icon: typeof CheckCircle;
  color: string;
}> = {
  proceed: {
    label: 'Proceed',
    icon: CheckCircle,
    color: '#22C55E',
  },
  caution: {
    label: 'Proceed with Caution',
    icon: AlertTriangle,
    color: '#F59E0B',
  },
  'high-risk': {
    label: 'High Risk — Review Carefully',
    icon: AlertCircle,
    color: '#F97316',
  },
  avoid: {
    label: 'Avoid / Consult Attorney',
    icon: XCircle,
    color: '#EF4444',
  },
};

export function AISummaryCard({ summary }: AISummaryCardProps) {
  const rec = recConfig[summary.recommendation];
  const RecIcon = rec.icon;

  return (
    <div className="border border-[#1A2035] bg-[#0B0F1C] rounded-lg overflow-hidden reveal reveal-delay-4">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#1A2035] flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-[#22C55E]" />
          <span className="font-bold text-white" style={{ fontFamily: 'var(--font-syne)' }}>
            AI Risk Analysis
          </span>
        </div>
        <span
          className="inline-flex items-center gap-1.5 text-xs font-bold font-data px-3 py-1.5 rounded border tracking-wide uppercase"
          style={{ color: rec.color, borderColor: `${rec.color}40`, background: `${rec.color}12` }}
        >
          <RecIcon className="h-3.5 w-3.5" />
          {rec.label}
        </span>
      </div>

      <div className="px-6 py-5 space-y-5">
        <p className="text-sm leading-relaxed text-[#D8DDE8]">{summary.summary}</p>

        {summary.keyRisks.length > 0 && (
          <div>
            <p className="text-[11px] font-data text-[#AABFCF] tracking-[0.2em] uppercase mb-3">
              Key Risk Factors
            </p>
            <ul className="space-y-2">
              {summary.keyRisks.map((risk, i) => (
                <li key={i} className="flex items-start gap-2">
                  <AlertCircle className="h-3.5 w-3.5 text-[#F97316] shrink-0 mt-0.5" />
                  <span className="text-sm font-data text-[#D8DDE8] leading-relaxed">{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-[10px] font-data text-[#AABFCF] border-t border-[#1A2035] pt-3">
          Generated {new Date(summary.generatedAt).toLocaleString()}
          {summary.model === 'mock-analysis' && ' · Add OPENAI_API_KEY for live AI analysis'}
        </p>
      </div>
    </div>
  );
}
