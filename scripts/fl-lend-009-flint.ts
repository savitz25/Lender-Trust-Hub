import { runFlidTests } from '../lib/florida-profile/flid-tests';

const rows = runFlidTests();
for (const r of rows) console.log(r.pass ? 'PASS' : 'FAIL', r.id, r.detail);
if (rows.some((r) => !r.pass)) process.exit(1);
console.log('FLID_OK', rows.length);
