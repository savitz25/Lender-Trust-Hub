/**
 * Lender V2.1: Insurance after financing; Move only when relocating.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const src = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../lib/network/life-journey.ts'),
  'utf8'
);
let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('FAIL', msg);
  }
}
assert(src.includes("label: 'Research insurance coverage'"), 'insurance CTA');
assert(src.includes("fromMove"), 'Move gated on relocate');
assert(!/case 'lender-directory':[\s\S]*Research interstate movers/.test(src.replace(/\n/g, ' ')), 'directory does not always promote movers');
assert(!src.includes('contractortrusthub.com'), 'no lender→contractor');
if (failed) {
  console.error(`${failed} failed`);
  process.exit(1);
}
console.log('Lender V2.1 journey checks passed');
