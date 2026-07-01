'use client';

import { useMemo } from 'react';
import { useCalculatorStorage } from '@/hooks/useCalculatorStorage';
import { monthlyPayment } from '@/lib/calculators/engine';
import { CalcShell } from '@/components/calculators/shared/CalcShell';
import { CalcSlider } from '@/components/calculators/shared/CalcSlider';
import { ResultHero, MetricGrid, MetricCard } from '@/components/calculators/shared/CalcMetrics';
import { formatCurrency } from '@/lib/utils';

const DEFAULTS = { homeValue: 550000, mortgageBal: 320000, drawAmount: 75000, maxLtv: 85, rate: 8.25, repayYears: 15 };

export default function HELOCCalc() {
  const [s, update] = useCalculatorStorage('heloc', DEFAULTS);
  const d = useMemo(() => {
    const value = Number(s.homeValue);
    const mortgage = Number(s.mortgageBal);
    const maxBorrow = Math.max(0, value * Number(s.maxLtv) / 100 - mortgage);
    const draw = Math.min(Number(s.drawAmount), maxBorrow);
    const rate = Number(s.rate);
    const io = draw * (rate / 100 / 12);
    const amort = monthlyPayment(draw, rate, Number(s.repayYears));
    return { equity: value - mortgage, maxBorrow, draw, io, amort };
  }, [s]);

  return (
    <CalcShell title="HELOC / Home Equity Calculator" subtitle="Borrowing power and payment scenarios."
      matchProfile={{ estimatedLoan: d.draw, estimatedRate: Number(s.rate), specialty: 'HELOC' }}>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <CalcSlider label="Home Value" value={Number(s.homeValue)} min={50000} max={3000000} step={10000} onChange={(v) => update({ homeValue: v })} format={formatCurrency} />
          <CalcSlider label="Mortgage Balance" value={Number(s.mortgageBal)} min={0} max={2000000} step={5000} onChange={(v) => update({ mortgageBal: v })} format={formatCurrency} />
          <CalcSlider label="Draw Amount" value={Number(s.drawAmount)} min={0} max={500000} step={5000} onChange={(v) => update({ drawAmount: v })} format={formatCurrency} />
          <CalcSlider label="Rate" value={Number(s.rate)} min={4} max={14} step={0.125} onChange={(v) => update({ rate: v })} suffix="%" />
        </div>
        <div className="space-y-4">
          <ResultHero label="Borrowing Power" value={formatCurrency(d.maxBorrow)} meta={`Equity: ${formatCurrency(d.equity)}`} />
          <MetricGrid>
            <MetricCard label="Interest-Only" value={`${formatCurrency(d.io)}/mo`} />
            <MetricCard label="Amortizing" value={`${formatCurrency(d.amort)}/mo`} />
          </MetricGrid>
        </div>
      </div>
    </CalcShell>
  );
}