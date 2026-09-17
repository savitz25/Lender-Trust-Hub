import 'server-only';

import { loadPublishedSnapshot } from '@/lib/intel-snapshots/load';
import {
  NC_SNAPSHOT_CONTRACT,
  NORTH_CAROLINA_SNAPSHOT,
  type NorthCarolinaIntelligenceSnapshot,
} from './snapshot';

export type LoadedNorthCarolinaIntel =
  | { status: 'ok'; source: 'published' | 'superseded' | 'accepted_artifact'; snapshot: NorthCarolinaIntelligenceSnapshot }
  | { status: 'unavailable'; reason: string };

export async function loadNorthCarolinaIntelligence(): Promise<LoadedNorthCarolinaIntel> {
  const loaded = await loadPublishedSnapshot<NorthCarolinaIntelligenceSnapshot>(
    NC_SNAPSHOT_CONTRACT,
    'NC',
    NORTH_CAROLINA_SNAPSHOT,
  );
  if (loaded.status === 'unavailable') return loaded;
  return { status: 'ok', source: loaded.source, snapshot: loaded.payload };
}
