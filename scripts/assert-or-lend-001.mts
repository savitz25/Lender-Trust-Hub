import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { parseLenderAsk } from '../lib/ask-lender/parse';
import { executeAskQuery } from '../lib/ask-lender/execute-query';
import homeIntel from '../lib/home-intel/accepted-snapshot.json';
import { OREGON_INTELLIGENCE_GATE } from '../lib/oregon-intelligence/publication';
import { assertOregonIntelligence, OR_PUBLIC_FINGERPRINT, OR_PUBLIC_PATH } from '../lib/oregon-intelligence/snapshot';
import { buildOregonIntelligenceJsonLd, orJsonLdHasForbiddenRatings } from '../lib/oregon-intelligence/jsonld';

const sitemap = readFileSync('app/sitemap.ts', 'utf8');
const page = readFileSync('app/oregon/page.tsx', 'utf8');
const ui = readFileSync('components/oregon/oregon-state-intelligence.tsx', 'utf8');
const pkg = readFileSync('package.json', 'utf8');
const footer = readFileSync('lib/design/lender-design-system.ts', 'utf8');
const claim = readFileSync('lib/customer-integration/eligibility.ts', 'utf8');
const searchCaps = readFileSync('lib/specialist-search/capabilities.ts', 'utf8');

const s = assertOregonIntelligence();

