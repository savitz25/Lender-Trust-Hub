import 'server-only';

import { loadPublishedSnapshot } from '@/lib/intel-snapshots/load';
import { OR_SNAPSHOT_CONTRACT, OREGON_SNAPSHOT, type OregonIntelligenceSnapshot } from './snapshot';

export type LoadedOregonIntel =
  | { status: 'ok'; source: 'published' | 'superseded' | 'accepted_artifact'; snapshot: OregonIntelligenceSnapshot }
  | { status: 'unavailable'; reason: string };

export async function loadOregonIntelligence(): Promise<LoadedOregonIntel> {
  const loaded = await loadPublishedSnapshot<OregonIntelligenceSnapshot>(
    OR_SNAPSHOT_CONTRACT,
    'OR',
    OREGON_SNAPSHOT,
  );
  if (loaded.status === 'unavailable') return loaded;
  return { status: 'ok', source: loaded.source, snapshot: loaded.payload };
}
