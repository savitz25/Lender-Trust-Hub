import { runDiscContractTests } from '../lib/national-profile/disc-tests';

const rows = runDiscContractTests();
for (const r of rows) console.log(r.pass ? 'PASS' : 'FAIL', r.id, r.detail);
if (rows.some((r) => !r.pass)) process.exit(1);
console.log('DISC_OK', rows.length);
