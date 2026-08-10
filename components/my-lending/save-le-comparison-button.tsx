'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { saveLeComparison } from '@/lib/my-lending/storage';
import { MY_LENDING_PATH } from '@/lib/my-lending/types';
import { cn } from '@/lib/utils';

type Props = {
  label?: string;
  estimates: Array<{
    id: string;
    label: string;
    inputs: Record<string, unknown>;
  }>;
  summary: string;
  headlineCallouts?: string[];
  className?: string;
};

/**
 * Save a multi–Loan Estimate comparison to My Lending (guest localStorage).
 */
export function SaveLeComparisonButton({
  label,
  estimates,
  summary,
  headlineCallouts,
  className,
}: Props) {
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSave() {
    setError(null);
    if (!estimates.length) {
      setError('Add at least two estimates before saving.');
      return;
    }
    const item = saveLeComparison({
      label,
      estimates,
      summary,
      headlineCallouts,
    });
    if (!item) {
      setError('Could not save on this device (storage blocked or full).');
      return;
    }
    setToast('Comparison saved — reopen from My Lending');
    window.setTimeout(() => setToast(null), 5000);
  }

  return (
    <div className={cn('relative', className)}>
      <Button
        type="button"
        variant="outline"
        onClick={onSave}
        className="min-h-11 gap-1.5"
      >
        <Bookmark className="h-4 w-4 text-emerald-700" aria-hidden />
        Save comparison
      </Button>
      {toast ? (
        <div
          role="status"
          className="absolute left-0 top-full z-20 mt-2 w-max max-w-[18rem] rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs shadow-md"
        >
          <p className="font-medium text-[#0A2540]">{toast}</p>
          <p className="mt-0.5 text-zinc-500">Guest-first on this device · research only</p>
          <Link
            href={MY_LENDING_PATH}
            className="mt-1 inline-block font-semibold text-emerald-800 underline"
          >
            Open My Lending workspace
          </Link>
        </div>
      ) : null}
      {error ? (
        <p className="mt-1 text-xs text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
