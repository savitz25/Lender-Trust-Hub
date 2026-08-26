import { cleanNmlsId } from '@/lib/verification/nmls';
import { coreCompanyName } from '@/lib/verification/entity-identity';
import type { CatalogRow, GeoClass, NmlsSlotClass } from './types';
import {
  BRANCH_NMLS_QUARANTINE,
  PERSON_OR_TEAM_NMLS_QUARANTINE,
  NAMED_NMLS_COLLISIONS,
} from './quarantine';

export function collidingNmlsIds(rows: CatalogRow[]): Set<string> {
  const byNmls = new Map<string, Set<string>>();
  for (const row of rows) {
    const nmls = cleanNmlsId(row.nmlsId);
    if (!nmls) continue;
    const core = coreCompanyName(row.name) || `slug:${row.slug}`;
    const set = byNmls.get(nmls) ?? new Set();
    set.add(core);
    byNmls.set(nmls, set);
  }
  const out = new Set<string>();
  for (const [nmls, cores] of byNmls) {
    if (cores.size > 1) out.add(nmls);
  }
  return out;
}

export function classifyNmlsSlot(
  row: CatalogRow,
  collisionNmls: Set<string>
): NmlsSlotClass {
  const nmls = cleanNmlsId(row.nmlsId);
  if (!nmls) return 'MISSING';
  if (BRANCH_NMLS_QUARANTINE.has(nmls)) return 'LIKELY_BRANCH_NMLS';
  if (PERSON_OR_TEAM_NMLS_QUARANTINE.has(nmls)) return 'LIKELY_PERSON_OR_TEAM_NMLS';
  if (collisionNmls.has(nmls) || nmls in NAMED_NMLS_COLLISIONS) return 'COLLISION';
  if (row.nmlsVerified) return 'CONFIRMED_INSTITUTION_NMLS';
  return 'UNKNOWN';
}

export function classifyNmlsValue(
  nmls: string | null,
  collisionNmls: Set<string>,
  verified: boolean
): NmlsSlotClass {
  if (!nmls) return 'MISSING';
  if (BRANCH_NMLS_QUARANTINE.has(nmls)) return 'LIKELY_BRANCH_NMLS';
  if (PERSON_OR_TEAM_NMLS_QUARANTINE.has(nmls)) return 'LIKELY_PERSON_OR_TEAM_NMLS';
  if (collisionNmls.has(nmls) || nmls in NAMED_NMLS_COLLISIONS) return 'COLLISION';
  if (verified) return 'CONFIRMED_INSTITUTION_NMLS';
  return 'UNKNOWN';
}

export function pickCanonicalCatalogRow(rows: CatalogRow[]): CatalogRow {
  if (rows.length === 1) return rows[0]!;
  return [...rows].sort((a, b) => {
    const aNat = a.id.startsWith('nat-') ? 1 : 0;
    const bNat = b.id.startsWith('nat-') ? 1 : 0;
    if (bNat !== aNat) return bNat - aNat;
    if (a.name.length !== b.name.length) return a.name.length - b.name.length;
    return a.slug.localeCompare(b.slug);
  })[0]!;
}

export function classifyGeoRow(
  row: CatalogRow,
  slot: NmlsSlotClass,
  canonicalSlug: string | null
): GeoClass {
  if (slot === 'LIKELY_BRANCH_NMLS') return 'BRANCH_CANDIDATE';
  if (slot === 'CONFIRMED_INSTITUTION_NMLS' && canonicalSlug) {
    return row.slug === canonicalSlug
      ? 'HEADQUARTERS_CATALOG_REPRESENTATION'
      : 'GEO_DISCOVERY_CLONE';
  }
  return 'UNKNOWN';
}
