import { runFlpubTests } from '../lib/florida-profile/flpub-tests';

const rows = runFlpubTests();
for (const r of rows) console.log(r.pass ? 'PASS' : 'FAIL', r.id, r.detail);
if (rows.some((r) => !r.pass)) process.exit(1);
console.log('FLPUB_OK', rows.length);
