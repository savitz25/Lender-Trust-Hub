/**
 * Phase 4 — tier helpers for robots, sitemaps, and UI badges.
 */

import {
  scoreCountyQuality,
  assessAllCountyQuality,
  tierDistribution,
  COUNTY_QUALITY_THRESHOLDS,
  COUNTY_TIER_MOVEMENT_POLICY,
  type CountyQualityAssessment,
  type CountySeoTier,
} from '@/lib/mortgage/county-quality-score';

export type {
  CountyQualityAssessment,
  CountySeoTier,
};

export {
  scoreCountyQuality,
  assessAllCountyQuality,
  tierDistribution,
  COUNTY_QUALITY_THRESHOLDS,
  COUNTY_TIER_MOVEMENT_POLICY,
};

export function countyRobotsForTier(tier: CountySeoTier): {
  index: boolean;
  follow: boolean;
} {
  if (tier === 3) return { index: false, follow: true };
  return { index: true, follow: true };
}

export function assessCountyForPage(
  stateSlug: string,
  countySlug: string
): CountyQualityAssessment {
  return scoreCountyQuality(stateSlug, countySlug);
}

/** Counties eligible for main sitemap (Tier 1 + 2). */
export function getSitemapCounties(): {
  stateSlug: string;
  countySlug: string;
  tier: CountySeoTier;
  score: number;
}[] {
  return assessAllCountyQuality()
    .filter((a) => a.sitemapInclude)
    .map((a) => ({
      stateSlug: a.stateSlug,
      countySlug: a.countySlug,
      tier: a.tier,
      score: a.score,
    }))
    .sort((a, b) => b.score - a.score);
}

/** Premium counties for strong interlinking on state hubs. */
export function getPremiumCountiesForState(stateSlug: string): CountyQualityAssessment[] {
  return assessAllCountyQuality()
    .filter((a) => a.stateSlug === stateSlug && a.tier === 1)
    .sort((a, b) => b.score - a.score);
}

export function getIndexableCountiesForState(stateSlug: string): CountyQualityAssessment[] {
  return assessAllCountyQuality()
    .filter((a) => a.stateSlug === stateSlug && a.indexable)
    .sort((a, b) => b.score - a.score);
}
