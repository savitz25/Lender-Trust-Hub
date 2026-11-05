import { getStateSlugsWithAutoProviders } from '@/lib/auto/stateProviders';
import {
  publishedAutoStatePath,
  publishedFdicStatePath,
  publishedMortgageStatePath,
} from '@/lib/directory/published-state-routes';
import { STATE_BY_CODE } from '@/lib/fdic/states';
import { getPhase1Row } from '@/lib/florida-profile/phase1';
import { getPhase2Row } from '@/lib/florida-profile/phase2';
import { lenders } from '@/lib/mockData';
import { getCohortBySlug } from '@/lib/national-profile/cohort';
import { OLD_NATIONAL_PROFILE_SLUGS } from '@/lib/national-profile/publication';

export type PathDisposition =
  | { action: 'next' }
  | { action: 'gone' }
  | { action: 'redirect'; status: 301; pathname: string };

const PUBLISHED_AUTO_STATE_SLUGS = new Set(getStateSlugsWithAutoProviders());
const MARKETPLACE_LENDER_SLUGS = new Set(lenders.map((lender) => lender.slug));

const VERTICAL =
  'fdic-insured-banks|auto-loan-companies|local-lenders|credit-repair|mca-companies';

function stripTrailingSlash(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1);
  return pathname;
}

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function stateSlugFromToken(token: string): string | null {
  const raw = decodeSegment(token).trim();
  if (!raw) return null;
  if (/^[A-Za-z]{2}$/.test(raw)) {
    return STATE_BY_CODE.get(raw.toUpperCase())?.slug ?? null;
  }
  return raw.toLowerCase().replace(/\s+/g, '-');
}

function countySlug(token: string): string | null {
  const slug = decodeSegment(token)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || null;
}

function isLiveNationalLenderSlug(slug: string): boolean {
  const key = slug.toLowerCase();
  if (Object.prototype.hasOwnProperty.call(OLD_NATIONAL_PROFILE_SLUGS, slug) ||
      Object.prototype.hasOwnProperty.call(OLD_NATIONAL_PROFILE_SLUGS, key)) {
    return true;
  }
  const resolved = (OLD_NATIONAL_PROFILE_SLUGS[slug] || OLD_NATIONAL_PROFILE_SLUGS[key] || key).toLowerCase();
  return Boolean(getCohortBySlug(resolved) || getPhase1Row(resolved) || getPhase2Row(resolved));
}

function nestedVerticalDisposition(vertical: string, rest: string): PathDisposition {
  const parts = rest.split('/').filter(Boolean);
  if (vertical === 'credit-repair' || vertical === 'mca-companies') return { action: 'gone' };

  if (vertical === 'fdic-insured-banks') {
    if (parts.length === 0) return { action: 'redirect', status: 301, pathname: '/fdic-insured-banks' };
    if (parts.length === 1) {
      const slug = stateSlugFromToken(parts[0]);
      const pathname = slug ? publishedFdicStatePath(slug) : null;
      return pathname ? { action: 'redirect', status: 301, pathname } : { action: 'gone' };
    }
    return { action: 'gone' };
  }

  if (vertical === 'auto-loan-companies') {
    if (parts.length === 0) return { action: 'redirect', status: 301, pathname: '/auto-loan-companies' };
    if (parts.length === 1) {
      const slug = stateSlugFromToken(parts[0]);
      const pathname = slug ? publishedAutoStatePath(slug) : null;
      return pathname ? { action: 'redirect', status: 301, pathname } : { action: 'gone' };
    }
    return { action: 'gone' };
  }

  if (parts.length === 0) return { action: 'redirect', status: 301, pathname: '/local-lenders' };
  const stateSlug = stateSlugFromToken(parts[0]);
  const statePath = stateSlug ? publishedMortgageStatePath(stateSlug) : null;
  if (!statePath) return { action: 'gone' };
  if (parts.length === 1) return { action: 'redirect', status: 301, pathname: statePath };
  if (parts.length === 2) {
    const county = countySlug(parts[1]);
    return county
      ? { action: 'redirect', status: 301, pathname: `${statePath}/${county}` }
      : { action: 'gone' };
  }
  return { action: 'gone' };
}

/**
 * Status for retired public paths. Live pages return next.
 * 301 only when a published successor exists. Otherwise 410.
 */
export function dispositionForPathname(input: string): PathDisposition {
  const pathname = stripTrailingSlash(input);

  if (pathname === '/credit-repair' || pathname.startsWith('/credit-repair/')) {
    return { action: 'gone' };
  }
  if (pathname === '/mca-companies' || pathname.startsWith('/mca-companies/')) {
    return { action: 'gone' };
  }

  const autoState = pathname.match(/^\/auto-loan-companies\/([^/]+)$/);
  if (autoState) {
    const raw = decodeSegment(autoState[1]).trim();
    if (PUBLISHED_AUTO_STATE_SLUGS.has(raw)) return { action: 'next' };
    const slug = stateSlugFromToken(raw);
    const canonical = slug ? publishedAutoStatePath(slug) : null;
    return canonical ? { action: 'redirect', status: 301, pathname: canonical } : { action: 'gone' };
  }

  const nested = pathname.match(new RegExp(`^/(?:lender|lenders)/(${VERTICAL})(/.*)?$`));
  if (nested) return nestedVerticalDisposition(nested[1], nested[2] || '');

  const national = pathname.match(/^\/lender\/([^/]+)$/);
  if (national) {
    const slug = decodeSegment(national[1]);
    // Live national profiles stay on /lender/{slug}. A marketplace-only slug
    // has a successor. Anything else is gone.
    if (isLiveNationalLenderSlug(slug)) return { action: 'next' };
    if (MARKETPLACE_LENDER_SLUGS.has(slug)) {
      return { action: 'redirect', status: 301, pathname: `/lenders/${slug}` };
    }
    return { action: 'gone' };
  }

  const marketplace = pathname.match(/^\/lenders\/([^/]+)(?:\/.*)?$/);
  if (marketplace) {
    return MARKETPLACE_LENDER_SLUGS.has(decodeSegment(marketplace[1]))
      ? { action: 'next' }
      : { action: 'gone' };
  }

  return { action: 'next' };
}
