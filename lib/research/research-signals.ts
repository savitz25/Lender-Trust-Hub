/**
 * Phase 3 — Research scoring honesty for Lender Trust Hub.
 *
 * Separates overloaded “Trust Score” into:
 * 1. Research Score — public-record / research composite (recomputed, discriminative)
 * 2. Data Confidence — completeness of independently useful fields
 * 3. NMLS / License Status — verified / on file / incomplete (Phase 0)
 * 4. Local Market Evidence — only when true local presence signals exist
 *
 * Does not invent inputs. Does not predict approval, rate, close speed, or service quality.
 * Scores are entity-level (NMLS); geo rows share the same Research Score.
 */

import type { Lender } from '@/lib/mockData';
import {
  cleanNmlsId,
  resolveNmlsVerification,
  type NmlsVerificationDisplay,
} from '@/lib/verification/nmls';
// Leaf import only — never `@/lib/geo` barrel (circular with catalog sanitize at build)
import { deriveLenderHomeLocality } from '@/lib/geo/home-locality';
import {
  resolveLenderMetricProvenance,
  type LenderMetricBundle,
} from '@/lib/verification/metric-provenance';

export type ResearchFactor = {
  id: string;
  label: string;
  points: number;
  maxPoints: number;
  detail: string;
};

export type DataConfidenceBand = 'high' | 'medium' | 'low';

export type LocalMarketEvidence = {
  /** 0–100 research aid for local presence completeness — not “best local” */
  score: number;
  label: string;
  hasEvidence: boolean;
  detail: string;
};

export type LenderResearchSignals = {
  researchScore: number;
  dataConfidence: number;
  dataConfidenceBand: DataConfidenceBand;
  dataConfidenceLabel: string;
  nmls: NmlsVerificationDisplay;
  localMarket: LocalMarketEvidence;
  factors: ResearchFactor[];
  measures: string;
  doesNotMeasure: string;
  methodologyPath: string;
  metrics: LenderMetricBundle;
};

export type RankingBasis = {
  primaryOrder: string;
  secondaryOrder: string;
  rules: string[];
};

export const RESEARCH_SCORE_COPY = {
  measures:
    'Re-checkable NMLS identity, third-party reputation snapshots when present, complaint-pattern context, and field completeness. Editorial research composite only.',
  doesNotMeasure:
    'Does not measure approval odds, interest rates, closing speed, or future service quality. Not a regulator grade or NMLS endorsement.',
  methodologyPath: '/methodology#scores',
} as const;

export const LENDER_RANKING_BASIS: RankingBasis = {
  primaryOrder: 'In-county HQ first, then nearby / serving from elsewhere',
  secondaryOrder:
    'Within each locality band: NMLS verification strength, then data completeness, then review volume when attributed',
  rules: [
    'List order is research convenience — not a purchased ranking or “best lender” award',
    'Nearby lenders never appear in the in-county section',
    'We show public-record evidence chips, not a decorative grade',
    'Third-party ratings are attributed snapshots — not first-party reviews',
  ],
};

/** Public evidence chips — preferred over a precise 0–100 ranking display */
export type EvidenceBadge = {
  id: string;
  label: string;
  present: boolean;
  detail: string;
};

