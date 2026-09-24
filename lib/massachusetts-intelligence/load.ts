import 'server-only';

import { loadPublishedSnapshot } from '@/lib/intel-snapshots/load';
import { MA_SNAPSHOT_CONTRACT, MASSACHUSETTS_SNAPSHOT, type MassachusettsIntelligenceSnapshot } from './snapshot';

export type LoadedMassachusettsIntel =
  | { status: 'ok'; source: 'published' | 'superseded' | 'accepted_artifact'; snapshot: MassachusettsIntelligenceSnapshot }
  | { status: 'unavailable'; reason: string };

export async function loadMassachusettsIntelligence(): Promise<LoadedMassachusettsIntel> {
  const loaded = await loadPublishedSnapshot<MassachusettsIntelligenceSnapshot>(
    MA_SNAPSHOT_CONTRACT,
    'MA',
    MASSACHUSETTS_SNAPSHOT,
  );
  if (loaded.status === 'unavailable') return loaded;
  return { status: 'ok', source: loaded.source, snapshot: loaded.payload };
}
