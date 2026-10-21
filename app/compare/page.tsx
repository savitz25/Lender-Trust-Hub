'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { lenders, type Lender } from '@/lib/mockData';
import { CompareLenderChoices } from '@/components/compare/compare-lender-choices';
import { Button } from '@/components/ui/button';
import { trackLenderCompareSession } from '@/lib/analytics/ga-events';

export default function ComparePage() {
  const [selected, setSelected] = useState<string[]>([]);
  const sessionTracked = useRef(false);

  function toggleLender(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  useEffect(() => {
    if (selected.length >= 2 && !sessionTracked.current) {
      sessionTracked.current = true;
      trackLenderCompareSession({ count: selected.length });
    }
  }, [selected.length]);

  const compared = selected
    .map((id) => lenders.find((l) => l.id === id))
    .filter(Boolean) as Lender[];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h1 className="text-3xl font-bold text-[#0A2540] md:text-4xl">
          Compare mortgage companies
        </h1>
        <p className="mt-3 text-zinc-600">
          Select up to 3 companies to compare NMLS status, loan types, and other listed signals.
          Research only — not rate quotes, rankings, or approvals.
        </p>
      </div>

      <CompareLenderChoices
        lenders={lenders.slice(0, 10)}
        selected={selected}
        onToggle={toggleLender}
      />

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
                {
                  label: 'NMLS ID',
                  get: (l: Lender) => (l.nmlsId ? `#${l.nmlsId}` : 'Not on file'),
                },
                {
                  label: 'NMLS status',
                  get: (l: Lender) =>
                    l.nmlsVerified ? 'ID verified' : l.nmlsId ? 'ID on file' : 'Incomplete',
                },
                {
                  label: 'Local HQ evidence',
                  get: (l: Lender) =>
                    l.county || l.city ? `${l.city || '—'}, ${l.state || l.county}` : 'Not mapped',
                },
                {
                  label: 'Closing performance',
                  get: () => 'No independently verified data',
                },
                {
                  label: 'CFPB complaints',
                  get: (l: Lender) =>
                    `${l.cfpbComplaints} (not size-normalized; not a finding of fault)`,
                },
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
