import { runAskLenderTests } from '../lib/ask-lender/ask-tests';

const results = runAskLenderTests();
let failed = 0;
for (const row of results) {
  if (row.pass) console.log(`PASS ${row.id} ${row.detail}`);
  else {
    failed += 1;
    console.error(`FAIL ${row.id} ${row.detail}`);
  }
}
if (failed) {
  console.error(`${failed} Ask Lender checks failed`);
  process.exit(1);
}
console.log(`PASS ask-lender ${results.length} checks`);
