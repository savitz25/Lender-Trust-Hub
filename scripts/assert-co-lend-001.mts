import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { parseLenderAsk } from '../lib/ask-lender/parse';
import { COLORADO_INTELLIGENCE_GATE } from '../lib/colorado-intelligence/publication';
import {
  assertColoradoIntelligence,
  CO_PUBLIC_FINGERPRINT,
  CO_PUBLIC_PATH,
  COLORADO_SNAPSHOT,
} from '../lib/colorado-intelligence/snapshot';
import {
  buildColoradoIntelligenceJsonLd,
  coJsonLdHasForbiddenRatings,
} from '../lib/colorado-intelligence/jsonld';

const sitemap = readFileSync('app/sitemap.ts', 'utf8');
const robots = readFileSync('app/robots.ts', 'utf8');
const page = readFileSync('app/colorado/page.tsx', 'utf8');
const ui = readFileSync('components/colorado/colorado-state-intelligence.tsx', 'utf8');
const countyUi = readFileSync('components/colorado/county-table.tsx', 'utf8');
const pkg = readFileSync('package.json', 'utf8');
const footer = readFileSync('lib/design/lender-design-system.ts', 'utf8');
const searchCaps = readFileSync('lib/specialist-search/capabilities.ts', 'utf8');
const csv = readFileSync('data/hmda/by-state/CO/county_market_summary.csv', 'utf8')
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
  };
});

const s = assertColoradoIntelligence();
const apps = rows.reduce((n, r) => n + Number(r.total_applications), 0);
const orig = rows.reduce((n, r) => n + Number(r.total_originations), 0);
const den = rows.reduce((n, r) => n + Number(r.denial_count), 0);

