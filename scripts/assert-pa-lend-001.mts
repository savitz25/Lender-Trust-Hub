import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { parseLenderAsk } from '../lib/ask-lender/parse';
import { executeAskQuery } from '../lib/ask-lender/execute-query';
import homeIntel from '../lib/home-intel/accepted-snapshot.json';
import { PENNSYLVANIA_INTELLIGENCE_GATE } from '../lib/pennsylvania-intelligence/publication';
import { assertPennsylvaniaIntelligence, PA_PUBLIC_FINGERPRINT, PA_PUBLIC_PATH } from '../lib/pennsylvania-intelligence/snapshot';
import { buildPennsylvaniaIntelligenceJsonLd, paJsonLdHasForbiddenRatings } from '../lib/pennsylvania-intelligence/jsonld';

const sitemap = readFileSync('app/sitemap.ts', 'utf8');
const page = readFileSync('app/pennsylvania/page.tsx', 'utf8');
const ui = readFileSync('components/pennsylvania/pennsylvania-state-intelligence.tsx', 'utf8');
const pkg = readFileSync('package.json', 'utf8');
const footer = readFileSync('lib/design/lender-design-system.ts', 'utf8');
const claim = readFileSync('lib/customer-integration/eligibility.ts', 'utf8');
const searchCaps = readFileSync('lib/specialist-search/capabilities.ts', 'utf8');

const s = assertPennsylvaniaIntelligence();

