'use client';

import { useMemo } from 'react';
import { Download } from 'lucide-react';
import { useCalculatorStorage } from '@/hooks/useCalculatorStorage';
import { buildAmortSchedule, exportCSV } from '@/lib/calculators/engine';
import { CalcShell } from '@/components/calculators/shared/CalcShell';
import { CalcSlider } from '@/components/calculators/shared/CalcSlider';
import { MetricGrid, MetricCard } from '@/components/calculators/shared/CalcMetrics';
import { CalcLineChart } from '@/components/calculators/shared/CalcCharts';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const DEFAULTS = { principal: 320000, rate: 6.5, term: 30, extraMonthly: 200, lumpSum: 10000 };

export default function AmortizationPlanner() {
  const [s, update] = useCalculatorStorage('amortization', DEFAULTS);
  const { base, adj, saved } = useMemo(() => {
    const principal = Number(s.principal);
    const rate = Number(s.rate);
    const term = Number(s.term);
    const base = buildAmortSchedule({ principal, annualRate: rate, years: term });
    const adj = buildAmortSchedule({
      principal, annualRate: rate, years: term,
      extraMonthly: Number(s.extraMonthly), lumpSum: Number(s.lumpSum),
    });
    return { base, adj, saved: base.totalInterest - adj.totalInterest };
  }, [s]);

  const chartData = adj.schedule.filter((_, i) => i % 12 === 0).map((r, i) => ({
    label: `Yr ${r.year}`,
    balance: Math.round(r.balance),
    standard: Math.round(base.schedule[Math.min(i * 12, base.schedule.length - 1)]?.balance ?? 0),
  }));

  return (
    <CalcShell title="Amortization & Payoff Planner" subtitle="Model extra payments and see payoff acceleration instantly."
      matchProfile={{ estimatedLoan: Number(s.principal), estimatedRate: Number(s.rate), loanType: 'Conventional' }}
      actions={<Button size="sm" variant="outline" onClick={() => exportCSV([['Month', 'Payment', 'Principal', 'Interest', 'Balance'],
        ...adj.schedule.map((r) => [r.month, r.payment.toFixed(2), r.principal.toFixed(2), r.interest.toFixed(2), r.balance.toFixed(2)])], 'payoff-plan.csv')}>
        <Download className="h-4 w-4" /> CSV</Button>}>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <CalcSlider label="Loan Amount" value={Number(s.principal)} min={10000} max={2000000} step={5000} onChange={(v) => update({ principal: v })} format={formatCurrency} />
          <CalcSlider label="Rate" value={Number(s.rate)} min={2} max={12} step={0.125} onChange={(v) => update({ rate: v })} suffix="%" />
          <CalcSlider label="Extra Monthly" value={Number(s.extraMonthly)} min={0} max={3000} step={25} onChange={(v) => update({ extraMonthly: v })} format={formatCurrency} />
          <CalcSlider label="Lump Sum" value={Number(s.lumpSum)} min={0} max={100000} step={500} onChange={(v) => update({ lumpSum: v })} format={formatCurrency} />
        </div>
        <div className="space-y-4">
          <MetricGrid>
            <MetricCard label="Standard Payoff" value={base.payoffDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} />
            <MetricCard label="Accelerated" value={adj.payoffDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} highlight="teal" />
            <MetricCard label="Months Saved" value={String(base.payoffMonths - adj.payoffMonths)} />
            <MetricCard label="Interest Saved" value={formatCurrency(saved)} highlight="teal" />
          </MetricGrid>
          <CalcLineChart data={chartData} lines={[
            { key: 'balance', color: '#059669', label: 'With Extras' },
            { key: 'standard', color: '#94A3B8', dashed: true, label: 'Standard' },
          ]} />
        </div>
      </div>
    </CalcShell>
  );
}