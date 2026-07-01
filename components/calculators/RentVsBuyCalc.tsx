'use client';

import { useMemo } from 'react';
import { useCalculatorStorage } from '@/hooks/useCalculatorStorage';
import { monthlyPayment } from '@/lib/calculators/engine';
import { CalcShell } from '@/components/calculators/shared/CalcShell';
import { CalcSlider } from '@/components/calculators/shared/CalcSlider';
import { MetricGrid, MetricCard } from '@/components/calculators/shared/CalcMetrics';
import { CalcLineChart } from '@/components/calculators/shared/CalcCharts';
import { formatCurrency } from '@/lib/utils';

const DEFAULTS = { homePrice: 425000, downPct: 20, rate: 6.75, rent: 2200, rentIncrease: 3, appreciation: 3, investReturn: 7, horizon: 10 };

export default function RentVsBuyCalc() {
  const [s, update] = useCalculatorStorage('rent-vs-buy', DEFAULTS);

  const result = useMemo(() => {
    const price = Number(s.homePrice);
    const down = price * Number(s.downPct) / 100;
    const loan = price - down;
    const pi = monthlyPayment(loan, Number(s.rate), 30);
    const horizon = Number(s.horizon);
    const buyNet: { label: string; buy: number; rent: number }[] = [];
    let homeVal = price;
    let loanBal = loan;
    const r = Number(s.rate) / 100 / 12;
    let breakEven: number | null = null;

    for (let y = 1; y <= horizon; y++) {
      for (let m = 0; m < 12; m++) {
        loanBal = Math.max(0, loanBal - (pi - loanBal * r));
      }
      homeVal *= 1 + Number(s.appreciation) / 100;
      const equity = homeVal - loanBal;
      const renterNW = down * Math.pow(1 + Number(s.investReturn) / 100, y);
      buyNet.push({ label: `Yr ${y}`, buy: Math.round(equity), rent: Math.round(renterNW) });
      if (!breakEven && equity > renterNW) breakEven = y;
    }
    const last = buyNet[buyNet.length - 1];
    return { buyNet, breakEven, recommend: last && last.buy > last.rent ? 'buy' : 'rent', last };
  }, [s]);

  return (
    <CalcShell title="Rent vs. Buy Analyzer" subtitle="Compare net worth over time with clear assumptions."
      matchProfile={{ estimatedLoan: Number(s.homePrice) * (1 - Number(s.downPct) / 100), estimatedRate: Number(s.rate) }}
      onPreset={() => update({ ...DEFAULTS, horizon: 10 })} presetLabel="10-Year Horizon">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <CalcSlider label="Home Price" value={Number(s.homePrice)} min={100000} max={2000000} step={10000} onChange={(v) => update({ homePrice: v })} format={formatCurrency} />
          <CalcSlider label="Down %" value={Number(s.downPct)} min={0} max={50} step={1} onChange={(v) => update({ downPct: v })} suffix="%" />
          <CalcSlider label="Monthly Rent" value={Number(s.rent)} min={500} max={8000} step={50} onChange={(v) => update({ rent: v })} format={formatCurrency} />
          <CalcSlider label="Appreciation" value={Number(s.appreciation)} min={-2} max={10} step={0.25} onChange={(v) => update({ appreciation: v })} suffix="%" />
          <div>
            <label className="text-sm font-medium">Horizon</label>
            <select value={s.horizon} onChange={(e) => update({ horizon: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800">
              {[5, 7, 10, 15, 30].map((h) => <option key={h} value={h}>{h} years</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-4">
          <div className={`rounded-xl p-4 text-sm ${result.recommend === 'buy' ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'}`}>
            {result.recommend === 'buy' ? 'Buying may build more wealth over this horizon.' : 'Renting may be favorable short-term.'}
            {result.breakEven && ` Break-even around year ${result.breakEven}.`}
          </div>
          <MetricGrid>
            <MetricCard label="Buy Net Worth" value={formatCurrency(result.last?.buy ?? 0)} />
            <MetricCard label="Rent + Invest" value={formatCurrency(result.last?.rent ?? 0)} />
          </MetricGrid>
          <CalcLineChart data={result.buyNet} lines={[
            { key: 'buy', color: '#059669', label: 'Buy (Equity)' },
            { key: 'rent', color: '#0F172A', label: 'Rent + Invest' },
          ]} />
        </div>
      </div>
    </CalcShell>
  );
}