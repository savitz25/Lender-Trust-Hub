'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MatchLenderButton } from '@/components/MatchLenderButton';
import type { LoanType } from '@/lib/mockData';

const loanTypes = [
  {
    id: 'Conventional' as LoanType,
    name: 'Conventional Fixed',
    rate: '6.25%',
    down: '3–20%',
    pros: ['No upfront MI with 20% down', 'Competitive rates for strong credit', 'Flexible terms'],
    cons: ['Stricter credit requirements', 'PMI if under 20% down'],
    bestFor: 'Buyers with good credit and stable income',
  },
  {
    id: 'ARM' as LoanType,
    name: 'Adjustable Rate (ARM)',
    rate: '5.50%',
    down: '5–10%',
    pros: ['Lower initial rate', 'Good if selling within 5–7 years', 'Rate caps protect you'],
    cons: ['Rate can increase', 'Payment uncertainty long-term'],
    bestFor: 'Short-term owners or expecting income growth',
  },
  {
    id: 'FHA' as LoanType,
    name: 'FHA Loan',
    rate: '6.00%',
    down: '3.5%',
    pros: ['Low down payment', 'Flexible credit requirements', 'Assumable loans'],
    cons: ['Upfront & monthly MI', 'Loan limits apply'],
    bestFor: 'First-time buyers or lower credit scores',
  },
];

export default function LoanTypeComparator() {
  const [selected, setSelected] = useState<LoanType>('Conventional');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Loan Type Comparator</CardTitle>
        <p className="text-sm text-zinc-500">Toggle between loan types to compare side-by-side.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Loan type selection">
          {loanTypes.map((loan) => (
            <button
              key={loan.id}
              role="tab"
              aria-selected={selected === loan.id}
              onClick={() => setSelected(loan.id)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                selected === loan.id
                  ? 'bg-[#0A2540] text-white shadow-md'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {loan.name}
            </button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {loanTypes.map((loan) => (
            <motion.div
              key={loan.id}
              layout
              animate={{
                scale: selected === loan.id ? 1.02 : 0.98,
                opacity: selected === loan.id ? 1 : 0.6,
              }}
              className={`rounded-2xl border-2 p-5 transition-colors ${
                selected === loan.id
                  ? 'border-[#3B82F6] bg-[#3B82F6]/5 shadow-lg'
                  : 'border-zinc-200 bg-white'
              }`}
            >
              <h4 className="font-bold text-[#0A2540]">{loan.name}</h4>
              <div className="mt-2 flex gap-4 text-sm">
                <span><strong>Rate:</strong> {loan.rate}</span>
                <span><strong>Down:</strong> {loan.down}</span>
              </div>
              <AnimatePresence>
                {selected === loan.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 space-y-3 overflow-hidden"
                  >
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase text-[#14B8A6]">Pros</p>
                      <ul className="space-y-1">
                        {loan.pros.map((p) => (
                          <li key={p} className="flex items-start gap-1.5 text-xs text-zinc-600">
                            <Check className="mt-0.5 h-3 w-3 shrink-0 text-[#14B8A6]" aria-hidden="true" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase text-red-500">Cons</p>
                      <ul className="space-y-1">
                        {loan.cons.map((c) => (
                          <li key={c} className="flex items-start gap-1.5 text-xs text-zinc-600">
                            <X className="mt-0.5 h-3 w-3 shrink-0 text-red-400" aria-hidden="true" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p className="text-xs text-zinc-500">
                      <strong>Best for:</strong> {loan.bestFor}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <MatchLenderButton filters={{ loanType: selected }} />
      </CardContent>
    </Card>
  );
}