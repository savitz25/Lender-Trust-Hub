import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { TEXAS_INTELLIGENCE_GATE } from '../lib/texas-intelligence/publication';
import {
  assertTexasIntelligence,
  TX_PUBLIC_FINGERPRINT,
  TX_PUBLIC_PATH,
  TEXAS_SNAPSHOT,
} from '../lib/texas-intelligence/snapshot';
import {
  buildTexasIntelligenceJsonLd,
  txJsonLdHasForbiddenRatings,
} from '../lib/texas-intelligence/jsonld';

const sitemap = readFileSync('app/sitemap.ts', 'utf8');
const robots = readFileSync('app/robots.ts', 'utf8');
const page = readFileSync('app/texas/page.tsx', 'utf8');
const ui = readFileSync('components/texas/texas-state-intelligence.tsx', 'utf8');
const countyUi = readFileSync('components/texas/county-table.tsx', 'utf8');
const pkg = readFileSync('package.json', 'utf8');
const footer = readFileSync('lib/design/lender-design-system.ts', 'utf8');
const csv = readFileSync('data/hmda/by-state/TX/county_market_summary.csv', 'utf8')
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

const s = assertTexasIntelligence();
const apps = rows.reduce((n, r) => n + Number(r.total_applications), 0);
const orig = rows.reduce((n, r) => n + Number(r.total_originations), 0);
const den = rows.reduce((n, r) => n + Number(r.denial_count), 0);
const purch = rows.reduce((n, r) => n + Number(r.purchase_count), 0);
const refi = rows.reduce((n, r) => n + Number(r.refinance_count), 0);
const conv = rows.reduce((n, r) => n + Number(r.apps_conventional), 0);

assert.equal(existsSync('app/texas/page.tsx'), true);
assert.equal(TEXAS_INTELLIGENCE_GATE.path, '/texas');
assert.equal(TX_PUBLIC_PATH, '/texas');
assert.equal(TEXAS_INTELLIGENCE_GATE.robotsIndex, true);
assert.equal(TEXAS_INTELLIGENCE_GATE.sitemap, true);
assert.match(page, /index:\s*true/);
assert.match(page, /follow:\s*true/);
assert.match(page, /canonical/);
assert.match(sitemap, /\/texas/);
assert.doesNotMatch(sitemap, /\/texas\/[a-z-]+-county/);
assert.doesNotMatch(robots, /\/texas/);
assert.match(footer, /\/texas/);
assert.match(pkg, /assert:tx-lend-001/);
assert.doesNotMatch(countyUi, /href=\{`\/texas\//);
assert.doesNotMatch(ui, /\/texas\/harris-county/);
assert.doesNotMatch(ui, /\/texas\/[a-z-]+-county/);

assert.equal(s.hmda.applications, apps);
assert.equal(s.hmda.originations, orig);
assert.equal(s.hmda.denials, den);
assert.equal(s.hmda.denial_rate_pct, Number(((den / apps) * 100).toFixed(2)));
assert.equal(s.hmda.purchase_pct_of_apps, Number(((purch / apps) * 100).toFixed(2)));
assert.equal(s.hmda.refinance_pct_of_apps, Number(((refi / apps) * 100).toFixed(2)));
assert.equal(s.hmda.conventional_pct, Number(((conv / apps) * 100).toFixed(2)));
assert.equal(s.hmda.county_count, 253);
assert.equal(s.hmda.all_254_counties, false);
assert.equal(s.hmda.counties.length, 253);
assert.equal(
  s.hmda.counties.every((c) => Boolean(c.county_name) && !c.county_name.startsWith('48')),
  true,
);
assert.match(s.hmda.caveat, /does not prove discrimination/i);

assert.equal(s.sml_orders.order_rows, 3981);
assert.equal(s.sml_orders.exact_nmls_rows, 2493);
assert.equal(s.sml_orders.name_only_rows, 1488);
assert.equal(s.sml_orders.name_only_identity, 'UNSAFE_FOR_ADVERSE_PROFILE_ATTACH');
assert.equal(s.sml_orders.native_title_distinct > 1, true);
assert.equal(s.sml_annual_report.nmls_regulated_entities, 4589);
assert.equal(s.sml_annual_report.not_a_live_roster, true);

assert.equal(s.live_roster.CURRENT_TEXAS_MORTGAGE_COMPANY_BULK_ROSTER, 'SOURCE_NOT_ACQUIRED');
assert.equal(s.live_roster.live_licensed_company_denominator, 'UNKNOWN');
assert.equal(s.programs.items.length >= 1, true);
assert.equal(
  s.programs.items.every((p) => Boolean(p.source_url) && Boolean(p.source_date)),
  true,
);
assert.equal(s.approved_lenders.result, 'SOURCE_NOT_ACQUIRED');
assert.equal(s.approved_lenders.nmls_id_present, 0);
assert.match(s.cfpb.caveat, /not a violation/i);
assert.equal(s.cfpb.company_rate_published, false);
assert.equal(s.foreclosure.STATEWIDE_STRUCTURED_FORECLOSURE_SOURCE_NOT_ACQUIRED, true);

assert.match(ui, /SOURCE_NOT_ACQUIRED/);
assert.match(ui, /UNSAFE_FOR_ADVERSE_PROFILE_ATTACH/);
assert.match(ui, /not a license/i);
assert.doesNotMatch(ui, /Trust Score is/);
assert.doesNotMatch(ui, /best lender|worst county/i);
assert.match(ui, /HMDA reporter is not a Texas licensee/);
assert.match(ui, /Order count is not quality/);

const jsonld = buildTexasIntelligenceJsonLd(s);
assert.equal(txJsonLdHasForbiddenRatings(jsonld), false);
assert.match(JSON.stringify(jsonld), /WebPage/);
assert.equal(existsSync('app/texas'), true);
assert.equal(existsSync('.vercel/project.json'), false);
assert.equal(s.fingerprint, TX_PUBLIC_FINGERPRINT);
assert.equal(s.fingerprint.length, 64);
assert.equal(s.hero.universe_label.includes('HMDA'), true);
assert.notEqual(s.hero.universe_value, 0);
assert.equal(TEXAS_SNAPSHOT.path, '/texas');

console.log('TX-LEND-001 assertions: PASS');
console.log(`  HMDA ${s.hmda.applications} apps / ${s.hmda.originations} orig / ${s.hmda.denial_rate_pct}%`);
console.log(`  SML ${s.sml_orders.order_rows} orders / ${s.sml_orders.exact_nmls_rows} exact NMLS / ${s.sml_orders.name_only_rows} name-only`);
console.log(`  programs ${s.programs.items.length}`);
console.log(`  fingerprint ${s.fingerprint}`);
