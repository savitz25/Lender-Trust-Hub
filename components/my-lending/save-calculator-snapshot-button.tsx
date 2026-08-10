'use client';

import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceSaveToast } from '@/components/my-lending/workspace-save-toast';
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
  const [toast, setToast] = useState(false);
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
    setToast(true);
    window.setTimeout(() => setToast(false), 6000);
  }

  return (
    <div className={cn('relative', className)}>
      <Button type="button" variant="outline" size="sm" onClick={onSave} className="gap-1.5">
        <Bookmark className="h-3.5 w-3.5 text-emerald-700" aria-hidden />
        Save snapshot to My Lending
      </Button>
      <WorkspaceSaveToast
        open={toast}
        title="Calculator snapshot saved"
        detail="Educational estimate only · not a Loan Estimate"
        workspaceHref={MY_LENDING_PATH}
        workspaceLabel="Open My Lending"
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
