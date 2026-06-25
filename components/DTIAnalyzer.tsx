'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MatchLenderButton } from '@/components/MatchLenderButton';
import { formatCurrency } from '@/lib/utils';

function getDtiStatus(dti: number) {
  if (dti <= 28) return { label: 'Excellent', color: '#14B8A6', tip: 'You have strong borrowing power. Lenders will compete for your business.' };
  if (dti <= 36) return { label: 'Good', color: '#3B82F6', tip: 'You\'re within conventional guidelines. Most lenders will approve you.' };
  if (dti <= 43) return { label: 'Moderate', color: '#F59E0B', tip: 'Consider FHA or specialized programs. Pay down debt to improve options.' };
  return { label: 'High Risk', color: '#EF4444', tip: 'Focus on debt reduction. FHA and credit-rebuilding lenders may help.' };
}

export default function DTIAnalyzer() {
  const [income, setIncome] = useState(85000);
  const [housing, setHousing] = useState(1800);
  const [carLoan, setCarLoan] = useState(350);
  const [creditCards, setCreditCards] = useState(200);
  const [studentLoans, setStudentLoans] = useState(250);

  const { dti, status } = useMemo(() => {
    const monthlyIncome = income / 12;
    const totalDebt = housing + carLoan + creditCards + studentLoans;
    const dti = monthlyIncome > 0 ? (totalDebt / monthlyIncome) * 100 : 0;
    return { dti, status: getDtiStatus(dti) };
  }, [income, housing, carLoan, creditCards, studentLoans]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Debt-to-Income Analyzer</CardTitle>
        <p className="text-sm text-zinc-500">Visual DTI meter with personalized tips.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span>Annual Income</span>
              <span className="font-bold text-[#3B82F6]">{formatCurrency(income)}</span>
            </div>
            <Slider value={[income]} min={30000} max={250000} step={5000} onValueChange={(v) => setIncome(v[0])} aria-label="Annual income" />
          </div>
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span>Housing Payment</span>
              <span className="font-bold">{formatCurrency(housing)}/mo</span>
            </div>
            <Slider value={[housing]} min={0} max={5000} step={50} onValueChange={(v) => setHousing(v[0])} aria-label="Monthly housing payment" />
          </div>
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span>Car Loan</span>
              <span className="font-bold">{formatCurrency(carLoan)}/mo</span>
            </div>
            <Slider value={[carLoan]} min={0} max={1000} step={25} onValueChange={(v) => setCarLoan(v[0])} aria-label="Monthly car loan payment" />
          </div>
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span>Credit Cards</span>
              <span className="font-bold">{formatCurrency(creditCards)}/mo</span>
            </div>
            <Slider value={[creditCards]} min={0} max={1000} step={25} onValueChange={(v) => setCreditCards(v[0])} aria-label="Monthly credit card payments" />
          </div>
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span>Student Loans</span>
              <span className="font-bold">{formatCurrency(studentLoans)}/mo</span>
            </div>
            <Slider value={[studentLoans]} min={0} max={1000} step={25} onValueChange={(v) => setStudentLoans(v[0])} aria-label="Monthly student loan payments" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Your DTI Ratio</span>
            <span className="text-2xl font-bold" style={{ color: status.color }}>
              {dti.toFixed(1)}%
            </span>
          </div>
          <div
            className="relative h-4 overflow-hidden rounded-full bg-zinc-200"
            role="meter"
            aria-valuenow={Math.round(dti)}
            aria-valuemin={0}
            aria-valuemax={60}
            aria-label={`Debt-to-income ratio: ${dti.toFixed(1)} percent, ${status.label}`}
          >
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ backgroundColor: status.color }}
              animate={{ width: `${Math.min(dti / 60 * 100, 100)}%` }}
              transition={{ type: 'spring', stiffness: 100 }}
            />
            <div className="absolute left-[46.7%] top-0 h-full w-px bg-zinc-400" title="36% guideline" />
            <div className="absolute left-[71.7%] top-0 h-full w-px bg-zinc-400" title="43% FHA max" />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-400">
            <span>0%</span>
            <span>28%</span>
            <span>36%</span>
            <span>43%</span>
            <span>60%</span>
          </div>
        </div>

        <div
          className="rounded-xl p-4 text-sm"
          style={{ backgroundColor: `${status.color}15`, color: status.color }}
        >
          <strong>{status.label}:</strong> {status.tip}
        </div>

        <MatchLenderButton
          filters={{ loanType: dti > 43 ? 'FHA' : 'Conventional', creditTier: dti > 36 ? 'Fair' : 'Good' }}
        />
      </CardContent>
    </Card>
  );
}