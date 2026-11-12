export const TRUSTHUB_HUB = 'lender' as const;

export const TRUSTHUB_EVENTS = {
  SEARCH_SUBMITTED: 'search_submitted',
  SEARCH_RESULTS_RETURNED: 'search_results_returned',
  SEARCH_RESULT_OPENED: 'search_result_opened',
  SPECIALIST_HANDOFF_STARTED: 'specialist_handoff_started',
  PROFILE_VIEWED: 'profile_viewed',
  PROFILE_SAVED: 'profile_saved',
  PROFILE_SAVE_FAILED: 'profile_save_failed',
  PROFILE_UNSAVED: 'profile_unsaved',
  CLAIM_STARTED: 'claim_started',
  PAGEVIEW: '$pageview',
} as const;

export type TrustHubEventName = (typeof TRUSTHUB_EVENTS)[keyof typeof TRUSTHUB_EVENTS];

export type TrustHubEventProperties = {
  hub?: typeof TRUSTHUB_HUB;
  environment?: 'production' | 'preview' | 'development';
  surface?: string;
  specialist_hub?: string;
  state?: string;
  capability?: string;
  result_count?: number;
  capability_state?: string;
  success?: boolean;
} & Record<string, string | number | boolean | undefined>;

export function specialistHubFromHref(href: string): string | undefined {
  try {
    const host = new URL(href, 'https://www.lendertrusthub.com').hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'insurancetrusthub.com') return 'insurance';
    if (host === 'movetrusthub.com') return 'move';
    if (host === 'asktrusthub.com') return 'ask';
    if (host === 'contractortrusthub.com') return 'contractor';
    return undefined;
  } catch {
    return undefined;
  }
}
