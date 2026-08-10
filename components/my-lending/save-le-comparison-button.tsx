'use client';

import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceSaveToast } from '@/components/my-lending/workspace-save-toast';
import { saveLeComparison } from '@/lib/my-lending/storage';
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
  const [toast, setToast] = useState(false);
  const [savedLabel, setSavedLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSave() {
    setError(null);
    if (estimates.length < 2) {
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
    setSavedLabel(item.label);
    setToast(true);
    window.setTimeout(() => setToast(false), 7000);
  }

  return (
    <div className={cn('relative', className)}>
      <Button type="button" variant="outline" onClick={onSave} className="min-h-11 gap-1.5">
        <Bookmark className="h-4 w-4 text-emerald-700" aria-hidden />
        Save comparison to My Lending
      </Button>
      <WorkspaceSaveToast
        open={toast}
        title={savedLabel ? `Comparison saved · ${savedLabel}` : 'Comparison saved'}
        detail="Reopen the same A/B/C inputs from My Lending · research only"
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