assert.equal(existsSync('app/pennsylvania/page.tsx'), true);
assert.equal(existsSync('app/pennsylvania/philadelphia'), false);
assert.equal(existsSync('app/pennsylvania/pittsburgh'), false);
assert.equal(PENNSYLVANIA_INTELLIGENCE_GATE.path, '/pennsylvania');
assert.equal(PA_PUBLIC_PATH, '/pennsylvania');
assert.equal(PENNSYLVANIA_INTELLIGENCE_GATE.robotsIndex, true);
assert.match(page, /index:\s*true/);
assert.match(page, /follow:\s*true/);
assert.match(page, /canonical/);
assert.match(sitemap, /\/pennsylvania/);
assert.doesNotMatch(sitemap, /\/pennsylvania\//);
assert.match(footer, /\/pennsylvania/);
assert.match(footer, /Pennsylvania Research/);
assert.match(pkg, /assert:pa-lend-001/);
assert.equal(s.fingerprint, PA_PUBLIC_FINGERPRINT);
assert.match(ui, /fmtInt\(H\.applications\)/);
assert.match(ui, /fmtInt\(H\.originations\)/);
assert.match(ui, /denials_as_pct_of_total_applications/);
assert.match(ui, /NMLS Consumer Access/);
assert.match(ui, /PHFA participating lenders/);
assert.match(ui, /mortgage loan originators|Mortgage Originator/i);
assert.match(ui, /Mortgage Servicing|servicer/i);
assert.doesNotMatch(ui, /denial_rate_pct/);
assert.doesNotMatch(ui, /best mortgage lender/i);
assert.doesNotMatch(ui, /AggregateRating|Trust Score schema/i);
assert.match(ui.toLowerCase(), /trust score/);
assert.doesNotMatch(ui, /\/pennsylvania\/philadelphia|\/pennsylvania\/pittsburgh/);
assert.doesNotMatch(ui, /\bOregon\b|\bDFR\b|\bOHCS\b|\bIDFPR\b|\bNYDFS\b/);
assert.equal(parseLenderAsk('licensed mortgage lender Pennsylvania').failClosedKind, 'pa-nmls-search-only');
assert.equal(parseLenderAsk('how many lenders Pennsylvania').failClosedKind, 'pa-no-combined-lenders');
assert.equal(parseLenderAsk('best mortgage lender Pennsylvania').failClosedKind, 'ranking');
assert.notEqual(parseLenderAsk('HMDA applications Pennsylvania 2025').mode, 'fail_closed');
assert.equal(parseLenderAsk('CFPB mortgage complaints Pennsylvania').failClosedKind, 'pa-cfpb-observations');
assert.equal(parseLenderAsk('mortgage loan originator Pennsylvania').failClosedKind, 'pa-mlo-search-only');
assert.equal(parseLenderAsk('mortgage servicer Pennsylvania').failClosedKind, 'pa-servicer-search-only');
// TH-DISCOVERY-PARITY-001A: bare "Pennsylvania mortgage broker" now defaults to DISCOVERY.
assert.equal(parseLenderAsk('Pennsylvania mortgage broker').mode, 'entity');
assert.equal(parseLenderAsk('PHFA participating lenders').failClosedKind, 'pa-phfa-program');
assert.equal(parseLenderAsk('Pennsylvania DoBS mortgage enforcement').failClosedKind, 'pa-dobs-orders');
// TH-DISCOVERY-PARITY-001A: the Pennsylvania-specific "pa-no-local" gate (which hard-
// refused the bare mention of Philadelphia/Pittsburgh/Allegheny/Montgomery) was removed
// -- it blocked ordinary discovery queries. These now default to DISCOVERY like every
// other city/state combination, returning real state-grain institution results.
assert.equal(parseLenderAsk('mortgage lender Philadelphia').mode, 'entity');
assert.equal(parseLenderAsk('mortgage lender Pittsburgh').mode, 'entity');
assert.doesNotMatch(claim, /pa-open-data|pa-dobs-nmls/);
assert.match(searchCaps, /pennsylvania-roster/);
assert.equal(paJsonLdHasForbiddenRatings(buildPennsylvaniaIntelligenceJsonLd(s)), false);
assert.equal(s.expansion_ledger.NET_NEW_CANONICAL_ORGANIZATIONS, 0);
assert.equal(s.expansion_ledger.GRAPH_WRITES, 0);
assert.equal(s.expansion_ledger.CLAIM_ELIGIBILITY_BROADENED, false);
const metrics = JSON.parse(readFileSync('data/home/lender-network-metrics-v1.json', 'utf8'));
assert.ok(metrics.network.publishedStateIntelligencePaths.includes('/pennsylvania'));
assert.equal(metrics.pennsylvania.liveLicensedCompanyUniverse, null);
assert.equal(metrics.pennsylvania.hmdaApplications, 444887);

const genericPaApps = homeIntel.geography.find((row) => row.state === 'PA')?.applications;
const appQueries = [
  'How many mortgage applications were reported for Pennsylvania properties in 2025?',
  'HMDA applications Pennsylvania 2025',
  'mortgage applications in Pennsylvania',
];
for (const q of appQueries) {
  const result = executeAskQuery({ q });
  assert.equal(result.countEvidence?.value, s.hmda.applications, q);
  assert.equal(result.countEvidence?.field, 'applications', q);
  assert.equal(result.countEvidence?.sourceFile, 'lib/pennsylvania-intelligence/accepted-snapshot.json', q);
  assert.notEqual(result.countEvidence?.value, genericPaApps, `Ask must not reuse the LEI-cell rollup for ${q}`);
}
const origs = executeAskQuery({ q: 'HMDA originations Pennsylvania 2025' });
assert.equal(origs.countEvidence?.value, 271254);
const denials = executeAskQuery({ q: 'HMDA denials Pennsylvania 2025' });
assert.equal(denials.countEvidence?.value, 80570);
const licensed = executeAskQuery({ q: 'How many lenders are licensed in Pennsylvania?' });
assert.equal(licensed.failClosed, true);
assert.ok(['pa-no-combined-lenders', 'pa-nmls-search-only'].includes(licensed.failClosedKind ?? licensed.query.failClosedKind ?? ''));
assert.equal(licensed.countEvidence?.value ?? null, null);
const nmls = executeAskQuery({ q: 'NMLS 30 30 Pennsylvania' });
assert.equal(nmls.rows?.[0]?.nmls, '3030');
assert.equal(s.fingerprint, '32c420aaf3dd2672a6b73774df8f567ddf6fdb08de9a29b9d95e5f948fe698c2');
console.log('assert:pa-lend-001 pass', s.fingerprint.slice(0, 12));
