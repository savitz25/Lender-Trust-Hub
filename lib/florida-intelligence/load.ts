import 'server-only';

import { FLORIDA_SNAPSHOT_CONTRACT } from '@/lib/intel-snapshots/contracts';
import { loadPublishedSnapshot } from '@/lib/intel-snapshots/load';
import { FLORIDA_SNAPSHOT, type FloridaIntelligenceSnapshot } from './snapshot';

export type LoadedFloridaIntel =
  | {
      status: 'ok';
      source: 'published' | 'superseded' | 'accepted_artifact';
      snapshot: FloridaIntelligenceSnapshot;
    }
  | { status: 'unavailable'; reason: string };

export async function loadFloridaIntelligence(): Promise<LoadedFloridaIntel> {
  const loaded = await loadPublishedSnapshot<FloridaIntelligenceSnapshot>(
    FLORIDA_SNAPSHOT_CONTRACT,
    'FL',
    FLORIDA_SNAPSHOT,
  );
  if (loaded.status === 'unavailable') return loaded;
  return { status: 'ok', source: loaded.source, snapshot: loaded.payload };
}
