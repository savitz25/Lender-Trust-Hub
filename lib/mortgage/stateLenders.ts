/**
 * MORTGAGE VERTICAL DATA LAYER
 * ============================
 * Aggregates lenders by state from lib/mockData (replace with JSON per state at scale).
 *
 * TO CLONE FOR AUTO/MCA/CREDIT REPAIR:
 * 1. Copy this file → lib/auto/stateLenders.ts
 * 2. Swap data source + MORTGAGE_CATEGORY → AUTO_CATEGORY in pages
 * 3. Done in <5 minutes per vertical
 */
import { lenders, type Lender } from '@/lib/mockData';
import { US_STATES } from '@/lib/fdic/states';

export interface StateMortgageStats {
  total: number;
  verified: number;
  avgTrustScore: number;
  topCounties: { county: string; countySlug: string; count: number }[];
  topLender?: Lender;
}

export function getLendersByStateSlug(stateSlug: string): Lender[] {
  return lenders
    .filter((l) => l.stateSlug === stateSlug)
    .sort((a, b) => b.trustScore - a.trustScore);
}

export function getStateSlugsWithLenders(): string[] {
  return [...new Set(lenders.map((l) => l.stateSlug))].sort();
}

export function getStateMortgageStats(stateSlug: string): StateMortgageStats {
  const stateLenders = getLendersByStateSlug(stateSlug);
  const countyMap = new Map<string, { county: string; countySlug: string; count: number }>();

  for (const l of stateLenders) {
    const key = l.countySlug;
    const existing = countyMap.get(key);
    if (existing) existing.count++;
    else countyMap.set(key, { county: l.county, countySlug: l.countySlug, count: 1 });
  }

  const topCounties = [...countyMap.values()].sort((a, b) => b.count - a.count).slice(0, 5);
  const avgTrustScore =
    stateLenders.length > 0
      ? Math.round(stateLenders.reduce((s, l) => s + l.trustScore, 0) / stateLenders.length)
      : 0;

  return {
    total: stateLenders.length,
    verified: stateLenders.filter((l) => l.nmlsVerified).length,
    avgTrustScore,
    topCounties,
    topLender: stateLenders[0],
  };
}

export function resolveStateMeta(stateSlug: string) {
  return US_STATES.find((s) => s.slug === stateSlug);
}

export const MORTGAGE_DATA_UPDATED = '2026-06-26';