export function getLenderEvidenceBadges(
  lender: Lender,
  opts?: { hmdaAvailable?: boolean; cfpbRecordAvailable?: boolean }
): EvidenceBadge[] {
  const nmls = resolveNmlsVerification({
    nmlsId: lender.nmlsId,
    nmlsVerified: lender.nmlsVerified,
  });
  const local = computeLocalMarketEvidence(lender);
  const hasRating =
    ((lender.googleRating ?? lender.rating) ?? 0) > 0 && (lender.reviewCount ?? 0) > 0;
  const cfpbPresent =
    opts?.cfpbRecordAvailable === true ||
    (typeof lender.cfpbComplaints === 'number' && lender.cfpbComplaints > 0);

  return [
    {
      id: 'nmls',
      label: nmls.showNmlsVerifiedBadge
        ? 'NMLS verified'
        : nmls.nmlsId
          ? 'NMLS on file'
          : 'NMLS incomplete',
      present: Boolean(nmls.nmlsId),
      detail: nmls.summary,
    },
    {
      id: 'local',
      label: local.hasEvidence ? 'Local HQ evidence' : 'Local HQ not mapped',
      present: local.hasEvidence,
      detail: local.detail,
    },
    {
      id: 'ratings',
      label: hasRating ? 'Third-party rating attributed' : 'No attributed rating',
      present: hasRating,
      detail: hasRating
        ? `Catalog snapshot · ${(lender.googleRating || lender.rating).toFixed(1)} · ${lender.reviewCount} reviews (confirm on source platforms)`
        : 'No volume-backed third-party rating on file',
    },
    {
      id: 'cfpb',
      label: cfpbPresent ? 'CFPB complaint record available' : 'CFPB record not shown',
      present: cfpbPresent,
      detail: cfpbPresent
        ? 'Public CFPB complaint context available — not a finding of fault'
        : 'No CFPB complaint panel matched for this listing',
    },
    {
      id: 'hmda',
      label: opts?.hmdaAvailable ? 'HMDA activity available' : 'HMDA not matched',
      present: Boolean(opts?.hmdaAvailable),
      detail: opts?.hmdaAvailable
        ? 'Matched federal HMDA activity panel available on profile'
        : 'No LEI/slug HMDA match in our research tables',
    },
  ];
}

