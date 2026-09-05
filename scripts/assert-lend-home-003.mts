import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import metricsJson from '../data/home/lender-network-metrics-v1.json';
import {
  assertPublicHomepageInventory,
  buildLenderHomepageEvidenceInventory,
  LENDER_EVIDENCE_FAMILY_LABELS,
  LENDER_HOMEPAGE_STATE_CARDS,
} from '../lib/home-intel/evidence-inventory';
import type { LenderNetworkMetricsV1 } from '../lib/metrics/lender-network-metrics-v1';

const metrics = metricsJson as LenderNetworkMetricsV1;
const inventory = buildLenderHomepageEvidenceInventory(metrics);
const byKey = new Map(inventory.map((item) => [item.key, item]));
const component = readFileSync('components/home-intel/lender-home-intelligence.tsx', 'utf8');
const page = readFileSync('app/page.tsx', 'utf8');

assertPublicHomepageInventory(inventory);
assert.equal(LENDER_HOMEPAGE_STATE_CARDS.length, 6);
assert.deepEqual(LENDER_HOMEPAGE_STATE_CARDS.map((state) => state.href), ['/florida', '/new-jersey', '/california', '/texas', '/washington', '/arizona']);
assert.equal(byKey.get('state_pages')?.value, LENDER_HOMEPAGE_STATE_CARDS.length);
assert.equal(new Set(inventory.map((item) => item.family)).size, 8);
assert.equal(Object.keys(LENDER_EVIDENCE_FAMILY_LABELS).length, 8);

assert.equal(byKey.get('hmda_applications')?.grain, 'county-grain HMDA application observation');
assert.match(byKey.get('hmda_applications')?.doesNotCount ?? '', /Lenders/);
assert.match(byKey.get('hmda_denials')?.doesNotCount ?? '', /Misconduct/);
assert.match(byKey.get('cfpb_complaints')?.doesNotCount ?? '', /Proven violations/);
assert.notEqual(byKey.get('wa_dfi_orders')?.value, byKey.get('wa_exact_nmls_orders')?.value);
assert.equal(byKey.get('wa_dfi_orders')?.value, 777);
assert.equal(byKey.get('wa_exact_nmls_orders')?.value, 102);
assert.equal(byKey.get('az_difi_enforcement_unacquired')?.value, null);
assert.equal(byKey.get('az_difi_enforcement_unacquired')?.publicationStatus, 'PUBLIC_LIMITATION');
assert.match(byKey.get('az_difi_enforcement_unacquired')?.doesNotCount ?? '', /Zero orders/);
assert.match(byKey.get('fdic_cert')?.doesNotCount ?? '', /NMLS IDs/);
assert.match(byKey.get('az_programs')?.doesNotCount ?? '', /Eligible borrowers/);
assert.notEqual(byKey.get('az_cfpb')?.sourceAsOf, byKey.get('az_cfpb')?.retrievedOrGeneratedAt);

for (const code of ['FL', 'NJ', 'CA', 'TX', 'WA', 'AZ']) assert.ok(LENDER_HOMEPAGE_STATE_CARDS.some((state) => state.code === code));
for (const key of ['fl_credentials', 'nj_dobi_orders', 'ca_calhfa_rows', 'tx_sml_orders', 'wa_dfi_orders', 'az_cfpb']) assert.ok(byKey.has(key), `${key} missing`);
for (const item of inventory) {
  assert.ok(item.grain);
  assert.ok(item.sourceSystem);
  assert.ok(item.acceptedArtifact);
  assert.ok(item.sourceAsOf);
  assert.ok(item.counts);
  assert.ok(item.doesNotCount);
}

assert.equal(inventory.some((item) => /grand total|combined mortgage records/i.test(item.label)), false);
assert.equal(inventory.some((item) => /private|person_mlo_entities|branch_entities/.test(item.key)), false);
assert.doesNotMatch(component, /181 national-searchable|130 Florida-public|Florida, New Jersey, and California have published/);
assert.match(component, /Source as of/);
assert.doesNotMatch(component, /Recently added|Added to TrustHub/);
assert.match(component, /No Trust Score\. No ranking\. You decide\./);
assert.doesNotMatch(page + component, /AggregateRating/);
assert.doesNotMatch(page + component, /paid ranking/i);
assert.doesNotMatch(page + component, /trusted lender|approved lender|safe lender|vetted lender|recommended lender/i);

console.log(`LEND-HOME-003 assertions passed (${inventory.length} public inventory measures, 8 families, 6 states).`);
