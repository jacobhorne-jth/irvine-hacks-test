'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import type { PriceHistoryPoint } from '@/lib/types';
import { TrendingUp } from 'lucide-react';

interface PriceHistoryChartProps {
  data: PriceHistoryPoint[];
  avmValue?: number;
}

function CustomTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ value: number; payload: PriceHistoryPoint }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="bg-[#0D1120] border border-[#1A2035] rounded p-3 font-data shadow-lg">
      <p className="text-sm font-bold text-white">{formatCurrency(payload[0].value)}</p>
      <p className="text-[11px] text-[#C8D6E2] mt-0.5">{formatDateShort(point.date)}</p>
      <p className="text-xs text-[#AABFCF] capitalize mt-0.5">
        {point.event === 'estimate' && point.date === new Date().toISOString().split('T')[0]
          ? 'AVM Estimate'
          : point.event}
      </p>
    </div>
  );
}

export function PriceHistoryChart({ data, avmValue }: PriceHistoryChartProps) {
  const today = new Date().toISOString().split('T')[0];

  const withAvm: PriceHistoryPoint[] = avmValue && avmValue > 0
    ? [...data, { date: today, price: avmValue, event: 'estimate' as const }]
    : data;

  const sorted = [...withAvm].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const sales = sorted.filter((p) => p.event === 'sale');
  const avmPoint = avmValue && avmValue > 0 ? sorted.find((p) => p.date === today && p.event === 'estimate') : null;

  const formatted = sorted.map((p) => ({
    ...p,
    label: formatDateShort(p.date),
  }));

  const minPrice = Math.min(...sorted.map((p) => p.price));
  const maxPrice = Math.max(...sorted.map((p) => p.price));

  return (
    <div className="border border-[#1A2035] bg-[#0B0F1C] rounded-lg overflow-hidden reveal reveal-delay-2">
      <div className="px-6 py-4 border-b border-[#1A2035] flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-[#F5A11C]" />
        <span className="font-bold text-white" style={{ fontFamily: 'var(--font-syne)' }}>Price History</span>
      </div>
      <div className="p-6">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formatted} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F5A11C" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#F5A11C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A2035" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#AABFCF', fontFamily: 'var(--font-mono)' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 10, fill: '#AABFCF', fontFamily: 'var(--font-mono)' }}
                tickLine={false}
                axisLine={false}
                domain={[minPrice * 0.85, maxPrice * 1.05]}
                width={52}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#F5A11C"
                strokeWidth={2}
                fill="url(#priceGradient)"
              />
              {sales.map((sale) => (
                <ReferenceDot
                  key={sale.date}
                  x={formatDateShort(sale.date)}
                  y={sale.price}
                  r={5}
                  fill="#EF4444"
                  stroke="#0B0F1C"
                  strokeWidth={2}
                />
              ))}
              {avmPoint && (
                <ReferenceDot
                  x={formatDateShort(avmPoint.date)}
                  y={avmPoint.price}
                  r={6}
                  fill="#F5A11C"
                  stroke="#0B0F1C"
                  strokeWidth={2}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs font-data text-[#AABFCF] mt-3 text-center">
          Red dots = actual sale prices · <span style={{ color: '#F5A11C' }}>●</span> Orange dot = AVM estimate today
        </p>
      </div>
    </div>
  );
}
