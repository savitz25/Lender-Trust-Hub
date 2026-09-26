import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { parseLenderAsk } from '../lib/ask-lender/parse';
import { countSources } from '../lib/ask-lender/scalar-count';
import { decideNativeNameSearch } from '../lib/name-candidates/native';
import { NEVADA_SNAPSHOT } from '../lib/nevada-intelligence/snapshot';
import { TENNESSEE_SNAPSHOT } from '../lib/tennessee-intelligence/snapshot';
import { MINNESOTA_INTELLIGENCE_GATE } from '../lib/minnesota-intelligence/publication';
import { assertMinnesotaIntelligence, MN_PUBLIC_FINGERPRINT, MINNESOTA_SNAPSHOT } from '../lib/minnesota-intelligence/snapshot';
import { buildMinnesotaIntelligenceJsonLd, mnJsonLdHasForbiddenRatings } from '../lib/minnesota-intelligence/jsonld';

const s = assertMinnesotaIntelligence();
const sitemap = readFileSync('app/sitemap.ts', 'utf8');
const robots = readFileSync('app/robots.ts', 'utf8');
const page = readFileSync('app/minnesota/page.tsx', 'utf8');
const ui = readFileSync('components/minnesota/minnesota-state-intelligence.tsx', 'utf8');
const pkg = readFileSync('package.json', 'utf8');
const footer = readFileSync('lib/design/lender-design-system.ts', 'utf8');
const caps = readFileSync('lib/specialist-search/capabilities.ts', 'utf8');
const claim = readFileSync('lib/customer-integration/eligibility.ts', 'utf8');
const gitignore = readFileSync('data/raw/minnesota/private/.gitignore', 'utf8');
const derived = readFileSync('data/minnesota/mn-lend-001/commerce-enforcement-actions.json', 'utf8');
const accepted = readFileSync('lib/minnesota-intelligence/accepted-snapshot.json', 'utf8');
const hmdaRows = readFileSync('data/hmda/by-state/MN/county_market_summary.csv', 'utf8').trim().split(/\r?\n/);
const header = hmdaRows[0].split(',');
const col = (row: string, name: string) => Number(row.split(',')[header.indexOf(name)]);

// Route, index, sitemap, navigation. Statewide only.
assert.equal(MINNESOTA_INTELLIGENCE_GATE.path, '/minnesota');
assert.equal(MINNESOTA_INTELLIGENCE_GATE.robotsIndex, true);
assert.match(page, /index:\s*true/);
assert.match(page, /canonical/);
assert.equal([...sitemap.matchAll(/'\/minnesota'/g)].length, 1);
assert.doesNotMatch(sitemap, /\/minnesota\/[a-z-]+/);
assert.doesNotMatch(robots, /\/minnesota/);
for (const city of ['minneapolis', 'st-paul', 'saint-paul', 'rochester', 'duluth', 'hennepin-county']) assert.equal(existsSync(`app/minnesota/${city}`), false);
assert.match(footer, /Minnesota Research/);
assert.match(pkg, /assert:mn-lend-001/);

// Grains stay separate; no roster, no combined total. Commerce is the regulator, NMLS the system.
assert.deepEqual(
  s.licenses.classes.map((c) => c.id),
  ['residential_mortgage_originator', 'residential_mortgage_servicer', 'mortgage_loan_originator', 'branch', 'exempt_certificate'],
);
assert.ok(s.licenses.classes.every((c) => c.rows === null && c.roster === 'NOT_ACQUIRED'));
assert.equal(s.licenses.consumerAccessScraped, false);
assert.equal(s.regulators.state, 'Minnesota Department of Commerce');
assert.match(s.regulators.infrastructure, /not the regulator/);
assert.doesNotMatch(ui, /Minnesota has [\d,]+ lenders|best lender|safest lender|vetted lender|Trust Score is/i);
assert.match(ui, /not the Minnesota regulator/);
assert.match(ui, /Unknown,\s+not zero/i);
assert.match(ui, /banks and credit unions/i);

