import { runFlintTests } from '../lib/florida-intelligence/flint-tests';

const results = runFlintTests();
const fail = results.filter((r) => !r.pass);
for (const r of results) {
  console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.id} ${r.detail}`);
}
if (fail.length) {
  console.error('FAILED', fail.length);
  process.exit(1);
}
console.log('FLINT_OK', results.length);
