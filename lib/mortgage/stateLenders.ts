/**
 * MORTGAGE VERTICAL DATA LAYER
 * Phase 0: counts are distinct NMLS entities, not geo-variant row inflation.
 */
import { lenders, type Lender } from '@/lib/mockData';
import { US_STATES } from '@/lib/fdic/states';
import {
  countEntitiesByCounty,
  countLenderCatalog,
  dedupeLendersByEntity,
} from '@/lib/verification';

export interface StateMortgageStats {
  total: number;
  branchListings: number;
  verified: number;
  avgTrustScore: number;
  topCounties: { county: string; countySlug: string; count: number }[];
  topLender?: Lender;
  headlineLabel: string;
}

export function getLendersByStateSlug(stateSlug: string): Lender[] {
  const rows = lenders.filter((l) => l.stateSlug === stateSlug);
  return dedupeLendersByEntity(rows).sort((a, b) => b.trustScore - a.trustScore);
}

export function getLenderRowsByStateSlug(stateSlug: string): Lender[] {
  return lenders.filter((l) => l.stateSlug === stateSlug);
}

export function getStateSlugsWithLenders(): string[] {
  return [...new Set(lenders.map((l) => l.stateSlug))].sort();
}

export function getStateMortgageStats(stateSlug: string): StateMortgageStats {
  const rows = getLenderRowsByStateSlug(stateSlug);
  const entities = dedupeLendersByEntity(rows);
  const counts = countLenderCatalog(rows);
  const topCounties = countEntitiesByCounty(rows).slice(0, 5).map((c) => ({
    county: c.county,
    countySlug: c.countySlug,
    count: c.count,
  }));
  const avgTrustScore =
    entities.length > 0
      ? Math.round(entities.reduce((s, l) => s + l.trustScore, 0) / entities.length)
      : 0;

  return {
    total: counts.distinctEntities,
    branchListings: counts.branchListings,
    verified: counts.verifiedEntities,
    avgTrustScore,
    topCounties,
    topLender: entities[0],
    headlineLabel: counts.headlineLabel,
  };
}

export function resolveStateMeta(stateSlug: string) {
  return US_STATES.find((s) => s.slug === stateSlug);
}

export const MORTGAGE_DATA_UPDATED = '2026-07-01';
