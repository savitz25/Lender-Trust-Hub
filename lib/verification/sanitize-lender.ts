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

  const base: Lender = {
    ...raw,
    nmlsId: nmls.nmlsId ?? '',
    nmlsVerified: nmls.showNmlsVerifiedBadge,
    phone,
    avgCloseDays: close.avgCloseDays ?? undefined,
    onTimeCloseRate: close.onTimeCloseRate ?? undefined,
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
