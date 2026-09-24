import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { parseLenderAsk } from '../lib/ask-lender/parse';
import { MASSACHUSETTS_INTELLIGENCE_GATE } from '../lib/massachusetts-intelligence/publication';
import {
  assertMassachusettsIntelligence,
  MA_PUBLIC_FINGERPRINT,
  MASSACHUSETTS_SNAPSHOT,
} from '../lib/massachusetts-intelligence/snapshot';
import { buildMassachusettsIntelligenceJsonLd, maJsonLdHasForbiddenRatings } from '../lib/massachusetts-intelligence/jsonld';
import { lookupMaDob, MA_DOB_COMPANIES } from '../lib/massachusetts-intelligence/lookup';

const s = assertMassachusettsIntelligence();
const sitemap = readFileSync('app/sitemap.ts', 'utf8');
const robots = readFileSync('app/robots.ts', 'utf8');
const page = readFileSync('app/massachusetts/page.tsx', 'utf8');
const ui = readFileSync('components/massachusetts/massachusetts-state-intelligence.tsx', 'utf8');
const pkg = readFileSync('package.json', 'utf8');
const footer = readFileSync('lib/design/lender-design-system.ts', 'utf8');
const caps = readFileSync('lib/specialist-search/capabilities.ts', 'utf8');
const claim = readFileSync('lib/customer-integration/eligibility.ts', 'utf8');
const gitignore = readFileSync('data/raw/massachusetts/private/.gitignore', 'utf8');
const events = JSON.parse(readFileSync('data/massachusetts/ma-lend-001/dob-enforcement-events.json', 'utf8'));
const mlo = JSON.parse(readFileSync('data/massachusetts/ma-lend-001/dob-mlo-population.json', 'utf8'));
const hmdaRows = readFileSync('data/hmda/by-state/MA/county_market_summary.csv', 'utf8').trim().split(/\r?\n/);
const header = hmdaRows[0].split(',');
const col = (row: string, name: string) => Number(row.split(',')[header.indexOf(name)]);

// Route, index, sitemap, navigation. Statewide only.
assert.equal(MASSACHUSETTS_INTELLIGENCE_GATE.path, '/massachusetts');
assert.equal(MASSACHUSETTS_INTELLIGENCE_GATE.robotsIndex, true);
assert.match(page, /index:\s*true/);
assert.match(page, /canonical/);
assert.match(sitemap, /'\/massachusetts'/);
assert.doesNotMatch(sitemap, /\/massachusetts\/[a-z-]+/);
assert.doesNotMatch(robots, /\/massachusetts/);
assert.equal(existsSync('app/massachusetts/boston'), false);
assert.equal(existsSync('app/massachusetts/worcester'), false);
assert.match(footer, /Massachusetts Research/);
assert.match(pkg, /assert:ma-lend-001/);

// Grains: lender != broker, company != MLO, branch != company, no combined total.
const L = s.licenses;
assert.equal(L.source_as_of, '2026-06-30');
assert.notEqual(L.retrieved_at.slice(0, 10), L.source_as_of);
assert.equal(
  L.lender.distinct_company_nmls_ids + L.broker.distinct_company_nmls_ids - L.cross_file.companies_holding_lender_and_broker,
  L.cross_file.distinct_company_nmls_ids_any_file,
);
assert.equal(L.lender.company_license_rows + L.lender.branch_license_rows + L.lender.trade_name_rows, L.lender.total_rows);
assert.equal(L.broker.company_license_rows + L.broker.branch_license_rows + L.broker.trade_name_rows, L.broker.total_rows);
assert.equal(L.cross_file.company_nmls_ids_also_on_mlo_file, 0);
assert.equal(MA_DOB_COMPANIES.length, 559);
assert.equal(MA_DOB_COMPANIES.filter((c) => c.lender).length, 298);
assert.equal(MA_DOB_COMPANIES.filter((c) => c.broker).length, 453);
assert.equal(new Set(MA_DOB_COMPANIES.map((c) => c.n)).size, 559, 'one canonical company per NMLS ID');
const combined = String(L.lender.distinct_company_nmls_ids + L.broker.distinct_company_nmls_ids + L.mlo.distinct_person_nmls_ids);
assert.doesNotMatch(JSON.stringify(s) + ui, new RegExp(`\\b${combined}\\b`));
assert.doesNotMatch(ui, /Massachusetts has [\d,]+ lenders|best lender|safest lender|vetted lender|Trust Score is/i);
assert.match(ui, /must not be added/);
assert.match(ui, /not a federal-only list/);

// Person grain is not published.
assert.equal(mlo.source_file_committed, false);
assert.equal('_person_nmls_set' in mlo, false);
assert.match(gitignore, /^\*$/m);
for (const e of events.events) {
  for (const p of e.parties) {
    if (p.respondent_class === 'PERSON') {
      assert.equal(p.name_as_published, null);
      assert.equal(p.nmls_printed, null);
    }
  }
  if (e.respondent_text_withheld) assert.equal(e.respondent_text_as_published, null);
}
assert.equal(lookupMaDob('MLO 1000001').kind, 'person_grain');

// Exact identifier lookup; never by name.
const byNmls = lookupMaDob('3029');
assert.equal(byNmls.kind, 'company');
if (byNmls.kind === 'company') assert.deepEqual(byNmls.company.holds, ['broker', 'lender']);
assert.equal(lookupMaDob('mc 3029').kind, 'company');
assert.equal(lookupMaDob('NMLS 3029').kind, 'company');
assert.equal(lookupMaDob('CrossCountry Mortgage').kind, 'invalid');
assert.equal(lookupMaDob('99999999').kind, 'not_on_file');

