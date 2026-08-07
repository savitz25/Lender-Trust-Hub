/**
 * Phase 1 — Lender Trust Hub geographic integrity.
 *
 * Local = licensed business city / HQ locality maps to the page county.
 * Nearby = same state, outside that county (adjacent or explicit serve-from-elsewhere).
 * Statewide license alone never makes a lender "local."
 *
 * Must not import research-signals or verification barrels (circular with catalog sanitize).
 */

import type { Lender } from '@/lib/mockData';
import { countiesEqual, titleCaseSlug } from '@/lib/geo/normalize';
import {
  deriveLenderHomeLocality,
  type DerivedHomeLocality,
} from '@/lib/geo/home-locality';
import { dedupeLendersByEntity } from '@/lib/verification/entity-identity';

export {
  deriveLenderHomeLocality,
  type DerivedHomeLocality,
} from '@/lib/geo/home-locality';

export const MIN_MEANINGFUL_IN_COUNTY = 3;

export const LENDER_LOCALITY_POLICY = {
  minMeaningfulInCounty: MIN_MEANINGFUL_IN_COUNTY,
  labels: {
    inCounty: 'HQ in this county',
    nearby: 'Serves from nearby / out of county',
    unknown: 'Locality not confirmed',
  },
  emptyInCountyCopy:
    'No lenders with a confirmed in-county licensed business address are listed yet. Nearby market lenders below may serve borrowers here — they are not in-county locals.',
  scarceInCountyCopy: (n: number, place: string) =>
    `Only ${n} listed lender${n === 1 ? '' : 's'} with confirmed in-county HQ for ${place}. We do not pad this list with distant offices labeled as local.`,
} as const;

export type LenderLocalityClass = 'in_county' | 'nearby' | 'unknown';

export type LenderPresenceLabel =
  | 'HQ in county'
  | 'Branch in county'
  | 'Serves from nearby market'
  | 'Locality not confirmed';

/**
 * Adjacent counties for honest "nearby" secondary lists (same state only).
 * Not a full graph — only markets where we currently list lenders.
 */
const ADJACENT_COUNTIES: Record<string, Record<string, string[]>> = {
  florida: {
    'miami-dade': ['broward'],
    broward: ['miami-dade', 'palm-beach'],
    'palm-beach': ['broward'],
    orange: ['hillsborough'],
    hillsborough: ['orange'],
    duval: [],
    bay: ['okaloosa', 'escambia'],
    okaloosa: ['bay', 'escambia'],
    escambia: ['bay', 'okaloosa'],
  },
};

export type LenderLocalityVerdict = {
  class: LenderLocalityClass;
  label: string;
  presenceLabel: LenderPresenceLabel;
  reason: string;
  home: DerivedHomeLocality;
};

function isInPageCounty(home: DerivedHomeLocality, pageCountySlug: string): boolean {
  if (!home.countySlug && !home.county) return false;
  if (home.countySlug === pageCountySlug) return true;
  return countiesEqual(home.county, titleCaseSlug(pageCountySlug));
}

export function classifyLenderLocality(
  lender: Lender,
  pageStateSlug: string,
  pageCountySlug: string
): LenderLocalityVerdict {
  const home = deriveLenderHomeLocality(lender);

  if (home.stateSlug && home.stateSlug !== pageStateSlug) {
    return {
      class: 'nearby',
      label: LENDER_LOCALITY_POLICY.labels.nearby,
      presenceLabel: 'Serves from nearby market',
      reason: 'Licensed business state differs from this page',
      home,
    };
  }

  if (!home.countySlug && !home.county) {
    return {
      class: 'unknown',
      label: LENDER_LOCALITY_POLICY.labels.unknown,
      presenceLabel: 'Locality not confirmed',
      reason: 'No licensed business county on file',
      home,
    };
  }

  if (isInPageCounty(home, pageCountySlug)) {
    return {
      class: 'in_county',
      label: LENDER_LOCALITY_POLICY.labels.inCounty,
      presenceLabel: 'HQ in county',
      reason: `Licensed locality${lender.city ? ` (${lender.city})` : ''} is in this county`,
      home,
    };
  }

  return {
    class: 'nearby',
    label: LENDER_LOCALITY_POLICY.labels.nearby,
    presenceLabel: 'Serves from nearby market',
    reason: `HQ in ${home.county || home.countySlug} — outside ${titleCaseSlug(pageCountySlug)} County`,
    home,
  };
}

export type LenderWithLocality = Lender & {
  locality: LenderLocalityVerdict;
};

