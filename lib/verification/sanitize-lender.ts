/**
 * Phase 0 — normalize a raw lender row for safe public display.
 * Missing data is better than invented data.
 */

import type { Lender } from '@/lib/mockData';
import { cleanDisplayPhone } from '@/lib/verification/phone';
import { resolveClosingPerformance } from '@/lib/verification/performance-metrics';
import { resolveNmlsVerification } from '@/lib/verification/nmls';
import {
  applyEntityTrustScores,
  dedupeLendersByEntity,
} from '@/lib/verification/entity-identity';

export function sanitizeLender(raw: Lender): Lender {
  const nmls = resolveNmlsVerification({
    nmlsId: raw.nmlsId,
    nmlsVerified: raw.nmlsVerified,
  });
  const phone = cleanDisplayPhone(raw.phone);
  const close = resolveClosingPerformance({
    avgCloseDays: raw.avgCloseDays,
    onTimeCloseRate: raw.onTimeCloseRate,
    // Phase 0: no observed closing provenance wired
    provenance: null,
  });

  return {
    ...raw,
    nmlsId: nmls.nmlsId ?? '',
    nmlsVerified: nmls.showNmlsVerifiedBadge,
    phone,
    avgCloseDays: close.avgCloseDays ?? undefined,
    onTimeCloseRate: close.onTimeCloseRate ?? undefined,
  };
}

/**
 * Sanitize every row, then force entity-level trust scores for shared NMLS IDs.
 * Does not drop geo rows (county context); callers dedupe for national lists.
 */
export function finalizeLenderCatalog(raw: Lender[]): Lender[] {
  const sanitized = raw.map(sanitizeLender);
  return applyEntityTrustScores(sanitized);
}

/** Distinct-entity view of the catalog for national rankings / compare pickers. */
export function catalogDistinctEntities(catalog: Lender[]): Lender[] {
  return dedupeLendersByEntity(catalog);
}
