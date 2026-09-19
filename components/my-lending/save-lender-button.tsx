'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useMyLendingOptional } from './my-lending-provider';
import Link from 'next/link';
import { Bookmark, BookmarkCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShortlistFullPanel } from '@/components/my-lending/shortlist-full-panel';
import { WorkspaceSaveToast } from '@/components/my-lending/workspace-save-toast';
import {
  getMyLendingStorageUserId,
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
export function SaveLenderButton(props: Props) {
  return <SaveLenderControl key={props.lenderSlug} {...props} />;
}

function SaveLenderControl({
  lenderSlug,
  lenderName,
  nmlsId,
  loanTypes,
  className,
  size = 'default',
  defaultStatus = 'shortlisted',
}: Props) {
  const ml = useMyLendingOptional();
  const hasProvider = Boolean(ml);
  const waiting = Boolean(ml?.loading || ml?.workspaceStorage.syncStatus === 'syncing');
  const owner = ml?.user?.id ?? null;
  const [pending, setPending] = useState<{ owner: string | null } | null>(null);
  const intent = useRef(false);
  const [saved, setSaved] = useState(false);
  const [record, setRecord] = useState<SavedLender | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fullPanel, setFullPanel] = useState<SavedLender[] | null>(null);
  const disclosureId = useId();
  const accountConfirmed = Boolean(owner && !ml?.loading &&
    getMyLendingStorageUserId() === owner && ml?.workspaceStorage.syncStatus === 'synced');
  const disclosure = accountConfirmed ? 'Saved to your Lending account'
    : ml?.workspaceStorage.syncStatus === 'error'
      ? 'Saved on this device — account sync unavailable'
      : 'Saved on this device';

  const sync = useCallback(() => {
    setSaved(isLenderSaved(lenderSlug));
    setRecord(getSavedLenderOnActivePlan(lenderSlug));
  }, [lenderSlug]);

  useEffect(() => {
    const initialize = window.setTimeout(sync, 0);
    window.addEventListener('lth-my-lending-store', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.clearTimeout(initialize);
      window.removeEventListener('lth-my-lending-store', sync);
      window.removeEventListener('storage', sync);
    };
  }, [sync]);

  const payload = {
    lenderSlug,
    lenderName,
    profilePath: `/lenders/${lenderSlug}`,
    nmlsId,
    licenseSummary: nmlsId ? `NMLS #${nmlsId}` : undefined,
    loanTypes,
  };

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  }, []);

  const onSave = useCallback(() => {
    if (intent.current && !waiting) return;
    if (waiting) {
      if (!intent.current) {
        intent.current = true;
        setPending({ owner });
      }
      return;
    }
    setError(null);
    if (hasProvider && getMyLendingStorageUserId() !== owner) {
      setError('Account changed. Nothing was saved. Please try Save again.');
      return;
    }
    // A second activation can arrive before React renders the first Save.
    // Do not rewrite the same record or schedule another cloud push.
    if (getSavedLenderOnActivePlan(lenderSlug)) {
      sync();
      return;
    }
    const res = shortlistLender({ lenderSlug, lenderName, nmlsId, loanTypes,
      profilePath: `/lenders/${lenderSlug}`, licenseSummary: nmlsId ? `NMLS #${nmlsId}` : undefined,
      status: defaultStatus });
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
  }, [waiting, owner, hasProvider, lenderSlug, lenderName, nmlsId, loanTypes, defaultStatus, sync, showToast]);

  useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(() => {
      intent.current = false;
      setPending(null);
      if (waiting) {
        setError('Account is still loading. Nothing was saved. Please try Save again.');
      } else if (pending.owner && pending.owner !== owner) {
        setError('Account changed. Nothing was saved. Please try Save again.');
      } else {
        onSave();
      }
    }, waiting ? 15000 : 0);
    return () => window.clearTimeout(timer);
  }, [pending, waiting, owner, onSave]);

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
      {pending ? <p role="status" className="max-w-64 text-sm">Waiting for your workspace before saving.</p> : null}
      {!saved ? (
        <Button
          type="button"
          variant="trust"
          size={size}
          onClick={onSave}
          aria-busy={Boolean(pending)}
          aria-label="Save to My Lending"
        >
          <Bookmark className="h-4 w-4" aria-hidden />
          {pending ? 'Waiting to save…' : size === 'sm' ? 'Save' : 'Save to My Lending'}
        </Button>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size={size} aria-pressed="true" aria-describedby={disclosureId}>
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
              className="text-xs font-semibold text-emerald-800 underline-offset-2 hover:underline"
            >
              My Lending
            </Link>
          )}
        </div>
      )}
      {saved ? <p id={disclosureId} role="status" className="max-w-64 text-xs">{disclosure}</p> : null}

      <WorkspaceSaveToast
        open={Boolean(toast)}
        title={toast ?? ''}
        detail="Return later from My Lending · research only, not a lead"
        workspaceLabel="Open My Lending"
        onDismiss={() => setToast(null)}
      />
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
