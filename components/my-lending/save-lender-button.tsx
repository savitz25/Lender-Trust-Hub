'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bookmark, BookmarkCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShortlistFullPanel } from '@/components/my-lending/shortlist-full-panel';
import {
  getSavedLenderOnActivePlan,
  isLenderSaved,
  removeSavedLender,
  saveAsResearching,
  shortlistLender,
  shortlistReplacing,
  shortlistWithDemoteOldest,
  updateSavedLenderStatus,
} from '@/lib/my-lending/storage';
import {
  LENDER_STATUS_OPTIONS,
  MY_LENDING_PATH,
  type LenderResearchStatus,
  type SavedLender,
} from '@/lib/my-lending/types';
import { cn } from '@/lib/utils';
import { trackMyLendingSave } from '@/lib/analytics/ga-events';

type Props = {
  lenderSlug: string;
  lenderName: string;
  nmlsId?: string;
  loanTypes?: string[];
  className?: string;
  /** Compact control for directory cards */
  size?: 'default' | 'sm';
  /** Directory can default shortlisted (under cap); same as profile Phase B */
  defaultStatus?: LenderResearchStatus;
};

/**
 * Guest-first Save / manage My Lending (localStorage). Cap 3 shortlisted.
 */
export function SaveLenderButton({
  lenderSlug,
  lenderName,
  nmlsId,
  loanTypes,
  className,
  size = 'default',
  defaultStatus = 'shortlisted',
}: Props) {
  const [saved, setSaved] = useState(false);
  const [record, setRecord] = useState<SavedLender | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fullPanel, setFullPanel] = useState<SavedLender[] | null>(null);

  function sync() {
    setSaved(isLenderSaved(lenderSlug));
    setRecord(getSavedLenderOnActivePlan(lenderSlug));
  }

  useEffect(() => {
    sync();
    window.addEventListener('lth-my-lending-store', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('lth-my-lending-store', sync);
      window.removeEventListener('storage', sync);
    };
  }, [lenderSlug]);

  const payload = {
    lenderSlug,
    lenderName,
    profilePath: `/lenders/${lenderSlug}`,
    nmlsId,
    licenseSummary: nmlsId ? `NMLS #${nmlsId}` : undefined,
    loanTypes,
  };

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  }

  function onSave() {
    setError(null);
    const res = shortlistLender({ ...payload, status: defaultStatus });
    if (!res.ok) {
      if (res.reason === 'shortlist_full' && res.shortlisted) {
        setFullPanel(res.shortlisted);
        setError(res.error);
        return;
      }
      setError(res.error);
      return;
    }
    sync();
    if (!res.alreadySaved) {
      trackMyLendingSave({ slug: lenderSlug });
    }
    showToast(
      res.alreadySaved
        ? 'Already in My Lending'
        : res.lender.status === 'researching'
          ? `${lenderName} saved as Researching`
          : `${lenderName} shortlisted`
    );
  }

  function onRemove() {
    removeSavedLender(lenderSlug);
    sync();
    showToast('Removed from My Lending');
  }

  function onStatus(status: LenderResearchStatus) {
    if (!record) return;
    const res = updateSavedLenderStatus(record.id, status);
    if (!res.ok) {
      if (res.reason === 'shortlist_full' && res.shortlisted) {
        setFullPanel(res.shortlisted);
        setError(res.error);
        return;
      }
      setError(res.error);
      return;
    }
    sync();
  }

  return (
    <div className={cn('relative', className)}>
      {!saved ? (
        <Button
          type="button"
          variant="trust"
          size={size}
          onClick={onSave}
          aria-label="Save to My Lending"
        >
          <Bookmark className="h-4 w-4" aria-hidden />
          {size === 'sm' ? 'Save' : 'Save to My Lending'}
        </Button>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size={size} aria-pressed="true">
            <BookmarkCheck className="h-4 w-4" aria-hidden />
            {size === 'sm' ? 'Saved' : 'In My Lending'}
          </Button>
          {record && size !== 'sm' ? (
            <>
              <label className="sr-only" htmlFor={`ml-status-${lenderSlug}`}>
                Status
              </label>
              <select
                id={`ml-status-${lenderSlug}`}
                value={record.status}
                onChange={(e) => onStatus(e.target.value as LenderResearchStatus)}
                className="h-10 rounded-lg border border-zinc-200 bg-white px-2 text-sm"
              >
                {LENDER_STATUS_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="text-rose-700">
                <Trash2 className="h-4 w-4" aria-hidden />
                Remove
              </Button>
            </>
          ) : (
            <Link
              href={MY_LENDING_PATH}
              className="text-xs font-semibold text-emerald-800 underline"
            >
              HQ
            </Link>
          )}
        </div>
      )}

      {toast ? (
        <div
          role="status"
          className="absolute left-0 top-full z-20 mt-2 w-max max-w-[16rem] rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs text-zinc-700 shadow-md"
        >
          <p className="font-medium text-[#0A2540]">{toast}</p>
          <Link
            href={MY_LENDING_PATH}
            className="mt-1 inline-block font-semibold text-emerald-800 underline"
          >
            Open HQ
          </Link>
        </div>
      ) : null}
      {error && !fullPanel ? (
        <p className="mt-1 text-xs text-rose-700" role="alert">
          {error}
        </p>
      ) : null}

      {fullPanel ? (
        <ShortlistFullPanel
          shortlisted={fullPanel}
          incomingName={lenderName}
          onCancel={() => {
            setFullPanel(null);
            setError(null);
          }}
          onDemoteOldest={() => {
            const res = shortlistWithDemoteOldest({ ...payload, status: 'shortlisted' });
            setFullPanel(null);
            setError(null);
            if (res.ok) {
              sync();
              showToast(`${lenderName} shortlisted`);
            } else setError(res.error);
          }}
          onReplace={(slug) => {
            const res = shortlistReplacing({ ...payload, status: 'shortlisted' }, slug);
            setFullPanel(null);
            setError(null);
            if (res.ok) {
              sync();
              showToast(`${lenderName} shortlisted`);
            } else setError(res.error);
          }}
          onSaveAsResearching={() => {
            const res = saveAsResearching(payload);
            setFullPanel(null);
            setError(null);
            if (res.ok) {
              sync();
              showToast(`${lenderName} saved as Researching`);
            } else setError(res.error);
          }}
        />
      ) : null}
    </div>
  );
}
