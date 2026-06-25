'use client';

import { useState } from 'react';
import { LenderCard } from '@/components/LenderCard';
import { CalculatorHub } from '@/components/CalculatorHub';
import type { Lender } from '@/lib/mockData';

export function HomeTabs({ lenders }: { lenders: Lender[] }) {
  const [tab, setTab] = useState<'directory' | 'calculators'>('directory');

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-[#0A2540] md:text-4xl">
          Explore Lenders & Calculators
        </h2>
        <p className="mt-2 text-zinc-500">
          Browse verified lenders or run interactive financial tools.
        </p>
      </div>

      <div className="mb-8 flex justify-center gap-2" role="tablist">
        {(['directory', 'calculators'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-6 py-3 text-sm font-semibold capitalize transition-colors ${
              tab === t
                ? 'bg-[#0A2540] text-white'
                : 'bg-white text-zinc-600 border border-zinc-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'directory' ? (
        <div className="mx-auto max-w-3xl space-y-4">
          {lenders.map((lender, i) => (
            <LenderCard key={lender.id} lender={lender} rank={i + 1} />
          ))}
        </div>
      ) : (
        <div className="mx-auto max-w-2xl">
          <CalculatorHub />
        </div>
      )}
    </section>
  );
}