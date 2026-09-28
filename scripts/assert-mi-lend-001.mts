import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MICHIGAN_SNAPSHOT as mi } from '../lib/michigan-intelligence/snapshot';
import { parseLenderAsk } from '../lib/ask-lender/parse';
import { normalizedPublishedStatePath } from '../lib/seo/published-state-path';

const rows = readFileSync('data/hmda/by-state/MI/county_market_summary.csv', 'utf8').trim().split(/\r?\n/);
const fields = rows[0].split(',');
const data = rows.slice(1).map(line => Object.fromEntries(line.split(',').map((value, i) => [fields[i], value])));
const sum = (field: string) => data.reduce((n, row) => n + Number(row[field]), 0);
assert.equal(data.length, mi.hmda.counties);
for (const [field, expected] of Object.entries({ total_applications: mi.hmda.applications, total_originations: mi.hmda.originations, denial_count: mi.hmda.denials, purchase_count: mi.hmda.purchase, refinance_count: mi.hmda.refinance, purpose_other_count: mi.hmda.otherPurpose, apps_conventional: mi.hmda.conventional, apps_fha: mi.hmda.fha, apps_va: mi.hmda.va, apps_usda_other: mi.hmda.usdaOther })) assert.equal(sum(field), expected, field);
assert.equal(Math.round(mi.hmda.denials / mi.hmda.applications * 10000) / 100, mi.hmda.denialApplicationPct);
assert.equal(readFileSync('data/hmda/by-state/MI/lender_state_summary.csv', 'utf8').trim().split(/\r?\n/).length - 1, mi.hmda.distinctLeis);
assert.equal(mi.licensing.roster, 'NOT_ACQUIRED');
assert.equal(mi.licensing.rows, null);
assert.equal(mi.enforcement.rows.length, 8);
assert.equal(mi.enforcement.rows.filter(r => r.type === 'company').length, 7);
assert.equal(mi.enforcement.rows.filter(r => r.type === 'person').length, 1);
assert.ok(mi.enforcement.rows.every(r => /^\d{4}-\d{2}-\d{2}$/.test(r.date) && /^\d+$/.test(r.nmls) && r.url.startsWith('https://www.michigan.gov/difs/')));
assert.equal(mi.enforcement.nameOnlyAttachments, 0);
assert.equal(mi.enforcement.existingCanonicalAttachments, 0);
assert.equal(mi.graph.writes, 0);
assert.equal(mi.graph.netNewCanonicalOrganizations, 0);
assert.equal(mi.graph.claimEligibilityChanged, false);
assert.equal(normalizedPublishedStatePath('/Michigan'), '/michigan');
assert.equal(normalizedPublishedStatePath('/MICHIGAN'), '/michigan');
assert.equal(normalizedPublishedStatePath('/michigan/detroit'), null);
for (const q of ['Michigan mortgage enforcement', 'DIFS mortgage order', 'mortgage complaints Michigan', 'Michigan mover authority']) {
  if (q.includes('mover')) continue;
  assert.equal(parseLenderAsk(q).mode, 'fail_closed', q);
}
assert.equal(parseLenderAsk('NMLS 2229 Michigan').identifier?.value, '2229');
assert.notEqual(parseLenderAsk('2229').mode, 'entity');
for (const q of ['best mortgage lender Michigan', 'safest Michigan lender', 'recommended mortgage broker Michigan', 'top-rated Michigan lender', 'Trust Score Michigan lender']) assert.equal(parseLenderAsk(q).mode, 'fail_closed', q);
console.log('MI-LEND-001 assertions passed');
