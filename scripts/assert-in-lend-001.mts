import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { INDIANA_SNAPSHOT as ind } from '../lib/indiana-intelligence/snapshot';
import evidence from '../lib/indiana-intelligence/evidence.json';
import { parseLenderAsk } from '../lib/ask-lender/parse';
import { countSources } from '../lib/ask-lender/scalar-count';
import { normalizedPublishedStatePath } from '../lib/seo/published-state-path';

// HMDA parity with the accepted 2025 partition (no re-ingestion).
const csv = readFileSync(ind.hmda.source, 'utf8').trim().split(/\r?\n/);
const keys = csv[0]!.split(',');
const records = csv.slice(1).map(line => Object.fromEntries(line.split(',').map((v, i) => [keys[i], v])));
const sum = (key: string) => records.reduce((n, row) => n + Number(row[key]), 0);
assert.equal(records.length, ind.hmda.counties);
assert.ok(records.every(row => row.year === '2025' && row.state === 'IN'));
for (const [field, expected] of Object.entries({ total_applications: ind.hmda.applications, total_originations: ind.hmda.originations, denial_count: ind.hmda.denials, purchase_count: ind.hmda.purchase, refinance_count: ind.hmda.refinance, purpose_other_count: ind.hmda.otherPurpose, apps_conventional: ind.hmda.conventional, apps_fha: ind.hmda.fha, apps_va: ind.hmda.va, apps_usda_other: ind.hmda.usdaOther })) assert.equal(sum(field), expected, field);
assert.equal(Math.round(ind.hmda.denials / ind.hmda.applications * 10000) / 100, ind.hmda.denialApplicationPct);
assert.equal(readFileSync('data/hmda/by-state/IN/lender_state_summary.csv', 'utf8').trim().split(/\r?\n/).length - 1, ind.hmda.distinctLeis);
const published = countSources.publishedStateHmda('IN');
assert.ok(published);
assert.deepEqual([published.applications, published.originations, published.denials], [ind.hmda.applications, ind.hmda.originations, ind.hmda.denials]);

// DFI Mortgage Lender roster: company grain, exact license numbers, no NMLS inference.
const dfi = evidence.dfi;
assert.equal(dfi.listingRows, ind.dfi.mortgageLenderListingRows);
assert.equal(dfi.records.length, ind.dfi.mortgageLenderActiveLicenses);
assert.equal(dfi.records.length, 489);
assert.equal(dfi.records.filter(r => r.state === 'IN').length, ind.dfi.indianaAddressed);
assert.equal(new Set(dfi.records.map(r => r.licenseNumber)).size, dfi.records.length);
assert.equal(new Set(dfi.records.map(r => r.dfiEntityId)).size, dfi.records.length);
assert.ok(dfi.records.every(r => r.licenseClass === 'Mortgage Lender' && r.status === 'Activated' && r.holderGrain === 'company' && r.nmls === null && /^\d+$/.test(r.licenseNumber)));
assert.equal(dfi.rowsWithPrintedNmls, 0);
assert.equal(ind.dfi.exactNmlsBridges, 0);
assert.equal(ind.dfi.rosterClock.retrievedAt, dfi.retrievedAt);
assert.equal(dfi.streetAddressesPublished, 0);
assert.ok(dfi.records.every(r => !('street' in r) && !('phone' in r)));
assert.equal(ind.dfi.mloPersonRoster, 'NOT_ACQUIRED');

// Securities Division: Loan Broker roster not acquired; separate grain from DFI.
for (const k of ['loanBrokerRoster', 'branchRoster', 'mloPersonRoster'] as const) assert.equal(ind.sos[k], 'NOT_ACQUIRED');
assert.equal(ind.sos.verification, 'KNOWN');

// Loan Broker Act orders: company grain, company NMLS only, exact-identifier attachments only.
const lb = evidence.sosLoanBrokerOrders;
assert.equal(lb.indexRows, ind.loanBrokerEnforcement.indexRows);
assert.equal(lb.loanBrokerTagged2022to2026, ind.loanBrokerEnforcement.taggedLoanBroker2022to2026);
assert.equal(lb.taggedButSecuritiesActOnly, ind.loanBrokerEnforcement.taggedButSecuritiesActOnly);
assert.equal(lb.rows.length, ind.loanBrokerEnforcement.loanBrokerActRows);
assert.equal(lb.loanBrokerTagged2022to2026, lb.rows.length + lb.taggedButSecuritiesActOnly);
assert.ok(lb.rows.every(r => r.grain === 'company' && /^\d{5,7}$/.test(r.nmls) && r.statute.includes('23-2.5') && r.scope === 'Indiana-only' && r.indexDate >= '2022-01-01'));
assert.equal(new Set(lb.rows.map(r => r.nmls)).size, lb.rows.length);
assert.equal(lb.rows.filter(r => r.nmls).length, ind.loanBrokerEnforcement.rowsWithPrintedCompanyNmls);
assert.equal(lb.rows.filter(r => r.exactExistingResearchIdentity).length, ind.loanBrokerEnforcement.exactExistingResearchIdentities);
assert.equal(lb.rows.reduce((n, r) => n + r.individualRespondentsWithheld, 0), ind.loanBrokerEnforcement.individualRespondentsWithheld);
assert.equal(ind.loanBrokerEnforcement.publicProfileAdverseAttachments, 0);
assert.equal(ind.loanBrokerEnforcement.nameOnlyAdverseJoins, 0);
assert.equal(lb.retrievedAt, ind.loanBrokerEnforcement.retrievedAt);
// No Loan Broker order respondent is treated as a DFI roster row (exact identifier only; DFI prints no NMLS).
assert.ok(lb.rows.every(r => !dfi.records.some(d => d.nmls === r.nmls)));

