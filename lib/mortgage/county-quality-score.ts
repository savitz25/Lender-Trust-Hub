/**
 * Phase 4 — County quality score (0–100) and SEO product tiers.
 *
 * Tier 1 Premium  — fully indexable flagship county research surfaces
 * Tier 2 Standard — indexable useful research pages
 * Tier 3 Development — noindex,follow until promotion criteria are met
 *
 * Population alone does not decide tier. Uniqueness comes from real inventory
 * and utility signals — never invented local market essays.
 */

import type { Lender } from '@/lib/mockData';
import { getCountyLenderSegments } from '@/lib/lenders';
import { cleanNmlsId } from '@/lib/verification/nmls';
import { computeDataConfidence } from '@/lib/research/research-signals';
import { MIN_MEANINGFUL_IN_COUNTY } from '@/lib/geo';

export type CountySeoTier = 1 | 2 | 3;

export type CountyQualityComponents = {
  /** 0–30: verified / complete inventory usefulness */
  inventoryQuality: number;
  /** 0–25: true in-county HQ after Phase 1 */
  inCountyPresence: number;
  /** 0–15: unique local usefulness (loan mix, verified share) */
  localUsefulness: number;
  /** 0–15: consumer utility (tools always available; score for path richness) */
  consumerUtility: number;
  /** 0–10: data completeness / confidence of listings */
  dataCompleteness: number;
  /** 0–5: internal connectivity readiness (state hub + tools) */
  connectivity: number;
};

export type CountyQualityAssessment = {
  stateSlug: string;
  countySlug: string;
  score: number;
  components: CountyQualityComponents;
  tier: CountySeoTier;
  tierLabel: 'Premium' | 'Standard' | 'Development';
  indexable: boolean;
  /** Include in premium/standard sitemap segments */
  sitemapInclude: boolean;
  reason: string;
  promoteEligible: boolean;
  demoteRisk: boolean;
  metadata: {
    inCountyCount: number;
    nearbyCount: number;
    verifiedInCounty: number;
    avgResearchScore: number;
    avgDataConfidence: number;
    loanTypeDiversity: number;
    meaningfulInCounty: boolean;
  };
};

export const COUNTY_QUALITY_THRESHOLDS = {
  tier1MinScore: 68,
  tier2MinScore: 42,
  /** Hard gate: indexable tiers need this many true in-county HQ entities */
  minInCountyForIndex: 2,
  /** Premium prefers meaningful local inventory */
  tier1PreferInCountyMin: MIN_MEANINGFUL_IN_COUNTY,
  /** Premium needs some NMLS-verified in-county share */
  tier1MinVerifiedInCounty: 1,
} as const;

export const COUNTY_TIER_MOVEMENT_POLICY = {
  promoteToTier2:
    'Score ≥ 42, ≥ 2 in-county HQ entities, not relying on nearby padding alone',
  promoteToTier1:
    'Score ≥ 68, ≥ 3 in-county HQ, ≥ 1 NMLS-verified in-county, loan-type diversity ≥ 2',
  demoteFromIndexable:
    'In-county drops below 2, or score falls below 42 after inventory changes',
  notes: [
    'Do not promote by writing unsupported local essays',
    'Nearby inventory never counts toward in-county gates',
    'Population is not a scoring input',
  ],
} as const;

function clamp(n: number, max: number): number {
  return Math.max(0, Math.min(max, Math.round(n)));
}

function loanTypeDiversity(lenders: Lender[]): number {
  const set = new Set<string>();
  for (const l of lenders) {
    for (const t of l.loanTypes ?? []) set.add(t);
  }
  return set.size;
}

/**
 * Score a county page from Phase 0–3 catalog signals only.
 */
