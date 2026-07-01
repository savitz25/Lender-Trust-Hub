'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { CALCULATORS, type CalcId } from '@/lib/calculators/registry';
import { trackCalcEvent } from '@/lib/analytics/calculators';
import { CalcHubSkeleton } from '@/components/calculators/shared/CalcSkeleton';
import { cn } from '@/lib/utils';

const calcLoaders: Record<CalcId, () => Promise<{ default: React.ComponentType }>> = {
  payment: () => import('@/components/calculators/MortgagePaymentPITI'),
  affordability: () => import('@/components/AffordabilityFinder'),
  refinance: () => import('@/components/RefinanceROICalc'),
  amortization: () => import('@/components/calculators/AmortizationPlanner'),
  compare: () => import('@/components/LoanTypeComparator'),
  'rent-vs-buy': () => import('@/components/calculators/RentVsBuyCalc'),
  heloc: () => import('@/components/calculators/HELOCCalc'),
  'down-payment': () => import('@/components/calculators/DownPaymentCalc'),
  rental: () => import('@/components/calculators/RentalCashFlowCalc'),
  dti: () => import('@/components/DTIAnalyzer'),
  closing: () => import('@/components/ClosingCostsEstimator'),
};

function lazyCalc(id: CalcId) {
  return dynamic(calcLoaders[id], {
    ssr: false,
    loading: () => <CalcHubSkeleton />,
  });
}

const CalcComponents: Partial<Record<CalcId, React.ComponentType>> = {};
(CALCULATORS.map((c) => c.id) as CalcId[]).forEach((id) => {
  CalcComponents[id] = lazyCalc(id);
});

export function CalculatorHub({ defaultCalc }: { defaultCalc?: CalcId }) {
  const [active, setActive] = useState<CalcId | null>(defaultCalc ?? null);

  const openCalc = useCallback((id: CalcId) => {
    setActive(id);
    trackCalcEvent('calc_launch', { calc_id: id });
    history.pushState({ calc: id }, '', `#${id}`);
    document.getElementById('calc-active')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const closeCalc = useCallback(() => {
    setActive(null);
    history.replaceState({}, '', window.location.pathname);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as CalcId;
    if (hash && CALCULATORS.some((c) => c.id === hash)) setActive(hash);
    const onPop = () => {
      const h = window.location.hash.replace('#', '') as CalcId;
      setActive(CALCULATORS.some((c) => c.id === h) ? h : null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const ActiveComponent = active ? CalcComponents[active] : null;

  return (
    <div>
      {!active && (
        <section aria-label="Calculator directory">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CALCULATORS.map((calc) => {
              const Icon = calc.icon;
              return (
                <article
                  key={calc.id}
                  className={cn(
                    'group flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900',
                    calc.featured && 'border-emerald-200 bg-gradient-to-b from-white to-emerald-50/30 dark:from-zinc-900 dark:to-emerald-950/20',
                  )}
                >
                  <Icon className="mb-3 h-8 w-8 text-emerald-600" aria-hidden="true" />
                  <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">{calc.title}</h3>
                  <p className="mt-1 flex-1 text-sm text-zinc-500 dark:text-zinc-400">{calc.benefit}</p>
                  <button
                    type="button"
                    onClick={() => openCalc(calc.id)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                  >
                    Launch Calculator <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </article>
              );
            })}
            <article className="flex flex-col rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-5 dark:border-zinc-600 dark:bg-zinc-800/50">
              <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Lender Directory</h3>
              <p className="mt-1 flex-1 text-sm text-zinc-500">Search vetted mortgage lenders and brokers by state/county.</p>
              <a href="/local-lenders" className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#0F172A] hover:border-emerald-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white">
                Browse Lenders
              </a>
            </article>
          </div>
        </section>
      )}

      {active && ActiveComponent && (
        <div id="calc-active">
          <button
            type="button"
            onClick={closeCalc}
            className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to All Calculators
          </button>
          <ActiveComponent />
        </div>
      )}
    </div>
  );
}