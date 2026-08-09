/**
 * Phase 0–3 — normalize a raw lender row for safe public display.
 * Missing data is better than invented data.
 * Phase 3: Research Score recomputed per entity (not seed 90s).
 */

import type { Lender } from '@/lib/mockData';
import { cleanDisplayPhone } from '@/lib/verification/phone';
import { resolveClosingPerformance } from '@/lib/verification/performance-metrics';
import { resolveNmlsVerification } from '@/lib/verification/nmls';
import {
  applyEntityTrustScores,
  dedupeLendersByEntity,
} from '@/lib/verification/entity-identity';
import { applyResearchScoreToLender } from '@/lib/research/research-signals';
import { deriveLenderHomeLocality } from '@/lib/geo/home-locality';

/**
 * Phase 0 hygiene: catalog seed ratings/reviews are not independently sourced.
 * Zero them so Research Score cannot treat editorial placeholders as evidence.
 * When a real attributed review pipeline is wired, pass provenance and restore.
 */
function stripUnsourcedReputation(raw: Lender): Pick<
  Lender,
  'rating' | 'reviewCount' | 'googleRating' | 'trustpilotRating'
> {
  return {
    rating: 0,
    reviewCount: 0,
    googleRating: 0,
    trustpilotRating: 0,
  };
}

/**
 * Prefer city/ZIP-derived county over a conflicting market label on the row.
 * Does not invent geography — only rewrites when deriveLenderHomeLocality finds a better match.
 */
function reconcileCountyFields(raw: Lender): Pick<Lender, 'county' | 'countySlug'> {
  const home = deriveLenderHomeLocality(raw);
  if (
    home.source === 'city' ||
    home.source === 'zip'
  ) {
    if (home.county && home.countySlug) {
      return { county: home.county, countySlug: home.countySlug };
    }
  }
  return { county: raw.county, countySlug: raw.countySlug };
}

export function sanitizeLender(raw: Lender): Lender {
  const nmls = resolveNmlsVerification({
    nmlsId: raw.nmlsId,
    nmlsVerified: raw.nmlsVerified,
  });
  const phone = cleanDisplayPhone(raw.phone);
  const close = resolveClosingPerformance({
    avgCloseDays: raw.avgCloseDays,
    onTimeCloseRate: raw.onTimeCloseRate,
    provenance: null,
  });
  const reputation = stripUnsourcedReputation(raw);
  const county = reconcileCountyFields(raw);

  const base: Lender = {
    ...raw,
    ...reputation,
    ...county,
    nmlsId: nmls.nmlsId ?? '',
    // Never claim verified without a clean numeric ID (placeholders → incomplete)
    nmlsVerified: nmls.showNmlsVerifiedBadge,
    phone,
    avgCloseDays: close.avgCloseDays ?? undefined,
    onTimeCloseRate: close.onTimeCloseRate ?? undefined,
    // Seed national rank is editorial — not a published volume ranking
    nationalVolumeRank: 0,
  };

  return applyResearchScoreToLender(base);
}

/**
 * Sanitize every row, recompute research scores, align entity-level scores by NMLS.
 */
export function finalizeLenderCatalog(raw: Lender[]): Lender[] {
  const sanitized = raw.map(sanitizeLender);
  return applyEntityTrustScores(sanitized);
}

/** Distinct-entity view of the catalog for national rankings / compare pickers. */
export function catalogDistinctEntities(catalog: Lender[]): Lender[] {
  return dedupeLendersByEntity(catalog);
}
