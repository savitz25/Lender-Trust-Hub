'use client';

import { useState } from 'react';
import MortgagePaymentCalc from '@/components/MortgagePaymentCalc';
import AffordabilityFinder from '@/components/AffordabilityFinder';
import RefinanceROICalc from '@/components/RefinanceROICalc';
import DTIAnalyzer from '@/components/DTIAnalyzer';
import LoanTypeComparator from '@/components/LoanTypeComparator';
import ClosingCostsEstimator from '@/components/ClosingCostsEstimator';

const calculators = [
  { id: 'payment', label: 'Payment Maestro', component: MortgagePaymentCalc },
  { id: 'affordability', label: 'Affordability', component: AffordabilityFinder },
  { id: 'refinance', label: 'Refinance ROI', component: RefinanceROICalc },
  { id: 'dti', label: 'DTI Analyzer', component: DTIAnalyzer },
  { id: 'compare', label: 'Loan Compare', component: LoanTypeComparator },
  { id: 'closing', label: 'Closing Costs', component: ClosingCostsEstimator },
] as const;

export function CalculatorHub({ defaultTab = 'payment' }: { defaultTab?: string }) {
  const [active, setActive] = useState(defaultTab);
  const ActiveCalc = calculators.find((c) => c.id === active)?.component ?? MortgagePaymentCalc;

  return (
    <div>
      <div
        className="mb-6 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Calculator selection"
      >
        {calculators.map((calc) => (
          <button
            key={calc.id}
            role="tab"
            aria-selected={active === calc.id}
            onClick={() => setActive(calc.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              active === calc.id
                ? 'bg-[#3B82F6] text-white'
                : 'bg-white text-zinc-600 border border-zinc-200 hover:border-[#3B82F6]'
            }`}
          >
            {calc.label}
          </button>
        ))}
      </div>
      <ActiveCalc />
    </div>
  );
}