// DFI/multistate: multistate total is never an Indiana penalty.
assert.equal(evidence.multistate.length, ind.dfiEnforcement.multistateRows);
assert.equal(evidence.multistate[0]!.nmls, '3013');
assert.ok(evidence.multistate[0]!.indianaPerStatePaymentUsd < evidence.multistate[0]!.multistateTotalUsd);
assert.equal(ind.dfiEnforcement.dfiOrderRows, 'NOT_ACQUIRED');
assert.equal(ind.dfiEnforcement.exactCanonicalAttachments, 0);
assert.equal(ind.complaints.providerRows, 'NOT_ACQUIRED');
assert.equal(ind.dfi.providerExamRows, 'NOT_ACQUIRED');
assert.equal(ind.newCanonicalOrganizations, 0);
assert.equal(ind.graphWrites, 0);
assert.equal(ind.claimEligibilityChanges, 0);

// Person-data guard: individual names from the gitignored raw index/orders never reach committed output.
const page = readFileSync('app/indiana/page.tsx', 'utf8');
const committed = readFileSync('lib/indiana-intelligence/evidence.json', 'utf8') + page + readFileSync('lib/ask-lender/parse.ts', 'utf8');
if (existsSync('data/raw/indiana/sos/admin-actions-index-p1.json')) {
  const index = [1, 2].flatMap(p => JSON.parse(readFileSync(`data/raw/indiana/sos/admin-actions-index-p${p}.json`, 'utf8')).response.data as { cause_name: string; respondents: string }[]);
  const people: string[] = [];
  for (const row of index.filter(r => ['26-0004 CA', '26-0014 CA'].includes(r.cause_name))) people.push(row.respondents.split(',')[0]!.trim());
  const priv = 'data/raw/indiana/private/individuals.txt';
  if (existsSync(priv)) people.push(...readFileSync(priv, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean));
  assert.ok(people.length >= 2);
  // Full names anywhere; surnames after removing company names (a surname can also be a company word).
  let withoutCompanies = committed;
  for (const name of [...lb.rows.map(r => r.respondent), ...dfi.records.flatMap(r => [r.name, r.dba ?? ''])].filter(Boolean).sort((a, b) => b.length - a.length)) withoutCompanies = withoutCompanies.split(name).join(' ');
  for (const person of people) {
    assert.ok(!committed.toLowerCase().includes(person.toLowerCase()), 'person name leaked');
    const surname = person.split(/\s+/).at(-1)!;
    assert.ok(!new RegExp(`\\b${surname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(withoutCompanies), 'person surname leaked');
  }
}

// Publication + routing.
assert.equal(normalizedPublishedStatePath('/Indiana'), '/indiana');
assert.equal(normalizedPublishedStatePath('/indiana/indianapolis'), null);
assert.equal(readFileSync('app/sitemap.ts', 'utf8').match(/path: '\/indiana'/g)?.length, 1);
assert.doesNotMatch(page, /AggregateRating|ratingValue|Trust Score/);
assert.match(page, /NOT_ACQUIRED/);
assert.match(page, /canonical: `\$\{SITE_URL\}\/indiana`/);
assert.match(page, /robots: \{ index: true, follow: true \}/);
const kind = (q: string) => parseLenderAsk(q).failClosedKind;
assert.equal(kind('mortgage lender Indiana'), 'in-dfi-licensing');
assert.equal(kind('mortgage company Indiana'), 'in-dfi-licensing');
assert.equal(kind('mortgage servicer Indiana'), 'in-dfi-licensing');
assert.equal(kind('Indiana DFI mortgage'), 'in-dfi-licensing');
assert.equal(kind('mortgage broker Indiana'), 'in-sos-loan-broker');
assert.equal(kind('loan broker Indiana'), 'in-sos-loan-broker');
assert.equal(kind('Indiana Securities loan broker'), 'in-sos-loan-broker');
assert.equal(kind('mortgage enforcement Indiana'), 'in-mortgage-enforcement');
assert.equal(kind('loan broker enforcement Indiana'), 'in-sos-loan-broker-enforcement');
assert.equal(kind('mortgage complaints Indiana'), 'in-complaints');
for (const c of ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend']) assert.equal(kind(`mortgage lender ${c}`), 'in-city-context', c);
for (const q of ['HMDA Indiana', 'mortgage applications Indiana', 'mortgage originations Indiana', 'mortgage denials Indiana']) assert.equal(parseLenderAsk(q).mode, 'count', q);
for (const q of ['NMLS 1660690 Indiana', 'NMLS 3013 Indiana with mover and insurance', 'NMLS 3013 Indiana contractor senior investor']) assert.equal(parseLenderAsk(q).mode, 'entity', q);
assert.notEqual(parseLenderAsk('1660690').mode, 'entity');
assert.equal(kind('mortgage lender 123456 Indiana'), 'in-untyped-number');
for (const q of ['best lender', 'safest lender', 'recommended lender', 'most trustworthy lender', 'highest-rated lender', 'top-rated lender', '#1 lender', 'number one lender', 'Trust Score lender', 'AggregateRating lender', 'ratingValue lender', 'paid ranking lender', 'sponsored ranking lender']) assert.equal(parseLenderAsk(`${q} Indiana`).mode, 'fail_closed', q);
// Prior-state regressions.
assert.equal(kind('mortgage lender Wisconsin'), 'wi-dfi-licensing');
assert.equal(parseLenderAsk('mortgage lender Maryland').mode, 'fail_closed');
assert.equal(parseLenderAsk('mortgage lender Connecticut').mode, 'fail_closed');
assert.equal(parseLenderAsk('mortgage lender Michigan').mode, 'entity');
assert.ok(readdirSync('app').includes('indiana'));
console.log('IN-LEND-001 PASS');
