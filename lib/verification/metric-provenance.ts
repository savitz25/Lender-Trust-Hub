/**
 * Phase 3 — third-party metric provenance gates.
 * If provenance cannot support a public claim, suppress the metric.
 */

export type MetricConfidence = 'observed' | 'seed_unverified' | 'unknown';

export type MetricProvenance = {
  source: string;
  retrievedAt: string | null;
  confidence: MetricConfidence;
  /** When false, UI must not present the metric as verified fact */
  displayable: boolean;
  note: string;
};

export type LenderMetricBundle = {
  googleRating: MetricProvenance;
  bbbRating: MetricProvenance;
  cfpbComplaints: MetricProvenance;
  nationalVolumeRank: MetricProvenance;
  creditTiers: MetricProvenance;
};

/**
 * Catalog seed values are not independently re-checked scrapes.
 * Phase 3: suppress seed third-party metrics on public cards;
 * CFPB may show on profiles with non-normalized disclosure only.
 */
export function resolveLenderMetricProvenance(params: {
  isEnriched?: boolean;
  enrichedAt?: string | null;
  hasGoogleValue?: boolean;
  hasBbbValue?: boolean;
  hasCfpbValue?: boolean;
  hasVolumeRank?: boolean;
  hasCreditTiers?: boolean;
  /** Allow soft CFPB display on profile with disclosure */
  allowCfpbSeedOnProfile?: boolean;
}): LenderMetricBundle {
  const enriched = Boolean(params.isEnriched);
  const retrievedAt = params.enrichedAt?.trim() || null;

  const observed = (source: string, hasValue: boolean, note: string): MetricProvenance => ({
    source,
    retrievedAt,
    confidence: 'observed',
    displayable: hasValue,
    note,
  });

  const seedSuppressed = (source: string, note: string): MetricProvenance => ({
    source,
    retrievedAt: null,
    confidence: 'seed_unverified',
    displayable: false,
    note,
  });

  return {
    googleRating: enriched
      ? observed(
          'Google Places / reviews',
          Boolean(params.hasGoogleValue),
          'Live enrichment overlay — re-check primary source. Not a first-party review.'
        )
      : seedSuppressed(
          'Directory seed (Google-style rating field)',
          'Suppressed until independently retrieved; not first-party reviews.'
        ),
    bbbRating: enriched
      ? observed(
          'BBB public profile',
          Boolean(params.hasBbbValue),
          'Confirm on BBB.org — not an endorsement by Lender Trust Hub.'
        )
      : seedSuppressed(
          'Directory seed (BBB field)',
          'Suppressed until a confirmed public BBB profile is retrieved.'
        ),
    cfpbComplaints:
      enriched || params.allowCfpbSeedOnProfile
        ? {
            source: 'CFPB public complaint database (catalog field)',
            retrievedAt: enriched ? retrievedAt : null,
            confidence: enriched ? 'observed' : 'seed_unverified',
            displayable: Boolean(params.hasCfpbValue),
            note: 'Raw count as listed — not size-normalized. A complaint is not a finding of wrongdoing.',
          }
        : seedSuppressed(
            'Directory seed (CFPB count field)',
            'Suppressed on list cards; profile may show with non-normalized disclosure.'
          ),
    nationalVolumeRank: seedSuppressed(
      'Directory seed rank (not an official NMLS volume rank)',
      'Suppressed until a documented volume source exists.'
    ),
    creditTiers: {
      source: 'Directory loan product / credit tier labels',
      retrievedAt: null,
      confidence: 'seed_unverified',
      // Soft product menu only — not a credit decision tool
      displayable: Boolean(params.hasCreditTiers),
      note: 'Self-described product focus as listed — not underwriting criteria.',
    },
  };
}
