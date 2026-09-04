import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { ARIZONA_INTELLIGENCE_GATE } from '../lib/arizona-intelligence/publication';
import {
  assertArizonaIntelligence,
  AZ_PUBLIC_FINGERPRINT,
  AZ_PUBLIC_PATH,
  ARIZONA_SNAPSHOT,
} from '../lib/arizona-intelligence/snapshot';
import {
  buildArizonaIntelligenceJsonLd,
  azJsonLdHasForbiddenRatings,
} from '../lib/arizona-intelligence/jsonld';

const sitemap = readFileSync('app/sitemap.ts', 'utf8');
const robots = readFileSync('app/robots.ts', 'utf8');
const page = readFileSync('app/arizona/page.tsx', 'utf8');
const ui = readFileSync('components/arizona/arizona-state-intelligence.tsx', 'utf8');
const countyUi = readFileSync('components/arizona/county-table.tsx', 'utf8');
const pkg = readFileSync('package.json', 'utf8');
const footer = readFileSync('lib/design/lender-design-system.ts', 'utf8');
const csv = readFileSync('data/hmda/by-state/AZ/county_market_summary.csv', 'utf8')
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

const s = assertArizonaIntelligence();
const apps = rows.reduce((n, r) => n + Number(r.total_applications), 0);
const orig = rows.reduce((n, r) => n + Number(r.total_originations), 0);
const den = rows.reduce((n, r) => n + Number(r.denial_count), 0);
const purch = rows.reduce((n, r) => n + Number(r.purchase_count), 0);
const refi = rows.reduce((n, r) => n + Number(r.refinance_count), 0);
const conv = rows.reduce((n, r) => n + Number(r.apps_conventional), 0);

assert.equal(existsSync('app/arizona/page.tsx'), true);
assert.equal(ARIZONA_INTELLIGENCE_GATE.path, '/arizona');
assert.equal(AZ_PUBLIC_PATH, '/arizona');
assert.equal(ARIZONA_INTELLIGENCE_GATE.robotsIndex, true);
assert.equal(ARIZONA_INTELLIGENCE_GATE.sitemap, true);
assert.match(page, /index:\s*true/);
assert.match(page, /follow:\s*true/);
assert.match(page, /canonical/);
assert.match(sitemap, /\/arizona/);
assert.doesNotMatch(sitemap, /\/arizona\/[a-z-]+-county/);
assert.doesNotMatch(robots, /\/arizona/);
assert.match(footer, /\/arizona/);
assert.match(footer, /Arizona Research/);
assert.match(pkg, /assert:az-lend-001/);
assert.doesNotMatch(countyUi, /href=\{`\/arizona\//);
assert.doesNotMatch(ui, /\/arizona\/maricopa/);
assert.doesNotMatch(ui, /\/arizona\/phoenix/);
assert.doesNotMatch(ui, /\/arizona\/pima/);
assert.doesNotMatch(ui, /\/arizona\/tucson/);

assert.equal(s.hmda.applications, apps);
assert.equal(s.hmda.originations, orig);
assert.equal(s.hmda.denials, den);
assert.equal(s.hmda.denial_rate_pct, Number(((den / apps) * 100).toFixed(2)));
assert.equal(s.hmda.purchase_pct_of_apps, Number(((purch / apps) * 100).toFixed(2)));
assert.equal(s.hmda.refinance_pct_of_apps, Number(((refi / apps) * 100).toFixed(2)));
assert.equal(s.hmda.conventional_pct, Number(((conv / apps) * 100).toFixed(2)));
assert.equal(s.hmda.county_count, 15);
assert.equal(s.hmda.all_15_counties, true);
assert.equal(s.hmda.counties.length, 15);
assert.equal(s.hmda.denial_reasons, null);
assert.match(s.hmda.caveat, /does not prove discrimination/i);

assert.equal(s.live_roster.CURRENT_ARIZONA_MORTGAGE_COMPANY_BULK_ROSTER, 'SOURCE_NOT_ACQUIRED');
assert.equal(s.live_roster.live_licensed_company_denominator, 'UNKNOWN');
assert.equal(s.difi_enforcement.name_only_identity, 'UNSAFE_FOR_ADVERSE_PROFILE_ATTACH');
assert.equal(s.programs.items.length >= 1, true);
assert.equal(
  s.programs.items.every((p) => Boolean(p.source_url) && Boolean(p.source_date)),
  true,
);
assert.match(s.cfpb.caveat, /not a violation/i);
assert.equal(s.cfpb.company_rate_published, false);
assert.equal(s.cfpb.mortgage_complaint_rows, 10365);
assert.equal(s.foreclosure.STATEWIDE_STRUCTURED_FORECLOSURE_SOURCE_NOT_ACQUIRED, true);
assert.equal(s.expansion_ledger.NET_NEW_CANONICAL_ORGANIZATIONS, 0);
assert.equal(s.expansion_ledger.NET_NEW_STATE_IDENTITIES, 0);
assert.equal(s.growth_classification, 'INTELLIGENCE_GROWTH_HEAVY');
assert.equal(s.clock_reconciliation.originations_match, true);

assert.match(ui, /SOURCE_NOT_ACQUIRED/);
assert.match(ui, /UNSAFE_FOR_ADVERSE_PROFILE_ATTACH/);
assert.match(ui, /not a license/i);
assert.doesNotMatch(ui, /Trust Score is/);
assert.doesNotMatch(ui, /best lender|worst county/i);
assert.match(ui, /HMDA reporter is not an Arizona licensee/);
assert.match(ui, /complaint is not a violation/i);

const jsonld = buildArizonaIntelligenceJsonLd(s);
assert.equal(azJsonLdHasForbiddenRatings(jsonld), false);
assert.match(JSON.stringify(jsonld), /WebPage/);
assert.equal(existsSync('app/washington/page.tsx'), true);
assert.equal(existsSync('app/texas/page.tsx'), true);
assert.equal(existsSync('app/california/page.tsx'), true);
assert.equal(existsSync('app/new-jersey/page.tsx'), true);
assert.equal(existsSync('app/florida/page.tsx'), true);
assert.equal(existsSync('.vercel/project.json'), false);
assert.equal(s.fingerprint, AZ_PUBLIC_FINGERPRINT);
assert.equal(s.fingerprint.length, 64);
assert.equal(s.hero.universe_label.includes('HMDA'), true);
assert.notEqual(s.hero.universe_value, 0);
assert.equal(ARIZONA_SNAPSHOT.path, '/arizona');

console.log('AZ-LEND-001 assertions: PASS');
