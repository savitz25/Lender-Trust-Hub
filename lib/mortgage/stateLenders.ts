/**
 * MORTGAGE VERTICAL DATA LAYER
 * Phase 0: counts are distinct NMLS entities, not geo-variant row inflation.
 */
import { lenders, type Lender } from '@/lib/mockData';
import { US_STATES } from '@/lib/fdic/states';
import { countLenderCatalog, dedupeLendersByEntity, lenderEntityKey } from '@/lib/verification';
import { deriveLenderHomeLocality } from '@/lib/geo';
import { compareLendersByResearchHonesty } from '@/lib/research/research-signals';

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
  return dedupeLendersByEntity(rows).sort(compareLendersByResearchHonesty);
}

export function getLenderRowsByStateSlug(stateSlug: string): Lender[] {
  return lenders.filter((l) => l.stateSlug === stateSlug);
}

export function getStateSlugsWithLenders(): string[] {
  return [...new Set(lenders.map((l) => l.stateSlug))].sort();
}

/** Top counties by distinct entities with derived HQ in that county. */
function topCountiesByHomeLocality(
  rows: Lender[],
  limit = 5
): { county: string; countySlug: string; count: number }[] {
  const map = new Map<string, { county: string; countySlug: string; entities: Set<string> }>();
  for (const row of rows) {
    const home = deriveLenderHomeLocality(row);
    if (!home.countySlug) continue;
    let entry = map.get(home.countySlug);
    if (!entry) {
      entry = { county: home.county, countySlug: home.countySlug, entities: new Set() };
      map.set(home.countySlug, entry);
    }
    entry.entities.add(lenderEntityKey(row));
  }
  return [...map.values()]
    .map((e) => ({ county: e.county, countySlug: e.countySlug, count: e.entities.size }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function getStateMortgageStats(stateSlug: string): StateMortgageStats {
  const rows = getLenderRowsByStateSlug(stateSlug);
  const entities = dedupeLendersByEntity(rows);
  const counts = countLenderCatalog(rows);
  const topCounties = topCountiesByHomeLocality(rows, 5);
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
