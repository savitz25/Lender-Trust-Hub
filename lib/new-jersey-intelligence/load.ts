import 'server-only';

import { loadPublishedSnapshot } from '@/lib/intel-snapshots/load';
import { NJ_SNAPSHOT_CONTRACT, NEW_JERSEY_SNAPSHOT, type NewJerseyIntelligenceSnapshot } from './snapshot';

export type LoadedNewJerseyIntel =
  | {
      status: 'ok';
      source: 'published' | 'superseded' | 'accepted_artifact';
      snapshot: NewJerseyIntelligenceSnapshot;
    }
  | { status: 'unavailable'; reason: string };

export async function loadNewJerseyIntelligence(): Promise<LoadedNewJerseyIntel> {
  const loaded = await loadPublishedSnapshot<NewJerseyIntelligenceSnapshot>(
    NJ_SNAPSHOT_CONTRACT,
    'NJ',
    NEW_JERSEY_SNAPSHOT,
  );
  if (loaded.status === 'unavailable') return loaded;
  return { status: 'ok', source: loaded.source, snapshot: loaded.payload };
}
