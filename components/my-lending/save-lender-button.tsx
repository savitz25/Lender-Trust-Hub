'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShortlistFullPanel } from '@/components/my-lending/shortlist-full-panel';
import { WorkspaceSaveToast } from '@/components/my-lending/workspace-save-toast';
import { profileSaveLabel } from '@/lib/my-lending/account-presentation';
import {
  acknowledgeDeviceSave,
  deviceFirstProfileSave,
  deviceFirstProfileUnsave,
} from '@/lib/my-lending/parent-adapter';
import {
  isLenderSaved,
  saveAsResearching,
  shortlistReplacing,
  shortlistWithDemoteOldest,
} from '@/lib/my-lending/storage';
import { type LenderResearchStatus, type SavedLender } from '@/lib/my-lending/types';
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
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fullPanel, setFullPanel] = useState<SavedLender[] | null>(null);

  const sync = useCallback(() => {
    setSaved(isLenderSaved(lenderSlug));
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

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  }

  function onSave() {
    setError(null);
    const res = deviceFirstProfileSave({ ...payload, status: defaultStatus });
    if (!res.device.ok) {
      if (res.device.reason === 'shortlist_full' && res.device.shortlisted) {
        setFullPanel(res.device.shortlisted);
        setError(res.device.error);
        return;
      }
      setError(res.device.error);
      return;
    }
    sync();
    if (!res.device.alreadySaved) {
      trackMyLendingSave({ slug: lenderSlug });
    }
    showToast(res.device.alreadySaved ? 'Already saved on this device' : 'Saved on this device');
  }

  function onUnsave() {
    setError(null);
    deviceFirstProfileUnsave({ lenderSlug, nmlsId });
    sync();
    showToast('Removed on this device');
  }

  return (
    <div className={cn('relative', className)}>
      <Button
        type="button"
        variant={saved ? 'outline' : 'trust'}
        size={size}
        onClick={saved ? onUnsave : onSave}
        aria-pressed={saved}
        aria-label={profileSaveLabel(saved)}
      >
        {profileSaveLabel(saved)}
      </Button>

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
              acknowledgeDeviceSave(payload, res);
              sync();
              showToast('Saved on this device');
            } else setError(res.error);
          }}
          onReplace={(slug) => {
            const res = shortlistReplacing({ ...payload, status: 'shortlisted' }, slug);
            setFullPanel(null);
            setError(null);
            if (res.ok) {
              acknowledgeDeviceSave(payload, res);
              sync();
              showToast('Saved on this device');
            } else setError(res.error);
          }}
          onSaveAsResearching={() => {
            const res = saveAsResearching(payload);
            setFullPanel(null);
            setError(null);
            if (res.ok) {
              acknowledgeDeviceSave(payload, res);
              sync();
              showToast('Saved on this device');
            } else setError(res.error);
          }}
        />
      ) : null}
    </div>
  );
}
