import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { count, reconcile } from './reconcile_network_metrics.mjs';
import { projectLenderHomeIntelFromNetworkMetrics } from '../lib/metrics/project-home-intel.ts';
const read = path => readFileSync(path,'utf8');
const m = JSON.parse(read('data/home/lender-network-metrics-v1.json'));
const census = JSON.parse(read('data/home/lender-metric-census-r2-03.json'));
const rows = Object.fromEntries(m.reconciliation.stateMetrics.map(r => [r.key,r]));
test('Florida historical two-credential omission is an exhaustive status transition reconciliation', () => {
  const f = m.reconciliation.florida;
  assert.equal(f.historicalApproved,6394); assert.equal(f.currentApproved,6392);
  assert.equal(f.unexplainedDelta,0);
  assert.equal(f.sourceRows,f.approvedRows+f.explicitOtherStatusRows);
  assert.deepEqual(f.transitions.map(r=>r.license_number),['MBR6248','MBR7249']);
  assert.ok(f.transitions.every(r=>r.previous_status==='Approved' && r.current_status==='Approved - Surrender/Cancellation Requested'));
  assert.equal(f.removedFromExactApproved,2); assert.equal(f.addedToExactApproved,0);
  assert.throws(()=>reconcile(structuredClone(m),{...census,floridaApprovedTransitions:[]}),/Unexplained Florida/);
});
test('accepted states retain activity, person, credential, overlay and enforcement grains', () => {
  for (const [key,value] of Object.entries({ 'co.hmda.applications':260212,'co.hmda.originations':156145,'co.hmda.denials':40435,
    'co.mlo_roster.rows':21865,'co.mlo_roster.active':21584,'co.cfpb.mortgage_complaint_rows':8627,'co.depository.fdic_cert_rows':64,
    'va.scc_roster.rows':1257,'ny.dfs_2024_aggregates.licensed_mortgage_bankers':151,
    'ny.dfs_2024_aggregates.registered_mortgage_brokers':439,'ny.dfs_2024_aggregates.registered_mortgage_loan_servicers':36,
    'ny.dfs_2024_aggregates.licensed_mortgage_loan_originators':9769,'ny.weekly_bulletins.bulletin_count':37,
    'ny.weekly_bulletins.NY_DFS_2026_MORTGAGE_BULLETIN_EVENTS':2318,'ny.enforcement.observation_rows':198,
    'ny.hmda.applications':388207,'ny.hmda.originations':231331,'ny.hmda.denials':76045,'ny.hmda.county_count':62,
    'ny.fdic.institution_rows':118,'il.hmda.applications':394488,'il.hmda.originations':231788,'il.hmda.denials':66742,
    'il.hmda.county_count':102,'il.fdic.institution_rows':387 })) assert.equal(rows[key]?.value,value,key);
  assert.equal(m.identity.institutions,census.identity.institutions);
  assert.match(rows['co.mlo_roster.rows'].grain,/person/);
  assert.match(rows['ny.enforcement.observation_rows'].grain,/no name-only/);
  assert.equal(rows['ny.dfs_2024_aggregates.licensed_mortgage_bankers'].sourceAsOf,'2024-12-31');
  assert.equal(rows['il.fdic.institution_rows'].sourceAsOf,'2026-06-26');
  assert.equal(rows['il.fdic.institution_rows'].retrievedAt,null);
});
test('unknown is not zero and missing accepted fields fail generation', () => {
  assert.equal(count(0,'valid query'),0); assert.equal(count(null,'search',true),null);
  assert.throws(()=>count(undefined,'missing',true),/Missing/);
  assert.throws(()=>count(null,'acquired'),/Missing/);
  for (const state of ['NY','IL']) {
    assert.equal(rows[`${state.toLowerCase()}.current_roster.count`].value,null);
    const c=m.reconciliation.stateCapabilities.find(r=>r.state===state);
    assert.equal(c.currentCompanyRoster.status,'SEARCH_ONLY'); assert.equal(c.currentCompanyRoster.count,null);
    assert.equal(c.specialistComplete,null);
  }
  assert.throws(()=>reconcile(structuredClone(m),census,path=>{
    if(!path.includes('colorado-intelligence/accepted')) return read(path);
    const d=JSON.parse(read(path));delete d.mlo_roster.active;return JSON.stringify(d);
  }),/Missing or invalid count/);
});
test('state summaries never enter national HMDA or institution arithmetic', () => {
  const result=reconcile(structuredClone(m),census,path=>{
    if(!path.includes('colorado-intelligence/accepted')) return read(path);
    const d=JSON.parse(read(path));d.mlo_roster.rows+=500;d.hmda.applications+=1000;return JSON.stringify(d);
  });
  assert.equal(result.identity.institutions,m.identity.institutions);
  assert.equal(result.hmda.applications,m.hmda.applications);
  assert.equal(result.reconciliation.stateMetrics.find(r=>r.key==='co.hmda.applications').value,261212);
});
test('homepage projects generated metrics and Florida canonical count; no source snapshot overrides', () => {
  const intel=projectLenderHomeIntelFromNetworkMetrics(m);
  assert.deepEqual(intel.evidenceInventory,m.homepage.evidenceInventory);
  assert.deepEqual(intel.stateCards,m.homepage.stateCards);
  assert.equal(intel.evidenceInventory.find(r=>r.key==='fl_credentials').value,m.florida.approvedCredentials);
  assert.equal(intel.stateCards.find(r=>r.code==='FL').highlights[0].value,'6,392');
  assert.doesNotMatch(read('lib/home-intel/evidence-inventory.ts'),/intelligence\/snapshot/);
  assert.doesNotMatch(read('components/home-intel/lender-home-intelligence.tsx'),/Six state/);
});

test('missing servicer table stays unknown; missing required homepage geography fails closed', () => {
  const result = reconcile(structuredClone(m), {...census,servicerTable:false,servicerEvidenceRows:null});
  assert.equal(result.reconciliation.servicerEvidence.value,null);
  const changed=structuredClone(m);changed.homeProjection.geography=changed.homeProjection.geography.filter(r=>r.state!=='FL');
  assert.throws(()=>projectLenderHomeIntelFromNetworkMetrics(changed),/Missing accepted HMDA state partition/);
});
