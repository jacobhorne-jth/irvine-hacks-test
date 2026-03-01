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
      <p className="text-[11px] text-[#B0C0D0] mt-0.5">{formatDateShort(point.date)}</p>
      <p className="text-[10px] text-[#8EA5BE] capitalize mt-0.5">{point.event}</p>
    </div>
  );
}

export function PriceHistoryChart({ data }: PriceHistoryChartProps) {
  const sorted = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const sales = sorted.filter((p) => p.event === 'sale');

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
                tick={{ fontSize: 10, fill: '#8EA5BE', fontFamily: 'var(--font-mono)' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 10, fill: '#8EA5BE', fontFamily: 'var(--font-mono)' }}
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
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[10px] font-data text-[#8EA5BE] mt-3 text-center">
          Red dots = actual sale prices · Amber line = estimated values
        </p>
      </div>
    </div>
  );
}
