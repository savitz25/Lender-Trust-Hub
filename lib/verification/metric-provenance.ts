/**
 * Phase 0 kickoff — third-party metric provenance gates.
 * If source/confidence cannot be established, suppress the metric in strict UI paths.
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
};

/**
 * Seed catalog values without live enrichment are seed_unverified.
 * Live enrichment overlays are treated as observed (still confirm independently).
 */
export function resolveLenderMetricProvenance(params: {
  isEnriched?: boolean;
  enrichedAt?: string | null;
  hasGoogleValue?: boolean;
  hasBbbValue?: boolean;
  hasCfpbValue?: boolean;
  hasVolumeRank?: boolean;
}): LenderMetricBundle {
  const enriched = Boolean(params.isEnriched);
  const retrievedAt = params.enrichedAt?.trim() || null;

  const seed = (source: string, hasValue: boolean): MetricProvenance => ({
    source,
    retrievedAt: null,
    confidence: 'seed_unverified',
    // Kickoff: allow seed display only with soft labeling (not schema AggregateRating upgrade).
    // Hard suppress when no value at all.
    displayable: hasValue,
    note: 'Directory seed — confirm independently; not a live scrape.',
  });

  const observed = (source: string, hasValue: boolean): MetricProvenance => ({
    source,
    retrievedAt,
    confidence: 'observed',
    displayable: hasValue,
    note: 'Live enrichment overlay — re-check primary source before decisions.',
  });

  return {
    googleRating: enriched
      ? observed('Google Places / reviews', Boolean(params.hasGoogleValue))
      : seed('Directory seed (Google-style rating field)', Boolean(params.hasGoogleValue)),
    bbbRating: enriched
      ? observed('BBB public profile', Boolean(params.hasBbbValue))
      : seed('Directory seed (BBB field)', Boolean(params.hasBbbValue)),
    cfpbComplaints: enriched
      ? observed('CFPB public complaint database', Boolean(params.hasCfpbValue))
      : seed('Directory seed (CFPB count field)', Boolean(params.hasCfpbValue)),
    nationalVolumeRank: {
      source: 'Directory seed rank (not an official NMLS volume rank)',
      retrievedAt: null,
      confidence: 'seed_unverified',
      // Volume ranks in seed catalogs are not defensible — suppress
      displayable: false,
      note: 'Suppressed until a documented volume source exists.',
    },
  };
}
