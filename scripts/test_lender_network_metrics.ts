import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  computeLenderNetworkMetrics,
  type LenderNetworkMetricsInput,
} from '../lib/metrics/compute-lender-network-metrics';
import { metricByKey } from '../lib/metrics/lender-network-metrics-v1';

function baseInput(over: Partial<LenderNetworkMetricsInput> = {}): LenderNetworkMetricsInput {
  return {
    generatedAt: '2026-09-03T22:00:00.000Z',
    institutions: 14623,
    branches: 6682,
    personMlo: 136763,
    personPublicCandidate: 0,
    nmlsInstitution: 6641,
    nmlsBranch: 6683,
    nmlsPerson: 136763,
    lei: 4715,
    fdicCert: 5377,
    ncuaCharter: 1096,
    rssd: 8100,
    lpiSnapshots: 8447,
    depository: { FDIC: 5371, NCUA: 1096, NONBANK: 341, UNKNOWN: 1639 },
    hmdaRows: 418078,
    hmdaApplications: 11529787,
    hmdaOriginations: 6793253,
    hmdaDenials: 2008514,
    hmdaStateGrainApplications: 11648144,
    geography: [
      { state: 'CA', applications: 1010547, originations: 569218, denials: 174475 },
      { state: 'FL', applications: 922758, originations: 489025, denials: 192366 },
      { state: 'NJ', applications: 316994, originations: 177325, denials: 55453 },
      { state: 'XX', applications: 9279488, originations: 5557685, denials: 1586120 },
    ],
    complaints: 458146,
    complaintsAttached: 195368,
    complaintsUnattached: 262778,
    cfpbLabels: 2499,
    cfpbBridges: 74,
    cfpbObserved: '2026-08-26',
    federalEnforcementEvents: 17655,
    flApprovedCredentials: 6392,
    flConfirmedNmls: 6265,
    flHeldNmls: 22,
    flSre: 2515,
    flOfrSourceAsOf: '2026-08-27',
    flUnresolvedSourceCompanyNmls: 3907,
    flStateGrainApplications: 927616,
    publicRender: 181,
    publicIndex: 180,
    floridaPublic: 130,
    publishedStateIntelligencePaths: ['/florida', '/new-jersey', '/california'],
    njCountyIntelligencePages: 4,
    njHmdaApplications: 318529,
    njHmdaOriginations: 177325,
    njDobiUniqueOrders: 453,
    njRmlaRosterCoverage: 'SOURCE_AVAILABLE_BY_REQUEST',
    njDobiSourceAsOf: '2026-09-02',
    caHmdaApplications: 1014489,
    caHmdaOriginations: 569218,
    caCalhfaDirectoryRows: 1414,
    caCrmlaRosterCoverage: 'SOURCE_NOT_ACQUIRED',
    caCalhfaSourceAsOf: '2026-09-03',
    servicerEvidenceRows: 10,
    licensesTotal: 164965,
    ...over,
  };
}

