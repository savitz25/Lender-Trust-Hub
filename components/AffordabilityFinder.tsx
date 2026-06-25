'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MatchLenderButton } from '@/components/MatchLenderButton';
import { formatCurrency } from '@/lib/utils';

export default function AffordabilityFinder() {
  const [income, setIncome] = useState(95000);
  const [monthlyDebt, setMonthlyDebt] = useState(500);
  const [downPayment, setDownPayment] = useState(60000);
  const [rate, setRate] = useState(6.5);

  const { maxHomePrice, maxPayment, dti } = useMemo(() => {
    const monthlyIncome = income / 12;
    const maxDtiPayment = monthlyIncome * 0.36 - monthlyDebt;
    const maxPayment = Math.max(maxDtiPayment, 0);
    const r = rate / 100 / 12;
    const n = 360;
    const loanAmount =
      r === 0
        ? maxPayment * n
        : (maxPayment * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n));
    const maxHomePrice = loanAmount + downPayment;
    const dti = monthlyIncome > 0 ? ((maxPayment + monthlyDebt) / monthlyIncome) * 100 : 0;
    return { maxHomePrice: Math.round(maxHomePrice), maxPayment: Math.round(maxPayment), dti };
  }, [income, monthlyDebt, downPayment, rate]);

  const houseScale = Math.min(Math.max(maxHomePrice / 800000, 0.3), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dream Home Affordability Finder</CardTitle>
        <p className="text-sm text-zinc-500">
          See how much home you can afford with animated insights.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium">Annual Income</span>
              <span className="font-bold text-[#3B82F6]">{formatCurrency(income)}</span>
            </div>
            <Slider value={[income]} min={30000} max={300000} step={5000} onValueChange={(v) => setIncome(v[0])} aria-label="Annual income" />
          </div>
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium">Monthly Debt</span>
              <span className="font-bold text-[#3B82F6]">{formatCurrency(monthlyDebt)}</span>
            </div>
            <Slider value={[monthlyDebt]} min={0} max={3000} step={50} onValueChange={(v) => setMonthlyDebt(v[0])} aria-label="Monthly debt payments" />
          </div>
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium">Down Payment</span>
              <span className="font-bold text-[#3B82F6]">{formatCurrency(downPayment)}</span>
            </div>
            <Slider value={[downPayment]} min={0} max={200000} step={5000} onValueChange={(v) => setDownPayment(v[0])} aria-label="Down payment" />
          </div>
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium">Interest Rate</span>
              <span className="font-bold text-[#3B82F6]">{rate.toFixed(2)}%</span>
            </div>
            <Slider value={[rate]} min={3} max={10} step={0.125} onValueChange={(v) => setRate(v[0])} aria-label="Interest rate" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 rounded-xl bg-zinc-50 p-6">
          <motion.div
            animate={{ scale: houseScale }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="text-[#3B82F6]"
            aria-hidden="true"
          >
            <Home className="h-24 w-24" strokeWidth={1.5} />
          </motion.div>
          <div className="text-center">
            <p className="text-sm text-zinc-500">Estimated Max Home Price</p>
            <p className="text-3xl font-bold text-[#14B8A6]">{formatCurrency(maxHomePrice)}</p>
            <p className="mt-1 text-sm text-zinc-500">
              ~{formatCurrency(maxPayment)}/mo · DTI {dti.toFixed(0)}%
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <strong>Savings tip:</strong> Increasing your down payment by $10K could lower your monthly payment by ~$
          {Math.round((10000 * (rate / 100 / 12)) / (1 - Math.pow(1 + rate / 100 / 12, -360)))}.
        </div>

        <MatchLenderButton filters={{ loanType: 'Conventional', creditTier: 'Good' }} />
      </CardContent>
    </Card>
  );
}