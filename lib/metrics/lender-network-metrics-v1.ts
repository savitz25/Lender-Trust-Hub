/**
 * lender-network-metrics-v1
 * Specialist-owned public metric contract. Grains never mix.
 * Missing / unacquired universes stay UNKNOWN — never numeric zero.
 */

export const LENDER_NETWORK_METRICS_VERSION = 'lender-network-metrics-v1' as const;

export type MetricValueState =
  | 'KNOWN'
  | 'UNKNOWN'
  | 'NOT_ACQUIRED'
  | 'PARTIAL'
  | 'REQUEST_ONLY';

export type MetricGrain =
  | 'canonical_institution_entity'
  | 'branch_entity'
  | 'person_mlo_entity'
  | 'person_public_candidate_entity'
  | 'nmls_institution_identifier'
  | 'nmls_branch_identifier'
  | 'nmls_person_identifier'
  | 'lei_identifier'
  | 'fdic_cert_identifier'
  | 'ncua_charter_identifier'
  | 'lpi_snapshot'
  | 'hmda_2025_county_observation'
  | 'hmda_2025_state_slice'
  | 'cfpb_mortgage_complaint_observation'
  | 'federal_enforcement_event'
  | 'florida_ofr_approved_credential'
  | 'florida_confirmed_nmls'
  | 'florida_held_nmls'
  | 'florida_state_regulatory_event'
  | 'florida_public_profile'
  | 'national_render_profile'
  | 'national_index_profile'
  | 'nj_rmla_license_roster'
  | 'nj_dobi_unique_order'
  | 'ca_crmla_live_roster'
  | 'ca_calhfa_directory_row'
  | 'tx_sml_live_roster'
  | 'tx_sml_order'
  | 'wa_dfi_live_roster'
  | 'wa_dfi_enforcement_row'
  | 'published_state_intelligence_page'
  | 'nj_county_intelligence_page'
  | 'servicer_role_evidence_row';

export type PublicationStatus =
  | 'PUBLIC'
  | 'PUBLIC_PARTIAL'
  | 'PUBLIC_UNKNOWN'
  | 'INTERNAL'
  | 'REJECTED';

export type MetricTrace = {
  counts: string;
  doesNotCount: string;
  contributingSourceSystems: string[];
  geographicCoverage: string;
  currentActiveRule?: string;
  sourceDates: string;
  generationDate: string;
  whyUnknown?: string;
};

export type LenderNetworkMetric = {
  key: string;
  label: string;
  value: number | null;
  valueState: MetricValueState;
  unit: 'count';
  grain: MetricGrain;
  denominator: string;
  description: string;
  coverage: string;
  contributingSourceSystems: string[];
  sourceAsOf: string | null;
  generatedAt: string;
  publicationStatus: PublicationStatus;
  trace: MetricTrace;
};

export type HomeIntelSnapshotProjection = {
  snapshotVersion: 'lender-home-intel-snapshot-v2';
  homepagePublicationVersion: 'intel-004-v1';
  generated_at: string;
  retrievedAt: string;
  hmdaOfficialAsOf: string;
  hmdaSourceVintage: string;
  hmdaGrain: string;
  institutions: number;
  lpiSnapshots: number;
  nmlsInstitution: number;
  publicRender: number;
  publicIndex: number;
  floridaPublic: number;
  floridaInternal: number;
  applications: number;
  originations: number;
  denials: number;
  complaints: number;
  complaintsAttached: number;
  complaintsUnattached: number;
  cfpbLabels: number;
  cfpbConfirmedBridges: number;
  depository: { FDIC: number; NCUA: number; NONBANK: number; UNKNOWN: number };
  geography: Array<{ state: string; applications: number; originations: number; denials: number }>;
  graph: {
    branch_entities: number;
    person_mlo_entities: number;
    nmls_branch: number;
    nmls_person: number;
    person_public_candidate: number;
  };
  grains: Record<string, string>;
  source_as_of: Record<string, string>;
  fingerprint: string;
};

export type LenderNetworkMetricsV1 = {
  schemaVersion: typeof LENDER_NETWORK_METRICS_VERSION;
  generatedAt: string;
  newestDocumentedSourceAsOf: string | null;
  newestDocumentedSourceAsOfNote: string;
  sourceFingerprint: string;
  identity: {
    institutions: number;
    branches: number;
    personMlo: number;
    personPublicCandidate: number;
    nmlsInstitution: number;
    nmlsBranch: number;
    nmlsPerson: number;
    lei: number;
    fdicCert: number;
    ncuaCharter: number;
    rssd: number;
    lpiSnapshots: number;
  };
  hmda: {
    year: 2025;
    grain: 'county';
    rows: number;
    applications: number;
    originations: number;
    denials: number;
    stateGrainApplicationsExcluded: number;
  };
  cfpb: {
    complaints: number;
    attached: number;
    unattached: number;
    labels: number;
    confirmedBridges: number;
    observed: string;
  };
  enforcement: {
    federalEvents: number;
  };
  florida: {
    approvedCredentials: number;
    confirmedNmls: number;
    heldNmls: number;
    unresolvedSourceCompanyNmls: number;
    stateRegulatoryEvents: number;
    publicProfiles: number;
    ofrSourceAsOf: string;
  };
  newJersey: {
    hmdaApplications: number;
    hmdaOriginations: number;
    dobiUniqueOrders: number;
    rmlaRosterCoverage: 'SOURCE_AVAILABLE_BY_REQUEST';
    statewideRmlaUniverse: null;
    countyIntelligencePages: number;
  };
  california: {
    hmdaApplications: number;
    hmdaOriginations: number;
    calhfaDirectoryRows: number;
    crmlaRosterCoverage: 'SOURCE_NOT_ACQUIRED';
    liveCrmlaUniverse: null;
  };
  texas: {
    hmdaApplications: number;
    hmdaOriginations: number;
    smlOrders: number;
    liveRosterCoverage: 'SOURCE_NOT_ACQUIRED';
    liveLicensedCompanyUniverse: null;
  };
  washington: {
    hmdaApplications: number;
    hmdaOriginations: number;
    dfiEnforcementRows: number;
    liveRosterCoverage: 'SOURCE_NOT_ACQUIRED';
    liveLicensedCompanyUniverse: null;
  };
  publication: {
    nationalRender: number;
    nationalIndex: number;
    floridaPublic: number;
    searchUnion: number;
    searchUnionIsNotNationalHeadline: true;
  };
  network: {
    publishedStateIntelligencePages: number;
    publishedStateIntelligencePaths: string[];
    njCountyIntelligencePages: number;
  };
  rejectedTotals: Array<{ total: string; reason: string }>;
  homeProjection: HomeIntelSnapshotProjection;
  metrics: LenderNetworkMetric[];
};

export function metricByKey(m: LenderNetworkMetricsV1, key: string): LenderNetworkMetric {
  const found = m.metrics.find((row) => row.key === key);
  if (!found) throw new Error(`metric missing: ${key}`);
  return found;
}
