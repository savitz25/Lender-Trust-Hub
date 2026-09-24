import 'server-only';

import { loadPublishedSnapshot } from '@/lib/intel-snapshots/load';
import { TN_SNAPSHOT_CONTRACT, TENNESSEE_SNAPSHOT, type TennesseeIntelligenceSnapshot } from './snapshot';

export type LoadedTennesseeIntel =
  | { status: 'ok'; source: 'published' | 'superseded' | 'accepted_artifact'; snapshot: TennesseeIntelligenceSnapshot }
  | { status: 'unavailable'; reason: string };

export async function loadTennesseeIntelligence(): Promise<LoadedTennesseeIntel> {
  const loaded = await loadPublishedSnapshot<TennesseeIntelligenceSnapshot>(TN_SNAPSHOT_CONTRACT, 'TN', TENNESSEE_SNAPSHOT);
  if (loaded.status === 'unavailable') return loaded;
  return { status: 'ok', source: loaded.source, snapshot: loaded.payload };
}