// Enforcement: whole CARDS Mortgage result, standalone unless exact NMLS, no person detail.
const E = s.enforcement;
assert.equal(E.rows, 50);
assert.deepEqual(E.rowsByYear, { 2022: 14, 2023: 4, 2024: 11, 2025: 13, 2026: 8 });
assert.equal(E.companyRows, 37);
assert.equal(E.personRows, 13);
assert.equal(E.companyOrdersRead + E.companyOrdersNotRead429, E.companyRows);
assert.equal(E.nameOnlyAttachments, 0);
assert.equal(E.ocrPerformed, false);
assert.equal(E.personNamesPublished, false);
assert.equal(E.industry_filter_is_commerce_classification, true);
assert.match(E.query, /industry=Mortgage&signedFromDate=2022-01-01/);
assert.match(gitignore, /^\*$/m);
let attached = 0;
for (const o of E.orders) {
  assert.ok(['COMPANY', 'PERSON'].includes(o.respondentClass), o.id);
  assert.equal(o.industryAsPublished, 'Mortgage', o.id);
  assert.ok(o.signedDate >= '2022-01-01' && o.signedDate <= '2026-09-26', o.id);
  if (o.respondentClass === 'PERSON') {
    assert.equal(o.respondentAsPublished, null, o.id);
    assert.equal(o.documentUrl, null, o.id);
    assert.equal(o.allegationAsPublished, null, o.id);
    assert.equal(o.attachment, 'STANDALONE', o.id);
  }
  if (o.documentUrl) assert.match(o.documentUrl, /^https:\/\/cards\.web\.commerce\.state\.mn\.us\/documents\//);
  if (o.attachment === 'EXACT_NMLS') {
    attached += 1;
    assert.ok(o.attachedIdentity, o.id);
    assert.equal(o.attachedIdentity!.nmls, o.orderText.nmlsPrintedForRespondent, `${o.id} attaches only the printed NMLS ID`);
    assert.equal(o.attachedIdentity!.basis, 'EXACT_NMLS_PRINTED_IN_ORDER');
    assert.equal(o.orderText.documentRead, true, o.id);
  } else {
    assert.equal(o.attachment, 'STANDALONE', o.id);
    assert.equal(o.attachedIdentity, null, o.id);
  }
}
assert.equal(attached, E.exactNmlsAttachments);
assert.equal(attached, 5);
// Individual respondents named in the local (gitignored) CARDS capture never reach committed data.
const rowsPath = 'data/raw/minnesota/private/cards-mortgage-rows.json';
if (existsSync(rowsPath)) {
  const raw: Array<{ document: string; respondent: string }> = JSON.parse(readFileSync(rowsPath, 'utf8'));
  const people = new Set(E.orders.filter((o) => o.respondentClass === 'PERSON').map((o) => o.document));
  // Company words and HMDA county names (e.g. Wright County) are not respondent names.
  const companyWords = new Set(
    [...E.orders.flatMap((o) => (o.respondentAsPublished ?? '').match(/[A-Za-z]+/g) ?? []), ...s.hmda.top_counties.flatMap((c) => c.county_name.match(/[A-Za-z]+/g) ?? [])].map((t) => t.toLowerCase()),
  );
  const published = new Set([...(derived.match(/[A-Za-z]+/g) ?? []), ...(accepted.match(/[A-Za-z]+/g) ?? [])].map((t) => t.toLowerCase()));
  let checked = 0;
  for (const r of raw) {
    if (!people.has(r.document)) continue;
    for (const word of r.respondent.split(/[\s,]+/)) {
      const w = word.replace(/[^A-Za-z]/g, '').toLowerCase();
      if (w.length > 3 && !companyWords.has(w)) {
        checked += 1;
        assert.equal(published.has(w), false, `withheld respondent leaked from ${r.document}`);
      }
    }
  }
  assert.ok(checked > 0);
}

// HMDA reused, not a license census; production-audit summary is scoped.
const apps = hmdaRows.slice(1).reduce((n, r) => n + col(r, 'total_applications'), 0);
assert.equal(s.hmda.applications, apps);
assert.equal(s.hmda.applications, 184549);
assert.equal(s.hmda.originations, 122478);
assert.equal(s.hmda.denials, 24801);
assert.equal(s.hmda.county_count, hmdaRows.length - 1);
assert.equal(s.hmda.county_count, 87);
assert.ok(s.hmda.top_counties.every((c) => c.county_name.length > 0));
assert.equal(s.hmda.lei_nmls_bridge.startsWith('REUSED_EXISTING_CURATED_MAP_ONLY'), true);
assert.equal(s.existing_coverage_audit.distinctNmls, 101);
assert.equal(s.complaints.intake, 'KNOWN');
assert.equal(s.complaints.capability, 'NOT_ACQUIRED');
assert.equal(s.complaints.outcomes, 'REQUEST_ONLY');
assert.equal(s.complaints.providerLevelRows, null);
assert.equal(s.expansion_ledger.NET_NEW_CANONICAL_ORGANIZATIONS, 0);
assert.equal(s.expansion_ledger.NET_NEW_PUBLIC_PERSON_PAGES, 0);
assert.equal(s.expansion_ledger.GRAPH_WRITES, 0);
assert.doesNotMatch(claim, /minnesota-intelligence/);
assert.match(caps, /minnesota-roster/);
assert.match(caps, /minnesota-enforcement/);

// Specialist search keeps every grain; exact NMLS still wins; bare numbers fail closed.
const ask = (q: string) => parseLenderAsk(q);
const kind = (q: string) => ask(q).failClosedKind;
assert.equal(kind('mortgage servicer Minnesota'), 'mn-servicer-license');
assert.equal(kind('residential mortgage servicer license Minnesota'), 'mn-servicer-license');
assert.equal(kind('licensed mortgage company Minnesota'), 'mn-commerce-licensing');
assert.equal(kind('mortgage company Minnesota'), 'mn-commerce-licensing');
assert.equal(kind('residential mortgage originator Minnesota'), 'mn-commerce-licensing');
assert.equal(kind('mortgage broker Minnesota'), 'mn-commerce-licensing');
assert.equal(kind('how many lenders in Minnesota'), 'mn-commerce-licensing');
assert.equal(kind('mortgage loan originator Minnesota'), 'mn-mlo-person-grain');
assert.equal(kind('MLO Minnesota'), 'mn-mlo-person-grain');
for (const q of ['mortgage lender Minneapolis', 'mortgage lender St Paul', 'mortgage lender Saint Paul Minnesota', 'mortgage lender Rochester Minnesota', 'mortgage broker Duluth', 'mortgage company Minneapolis Minnesota']) {
  assert.equal(kind(q), 'mn-city-context', q);
}
for (const q of ['Minnesota mortgage enforcement', 'mortgage company discipline Minnesota', 'Minnesota mortgage consent order', 'Minnesota Department of Commerce mortgage penalty']) {
  assert.equal(kind(q), 'mn-commerce-enforcement', q);
  assert.match(ask(q).failReason ?? '', /50 actions/);
  assert.match(ask(q).failReason ?? '', /not named/);
}
assert.equal(kind('Minnesota mortgage complaints'), 'mn-commerce-complaints');
assert.equal(ask('Minnesota mortgage complaints').coverageState, 'REQUEST_ONLY');
assert.equal(ask('NMLS 2229 Minnesota').mode, 'entity');
assert.equal(ask('NMLS 2229 Minnesota').identifier?.value, '2229');
assert.equal(ask('NMLS 2229').mode, 'entity');
assert.notEqual(ask('2229 Minnesota').mode, 'entity');
assert.notEqual(ask('2229').mode, 'entity');
for (const q of ['Minnesota mortgage applications', 'mortgage originations Minnesota', 'mortgage denials Minnesota']) {
  assert.equal(ask(q).mode, 'count', q);
}
assert.equal(kind('Minnesota mortgage denial rate'), 'mn-hmda-denials');
assert.equal(ask('mortgage lender Minnesota').mode, 'entity');
assert.equal(kind('best mortgage lender Minnesota'), 'ranking');
assert.doesNotMatch(ask('how many lenders in Minnesota').failReason ?? '', /\d{3,}/);
for (const q of ['Minnesota mortgage enforcement', 'mortgage servicer Minnesota', 'licensed mortgage company Minnesota']) {
  assert.doesNotMatch(ask(q).failReason ?? '', /\b\d[\d,]* (?:Minnesota )?lenders\b/i, `${q} must not state a lender total`);
}

// Ask answers HMDA from the same snapshot as the page (no second denominator); cities stay geography.
for (const [state, snap] of [['MN', s], ['NV', NEVADA_SNAPSHOT], ['TN', TENNESSEE_SNAPSHOT]] as const) {
  const published = countSources.publishedStateHmda(state);
  assert.ok(published, `${state} published HMDA seam`);
  assert.equal(published!.applications, snap.hmda.applications);
  assert.equal(published!.denials, snap.hmda.denials);
}
for (const q of ['mortgage lender Minneapolis', 'mortgage lender St Paul', 'mortgage broker Duluth', 'mortgage lender Rochester Minnesota']) {
  assert.equal(decideNativeNameSearch(q, parseLenderAsk(q)), null, `${q} must not become a name search`);
}

// Earlier states still route as before.
assert.equal(kind('how many lenders in Nevada'), 'nv-mld-licensing');
assert.equal(kind('mortgage lender Las Vegas'), 'nv-city-context');
assert.equal(kind('how many lenders in Tennessee'), 'tn-tdfi-licensing');
assert.equal(kind('mortgage lender Nashville'), 'tn-city-context');
assert.equal(kind('how many lenders in Massachusetts'), 'ma-dob-lender-file');
assert.equal(kind('mortgage lender Rochester'), undefined);

const jsonld = buildMinnesotaIntelligenceJsonLd(s);
assert.equal(mnJsonLdHasForbiddenRatings(jsonld), false);
assert.equal(s.fingerprint, MN_PUBLIC_FINGERPRINT);
assert.equal(MINNESOTA_SNAPSHOT.path, '/minnesota');
console.log('MN-LEND-001 publication assert: PASS');
