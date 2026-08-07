/**
 * Honest headline counts: distinct NMLS entities vs branch/location listings.
 */

import type { Lender } from '@/lib/mockData';
import { cleanNmlsId } from '@/lib/verification/nmls';
import { lenderEntityKey } from '@/lib/verification/entity-identity';

export type LenderCatalogCounts = {
  /** Distinct company entities (by NMLS when valid) */
  distinctEntities: number;
  /** Rows / geo listings in the slice */
  branchListings: number;
  /** Entities with hard NMLS ID verified badge */
  verifiedEntities: number;
  /** Entities with any numeric NMLS on file */
  entitiesWithNmlsId: number;
  /** Human label e.g. "42 lenders across 55 branch locations" */
  headlineLabel: string;
};

export function countLenderCatalog(rows: Lender[]): LenderCatalogCounts {
  const entityKeys = new Set<string>();
  const verifiedKeys = new Set<string>();
  const withNmlsKeys = new Set<string>();

  for (const row of rows) {
    const key = lenderEntityKey(row);
    entityKeys.add(key);
    if (row.nmlsVerified && cleanNmlsId(row.nmlsId)) verifiedKeys.add(key);
    if (cleanNmlsId(row.nmlsId)) withNmlsKeys.add(key);
  }

  const distinctEntities = entityKeys.size;
  const branchListings = rows.length;
  const verifiedEntities = verifiedKeys.size;
  const entitiesWithNmlsId = withNmlsKeys.size;

  let headlineLabel: string;
  if (distinctEntities === 0) {
    headlineLabel = 'No lenders listed yet';
  } else if (branchListings <= distinctEntities) {
    headlineLabel = `${distinctEntities} lender${distinctEntities === 1 ? '' : 's'}`;
  } else {
    headlineLabel = `${distinctEntities} lenders across ${branchListings} branch locations`;
  }

  return {
    distinctEntities,
    branchListings,
    verifiedEntities,
    entitiesWithNmlsId,
    headlineLabel,
  };
}

/** County map with distinct-entity counts (not inflated by geo duplicate rows). */
export function countEntitiesByCounty(
  rows: Lender[]
): { county: string; countySlug: string; count: number; branchListings: number }[] {
  const map = new Map<
    string,
    { county: string; countySlug: string; entities: Set<string>; branchListings: number }
  >();

  for (const row of rows) {
    const key = row.countySlug;
    let entry = map.get(key);
    if (!entry) {
      entry = {
        county: row.county,
        countySlug: row.countySlug,
        entities: new Set(),
        branchListings: 0,
      };
      map.set(key, entry);
    }
    entry.entities.add(lenderEntityKey(row));
    entry.branchListings += 1;
  }

  return [...map.values()]
    .map((e) => ({
      county: e.county,
      countySlug: e.countySlug,
      count: e.entities.size,
      branchListings: e.branchListings,
    }))
    .sort((a, b) => b.count - a.count);
}
