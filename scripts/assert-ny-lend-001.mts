import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { parseLenderAsk } from '../lib/ask-lender/parse';
import { NEW_YORK_INTELLIGENCE_GATE } from '../lib/new-york-intelligence/publication';
import {
  assertNewYorkIntelligence,
  NY_PUBLIC_FINGERPRINT,
  NY_PUBLIC_PATH,
} from '../lib/new-york-intelligence/snapshot';
import {
  buildNewYorkIntelligenceJsonLd,
  nyJsonLdHasForbiddenRatings,
} from '../lib/new-york-intelligence/jsonld';

const sitemap = readFileSync('app/sitemap.ts', 'utf8');
const page = readFileSync('app/new-york/page.tsx', 'utf8');
const ui = readFileSync('components/new-york/new-york-state-intelligence.tsx', 'utf8');
const pkg = readFileSync('package.json', 'utf8');
const footer = readFileSync('lib/design/lender-design-system.ts', 'utf8');
const vaUi = readFileSync('components/virginia/virginia-state-intelligence.tsx', 'utf8');
const coUi = readFileSync('components/colorado/colorado-state-intelligence.tsx', 'utf8');
const claim = readFileSync('lib/customer-integration/eligibility.ts', 'utf8');
const searchCaps = readFileSync('lib/specialist-search/capabilities.ts', 'utf8');

const s = assertNewYorkIntelligence();

assert.equal(existsSync('app/new-york/page.tsx'), true);
assert.equal(existsSync('app/new-york/new-york-city'), false);
assert.equal(existsSync('app/new-york/manhattan'), false);
assert.equal(existsSync('app/new-york/brooklyn'), false);
assert.equal(existsSync('app/new-york/queens'), false);
assert.equal(existsSync('app/new-york/bronx'), false);
assert.equal(existsSync('app/new-york/staten-island'), false);
assert.equal(existsSync('app/new-york/nassau'), false);
assert.equal(existsSync('app/new-york/suffolk'), false);
assert.equal(existsSync('app/new-york/westchester'), false);
assert.equal(existsSync('app/new-york/buffalo'), false);
assert.equal(existsSync('app/new-york/rochester'), false);
assert.equal(existsSync('app/new-york/albany'), false);
assert.equal(NEW_YORK_INTELLIGENCE_GATE.path, '/new-york');
assert.equal(NY_PUBLIC_PATH, '/new-york');
assert.equal(NEW_YORK_INTELLIGENCE_GATE.robotsIndex, true);
assert.match(page, /index:\s*true/);
assert.match(page, /follow:\s*true/);
assert.match(page, /canonical/);
assert.match(sitemap, /\/new-york/);
assert.doesNotMatch(sitemap, /\/new-york\//);
assert.match(footer, /\/new-york/);
assert.match(footer, /New York Research/);
assert.match(pkg, /assert:ny-lend-001/);
assert.equal(s.fingerprint, NY_PUBLIC_FINGERPRINT);
assert.match(ui, /151/);
assert.match(ui, /439/);
assert.doesNotMatch(ui, /best mortgage lender/i);
assert.doesNotMatch(ui, /AggregateRating|Trust Score schema/i);
assert.match(ui.toLowerCase(), /trust score/);
assert.match(ui, /Do not add 151 \+ 439/);
assert.match(ui, /Banker != broker/);
assert.match(ui, /Search-only is not zero/);
assert.doesNotMatch(ui, /\/new-york\/manhattan|\/new-york\/brooklyn/);
assert.equal(parseLenderAsk('licensed mortgage bankers in New York').failClosedKind, 'ny-dfs-dated-aggregates');
assert.equal(parseLenderAsk('mortgage brokers in New York').failClosedKind, 'ny-broker-class');
assert.equal(parseLenderAsk('mortgage loan servicers in New York').failClosedKind, 'ny-servicer-class');
assert.equal(parseLenderAsk('mortgage loan officers in New York').failClosedKind, 'ny-mlo-person-grain');
assert.equal(parseLenderAsk('how many lenders are in New York?').failClosedKind, 'ny-no-combined-lenders');
assert.equal(parseLenderAsk('best mortgage lender in New York').failClosedKind, 'ranking');
assert.equal(parseLenderAsk('licensed mortgage lenders in Virginia').mode, 'fail_closed');
assert.equal(parseLenderAsk('licensed mortgage lenders in Colorado').mode, 'fail_closed');
assert.notEqual(parseLenderAsk('mortgage applications in New York').mode, 'fail_closed');
assert.match(parseLenderAsk('licensed mortgage bankers in New York').failReason || '', /NY|New York|NMLS/i);
assert.doesNotMatch(claim, /NYDFS|ny-dfs|new-york-roster/);
assert.match(searchCaps, /new-york-roster/);
assert.equal(nyJsonLdHasForbiddenRatings(buildNewYorkIntelligenceJsonLd(s)), false);
assert.match(JSON.stringify(buildNewYorkIntelligenceJsonLd(s)), /WebPage/);
assert.match(vaUi, /Virginia Mortgage Licensing/);
assert.match(coUi, /Colorado/);
assert.equal(s.expansion_ledger.NET_NEW_CANONICAL_ORGANIZATIONS, 0);
assert.equal(s.claimEligibilityBroadened, false);
const metrics = JSON.parse(readFileSync('data/home/lender-network-metrics-v1.json', 'utf8'));
assert.ok(metrics.network.publishedStateIntelligencePaths.includes('/new-york'));
assert.equal(metrics.identity.institutions, 14623);
assert.equal(metrics.newYork.liveLicensedCompanyUniverse, null);
assert.equal(metrics.newYork.dfs2024Bankers, 151);
console.log('assert:ny-lend-001 pass', s.fingerprint.slice(0, 12));
