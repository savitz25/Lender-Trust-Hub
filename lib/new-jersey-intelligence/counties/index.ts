import monmouth from './monmouth.json';
import middlesex from './middlesex.json';
import somerset from './somerset.json';
import union from './union.json';
import type { NjCountyIntelligenceSnapshot, NjCountySlug } from './types';
import { NJ_COUNTY_INTELLIGENCE_GATES } from './publication';

export {
  NJ_COUNTY_CONTRACT,
  NJ_COUNTY_NAME_TO_PATH,
  NJ_COUNTY_SLUGS,
  isNjCountySlug,
  type NjCountyIntelligenceSnapshot,
  type NjCountySlug,
} from './types';
export {
  NJ_COUNTY_INTELLIGENCE_GATES,
  indexedNjCountyGates,
  type NjCountyPublicationGate,
} from './publication';

export const NJ_COUNTY_SNAPSHOTS: Record<NjCountySlug, NjCountyIntelligenceSnapshot> = {
  'monmouth-county': monmouth,
  'middlesex-county': middlesex,
  'somerset-county': somerset,
  'union-county': union,
};

export function getNjCountySnapshot(slug: NjCountySlug): NjCountyIntelligenceSnapshot {
  return NJ_COUNTY_SNAPSHOTS[slug];
}

export function countyPassesPublicationGate(snapshot: NjCountyIntelligenceSnapshot): boolean {
  const acquired = snapshot.coverage.source_families.filter(
    (f) => f.coverage === 'ACQUIRED_CURRENT_SNAPSHOT' && f.authoritative,
  );
  const countySpecific = acquired.filter((f) => f.county_specific);
  return (
    snapshot.coverage.gate_pass === true &&
    snapshot.publication_status === 'published' &&
    acquired.length >= 3 &&
    countySpecific.length >= 1 &&
    snapshot.findings.length >= 2 &&
    snapshot.coverage.thin_duplicate_of_state_page === false &&
    Boolean(snapshot.fingerprint) &&
    snapshot.fingerprint !== 'PENDING'
  );
}

export function countyRobots(slug: NjCountySlug): { index: boolean; follow: boolean } {
  const gate = NJ_COUNTY_INTELLIGENCE_GATES[slug];
  const snapshot = NJ_COUNTY_SNAPSHOTS[slug];
  const index = gate.robotsIndex && countyPassesPublicationGate(snapshot);
  return index ? { index: true, follow: true } : { index: false, follow: false };
}
