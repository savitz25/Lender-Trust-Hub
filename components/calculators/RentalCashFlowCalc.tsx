'use client';

import { useMemo } from 'react';
import { useCalculatorStorage } from '@/hooks/useCalculatorStorage';
import { monthlyPayment } from '@/lib/calculators/engine';
import { CalcShell } from '@/components/calculators/shared/CalcShell';
import { CalcSlider } from '@/components/calculators/shared/CalcSlider';
import { MetricGrid, MetricCard } from '@/components/calculators/shared/CalcMetrics';
import { CalcBarChart } from '@/components/calculators/shared/CalcCharts';
import { formatCurrency } from '@/lib/utils';

const DEFAULTS = { purchasePrice: 325000, downPct: 25, rate: 7, monthlyRent: 2400, vacancy: 5, expenses: 35 };

export default function RentalCashFlowCalc() {
  const [s, update] = useCalculatorStorage('rental', DEFAULTS);

  const d = useMemo(() => {
    const price = Number(s.purchasePrice);
    const down = price * Number(s.downPct) / 100;
    const loan = price - down;
    const pi = monthlyPayment(loan, Number(s.rate), 30);
    const rent = Number(s.monthlyRent);
    const gross = rent * 12 * (1 - Number(s.vacancy) / 100);
    const opex = gross * Number(s.expenses) / 100;
    const noi = gross - opex;
    const cf = noi / 12 - pi;
    const cap = price > 0 ? (noi / price) * 100 : 0;
    const coc = down > 0 ? ((cf * 12) / down) * 100 : 0;
    const projection = [1, 2, 3, 4, 5].map((y) => ({ label: `Yr ${y}`, cashFlow: Math.round(cf * (1 + 0.02 * (y - 1))), equity: Math.round(price * Math.pow(1.03, y) - loan * 0.95) }));
    return { cf, cap, coc, noi, projection };
  }, [s]);

  return (
    <CalcShell title="Rental Property Cash Flow" subtitle="Cap rate, cash-on-cash, and 5-year projection."
      matchProfile={{ estimatedLoan: Number(s.purchasePrice) * (1 - Number(s.downPct) / 100), loanType: 'Conventional', specialty: 'Investment' }}
      onPreset={() => update(DEFAULTS)} presetLabel="Starter Rental">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <CalcSlider label="Purchase Price" value={Number(s.purchasePrice)} min={50000} max={2000000} step={5000} onChange={(v) => update({ purchasePrice: v })} format={formatCurrency} />
          <CalcSlider label="Down %" value={Number(s.downPct)} min={15} max={50} step={1} onChange={(v) => update({ downPct: v })} suffix="%" />
          <CalcSlider label="Monthly Rent" value={Number(s.monthlyRent)} min={500} max={15000} step={50} onChange={(v) => update({ monthlyRent: v })} format={formatCurrency} />
          <CalcSlider label="Vacancy %" value={Number(s.vacancy)} min={0} max={25} step={1} onChange={(v) => update({ vacancy: v })} suffix="%" />
        </div>
        <div className="space-y-4">
          <MetricGrid>
            <MetricCard label="Monthly Cash Flow" value={formatCurrency(d.cf)} highlight={d.cf >= 0 ? 'teal' : 'rose'} />
            <MetricCard label="Cap Rate" value={`${d.cap.toFixed(2)}%`} />
            <MetricCard label="Cash-on-Cash" value={`${d.coc.toFixed(2)}%`} />
            <MetricCard label="NOI" value={formatCurrency(d.noi)} />
          </MetricGrid>
          <CalcBarChart data={d.projection} bars={[
            { key: 'cashFlow', color: '#059669', label: 'Monthly CF' },
            { key: 'equity', color: '#0F172A', label: 'Equity' },
          ]} />
        </div>
      </div>
    </CalcShell>
  );
}