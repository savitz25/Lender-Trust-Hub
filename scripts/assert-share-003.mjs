import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');
const failures = [];
const assert = (cond, msg) => {
  if (!cond) failures.push(msg);
};

assert(existsSync(join(root, 'app/lenders/[slug]/share-og/route.tsx')), 'lender share-og route exists');
const route = read('app/lenders/[slug]/share-og/route.tsx');
const page = read('app/lenders/[slug]/page.tsx');
const model = read('lib/seo/share-card-model.ts');
assert(route.includes('renderLenderFallbackImage'), 'fallback on missing lender');
assert(route.includes('nmlsId'), 'NMLS from public catalog');
assert(!route.includes('rating'), 'no rating on OG route');
assert(!route.includes('phone'), 'no phone on OG route');
assert(!route.includes('apr'), 'no APR on OG route');
assert(page.includes('/share-og'), 'metadata points at share-og');
assert(page.includes('www.lendertrusthub.com/lenders/'), 'canonical stays on lender page');
assert(model.includes('LENDER RESEARCH'), 'entity eyebrow');
assert(!/no complaints|fully verified|trusted|approved/i.test(model), 'no endorsement copy');
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('SHARE-003 Lender assertions passed.');
