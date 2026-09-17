import 'server-only';

import { loadPublishedSnapshot } from '@/lib/intel-snapshots/load';
import {
  PA_SNAPSHOT_CONTRACT,
  PENNSYLVANIA_SNAPSHOT,
  type PennsylvaniaIntelligenceSnapshot,
} from './snapshot';

export type LoadedPennsylvaniaIntel =
  | { status: 'ok'; source: 'published' | 'superseded' | 'accepted_artifact'; snapshot: PennsylvaniaIntelligenceSnapshot }
  | { status: 'unavailable'; reason: string };

export async function loadPennsylvaniaIntelligence(): Promise<LoadedPennsylvaniaIntel> {
  const loaded = await loadPublishedSnapshot<PennsylvaniaIntelligenceSnapshot>(
    PA_SNAPSHOT_CONTRACT,
    'PA',
    PENNSYLVANIA_SNAPSHOT,
  );
  if (loaded.status === 'unavailable') return loaded;
  return { status: 'ok', source: loaded.source, snapshot: loaded.payload };
}
