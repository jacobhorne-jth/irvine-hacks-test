'use client';

import { useState, useEffect } from 'react';
import { getRiskColor } from '@/lib/utils';
import type { RiskLevel } from '@/lib/types';

interface RiskGaugeProps {
  score: number;
  level: RiskLevel;
  size?: number;
}

export function RiskGauge({ score, level, size = 120 }: RiskGaugeProps) {
  const color = getRiskColor(level);
  const circumference = Math.PI * 38; // π × 38 ≈ 119.38
  const targetOffset = circumference * (1 - score / 100);

  // Start fully hidden, animate to target after mount so the arc sweeps in
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const t = setTimeout(() => setOffset(targetOffset), 80);
    return () => clearTimeout(t);
  }, [targetOffset]);

  // Scale font sizes proportionally to the gauge size (base size = 120)
  const scale = size / 120;
  const scoreFontSize = 16 * scale;
  const subFontSize   = 5.5 * scale;

  return (
    <div style={{ width: size, height: Math.round(size * 0.62) }}>
      <svg viewBox="0 0 100 58" className="w-full h-full" style={{ overflow: 'visible' }}>
        {/* Background track */}
        <path
          d="M 12 54 A 38 38 0 0 1 88 54"
          fill="none"
          stroke="#1A2035"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Animated score arc */}
        <path
          d="M 12 54 A 38 38 0 0 1 88 54"
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            filter: `drop-shadow(0 0 8px ${color}80)`,
            transition: 'stroke-dashoffset 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        />
        {/* Score label */}
        <text
          x="50"
          y="47"
          textAnchor="middle"
          fill={color}
          fontSize={scoreFontSize}
          fontWeight="700"
          fontFamily="var(--font-mono, monospace)"
        >
          {score}
        </text>
        <text
          x="50"
          y="55"
          textAnchor="middle"
          fill="#3B4A65"
          fontSize={subFontSize}
          fontFamily="var(--font-mono, monospace)"
        >
          /100
        </text>
      </svg>
    </div>
  );
}
