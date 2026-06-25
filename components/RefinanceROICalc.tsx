'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Sparkles } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MatchLenderButton } from '@/components/MatchLenderButton';
import { formatCurrency } from '@/lib/utils';

function monthlyPayment(principal: number, rate: number, years: number) {
  const r = rate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export default function RefinanceROICalc() {
  const [balance, setBalance] = useState(280000);
  const [currentRate, setCurrentRate] = useState(7.25);
  const [newRate, setNewRate] = useState(5.75);
  const [closingCosts, setClosingCosts] = useState(4500);
  const [yearsLeft, setYearsLeft] = useState(28);

  const { currentPayment, newPayment, monthlySavings, breakevenMonths, lifetimeSavings, chartData, showCelebration } =
    useMemo(() => {
      const currentPayment = monthlyPayment(balance, currentRate, yearsLeft);
      const newPayment = monthlyPayment(balance, newRate, yearsLeft);
      const monthlySavings = currentPayment - newPayment;
      const breakevenMonths = monthlySavings > 0 ? Math.ceil(closingCosts / monthlySavings) : 999;
      const lifetimeSavings = Math.max(monthlySavings * yearsLeft * 12 - closingCosts, 0);
      const chartData = Array.from({ length: 60 }, (_, i) => ({
        month: i + 1,
        savings: Math.round(monthlySavings * (i + 1) - (i + 1 >= breakevenMonths ? 0 : closingCosts)),
      }));
      const showCelebration = lifetimeSavings > 10000;
      return {
        currentPayment: Math.round(currentPayment),
        newPayment: Math.round(newPayment),
        monthlySavings: Math.round(monthlySavings),
        breakevenMonths,
        lifetimeSavings: Math.round(lifetimeSavings),
        chartData,
        showCelebration,
      };
    }, [balance, currentRate, newRate, closingCosts, yearsLeft]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Refinance ROI Simulator</CardTitle>
        <p className="text-sm text-zinc-500">Compare your current loan vs a new rate.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span>Loan Balance</span>
              <span className="font-bold text-[#3B82F6]">{formatCurrency(balance)}</span>
            </div>
            <Slider value={[balance]} min={50000} max={750000} step={10000} onValueChange={(v) => setBalance(v[0])} aria-label="Loan balance" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span>Current Rate</span>
                <span className="font-bold text-red-500">{currentRate.toFixed(2)}%</span>
              </div>
              <Slider value={[currentRate]} min={3} max={10} step={0.125} onValueChange={(v) => setCurrentRate(v[0])} aria-label="Current interest rate" />
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span>New Rate</span>
                <span className="font-bold text-[#14B8A6]">{newRate.toFixed(2)}%</span>
              </div>
              <Slider value={[newRate]} min={3} max={10} step={0.125} onValueChange={(v) => setNewRate(v[0])} aria-label="New interest rate" />
            </div>
          </div>
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span>Closing Costs</span>
              <span className="font-bold text-[#3B82F6]">{formatCurrency(closingCosts)}</span>
            </div>
            <Slider value={[closingCosts]} min={1000} max={10000} step={250} onValueChange={(v) => setClosingCosts(v[0])} aria-label="Closing costs" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-zinc-50 p-4 text-center">
            <p className="text-xs text-zinc-500">Current</p>
            <p className="text-xl font-bold">{formatCurrency(currentPayment)}/mo</p>
          </div>
          <div className="rounded-xl bg-[#14B8A6]/10 p-4 text-center">
            <p className="text-xs text-zinc-500">New</p>
            <p className="text-xl font-bold text-[#14B8A6]">{formatCurrency(newPayment)}/mo</p>
          </div>
          <div className="rounded-xl bg-[#3B82F6]/10 p-4 text-center">
            <p className="text-xs text-zinc-500">Monthly Savings</p>
            <p className="text-xl font-bold text-[#3B82F6]">{formatCurrency(monthlySavings)}</p>
          </div>
        </div>

        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 rounded-xl bg-amber-50 p-4 text-amber-800"
            >
              <Sparkles className="h-5 w-5" aria-hidden="true" />
              <span className="font-semibold">
                Lifetime savings: {formatCurrency(lifetimeSavings)}! Breakeven in {breakevenMonths} months.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-40" aria-label="Breakeven timeline chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="month" tick={{ fontSize: 10 }} label={{ value: 'Months', position: 'insideBottom', offset: -5, fontSize: 10 }} />
              <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Line type="monotone" dataKey="savings" stroke="#14B8A6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <MatchLenderButton filters={{ loanType: 'Refinance' }} label="Match Me to Refinance Lenders" />
      </CardContent>
    </Card>
  );
}