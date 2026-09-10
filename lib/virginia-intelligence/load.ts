import 'server-only';

import { loadPublishedSnapshot } from '@/lib/intel-snapshots/load';
import {
  VA_SNAPSHOT_CONTRACT,
  VIRGINIA_SNAPSHOT,
  type VirginiaIntelligenceSnapshot,
} from './snapshot';

export type LoadedVirginiaIntel =
  | {
      status: 'ok';
      source: 'published' | 'superseded' | 'accepted_artifact';
      snapshot: VirginiaIntelligenceSnapshot;
    }
  | { status: 'unavailable'; reason: string };

export async function loadVirginiaIntelligence(): Promise<LoadedVirginiaIntel> {
  const loaded = await loadPublishedSnapshot<VirginiaIntelligenceSnapshot>(
    VA_SNAPSHOT_CONTRACT,
    'VA',
    VIRGINIA_SNAPSHOT,
  );
  if (loaded.status === 'unavailable') return loaded;
  return { status: 'ok', source: loaded.source, snapshot: loaded.payload };
}
