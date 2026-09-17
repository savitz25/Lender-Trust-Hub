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
assert.equal(inventory.length, 44);
assert.equal(LENDER_HOMEPAGE_STATE_CARDS.length, 11);
assert.deepEqual(LENDER_HOMEPAGE_STATE_CARDS.map((state) => state.href), ['/florida', '/new-jersey', '/california', '/texas', '/washington', '/arizona', '/colorado', '/virginia', '/new-york', '/illinois', '/oregon']);
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
assert.equal(byKey.get('az_difi_enforcement_unacquired')?.sourceClock, 'Source date not reported');
assert.match(byKey.get('az_difi_enforcement_unacquired')?.doesNotCount ?? '', /Zero orders/);
assert.match(byKey.get('fdic_cert')?.doesNotCount ?? '', /NMLS IDs/);
assert.match(byKey.get('az_programs')?.doesNotCount ?? '', /Eligible borrowers/);
assert.notEqual(byKey.get('az_cfpb')?.sourceClock, byKey.get('az_cfpb')?.retrievedAt);
assert.equal(byKey.get('national_institutions')?.sourceClockLabel, 'Source clock');
assert.equal(byKey.get('fdic_cert')?.sourceClockLabel, 'Source clock');
assert.equal(byKey.get('hmda_applications')?.sourceClockLabel, 'Vintage');

for (const code of ['FL', 'NJ', 'CA', 'TX', 'WA', 'AZ', 'CO', 'VA', 'NY', 'IL']) assert.ok(LENDER_HOMEPAGE_STATE_CARDS.some((state) => state.code === code));
for (const key of ['fl_credentials', 'nj_dobi_orders', 'ca_calhfa_rows', 'tx_sml_orders', 'wa_dfi_orders', 'az_cfpb', 'co_dre_mlo', 'co_cfpb', 'co_company_roster_unacquired', 'va_scc_dated_rows', 'ny_dfs_2024_bankers', 'ny_enforcement', 'ny_live_roster_unacquired', 'il_hmda_apps', 'il_fdic', 'il_live_roster_unacquired']) assert.ok(byKey.has(key), `${key} missing`);
for (const item of inventory) {
  assert.ok(item.grain);
  assert.ok(item.sourceSystem);
  assert.ok(item.acceptedArtifact);
  assert.ok(item.sourceClock);
  assert.ok(['PUBLIC', 'PUBLIC_LIMITATION'].includes(item.publicationStatus));
  assert.ok(item.counts);
  assert.ok(item.doesNotCount);
}
assert.throws(
  () => assertPublicHomepageInventory([{ ...inventory[0], publicationStatus: 'INTERNAL' } as unknown as typeof inventory[number]]),
  /non-public publication status/,
);

for (const state of LENDER_HOMEPAGE_STATE_CARDS) {
  assert.ok(state.sourceClocks.length >= 2);
  for (const clock of state.sourceClocks) {
    assert.doesNotMatch(clock.sourceAsOf ?? '', /retrieved/i);
    assert.doesNotMatch(clock.sourceAsOf ?? '', /varies|accepted .*snapshot/i);
  }
}
const californiaDirectoryClock = LENDER_HOMEPAGE_STATE_CARDS.find((state) => state.code === 'CA')?.sourceClocks.find((clock) => clock.label === 'CalHFA directory');
assert.equal(californiaDirectoryClock?.sourceAsOf, null);
assert.ok(californiaDirectoryClock?.retrievedAt);
const newJerseyEnforcementClock = LENDER_HOMEPAGE_STATE_CARDS.find((state) => state.code === 'NJ')?.sourceClocks.find((clock) => clock.label === 'DOBI enforcement corpus');
assert.equal(newJerseyEnforcementClock?.sourceAsOf, null);
assert.match(newJerseyEnforcementClock?.sourceClock ?? '', /acquired through/);
assert.equal(LENDER_HOMEPAGE_STATE_CARDS.find((state) => state.code === 'AZ')?.sourceClocks.find((clock) => clock.label === 'DIFI enforcement')?.sourceAsOf, null);

assert.equal(inventory.some((item) => /grand total|combined mortgage records/i.test(item.label)), false);
assert.equal(inventory.some((item) => /private|person_mlo_entities|branch_entities/.test(item.key)), false);
assert.doesNotMatch(component, /181 national-searchable|130 Florida-public|Florida, New Jersey, and California have published/);
assert.match(component, /Source date not reported/);
assert.match(component, /Retrieved/);
assert.doesNotMatch(component, /Recently added|Added to TrustHub/);
assert.doesNotMatch(component + JSON.stringify(inventory), /OPEN_HTML_TABLE_DOCUMENTED_NOT_HARVESTED/);
assert.doesNotMatch(component, /<i aria-hidden="true">↔<\/i>/);
assert.doesNotMatch(component, /NMLS institution<\/strong>.*↔.*State license/s);
assert.match(component, /No universal crosswalk/);
for (const semantic of ['NMLS institution ≠ branch NMLS', 'NMLS institution ≠ MLO NMLS', 'HMDA LEI ≠ NMLS ID', 'FDIC CERT ≠ NMLS ID', 'bank ≠ all lenders']) assert.match(component, new RegExp(semantic));
assert.match(component, /Coverage limitation/);
assert.match(component, /No Trust Score\. No ranking\. You decide\./);
assert.doesNotMatch(page + component, /AggregateRating/);
assert.doesNotMatch(page + component, /paid ranking/i);
assert.doesNotMatch(page + component, /trusted lender|approved lender|safe lender|vetted lender|recommended lender/i);

const coloradoCfpbClock = LENDER_HOMEPAGE_STATE_CARDS.find((state) => state.code === 'CO')?.sourceClocks.find((clock) => clock.label === 'CFPB complaints');
assert.equal(coloradoCfpbClock?.sourceAsOf, null);
assert.ok(coloradoCfpbClock?.retrievedAt);
assert.equal(byKey.get('co_company_roster_unacquired')?.value, null);
assert.equal(byKey.get('co_company_roster_unacquired')?.publicationStatus, 'PUBLIC_LIMITATION');
assert.notEqual(byKey.get('co_dre_mlo')?.value, byKey.get('hmda_applications')?.value);
assert.match(byKey.get('co_dre_mlo')?.doesNotCount ?? '', /Lenders/);
assert.equal(byKey.get('ny_live_roster_unacquired')?.value, null);
assert.equal(byKey.get('ny_live_roster_unacquired')?.publicationStatus, 'PUBLIC_LIMITATION');
assert.equal(byKey.get('ny_dfs_2024_bankers')?.value, 151);
assert.equal(byKey.get('ny_enforcement')?.value, 198);
assert.notEqual(byKey.get('ny_dfs_2024_bankers')?.value, byKey.get('ny_enforcement')?.value);
assert.equal(byKey.get('il_live_roster_unacquired')?.value, null);
assert.equal(byKey.get('il_live_roster_unacquired')?.publicationStatus, 'PUBLIC_LIMITATION');
assert.equal(byKey.get('il_hmda_apps')?.value, 394488);
assert.equal(byKey.get('il_fdic')?.value, 387);
assert.notEqual(byKey.get('il_hmda_apps')?.value, byKey.get('il_fdic')?.value);

console.log(`LEND-HOME-003 assertions passed (${inventory.length} public inventory measures, 8 families, ${LENDER_HOMEPAGE_STATE_CARDS.length} states).`);