describe('lender-network-metrics-v1 grain safety', () => {
  it('keeps institution, NMLS, branch, MLO, and public-profile grains apart', () => {
    const m = computeLenderNetworkMetrics(baseInput());
    assert.equal(metricByKey(m, 'lenders_lending_institutions').value, 14623);
    assert.equal(metricByKey(m, 'nmls_institution_identifiers').value, 6641);
    assert.notEqual(metricByKey(m, 'lenders_lending_institutions').value, metricByKey(m, 'nmls_institution_identifiers').value);
    assert.notEqual(metricByKey(m, 'lenders_lending_institutions').value, metricByKey(m, 'branch_entities').value);
    assert.notEqual(metricByKey(m, 'lenders_lending_institutions').value, metricByKey(m, 'person_mlo_entities').value);
    assert.notEqual(metricByKey(m, 'lenders_lending_institutions').value, metricByKey(m, 'public_national_render_profiles').value);
    assert.equal(metricByKey(m, 'person_public_candidate').value, 0);
    assert.throws(() => computeLenderNetworkMetrics(baseInput({ personPublicCandidate: 1 })), /person_public_candidate/);
    assert.throws(() => computeLenderNetworkMetrics(baseInput({ nmlsInstitution: 14623 })), /NMLS institution/);
  });

  it('does not mix HMDA county and state grains or close the action funnel', () => {
    const m = computeLenderNetworkMetrics(baseInput());
    assert.equal(m.hmda.applications, 11529787);
    assert.notEqual(m.hmda.applications, m.hmda.stateGrainApplicationsExcluded);
    assert.notEqual(m.hmda.originations + m.hmda.denials, m.hmda.applications);
    assert.throws(() => computeLenderNetworkMetrics(baseInput({ hmdaStateGrainApplications: 11529787 })), /county-grain/);
  });

  it('does not convert NJ RMLA or CA CRMLA missing universes to zero', () => {
    const m = computeLenderNetworkMetrics(baseInput());
    assert.equal(metricByKey(m, 'nj_rmla_license_roster').value, null);
    assert.equal(metricByKey(m, 'nj_rmla_license_roster').valueState, 'REQUEST_ONLY');
    assert.equal(metricByKey(m, 'ca_crmla_live_roster').value, null);
    assert.equal(metricByKey(m, 'ca_crmla_live_roster').valueState, 'NOT_ACQUIRED');
    assert.match(metricByKey(m, 'nj_rmla_license_roster').trace.whyUnknown ?? '', /never render as zero/i);
    assert.match(metricByKey(m, 'ca_crmla_live_roster').trace.whyUnknown ?? '', /not bulk-acquired/i);
  });

  it('keeps Florida OFR credentials, confirmed NMLS, held, unresolved, and public cohort apart', () => {
    const m = computeLenderNetworkMetrics(baseInput());
    assert.equal(m.florida.approvedCredentials, 6392);
    assert.equal(m.florida.confirmedNmls, 6265);
    assert.equal(m.florida.heldNmls, 22);
    assert.equal(m.florida.unresolvedSourceCompanyNmls, 3907);
    assert.equal(m.florida.publicProfiles, 130);
    assert.notEqual(m.florida.heldNmls, m.florida.unresolvedSourceCompanyNmls);
    assert.notEqual(m.florida.confirmedNmls, m.florida.publicProfiles);
    assert.throws(() => computeLenderNetworkMetrics(baseInput({ flHeldNmls: 3907 })), /held NMLS/);
  });

  it('does not mix CFPB complaints with HMDA or federal enforcement', () => {
    const m = computeLenderNetworkMetrics(baseInput());
    assert.equal(metricByKey(m, 'cfpb_mortgage_complaint_observations').value, 458146);
    assert.notEqual(metricByKey(m, 'cfpb_mortgage_complaint_observations').value, metricByKey(m, 'hmda_2025_county_applications').value);
    assert.notEqual(metricByKey(m, 'federal_enforcement_events').value, metricByKey(m, 'cfpb_mortgage_complaint_observations').value);
    assert.equal(m.cfpb.attached + m.cfpb.unattached, m.cfpb.complaints);
  });

  it('uses a consumer label and two clocks', () => {
    const m = computeLenderNetworkMetrics(baseInput());
    assert.equal(metricByKey(m, 'lenders_lending_institutions').label, 'Lenders & lending institutions');
    assert.equal(metricByKey(m, 'lenders_lending_institutions').sourceAsOf, null);
    assert.equal(metricByKey(m, 'florida_ofr_approved_company_credentials').sourceAsOf, '2026-08-27');
    assert.notEqual(metricByKey(m, 'florida_ofr_approved_company_credentials').sourceAsOf, m.generatedAt.slice(0, 10));
    assert.equal(m.newestDocumentedSourceAsOf, '2026-09-03');
    assert.match(m.newestDocumentedSourceAsOfNote, /not Git/i);
  });

  it('requires published FL/NJ/CA paths and does not treat county pages as state pages', () => {
    assert.throws(
      () => computeLenderNetworkMetrics(baseInput({ publishedStateIntelligencePaths: ['/florida'] })),
      /state intelligence path missing/,
    );
    assert.throws(
      () => computeLenderNetworkMetrics(baseInput({ njCountyIntelligencePages: 3 })),
      /NJ county pages/,
    );
  });
});
