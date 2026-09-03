import 'server-only';

import { loadPublishedSnapshot } from '@/lib/intel-snapshots/load';
import {
  CA_SNAPSHOT_CONTRACT,
  CALIFORNIA_SNAPSHOT,
  type CaliforniaIntelligenceSnapshot,
} from './snapshot';

export type LoadedCaliforniaIntel =
  | {
      status: 'ok';
      source: 'published' | 'superseded' | 'accepted_artifact';
      snapshot: CaliforniaIntelligenceSnapshot;
    }
  | { status: 'unavailable'; reason: string };

export async function loadCaliforniaIntelligence(): Promise<LoadedCaliforniaIntel> {
  const loaded = await loadPublishedSnapshot<CaliforniaIntelligenceSnapshot>(
    CA_SNAPSHOT_CONTRACT,
    'CA',
    CALIFORNIA_SNAPSHOT,
  );
  if (loaded.status === 'unavailable') return loaded;
  return { status: 'ok', source: loaded.source, snapshot: loaded.payload };
}
