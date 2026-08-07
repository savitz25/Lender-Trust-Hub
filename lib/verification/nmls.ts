/**
 * Lender Trust Hub Phase 0 — NMLS identity integrity.
 *
 * Hard rule: "NMLS Verified" requires a re-checkable numeric company/individual ID.
 * Placeholder tokens (SEE-NMLS, TBD, N/A, free text) never unlock a verified badge.
 */

export type NmlsVerificationLevel =
  /** No usable NMLS ID on file */
  | 'incomplete'
  /** Numeric ID present; not asserted as re-checked */
  | 'nmls_id_on_file'
  /** Numeric ID + directory verification flag (re-check on NMLS Consumer Access) */
  | 'nmls_id_verified';

export type NmlsVerificationDisplay = {
  level: NmlsVerificationLevel;
  /** Clean digits-only ID, or null when invalid */
  nmlsId: string | null;
  /** Hard green badge only when level === nmls_id_verified */
  showNmlsVerifiedBadge: boolean;
  badgeLabel: string | null;
  badgeVariant: 'verified' | 'on_file' | 'none';
  summary: string;
};

/** Known non-numeric / template tokens that must never display as NMLS IDs. */
const PLACEHOLDER_NMLS = new Set([
  'see-nmls',
  'see nmls',
  'tbd',
  'n/a',
  'na',
  'none',
  'unknown',
  'pending',
  'null',
  'undefined',
  '-',
  '--',
  'xxx',
  'xxxxxx',
]);

/**
 * Return a displayable numeric NMLS ID, or null if missing/placeholder/non-numeric.
 * Accepts common formatting: "NMLS 1234567", "#1234567", spaces/dashes.
 */
export function cleanNmlsId(raw: string | null | undefined): string | null {
  const s = (raw ?? '').trim();
  if (!s) return null;

  const lower = s.toLowerCase().replace(/\s+/g, ' ');
  if (PLACEHOLDER_NMLS.has(lower)) return null;
  if (/^(see[- ]?nmls|tbd|n\/?a|pending|unknown)/i.test(s)) return null;

  // Strip common prefixes then keep digits only
  const withoutLabel = s.replace(/^(nmls\s*(#|id|no\.?|number)?[:\s]*)/i, '').trim();
  const digits = withoutLabel.replace(/\D/g, '');

  // NMLS company/individual IDs are numeric; require at least 3 digits, reject all-zero
  if (!/^\d{3,12}$/.test(digits)) return null;
  if (/^0+$/.test(digits)) return null;

  // If original had substantial letters that aren't the NMLS label, reject (e.g. "SEE-NMLS")
  const alpha = withoutLabel.replace(/[\d\s#.\-_/]/g, '');
  if (alpha.length > 0 && !/^nmls$/i.test(alpha)) return null;

  return digits;
}

export function isValidNumericNmlsId(raw: string | null | undefined): boolean {
  return cleanNmlsId(raw) != null;
}

/**
 * Resolve verification display from listing fields.
 * A verified flag without a numeric ID is never enough for "NMLS Verified".
 */
export function resolveNmlsVerification(params: {
  nmlsId?: string | null;
  /** Editorial / admin flag that NMLS was checked */
  nmlsVerified?: boolean | null;
}): NmlsVerificationDisplay {
  const nmlsId = cleanNmlsId(params.nmlsId);
  const flagged = Boolean(params.nmlsVerified);

  if (nmlsId && flagged) {
    return {
      level: 'nmls_id_verified',
      nmlsId,
      showNmlsVerifiedBadge: true,
      badgeLabel: 'NMLS ID verified',
      badgeVariant: 'verified',
      summary: `NMLS #${nmlsId} — re-confirm on NMLS Consumer Access before applying.`,
    };
  }

  if (nmlsId) {
    return {
      level: 'nmls_id_on_file',
      nmlsId,
      showNmlsVerifiedBadge: false,
      badgeLabel: 'NMLS ID on file',
      badgeVariant: 'on_file',
      summary: `NMLS #${nmlsId} on file — confirm company status on NMLS Consumer Access.`,
    };
  }

  return {
    level: 'incomplete',
    nmlsId: null,
    showNmlsVerifiedBadge: false,
    badgeLabel: null,
    badgeVariant: 'none',
    summary: 'NMLS ID incomplete — recheck required before treating as verified.',
  };
}
