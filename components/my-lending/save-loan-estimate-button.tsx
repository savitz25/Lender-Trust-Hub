'use client';

import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceSaveToast } from '@/components/my-lending/workspace-save-toast';
import { saveLoanEstimate } from '@/lib/my-lending/storage';
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
  const [toast, setToast] = useState(false);
  const [savedLabel, setSavedLabel] = useState<string | null>(null);
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
    setSavedLabel(item.label);
    setToast(true);
    window.setTimeout(() => setToast(false), 7000);
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
        Save to My Lending
      </Button>
      <WorkspaceSaveToast
        open={toast}
        title={savedLabel ? `Saved “${savedLabel}”` : 'Loan Estimate saved'}
        detail="Reopen anytime from My Lending · guest-first on this device"
        onDismiss={() => setToast(false)}
      />
      {error ? (
        <p className="mt-1 text-xs text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