assert.equal(existsSync('app/colorado/page.tsx'), true);
assert.equal(COLORADO_INTELLIGENCE_GATE.path, '/colorado');
assert.equal(CO_PUBLIC_PATH, '/colorado');
assert.equal(COLORADO_INTELLIGENCE_GATE.robotsIndex, true);
assert.equal(COLORADO_INTELLIGENCE_GATE.sitemap, true);
assert.match(page, /index:\s*true/);
assert.match(page, /follow:\s*true/);
assert.match(page, /canonical/);
assert.match(sitemap, /\/colorado/);
assert.doesNotMatch(sitemap, /\/colorado\/[a-z-]+-county/);
assert.doesNotMatch(robots, /\/colorado/);
assert.match(footer, /\/colorado/);
assert.match(footer, /Colorado Research/);
assert.match(pkg, /assert:co-lend-001/);
assert.doesNotMatch(countyUi, /href=\{`\/colorado\//);
assert.doesNotMatch(ui, /\/colorado\/denver/);
assert.doesNotMatch(ui, /\/colorado\/[a-z-]+-county/);

assert.equal(s.hmda.applications, apps);
assert.equal(s.hmda.originations, orig);
assert.equal(s.hmda.denials, den);
assert.equal(rows.length, 64);
assert.equal(s.hmda.county_count, rows.length);
assert.equal(s.hmda.county_count, 64);
assert.equal(s.hmda.applications, 260212);
assert.equal(s.hmda.originations, 156145);
assert.equal(s.hmda.denials, 40435);
assert.notEqual(s.hmda.applications, 257140);
assert.notEqual(s.hmda.denials, 39356);
assert.equal(s.clock_reconciliation.do_not_add_national_geo_to_state_intel, true);
assert.equal(s.clock_reconciliation.do_not_rewrite_national_aggregate, true);

const metrics = JSON.parse(readFileSync('data/home/lender-network-metrics-v1.json', 'utf8'));
const nationalCo = metrics.homeProjection.geography.find((row: { state: string }) => row.state === 'CO');
assert.equal(nationalCo.applications, 257140);
assert.equal(nationalCo.originations, 156145);
assert.equal(nationalCo.denials, 39356);
assert.notEqual(nationalCo.applications, s.hmda.applications);
assert.equal(nationalCo.originations, s.hmda.originations);
assert.equal(metrics.colorado.hmdaApplications, s.hmda.applications);
assert.equal(metrics.identity.institutions, 14623);

assert.equal(s.mlo_roster.grain, 'PERSON');
assert.equal(s.mlo_roster.not_a_lender_count, true);
assert.equal(s.mlo_roster.rows, 21865);
assert.notEqual(s.mlo_roster.rows, s.hmda.applications);
assert.equal(s.live_roster.CURRENT_COLORADO_MORTGAGE_COMPANY_BULK_ROSTER, 'SOURCE_NOT_ACQUIRED');
assert.equal(s.live_roster.live_licensed_company_denominator, 'UNKNOWN');
assert.equal(s.dre_enforcement.name_only_identity, 'UNSAFE_FOR_ADVERSE_PROFILE_ATTACH');
assert.equal(s.programs.not_an_endorsement, true);
assert.equal(s.cfpb.company_rate_published, false);
assert.equal(s.cfpb.mortgage_complaint_rows, 8627);
assert.equal(s.expansion_ledger.NET_NEW_CANONICAL_ORGANIZATIONS, 0);
assert.equal(s.expansion_ledger.NET_NEW_PUBLIC_LENDER_PROFILES, 0);
assert.equal(s.claimEligibilityBroadened, false);
assert.equal(s.noCombinedDenominator, true);

assert.match(ui, /SOURCE_NOT_ACQUIRED/);
assert.match(ui, /MLO person is not a lender company/);
assert.match(ui, /Search-only is not zero/);
assert.match(ui, /not a lender directory/i);
assert.match(ui, /CHFA homebuyer resources are program participation/);
assert.doesNotMatch(ui, /Trust Score is/);
assert.doesNotMatch(ui, /best lender|safest lender|vetted lender/i);
assert.doesNotMatch(ui, /Colorado has \d+ lenders/);
assert.match(searchCaps, /colorado-roster/);
assert.match(searchCaps, /supportState: 'UNSUPPORTED'/);

const jsonld = buildColoradoIntelligenceJsonLd(s);
assert.equal(coJsonLdHasForbiddenRatings(jsonld), false);
assert.match(JSON.stringify(jsonld), /WebPage/);
assert.equal(existsSync('app/florida/page.tsx'), true);
assert.equal(existsSync('app/new-jersey/page.tsx'), true);
assert.equal(existsSync('app/california/page.tsx'), true);
assert.equal(existsSync('app/texas/page.tsx'), true);
assert.equal(existsSync('app/washington/page.tsx'), true);
assert.equal(existsSync('app/arizona/page.tsx'), true);
assert.equal(s.fingerprint, CO_PUBLIC_FINGERPRINT);
assert.equal(s.fingerprint.length, 64);
assert.match(s.hero.universe_label, /HMDA/);
assert.notEqual(s.hero.universe_value, s.mlo_roster.rows);
assert.equal(COLORADO_SNAPSHOT.path, '/colorado');
assert.equal(s.live_roster.CURRENT_COLORADO_MORTGAGE_COMPANY_BULK_ROSTER, 'SOURCE_NOT_ACQUIRED');
assert.notEqual(s.live_roster.CURRENT_COLORADO_MORTGAGE_COMPANY_BULK_ROSTER, s.mlo_roster.coverage_state);
assert.equal(s.mlo_roster.not_added_to_national_institution_totals, true);
assert.equal(s.cfpb.api_last_updated, null);
assert.equal(s.source_as_of.cfpb, null);
assert.equal(s.mlo_roster.retrieved_at, '2026-09-09');
assert.equal(s.cfpb.retrieved_at, '2026-09-09');
assert.equal(s.programs.retrieved_at, '2026-09-09');
assert.doesNotMatch(s.mlo_roster.retrieved_at, /T/);
assert.doesNotMatch(s.generated_at, /22:00:00/);
assert.notEqual(s.mlo_roster.retrieved_at, s.generated_at);
assert.notEqual(s.mlo_roster.source_as_of, s.generated_at);
assert.equal(s.mlo_roster.source_as_of, '2026-09-09');
assert.equal(s.programs.exact_identity_attachment_count, 0);
assert.ok(Array.isArray(s.rejected_joins) && s.rejected_joins.length >= 6);
assert.match(JSON.stringify(s.unresolved_relationships), /OPEN_SEARCH_ONLY/);
assert.doesNotMatch(ui, /Colorado has \d+ lenders/);
assert.match(ui, /state-license absence != unlicensed/i);
assert.match(ui, /Employer\/entity strings are not used to mint companies/i);
assert.equal(parseLenderAsk('licensed mortgage lenders in Colorado').coverageState, 'NOT_ACQUIRED');
assert.equal(parseLenderAsk('Colorado MLO lenders').failClosedKind, 'unsupported-identity-grain');

const check = spawnSync('python', ['scripts/build-co-public-snapshot.py', '--check'], { encoding: 'utf8' });
assert.equal(check.status, 0, check.stderr || check.stdout);
assert.match(check.stdout, new RegExp(CO_PUBLIC_FINGERPRINT));

console.log('CO-LEND-001 assertions: PASS');
