import 'server-only';

import { loadPublishedSnapshot } from '@/lib/intel-snapshots/load';
import { NV_SNAPSHOT_CONTRACT, NEVADA_SNAPSHOT, type NevadaIntelligenceSnapshot } from './snapshot';

export type LoadedNevadaIntel =
  | { status: 'ok'; source: 'published' | 'superseded' | 'accepted_artifact'; snapshot: NevadaIntelligenceSnapshot }
  | { status: 'unavailable'; reason: string };

export async function loadNevadaIntelligence(): Promise<LoadedNevadaIntel> {
  const loaded = await loadPublishedSnapshot<NevadaIntelligenceSnapshot>(NV_SNAPSHOT_CONTRACT, 'NV', NEVADA_SNAPSHOT);
  if (loaded.status === 'unavailable') return loaded;
  return { status: 'ok', source: loaded.source, snapshot: loaded.payload };
}
