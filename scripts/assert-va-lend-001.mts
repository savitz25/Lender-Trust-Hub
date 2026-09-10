import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { parseLenderAsk } from '../lib/ask-lender/parse';
import { VIRGINIA_INTELLIGENCE_GATE } from '../lib/virginia-intelligence/publication';
import {
  assertVirginiaIntelligence,
  VA_PUBLIC_FINGERPRINT,
  VA_PUBLIC_PATH,
  VIRGINIA_SNAPSHOT,
} from '../lib/virginia-intelligence/snapshot';
import {
  buildVirginiaIntelligenceJsonLd,
  vaJsonLdHasForbiddenRatings,
} from '../lib/virginia-intelligence/jsonld';

const sitemap = readFileSync('app/sitemap.ts', 'utf8');
const robots = readFileSync('app/robots.ts', 'utf8');
const page = readFileSync('app/virginia/page.tsx', 'utf8');
const ui = readFileSync('components/virginia/virginia-state-intelligence.tsx', 'utf8');
const countyUi = readFileSync('components/virginia/county-table.tsx', 'utf8');
const pkg = readFileSync('package.json', 'utf8');
const footer = readFileSync('lib/design/lender-design-system.ts', 'utf8');
const searchCaps = readFileSync('lib/specialist-search/capabilities.ts', 'utf8');
const claim = readFileSync('lib/customer-integration/eligibility.ts', 'utf8');
const csv = readFileSync('data/hmda/by-state/VA/county_market_summary.csv', 'utf8')
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

const s = assertVirginiaIntelligence();
const apps = rows.reduce((n, r) => n + Number(r.total_applications), 0);
const orig = rows.reduce((n, r) => n + Number(r.total_originations), 0);
const den = rows.reduce((n, r) => n + Number(r.denial_count), 0);

assert.equal(existsSync('app/virginia/page.tsx'), true);
assert.equal(existsSync('app/virginia/fairfax'), false);
assert.equal(existsSync('app/virginia/richmond'), false);
assert.equal(VIRGINIA_INTELLIGENCE_GATE.path, '/virginia');
assert.equal(VA_PUBLIC_PATH, '/virginia');
assert.equal(VIRGINIA_INTELLIGENCE_GATE.robotsIndex, true);
assert.match(page, /index:\s*true/);
assert.match(page, /follow:\s*true/);
assert.match(page, /canonical/);
assert.match(sitemap, /\/virginia/);
assert.doesNotMatch(sitemap, /\/virginia\/[a-z-]+/);
assert.doesNotMatch(robots, /\/virginia/);
assert.match(footer, /\/virginia/);
assert.match(footer, /Virginia Research/);
assert.match(pkg, /assert:va-lend-001/);
assert.doesNotMatch(countyUi, /href=\{`\/virginia\//);
assert.doesNotMatch(ui, /\/virginia\/fairfax|\/virginia\/richmond|\/virginia\/arlington/);

assert.equal(s.hmda.applications, apps);
assert.equal(s.hmda.originations, orig);
assert.equal(s.hmda.denials, den);
assert.equal(rows.length, 133);
assert.equal(s.scc_roster.source_as_of, '2025-12-31');
assert.notEqual(s.scc_roster.source_as_of, '2026-09-10');
assert.equal(s.scc_roster.not_current_2026_status, true);
assert.equal(s.scc_roster.brokers, 713);
assert.notEqual(s.scc_roster.lenders, s.scc_roster.lender_brokers);
assert.notEqual(s.scc_roster.brokers, s.scc_roster.lenders);
assert.equal(s.offices.office_ne_company, true);
assert.equal(s.mlo_person.grain, 'PERSON');
assert.equal(s.mlo_person.not_a_lender_count, true);
assert.notEqual(s.mlo_person.persons, s.scc_roster.rows);
assert.notEqual(s.hmda.applications, s.scc_roster.rows);
assert.equal(s.cfpb.company_rate_published, false);
assert.equal(s.programs.not_a_license, true);
assert.equal(s.live_roster.CURRENT_VIRGINIA_MORTGAGE_COMPANY_BULK_ROSTER, 'SOURCE_NOT_ACQUIRED');
assert.equal(s.expansion_ledger.NET_NEW_CANONICAL_ORGANIZATIONS, 0);
assert.equal(s.expansion_ledger.NET_NEW_PUBLIC_LENDER_PROFILES, 0);
assert.equal(s.claimEligibilityBroadened, false);
assert.equal(s.noCombinedDenominator, true);
assert.equal(s.identity_rules.UNSAFE, 'Name-only relationship or adverse attachment');
assert.doesNotMatch(claim, /VA-SCC-BFI|va-scc-bfi/);
assert.match(ui, /SOURCE_NOT_ACQUIRED/);
assert.match(ui, /Broker != lender/);
assert.match(ui, /Search-only is not zero/);
assert.match(ui, /not a ranking/i);
assert.doesNotMatch(ui, /Trust Score is/);
assert.doesNotMatch(ui, /best lender|safest lender|vetted lender/i);
assert.doesNotMatch(ui, /Virginia has [\d,]+ lenders/);
assert.match(searchCaps, /virginia-roster/);
assert.match(searchCaps, /supportState: 'PARTIAL'/);
assert.equal(parseLenderAsk('licensed mortgage lenders in Colorado').coverageState, 'NOT_ACQUIRED');
assert.equal(parseLenderAsk('licensed mortgage lenders in Virginia').failClosedKind, 'va-scc-dated-roster');

const metrics = JSON.parse(readFileSync('data/home/lender-network-metrics-v1.json', 'utf8'));
assert.ok(metrics.network.publishedStateIntelligencePaths.includes('/virginia'));
assert.equal(metrics.identity.institutions, 14623);
assert.equal(metrics.virginia.liveLicensedCompanyUniverse, null);

const jsonld = buildVirginiaIntelligenceJsonLd(s);
assert.equal(vaJsonLdHasForbiddenRatings(jsonld), false);
assert.match(JSON.stringify(jsonld), /WebPage/);
assert.equal(existsSync('app/colorado/page.tsx'), true);
assert.equal(s.fingerprint, VA_PUBLIC_FINGERPRINT);
assert.equal(VIRGINIA_SNAPSHOT.path, '/virginia');
console.log('VA-LEND-001 publication assert: PASS');
