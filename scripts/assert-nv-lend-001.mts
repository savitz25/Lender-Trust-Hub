import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { parseLenderAsk } from '../lib/ask-lender/parse';
import { countSources } from '../lib/ask-lender/scalar-count';
import { decideNativeNameSearch } from '../lib/name-candidates/native';
import { TENNESSEE_SNAPSHOT } from '../lib/tennessee-intelligence/snapshot';
import { NEVADA_INTELLIGENCE_GATE } from '../lib/nevada-intelligence/publication';
import { assertNevadaIntelligence, NV_PUBLIC_FINGERPRINT, NEVADA_SNAPSHOT } from '../lib/nevada-intelligence/snapshot';
import { buildNevadaIntelligenceJsonLd, nvJsonLdHasForbiddenRatings } from '../lib/nevada-intelligence/jsonld';

const s = assertNevadaIntelligence();
const sitemap = readFileSync('app/sitemap.ts', 'utf8');
const robots = readFileSync('app/robots.ts', 'utf8');
const page = readFileSync('app/nevada/page.tsx', 'utf8');
const ui = readFileSync('components/nevada/nevada-state-intelligence.tsx', 'utf8');
const pkg = readFileSync('package.json', 'utf8');
const footer = readFileSync('lib/design/lender-design-system.ts', 'utf8');
const caps = readFileSync('lib/specialist-search/capabilities.ts', 'utf8');
const claim = readFileSync('lib/customer-integration/eligibility.ts', 'utf8');
const gitignore = readFileSync('data/raw/nevada/private/.gitignore', 'utf8');
const derived = readFileSync('data/nevada/nv-lend-001/mld-enforcement-orders.json', 'utf8');
const hmdaRows = readFileSync('data/hmda/by-state/NV/county_market_summary.csv', 'utf8').trim().split(/\r?\n/);
const header = hmdaRows[0].split(',');
const col = (row: string, name: string) => Number(row.split(',')[header.indexOf(name)]);

// Route, index, sitemap, navigation. Statewide only.
assert.equal(NEVADA_INTELLIGENCE_GATE.path, '/nevada');
assert.equal(NEVADA_INTELLIGENCE_GATE.robotsIndex, true);
assert.match(page, /index:\s*true/);
assert.match(page, /canonical/);
assert.equal([...sitemap.matchAll(/'\/nevada'/g)].length, 1);
assert.doesNotMatch(sitemap, /\/nevada\/[a-z-]+/);
assert.doesNotMatch(robots, /\/nevada/);
for (const city of ['las-vegas', 'reno', 'henderson', 'clark-county']) assert.equal(existsSync(`app/nevada/${city}`), false);
assert.match(footer, /Nevada Research/);
assert.match(pkg, /assert:nv-lend-001/);

// Grains stay separate; no roster, no combined total.
assert.deepEqual(
  s.licenses.nmls_classes.map((c) => c.id),
  ['mortgage_company', 'mlo', 'mortgage_servicer', 'supplemental_mortgage_servicer', 'nmls_exempt_registration'],
);
assert.deepEqual(
  s.licenses.srs_classes.map((c) => c.id),
  ['commercial_only_mortgage_company', 'commercial_only_mlo', 'escrow_agency', 'escrow_agent', 'credit_service_organization', 'covered_service_organization', 'covered_service_provider', 'srs_exempt_registration'],
);
assert.ok([...s.licenses.nmls_classes, ...s.licenses.srs_classes].every((c) => c.rows === null && c.roster === 'NOT_ACQUIRED'));
assert.equal(s.licenses.consumerAccessScraped, false);
assert.equal(s.licenses.srsScraped, false);
assert.doesNotMatch(ui, /Nevada has [\d,]+ lenders|best lender|safest lender|vetted lender|Trust Score is/i);
assert.match(ui, /not the\s+Nevada regulator/);
assert.match(ui, /unknown,\s+not zero/);
assert.match(ui, /not\s+consumer mortgage authority/);

