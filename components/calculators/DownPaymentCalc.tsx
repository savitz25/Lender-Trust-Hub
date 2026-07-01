'use client';

import { useMemo } from 'react';
import { useCalculatorStorage } from '@/hooks/useCalculatorStorage';
import { CalcShell } from '@/components/calculators/shared/CalcShell';
import { CalcSlider } from '@/components/calculators/shared/CalcSlider';
import { ResultHero, MetricCard, MetricGrid } from '@/components/calculators/shared/CalcMetrics';
import { CalcLineChart } from '@/components/calculators/shared/CalcCharts';
import { formatCurrency } from '@/lib/utils';

const DEFAULTS = { target: 80000, current: 15000, monthly: 500, annualReturn: 4 };

export default function DownPaymentCalc() {
  const [s, update] = useCalculatorStorage('down-payment', DEFAULTS);

  const { months, balance, pts } = useMemo(() => {
    const target = Number(s.target);
    let bal = Number(s.current);
    const monthly = Number(s.monthly);
    const mr = Number(s.annualReturn) / 100 / 12;
    const chartPts: { label: string; balance: number }[] = [];
    let m = 0;
    while (bal < target && m < 360) {
      m++;
      bal += monthly + bal * mr;
      if (m % 3 === 0) chartPts.push({ label: `Mo ${m}`, balance: Math.round(bal) });
    }
    return { months: m, balance: bal, pts: chartPts };
  }, [s]);

  return (
    <CalcShell title="Down Payment Savings Planner" subtitle="Project your timeline to reach your goal."
      matchProfile={{ specialty: 'First-Time Buyer' }}>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <CalcSlider label="Target Amount" value={Number(s.target)} min={5000} max={500000} step={1000} onChange={(v) => update({ target: v })} format={formatCurrency} />
          <CalcSlider label="Current Savings" value={Number(s.current)} min={0} max={500000} step={500} onChange={(v) => update({ current: v })} format={formatCurrency} />
          <CalcSlider label="Monthly Contribution" value={Number(s.monthly)} min={0} max={10000} step={50} onChange={(v) => update({ monthly: v })} format={formatCurrency} />
          <CalcSlider label="Annual Return" value={Number(s.annualReturn)} min={0} max={12} step={0.25} onChange={(v) => update({ annualReturn: v })} suffix="%" />
        </div>
        <div className="space-y-4">
          <ResultHero label={`Goal: ${formatCurrency(Number(s.target))}`} value={`${(months / 12).toFixed(1)} years`} meta={`At ${formatCurrency(Number(s.monthly))}/mo`} />
          <MetricGrid>
            <MetricCard label="Projected Balance" value={formatCurrency(balance)} highlight="teal" />
          </MetricGrid>
          <CalcLineChart data={pts} lines={[{ key: 'balance', color: '#059669', label: 'Savings' }]} />
        </div>
      </div>
    </CalcShell>
  );
}