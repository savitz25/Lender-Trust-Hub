'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  const [retryIntent, setRetryIntent] = useState<HandoffIntent | null>(null);
  const handoffRequest = useRef<AbortController | null>(null);

  const reportHandoffFailure = useCallback((intent: HandoffIntent) => {
    setToast(null);
    setRetryIntent(intent);
    setError(intent === 'unsave'
      ? 'Removal from My TrustHub is not confirmed. Retry removal; your research on this device is unchanged.'
      : 'We could not continue to My TrustHub. Retry to continue; your research on this device is unchanged.');
  }, []);

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
      handoffRequest.current?.abort();
      handoffRequest.current = null;
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
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      let ticket: StoredHandoff | null = null;
      try {
        ticket = readHandoff(sessionStorage, lenderSlug, Date.now());
        if (resumeDecision(ticket, document.visibilityState) === 'submit' && ticket && !submitTicket(ticket)) {
          reportHandoffFailure(ticket.intent);
        }
      } catch {
        if (ticket) reportHandoffFailure(ticket.intent);
        else setError('Could not resume My TrustHub. Try your Save or Unsave again.');
      }
    });
    return () => { cancelled = true; };
  }, [parentHandoff, releaseAdmitted, lenderSlug, submitTicket, reportHandoffFailure]);

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
    if (!parentHandoff || !releaseAdmitted || handoffRequest.current) return false;
    if (pageHidden()) {
      reportHandoffFailure(intent);
      return false;
    }
    const controller = new AbortController();
    handoffRequest.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    setError(null);
    setRetryIntent(null);
    setKeepOpen(true);
    try {
      const response = await fetch('/api/my-lending/profile-save', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug: lenderSlug, intent, pageOpen: true }),
      });
      if (!response.ok) throw new Error('Handoff unavailable');
      const body = await response.json() as { state?: string; target?: string; continuationRef?: string; intent?: string };
      if (handoffRequest.current !== controller) return false;
      if (controller.signal.aborted || body.state !== 'continue' || !body.target || !body.continuationRef || !body.intent) {
        throw new Error('Handoff unavailable');
      }
      const form = handoffForm(body.target, body.continuationRef, body.intent);
      if (!form) throw new Error('Handoff unavailable');
      const ticket: StoredHandoff = {
        slug: lenderSlug,
        target: form.action,
        continuationRef: form.continuationRef,
        intent: form.intent,
        phase: 'staged',
        expiresAt: Date.now() + 600_000,
      };
      rememberHandoff(sessionStorage, ticket);
      if (!submitTicket(ticket)) throw new Error('Handoff unavailable');
      return true;
    } catch {
      if (handoffRequest.current === controller) reportHandoffFailure(intent);
      return false;
    } finally {
      window.clearTimeout(timeout);
      if (handoffRequest.current === controller) {
        handoffRequest.current = null;
        setKeepOpen(false);
      }
    }
  }

  function onSave() {
    if (handoffRequest.current) return;
    setToast(null);
    setError(null);
    setRetryIntent(null);
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
        : 'Saved on this device',
    );
    if (parentHandoff) void beginHandoff('save');
  }

  function onUnsave() {
    if (handoffRequest.current) return;
    setToast(null);
    setError(null);
    setRetryIntent(null);
    const result = deviceFirstProfileUnsave({ lenderSlug, nmlsId });
    if (!result.removed) {
      setError(result.error
        ? 'Could not remove this lender on this device. Try again.'
        : 'This lender is not saved on this device.');
      sync();
      return;
    }
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
        disabled={keepOpen}
        aria-pressed={saved}
        aria-label={profileSaveLabel(saved)}
      >
        {profileSaveLabel(saved)}
      </Button>
      {parentHandoff && releaseAdmitted ? (
        <a
          href={MY_TRUSTHUB_ACCOUNT_ENTRY_HREF}
          className="mt-1 block text-xs font-semibold text-[#0A2540] underline"
          aria-disabled={keepOpen}
          onClick={(event) => {
            event.preventDefault();
            void beginHandoff('save_signin');
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
        <div className="mt-1 text-xs text-rose-700" role="alert">
          <p>{error}</p>
          {retryIntent ? (
            <button
              type="button"
              className="mt-1 font-semibold underline"
              disabled={keepOpen}
              onClick={() => void beginHandoff(retryIntent)}
            >
              {retryIntent === 'unsave' ? 'Retry My TrustHub removal' : 'Retry My TrustHub'}
            </button>
          ) : null}
        </div>
      ) : null}

      {fullPanel ? (
        <ShortlistFullPanel
          shortlisted={fullPanel}
          incomingName={lenderName}
          onCancel={() => {
            setFullPanel(null);
            setError(null);
            setToast(null);
          }}
          onDemoteOldest={() => {
            const res = shortlistWithDemoteOldest({ ...payload, status: 'shortlisted' });
            setFullPanel(null);
            setError(null);
            setToast(null);
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
            setToast(null);
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
            setToast(null);
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
