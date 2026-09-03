import { readFileSync, writeFileSync } from 'node:fs';
import { fingerprintSnapshotPayload } from '../lib/intel-snapshots/fingerprint';

const files = [
  'lib/new-jersey-intelligence/counties/monmouth.json',
  'lib/new-jersey-intelligence/counties/middlesex.json',
  'lib/new-jersey-intelligence/counties/somerset.json',
  'lib/new-jersey-intelligence/counties/union.json',
];

for (const file of files) {
  const snapshot = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
  snapshot.fingerprint = fingerprintSnapshotPayload(snapshot);
  writeFileSync(file, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`${file} ${snapshot.fingerprint}`);
}
