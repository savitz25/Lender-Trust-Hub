import 'server-only';

import { loadPublishedSnapshot } from '@/lib/intel-snapshots/load';
import {
  NY_SNAPSHOT_CONTRACT,
  NEW_YORK_SNAPSHOT,
  type NewYorkIntelligenceSnapshot,
} from './snapshot';

export type LoadedNewYorkIntel =
  | {
      status: 'ok';
      source: 'published' | 'superseded' | 'accepted_artifact';
      snapshot: NewYorkIntelligenceSnapshot;
    }
  | { status: 'unavailable'; reason: string };

export async function loadNewYorkIntelligence(): Promise<LoadedNewYorkIntel> {
  const loaded = await loadPublishedSnapshot<NewYorkIntelligenceSnapshot>(
    NY_SNAPSHOT_CONTRACT,
    'NY',
    NEW_YORK_SNAPSHOT,
  );
  if (loaded.status === 'unavailable') return loaded;
  return { status: 'ok', source: loaded.source, snapshot: loaded.payload };
}
