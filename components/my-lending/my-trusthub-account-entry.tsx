'use client';

import { Bookmark } from 'lucide-react';
import {
  lenderMyTrustHubAccountEntryEnabled,
  MY_TRUSTHUB_ACCOUNT_ENTRY_HREF,
  MY_TRUSTHUB_ACCOUNT_LABEL,
} from '@/lib/my-lending/account-presentation';

/**
 * Prepared My TrustHub account entry. Renders nothing while the flag is off.
 * This is navigation to the account authority, not a Save sync.
 */
export function MyTrustHubAccountEntry({
  variant = 'desktop',
}: {
  variant?: 'desktop' | 'icon' | 'drawer';
}) {
  if (!lenderMyTrustHubAccountEntryEnabled()) return null;

  if (variant === 'drawer') {
    return (
      <a href={MY_TRUSTHUB_ACCOUNT_ENTRY_HREF} className="th-drawer-link">
        {MY_TRUSTHUB_ACCOUNT_LABEL}
      </a>
    );
  }

  if (variant === 'icon') {
    return (
      <a
        href={MY_TRUSTHUB_ACCOUNT_ENTRY_HREF}
        className="th-btn-icon"
        aria-label={MY_TRUSTHUB_ACCOUNT_LABEL}
      >
        <Bookmark className="h-5 w-5" aria-hidden />
      </a>
    );
  }

  return (
    <a href={MY_TRUSTHUB_ACCOUNT_ENTRY_HREF} className="th-btn-secondary" aria-label={MY_TRUSTHUB_ACCOUNT_LABEL}>
      <Bookmark className="h-4 w-4 shrink-0" aria-hidden />
      {MY_TRUSTHUB_ACCOUNT_LABEL}
    </a>
  );
}

/** One sentence on the lender workspace. Hidden while the flag is off. */
export function MyTrustHubWorkspaceNote() {
  if (!lenderMyTrustHubAccountEntryEnabled()) return null;
  return (
    <p className="text-sm text-zinc-600">
      My TrustHub is your account. My Lending is the lender workspace. Save stays on this device
      until you sign in there.
    </p>
  );
}
