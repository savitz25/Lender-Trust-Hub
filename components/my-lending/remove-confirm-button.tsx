'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Two-step remove to reduce accidental deletions — still lightweight. */
export function RemoveConfirmButton({
  onConfirm,
  label = 'Remove',
  className,
  size = 'sm',
}: {
  onConfirm: () => void;
  label?: string;
  className?: string;
  size?: 'sm' | 'default';
}) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = window.setTimeout(() => setArmed(false), 4500);
    return () => window.clearTimeout(t);
  }, [armed]);

  if (!armed) {
    return (
      <Button
        type="button"
        size={size}
        variant="ghost"
        className={cn('text-rose-700 hover:bg-rose-50', className)}
        onClick={() => setArmed(true)}
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
        {label}
      </Button>
    );
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      <Button
        type="button"
        size={size}
        variant="outline"
        className="border-rose-200 bg-rose-50 font-semibold text-rose-800 hover:bg-rose-100"
        onClick={() => {
          onConfirm();
          setArmed(false);
        }}
      >
        Confirm remove
      </Button>
      <Button type="button" size={size} variant="ghost" onClick={() => setArmed(false)}>
        Cancel
      </Button>
    </div>
  );
}
