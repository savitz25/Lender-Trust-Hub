import { runAskLenderTests } from '../lib/ask-lender/ask-tests';
import { runIntel004ContractTests } from '../lib/home-intel/intel-004-tests';

const results = [...runIntel004ContractTests(), ...runAskLenderTests()];
let failed = 0;
for (const row of results) {
  if (row.pass) console.log(`PASS ${row.id} ${row.detail}`);
  else {
    failed += 1;
    console.error(`FAIL ${row.id} ${row.detail}`);
  }
}
if (failed) {
  console.error(`${failed} INTEL-004 contract checks failed`);
  process.exit(1);
}
console.log(`PASS intel-004 ${results.length} checks`);
