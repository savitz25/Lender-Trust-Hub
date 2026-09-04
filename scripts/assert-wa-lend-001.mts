import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { WASHINGTON_INTELLIGENCE_GATE } from '../lib/washington-intelligence/publication';
import {
  assertWashingtonIntelligence,
  WA_PUBLIC_FINGERPRINT,
  WA_PUBLIC_PATH,
  WASHINGTON_SNAPSHOT,
} from '../lib/washington-intelligence/snapshot';
import {
  buildWashingtonIntelligenceJsonLd,
  waJsonLdHasForbiddenRatings,
} from '../lib/washington-intelligence/jsonld';

const sitemap = readFileSync('app/sitemap.ts', 'utf8');
const robots = readFileSync('app/robots.ts', 'utf8');
const page = readFileSync('app/washington/page.tsx', 'utf8');
const ui = readFileSync('components/washington/washington-state-intelligence.tsx', 'utf8');
const countyUi = readFileSync('components/washington/county-table.tsx', 'utf8');
const pkg = readFileSync('package.json', 'utf8');
const footer = readFileSync('lib/design/lender-design-system.ts', 'utf8');
const csv = readFileSync('data/hmda/by-state/WA/county_market_summary.csv', 'utf8')
  .trim()
  .split(/\r?\n/);
const header = csv[0].split(',');
const idx = (name: string) => header.indexOf(name);
const rows = csv.slice(1).map((line) => {
  const parts = line.split(',');
  return {
    total_applications: parts[idx('total_applications')],
    total_originations: parts[idx('total_originations')],
    denial_count: parts[idx('denial_count')],
    purchase_count: parts[idx('purchase_count')],
    refinance_count: parts[idx('refinance_count')],
    apps_conventional: parts[idx('apps_conventional')],
  };
});

const s = assertWashingtonIntelligence();
const apps = rows.reduce((n, r) => n + Number(r.total_applications), 0);
const orig = rows.reduce((n, r) => n + Number(r.total_originations), 0);
const den = rows.reduce((n, r) => n + Number(r.denial_count), 0);
const purch = rows.reduce((n, r) => n + Number(r.purchase_count), 0);
const refi = rows.reduce((n, r) => n + Number(r.refinance_count), 0);
const conv = rows.reduce((n, r) => n + Number(r.apps_conventional), 0);

assert.equal(existsSync('app/washington/page.tsx'), true);
assert.equal(WASHINGTON_INTELLIGENCE_GATE.path, '/washington');
assert.equal(WA_PUBLIC_PATH, '/washington');
assert.equal(WASHINGTON_INTELLIGENCE_GATE.robotsIndex, true);
assert.equal(WASHINGTON_INTELLIGENCE_GATE.sitemap, true);
assert.match(page, /index:\s*true/);
assert.match(page, /follow:\s*true/);
assert.match(page, /canonical/);
assert.match(sitemap, /\/washington/);
assert.doesNotMatch(sitemap, /\/washington\/[a-z-]+-county/);
assert.doesNotMatch(robots, /\/washington/);
assert.match(footer, /\/washington/);
assert.match(pkg, /assert:wa-lend-001/);
assert.doesNotMatch(countyUi, /href=\{`\/washington\//);
assert.doesNotMatch(ui, /\/washington\/king-county/);
assert.doesNotMatch(ui, /\/washington\/seattle/);
assert.doesNotMatch(ui, /\/washington\/[a-z-]+-county/);

assert.equal(s.hmda.applications, apps);
assert.equal(s.hmda.originations, orig);
assert.equal(s.hmda.denials, den);
assert.equal(s.hmda.denial_rate_pct, Number(((den / apps) * 100).toFixed(2)));
assert.equal(s.hmda.purchase_pct_of_apps, Number(((purch / apps) * 100).toFixed(2)));
assert.equal(s.hmda.refinance_pct_of_apps, Number(((refi / apps) * 100).toFixed(2)));
assert.equal(s.hmda.conventional_pct, Number(((conv / apps) * 100).toFixed(2)));
assert.equal(s.hmda.county_count, 39);
assert.equal(s.hmda.all_39_counties, true);
assert.equal(s.hmda.counties.length, 39);
assert.equal(
  s.hmda.counties.every((c) => Boolean(c.county_name) && !c.county_name.startsWith('53')),
  true,
);
assert.match(s.hmda.caveat, /does not prove discrimination/i);
assert.equal(s.hmda.denial_reasons, null);

assert.equal(s.dfi_enforcement.exact_nmls_rows + s.dfi_enforcement.name_only_rows, s.dfi_enforcement.order_rows);
assert.equal(s.dfi_enforcement.name_only_identity, 'UNSAFE_FOR_ADVERSE_PROFILE_ATTACH');
assert.equal(s.dfi_enforcement.native_type_distinct > 1, true);
assert.equal(s.dfi_aggregates.mortgage_brokers, 354);
assert.equal(s.dfi_aggregates.consumer_loan_companies, 1104);
assert.equal(s.dfi_aggregates.loan_originators_active, 20126);
assert.equal(s.dfi_aggregates.not_a_live_roster, true);

assert.equal(s.live_roster.CURRENT_WASHINGTON_MORTGAGE_COMPANY_BULK_ROSTER, 'SOURCE_NOT_ACQUIRED');
assert.equal(s.live_roster.live_licensed_company_denominator, 'UNKNOWN');
assert.equal(s.programs.items.length >= 1, true);
assert.equal(
  s.programs.items.every((p) => Boolean(p.source_url) && Boolean(p.source_date)),
  true,
);
assert.match(s.cfpb.caveat, /not a violation/i);
assert.equal(s.cfpb.company_rate_published, false);
assert.equal(s.foreclosure.STATEWIDE_STRUCTURED_FORECLOSURE_SOURCE_NOT_ACQUIRED, true);

assert.match(ui, /SOURCE_NOT_ACQUIRED/);
assert.match(ui, /UNSAFE_FOR_ADVERSE_PROFILE_ATTACH/);
assert.match(ui, /not a license/i);
assert.doesNotMatch(ui, /Trust Score is/);
assert.doesNotMatch(ui, /best lender|worst county/i);
assert.match(ui, /HMDA reporter is not a Washington licensee/);
assert.match(ui, /Order count is not quality/);
assert.match(ui, /year-end reported entities/i);

const jsonld = buildWashingtonIntelligenceJsonLd(s);
assert.equal(waJsonLdHasForbiddenRatings(jsonld), false);
assert.match(JSON.stringify(jsonld), /WebPage/);
assert.equal(existsSync('app/washington'), true);
assert.equal(existsSync('.vercel/project.json'), false);
assert.equal(s.fingerprint, WA_PUBLIC_FINGERPRINT);
assert.equal(s.fingerprint.length, 64);
assert.equal(s.hero.universe_label.includes('HMDA'), true);
assert.notEqual(s.hero.universe_value, 0);
assert.notEqual(s.hero.universe_value, 354 + 1104);
assert.equal(WASHINGTON_SNAPSHOT.path, '/washington');

console.log('WA-LEND-001 assertions: PASS');
