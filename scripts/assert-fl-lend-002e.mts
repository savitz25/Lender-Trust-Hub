import { runSnapshotGrainTests } from '../lib/intel-snapshots/grain-tests';
import { runIntel004ContractTests } from '../lib/home-intel/intel-004-tests';
import { runFlintTests } from '../lib/florida-intelligence/flint-tests';

let failed = 0;
function report(label: string, rows: Array<{ id: string; pass: boolean; detail: string }>) {
  for (const row of rows) {
    if (row.pass) console.log(`PASS ${label} ${row.id} ${row.detail}`);
    else {
      failed += 1;
      console.error(`FAIL ${label} ${row.id} ${row.detail}`);
    }
  }
}

report('002E', runSnapshotGrainTests());
report('I004', runIntel004ContractTests());
report('FLINT', runFlintTests());
if (failed) {
  console.error(`${failed} FL-LEND-002E checks failed`);
  process.exit(1);
}
console.log('PASS fl-lend-002e');
