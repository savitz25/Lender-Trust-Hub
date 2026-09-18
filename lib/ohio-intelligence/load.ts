import 'server-only';

import { loadPublishedSnapshot } from '@/lib/intel-snapshots/load';
import { OH_SNAPSHOT_CONTRACT, OHIO_SNAPSHOT, type OhioIntelligenceSnapshot } from './snapshot';

export type LoadedOhioIntel =
  | { status: 'ok'; source: 'published' | 'superseded' | 'accepted_artifact'; snapshot: OhioIntelligenceSnapshot }
  | { status: 'unavailable'; reason: string };

export async function loadOhioIntelligence(): Promise<LoadedOhioIntel> {
  const loaded = await loadPublishedSnapshot<OhioIntelligenceSnapshot>(
    OH_SNAPSHOT_CONTRACT,
    'OH',
    OHIO_SNAPSHOT,
  );
  if (loaded.status === 'unavailable') return loaded;
  return { status: 'ok', source: loaded.source, snapshot: loaded.payload };
}
