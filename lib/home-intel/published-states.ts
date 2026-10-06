import { PUBLISHED_STATEWIDE_SLUGS } from '@/lib/seo/published-state-path';
import { STATE_NAMES } from './states';

/**
 * Single local list behind homepage state counts, state links, and the market map.
 * Derived from PUBLISHED_STATEWIDE_SLUGS (the published /<state> routes), so a newly
 * published state shows up on the homepage without a hand-entered count.
 */
export type PublishedState = {
  slug: string;
  code: string;
  name: string;
  href: string;
  /** Present only for recently published states; restates that state page's own scope. */
  recentSummary?: string;
};

/** Newest published states first. */
const RECENT: Record<string, string> = {
  oklahoma: 'Oklahoma consumer-credit class rosters stay separate from NMLS mortgage identities and from 2025 HMDA',
  arkansas: 'Arkansas Securities Department company, branch, and loan-officer sheets stay separate from 2025 HMDA',
  mississippi: 'DBCF 7,093 mortgage lenders, branches, and originators stay unsplit; banks and 2025 HMDA stay separate',
  'south-carolina': 'SC-BFI mortgage lender/servicer license rows, with brokers, branches, originators, and HMDA kept separate',
  kentucky: 'DFI mortgage company and broker license rows, originator registrations, and 2025 Kentucky-property HMDA activity',
  indiana: 'DFI mortgage lender roster, Loan Broker Act orders, and 2025 Indiana-property HMDA activity',
  wisconsin: 'DFI license verification, 2025 Wisconsin-property HMDA activity, and selected servicing settlements',
  maryland: 'OFR license verification, 2025 Maryland-property HMDA activity, and 2022–2026 enforcement actions',
  connecticut: 'Department of Banking company and branch license workbooks, 2025 HMDA activity, and selected orders',
  michigan: 'DIFS licensing verification, selected enforcement orders, and 2025 Michigan HMDA activity',
  minnesota: 'Minnesota mortgage licensing and lending intelligence',
  nevada: 'Nevada mortgage licensing and lending intelligence',
  tennessee: 'Tennessee mortgage licensing and lending intelligence',
  massachusetts: 'Massachusetts mortgage licensing and lending intelligence',
  georgia: 'Georgia mortgage licensing and lending intelligence',
};

const CODE_BY_NAME = new Map(Object.entries(STATE_NAMES).map(([code, name]) => [name.toLowerCase(), code]));

function nameFor(slug: string): string {
  return slug
    .split('-')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

export const PUBLISHED_STATES: PublishedState[] = PUBLISHED_STATEWIDE_SLUGS.map((slug) => {
  const name = nameFor(slug);
  const code = CODE_BY_NAME.get(name.toLowerCase());
  if (!code) throw new Error(`Published state slug has no state code: ${slug}`);
  return { slug, code, name, href: `/${slug}`, recentSummary: RECENT[slug] };
}).sort((a, b) => a.name.localeCompare(b.name));

export const PUBLISHED_STATE_COUNT = PUBLISHED_STATES.length;

export const RECENT_PUBLISHED_STATES: PublishedState[] = Object.keys(RECENT)
  .map((slug) => PUBLISHED_STATES.find((state) => state.slug === slug))
  .filter((state): state is PublishedState => Boolean(state));

const HREF_BY_CODE = new Map(PUBLISHED_STATES.map((state) => [state.code, state.href]));

export function publishedStateHref(code: string): string | null {
  return HREF_BY_CODE.get(code.toUpperCase()) ?? null;
}
