/**
 * Fail-closed discovery eligibility (ASK-SEARCH-LENDER-001).
 * No payment / premium / ratings / popularity signals.
 */

import type { Lender } from '@/lib/mockData';
import { cleanNmlsId } from '@/lib/verification/nmls';
import { STATE_BY_SLUG } from '@/lib/fdic/states';
import type { HmdaLenderEvidence } from '@/lib/hmda/types';
import type { EligibilityFailureReason } from './types';

export type EligibilityResult =
  | { ok: true }
  | { ok: false; reason: EligibilityFailureReason };

/**
 * Predicate (AND):
 * 1. slug present + URL-safe
 * 2. display name present
 * 3. clean numeric NMLS ID
 * 4. nmlsVerified === true
 * 5. geography: physical USPS state OR HMDA activity state
 *
 * Explicitly NOT used: payment, premium, ratings, reviews, Trust Score, featured.
 */
export function evaluateLenderPilotEligibility(
  lender: Lender,
  hmda?: HmdaLenderEvidence | null
): EligibilityResult {
  if (!lender.slug?.trim()) return { ok: false, reason: 'missing_slug' };
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(lender.slug.trim())) {
    return { ok: false, reason: 'invalid_canonical_url' };
  }
  if (!lender.name?.trim()) return { ok: false, reason: 'missing_display_name' };

  const nmls = cleanNmlsId(lender.nmlsId);
  if (!nmls) return { ok: false, reason: 'missing_nmls' };
  if (!lender.nmlsVerified) return { ok: false, reason: 'nmls_unverified' };

  const physicalOk = Boolean(lender.stateSlug && STATE_BY_SLUG.get(lender.stateSlug));
  const hmdaOk = Boolean(
    hmda &&
      (STATE_BY_SLUG.get(hmda.stateSlug) ||
        (hmda.otherStates && hmda.otherStates.length > 0) ||
        hmda.state)
  );

  if (!physicalOk && !hmdaOk) {
    return { ok: false, reason: 'insufficient_geography' };
  }

  return { ok: true };
}
