import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { CALIFORNIA_INTELLIGENCE_GATE } from '../lib/california-intelligence/publication';
import {
  assertCaliforniaIntelligence,
  CA_PUBLIC_FINGERPRINT,
  CA_PUBLIC_PATH,
  CALIFORNIA_SNAPSHOT,
} from '../lib/california-intelligence/snapshot';
import {
  buildCaliforniaIntelligenceJsonLd,
  caJsonLdHasForbiddenRatings,
} from '../lib/california-intelligence/jsonld';

const sitemap = readFileSync('app/sitemap.ts', 'utf8');
const robots = readFileSync('app/robots.ts', 'utf8');
const page = readFileSync('app/california/page.tsx', 'utf8');
const ui = readFileSync('components/california/california-state-intelligence.tsx', 'utf8');
const countyUi = readFileSync('components/california/county-table.tsx', 'utf8');
const pkg = readFileSync('package.json', 'utf8');
const footer = readFileSync('lib/design/lender-design-system.ts', 'utf8');
const csv = readFileSync('data/hmda/by-state/CA/county_market_summary.csv', 'utf8')
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

const s = assertCaliforniaIntelligence();
const apps = rows.reduce((n, r) => n + Number(r.total_applications), 0);
const orig = rows.reduce((n, r) => n + Number(r.total_originations), 0);
const den = rows.reduce((n, r) => n + Number(r.denial_count), 0);
const purch = rows.reduce((n, r) => n + Number(r.purchase_count), 0);
const refi = rows.reduce((n, r) => n + Number(r.refinance_count), 0);
const conv = rows.reduce((n, r) => n + Number(r.apps_conventional), 0);

assert.equal(existsSync('app/california/page.tsx'), true);
assert.equal(CALIFORNIA_INTELLIGENCE_GATE.path, '/california');
assert.equal(CA_PUBLIC_PATH, '/california');
assert.equal(CALIFORNIA_INTELLIGENCE_GATE.robotsIndex, true);
assert.equal(CALIFORNIA_INTELLIGENCE_GATE.sitemap, true);
assert.match(page, /index:\s*true/);
assert.match(page, /follow:\s*true/);
assert.match(page, /canonical/);
assert.match(sitemap, /\/california/);
assert.doesNotMatch(sitemap, /\/california\/[a-z-]+-county/);
assert.doesNotMatch(robots, /\/california/);
assert.match(footer, /\/california/);
assert.match(pkg, /assert:ca-lend-001/);
assert.doesNotMatch(countyUi, /href=\{`\/california\//);
assert.doesNotMatch(ui, /\/california\/los-angeles-county/);

assert.equal(s.hmda.applications, apps);
assert.equal(s.hmda.originations, orig);
assert.equal(s.hmda.denials, den);
assert.equal(s.hmda.denial_rate_pct, Number(((den / apps) * 100).toFixed(2)));
assert.equal(s.hmda.purchase_pct_of_apps, Number(((purch / apps) * 100).toFixed(2)));
assert.equal(s.hmda.refinance_pct_of_apps, Number(((refi / apps) * 100).toFixed(2)));
assert.equal(s.hmda.conventional_pct, Number(((conv / apps) * 100).toFixed(2)));
assert.equal(s.hmda.county_count, 58);
assert.equal(s.hmda.all_58_counties, true);
assert.equal(s.hmda.counties.length, 58);
assert.equal(
  s.hmda.counties.every((c) => Boolean(c.county_name) && !c.county_name.startsWith('06')),
  true,
);
assert.match(s.hmda.caveat, /does not prove discrimination/i);

assert.equal(s.calhfa_directory.directory_rows > 0, true);
assert.equal(s.calhfa_directory.distinct_company_names < s.calhfa_directory.directory_rows, true);
assert.equal(s.calhfa_directory.nmls_id_present, 0);
assert.equal(s.calhfa_directory.email_present, 0);
assert.match(s.calhfa_directory.caveat, /not a California license/i);
assert.match(s.calhfa_programs.application_path, /does not accept applications directly/i);
assert.equal(
  s.calhfa_programs.items.every((p) => Boolean(p.source_url) && Boolean(p.source_date)),
  true,
);

assert.equal(s.crmla_annual_report.licensees, 389);
assert.equal(s.crmla_annual_report.branches, 5104);
assert.equal(s.crmla_annual_report.not_a_live_roster, true);
assert.equal(s.live_roster.CURRENT_CRMLA_BULK_ROSTER, 'SOURCE_NOT_ACQUIRED');
assert.match(s.dre_mlo.caveat, /different credential path from a CRMLA company license/i);
assert.equal(s.enforcement.result, 'NO_BULK_ACQUIRED');
assert.match(s.cfpb.caveat, /not a violation/i);
assert.equal(s.foreclosure.STATEWIDE_STRUCTURED_SOURCE_NOT_ACQUIRED, true);

assert.match(ui, /SOURCE_NOT_ACQUIRED/);
assert.match(ui, /not a California license/);
assert.doesNotMatch(ui, /Trust Score is/);
assert.doesNotMatch(ui, /best lender|worst county/i);
assert.match(ui, /DRE MLO endorsement is not a CRMLA company license/);

const jsonld = buildCaliforniaIntelligenceJsonLd(s);
assert.equal(caJsonLdHasForbiddenRatings(jsonld), false);
assert.match(JSON.stringify(jsonld), /WebPage/);
assert.equal(existsSync('app/california'), true);
assert.equal(existsSync('.vercel/project.json'), false);
assert.equal(s.fingerprint, CA_PUBLIC_FINGERPRINT);
assert.equal(s.fingerprint.length, 64);
assert.equal(s.hero.universe_label.includes('HMDA'), true);
assert.notEqual(s.hero.universe_value, 0);
assert.equal(CALIFORNIA_SNAPSHOT.path, '/california');

console.log('CA-LEND-001 assertions: PASS');
console.log(`  HMDA ${s.hmda.applications} apps / ${s.hmda.originations} orig / ${s.hmda.denial_rate_pct}%`);
console.log(`  CalHFA ${s.calhfa_directory.directory_rows} rows / ${s.calhfa_directory.distinct_company_names} names`);
console.log(`  CRMLA 2024 ${s.crmla_annual_report.licensees} licensees / ${s.crmla_annual_report.branches} branches`);
console.log(`  fingerprint ${s.fingerprint}`);
