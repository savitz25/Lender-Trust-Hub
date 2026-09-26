import 'server-only';

import { loadPublishedSnapshot } from '@/lib/intel-snapshots/load';
import { MN_SNAPSHOT_CONTRACT, MINNESOTA_SNAPSHOT, type MinnesotaIntelligenceSnapshot } from './snapshot';

export type LoadedMinnesotaIntel =
  | { status: 'ok'; source: 'published' | 'superseded' | 'accepted_artifact'; snapshot: MinnesotaIntelligenceSnapshot }
  | { status: 'unavailable'; reason: string };

export async function loadMinnesotaIntelligence(): Promise<LoadedMinnesotaIntel> {
  const loaded = await loadPublishedSnapshot<MinnesotaIntelligenceSnapshot>(MN_SNAPSHOT_CONTRACT, 'MN', MINNESOTA_SNAPSHOT);
  if (loaded.status === 'unavailable') return loaded;
  return { status: 'ok', source: loaded.source, snapshot: loaded.payload };
}