// Enforcement: whole index preserved, standalone unless exact NMLS, no person names, proposed != final.
const E = s.enforcement;
assert.equal(E.indexRows, 189);
assert.equal(E.documentsLinked, 188);
assert.equal(E.rowsWithoutDocumentLink, 1);
assert.deepEqual(E.yearsWithPublishedPages, [2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]);
assert.deepEqual(E.documentScopeYears, [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]);
assert.equal(E.rowsInDocumentScope, 72);
assert.equal(Object.values(E.rowsByYear).reduce((a, b) => a + b, 0), 189);
assert.deepEqual(E.licenseCodeCounts, { '645A': 14, '645B': 132, '645E': 7, '645F': 36 });
assert.equal(E.nameOnlyAttachments, 0);
assert.equal(E.ocrPerformed, false);
assert.equal(E.personNamesPublished, false);
assert.equal(s.proposed_consent_orders.count, 0);
assert.equal(s.proposed_consent_orders.proposed_is_not_final, true);
assert.match(gitignore, /^\*$/m);
let attached = 0;
for (const o of E.orders) {
  assert.ok(['COMPANY', 'COMPANY_AND_PERSON', 'PERSON'].includes(o.respondentClass), o.id);
  if (o.respondentClass === 'PERSON') assert.equal(o.respondentAsPublished, null, o.id);
  if (o.respondentClass === 'COMPANY_AND_PERSON') assert.match(o.respondentAsPublished ?? '', /name withheld/, o.id);
  for (const d of o.documents) {
    if (o.respondentClass !== 'COMPANY') assert.equal(d.url, null, `${o.id} document link must be withheld`);
    if (d.url) assert.match(d.url, /^https:\/\/mld\.nv\.gov\//);
  }
  if (o.attachment === 'EXACT_NMLS') {
    attached += 1;
    assert.ok(o.attachedIdentities && o.attachedIdentities.length > 0, o.id);
    for (const a of o.attachedIdentities ?? []) {
      assert.ok(o.companyCredentialsPrinted?.some((c) => c.nmls === a.nmls), `${o.id} attaches only a printed NMLS ID`);
      assert.equal(a.basis, 'EXACT_NMLS_PRINTED_IN_ORDER');
    }
  } else {
    assert.equal(o.attachment, 'STANDALONE', o.id);
    assert.equal(o.attachedIdentities, null, o.id);
  }
  for (const c of o.companyCredentialsPrinted ?? []) {
    // MLD company licenses are 3-4 digits; a 5-digit number is an individual credential and stays withheld.
    if (c.nevadaLicenseNumber) assert.ok(c.nevadaLicenseNumber.length <= 4, `${o.id} individual credential leaked`);
  }
}
assert.equal(attached, E.exactNmlsAttachments);
// Names withheld from committed data are checked against the local (gitignored) review file when present.
const reviewPath = 'data/raw/nevada/private/review.json';
if (existsSync(reviewPath)) {
  const review: Array<{ id: string; parties: Array<[string, string]> }> = JSON.parse(readFileSync(reviewPath, 'utf8'));
  const published = new Set((derived.match(/[A-Za-z]+/g) ?? []).map((t) => t.toLowerCase()));
  const companyWords = new Set(
    E.orders.flatMap((o) => (o.respondentAsPublished ?? '').match(/[A-Za-z]+/g) ?? []).map((t) => t.toLowerCase()),
  );
  for (const r of review) {
    for (const [party, kind] of r.parties) {
      if (kind !== 'person') continue;
      const surname = party.split(/\s+(?:dba|d\/b\/a|aka|a\/k\/a)\s+/i)[0].split(/\s+/).pop()?.replace(/[.,'"]/g, '') ?? '';
      if (surname.length > 3 && !companyWords.has(surname.toLowerCase())) {
        assert.equal(published.has(surname.toLowerCase()), false, `withheld respondent leaked from ${r.id}`);
      }
    }
  }
}

// HMDA reused, not a license census; production-audit summary is scoped.
const apps = hmdaRows.slice(1).reduce((n, r) => n + col(r, 'total_applications'), 0);
assert.equal(s.hmda.applications, apps);
assert.equal(s.hmda.applications, 119768);
assert.equal(s.hmda.originations, 69135);
assert.equal(s.hmda.denials, 20655);
assert.equal(s.hmda.county_count, hmdaRows.length - 1);
assert.equal(s.hmda.lei_nmls_bridge.startsWith('REUSED_EXISTING_CURATED_MAP_ONLY'), true);
assert.equal(s.existing_coverage_audit.distinctNmls, 112);
assert.equal(s.complaints.capability, 'NOT_ACQUIRED');
assert.equal(s.complaints.outcomes, 'REQUEST_ONLY');
assert.equal(s.expansion_ledger.NET_NEW_CANONICAL_ORGANIZATIONS, 0);
assert.equal(s.expansion_ledger.GRAPH_WRITES, 0);
assert.doesNotMatch(claim, /nevada-intelligence|\bMLD\b/);
assert.match(caps, /nevada-roster/);
assert.match(caps, /nevada-enforcement/);

// Specialist search keeps every grain; exact NMLS still wins.
const ask = (q: string) => parseLenderAsk(q);
const kind = (q: string) => ask(q).failClosedKind;
assert.equal(kind('mortgage broker Nevada'), 'nv-broker-license');
assert.equal(kind('mortgage servicer Nevada'), 'nv-servicer-license');
assert.equal(kind('licensed mortgage company Nevada'), 'nv-mld-licensing');
assert.equal(kind('mortgage company Nevada'), 'nv-mld-licensing');
assert.equal(kind('how many lenders in Nevada'), 'nv-mld-licensing');
assert.equal(kind('mortgage loan originator Nevada'), 'nv-mlo-person-grain');
assert.equal(kind('MLO Nevada'), 'nv-mlo-person-grain');
assert.equal(kind('commercial mortgage company Nevada'), 'nv-commercial-only');
assert.equal(kind('commercial only mortgage loan originator Nevada'), 'nv-commercial-only');
assert.equal(kind('escrow agency Nevada'), 'nv-escrow');
assert.equal(kind('escrow agent Nevada'), 'nv-escrow');
for (const q of ['mortgage lender Las Vegas', 'mortgage broker Reno', 'mortgage lender Henderson Nevada', 'mortgage company Las Vegas Nevada']) {
  assert.equal(kind(q), 'nv-city-context', q);
}
for (const q of ['Nevada mortgage enforcement', 'MLD mortgage order', 'mortgage company discipline Nevada', 'Nevada mortgage consent order']) {
  assert.equal(kind(q), 'nv-mld-enforcement', q);
  assert.match(ask(q).failReason ?? '', /189 rows/);
  assert.match(ask(q).failReason ?? '', /proposed consent orders/);
}
assert.equal(ask('Nevada mortgage complaints').coverageState, 'REQUEST_ONLY');
assert.equal(ask('NMLS 2119 Nevada').mode, 'entity');
assert.equal(ask('NMLS 2119 Nevada').identifier?.value, '2119');
assert.equal(ask('NMLS 192103').mode, 'entity');
for (const q of ['Nevada mortgage applications', 'mortgage originations Nevada', 'mortgage denials Nevada']) {
  assert.equal(ask(q).mode, 'count', q);
}
assert.equal(kind('Nevada mortgage denial rate'), 'nv-hmda-denials');
assert.equal(ask('mortgage lender Nevada').mode, 'entity');
assert.equal(kind('best mortgage lender Nevada'), 'ranking');
assert.doesNotMatch(ask('how many lenders in Nevada').failReason ?? '', /\d{3,}/);
for (const q of ['Nevada mortgage enforcement', 'mortgage servicer Nevada', 'licensed mortgage company Nevada']) {
  assert.doesNotMatch(ask(q).failReason ?? '', /\b\d[\d,]* (?:Nevada )?lenders\b/i, `${q} must not state a lender total`);
}

// Ask answers HMDA from the same snapshot as the page (no second denominator); cities stay geography.
for (const [state, snap] of [['NV', s], ['TN', TENNESSEE_SNAPSHOT]] as const) {
  const published = countSources.publishedStateHmda(state);
  assert.ok(published, `${state} published HMDA seam`);
  assert.equal(published!.applications, snap.hmda.applications);
  assert.equal(published!.denials, snap.hmda.denials);
}
for (const q of ['mortgage lender Las Vegas', 'mortgage broker Reno', 'mortgage lender Henderson Nevada']) {
  assert.equal(decideNativeNameSearch(q, parseLenderAsk(q)), null, `${q} must not become a name search`);
}

// Earlier states still route as before.
assert.equal(kind('how many lenders in Tennessee'), 'tn-tdfi-licensing');
assert.equal(kind('mortgage lender Nashville'), 'tn-city-context');
assert.equal(kind('how many lenders in Massachusetts'), 'ma-dob-lender-file');
assert.equal(kind('how many lenders in Georgia'), 'ga-no-combined-lenders');
assert.equal(kind('mortgage lender Henderson'), undefined);

const jsonld = buildNevadaIntelligenceJsonLd(s);
assert.equal(nvJsonLdHasForbiddenRatings(jsonld), false);
assert.equal(s.fingerprint, NV_PUBLIC_FINGERPRINT);
assert.equal(NEVADA_SNAPSHOT.path, '/nevada');
console.log('NV-LEND-001 publication assert: PASS');
