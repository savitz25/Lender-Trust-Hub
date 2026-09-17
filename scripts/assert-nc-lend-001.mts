import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { parseLenderAsk } from '../lib/ask-lender/parse';
import { executeAskQuery } from '../lib/ask-lender/execute-query';
import homeIntel from '../lib/home-intel/accepted-snapshot.json';
import { NORTH_CAROLINA_INTELLIGENCE_GATE } from '../lib/north-carolina-intelligence/publication';
import { assertNorthCarolinaIntelligence, NC_PUBLIC_FINGERPRINT, NC_PUBLIC_PATH } from '../lib/north-carolina-intelligence/snapshot';
import { buildNorthCarolinaIntelligenceJsonLd, ncJsonLdHasForbiddenRatings } from '../lib/north-carolina-intelligence/jsonld';

const sitemap = readFileSync('app/sitemap.ts', 'utf8');
const page = readFileSync('app/north-carolina/page.tsx', 'utf8');
const ui = readFileSync('components/north-carolina/north-carolina-state-intelligence.tsx', 'utf8');
const pkg = readFileSync('package.json', 'utf8');
const footer = readFileSync('lib/design/lender-design-system.ts', 'utf8');
const claim = readFileSync('lib/customer-integration/eligibility.ts', 'utf8');
const searchCaps = readFileSync('lib/specialist-search/capabilities.ts', 'utf8');

const s = assertNorthCarolinaIntelligence();

assert.equal(existsSync('app/north-carolina/page.tsx'), true);
assert.equal(existsSync('app/north-carolina/charlotte'), false);
assert.equal(existsSync('app/north-carolina/raleigh'), false);
assert.equal(existsSync('app/north-carolina/durham'), false);
assert.equal(NORTH_CAROLINA_INTELLIGENCE_GATE.path, '/north-carolina');
assert.equal(NC_PUBLIC_PATH, '/north-carolina');
assert.equal(NORTH_CAROLINA_INTELLIGENCE_GATE.robotsIndex, true);
assert.match(page, /index:\s*true/);
assert.match(page, /follow:\s*true/);
assert.match(page, /canonical/);
assert.match(sitemap, /\/north-carolina/);
assert.doesNotMatch(sitemap, /\/north-carolina\//);
assert.match(footer, /\/north-carolina/);
assert.match(footer, /North Carolina Research/);
assert.match(pkg, /assert:nc-lend-001/);
assert.equal(s.fingerprint, NC_PUBLIC_FINGERPRINT);
assert.match(ui, /fmtInt\(H\.applications\)/);
assert.match(ui, /fmtInt\(H\.originations\)/);
assert.match(ui, /denials_as_pct_of_total_applications/);
assert.match(ui, /NMLS Consumer Access/);
assert.match(ui, /NCHFA/);
assert.match(ui, /mortgage loan originator|MLO/i);
assert.match(ui, /Mortgage Servicer|servicer/i);
assert.match(ui, /preferred loan officer/i);
assert.doesNotMatch(ui, /denial_rate_pct/);
assert.doesNotMatch(ui, /best mortgage lender/i);
assert.doesNotMatch(ui, /AggregateRating|Trust Score schema/i);
assert.match(ui.toLowerCase(), /trust score/);
assert.doesNotMatch(ui, /\/north-carolina\/charlotte|\/north-carolina\/raleigh/);
assert.doesNotMatch(ui, /\bOregon\b|\bDFR\b|\bOHCS\b|\bIDFPR\b|\bNYDFS\b|\bDoBS\b|\bPHFA\b/);
assert.equal(parseLenderAsk('how many lenders North Carolina').failClosedKind, 'nc-no-combined-lenders');
assert.equal(parseLenderAsk('licensed mortgage lender North Carolina').failClosedKind, 'nc-nccob-lender-class');
assert.equal(parseLenderAsk('best mortgage lender North Carolina').failClosedKind, 'ranking');
assert.notEqual(parseLenderAsk('HMDA applications North Carolina 2025').mode, 'fail_closed');
assert.equal(parseLenderAsk('CFPB mortgage complaints North Carolina').failClosedKind, 'nc-cfpb-observations');
assert.equal(parseLenderAsk('mortgage loan originator North Carolina').failClosedKind, 'nc-mlo-matching');
assert.equal(parseLenderAsk('mortgage servicer North Carolina').failClosedKind, 'nc-servicer-class');
assert.equal(parseLenderAsk('North Carolina mortgage broker').failClosedKind, 'nc-broker-class');
assert.equal(parseLenderAsk('NCHFA participating lenders').failClosedKind, 'nc-nchfa-program');
assert.equal(parseLenderAsk('North Carolina NCCOB mortgage enforcement').failClosedKind, 'nc-nccob-orders');
assert.equal(parseLenderAsk('mortgage lender Charlotte').failClosedKind, 'nc-no-local');
assert.equal(parseLenderAsk('mortgage lender Raleigh').failClosedKind, 'nc-no-local');
assert.doesNotMatch(claim, /nc-nccob|nc-nmls/);
assert.match(searchCaps, /north-carolina-roster/);
assert.equal(ncJsonLdHasForbiddenRatings(buildNorthCarolinaIntelligenceJsonLd(s)), false);
assert.equal(s.expansion_ledger.NET_NEW_CANONICAL_ORGANIZATIONS, 0);
assert.equal(s.expansion_ledger.GRAPH_WRITES, 0);
assert.equal(s.expansion_ledger.CLAIM_ELIGIBILITY_BROADENED, false);
const metrics = JSON.parse(readFileSync('data/home/lender-network-metrics-v1.json', 'utf8'));
assert.ok(metrics.network.publishedStateIntelligencePaths.includes('/north-carolina'));
assert.equal(metrics.northCarolina.liveLicensedCompanyUniverse, null);
assert.equal(metrics.northCarolina.hmdaApplications, 484454);

const genericNcApps = homeIntel.geography.find((row) => row.state === 'NC')?.applications;
const appQueries = [
  'How many mortgage applications were reported for North Carolina properties in 2025?',
  'HMDA applications North Carolina 2025',
  'mortgage applications in North Carolina',
];
for (const q of appQueries) {
  const result = executeAskQuery({ q });
  assert.equal(result.countEvidence?.value, s.hmda.applications, q);
  assert.equal(result.countEvidence?.field, 'applications', q);
  assert.equal(result.countEvidence?.sourceFile, 'lib/north-carolina-intelligence/accepted-snapshot.json', q);
  assert.notEqual(result.countEvidence?.value, genericNcApps, `Ask must not reuse the LEI-cell rollup for ${q}`);
}
const origs = executeAskQuery({ q: 'HMDA originations North Carolina 2025' });
assert.equal(origs.countEvidence?.value, 279735);
const denials = executeAskQuery({ q: 'HMDA denials North Carolina 2025' });
assert.equal(denials.countEvidence?.value, 86923);
const licensed = executeAskQuery({ q: 'How many lenders are licensed in North Carolina?' });
assert.equal(licensed.failClosed, true);
assert.ok(['nc-no-combined-lenders', 'nc-nccob-lender-class'].includes(licensed.failClosedKind ?? licensed.query.failClosedKind ?? ''));
assert.equal(licensed.countEvidence?.value ?? null, null);
const nmls = executeAskQuery({ q: 'NMLS 30 30 North Carolina' });
assert.equal(nmls.rows?.[0]?.nmls, '3030');
assert.equal(s.fingerprint, '95cc55e2092335c30698c676c67eb6ca0559a7a4dc33a68ce8e82bf4cfe6c10d');
console.log('assert:nc-lend-001 pass', s.fingerprint.slice(0, 12));
