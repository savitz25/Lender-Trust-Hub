import 'server-only';

import { NATIONAL_SNAPSHOT_CONTRACT } from '@/lib/intel-snapshots/contracts';
import { loadPublishedSnapshot } from '@/lib/intel-snapshots/load';
import { ACCEPTED_HOME_SNAPSHOT, buildLenderHomeIntelFromSnapshot } from './build';
import type { HomeIntelSnapshotV2, LenderHomeIntel } from './types';

export type LoadedHomeIntel =
  | { status: 'ok'; source: 'published' | 'superseded' | 'accepted_artifact'; intel: LenderHomeIntel }
  | { status: 'unavailable'; reason: string };

export async function loadLenderHomeIntel(): Promise<LoadedHomeIntel> {
  const loaded = await loadPublishedSnapshot<HomeIntelSnapshotV2>(
    NATIONAL_SNAPSHOT_CONTRACT,
    'NATIONAL',
    ACCEPTED_HOME_SNAPSHOT,
  );
  if (loaded.status === 'unavailable') return loaded;
  return {
    status: 'ok',
    source: loaded.source,
    intel: buildLenderHomeIntelFromSnapshot(loaded.payload, loaded.generatedAt),
  };
}
