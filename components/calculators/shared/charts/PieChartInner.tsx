'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils';

const DEFAULT_COLORS = ['#0F172A', '#3B82F6', '#059669', '#F59E0B', '#94A3B8'];

export function PieChartInner({
  data,
  colors = DEFAULT_COLORS,
  height = 220,
}: {
  data: { name: string; value: number }[];
  colors?: string[];
  height?: number;
}) {
  return (
    <div style={{ height }} aria-label="Payment breakdown chart">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={2}>
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => formatCurrency(Number(v))} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}