'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  isLenderSaved,
  upsertSavedLender,
} from '@/lib/my-lending/storage';
import { MY_LENDING_PATH } from '@/lib/my-lending/types';
import { cn } from '@/lib/utils';

type Props = {
  lenderSlug: string;
  lenderName: string;
  nmlsId?: string;
  loanTypes?: string[];
  className?: string;
};

/**
 * Guest-first Save to My Lending (localStorage). Research only.
 */
export function SaveLenderButton({
  lenderSlug,
  lenderName,
  nmlsId,
  loanTypes,
  className,
}: Props) {
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setSaved(isLenderSaved(lenderSlug));
    sync();
    window.addEventListener('lth-my-lending-store', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('lth-my-lending-store', sync);
      window.removeEventListener('storage', sync);
    };
  }, [lenderSlug]);

  function onSave() {
    setError(null);
    const res = upsertSavedLender({
      lenderSlug,
      lenderName,
      profilePath: `/lenders/${lenderSlug}`,
      nmlsId,
      licenseSummary: nmlsId ? `NMLS #${nmlsId}` : undefined,
      loanTypes,
      status: 'shortlisted',
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSaved(true);
    setToast(
      res.alreadySaved
        ? 'Already in My Lending'
        : `${lenderName} saved to My Lending`
    );
    window.setTimeout(() => setToast(null), 4000);
  }

  return (
    <div className={cn('relative', className)}>
      <Button
        type="button"
        variant={saved ? 'outline' : 'trust'}
        onClick={onSave}
        aria-pressed={saved}
        aria-label={saved ? 'In My Lending' : 'Save to My Lending'}
      >
        {saved ? (
          <BookmarkCheck className="h-4 w-4" aria-hidden />
        ) : (
          <Bookmark className="h-4 w-4" aria-hidden />
        )}
        {saved ? 'In My Lending' : 'Save to My Lending'}
      </Button>
      {toast ? (
        <div
          role="status"
          className="absolute left-0 top-full z-20 mt-2 w-max max-w-[16rem] rounded-lg border border-teal-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-md"
        >
          <p className="font-medium text-slate-900">{toast}</p>
          <Link
            href={MY_LENDING_PATH}
            className="mt-1 inline-block font-semibold text-[#0d9488] underline"
          >
            Open HQ
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
