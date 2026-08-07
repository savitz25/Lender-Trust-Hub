import { lenders, ZIP_TO_COUNTY, type Lender, type LoanType, type CreditTier } from './mockData';
import { FLORIDA_COUNTY_SUPPLEMENTS } from '@/lib/mortgage/floridaLenders';
import { GEORGIA_COUNTY_SUPPLEMENTS } from '@/lib/mortgage/georgiaLenders';
import { SOUTH_CAROLINA_COUNTY_SUPPLEMENTS } from '@/lib/mortgage/southCarolinaLenders';
import { NORTH_CAROLINA_COUNTY_SUPPLEMENTS } from '@/lib/mortgage/northCarolinaLenders';
import { TENNESSEE_COUNTY_SUPPLEMENTS } from '@/lib/mortgage/tennesseeLenders';
import { ARIZONA_COUNTY_SUPPLEMENTS } from '@/lib/mortgage/arizonaLenders';
import { CALIFORNIA_COUNTY_SUPPLEMENTS } from '@/lib/mortgage/californiaLenders';
import { COLORADO_COUNTY_SUPPLEMENTS } from '@/lib/mortgage/coloradoLenders';
import { TEXAS_COUNTY_SUPPLEMENTS } from '@/lib/mortgage/texasLenders';
import { WASHINGTON_COUNTY_SUPPLEMENTS } from '@/lib/mortgage/washingtonLenders';
import { DC_COUNTY_SUPPLEMENTS } from '@/lib/mortgage/districtOfColumbiaLenders';
import { MASSACHUSETTS_COUNTY_SUPPLEMENTS } from '@/lib/mortgage/massachusettsLenders';
import { NEW_YORK_COUNTY_SUPPLEMENTS } from '@/lib/mortgage/newYorkLenders';
import { PENNSYLVANIA_COUNTY_SUPPLEMENTS } from '@/lib/mortgage/pennsylvaniaLenders';
import { ILLINOIS_COUNTY_SUPPLEMENTS } from '@/lib/mortgage/illinoisLenders';
import { MICHIGAN_COUNTY_SUPPLEMENTS } from '@/lib/mortgage/michiganLenders';
import { NEW_JERSEY_COUNTY_SUPPLEMENTS } from '@/lib/mortgage/newJerseyLenders';
import {
  cleanNmlsId,
  countLenderCatalog,
  dedupeLendersByEntity,
  isCanonicalLenderProfile,
  lenderEntityKey,
} from '@/lib/verification';
import {
  deriveLenderHomeLocality,
  segmentLendersForCountyPage,
  type CountyLenderSegments,
} from '@/lib/geo';

export { lenders };
export type { Lender, LoanType, CreditTier };
export { countLenderCatalog, dedupeLendersByEntity, isCanonicalLenderProfile };
export type { CountyLenderSegments };

export interface LenderFilters {
  loanType?: LoanType;
  creditTier?: CreditTier;
  specialty?: string;
  minRating?: number;
  nmlsVerified?: boolean;
  stateSlug?: string;
  countySlug?: string;
  zip?: string;
  estimatedLoan?: number;
  estimatedRate?: number;
  estimatedPayment?: number;
  ltv?: number;
}

export function getLenderBySlug(slug: string): Lender | undefined {
  return lenders.find((l) => l.slug === slug);
}

export function getLenderByNmls(nmlsId: string): Lender | undefined {
  const clean = cleanNmlsId(nmlsId);
  if (!clean) return undefined;
  return lenders.find((l) => cleanNmlsId(l.nmlsId) === clean);
}

export function getCountyFromZip(zip: string): (typeof ZIP_TO_COUNTY)[string] | undefined {
  return ZIP_TO_COUNTY[zip.trim()];
}

export function filterLenders(filters: LenderFilters): Lender[] {
  let result = [...lenders];

  if (filters.zip) {
    const county = getCountyFromZip(filters.zip);
    if (county) {
      result = result.filter(
        (l) => l.stateSlug === county.stateSlug && l.countySlug === county.countySlug
      );
    } else {
      result = result.filter((l) => l.zipCodes.includes(filters.zip!));
    }
  }

  if (filters.stateSlug) {
    result = result.filter((l) => l.stateSlug === filters.stateSlug);
  }

  if (filters.countySlug) {
    result = result.filter((l) => l.countySlug === filters.countySlug);
  }

  if (filters.loanType) {
    result = result.filter((l) => l.loanTypes.includes(filters.loanType!));
  }

  if (filters.creditTier) {
    result = result.filter((l) => l.creditTiers.includes(filters.creditTier!));
  }

  if (filters.specialty) {
    result = result.filter((l) =>
      l.specialties.some((s) => s.toLowerCase().includes(filters.specialty!.toLowerCase()))
    );
  }

  if (filters.minRating) {
    result = result.filter((l) => l.rating >= filters.minRating!);
  }

  if (filters.nmlsVerified) {
    result = result.filter((l) => l.nmlsVerified);
  }

  return result.sort((a, b) => {
    if (b.trustScore !== a.trustScore) return b.trustScore - a.trustScore;
    return b.countyExperienceScore - a.countyExperienceScore;
  });
}