/** Factor weights published on methodology (percent of Research Score max). */
export const RESEARCH_SCORE_WEIGHTS = [
  { id: 'nmls', label: 'NMLS identity evidence', maxPoints: 28, pct: 28 },
  { id: 'reputation', label: 'Third-party reputation (volume-weighted)', maxPoints: 26, pct: 26 },
  { id: 'cfpb', label: 'CFPB complaint pattern (not a finding of fault)', maxPoints: 16, pct: 16 },
  { id: 'bbb', label: 'BBB grade when listed', maxPoints: 12, pct: 12 },
  { id: 'locality', label: 'Licensed locality completeness', maxPoints: 12, pct: 12 },
  { id: 'loan-menu', label: 'Loan type / product disclosure', maxPoints: 6, pct: 6 },
] as const;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function dataConfidenceBand(score: number): DataConfidenceBand {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function dataConfidenceLabel(band: DataConfidenceBand): string {
  if (band === 'high') return 'High data confidence';
  if (band === 'medium') return 'Moderate data confidence';
  return 'Limited data confidence';
}

/**
 * Recalibrated Research Score from listing fields (ignores seed trustScore 90s).
 * Base is low; high scores require multiple independent signals.
 */
export function computeLenderResearchScore(lender: Lender): {
  score: number;
  factors: ResearchFactor[];
} {
  const factors: ResearchFactor[] = [];
  let total = 0;

  const nmls = resolveNmlsVerification({
    nmlsId: lender.nmlsId,
    nmlsVerified: lender.nmlsVerified,
  });
  let nmlsPts = 0;
  if (nmls.showNmlsVerifiedBadge) nmlsPts = 28;
  else if (nmls.nmlsId) nmlsPts = 14;
  factors.push({
    id: 'nmls',
    label: 'NMLS identity evidence',
    points: nmlsPts,
    maxPoints: 28,
    detail: nmls.summary,
  });
  total += nmlsPts;

  // Reputation — volume-weighted, capped (seed ratings without volume stay low)
  const gRating = lender.googleRating || lender.rating || 0;
  const gCount = lender.reviewCount || 0;
  let repPts = 0;
  if (gRating > 0 && gCount > 0) {
    const quality = Math.max(0, Math.min(14, (gRating - 3.3) * 10));
    const volume =
      gCount >= 500 ? 12 : gCount >= 150 ? 9 : gCount >= 50 ? 6 : gCount >= 15 ? 3 : 1;
    repPts = clamp(quality + volume * 0.5, 0, 26);
  }
  factors.push({
    id: 'reputation',
    label: 'Third-party reputation snapshot',
    points: repPts,
    maxPoints: 26,
    detail:
      gCount > 0
        ? `Catalog snapshot · ${gRating.toFixed(1)} · ${gCount} listed reviews (confirm on source platforms)`
        : 'No review volume on file',
  });
  total += repPts;

  // CFPB — Phase 0: catalog "0" is not a verified clean record (most seeds default to 0).
  // Score only positive complaint counts as a soft caution; treat 0 / missing as neutral.
  const cfpb = typeof lender.cfpbComplaints === 'number' ? lender.cfpbComplaints : null;
  let cfpbPts = 8; // neutral mid when unknown or catalog-zero
  let cfpbDetail = 'CFPB count not independently verified in catalog';
  if (cfpb != null && cfpb > 0) {
    if (cfpb <= 3) cfpbPts = 12;
    else if (cfpb <= 10) cfpbPts = 8;
    else if (cfpb <= 25) cfpbPts = 4;
    else cfpbPts = 1;
    cfpbDetail = `${cfpb} listed complaint(s) in catalog — not size-normalized; not a finding of wrongdoing`;
  } else if (cfpb === 0) {
    cfpbPts = 8;
    cfpbDetail =
      'Catalog shows 0 complaints — treated as unverified default, not a clean bill of health';
  }
  factors.push({
    id: 'cfpb',
    label: 'CFPB complaint pattern',
    points: cfpbPts,
    maxPoints: 16,
    detail: cfpbDetail,
  });
  total += cfpbPts;

  // BBB — Phase 0: seed grades are not independently sourced; do not award points.
  const bbb = (lender.bbbRating ?? '').trim();
  const bbbPts = 0;
  factors.push({
    id: 'bbb',
    label: 'BBB grade (catalog)',
    points: bbbPts,
    maxPoints: 12,
    detail: bbb
      ? `Grade ${bbb} listed in seed data — not scored until independently sourced (confirm on BBB.org)`
      : 'BBB not on file',
  });
  total += bbbPts;

  // Locality completeness (not “best local”)
  const home = deriveLenderHomeLocality(lender);
  let locPts = 0;
  if (home.source === 'city' || home.source === 'zip') locPts += 8;
  else if (home.county) locPts += 4;
  if (lender.city?.trim()) locPts += 2;
  if (lender.website?.trim() || lender.phone?.trim()) locPts += 2;
  locPts = Math.min(12, locPts);
  factors.push({
    id: 'locality',
    label: 'Licensed locality completeness',
    points: locPts,
    maxPoints: 12,
    detail: home.county
      ? `Derived HQ locality: ${home.county} County (${home.source})`
      : 'HQ locality incomplete',
  });
  total += locPts;

  // Loan menu disclosure
  const loanPts = Math.min(6, (lender.loanTypes?.length ?? 0) >= 3 ? 6 : (lender.loanTypes?.length ?? 0) * 2);
  factors.push({
    id: 'loan-menu',
    label: 'Loan type disclosure',
    points: loanPts,
    maxPoints: 6,
    detail:
      (lender.loanTypes?.length ?? 0) > 0
        ? `${lender.loanTypes.length} loan type(s) listed`
        : 'Loan types not listed',
  });
  total += loanPts;

  return { score: clamp(total, 0, 100), factors };
}

export function computeDataConfidence(lender: Lender): {
  score: number;
  band: DataConfidenceBand;
  label: string;
} {
  let score = 0;
  const nmls = cleanNmlsId(lender.nmlsId);
  if (nmls) score += 25;
  if (lender.nmlsVerified && nmls) score += 15;
  if (lender.city?.trim()) score += 10;
  if (deriveLenderHomeLocality(lender).county) score += 15;
  if (lender.website?.trim()) score += 10;
  if (lender.phone?.trim()) score += 8;
  if ((lender.loanTypes?.length ?? 0) >= 2) score += 7;
  if (lender.reviewCount >= 25) score += 5;
  if (typeof lender.cfpbComplaints === 'number') score += 5;
  score = clamp(score, 0, 100);
  const band = dataConfidenceBand(score);
  return { score, band, label: dataConfidenceLabel(band) };
}

/**
 * Local market evidence — only when HQ locality is derived (not statewide license alone).
 * This is not a “best local lender” rank.
 */
export function computeLocalMarketEvidence(lender: Lender): LocalMarketEvidence {
  const home = deriveLenderHomeLocality(lender);
  if (!home.countySlug && !home.county) {
    return {
      score: 0,
      label: 'No local market evidence',
      hasEvidence: false,
      detail: 'No licensed city/ZIP/county locality on file',
    };
  }

  let score = 40;
  if (home.source === 'city') score += 25;
  else if (home.source === 'zip') score += 20;
  else score += 10;
  if (lender.city?.trim()) score += 10;
  if ((lender.zipCodes?.length ?? 0) >= 1) score += 10;
  if (cleanNmlsId(lender.nmlsId)) score += 15;
  score = clamp(score, 0, 100);

  return {
    score,
    label: `Local market evidence · ${home.county || home.countySlug} County`,
    hasEvidence: true,
    detail: `HQ locality derived from ${home.source}${lender.city ? ` (${lender.city})` : ''}`,
  };
}

export function computeLenderResearchSignals(lender: Lender): LenderResearchSignals {
  const { score, factors } = computeLenderResearchScore(lender);
  const conf = computeDataConfidence(lender);
  const nmls = resolveNmlsVerification({
    nmlsId: lender.nmlsId,
    nmlsVerified: lender.nmlsVerified,
  });
  const localMarket = computeLocalMarketEvidence(lender);
  const metrics = resolveLenderMetricProvenance({
    isEnriched: false,
    hasGoogleValue: (lender.googleRating ?? lender.rating) > 0 && lender.reviewCount > 0,
    hasBbbValue: Boolean(lender.bbbRating),
    hasCfpbValue: typeof lender.cfpbComplaints === 'number',
    hasVolumeRank: typeof lender.nationalVolumeRank === 'number',
    hasCreditTiers: (lender.creditTiers?.length ?? 0) > 0,
    // Profile/card may show CFPB with non-normalized disclosure only
    allowCfpbSeedOnProfile: true,
  });

  return {
    researchScore: score,
    dataConfidence: conf.score,
    dataConfidenceBand: conf.band,
    dataConfidenceLabel: conf.label,
    nmls,
    localMarket,
    factors,
    measures: RESEARCH_SCORE_COPY.measures,
    doesNotMeasure: RESEARCH_SCORE_COPY.doesNotMeasure,
    methodologyPath: RESEARCH_SCORE_COPY.methodologyPath,
    metrics,
  };
}

/** Apply recomputed Research Score onto a lender (entity fields). */
export function applyResearchScoreToLender(lender: Lender): Lender {
  const signals = computeLenderResearchSignals(lender);
  return {
    ...lender,
    trustScore: signals.researchScore,
    // County experience becomes local market evidence score when we have locality
    countyExperienceScore: signals.localMarket.hasEvidence
      ? signals.localMarket.score
      : Math.min(lender.countyExperienceScore, 35),
  };
}

/**
 * Sort within a locality band for directory convenience.
 * NMLS strength first — not a decorative scoreboard.
 */
export function compareLendersByResearchHonesty(a: Lender, b: Lender): number {
  const na = a.nmlsVerified ? 2 : cleanNmlsId(a.nmlsId) ? 1 : 0;
  const nb = b.nmlsVerified ? 2 : cleanNmlsId(b.nmlsId) ? 1 : 0;
  if (nb !== na) return nb - na;
  const ca = computeDataConfidence(a).score;
  const cb = computeDataConfidence(b).score;
  if (cb !== ca) return cb - ca;
  const la = computeLocalMarketEvidence(a).hasEvidence ? 1 : 0;
  const lb = computeLocalMarketEvidence(b).hasEvidence ? 1 : 0;
  if (lb !== la) return lb - la;
  return b.reviewCount - a.reviewCount || a.name.localeCompare(b.name);
}
