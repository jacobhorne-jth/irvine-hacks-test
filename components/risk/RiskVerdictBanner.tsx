import { CheckCircle, AlertTriangle, AlertCircle, XCircle } from 'lucide-react';
import { getRiskLabel, getRiskColor } from '@/lib/utils';
import type { PropertyRiskReport, AISummary } from '@/lib/types';

const REC_CONFIG: Record<string, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = {
  proceed:     { label: 'Proceed',                  icon: CheckCircle,   color: '#22C55E' },
  caution:     { label: 'Proceed with Caution',     icon: AlertTriangle, color: '#F59E0B' },
  'high-risk': { label: 'High Risk — Review',       icon: AlertCircle,   color: '#F97316' },
  avoid:       { label: 'Avoid / Consult Attorney', icon: XCircle,       color: '#EF4444' },
};

export function RiskVerdictBanner({
  report,
  summary,
}: {
  report: PropertyRiskReport;
  summary: AISummary;
}) {
  const { titleRisk } = report;
  const rec = REC_CONFIG[summary.recommendation] ?? REC_CONFIG['caution'];
  const RecIcon = rec.icon;
  const accentColor = getRiskColor(titleRisk.level);

  const topFactors = [...titleRisk.breakdown]
    .sort((a, b) => b.points - a.points)
    .slice(0, 2);

  return (
    <div className="relative border border-line bg-surface rounded-lg overflow-hidden reveal">
      <div className="h-1 w-full" style={{ background: accentColor }} />

      <div className="px-6 py-6 flex items-center gap-6">
        {/* Title risk score */}
        <div className="border border-line rounded-lg px-8 py-5 text-center bg-surface-deep shrink-0">
          <p className="text-xs font-data text-ghost tracking-[0.15em] uppercase mb-3">
            Title Risk
          </p>
          <p
            className="text-5xl font-extrabold font-data leading-none tabular-nums"
            style={{ color: accentColor }}
          >
            {titleRisk.score}
          </p>
          <p className="text-xs font-data mt-2" style={{ color: accentColor }}>
            {getRiskLabel(titleRisk.level)}
          </p>
        </div>

        {/* Key contributors */}
        <div className="flex-1 space-y-2.5">
          {topFactors.map((factor) => (
            <div key={factor.label} className="flex items-start gap-2.5">
              <span
                className="mt-0.5 shrink-0 text-[9px] font-bold font-data px-1.5 py-0.5 rounded border tabular-nums"
                style={{
                  color: accentColor,
                  borderColor: `${accentColor}40`,
                  background: `${accentColor}12`,
                }}
              >
                {factor.points} pts
              </span>
              <p className="text-xs font-data text-[#C8D6E2] leading-snug">
                {factor.description}
              </p>
            </div>
          ))}
        </div>

        {/* Recommendation badge */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <p className="text-xs font-data text-ghost tracking-[0.2em] uppercase">
            Risk Assessment
          </p>
          <span
            className="inline-flex items-center gap-1.5 text-xs font-bold font-data px-3 py-1.5 rounded border tracking-wide uppercase"
            style={{
              color: rec.color,
              borderColor: `${rec.color}40`,
              background: `${rec.color}12`,
            }}
          >
            <RecIcon className="h-3.5 w-3.5" />
            {rec.label}
          </span>
        </div>
      </div>
    </div>
  );
}
