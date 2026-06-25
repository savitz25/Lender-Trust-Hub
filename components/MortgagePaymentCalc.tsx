'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MatchLenderButton } from '@/components/MatchLenderButton';
import { formatCurrency } from '@/lib/utils';

function calcMonthlyPayment(principal: number, annualRate: number, years: number): number {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

const COLORS = ['#3B82F6', '#14B8A6'];

export default function MortgagePaymentCalc() {
  const [amount, setAmount] = useState(350000);
  const [rate, setRate] = useState(6.5);
  const [term, setTerm] = useState(30);
  const [tab, setTab] = useState<'payment' | 'amortization' | 'breakdown'>('payment');

  const monthly = Math.round(calcMonthlyPayment(amount, rate, term));
  const totalInterest = monthly * term * 12 - amount;

  const pieData = useMemo(
    () => [
      { name: 'Principal', value: amount },
      { name: 'Interest', value: Math.max(totalInterest, 0) },
    ],
    [amount, totalInterest]
  );

  const amortData = useMemo(() => {
    const data = [];
    let balance = amount;
    const r = rate / 100 / 12;
    for (let year = 1; year <= term; year++) {
      for (let m = 0; m < 12; m++) {
        const interest = balance * r;
        const principalPaid = monthly - interest;
        balance -= principalPaid;
      }
      data.push({ year, balance: Math.max(Math.round(balance), 0) });
    }
    return data;
  }, [amount, rate, term, monthly]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mortgage Payment Maestro</CardTitle>
        <p className="text-sm text-zinc-500">
          Slide to explore — instant payment, amortization, and breakdown.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium text-[#0A2540]">Loan Amount</span>
              <span className="font-bold text-[#3B82F6]">{formatCurrency(amount)}</span>
            </div>
            <Slider
              value={[amount]}
              min={50000}
              max={1000000}
              step={10000}
              onValueChange={(v) => setAmount(v[0])}
              aria-label="Loan amount"
            />
          </div>
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium text-[#0A2540]">Interest Rate</span>
              <span className="font-bold text-[#3B82F6]">{rate.toFixed(2)}%</span>
            </div>
            <Slider
              value={[rate]}
              min={3}
              max={10}
              step={0.125}
              onValueChange={(v) => setRate(v[0])}
              aria-label="Interest rate"
            />
          </div>
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium text-[#0A2540]">Loan Term</span>
              <span className="font-bold text-[#3B82F6]">{term} years</span>
            </div>
            <Slider
              value={[term]}
              min={10}
              max={30}
              step={5}
              onValueChange={(v) => setTerm(v[0])}
              aria-label="Loan term in years"
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={monthly}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-xl bg-[#14B8A6]/10 p-6 text-center"
          >
            <p className="text-sm font-medium text-zinc-600">Estimated Monthly Payment</p>
            <p className="text-4xl font-bold text-[#14B8A6]">{formatCurrency(monthly)}/mo</p>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-2" role="tablist" aria-label="Calculator views">
          {(['payment', 'amortization', 'breakdown'] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                tab === t
                  ? 'bg-[#0A2540] text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'amortization' && (
          <div className="h-48" aria-label="Amortization chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={amortData}>
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Line type="monotone" dataKey="balance" stroke="#3B82F6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 'breakdown' && (
          <div className="flex justify-center" aria-label="Principal vs interest pie chart">
            <PieChart width={280} height={200}>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
            </PieChart>
          </div>
        )}

        <MatchLenderButton filters={{ loanType: 'Conventional' }} />
      </CardContent>
    </Card>
  );
}