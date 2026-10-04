'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShortlistFullPanel } from '@/components/my-lending/shortlist-full-panel';
import { WorkspaceSaveToast } from '@/components/my-lending/workspace-save-toast';
import { MY_TRUSTHUB_ACCOUNT_ENTRY_HREF, profileSaveLabel } from '@/lib/my-lending/account-presentation';
import {
  handoffForm,
  markHandoffSent,
  readHandoff,
  rememberHandoff,
  resumeDecision,
  type HandoffIntent,
  type StoredHandoff,
} from '@/lib/my-lending/handoff-form';
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

function pageHidden(): boolean {
  return document.visibilityState === 'hidden';
}

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
  /** Profile pages only. Directory cards stay on the device. */
  parentHandoff?: boolean;
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
  parentHandoff = false,
}: Props) {
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fullPanel, setFullPanel] = useState<SavedLender[] | null>(null);
  const [keepOpen, setKeepOpen] = useState(false);
  const [releaseAdmitted, setReleaseAdmitted] = useState(false);

  const sync = useCallback(() => {
    setSaved(isLenderSaved(lenderSlug));
  }, [lenderSlug]);

  const submitTicket = useCallback((ticket: StoredHandoff) => {
    const form = handoffForm(ticket.target, ticket.continuationRef, ticket.intent);
    if (!form || pageHidden()) return false;
    markHandoffSent(sessionStorage, ticket);
    const element = document.createElement('form');
    element.method = 'POST';
    element.action = form.action;
    for (const [name, value] of [['continuationRef', form.continuationRef], ['intent', form.intent]] as const) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value;
      element.append(input);
    }
    document.body.append(element);
    element.submit();
    return true;
  }, []);

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

  useEffect(() => {
    if (!parentHandoff) return;
    let cancelled = false;
    setReleaseAdmitted(false);
    void fetch(`/api/my-lending/profile-save?slug=${encodeURIComponent(lenderSlug)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { admitted?: boolean } | null) => {
        if (!cancelled) setReleaseAdmitted(body?.admitted === true);
      })
      .catch(() => {
        if (!cancelled) setReleaseAdmitted(false);
      });
    return () => {
      cancelled = true;
    };
  }, [parentHandoff, lenderSlug]);

  useEffect(() => {
    if (!parentHandoff || !releaseAdmitted) return;
    const ticket = readHandoff(sessionStorage, lenderSlug, Date.now());
    if (resumeDecision(ticket, document.visibilityState) === 'submit' && ticket) submitTicket(ticket);
  }, [parentHandoff, releaseAdmitted, lenderSlug, submitTicket]);

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

  async function beginHandoff(intent: HandoffIntent): Promise<boolean> {
    if (!parentHandoff || !releaseAdmitted || pageHidden()) return false;
    setKeepOpen(true);
    try {
      const response = await fetch('/api/my-lending/profile-save', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug: lenderSlug, intent, pageOpen: true }),
      });
      const body = await response.json() as { state?: string; target?: string; continuationRef?: string; intent?: string };
      if (body.state !== 'continue' || !body.target || !body.continuationRef || !body.intent) return false;
      const form = handoffForm(body.target, body.continuationRef, body.intent);
      if (!form) return false;
      const ticket: StoredHandoff = {
        slug: lenderSlug,
        target: form.action,
        continuationRef: form.continuationRef,
        intent: form.intent,
        phase: 'staged',
        expiresAt: Date.now() + 600_000,
      };
      rememberHandoff(sessionStorage, ticket);
      if (pageHidden()) return false;
      return submitTicket(ticket);
    } catch {
      return false;
    } finally {
      setKeepOpen(false);
    }
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
    showToast(
      res.device.alreadySaved
        ? 'Already saved on this device'
        : 'Saved on this device. Sign in to My TrustHub to sync this lender.',
    );
    if (parentHandoff) void beginHandoff('save');
  }

  function onUnsave() {
    setError(null);
    deviceFirstProfileUnsave({ lenderSlug, nmlsId });
    sync();
    showToast('Removed on this device');
    if (parentHandoff) void beginHandoff('unsave');
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
      {parentHandoff && releaseAdmitted ? (
        <a
          href={MY_TRUSTHUB_ACCOUNT_ENTRY_HREF}
          className="mt-1 block text-xs font-semibold text-[#0A2540] underline"
          onClick={(event) => {
            event.preventDefault();
            void beginHandoff('save_signin').then((left) => {
              if (!left) window.location.assign(MY_TRUSTHUB_ACCOUNT_ENTRY_HREF);
            });
          }}
        >
          Sign in to My TrustHub
        </a>
      ) : null}
      {keepOpen ? (
        <p className="mt-1 text-xs text-zinc-600" role="status">Keep this page open</p>
      ) : null}

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
