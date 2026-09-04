import 'server-only';

import { loadPublishedSnapshot } from '@/lib/intel-snapshots/load';
import {
  WA_SNAPSHOT_CONTRACT,
  WASHINGTON_SNAPSHOT,
  type WashingtonIntelligenceSnapshot,
} from './snapshot';

export type LoadedWashingtonIntel =
  | {
      status: 'ok';
      source: 'published' | 'superseded' | 'accepted_artifact';
      snapshot: WashingtonIntelligenceSnapshot;
    }
  | { status: 'unavailable'; reason: string };

export async function loadWashingtonIntelligence(): Promise<LoadedWashingtonIntel> {
  const loaded = await loadPublishedSnapshot<WashingtonIntelligenceSnapshot>(
    WA_SNAPSHOT_CONTRACT,
    'WA',
    WASHINGTON_SNAPSHOT,
  );
  if (loaded.status === 'unavailable') return loaded;
  return { status: 'ok', source: loaded.source, snapshot: loaded.payload };
}
