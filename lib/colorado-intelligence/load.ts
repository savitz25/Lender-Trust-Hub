import 'server-only';

import { loadPublishedSnapshot } from '@/lib/intel-snapshots/load';
import {
  CO_SNAPSHOT_CONTRACT,
  COLORADO_SNAPSHOT,
  type ColoradoIntelligenceSnapshot,
} from './snapshot';

export type LoadedColoradoIntel =
  | {
      status: 'ok';
      source: 'published' | 'superseded' | 'accepted_artifact';
      snapshot: ColoradoIntelligenceSnapshot;
    }
  | { status: 'unavailable'; reason: string };

export async function loadColoradoIntelligence(): Promise<LoadedColoradoIntel> {
  const loaded = await loadPublishedSnapshot<ColoradoIntelligenceSnapshot>(
    CO_SNAPSHOT_CONTRACT,
    'CO',
    COLORADO_SNAPSHOT,
  );
  if (loaded.status === 'unavailable') return loaded;
  return { status: 'ok', source: loaded.source, snapshot: loaded.payload };
}
