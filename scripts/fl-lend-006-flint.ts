import { readFileSync } from 'node:fs';
import { runFlprofTests } from '../lib/florida-profile/flprof-tests';

const post = JSON.parse(readFileSync('docs/fl-lend-006-post.json', 'utf8'));
const rows = runFlprofTests(post);
for (const r of rows) {
  console.log(r.pass ? 'PASS' : 'FAIL', r.id, r.detail);
}
const fail = rows.filter((r) => !r.pass);
if (fail.length) {
  process.exit(1);
}
console.log('FLPROF_OK', rows.length);
