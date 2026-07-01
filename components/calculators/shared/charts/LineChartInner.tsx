'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils';

export function LineChartInner({
  data,
  lines,
  height = 240,
  yFormat = 'currency',
}: {
  data: Record<string, string | number>[];
  lines: { key: string; color: string; dashed?: boolean; label?: string }[];
  height?: number;
  yFormat?: 'currency' | 'number';
}) {
  const fmt = yFormat === 'currency'
    ? (v: number) => formatCurrency(v)
    : (v: number) => String(v);

  return (
    <div style={{ height }} aria-label="Line chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v) => fmt(Number(v))} tick={{ fontSize: 11 }} width={56} />
          <Tooltip formatter={(v) => fmt(Number(v))} />
          <Legend />
          {lines.map((l) => (
            <Line
              key={l.key}
              type="monotone"
              dataKey={l.key}
              name={l.label ?? l.key}
              stroke={l.color}
              strokeWidth={2}
              strokeDasharray={l.dashed ? '5 5' : undefined}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}