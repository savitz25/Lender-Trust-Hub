/**
 * Deterministic pilot cohort — stratified by entity_type, no ranking bias.
 */

import type { NetworkDiscoveryEntity } from './types';

export const PILOT_TARGET_PREFERRED = 200;
export const PILOT_TARGET_MAX = 250;

export function selectPilotCohort(eligible: NetworkDiscoveryEntity[]): NetworkDiscoveryEntity[] {
  if (eligible.length <= PILOT_TARGET_PREFERRED) {
    return [...eligible].sort((a, b) => a.network_entity_id.localeCompare(b.network_entity_id));
  }

  const byType = new Map<string, NetworkDiscoveryEntity[]>();
  for (const e of eligible) {
    const list = byType.get(e.entity_type) ?? [];
    list.push(e);
    byType.set(e.entity_type, list);
  }
  for (const list of byType.values()) {
    list.sort((a, b) => a.network_entity_id.localeCompare(b.network_entity_id));
  }

  const types = [...byType.keys()].sort((a, b) => a.localeCompare(b));
  const indices = Object.fromEntries(types.map((t) => [t, 0]));
  const selected: NetworkDiscoveryEntity[] = [];
  const seen = new Set<string>();

  while (selected.length < PILOT_TARGET_PREFERRED) {
    let progressed = false;
    for (const t of types) {
      if (selected.length >= PILOT_TARGET_PREFERRED) break;
      const list = byType.get(t)!;
      const i = indices[t];
      if (i >= list.length) continue;
      const ent = list[i]!;
      indices[t] = i + 1;
      if (seen.has(ent.network_entity_id)) continue;
      seen.add(ent.network_entity_id);
      selected.push(ent);
      progressed = true;
    }
    if (!progressed) break;
  }

  return selected.sort((a, b) => a.network_entity_id.localeCompare(b.network_entity_id));
}
