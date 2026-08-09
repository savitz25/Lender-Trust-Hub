/**
 * Runtime Phase 0 catalog audit — prints remaining hygiene issues.
 *   npx tsx scripts/audit-phase0-catalog.ts
 */
import { lenders } from '../lib/mockData';
import { cleanNmlsId } from '../lib/verification/nmls';
import { isLenderPlaceholderPhone } from '../lib/verification/phone';
import { dedupeLendersByEntity } from '../lib/verification/entity-identity';
import { deriveLenderHomeLocality } from '../lib/geo/home-locality';
import { getHmdaLenderEvidenceBySlug } from '../lib/hmda';
import { getCfpbComplaintEvidenceBySlug } from '../lib/cfpb';
import { NATIONAL_HMDA_LENDERS } from '../lib/mortgage/nationalHmdaLenders';

function section(title: string) {
  console.log(`\n=== ${title} ===`);
}

section('Catalog size');
console.log({
  listings: lenders.length,
  entities: dedupeLendersByEntity(lenders).length,
});

section('NMLS incomplete (after sanitize)');
const incompleteNmls = lenders.filter((l) => !cleanNmlsId(l.nmlsId));
console.log('count', incompleteNmls.length);
for (const l of incompleteNmls.slice(0, 25)) {
  console.log(`  ${l.slug} | nmls="${l.nmlsId}" | ${l.name} | ${l.city}, ${l.state}`);
}

section('Verified without numeric ID');
const badVerified = lenders.filter((l) => l.nmlsVerified && !cleanNmlsId(l.nmlsId));
console.log('count', badVerified.length);

section('Placeholder phones still present');
const badPhone = lenders.filter((l) => l.phone && isLenderPlaceholderPhone(l.phone));
console.log('count', badPhone.length, '| with any phone', lenders.filter((l) => l.phone).length);

section('Unsourced ratings/reviews still non-zero');
const withRating = lenders.filter(
  (l) => (l.rating || 0) > 0 || (l.reviewCount || 0) > 0 || (l.googleRating || 0) > 0
);
console.log('count', withRating.length);

section('nationalVolumeRank still non-zero');
console.log(
  'count',
  lenders.filter((l) => (l.nationalVolumeRank || 0) > 0).length
);

section('Close metrics still present');
console.log(
  'count',
  lenders.filter((l) => l.avgCloseDays != null || l.onTimeCloseRate != null).length
);

section('Duplicate NMLS groups (branch noise)');
const byNmls = new Map<string, typeof lenders>();
for (const l of lenders) {
  const n = cleanNmlsId(l.nmlsId);
  if (!n) continue;
  const list = byNmls.get(n) ?? [];
  list.push(l);
  byNmls.set(n, list);
}
const multi = [...byNmls.entries()]
  .filter(([, rows]) => rows.length > 1)
  .sort((a, b) => b[1].length - a[1].length);
console.log('groups', multi.length);
for (const [nmls, rows] of multi.slice(0, 25)) {
  console.log(
    `  NMLS ${nmls} ×${rows.length} names=[${[...new Set(rows.map((r) => r.name))].join(' | ')}]`
  );
  console.log(
    `    slugs: ${rows.map((r) => r.slug).join(', ')}`
  );
  console.log(
    `    counties: ${rows.map((r) => `${r.stateSlug}/${r.countySlug}`).join(', ')}`
  );
}

section('Slug collisions');
const bySlug = new Map<string, typeof lenders>();
for (const l of lenders) {
  const list = bySlug.get(l.slug) ?? [];
  list.push(l);
  bySlug.set(l.slug, list);
}
const slugDupes = [...bySlug.entries()].filter(([, r]) => r.length > 1);
console.log('count', slugDupes.length);
for (const [s, r] of slugDupes) {
  console.log(`  ${s} ×${r.length} ids=${r.map((x) => x.id).join(',')}`);
}

section('County label vs derived home (post-sanitize remaining)');
let countyMismatch = 0;
for (const l of lenders) {
  const home = deriveLenderHomeLocality(l);
  if (home.countySlug && l.countySlug && home.countySlug !== l.countySlug) {
    countyMismatch++;
    if (countyMismatch <= 20) {
      console.log(
        `  ${l.slug}: labeled ${l.countySlug} vs derived ${home.countySlug} (${home.source}) city=${l.city}`
      );
    }
  }
}
console.log('total mismatches', countyMismatch);

section('Missing critical fields');
console.log({
  missingName: lenders.filter((l) => !l.name?.trim()).length,
  missingCity: lenders.filter((l) => !l.city?.trim()).length,
  missingState: lenders.filter((l) => !l.stateSlug?.trim()).length,
  missingDesc: lenders.filter((l) => !l.shortDescription?.trim()).length,
  missingSlug: lenders.filter((l) => !l.slug?.trim()).length,
});

section('Demo-ish names');
const demoish = lenders.filter((l) =>
  /demo|test lender|example|placeholder|fake|seed company/i.test(`${l.name} ${l.slug}`)
);
console.log(
  demoish.map((l) => l.slug),
  'count',
  demoish.length
);

section('National HMDA lenders — panel resolve');
let hmdaOk = 0;
let cfpbOk = 0;
const hmdaMiss: string[] = [];
const cfpbMiss: string[] = [];
for (const l of NATIONAL_HMDA_LENDERS) {
  if (getHmdaLenderEvidenceBySlug(l.slug)) hmdaOk++;
  else hmdaMiss.push(l.slug);
  if (getCfpbComplaintEvidenceBySlug(l.slug)) cfpbOk++;
  else cfpbMiss.push(l.slug);
}
console.log({
  nationalRows: NATIONAL_HMDA_LENDERS.length,
  hmdaOk,
  cfpbOk,
  hmdaMiss: hmdaMiss.slice(0, 40),
  cfpbMiss: cfpbMiss.slice(0, 40),
});

section('Same name different NMLS (possible confusion)');
const byName = new Map<string, typeof lenders>();
for (const l of lenders) {
  const k = l.name.trim().toLowerCase();
  const list = byName.get(k) ?? [];
  list.push(l);
  byName.set(k, list);
}
const nameMulti = [...byName.entries()]
  .map(([name, rows]) => {
    const nmlsSet = new Set(rows.map((r) => cleanNmlsId(r.nmlsId) || `empty:${r.id}`));
    return { name, rows, nmlsCount: nmlsSet.size };
  })
  .filter((x) => x.nmlsCount > 1)
  .sort((a, b) => b.rows.length - a.rows.length);
console.log('groups', nameMulti.length);
for (const g of nameMulti.slice(0, 15)) {
  console.log(
    `  "${g.name}" nmlsVariants=${g.nmlsCount} rows=${g.rows.length} → ${g.rows
      .map((r) => `${r.slug}#${r.nmlsId || 'none'}`)
      .join(', ')}`
  );
}
