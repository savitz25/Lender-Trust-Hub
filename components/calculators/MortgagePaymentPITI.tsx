'use client';

import { useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { useCalculatorStorage } from '@/hooks/useCalculatorStorage';
import {
  buildAmortSchedule, calcPMI, monthlyPayment, STATE_TAX_RATES, exportCSV, yearlySummary,
} from '@/lib/calculators/engine';
import { CalcShell } from '@/components/calculators/shared/CalcShell';
import { CalcSlider } from '@/components/calculators/shared/CalcSlider';
import { ResultHero, MetricGrid, MetricCard } from '@/components/calculators/shared/CalcMetrics';
import { CalcPieChart, CalcLineChart } from '@/components/calculators/shared/CalcCharts';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const FL_PRESET = {
  homePrice: 385000, downPct: 10, rate: 6.85, term: 30,
  taxState: 'FL', taxAmount: 3427, insurance: 2200, hoa: 0,
  extraMonthly: 0, lumpSum: 0,
};

const DEFAULTS = {
  homePrice: 425000, downPct: 20, rate: 6.75, term: 30,
  taxState: 'FL', taxAmount: 3780, insurance: 1800, hoa: 0,
  pmiManual: '' as string | number, extraMonthly: 0, lumpSum: 0,
};

export default function MortgagePaymentPITI() {
  const [s, update, reset] = useCalculatorStorage('payment-piti', DEFAULTS);
  const [showTable, setShowTable] = useState(false);
  const [tableMode, setTableMode] = useState<'monthly' | 'yearly'>('yearly');

  const computed = useMemo(() => {
    const homePrice = Number(s.homePrice);
    const downPct = Number(s.downPct);
    const down$ = homePrice * downPct / 100;
    const loan = homePrice - down$;
    const ltv = homePrice > 0 ? (loan / homePrice) * 100 : 0;
    const taxAnnual = Number(s.taxAmount) || homePrice * (STATE_TAX_RATES[s.taxState] ?? 1.1) / 100;
    const rate = Number(s.rate);
    const term = Number(s.term);
    const pmi = calcPMI(loan, homePrice, s.pmiManual === '' ? null : Number(s.pmiManual));
    const pi = monthlyPayment(loan, rate, term);
    const monthlyTax = taxAnnual / 12;
    const monthlyIns = Number(s.insurance) / 12;
    const hoa = Number(s.hoa);
    const piti = pi + monthlyTax + monthlyIns + hoa + pmi;
    const base = buildAmortSchedule({ principal: loan, annualRate: rate, years: term });
    const adj = buildAmortSchedule({
      principal: loan, annualRate: rate, years: term,
      extraMonthly: Number(s.extraMonthly), lumpSum: Number(s.lumpSum),
    });
    return {
      homePrice, down$, loan, ltv, pi, pmi, piti, monthlyTax, monthlyIns, hoa,
      base, adj, interestSaved: base.totalInterest - adj.totalInterest,
    };
  }, [s]);

  const pieData = useMemo(() => [
    { name: 'P&I', value: computed.pi },
    { name: 'Tax', value: computed.monthlyTax },
    { name: 'Insurance', value: computed.monthlyIns },
    { name: 'PMI', value: computed.pmi },
    { name: 'HOA', value: computed.hoa },
  ].filter((d) => d.value > 0), [computed]);

  const lineData = useMemo(() => {
    const pts = computed.adj.schedule.filter((_, i) => i % 6 === 0 || i === computed.adj.schedule.length - 1);
    return pts.map((r, i) => ({
      label: `Mo ${r.month}`,
      balance: Math.round(r.balance),
      standard: Math.round(computed.base.schedule[Math.min(i * 6, computed.base.schedule.length - 1)]?.balance ?? 0),
    }));
  }, [computed]);

  return (
    <CalcShell
      title="Mortgage Payment Calculator"
      subtitle="Full PITI breakdown — taxes, insurance, PMI, amortization & extra payment simulator."
      matchProfile={{
        estimatedLoan: computed.loan,
        estimatedRate: Number(s.rate),
        estimatedPayment: computed.piti,
        ltv: computed.ltv,
        loanType: computed.ltv > 95 ? 'FHA' : computed.loan > 766550 ? 'Jumbo' : 'Conventional',
      }}
      onPreset={() => update(FL_PRESET)}
      presetLabel="FL First-Time Buyer"
      actions={
        <>
          <Button size="sm" variant="outline" onClick={() => window.print()} aria-label="Print results">
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button size="sm" variant="outline" onClick={() => exportCSV(
            [['Month', 'Payment', 'Principal', 'Interest', 'Balance'],
              ...computed.adj.schedule.map((r) => [r.month, r.payment.toFixed(2), r.principal.toFixed(2), r.interest.toFixed(2), r.balance.toFixed(2)])],
            'lendertrusthub-amortization.csv',
          )} aria-label="Export CSV">
            <Download className="h-4 w-4" /> CSV
          </Button>
        </>
      }
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <CalcSlider label="Home Price" value={Number(s.homePrice)} min={50000} max={3000000} step={5000}
            onChange={(v) => update({ homePrice: v })} format={formatCurrency} />
          <CalcSlider label="Down Payment %" value={Number(s.downPct)} min={0} max={50} step={0.5}
            onChange={(v) => update({ downPct: v })} suffix="%" />
          <p className="text-sm text-zinc-500">Down payment: <strong>{formatCurrency(computed.down$)}</strong></p>
          <CalcSlider label="Interest Rate" value={Number(s.rate)} min={2} max={12} step={0.125}
            onChange={(v) => update({ rate: v })} suffix="%" />
          <div>
            <label htmlFor="term-select" className="text-sm font-medium">Loan Term</label>
            <select id="term-select" value={s.term} onChange={(e) => update({ term: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800">
              {[10, 15, 20, 30].map((t) => <option key={t} value={t}>{t} years</option>)}
            </select>
          </div>
          <details className="rounded-xl border border-zinc-200 dark:border-zinc-700">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">Advanced: Taxes, Insurance, HOA & PMI</summary>
            <div className="space-y-3 border-t border-zinc-100 p-4 dark:border-zinc-800">
              <select value={s.taxState} onChange={(e) => {
                const st = e.target.value;
                update({ taxState: st, taxAmount: Math.round(Number(s.homePrice) * (STATE_TAX_RATES[st] ?? 1.1) / 100) });
              }} className="w-full rounded-lg border px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800">
                {Object.entries(STATE_TAX_RATES).map(([k, v]) => <option key={k} value={k}>{k} ({v}% avg)</option>)}
              </select>
              <CalcSlider label="Annual Property Tax" value={Number(s.taxAmount)} min={0} max={50000} step={100}
                onChange={(v) => update({ taxAmount: v })} format={formatCurrency} />
              <CalcSlider label="Annual Insurance" value={Number(s.insurance)} min={0} max={10000} step={50}
                onChange={(v) => update({ insurance: v })} format={formatCurrency} />
              <CalcSlider label="Monthly HOA" value={Number(s.hoa)} min={0} max={2000} step={25}
                onChange={(v) => update({ hoa: v })} format={formatCurrency} />
              {computed.ltv > 80 && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">LTV &gt; 80% — PMI estimated until 20% equity.</p>
              )}
            </div>
          </details>
          <details className="rounded-xl border border-zinc-200 dark:border-zinc-700" open>
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">Extra Payment Simulator</summary>
            <div className="space-y-3 border-t border-zinc-100 p-4 dark:border-zinc-800">
              <CalcSlider label="Extra Monthly" value={Number(s.extraMonthly)} min={0} max={5000} step={50}
                onChange={(v) => update({ extraMonthly: v })} format={formatCurrency} />
              <CalcSlider label="One-Time Lump Sum" value={Number(s.lumpSum)} min={0} max={100000} step={1000}
                onChange={(v) => update({ lumpSum: v })} format={formatCurrency} />
            </div>
          </details>
        </div>

        <div className="space-y-4">
          <ResultHero label="Estimated Monthly PITI" value={formatCurrency(computed.piti)}
            meta={`Payoff: ${computed.adj.payoffDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`} />
          <MetricGrid>
            <MetricCard label="P&I" value={formatCurrency(computed.pi)} />
            <MetricCard label="Tax" value={formatCurrency(computed.monthlyTax)} />
            <MetricCard label="Insurance" value={formatCurrency(computed.monthlyIns)} />
            <MetricCard label="PMI" value={formatCurrency(computed.pmi)} />
            <MetricCard label="Total Interest" value={formatCurrency(computed.adj.totalInterest)} />
            <MetricCard label="Interest Saved" value={formatCurrency(Math.max(0, computed.interestSaved))} highlight="teal" />
          </MetricGrid>
          <CalcPieChart data={pieData} />
          <CalcLineChart data={lineData} lines={[
            { key: 'balance', color: '#059669', label: 'With Extras' },
            { key: 'standard', color: '#94A3B8', dashed: true, label: 'Standard' },
          ]} />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowTable(!showTable)}>
              {showTable ? 'Hide' : 'Show'} Amortization
            </Button>
            <select value={tableMode} onChange={(e) => setTableMode(e.target.value as 'monthly' | 'yearly')}
              className="rounded-lg border px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-800">
              <option value="yearly">Yearly</option>
              <option value="monthly">Monthly</option>
            </select>
            <Button size="sm" variant="ghost" onClick={reset}>Reset</Button>
          </div>
          {showTable && (
            <div className="max-h-64 overflow-auto rounded-lg border dark:border-zinc-700">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-800">
                  <tr>
                    <th className="p-2 text-left">{tableMode === 'yearly' ? 'Year' : 'Month'}</th>
                    <th className="p-2 text-right">Principal</th>
                    <th className="p-2 text-right">Interest</th>
                    <th className="p-2 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {tableMode === 'yearly'
                    ? yearlySummary(computed.adj.schedule).map((r) => (
                        <tr key={r.year} className="border-t dark:border-zinc-800">
                          <td className="p-2">{r.year}</td>
                          <td className="p-2 text-right">{formatCurrency(r.principal)}</td>
                          <td className="p-2 text-right">{formatCurrency(r.interest)}</td>
                          <td className="p-2 text-right">{formatCurrency(r.endBalance)}</td>
                        </tr>
                      ))
                    : computed.adj.schedule.slice(0, 120).map((r) => (
                        <tr key={r.month} className="border-t dark:border-zinc-800">
                          <td className="p-2">{r.month}</td>
                          <td className="p-2 text-right">{formatCurrency(r.principal)}</td>
                          <td className="p-2 text-right">{formatCurrency(r.interest)}</td>
                          <td className="p-2 text-right">{formatCurrency(r.balance)}</td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </CalcShell>
  );
}