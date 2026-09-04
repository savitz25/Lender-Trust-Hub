import 'server-only';

import { loadPublishedSnapshot } from '@/lib/intel-snapshots/load';
import {
  TX_SNAPSHOT_CONTRACT,
  TEXAS_SNAPSHOT,
  type TexasIntelligenceSnapshot,
} from './snapshot';

export type LoadedTexasIntel =
  | {
      status: 'ok';
      source: 'published' | 'superseded' | 'accepted_artifact';
      snapshot: TexasIntelligenceSnapshot;
    }
  | { status: 'unavailable'; reason: string };

export async function loadTexasIntelligence(): Promise<LoadedTexasIntel> {
  const loaded = await loadPublishedSnapshot<TexasIntelligenceSnapshot>(
    TX_SNAPSHOT_CONTRACT,
    'TX',
    TEXAS_SNAPSHOT,
  );
  if (loaded.status === 'unavailable') return loaded;
  return { status: 'ok', source: loaded.source, snapshot: loaded.payload };
}
