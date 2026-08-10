'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { MY_LENDING_PATH } from '@/lib/my-lending/types';
import { cn } from '@/lib/utils';

/**
 * Post-save confirmation for My Lending — calm, research-only, no lead framing.
 */
export function WorkspaceSaveToast({
  open,
  title,
  detail = 'Guest-first on this device · optional sign-in later',
  workspaceHref = MY_LENDING_PATH,
  workspaceLabel = 'Open My Lending',
  onDismiss,
  className,
}: {
  open: boolean;
  title: string;
  detail?: string;
  workspaceHref?: string;
  workspaceLabel?: string;
  onDismiss?: () => void;
  className?: string;
}) {
  if (!open) return null;

  return (
    <div
      role="status"
      className={cn(
        'absolute left-0 top-full z-20 mt-2 w-max max-w-[20rem] rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-xs shadow-md',
        className
      )}
    >
      <p className="flex items-start gap-1.5 font-medium text-[#0A2540]">
        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
        <span>{title}</span>
      </p>
      {detail ? <p className="mt-1 pl-5 text-zinc-500">{detail}</p> : null}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 pl-5">
        <Link
          href={workspaceHref}
          className="font-semibold text-emerald-800 underline-offset-2 hover:underline"
        >
          {workspaceLabel}
        </Link>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="font-medium text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline"
          >
            Keep researching
          </button>
        ) : null}
      </div>
    </div>
  );
}
