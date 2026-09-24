import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { parseLenderAsk } from '../lib/ask-lender/parse';
import { countSources } from '../lib/ask-lender/scalar-count';
import { decideNativeNameSearch } from '../lib/name-candidates/native';
import { MASSACHUSETTS_SNAPSHOT } from '../lib/massachusetts-intelligence/snapshot';
import { TENNESSEE_INTELLIGENCE_GATE } from '../lib/tennessee-intelligence/publication';
import { assertTennesseeIntelligence, TN_PUBLIC_FINGERPRINT, TENNESSEE_SNAPSHOT } from '../lib/tennessee-intelligence/snapshot';
import { buildTennesseeIntelligenceJsonLd, tnJsonLdHasForbiddenRatings } from '../lib/tennessee-intelligence/jsonld';

const s = assertTennesseeIntelligence();
const sitemap = readFileSync('app/sitemap.ts', 'utf8');
const robots = readFileSync('app/robots.ts', 'utf8');
const page = readFileSync('app/tennessee/page.tsx', 'utf8');
const ui = readFileSync('components/tennessee/tennessee-state-intelligence.tsx', 'utf8');
const pkg = readFileSync('package.json', 'utf8');
const footer = readFileSync('lib/design/lender-design-system.ts', 'utf8');
const caps = readFileSync('lib/specialist-search/capabilities.ts', 'utf8');
const claim = readFileSync('lib/customer-integration/eligibility.ts', 'utf8');
const gitignore = readFileSync('data/raw/tennessee/private/.gitignore', 'utf8');
const derived = readFileSync('data/tennessee/tn-lend-001/tdfi-enforcement-orders.json', 'utf8');
const hmdaRows = readFileSync('data/hmda/by-state/TN/county_market_summary.csv', 'utf8').trim().split(/\r?\n/);
const header = hmdaRows[0].split(',');
const col = (row: string, name: string) => Number(row.split(',')[header.indexOf(name)]);

// Route, index, sitemap, navigation. Statewide only.
assert.equal(TENNESSEE_INTELLIGENCE_GATE.path, '/tennessee');
assert.equal(TENNESSEE_INTELLIGENCE_GATE.robotsIndex, true);
assert.match(page, /index:\s*true/);
assert.match(page, /canonical/);
assert.equal([...sitemap.matchAll(/'\/tennessee'/g)].length, 1);
assert.doesNotMatch(sitemap, /\/tennessee\/[a-z-]+/);
assert.doesNotMatch(robots, /\/tennessee/);
for (const city of ['nashville', 'memphis', 'knoxville', 'chattanooga']) assert.equal(existsSync(`app/tennessee/${city}`), false);
assert.match(footer, /Tennessee Research/);
assert.match(pkg, /assert:tn-lend-001/);

// Grains stay separate; no roster, no combined total.
assert.deepEqual(
  s.licenses.classes.map((c) => c.id),
  ['lender', 'broker', 'servicer', 'mlo', 'branch'],
);
assert.ok(s.licenses.classes.every((c) => c.rows === null && c.roster === 'NOT_ACQUIRED'));
assert.equal(s.licenses.consumerAccessScraped, false);
assert.doesNotMatch(ui, /Tennessee has [\d,]+ lenders|best lender|safest lender|vetted lender|Trust Score is/i);
assert.match(ui, /not the Tennessee regulator/);
assert.match(ui, /unknown, not zero/);

// Enforcement: standalone, source wording, no person names, unknown years stay unknown.
const E = s.enforcement;
assert.equal(E.ordersListed, 10);
assert.equal(E.mortgageRelatedOrders, 1);
assert.equal(E.exactNmlsAttachments, 0);
assert.deepEqual(E.yearsListedWithoutPages, [2026, 2025, 2024]);
const atlas = E.orders.find((o) => o.licenseClass === 'MORTGAGE_LENDER');
assert.ok(atlas);
assert.equal(atlas!.tennesseeLicenseNumber, '112542');
assert.equal(atlas!.initialOrderLanguage, true);
assert.equal(atlas!.attachment, 'STANDALONE');
assert.equal(atlas!.nmlsPrinted, null);
assert.match(gitignore, /^\*$/m);
for (const o of E.orders) {
  if (o.respondentClass !== 'COMPANY') {
    assert.equal(o.respondent, null);
    assert.equal(o.titleAsPublished, null);
  }
}
// Names withheld from committed data are checked against the local (gitignored) manifest when present.
const manifestPath = 'data/raw/tennessee/private/orders-manifest.json';
if (existsSync(manifestPath)) {
  const titles: Array<{ title: string }> = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const withheld = E.orders.filter((o) => o.respondentClass !== 'COMPANY').map((o) => titles[Number(o.id.split(':')[2]) - 1]?.title ?? '');
  for (const title of withheld) {
    const surname = title.replace(/^.*?[-–]\s*/, '').split(/[ ,]/).filter(Boolean).pop() ?? '';
    if (surname.length > 3) assert.equal((derived + JSON.stringify(s)).includes(surname), false, 'withheld respondent leaked');
  }
}