const STATE_COUNTY_SUPPLEMENTS: Record<string, Record<string, string[]>> = {
  florida: FLORIDA_COUNTY_SUPPLEMENTS,
  georgia: GEORGIA_COUNTY_SUPPLEMENTS,
  'south-carolina': SOUTH_CAROLINA_COUNTY_SUPPLEMENTS,
  'north-carolina': NORTH_CAROLINA_COUNTY_SUPPLEMENTS,
  tennessee: TENNESSEE_COUNTY_SUPPLEMENTS,
  arizona: ARIZONA_COUNTY_SUPPLEMENTS,
  california: CALIFORNIA_COUNTY_SUPPLEMENTS,
  colorado: COLORADO_COUNTY_SUPPLEMENTS,
  texas: TEXAS_COUNTY_SUPPLEMENTS,
  washington: WASHINGTON_COUNTY_SUPPLEMENTS,
  'district-of-columbia': DC_COUNTY_SUPPLEMENTS,
  massachusetts: MASSACHUSETTS_COUNTY_SUPPLEMENTS,
  'new-york': NEW_YORK_COUNTY_SUPPLEMENTS,
  pennsylvania: PENNSYLVANIA_COUNTY_SUPPLEMENTS,
  illinois: ILLINOIS_COUNTY_SUPPLEMENTS,
  michigan: MICHIGAN_COUNTY_SUPPLEMENTS,
  'new-jersey': NEW_JERSEY_COUNTY_SUPPLEMENTS,
};

/**
 * Phase 1: county inventory segmented by true HQ locality.
 * Primary list = in-county only; supplements never inflate primary.
 */
export function getCountyLenderSegments(
  stateSlug: string,
  countySlug: string,
  placeLabel?: string
): CountyLenderSegments {
  const stateLenders = lenders.filter((l) => l.stateSlug === stateSlug);
  const countyTitle = placeLabel
    ?? `${countySlug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')} County`;
  return segmentLendersForCountyPage({
    stateLenders,
    pageStateSlug: stateSlug,
    pageCountySlug: countySlug,
    placeLabel: countyTitle,
    supplementSlugs: STATE_COUNTY_SUPPLEMENTS[stateSlug]?.[countySlug] ?? [],
  });
}

/** In-county primary only — never merges distant supplements as local. */
export function getLendersByCounty(stateSlug: string, countySlug: string): Lender[] {
  return getCountyLenderSegments(stateSlug, countySlug).primaryLocal;
}

/** Full ordered view: in-county then nearby (for pages that flatten). */
export function getLendersByCountyWithNearby(stateSlug: string, countySlug: string): Lender[] {
  const seg = getCountyLenderSegments(stateSlug, countySlug);
  return [...seg.inCounty, ...seg.nearby];
}

export function getFeaturedLenders(limit = 6): Lender[] {
  return dedupeLendersByEntity([...lenders])
    .sort((a, b) => b.trustScore - a.trustScore)
    .slice(0, limit);
}

/**
 * County rollup using derived HQ locality (not market labels / padding).
 */
export function getAllCounties(): {
  state: string;
  stateSlug: string;
  county: string;
  countySlug: string;
  lenderCount: number;
}[] {
  const map = new Map<
    string,
    { state: string; stateSlug: string; county: string; countySlug: string; entities: Set<string> }
  >();

  for (const lender of lenders) {
    const home = deriveLenderHomeLocality(lender);
    if (!home.countySlug) continue;
    const key = `${home.stateSlug}/${home.countySlug}`;
    let entry = map.get(key);
    if (!entry) {
      entry = {
        state: lender.state,
        stateSlug: home.stateSlug,
        county: home.county,
        countySlug: home.countySlug,
        entities: new Set(),
      };
      map.set(key, entry);
    }
    entry.entities.add(lenderEntityKey(lender));
  }

  return [...map.values()]
    .map((e) => ({
      state: e.state,
      stateSlug: e.stateSlug,
      county: e.county,
      countySlug: e.countySlug,
      lenderCount: e.entities.size,
    }))
    .sort((a, b) => b.lenderCount - a.lenderCount);
}

export function buildMatchUrl(filters: LenderFilters): string {
  const params = new URLSearchParams();
  if (filters.loanType) params.set('loanType', filters.loanType);
  if (filters.creditTier) params.set('creditTier', filters.creditTier);
  if (filters.zip) params.set('zip', filters.zip);
  if (filters.stateSlug) params.set('state', filters.stateSlug);
  if (filters.countySlug) params.set('county', filters.countySlug);
  if (filters.estimatedLoan) params.set('loan', String(Math.round(filters.estimatedLoan)));
  if (filters.estimatedRate) params.set('rate', String(filters.estimatedRate));
  if (filters.estimatedPayment) params.set('payment', String(Math.round(filters.estimatedPayment)));
  if (filters.ltv) params.set('ltv', String(Math.round(filters.ltv)));
  const qs = params.toString();
  return qs ? `/local-lenders?${qs}` : '/local-lenders';
}