// Enforcement: exact printed NMLS only; statuses preserved.
const E = s.enforcement;
assert.equal(E.mortgage_related_events, 33);
assert.equal(E.name_only_attachments, 0);
assert.equal(E.exact_company_nmls_attachments, 16);
assert.ok(E.events.every((e) => e.action_date >= '2021-01-01' && e.action_date <= '2026-09-24'));
const temp = E.events.filter((e) => e.action_families.includes('TEMPORARY_ORDER_TO_CEASE_AND_DESIST'));
assert.equal(temp.length, 2);
assert.ok(temp.every((e) => e.status_semantics.temporary_order && /supersed/i.test(e.related_raw)));
const homespire = E.events.find((e) => e.parties.some((p) => p.name_as_published === 'Homespire Mortgage Corporation'));
assert.ok(homespire && homespire.parties.every((p) => p.attached_identity === null), 'ambiguous multi-party NMLS is not attached');
assert.ok(E.events.every((e) => /Not a TrustHub finding/.test(e.legal_semantics)));

// HMDA reused, not a license census.
const apps = hmdaRows.slice(1).reduce((n, r) => n + col(r, 'total_applications'), 0);
assert.equal(s.hmda.applications, apps);
assert.notEqual(s.hmda.distinct_leis, L.cross_file.distinct_company_nmls_ids_any_file);

// Ledger and claim eligibility.
assert.equal(s.expansion_ledger.NET_NEW_CANONICAL_ORGANIZATIONS, 0);
assert.equal(s.expansion_ledger.NET_NEW_PUBLIC_PERSON_PAGES, 0);
assert.doesNotMatch(claim, /massachusetts-intelligence|MA-DOB/);
assert.match(caps, /massachusetts-roster/);
assert.match(caps, /massachusetts-enforcement/);

// Specialist search keeps every denominator.
const ask = (q: string) => parseLenderAsk(q);
assert.equal(ask('how many lenders in Massachusetts').failClosedKind, 'ma-dob-lender-file');
assert.equal(ask('licensed mortgage broker Massachusetts').failClosedKind, 'ma-dob-broker-file');
assert.equal(ask('mortgage loan originators Massachusetts').failClosedKind, 'ma-dob-mlo-person-grain');
assert.equal(ask('MLO Massachusetts').failClosedKind, 'ma-dob-mlo-person-grain');
assert.equal(ask('mortgage lender Boston').failClosedKind, 'ma-city-filter');
assert.equal(ask('lender Springfield Massachusetts').failClosedKind, 'ma-city-filter');
assert.equal(ask('MLO enforcement Massachusetts').failClosedKind, 'ma-dob-enforcement');
assert.equal(ask('mortgage broker consent order Massachusetts').failClosedKind, 'ma-dob-enforcement');
assert.equal(ask('Massachusetts DOB complaints').coverageState, 'REQUEST_ONLY');
assert.equal(ask('Massachusetts mortgage license number MC3029').failClosedKind, 'ma-dob-license-identity');
assert.equal(ask('denial rates Massachusetts').failClosedKind, 'ma-hmda-denials');
assert.equal(ask('Massachusetts mortgage applications').mode, 'count');
assert.equal(ask('best mortgage lender Massachusetts').failClosedKind, 'ranking');
assert.equal(ask('NMLS 3029').mode, 'entity');
for (const [q, n] of [
  ['how many lenders in Massachusetts', L.lender.distinct_company_nmls_ids],
  ['licensed mortgage broker Massachusetts', L.broker.distinct_company_nmls_ids],
  ['MLO Massachusetts', L.mlo.distinct_person_nmls_ids],
  ['Massachusetts mortgage enforcement', E.mortgage_related_events],
  ['Massachusetts mortgage enforcement', E.exact_company_nmls_attachments],
] as const) {
  assert.match(ask(q).failReason ?? '', new RegExp(`\\b${Number(n).toLocaleString('en-US')}\\b`), `${q} must quote snapshot value ${n}`);
}
assert.doesNotMatch(ask('how many lenders in Massachusetts').failReason ?? '', new RegExp(`\\b${combined}\\b`));
for (const city of ['Boston', 'Worcester', 'Springfield'] as const) {
  const c = L.city_filters.cities[city];
  const text = ask('mortgage lender Boston').failReason ?? '';
  const pattern =
    city === 'Boston'
      ? `Boston ${c.lender.companies_with_any_licensed_location_in_city} lender-file and ${c.broker.companies_with_any_licensed_location_in_city} broker-file`
      : `${city} ${c.lender.companies_with_any_licensed_location_in_city} and ${c.broker.companies_with_any_licensed_location_in_city}`;
  assert.match(text, new RegExp(pattern), `${city} city filter must match snapshot`);
}
assert.match(ask('denial rates Massachusetts').failReason ?? '', new RegExp(`${s.hmda.denials.toLocaleString('en-US')} denials out of ${s.hmda.applications.toLocaleString('en-US')}`));

// Earlier states still route as before.
assert.equal(parseLenderAsk('how many lenders in Georgia').failClosedKind, 'ga-no-combined-lenders');
assert.equal(parseLenderAsk('licensed mortgage lenders in Virginia').failClosedKind, 'va-scc-dated-roster');

const jsonld = buildMassachusettsIntelligenceJsonLd(s);
assert.equal(maJsonLdHasForbiddenRatings(jsonld), false);
assert.equal(s.fingerprint, MA_PUBLIC_FINGERPRINT);
assert.equal(MASSACHUSETTS_SNAPSHOT.path, '/massachusetts');
console.log('MA-LEND-001 publication assert: PASS');
