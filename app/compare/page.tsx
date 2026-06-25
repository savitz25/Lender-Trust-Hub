'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star, ShieldCheck } from 'lucide-react';
import { lenders, type Lender } from '@/lib/mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function ComparePage() {
  const [selected, setSelected] = useState<string[]>([]);

  function toggleLender(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  const compared = selected
    .map((id) => lenders.find((l) => l.id === id))
    .filter(Boolean) as Lender[];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h1 className="text-3xl font-bold text-[#0A2540] md:text-4xl">
          Compare Lenders Side-by-Side
        </h1>
        <p className="mt-3 text-zinc-600">
          Select up to 3 lenders to compare trust scores, ratings, and loan types.
        </p>
      </div>

      <div className="mx-auto mb-10 max-w-3xl space-y-3">
        {lenders.slice(0, 10).map((lender) => (
          <label
            key={lender.id}
            className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors ${
              selected.includes(lender.id)
                ? 'border-[#3B82F6] bg-[#3B82F6]/5'
                : 'border-zinc-200 bg-white hover:border-zinc-300'
            }`}
          >
            <input
              type="checkbox"
              checked={selected.includes(lender.id)}
              onChange={() => toggleLender(lender.id)}
              disabled={!selected.includes(lender.id) && selected.length >= 3}
              className="h-4 w-4 rounded border-zinc-300"
              aria-label={`Select ${lender.name} for comparison`}
            />
            <div className="flex-1">
              <div className="font-semibold text-[#0A2540]">{lender.name}</div>
              <div className="text-xs text-zinc-500">
                {lender.county} County, {lender.state} · NMLS {lender.nmlsId}
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm font-semibold text-amber-700">
              <Star className="h-4 w-4 fill-current" aria-hidden="true" />
              {lender.rating.toFixed(1)}
            </div>
          </label>
        ))}
      </div>

      {compared.length >= 2 && (
        <div className="mx-auto max-w-5xl overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200">
                <th className="p-3 text-left font-semibold text-zinc-500">Metric</th>
                {compared.map((l) => (
                  <th key={l.id} className="p-3 text-left font-semibold text-[#0A2540]">
                    {l.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Trust Score', get: (l: Lender) => `${l.trustScore}/100` },
                { label: 'County Experience', get: (l: Lender) => `${l.countyExperienceScore}/100` },
                { label: 'Rating', get: (l: Lender) => `${l.rating} (${l.reviewCount.toLocaleString()} reviews)` },
                { label: 'Avg Close', get: (l: Lender) => `${l.avgCloseDays} days` },
                { label: 'On-Time Close', get: (l: Lender) => `${l.onTimeCloseRate}%` },
                { label: 'CFPB Complaints', get: (l: Lender) => String(l.cfpbComplaints) },
                { label: 'BBB', get: (l: Lender) => l.bbbRating },
                { label: 'Loan Types', get: (l: Lender) => l.loanTypes.join(', ') },
              ].map((row) => (
                <tr key={row.label} className="border-b border-zinc-100">
                  <td className="p-3 font-medium text-zinc-600">{row.label}</td>
                  {compared.map((l) => (
                    <td key={l.id} className="p-3 text-[#0A2540]">
                      {row.get(l)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            {compared.map((l) => (
              <Link key={l.id} href={`/lenders/${l.slug}`}>
                <Button variant="outline" size="sm">
                  View {l.name.split(' ')[0]}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      )}

      {compared.length < 2 && (
        <p className="text-center text-sm text-zinc-500">
          Select at least 2 lenders to see comparison.{' '}
          {selected.length > 0 && (
            <span className="trust-badge inline-flex">
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              {selected.length} selected
            </span>
          )}
        </p>
      )}
    </div>
  );
}