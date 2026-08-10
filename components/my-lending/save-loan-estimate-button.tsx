'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { saveLoanEstimate } from '@/lib/my-lending/storage';
import { MY_LENDING_PATH } from '@/lib/my-lending/types';
import { cn } from '@/lib/utils';

type Props = {
  label?: string;
  inputs: Record<string, unknown>;
  summary: string;
  bandSummary?: string;
  lenderSlug?: string;
  countySlug?: string;
  className?: string;
  /** Larger touch target for tools */
  size?: 'sm' | 'default';
};

/**
 * Save a Loan Estimate analysis to My Lending (guest localStorage).
 * Does not require sign-in; optional account is separate.
 */
export function SaveLoanEstimateButton({
  label,
  inputs,
  summary,
  bandSummary,
  lenderSlug,
  countySlug,
  className,
  size = 'default',
}: Props) {
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSave() {
    setError(null);
    const item = saveLoanEstimate({
      label,
      inputs,
      summary,
      bandSummary,
      lenderSlug,
      countySlug,
    });
    if (!item) {
      setError('Could not save on this device (storage blocked or full).');
      return;
    }
    setToast('Saved — reopen anytime from My Lending');
    window.setTimeout(() => setToast(null), 5000);
  }

  return (
    <div className={cn('relative', className)}>
      <Button
        type="button"
        variant="outline"
        size={size === 'sm' ? 'sm' : 'default'}
        onClick={onSave}
        className="min-h-11 gap-1.5"
      >
        <Bookmark className="h-4 w-4 text-emerald-700" aria-hidden />
        Save research
      </Button>
      {toast ? (
        <div
          role="status"
          className="absolute left-0 top-full z-20 mt-2 w-max max-w-[18rem] rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs shadow-md"
        >
          <p className="font-medium text-[#0A2540]">{toast}</p>
          <p className="mt-0.5 text-zinc-500">Guest-first on this device · optional sign-in later</p>
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
