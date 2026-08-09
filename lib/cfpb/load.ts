import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { CfpbCompanySnapshot, CfpbSnapshotFile } from './types';

const SNAPSHOT_REL = join('data', 'cfpb', 'mortgage-complaints-snapshot.json');

let cached: CfpbSnapshotFile | null | undefined;

function resolveSnapshotPath(): string {
  return join(process.cwd(), SNAPSHOT_REL);
}

export function cfpbSnapshotPath(): string {
  return resolveSnapshotPath();
}

export function cfpbDataAvailable(): boolean {
  return existsSync(resolveSnapshotPath());
}

/** Load committed CFPB snapshot (build-time safe). */
export function loadCfpbSnapshot(): CfpbSnapshotFile | null {
  if (cached !== undefined) return cached;
  const path = resolveSnapshotPath();
  if (!existsSync(path)) {
    cached = null;
    return null;
  }
  try {
    const raw = readFileSync(path, 'utf8');
    cached = JSON.parse(raw) as CfpbSnapshotFile;
    return cached;
  } catch (err) {
    console.warn('[cfpb] failed to load snapshot', err);
    cached = null;
    return null;
  }
}

/** Test helper / script: clear memo. */
export function clearCfpbSnapshotCache(): void {
  cached = undefined;
}

export function getCompanySnapshotMap(): Map<string, CfpbCompanySnapshot> {
  const snap = loadCfpbSnapshot();
  const map = new Map<string, CfpbCompanySnapshot>();
  if (!snap) return map;
  for (const c of snap.companies) {
    map.set(c.company, c);
  }
  return map;
}
