'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { addCalculatorSnapshot } from '@/lib/my-lending/storage';
import { MY_LENDING_PATH } from '@/lib/my-lending/types';
import { cn } from '@/lib/utils';

type Props = {
  toolId: string;
  title: string;
  summary: string;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  href?: string;
  className?: string;
};

/**
 * Save educational calculator result to active My Lending plan.
 */
export function SaveCalculatorSnapshotButton({
  toolId,
  title,
  summary,
  inputs,
  outputs,
  href = '/calculators',
  className,
}: Props) {
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSave() {
    setError(null);
    const snap = addCalculatorSnapshot({
      toolId,
      title,
      summary,
      inputs,
      outputs,
      href,
    });
    if (!snap) {
      setError('Could not save snapshot on this device.');
      return;
    }
    setToast('Snapshot saved to My Lending');
    window.setTimeout(() => setToast(null), 4000);
  }

  return (
    <div className={cn('relative', className)}>
      <Button type="button" variant="outline" size="sm" onClick={onSave} className="gap-1.5">
        <Bookmark className="h-3.5 w-3.5 text-emerald-700" aria-hidden />
        Save snapshot to My Lending
      </Button>
      {toast ? (
        <div
          role="status"
          className="absolute left-0 top-full z-20 mt-2 w-max max-w-[16rem] rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs shadow-md"
        >
          <p className="font-medium text-[#0A2540]">{toast}</p>
          <Link
            href={`${MY_LENDING_PATH}/report`}
            className="mt-1 inline-block font-semibold text-emerald-800 underline"
          >
            View report
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