// HMDA reused, not a license census.
const apps = hmdaRows.slice(1).reduce((n, r) => n + col(r, 'total_applications'), 0);
assert.equal(s.hmda.applications, apps);
assert.equal(s.hmda.county_count, hmdaRows.length - 1);
assert.equal(s.complaints.capability, 'REQUEST_ONLY');
assert.equal(s.expansion_ledger.NET_NEW_CANONICAL_ORGANIZATIONS, 0);
assert.doesNotMatch(claim, /tennessee-intelligence|TDFI/);
assert.match(caps, /tennessee-roster/);
assert.match(caps, /tennessee-enforcement/);

// Specialist search keeps every grain; exact NMLS still wins.
const ask = (q: string) => parseLenderAsk(q);
const kind = (q: string) => ask(q).failClosedKind;
assert.equal(kind('mortgage broker Tennessee'), 'tn-broker-license');
assert.equal(kind('mortgage servicer Tennessee'), 'tn-servicer-license');
assert.equal(kind('licensed mortgage company Tennessee'), 'tn-tdfi-licensing');
assert.equal(kind('how many lenders in Tennessee'), 'tn-tdfi-licensing');
assert.equal(kind('mortgage loan originator Tennessee'), 'tn-mlo-person-grain');
for (const q of ['mortgage lender Nashville', 'mortgage broker Memphis', 'mortgage lender Knoxville', 'lender Chattanooga Tennessee']) {
  assert.equal(kind(q), 'tn-city-context', q);
}
for (const q of ['Tennessee mortgage enforcement', 'TDFI mortgage order', 'Tennessee mortgage lender discipline']) {
  assert.equal(kind(q), 'tn-tdfi-enforcement', q);
  assert.match(ask(q).failReason ?? '', /112542/);
  assert.match(ask(q).failReason ?? '', new RegExp(`links ${E.ordersListed} order documents`));
}
assert.equal(ask('Tennessee mortgage complaints').coverageState, 'REQUEST_ONLY');
assert.equal(ask('NMLS 3030 Tennessee').mode, 'entity');
assert.equal(ask('NMLS 3030 Tennessee').identifier?.value, '3030');
for (const q of ['Tennessee mortgage applications', 'mortgage originations Tennessee', 'mortgage denials Tennessee']) {
  assert.equal(ask(q).mode, 'count', q);
}
assert.equal(ask('mortgage lender Tennessee').mode, 'entity');
assert.equal(kind('best mortgage lender Tennessee'), 'ranking');
assert.doesNotMatch(ask('how many lenders in Tennessee').failReason ?? '', /\d{3,}/);

// Ask answers HMDA from the same snapshot as the page (no second denominator); cities stay geography.
for (const [state, snap] of [['TN', s], ['MA', MASSACHUSETTS_SNAPSHOT]] as const) {
  const published = countSources.publishedStateHmda(state);
  assert.ok(published, `${state} published HMDA seam`);
  assert.equal(published!.applications, snap.hmda.applications);
  assert.equal(published!.denials, snap.hmda.denials);
}
for (const q of ['mortgage lender Knoxville', 'mortgage lender Nashville', 'mortgage broker Memphis']) {
  assert.equal(decideNativeNameSearch(q, parseLenderAsk(q)), null, `${q} must not become a name search`);
}

// Earlier states still route as before.
assert.equal(kind('how many lenders in Massachusetts'), 'ma-dob-lender-file');
assert.equal(kind('how many lenders in Georgia'), 'ga-no-combined-lenders');

const jsonld = buildTennesseeIntelligenceJsonLd(s);
assert.equal(tnJsonLdHasForbiddenRatings(jsonld), false);
assert.equal(s.fingerprint, TN_PUBLIC_FINGERPRINT);
assert.equal(TENNESSEE_SNAPSHOT.path, '/tennessee');
console.log('TN-LEND-001 publication assert: PASS');
