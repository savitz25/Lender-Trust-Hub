import 'server-only';

import { loadPublishedSnapshot } from '@/lib/intel-snapshots/load';
import {
  AZ_SNAPSHOT_CONTRACT,
  ARIZONA_SNAPSHOT,
  type ArizonaIntelligenceSnapshot,
} from './snapshot';

export type LoadedArizonaIntel =
  | {
      status: 'ok';
      source: 'published' | 'superseded' | 'accepted_artifact';
      snapshot: ArizonaIntelligenceSnapshot;
    }
  | { status: 'unavailable'; reason: string };

export async function loadArizonaIntelligence(): Promise<LoadedArizonaIntel> {
  const loaded = await loadPublishedSnapshot<ArizonaIntelligenceSnapshot>(
    AZ_SNAPSHOT_CONTRACT,
    'AZ',
    ARIZONA_SNAPSHOT,
  );
  if (loaded.status === 'unavailable') return loaded;
  return { status: 'ok', source: loaded.source, snapshot: loaded.payload };
}