export type CountyLenderSegments = {
  pageStateSlug: string;
  pageCountySlug: string;
  placeLabel: string;
  inCounty: LenderWithLocality[];
  nearby: LenderWithLocality[];
  unknown: LenderWithLocality[];
  /** Primary ranking = in-county only */
  primaryLocal: LenderWithLocality[];
  hasMeaningfulLocalInventory: boolean;
  localScarcity: boolean;
  inCountyCount: number;
  nearbyCount: number;
};

/** Prefer research score already on the row (set at catalog sanitize) — no research-signals import. */
function sortByResearch(a: Lender, b: Lender): number {
  if (b.trustScore !== a.trustScore) return b.trustScore - a.trustScore;
  if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
  return a.slug.localeCompare(b.slug);
}

function isAdjacent(
  pageStateSlug: string,
  pageCountySlug: string,
  homeCountySlug: string
): boolean {
  const adj = ADJACENT_COUNTIES[pageStateSlug]?.[pageCountySlug] ?? [];
  return adj.includes(homeCountySlug);
}

/**
 * Segment state catalog for a county page.
 * Never merges nearby into primary local ranking.
 * `supplementSlugs` may only appear in nearby (serve-from-elsewhere), never as fake locals.
 */
export function segmentLendersForCountyPage(params: {
  stateLenders: Lender[];
  pageStateSlug: string;
  pageCountySlug: string;
  placeLabel: string;
  /** Explicit serve-from-elsewhere slugs (legacy supplements) — nearby only if not in-county */
  supplementSlugs?: string[];
}): CountyLenderSegments {
  const {
    stateLenders,
    pageStateSlug,
    pageCountySlug,
    placeLabel,
    supplementSlugs = [],
  } = params;

  const entities = dedupeLendersByEntity(stateLenders);
  const bySlug = new Map(entities.map((l) => [l.slug, l]));

  const inCounty: LenderWithLocality[] = [];
  const nearbyMap = new Map<string, LenderWithLocality>();
  const unknown: LenderWithLocality[] = [];

  for (const lender of entities) {
    const locality = classifyLenderLocality(lender, pageStateSlug, pageCountySlug);
    const row = { ...lender, locality };

    if (locality.class === 'in_county') {
      inCounty.push(row);
      continue;
    }
    if (locality.class === 'unknown') {
      unknown.push(row);
      continue;
    }

    const adjacent = isAdjacent(pageStateSlug, pageCountySlug, locality.home.countySlug);
    if (adjacent) {
      nearbyMap.set(lender.slug, row);
    }
  }

  for (const slug of supplementSlugs) {
    const lender = bySlug.get(slug);
    if (!lender) continue;
    if (inCounty.some((l) => l.slug === slug)) continue;
    const locality = classifyLenderLocality(lender, pageStateSlug, pageCountySlug);
    nearbyMap.set(slug, {
      ...lender,
      locality: {
        ...locality,
        class: 'nearby',
        label: LENDER_LOCALITY_POLICY.labels.nearby,
        presenceLabel: 'Serves from nearby market',
        reason:
          locality.class === 'in_county'
            ? locality.reason
            : `Listed as serving this market from ${locality.home.county || lender.city || 'another locality'}`,
      },
    });
  }

  const sortedIn = [...inCounty].sort(sortByResearch);
  const nearby = [...nearbyMap.values()].sort(sortByResearch);
  const hasMeaningfulLocalInventory =
    sortedIn.length >= LENDER_LOCALITY_POLICY.minMeaningfulInCounty;
  const localScarcity =
    sortedIn.length > 0 &&
    sortedIn.length < LENDER_LOCALITY_POLICY.minMeaningfulInCounty;

  return {
    pageStateSlug,
    pageCountySlug,
    placeLabel,
    inCounty: sortedIn,
    nearby,
    unknown: unknown.sort(sortByResearch),
    primaryLocal: sortedIn,
    hasMeaningfulLocalInventory,
    localScarcity,
    inCountyCount: sortedIn.length,
    nearbyCount: nearby.length,
  };
}

/** Card / profile line for a county context. */
export function presenceLineForCounty(
  lender: Lender,
  pageCountySlug: string,
  pageCountyLabel: string
): string {
  const v = classifyLenderLocality(lender, lender.stateSlug, pageCountySlug);
  if (v.class === 'in_county') {
    return `HQ in ${pageCountyLabel}`;
  }
  if (v.home.county) {
    return `Serves ${pageCountyLabel} from ${v.home.county} County`;
  }
  return `Serves from nearby market · ${pageCountyLabel}`;
}

/** Default card location when not on a county page. */
export function homeLocalityLine(lender: Lender): string {
  const home = deriveLenderHomeLocality(lender);
  const county = home.county || lender.county;
  if (lender.city && county) return `${lender.city}, ${lender.state} · HQ in ${county} County`;
  if (county) return `${lender.state} · HQ in ${county} County`;
  return [lender.city, lender.state].filter(Boolean).join(', ');
}
