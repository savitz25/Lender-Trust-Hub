import { createHash } from 'crypto';
import type { IdentityGraph } from './types';

export function fingerprintPayload(value: unknown): string {
  const json = JSON.stringify(value);
  return createHash('sha256').update(json).digest('hex');
}

export function graphFingerprints(graph: IdentityGraph) {
  const institutions = graph.entities
    .filter((e) => e.entityKind === 'institution')
    .map((e) => ({ k: e.stableKey, n: e.legalName, c: e.identityConfidence }))
    .sort((a, b) => a.k.localeCompare(b.k));

  const identifiers = graph.identifiers
    .map((i) => ({
      t: i.identifierType,
      v: i.identifierValue,
      e: i.entityId,
      c: i.confidence,
    }))
    .sort((a, b) => `${a.t}:${a.v}`.localeCompare(`${b.t}:${b.v}`));

  const sources = graph.sourceLinks
    .map((s) => ({ d: s.sourceDataset, r: s.sourceRecordId, e: s.entityId, m: s.method }))
    .sort((a, b) => `${a.d}:${a.r}`.localeCompare(`${b.d}:${b.r}`));

  const bridges = graph.bridges
    .map((b) => ({ r: b.legacyRowId, e: b.entityId, g: b.geoClass }))
    .sort((a, b) => a.r.localeCompare(b.r));

  return {
    INSTITUTION_COHORT: fingerprintPayload(institutions),
    IDENTIFIER_COHORT: fingerprintPayload(identifiers),
    SOURCE_LINK_COHORT: fingerprintPayload(sources),
    LEGACY_BRIDGE_COHORT: fingerprintPayload(bridges),
  };
}
