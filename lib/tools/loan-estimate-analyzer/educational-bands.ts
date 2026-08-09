/**
 * Transparent educational fee bands for Loan Estimate Section A-style charges.
 *
 * IMPORTANT: These are NOT HMDA fee percentiles. Our cleaned HMDA extracts are
 * volume/mix summaries and do not yet include loan-level total_loan_costs or
 * origination_charges distributions. Bands are published here so consumers can
 * see explicit thresholds and know exactly what is (and is not) being compared.
 */

import type { FeeBandLevel, FeeBandResult } from './types';

export const EDUCATIONAL_FEE_BAND_SOURCE =
  'Lender Trust Hub educational bands for first-lien residential mortgages (illustrative). Not HMDA fee microdata. Not underwriting guidance.';

/** Origination charges as % of loan amount (points = 100 bps = 1%). */
export const ORIGINATION_PCT_BANDS = {
  lowerMax: 0.5,
  typicalMax: 1.5,
} as const;

/** Net lender cost (origination + discount points − credits) as % of loan. */
export const NET_LENDER_PCT_BANDS = {
  lowerMax: 0.75,
  typicalMax: 2.0,
} as const;

function bandFromPct(
  pct: number,
  lowerMax: number,
  typicalMax: number
): FeeBandLevel {
  if (!Number.isFinite(pct) || pct < 0) return 'unavailable';
  if (pct < lowerMax) return 'lower';
  if (pct <= typicalMax) return 'typical';
  return 'higher';
}

function framing(level: FeeBandLevel): string {
  switch (level) {
    case 'lower':
      return 'Lower than typical (educational band)';
    case 'typical':
      return 'Within a common educational range';
    case 'higher':
      return 'Higher than typical (educational band)';
    default:
      return 'Not enough information to place this figure';
  }
}

export function classifyOriginationPct(pct: number): FeeBandResult {
  const level = bandFromPct(
    pct,
    ORIGINATION_PCT_BANDS.lowerMax,
    ORIGINATION_PCT_BANDS.typicalMax
  );
  return {
    level,
    label: 'Origination charges vs educational range',
    framing: framing(level),
    detail: `Your origination charges are ${pct.toFixed(2)}% of the loan amount. Educational bands: under ${ORIGINATION_PCT_BANDS.lowerMax}% (lower), ${ORIGINATION_PCT_BANDS.lowerMax}–${ORIGINATION_PCT_BANDS.typicalMax}% (typical), above ${ORIGINATION_PCT_BANDS.typicalMax}% (higher). Actual market norms vary by loan type, credit, property, and channel (retail vs wholesale).`,
    sourceNote: EDUCATIONAL_FEE_BAND_SOURCE,
  };
}

export function classifyNetLenderPct(pct: number): FeeBandResult {
  const level = bandFromPct(
    pct,
    NET_LENDER_PCT_BANDS.lowerMax,
    NET_LENDER_PCT_BANDS.typicalMax
  );
  return {
    level,
    label: 'Net lender cost vs educational range',
    framing: framing(level),
    detail: `Net lender cost (origination + discount points − lender credits) is ${pct.toFixed(2)}% of the loan. Educational bands: under ${NET_LENDER_PCT_BANDS.lowerMax}% (lower), ${NET_LENDER_PCT_BANDS.lowerMax}–${NET_LENDER_PCT_BANDS.typicalMax}% (typical), above ${NET_LENDER_PCT_BANDS.typicalMax}% (higher). Credits can offset charges; always read the full Loan Estimate.`,
    sourceNote: EDUCATIONAL_FEE_BAND_SOURCE,
  };
}