export function scoreCountyQuality(
  stateSlug: string,
  countySlug: string
): CountyQualityAssessment {
  const placeLabel = `${countySlug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')} County`;
  const seg = getCountyLenderSegments(stateSlug, countySlug, placeLabel);
  const inCounty = seg.inCounty;
  const nearby = seg.nearby;
  const inN = inCounty.length;
  const nearN = nearby.length;

  const verifiedInCounty = inCounty.filter(
    (l) => l.nmlsVerified && cleanNmlsId(l.nmlsId)
  ).length;

  const avgResearch =
    inN > 0
      ? inCounty.reduce((s, l) => s + l.trustScore, 0) / inN
      : nearN > 0
        ? nearby.reduce((s, l) => s + l.trustScore, 0) / nearN
        : 0;

  const avgConf =
    inN > 0
      ? inCounty.reduce((s, l) => s + computeDataConfidence(l).score, 0) / inN
      : 0;

  const diversity = loanTypeDiversity(inCounty.length ? inCounty : nearby);

  // --- components ---
  // Inventory quality (0–30): verified share + research score of in-county
  let inventoryQuality = 0;
  if (inN >= 8) inventoryQuality += 12;
  else if (inN >= 5) inventoryQuality += 10;
  else if (inN >= 3) inventoryQuality += 8;
  else if (inN >= 2) inventoryQuality += 5;
  else if (inN === 1) inventoryQuality += 2;
  if (verifiedInCounty >= 5) inventoryQuality += 10;
  else if (verifiedInCounty >= 3) inventoryQuality += 8;
  else if (verifiedInCounty >= 1) inventoryQuality += 5;
  if (avgResearch >= 55) inventoryQuality += 8;
  else if (avgResearch >= 40) inventoryQuality += 5;
  else if (avgResearch >= 25) inventoryQuality += 2;
  inventoryQuality = clamp(inventoryQuality, 30);

  // In-county presence (0–25)
  let inCountyPresence = 0;
  if (inN >= MIN_MEANINGFUL_IN_COUNTY) inCountyPresence += 18;
  else if (inN === 2) inCountyPresence += 12;
  else if (inN === 1) inCountyPresence += 6;
  // Prefer true local over nearby-heavy pages
  if (inN > 0 && nearN <= inN) inCountyPresence += 7;
  else if (inN > 0) inCountyPresence += 3;
  inCountyPresence = clamp(inCountyPresence, 25);

  // Local usefulness (0–15): loan mix + not empty
  let localUsefulness = 0;
  if (diversity >= 5) localUsefulness += 10;
  else if (diversity >= 3) localUsefulness += 7;
  else if (diversity >= 2) localUsefulness += 4;
  else if (diversity >= 1) localUsefulness += 2;
  if (inN >= 3) localUsefulness += 5;
  localUsefulness = clamp(localUsefulness, 15);

  // Consumer utility (0–15): tools always on site; bonus when inventory makes them useful
  let consumerUtility = 6; // calculators / compare / NMLS always linkable
  if (inN >= 2) consumerUtility += 5;
  if (inN >= 3) consumerUtility += 2;
  if (nearN > 0 && inN > 0) consumerUtility += 2; // honest nearby secondary
  consumerUtility = clamp(consumerUtility, 15);

  // Data completeness (0–10)
  let dataCompleteness = 0;
  if (avgConf >= 60) dataCompleteness = 10;
  else if (avgConf >= 45) dataCompleteness = 7;
  else if (avgConf >= 30) dataCompleteness = 4;
  else if (inN > 0) dataCompleteness = 2;

  // Connectivity (0–5): state hub + tools always exist for published counties
  const connectivity = inN > 0 || nearN > 0 ? 5 : 1;

  const components: CountyQualityComponents = {
    inventoryQuality,
    inCountyPresence,
    localUsefulness,
    consumerUtility,
    dataCompleteness,
    connectivity,
  };

  const score = clamp(
    inventoryQuality +
      inCountyPresence +
      localUsefulness +
      consumerUtility +
      dataCompleteness +
      connectivity,
    100
  );

  const meaningfulInCounty = inN >= MIN_MEANINGFUL_IN_COUNTY;
  const hardIndexGate = inN >= COUNTY_QUALITY_THRESHOLDS.minInCountyForIndex;

  let tier: CountySeoTier = 3;
  let tierLabel: CountyQualityAssessment['tierLabel'] = 'Development';
  let reason = 'Below indexation bar or insufficient in-county HQ inventory';

  if (
    hardIndexGate &&
    score >= COUNTY_QUALITY_THRESHOLDS.tier1MinScore &&
    inN >= COUNTY_QUALITY_THRESHOLDS.tier1PreferInCountyMin &&
    verifiedInCounty >= COUNTY_QUALITY_THRESHOLDS.tier1MinVerifiedInCounty &&
    diversity >= 2
  ) {
    tier = 1;
    tierLabel = 'Premium';
    reason = 'Strong in-county inventory, verification, and research usefulness';
  } else if (hardIndexGate && score >= COUNTY_QUALITY_THRESHOLDS.tier2MinScore) {
    tier = 2;
    tierLabel = 'Standard';
    reason = 'Useful in-county research page with honest inventory';
  } else if (!hardIndexGate) {
    reason = `Fewer than ${COUNTY_QUALITY_THRESHOLDS.minInCountyForIndex} true in-county HQ entities — development (noindex,follow)`;
  } else {
    reason = `Score ${score} below Standard floor (${COUNTY_QUALITY_THRESHOLDS.tier2MinScore})`;
  }

  const indexable = tier === 1 || tier === 2;
  const promoteEligible =
    !indexable &&
    inN >= COUNTY_QUALITY_THRESHOLDS.minInCountyForIndex &&
    score >= COUNTY_QUALITY_THRESHOLDS.tier2MinScore - 8;
  const demoteRisk =
    indexable &&
    (inN < COUNTY_QUALITY_THRESHOLDS.minInCountyForIndex ||
      score < COUNTY_QUALITY_THRESHOLDS.tier2MinScore);

  return {
    stateSlug,
    countySlug,
    score,
    components,
    tier,
    tierLabel,
    indexable,
    sitemapInclude: indexable,
    reason,
    promoteEligible,
    demoteRisk,
    metadata: {
      inCountyCount: inN,
      nearbyCount: nearN,
      verifiedInCounty,
      avgResearchScore: Math.round(avgResearch),
      avgDataConfidence: Math.round(avgConf),
      loanTypeDiversity: diversity,
      meaningfulInCounty,
    },
  };
}

export function assessAllCountyQuality(
  counties?: { stateSlug: string; countySlug: string }[]
): CountyQualityAssessment[] {
  const list =
    counties ??
    // Lazy require avoids circular import with lib/lenders.ts
    (
      require('@/lib/lenders') as typeof import('@/lib/lenders')
    ).getAllCounties();
  return list.map((c) => scoreCountyQuality(c.stateSlug, c.countySlug));
}

export function tierDistribution(assessments: CountyQualityAssessment[]): {
  tier1: number;
  tier2: number;
  tier3: number;
  total: number;
} {
  let tier1 = 0;
  let tier2 = 0;
  let tier3 = 0;
  for (const a of assessments) {
    if (a.tier === 1) tier1++;
    else if (a.tier === 2) tier2++;
    else tier3++;
  }
  return { tier1, tier2, tier3, total: assessments.length };
}
