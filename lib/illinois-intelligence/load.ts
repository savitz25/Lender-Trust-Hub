import 'server-only';

import { loadPublishedSnapshot } from '@/lib/intel-snapshots/load';
import { IL_SNAPSHOT_CONTRACT, ILLINOIS_SNAPSHOT, type IllinoisIntelligenceSnapshot } from './snapshot';

export type LoadedIllinoisIntel =
  | { status: 'ok'; source: 'published' | 'superseded' | 'accepted_artifact'; snapshot: IllinoisIntelligenceSnapshot }
  | { status: 'unavailable'; reason: string };

export async function loadIllinoisIntelligence(): Promise<LoadedIllinoisIntel> {
  const loaded = await loadPublishedSnapshot<IllinoisIntelligenceSnapshot>(
    IL_SNAPSHOT_CONTRACT,
    'IL',
    ILLINOIS_SNAPSHOT,
  );
  if (loaded.status === 'unavailable') return loaded;
  return { status: 'ok', source: loaded.source, snapshot: loaded.payload };
}