assert.equal(existsSync('app/oregon/page.tsx'), true);
assert.equal(existsSync('app/oregon/portland'), false);
assert.equal(existsSync('app/oregon/multnomah'), false);
assert.equal(OREGON_INTELLIGENCE_GATE.path, '/oregon');
assert.equal(OR_PUBLIC_PATH, '/oregon');
assert.equal(OREGON_INTELLIGENCE_GATE.robotsIndex, true);
assert.match(page, /index:\s*true/);
assert.match(page, /follow:\s*true/);
assert.match(page, /canonical/);
assert.match(sitemap, /\/oregon/);
assert.doesNotMatch(sitemap, /\/oregon\//);
assert.match(footer, /\/oregon/);
assert.match(footer, /Oregon Research/);
assert.match(pkg, /assert:or-lend-001/);
assert.equal(s.fingerprint, OR_PUBLIC_FINGERPRINT);
assert.match(ui, /fmtInt\(H\.applications\)/);
assert.match(ui, /fmtInt\(H\.originations\)/);
assert.match(ui, /fmtInt\(s\.fdic\.institution_rows\)/);
assert.match(ui, /denials_as_pct_of_total_applications/);
assert.match(ui, /DFR mortgage lender licensing/);
assert.match(ui, /NMLS Consumer Access/);
assert.match(ui, /OHCS Flex Lending/);
assert.match(ui, /mortgage loan originators/i);
assert.match(ui, /mortgage servicers/i);
assert.doesNotMatch(ui, /denial_rate_pct/);
assert.doesNotMatch(ui, /retrieved \{s\.retrieved_at\}/);
assert.equal(s.retrieved_at, null);
assert.equal(s.hmda.retrieved_at, null);
assert.equal(s.fdic.retrieved_at, null);
assert.equal(s.hmda.denials_as_pct_of_total_applications, 15.17);
assert.equal(s.hmda.applications, 146902);
assert.equal(s.hmda.originations, 89073);
assert.equal(s.hmda.denials, 22290);
assert.equal(s.hmda.distinct_leis, 629);
assert.equal(s.dfr_orders.OR_DFR_MORTGAGE_ORDER_ROWS, 10);
assert.equal(s.ohcs.OR_OHCS_APPROVED_LENDER_ROWS, 23);
assert.equal(s.current_roster.OR_MORTGAGE_COMPANY_ROWS, null);
assert.equal(s.mlo.OR_MLO_ROWS, null);
assert.equal(s.servicer.OR_MORTGAGE_SERVICER_ROWS, null);
assert.equal(s.cfpb.OR_MORTGAGE_COMPLAINT_OBSERVATIONS, null);
assert.doesNotMatch(ui, /best mortgage lender/i);
assert.doesNotMatch(ui, /AggregateRating|Trust Score schema/i);
assert.match(ui.toLowerCase(), /trust score/);
assert.doesNotMatch(ui, /\/oregon\/portland|\/oregon\/multnomah/);
assert.doesNotMatch(ui, /\bIllinois\b|IL-headquartered|jurisdiction = IL/);
assert.equal(parseLenderAsk('licensed mortgage lenders in Oregon').failClosedKind, 'or-nmls-search-only');
assert.equal(parseLenderAsk('how many lenders are in Oregon?').failClosedKind, 'or-no-combined-lenders');
assert.equal(parseLenderAsk('best mortgage lender in Oregon').failClosedKind, 'ranking');
assert.notEqual(parseLenderAsk('mortgage applications in Oregon').mode, 'fail_closed');
assert.equal(parseLenderAsk('complaints against a lender in Oregon').failClosedKind, 'or-complaints-not-acquired');
assert.equal(parseLenderAsk('mortgage loan originator Oregon').failClosedKind, 'or-mlo-search-only');
assert.equal(parseLenderAsk('mortgage servicer Oregon').failClosedKind, 'or-servicer-search-only');
assert.equal(parseLenderAsk('OHCS approved lender').failClosedKind, 'or-ohcs-program');
assert.equal(parseLenderAsk('Flex Lending Oregon').failClosedKind, 'or-ohcs-program');
assert.equal(parseLenderAsk('Oregon mortgage enforcement').failClosedKind, 'or-dfr-mortgage-orders');
assert.equal(parseLenderAsk('Oregon DFR case M-24-0053').failClosedKind, 'or-dfr-mortgage-orders');
// TH-DISCOVERY-PARITY-001A: the Oregon-specific "or-no-local" gate (which hard-refused
// the bare mention of "Portland"/"Multnomah") was removed -- it blocked ordinary
// discovery queries too. A genuine service-territory claim like this one is now caught
// by the general service-territory guard instead, with the same fail-closed outcome.
assert.equal(parseLenderAsk('Who is serving Portland in Oregon?').failClosedKind, 'service-territory');
assert.equal(parseLenderAsk('licensed mortgage lenders in New York').failClosedKind, 'ny-dfs-dated-aggregates');
assert.doesNotMatch(claim, /oregon-roster|or-dfr-nmls/);
assert.match(searchCaps, /oregon-roster/);
assert.equal(orJsonLdHasForbiddenRatings(buildOregonIntelligenceJsonLd(s)), false);
assert.equal(s.expansion_ledger.NET_NEW_CANONICAL_ORGANIZATIONS, 0);
assert.equal(s.expansion_ledger.GRAPH_WRITES, 0);
assert.equal(s.expansion_ledger.CLAIM_ELIGIBILITY_BROADENED, false);
const metrics = JSON.parse(readFileSync('data/home/lender-network-metrics-v1.json', 'utf8'));
assert.ok(metrics.network.publishedStateIntelligencePaths.includes('/oregon'));
assert.equal(metrics.oregon.liveLicensedCompanyUniverse, null);
assert.equal(metrics.oregon.hmdaApplications, 146902);

const genericOrApps = homeIntel.geography.find((row) => row.state === 'OR')?.applications;
assert.equal(genericOrApps, 145271);
const appQueries = [
  'How many mortgage applications were reported for Oregon properties in 2025?',
  'How many mortgage applications in Oregon in 2025?',
  'HMDA applications in Oregon',
  'mortgage applications in Oregon',
];
for (const q of appQueries) {
  const result = executeAskQuery({ q });
  assert.equal(result.countEvidence?.value, s.hmda.applications, q);
  assert.equal(result.countEvidence?.field, 'applications', q);
  assert.equal(result.countEvidence?.sourceFile, 'lib/oregon-intelligence/accepted-snapshot.json', q);
  assert.notEqual(result.countEvidence?.value, genericOrApps, `Ask must not reuse the LEI-cell rollup for ${q}`);
}
const origs = executeAskQuery({ q: 'How many originations were reported for Oregon properties in 2025?' });
assert.equal(origs.countEvidence?.value, 89073);
assert.equal(origs.countEvidence?.field, 'originations');
const denials = executeAskQuery({ q: 'mortgage denials Oregon 2025' });
assert.equal(denials.countEvidence?.value, 22290);
const licensed = executeAskQuery({ q: 'How many lenders are licensed in Oregon?' });
assert.equal(licensed.failClosed, true);
assert.ok(['or-no-combined-lenders', 'or-nmls-search-only'].includes(licensed.failClosedKind ?? licensed.query.failClosedKind ?? ''));
assert.equal(licensed.countEvidence?.value ?? null, null);
const howMany = executeAskQuery({ q: 'how many lenders in Oregon' });
assert.equal(howMany.failClosed, true);
assert.notEqual(howMany.countEvidence?.value, 146902);
assert.notEqual(howMany.countEvidence?.value, 629);
const vaOr = executeAskQuery({ q: 'VA mortgage applications in Oregon' });
assert.deepEqual(vaOr.query.loanType, ['VA']);
assert.equal(vaOr.query.geography?.state, 'OR');
assert.notEqual(vaOr.query.geography?.state, 'VA');
const nmls = executeAskQuery({ q: 'NMLS 30 30' });
assert.equal(nmls.rows?.[0]?.nmls, '3030');
assert.equal(parseLenderAsk('Best mortgage lender in Oregon').failClosedKind, 'ranking');
assert.equal(s.fingerprint, '8e67c1dced6a6b6e39d291899722baa3d5c4dae91f156b8239f37c0bbc269d66');
console.log('assert:or-lend-001 pass', s.fingerprint.slice(0, 12));
