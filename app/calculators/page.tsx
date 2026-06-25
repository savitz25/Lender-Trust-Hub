import type { Metadata } from 'next';
import { CalculatorHub } from '@/components/CalculatorHub';

export const metadata: Metadata = {
  title: 'Mortgage Calculators',
  description:
    'Six interactive mortgage calculators: payment, affordability, refinance ROI, DTI analyzer, loan comparator, and closing costs estimator.',
};

export default function CalculatorsPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h1 className="text-3xl font-bold text-[#0A2540] md:text-4xl">
          Fun Interactive Financial Calculators
        </h1>
        <p className="mt-3 text-zinc-600">
          Real-time sliders, charts, and animations. Each tool includes a &ldquo;Match Me to
          Lenders&rdquo; button to filter our verified directory.
        </p>
      </div>
      <div className="mx-auto max-w-2xl">
        <CalculatorHub />
      </div>
    </div>
  );
}