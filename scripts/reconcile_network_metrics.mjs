import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { buildLenderHomepageEvidenceInventory, buildLenderHomepageStateCards } from '../lib/metrics/build-homepage-projection.ts';

const states = { FL: 'florida', NJ: 'new-jersey', CA: 'california', TX: 'texas', WA: 'washington', AZ: 'arizona', CO: 'colorado', VA: 'virginia', NY: 'new-york', IL: 'illinois' };
export function count(value, path, nullable = false) {
  if (value === null && nullable) return null;
  assert.ok(Number.isSafeInteger(value) && value >= 0, `Missing or invalid count: ${path}`);
  return value;
}
export function reconcile(manifest, census, read = (path) => readFileSync(path, 'utf8')) {
  const acceptedSources = [];
  const source = (path) => {
    const bytes = read(path).replace(/\r\n/g, "\n");
    acceptedSources.push({ path, sha256: createHash('sha256').update(bytes).digest('hex') });
    return JSON.parse(bytes);
  };
  const censusPath = 'data/home/lender-metric-census-r2-03.json';
  source(censusPath);
  const snapshots = Object.fromEntries(Object.entries(states).map(([state, slug]) => [state, source(`lib/${slug}-intelligence/accepted-snapshot.json`)]));
  const historic = snapshots.FL.licensing.approved_credentials;
  const transitions = census.floridaApprovedTransitions;
  assert.equal(new Set(transitions.map(r => r.license_number)).size, transitions.length, 'Duplicate Florida transitions');
  const removed = transitions.filter(r => r.previous_status === 'Approved' && r.current_status !== 'Approved').length;
  const added = transitions.filter(r => r.previous_status !== 'Approved' && r.current_status === 'Approved').length;
  const current = count(census.florida.approved_credentials, 'FL Approved');
  const delta = historic - removed + added - current;
  assert.equal(delta, 0, 'Unexplained Florida snapshot-to-ledger delta');
  const partition = census.floridaStatusPartition;
  const partitionApproved = partition.filter(r => r.ofr_status === 'Approved').reduce((n,r) => n + count(r.rows, 'FL status rows'), 0);
  assert.equal(partitionApproved, current, 'Florida exact Approved partition');
  const sourceRows = partition.reduce((n,r) => n + count(r.rows, 'FL source rows'), 0);
  assert.equal(manifest.florida.approvedCredentials, current);
  assert.equal(manifest.cfpb.complaints, census.cfpb.attached + census.cfpb.unattached);
  assert.equal(manifest.hmda.applications, census.geography.reduce((n,r) => n+r.applications, 0));
  const stateMetrics = [];
  function add(state, field, grain, clockField = field.split('.')[0], status = 'STATE_SOURCE_LIVE', nullable = false) {
    const snap = snapshots[state];
    const value = field.split('.').reduce((v,k) => v?.[k], snap);
    const clock = clockField.split('.').reduce((v,k) => v?.[k], snap);
    stateMetrics.push({ key: `${state.toLowerCase()}.${field}`, state, value: count(value, `${state}.${field}`, nullable), grain,
      sourceArtifact: `lib/${states[state]}-intelligence/accepted-snapshot.json`, sourceField: field,
      sourceAsOf: clock?.source_as_of ?? null, snapshotAsOf: snap.snapshot_as_of ?? null,
      retrievedAt: clock?.retrieved_at ?? null, generatedAt: snap.generated_at ?? null,
      capabilityStatus: status, aggregation: 'SEPARATE_SOURCE_POPULATION_DO_NOT_ADD_TO_NATIONAL' });
  }
  for (const state of ['CO','VA','NY','IL']) {
    for (const [field, grain] of [['applications','HMDA application observations'],['originations','HMDA origination observations'],['denials','HMDA denial observations'],['county_count','county summary rows']]) {
      add(state, `hmda.${field}`, grain, 'hmda', 'FEDERAL_BASELINE');
    }
  }
  add('CO','mlo_roster.rows','Colorado DRE MLO person-license rows');
  add('CO','mlo_roster.active','Active Colorado DRE MLO person-license rows');
  add('CO','mlo_roster.unique_license_numbers','Distinct Colorado DRE MLO person-license numbers');
  add('CO','cfpb.mortgage_complaint_rows','CFPB mortgage complaint observations','cfpb','FEDERAL_BASELINE');
  add('CO','depository.fdic_cert_rows','FDIC CERT overlay rows','depository','FEDERAL_BASELINE');
  for (const field of ['rows','brokers','lenders','lender_brokers','exact_va_to_nmls_crosswalks']) {
    add('VA',`scc_roster.${field}`, field === 'exact_va_to_nmls_crosswalks' ? 'Exact printed VA MC to NMLS bridges' : `Dated 2025-12-31 SCC ${field} license-list rows`);
  }
  for (const [field,grain] of [['licensed_mortgage_bankers','Dated mortgage banker class aggregate'],['registered_mortgage_brokers','Dated mortgage broker class aggregate'],['registered_mortgage_loan_servicers','Dated mortgage servicer class aggregate'],['licensed_mortgage_loan_originators','Dated MLO person class aggregate']]) add('NY',`dfs_2024_aggregates.${field}`,grain);
  add('NY','weekly_bulletins.bulletin_count','NYDFS bulletin issues');
  add('NY','weekly_bulletins.NY_DFS_2026_MORTGAGE_BULLETIN_EVENTS','NYDFS mortgage-activity observations');
  add('NY','enforcement.observation_rows','NYDFS enforcement observations; no name-only NMLS attachment');
  for (const state of ['NY','IL']) {
    add(state,'fdic.institution_rows','FDIC bank overlay observations','fdic','FEDERAL_BASELINE');
    add(state,'current_roster.count','Current state mortgage-company bulk roster','current_roster','SEARCH_ONLY',true);
  }
  const stateCapabilities = census.geography.map(({state}) => {
    const slug = states[state];
    return { state, route: slug ? `/${slug}` : null, routeExists: Boolean(slug),
      stateSourceAcquired: ['FL','NJ','CA','TX','WA','CO','VA','NY'].includes(state), specialistComplete: null,
      currentCompanyRoster: { grain: state === 'FL' ? 'Exact Approved MBR/MLD company-credential rows; not unique organizations' : 'Current state mortgage-company bulk roster', status: state === 'FL' ? 'STATE_SOURCE_LIVE' : state === 'NJ' ? 'REQUEST_ONLY' : slug ? 'SEARCH_ONLY' : 'UNKNOWN', count: state === 'FL' ? current : null },
      metricKeys: stateMetrics.filter(m => m.state === state).map(m => m.key) };
  });
  const inventory = buildLenderHomepageEvidenceInventory(manifest);
  for (const row of inventory) count(row.value, row.key, row.publicationStatus === 'PUBLIC_LIMITATION');
  const cards = buildLenderHomepageStateCards(manifest);
  assert.deepEqual(cards.map(c => c.href).sort(), [...manifest.network.publishedStateIntelligencePaths].sort());
  manifest.contractRevision = 'ATH-METRICS-R2-03';
  manifest.homepage = { evidenceInventory: inventory, stateCards: cards };
  manifest.reconciliation = {
    acceptedSources, stateMetrics, stateCapabilities,
    stateSourceAcquiredDefinition: "Acquired state licensing/regulatory evidence; excludes federal geography and housing-program context.",
    servicerEvidence: { value: count(census.servicerEvidenceRows, "servicer evidence", census.servicerTable === false), tableAcquired: census.servicerTable, grain: "servicer role evidence row", publicationStatus: "INTERNAL" },
    florida: { sameGrain: true, historicalApproved: historic, currentApproved: current,
      removedFromExactApproved: removed, addedToExactApproved: added, unexplainedDelta: delta,
      predicate: "jurisdiction='FL' AND license_class IN ('MBR','MLD') AND ofr_status='Approved'",
      sourceRows, approvedRows: current, explicitOtherStatusRows: sourceRows-current,
      transitions, statusPartition: partition, sourceClocks: census.floridaSourceClocks },
    nationalCensus: { path: censusPath, retrievedAt: census.retrievedAt, sourceAsOf: null },
    hmdaPopulationRule: 'National totals use lender_hmda_observations county-by-LEI rows. Accepted state intelligence uses committed county market summaries; these inputs differ (including CO applications/denials). Preserve both; never add state summaries to national totals or silently replace either input.'
  };
  manifest.homeProjection.retrievedAt = census.retrievedAt;
  return manifest;
}
