/**
 * Lender match profile — parsed from calculator → directory query params.
 * Used by PersonalizedLenderBanner and filterLenders integration.
 */

import type { CreditTier, LoanType } from '@/lib/mockData';
import type { LenderFilters } from '@/lib/lenders';
import { creditTierFromRate } from '@/lib/calculators/match-profile';

/** Profile passed from calculators via URL (?loan=, ?rate=, ?loanType=, etc.) */
export interface LenderMatchProfile {
  estimatedLoan?: number;
  estimatedRate?: number;
  estimatedPayment?: number;
  ltv?: number;
  loanType?: LoanType;
  creditTier?: CreditTier;
  zip?: string;
  stateSlug?: string;
  countySlug?: string;
}

const VALID_LOAN_TYPES: LoanType[] = [
  'Conventional', 'FHA', 'VA', 'USDA', 'Jumbo', 'ARM', 'Refinance',
];

const VALID_CREDIT_TIERS: CreditTier[] = [
  'Excellent', 'Good', 'Fair', 'Rebuilding',
];

function parsePositiveNum(val: string | null): number | undefined {
  if (!val) return undefined;
  const n = parseFloat(val.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function parseLoanType(val: string | null): LoanType | undefined {
  if (!val) return undefined;
  return VALID_LOAN_TYPES.find((t) => t.toLowerCase() === val.toLowerCase());
}

function parseCreditTier(val: string | null): CreditTier | undefined {
  if (!val) return undefined;
  return VALID_CREDIT_TIERS.find((t) => t.toLowerCase() === val.toLowerCase());
}

/** Parse LenderMatchProfile from URLSearchParams or Next.js searchParams object */
export function parseLenderMatchFromParams(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
): LenderMatchProfile | null {
  const get = (key: string): string | null => {
    if (params instanceof URLSearchParams) return params.get(key);
    const v = params[key];
    if (Array.isArray(v)) return v[0] ?? null;
    return v ?? null;
  };

  const estimatedLoan = parsePositiveNum(get('loan'));
  const estimatedRate = parsePositiveNum(get('rate'));
  const estimatedPayment = parsePositiveNum(get('payment'));
  const ltv = parsePositiveNum(get('ltv'));
  const loanType = parseLoanType(get('loanType'));
  const creditTier = parseCreditTier(get('creditTier'));
  const zip = get('zip')?.trim() || undefined;
  const stateSlug = get('state')?.trim() || undefined;
  const countySlug = get('county')?.trim() || undefined;

  if (!estimatedLoan && !estimatedRate && !loanType) return null;

  const profile: LenderMatchProfile = {
    estimatedLoan,
    estimatedRate,
    estimatedPayment,
    ltv,
    loanType,
    creditTier: creditTier ?? (estimatedRate ? creditTierFromRate(estimatedRate) : undefined),
    zip,
    stateSlug,
    countySlug,
  };

  return profile;
}

export function lenderMatchToFilters(profile: LenderMatchProfile): LenderFilters {
  return {
    loanType: profile.loanType ?? 'Conventional',
    creditTier: profile.creditTier ?? 'Good',
    zip: profile.zip,
    stateSlug: profile.stateSlug,
    countySlug: profile.countySlug,
    estimatedLoan: profile.estimatedLoan,
    estimatedRate: profile.estimatedRate,
    estimatedPayment: profile.estimatedPayment,
    ltv: profile.ltv,
  };
}

export function buildMatchUrlFromProfile(profile: LenderMatchProfile, basePath = '/local-lenders'): string {
  const q = new URLSearchParams();
  if (profile.loanType) q.set('loanType', profile.loanType);
  if (profile.creditTier) q.set('creditTier', profile.creditTier);
  if (profile.estimatedLoan) q.set('loan', String(Math.round(profile.estimatedLoan)));
  if (profile.estimatedRate) q.set('rate', String(profile.estimatedRate));
  if (profile.estimatedPayment) q.set('payment', String(Math.round(profile.estimatedPayment)));
  if (profile.ltv) q.set('ltv', String(Math.round(profile.ltv)));
  if (profile.zip) q.set('zip', profile.zip);
  if (profile.stateSlug) q.set('state', profile.stateSlug);
  if (profile.countySlug) q.set('county', profile.countySlug);
  q.set('matched', '1');
  const qs = q.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function formatLoanCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${n.toLocaleString('en-US')}`;
}

export type BannerVariant = 'default' | 'emphasis' | 'compact';

const BANNER_COPY: Record<BannerVariant, (p: LenderMatchProfile) => { headline: string; body: string; cta: string }> = {
  default: (p) => ({
    headline: 'Your calculator profile is ready',
    body: buildBodyCopy(p),
    cta: 'View Matched Lenders',
  }),
  emphasis: (p) => ({
    headline: p.estimatedLoan
      ? `Lenders for your ${formatLoanCompact(p.estimatedLoan)} loan`
      : 'Find lenders matched to your numbers',
    body: `${buildBodyCopy(p)} Independent NMLS-verified directory — zero paid placements.`,
    cta: 'See Matching Lenders →',
  }),
  compact: (p) => ({
    headline: 'Matched from your calculator',
    body: buildBodyCopy(p),
    cta: 'Apply Filters',
  }),
};

function buildBodyCopy(p: LenderMatchProfile): string {
  const parts: string[] = [];
  if (p.estimatedLoan) parts.push(`${formatLoanCompact(p.estimatedLoan)} loan`);
  if (p.loanType) parts.push(p.loanType);
  if (p.estimatedRate) parts.push(`${p.estimatedRate.toFixed(2)}% rate`);
  if (p.creditTier) parts.push(`${p.creditTier} credit tier`);
  if (parts.length === 0) return 'We filtered our directory using your calculator inputs.';
  return `Showing lenders suited to a ${parts.join(' · ')}. Estimates only — not a loan offer.`;
}

export function getBannerCopy(profile: LenderMatchProfile, variant: BannerVariant = 'default') {
  return BANNER_COPY[variant](profile);
}

/**
 * Stable A/B variant assignment — persists per experiment key in sessionStorage.
 * SUPABASE_READY: sync variant to user profile for cross-device tests.
 */
export function getABVariant(
  experimentKey: string,
  variants: readonly [string, string] = ['A', 'B'],
): string {
  if (typeof window === 'undefined') return variants[0];
  const storageKey = `lth-ab-${experimentKey}`;
  try {
    const stored = sessionStorage.getItem(storageKey);
    if (stored && variants.includes(stored)) return stored;
    const assigned = variants[Math.floor(Math.random() * variants.length)];
    sessionStorage.setItem(storageKey, assigned);
    return assigned;
  } catch {
    return variants[0];
  }
}

/** Resolve effective banner variant when A/B testing is enabled */
export function resolveBannerVariant(
  propVariant: BannerVariant,
  experimentKey?: string,
): BannerVariant {
  if (!experimentKey) return propVariant;
  return getABVariant(experimentKey, ['default', 'emphasis']) as BannerVariant;
}