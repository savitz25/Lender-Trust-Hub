/**
 * One-account presentation for Lender Trust Hub.
 * Default OFF so production still shows the existing My Lending entry.
 * Turning this on does not start parent sync and does not change auth.
 */

export const MY_TRUSTHUB_ACCOUNT_LABEL = 'My TrustHub';
export const MY_LENDING_WORKSPACE_LABEL = 'My Lending';

/** Account authority on Ask. Rendered only while the entry flag is on. */
export const MY_TRUSTHUB_ACCOUNT_ENTRY_HREF = 'https://www.asktrusthub.com/my';

export const PROFILE_SAVE_LABEL = '♡ Save';
export const PROFILE_SAVED_LABEL = '♥ Saved';

export function profileSaveLabel(saved: boolean): typeof PROFILE_SAVE_LABEL | typeof PROFILE_SAVED_LABEL {
  return saved ? PROFILE_SAVED_LABEL : PROFILE_SAVE_LABEL;
}

/** Explicit opt-in. Unset or any other value stays off. */
export function lenderMyTrustHubAccountEntryEnabled(): boolean {
  return process.env.NEXT_PUBLIC_LENDER_MY_TRUSTHUB_ACCOUNT_ENTRY === '1';
}

export type LendingAccountPresentation =
  | {
      mode: 'legacy';
      accountLabel: 'My Lending';
      workspaceLabel: 'My Lending';
      signInTitle: 'Sign in to Lending HQ';
      signInBodyLender: string;
      signInBodyWorkspace: string;
    }
  | {
      mode: 'my_trusthub';
      accountLabel: typeof MY_TRUSTHUB_ACCOUNT_LABEL;
      workspaceLabel: typeof MY_LENDING_WORKSPACE_LABEL;
      accountHref: typeof MY_TRUSTHUB_ACCOUNT_ENTRY_HREF;
      signInTitle: string;
      signInBody: string;
    };

export function lendingAccountPresentation(): LendingAccountPresentation {
  if (!lenderMyTrustHubAccountEntryEnabled()) {
    return {
      mode: 'legacy',
      accountLabel: 'My Lending',
      workspaceLabel: 'My Lending',
      signInTitle: 'Sign in to Lending HQ',
      signInBodyLender: 'Sign in to save this lender to My Lending and sync across devices.',
      signInBodyWorkspace: 'Sign in to open Lending HQ and sync your saved research.',
    };
  }
  return {
    mode: 'my_trusthub',
    accountLabel: MY_TRUSTHUB_ACCOUNT_LABEL,
    workspaceLabel: MY_LENDING_WORKSPACE_LABEL,
    accountHref: MY_TRUSTHUB_ACCOUNT_ENTRY_HREF,
    signInTitle: 'My TrustHub is your account',
    signInBody:
      'My TrustHub is the account. My Lending keeps lender research on this device. Save does not create a Watch, and this hub does not ask you to open a separate Lender account.',
  };
}
