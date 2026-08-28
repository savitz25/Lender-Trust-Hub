import { runFlpubTests } from '../lib/florida-profile/flpub-tests';
import { runFlexpTests } from '../lib/florida-profile/flexp-tests';

const rows = [...runFlpubTests(), ...runFlexpTests()];
for (const r of rows) console.log(r.pass ? 'PASS' : 'FAIL', r.id, r.detail);
if (rows.some((r) => !r.pass)) process.exit(1);
console.log('FLEXP_OK', rows.length);
