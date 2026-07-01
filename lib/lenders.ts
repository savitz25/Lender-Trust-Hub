import { lenders, ZIP_TO_COUNTY, type Lender, type LoanType, type CreditTier } from './mockData';
import { FLORIDA_COUNTY_SUPPLEMENTS } from '@/lib/mortgage/floridaLenders';
import { GEORGIA_COUNTY_SUPPLEMENTS } from '@/lib/mortgage/georgiaLenders';
import { SOUTH_CAROLINA_COUNTY_SUPPLEMENTS } from '@/lib/mortgage/southCarolinaLenders';
import { NORTH_CAROLINA_COUNTY_SUPPLEMENTS } from '@/lib/mortgage/northCarolinaLenders';

export { lenders };
export type { Lender, LoanType, CreditTier };

export interface LenderFilters {
  loanType?: LoanType;
  creditTier?: CreditTier;
  specialty?: string;
  minRating?: number;
  nmlsVerified?: boolean;
  stateSlug?: string;
  countySlug?: string;
  zip?: string;
}

export function getLenderBySlug(slug: string): Lender | undefined {
  return lenders.find((l) => l.slug === slug);
}

export function getLenderByNmls(nmlsId: string): Lender | undefined {
  return lenders.find((l) => l.nmlsId === nmlsId);
}

export function getCountyFromZip(zip: string): typeof ZIP_TO_COUNTY[string] | undefined {
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
    const countyDiff = b.countyExperienceScore - a.countyExperienceScore;
    if (countyDiff !== 0) return countyDiff;
    return b.trustScore - a.trustScore;
  });
}

const STATE_COUNTY_SUPPLEMENTS: Record<string, Record<string, string[]>> = {
  florida: FLORIDA_COUNTY_SUPPLEMENTS,
  georgia: GEORGIA_COUNTY_SUPPLEMENTS,
  'south-carolina': SOUTH_CAROLINA_COUNTY_SUPPLEMENTS,
  'north-carolina': NORTH_CAROLINA_COUNTY_SUPPLEMENTS,
};

export function getLendersByCounty(stateSlug: string, countySlug: string): Lender[] {
  const primary = filterLenders({ stateSlug, countySlug });
  const supplementSlugs = STATE_COUNTY_SUPPLEMENTS[stateSlug]?.[countySlug] ?? [];
  if (supplementSlugs.length === 0) return primary;

  const seen = new Set(primary.map((l) => l.slug));
  const supplemental = supplementSlugs
    .map((slug) => lenders.find((l) => l.slug === slug))
    .filter((l): l is Lender => !!l && !seen.has(l.slug));

  return [...primary, ...supplemental].sort((a, b) => {
    const countyDiff = b.countyExperienceScore - a.countyExperienceScore;
    if (countyDiff !== 0) return countyDiff;
    return b.trustScore - a.trustScore;
  });
}

export function getFeaturedLenders(limit = 6): Lender[] {
  return [...lenders]
    .sort((a, b) => b.trustScore - a.trustScore)
    .slice(0, limit);
}

export function getAllCounties(): { state: string; stateSlug: string; county: string; countySlug: string; lenderCount: number }[] {
  const map = new Map<string, { state: string; stateSlug: string; county: string; countySlug: string; lenderCount: number }>();

  for (const lender of lenders) {
    const key = `${lender.stateSlug}/${lender.countySlug}`;
    const existing = map.get(key);
    if (existing) {
      existing.lenderCount++;
    } else {
      map.set(key, {
        state: lender.state,
        stateSlug: lender.stateSlug,
        county: lender.county,
        countySlug: lender.countySlug,
        lenderCount: 1,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.lenderCount - a.lenderCount);
}

export function buildMatchUrl(filters: LenderFilters): string {
  const params = new URLSearchParams();
  if (filters.loanType) params.set('loanType', filters.loanType);
  if (filters.creditTier) params.set('creditTier', filters.creditTier);
  if (filters.zip) params.set('zip', filters.zip);
  if (filters.stateSlug) params.set('state', filters.stateSlug);
  if (filters.countySlug) params.set('county', filters.countySlug);
  const qs = params.toString();
  return qs ? `/local-lenders?${qs}` : '/local-lenders';
}