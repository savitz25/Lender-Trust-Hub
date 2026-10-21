'use client';

import { Bookmark } from 'lucide-react';
import {
  lenderMyTrustHubAccountEntryEnabled,
  MY_TRUSTHUB_ACCOUNT_LABEL,
} from '@/lib/my-lending/account-presentation';
import { ISOLATED_ASK_ORIGIN } from '@/lib/my-lending/handoff-form';

const PREVIEW_SIGN_IN_HREF = ISOLATED_ASK_ORIGIN + '/my/sign-in';

/**
 * Navbar account entry. The server supplies the href.
 * A null href means the account action is unavailable: render no link.
 * This is navigation to the account authority, not a Save.
 */
export function MyTrustHubAccountEntry({
  variant = 'desktop',
  href,
}: {
  variant?: 'desktop' | 'icon' | 'drawer';
  href: string | null;
}) {
  if (!lenderMyTrustHubAccountEntryEnabled()) return null;
  if (!href) return null;

  if (variant === 'drawer') {
    return (
      <a href={href} className="th-drawer-link">
        {MY_TRUSTHUB_ACCOUNT_LABEL}
      </a>
    );
  }

  if (variant === 'icon') {
    return (
      <a href={href} className="th-btn-icon" aria-label={MY_TRUSTHUB_ACCOUNT_LABEL}>
        <Bookmark className="h-5 w-5" aria-hidden />
      </a>
    );
  }

  return (
    <a href={href} className="th-btn-secondary" aria-label={MY_TRUSTHUB_ACCOUNT_LABEL}>
      <Bookmark className="h-4 w-4 shrink-0" aria-hidden />
      {MY_TRUSTHUB_ACCOUNT_LABEL}
    </a>
  );
}

/**
 * Profile "Sign in to My TrustHub" anchor. Primary click starts save_signin.
 * Without JavaScript, or from a context menu, the browser follows href.
 * On the isolated pilot that page is generic Preview sign-in, not a completed Save.
 */
export function LenderProfileSignInLink({
  href,
  keepOpen,
  onSignIn,
}: {
  href: string;
  keepOpen: boolean;
  onSignIn: () => void;
}) {
  const previewSignIn = href === PREVIEW_SIGN_IN_HREF;
  return (
    <a
      href={href}
      className="mt-1 block text-xs font-semibold text-[#0A2540] underline"
      aria-disabled={keepOpen}
      onClick={(event) => {
        event.preventDefault();
        onSignIn();
      }}
      onAuxClick={previewSignIn ? (event) => {
        if (event.button !== 1) return;
        event.preventDefault();
        onSignIn();
      } : undefined}
    >
      Sign in to My TrustHub
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
