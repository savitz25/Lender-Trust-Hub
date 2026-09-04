import { createHash } from 'node:crypto';
import type {
  LenderNetworkMetric,
  LenderNetworkMetricsV1,
} from './lender-network-metrics-v1';
import { LENDER_NETWORK_METRICS_VERSION } from './lender-network-metrics-v1';

export type LenderNetworkMetricsInput = {
  generatedAt: string;
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
  depository: { FDIC: number; NCUA: number; NONBANK: number; UNKNOWN: number };
  hmdaRows: number;
  hmdaApplications: number;
  hmdaOriginations: number;
  hmdaDenials: number;
  hmdaStateGrainApplications: number;
  geography: Array<{ state: string; applications: number; originations: number; denials: number }>;
  complaints: number;
  complaintsAttached: number;
  complaintsUnattached: number;
  cfpbLabels: number;
  cfpbBridges: number;
  cfpbObserved: string;
  federalEnforcementEvents: number;
  flApprovedCredentials: number;
  flConfirmedNmls: number;
  flHeldNmls: number;
  flSre: number;
  flOfrSourceAsOf: string;
  flUnresolvedSourceCompanyNmls: number;
  flStateGrainApplications: number;
  publicRender: number;
  publicIndex: number;
  floridaPublic: number;
  publishedStateIntelligencePaths: string[];
  njCountyIntelligencePages: number;
  njHmdaApplications: number;
  njHmdaOriginations: number;
  njDobiUniqueOrders: number;
  njRmlaRosterCoverage: 'SOURCE_AVAILABLE_BY_REQUEST';
  njDobiSourceAsOf: string;
  caHmdaApplications: number;
  caHmdaOriginations: number;
  caCalhfaDirectoryRows: number;
  caCrmlaRosterCoverage: 'SOURCE_NOT_ACQUIRED';
  caCalhfaSourceAsOf: string;
  txHmdaApplications: number;
  txHmdaOriginations: number;
  txSmlOrders: number;
  txLiveRosterCoverage: 'SOURCE_NOT_ACQUIRED';
  txSmlSourceAsOf: string;
  waHmdaApplications: number;
  waHmdaOriginations: number;
  waDfiEnforcementRows: number;
  waLiveRosterCoverage: 'SOURCE_NOT_ACQUIRED';
  waDfiSourceAsOf: string;
  servicerEvidenceRows: number;
  licensesTotal: number;
};

function metric(partial: Omit<LenderNetworkMetric, 'unit'>): LenderNetworkMetric {
  return { unit: 'count', ...partial };
}

export function assertGrainSafety(input: LenderNetworkMetricsInput): void {
  if (input.personPublicCandidate !== 0) {
    throw new Error('person_public_candidate must remain 0 — no public MLO PII');
  }
  if (input.institutions === input.nmlsInstitution) {
    throw new Error('institution entities must not equal NMLS institution identifiers');
  }
  if (input.institutions === input.branches) {
    throw new Error('institution entities must not equal branch entities');
  }
  if (input.institutions === input.personMlo) {
    throw new Error('institution entities must not equal person_mlo entities');
  }
  if (input.institutions === input.publicRender) {
    throw new Error('institution universe must not equal the national render cohort');
  }
  if (input.institutions === input.publicRender + input.floridaPublic) {
    throw new Error('search union must not be used as the national institution headline');
  }
  if (input.nmlsInstitution === input.nmlsBranch) {
    throw new Error('NMLS institution identifiers must not equal NMLS branch identifiers');
  }
  if (input.publicIndex > input.publicRender) {
    throw new Error('index cohort cannot exceed render cohort');
  }
  if (input.publicRender + input.floridaPublic !== 311) {
    throw new Error('file-backed search union must remain 181 + 130 = 311');
  }
  if (input.hmdaApplications === input.hmdaStateGrainApplications) {
    throw new Error('county-grain HMDA must not equal state-grain HMDA');
  }
  if (input.hmdaOriginations + input.hmdaDenials === input.hmdaApplications) {
    throw new Error('originations + denials must not be treated as a closed funnel equal to applications');
  }
  if (input.complaintsAttached + input.complaintsUnattached !== input.complaints) {
    throw new Error('attached + unattached CFPB observations must equal stored complaints');
  }
  if (input.complaints === input.hmdaApplications) {
    throw new Error('CFPB complaints must not equal HMDA applications');
  }
  if (input.federalEnforcementEvents === input.complaints) {
    throw new Error('federal enforcement events must not equal CFPB complaints');
  }
  if (input.flConfirmedNmls === input.institutions) {
    throw new Error('Florida confirmed NMLS must not equal the national institution universe');
  }
  if (input.flConfirmedNmls === input.floridaPublic) {
    throw new Error('Florida confirmed NMLS must not equal the Florida public cohort');
  }
  if (input.flApprovedCredentials === input.flConfirmedNmls) {
    throw new Error('Florida OFR credentials must not equal confirmed NMLS identities');
  }
  if (input.flHeldNmls === input.flUnresolvedSourceCompanyNmls) {
    throw new Error('held NMLS (22) must not equal unresolved source-company NMLS (3907)');
  }
  if (input.flHeldNmls === input.institutions) {
    throw new Error('held Florida NMLS must not enter the national institution count');
  }
  const geoApps = input.geography.reduce((n, row) => n + row.applications, 0);
  if (geoApps !== input.hmdaApplications) {
    throw new Error('geography county-grain applications must equal national county-grain applications');
  }
  const depSum =
    input.depository.FDIC + input.depository.NCUA + input.depository.NONBANK + input.depository.UNKNOWN;
  if (depSum !== input.lpiSnapshots) {
    throw new Error('exclusive LPI depository buckets must equal LPI snapshots');
  }
  if (input.fdicCert === input.depository.FDIC && input.fdicCert === input.institutions) {
    throw new Error('FDIC_CERT identifiers must not be used as the institution universe');
  }
  const caCounty = input.geography.find((row) => row.state === 'CA')?.applications ?? 0;
  const njCounty = input.geography.find((row) => row.state === 'NJ')?.applications ?? 0;
  const flCounty = input.geography.find((row) => row.state === 'FL')?.applications ?? 0;
  if (caCounty === input.caHmdaApplications) {
    throw new Error('California county-grain national aggregate must not equal the CA state-intelligence slice');
  }
  if (njCounty === input.njHmdaApplications) {
    throw new Error('New Jersey county-grain national aggregate must not equal the NJ state-intelligence slice');
  }
  if (flCounty === input.flStateGrainApplications) {
    throw new Error('Florida county-grain national aggregate must not equal Florida state-grain HMDA');
  }
  if (input.caCalhfaDirectoryRows === input.caHmdaApplications) {
    throw new Error('CalHFA directory rows must not equal California HMDA applications');
  }
  if (input.njDobiUniqueOrders === input.njHmdaApplications) {
    throw new Error('NJ DOBI orders must not equal New Jersey HMDA applications');
  }
  if (input.servicerEvidenceRows === input.institutions) {
    throw new Error('servicer evidence rows must not equal institutions');
  }
  if (input.licensesTotal === input.institutions) {
    throw new Error('license rows must not equal institutions');
  }
  for (const path of ['/florida', '/new-jersey', '/california', '/texas', '/washington']) {
    if (!input.publishedStateIntelligencePaths.includes(path)) {
      throw new Error(`state intelligence path missing: ${path}`);
    }
  }
  if (input.publishedStateIntelligencePaths.some((p) => p.includes('-county'))) {
    throw new Error('county routes must not be counted as state intelligence pages');
  }
  if (input.njCountyIntelligencePages !== 4) {
    throw new Error('NJ county pages must remain 4');
  }
  if (input.njRmlaRosterCoverage !== 'SOURCE_AVAILABLE_BY_REQUEST') {
    throw new Error('NJ RMLA roster remains request-only');
  }
  if (input.caCrmlaRosterCoverage !== 'SOURCE_NOT_ACQUIRED') {
    throw new Error('CA CRMLA live roster remains not acquired');
  }
  if (input.txLiveRosterCoverage !== 'SOURCE_NOT_ACQUIRED') {
    throw new Error('TX live mortgage-company roster remains not acquired');
  }
  const txCounty = input.geography.find((row) => row.state === 'TX')?.applications ?? 0;
  if (txCounty === input.txHmdaApplications && txCounty !== 0) {
    throw new Error('Texas county-grain national aggregate must not equal the TX state-intelligence slice');
  }
  if (input.txSmlOrders === input.txHmdaApplications) {
    throw new Error('SML orders must not equal Texas HMDA applications');
  }
  if (input.waLiveRosterCoverage !== 'SOURCE_NOT_ACQUIRED') {
    throw new Error('WA live mortgage-company roster remains not acquired');
  }
  if (input.waDfiEnforcementRows === input.waHmdaApplications) {
    throw new Error('DFI enforcement rows must not equal Washington HMDA applications');
  }
}

export function computeLenderNetworkMetrics(input: LenderNetworkMetricsInput): LenderNetworkMetricsV1 {
  assertGrainSafety(input);
  const generatedAt = input.generatedAt;
  const documentedDates = [
    input.cfpbObserved,
    input.flOfrSourceAsOf,
    input.njDobiSourceAsOf,
    input.caCalhfaSourceAsOf,
    input.txSmlSourceAsOf,
    input.waDfiSourceAsOf,
  ]
    .filter(Boolean)
    .map((d) => d.slice(0, 10))
    .sort();
  const newestDocumentedSourceAsOf = documentedDates.at(-1) ?? null;
  const searchUnion = input.publicRender + input.floridaPublic;

  const commonTrace = (
    counts: string,
    doesNotCount: string,
    systems: string[],
    geo: string,
    sourceDates: string,
    extra?: Partial<LenderNetworkMetric['trace']>,
  ) => ({
    counts,
    doesNotCount,
    contributingSourceSystems: systems,
    geographicCoverage: geo,
    sourceDates,
    generationDate: generatedAt.slice(0, 10),
    ...extra,
  });

  const metrics: LenderNetworkMetric[] = [
    metric({
      key: 'lenders_lending_institutions',
      label: 'Lenders & lending institutions',
      value: input.institutions,
      valueState: 'KNOWN',
      grain: 'canonical_institution_entity',
      denominator: "lender_national_entities.entity_kind = 'institution'",
      description:
        'Company identities on the dedicated Lender graph. Not NMLS credentials, branches, MLOs, or public profiles.',
      coverage: 'National identity graph',
      contributingSourceSystems: ['lender_national_entities'],
      sourceAsOf: null,
      generatedAt,
      publicationStatus: 'PUBLIC',
      trace: commonTrace(
        'One lender_national_entities row with entity_kind institution.',
        'Not NMLS IDs, not branches, not MLOs, not the 181/180 public cohort, not the 311 search union.',
        ['lender_national_entities'],
        'National identity graph; headquarters is not service territory',
        'Production graph observation. Not an official NMLS census date, not Git time, not deploy time.',
      ),
    }),
    metric({
      key: 'nmls_institution_identifiers',
      label: 'NMLS institution identifiers',
      value: input.nmlsInstitution,
      valueState: 'KNOWN',
      grain: 'nmls_institution_identifier',
      denominator: "lender_identifiers.identifier_type = 'NMLS_INSTITUTION'",
      description: 'Credential slots on company identities. Not an institution count and not an MLO count.',
      coverage: 'National identity graph',
      contributingSourceSystems: ['lender_identifiers', 'nmls'],
      sourceAsOf: null,
      generatedAt,
      publicationStatus: 'PUBLIC',
      trace: commonTrace(
        'NMLS_INSTITUTION identifier rows.',
        'Not institution entities. Not NMLS person or branch identifiers.',
        ['lender_identifiers'],
        'National',
        'Production graph observation',
      ),
    }),
    metric({
      key: 'branch_entities',
      label: 'Branch identities (internal graph)',
      value: input.branches,
      valueState: 'KNOWN',
      grain: 'branch_entity',
      denominator: "lender_national_entities.entity_kind = 'branch'",
      description: 'Branch identities on the graph. Not public branch pages and not additional lenders.',
      coverage: 'National identity graph',
      contributingSourceSystems: ['lender_national_entities'],
      sourceAsOf: null,
      generatedAt,
      publicationStatus: 'INTERNAL',
      trace: commonTrace(
        'Branch entity rows.',
        'Not lenders. Not Florida OFR branch licenses. Branch address is not service territory.',
        ['lender_national_entities'],
        'National',
        'Production graph observation',
      ),
    }),
    metric({
      key: 'person_mlo_entities',
      label: 'Mortgage loan originator identities (internal graph)',
      value: input.personMlo,
      valueState: 'KNOWN',
      grain: 'person_mlo_entity',
      denominator: "lender_national_entities.entity_kind = 'person_mlo'",
      description: 'Internal person_mlo identities. Not a public MLO directory.',
      coverage: 'National identity graph — unpublished as people pages',
      contributingSourceSystems: ['lender_national_entities'],
      sourceAsOf: null,
      generatedAt,
      publicationStatus: 'INTERNAL',
      trace: commonTrace(
        'person_mlo entity rows.',
        'Not public profiles. Not institution counts. person_public_candidate remains 0.',
        ['lender_national_entities'],
        'National',
        'Production graph observation',
      ),
    }),
    metric({
      key: 'person_public_candidate',
      label: 'Public person-page candidates',
      value: 0,
      valueState: 'KNOWN',
      grain: 'person_public_candidate_entity',
      denominator: "lender_national_entities.entity_kind = 'person_public_candidate'",
      description: 'Policy invariant: no public MLO or person pages. Zero here is a publication rule, not a missing roster.',
      coverage: 'National',
      contributingSourceSystems: ['lender_national_entities'],
      sourceAsOf: null,
      generatedAt,
      publicationStatus: 'PUBLIC',
      trace: commonTrace(
        'Must remain zero public person-page candidates.',
        'Not the internal person_mlo graph.',
        ['lender_national_entities'],
        'National',
        'Publication policy',
        { currentActiveRule: 'person_public_candidate = 0' },
      ),
    }),
    metric({
      key: 'public_national_render_profiles',
      label: 'Publicly researchable national profiles',
      value: input.publicRender,
      valueState: 'KNOWN',
      grain: 'national_render_profile',
      denominator: 'File-backed lend-nat-014 national render cohort',
      description: 'Controlled national publication cohort. Not the 14,623 identity universe.',
      coverage: 'National publication policy',
      contributingSourceSystems: ['lend-nat-014'],
      sourceAsOf: '2026-08-27',
      generatedAt,
      publicationStatus: 'PUBLIC',
      trace: commonTrace(
        'Rows in the frozen national render cohort.',
        'Not the identity graph. Not the 311 search union. Not Florida-only public companies.',
        ['lend-nat-014'],
        'National publication cohort',
        'lend-nat-014 added_at 2026-08-27',
      ),
    }),
    metric({
      key: 'hmda_2025_county_applications',
      label: 'HMDA 2025 county-grain applications',
      value: input.hmdaApplications,
      valueState: 'KNOWN',
      grain: 'hmda_2025_county_observation',
      denominator: "lender_hmda_observations data_year=2025 geo_grain='county' SUM(applications)",
      description: 'Reported HMDA 2025 applications at county grain, summed nationally. State-grain rows are excluded.',
      coverage: 'United States county-grain 2025 vintage',
      contributingSourceSystems: ['hmda', 'lender_hmda_observations'],
      sourceAsOf: '2025',
      generatedAt,
      publicationStatus: 'PUBLIC',
      trace: commonTrace(
        'SUM(applications) on 2025 county-grain LEI observations.',
        'Not state-grain rows. Not a live market feed. Not an approval prediction.',
        ['hmda'],
        'National county grain; do not add state-grain rows',
        'HMDA 2025 reporting vintage',
      ),
    }),
    metric({
      key: 'hmda_2025_county_originations',
      label: 'HMDA 2025 county-grain originations',
      value: input.hmdaOriginations,
      valueState: 'KNOWN',
      grain: 'hmda_2025_county_observation',
      denominator: "Same 2025 county-grain rows as applications, SUM(originations)",
      description: 'Reported originations on the same county-grain 2025 rows. Not an approval rate.',
      coverage: 'United States county-grain 2025 vintage',
      contributingSourceSystems: ['hmda', 'lender_hmda_observations'],
      sourceAsOf: '2025',
      generatedAt,
      publicationStatus: 'PUBLIC',
      trace: commonTrace(
        'SUM(originations) on 2025 county-grain rows.',
        'Not approval odds. Originations plus denials do not equal applications.',
        ['hmda'],
        'National county grain',
        'HMDA 2025 reporting vintage',
      ),
    }),
    metric({
      key: 'cfpb_mortgage_complaint_observations',
      label: 'CFPB mortgage complaint observations',
      value: input.complaints,
      valueState: 'KNOWN',
      grain: 'cfpb_mortgage_complaint_observation',
      denominator: 'lender_cfpb_complaints mortgage product rows stored on this hub',
      description: 'Consumer-submitted mortgage complaint observations. A complaint is not a violation.',
      coverage: 'CFPB Consumer Complaint Database, mortgage product, as stored',
      contributingSourceSystems: ['cfpb', 'lender_cfpb_complaints'],
      sourceAsOf: input.cfpbObserved.slice(0, 10),
      generatedAt,
      publicationStatus: 'PUBLIC',
      trace: commonTrace(
        'One stored mortgage complaint observation row.',
        'Not a violation. Not HMDA applications. Unattached is not invalid.',
        ['cfpb'],
        'National complaint file as stored on this hub',
        `max(source_observed_at) ${input.cfpbObserved.slice(0, 10)}`,
      ),
    }),
    metric({
      key: 'federal_enforcement_events',
      label: 'Federal enforcement observations',
      value: input.federalEnforcementEvents,
      valueState: 'KNOWN',
      grain: 'federal_enforcement_event',
      denominator: 'lender_federal_enforcement_events rows',
      description: 'Stored federal enforcement observations. An observation is not a flattened violation count.',
      coverage: 'FDIC, OCC, Federal Reserve, CFPB actions as stored',
      contributingSourceSystems: ['lender_federal_enforcement_events'],
      sourceAsOf: null,
      generatedAt,
      publicationStatus: 'PUBLIC',
      trace: commonTrace(
        'One federal enforcement event row.',
        'Not CFPB complaints. None observed is not a clean history. Not a score.',
        ['lender_federal_enforcement_events'],
        'Federal agencies as stored',
        'Production graph observation; issued_on varies by event',
      ),
    }),
    metric({
      key: 'florida_ofr_approved_company_credentials',
      label: 'Florida OFR approved company credentials',
      value: input.flApprovedCredentials,
      valueState: 'KNOWN',
      grain: 'florida_ofr_approved_credential',
      denominator: "lender_state_licenses jurisdiction=FL license_class in (MBR, MLD) ofr_status=Approved",
      description: 'Approved Chapter 494 company credentials. Not the national institution universe.',
      coverage: 'Florida',
      contributingSourceSystems: ['florida_ofr', 'lender_state_licenses'],
      sourceAsOf: input.flOfrSourceAsOf.slice(0, 10),
      generatedAt,
      publicationStatus: 'PUBLIC',
      trace: commonTrace(
        'Approved FL MBR/MLD credential rows.',
        'Not confirmed NMLS identities. Not the 130 Florida public profiles. Not MLOs.',
        ['florida_ofr'],
        'Florida OFR Chapter 494 company credentials',
        `FL_OFR_CH494 source_as_of ${input.flOfrSourceAsOf.slice(0, 10)}`,
      ),
    }),
    metric({
      key: 'florida_confirmed_nmls_identities',
      label: 'Florida OFR credentials joined to an institution identity',
      value: input.flConfirmedNmls,
      valueState: 'KNOWN',
      grain: 'florida_confirmed_nmls',
      denominator: 'Distinct Approved FL MBR/MLD NMLS with institution_id present',
      description: 'Confirmed identity joins. Held NMLS stay out of this count.',
      coverage: 'Florida',
      contributingSourceSystems: ['florida_ofr', 'lender_state_licenses'],
      sourceAsOf: input.flOfrSourceAsOf.slice(0, 10),
      generatedAt,
      publicationStatus: 'INTERNAL',
      trace: commonTrace(
        'Distinct approved FL company NMLS with a confirmed institution_id.',
        'Not held NMLS. Not unresolved source-company NMLS. Not public Florida profiles.',
        ['florida_ofr'],
        'Florida',
        `FL_OFR_CH494 source_as_of ${input.flOfrSourceAsOf.slice(0, 10)}`,
      ),
    }),
    metric({
      key: 'nj_rmla_license_roster',
      label: 'New Jersey RMLA statewide licensee universe',
      value: null,
      valueState: 'REQUEST_ONLY',
      grain: 'nj_rmla_license_roster',
      denominator: 'NJ RMLA bulk licensee roster — SOURCE_AVAILABLE_BY_REQUEST',
      description: 'No bulk RMLA roster was acquired. Statewide NJ licensee count is UNKNOWN, not zero.',
      coverage: 'New Jersey',
      contributingSourceSystems: ['nj_dobi_rmla'],
      sourceAsOf: input.njDobiSourceAsOf.slice(0, 10),
      generatedAt,
      publicationStatus: 'PUBLIC_UNKNOWN',
      trace: commonTrace(
        'Nothing numeric is published for the complete NJ RMLA universe.',
        'Not DOBI unique orders. Not NJ HMDA applications. Not federal NJ-HQ institutions.',
        ['nj_dobi_rmla'],
        'New Jersey',
        `NJ-LEND snapshot as_of ${input.njDobiSourceAsOf.slice(0, 10)}`,
        {
          whyUnknown:
            'Public RMLA pages are application guidance, not a bulk roster. UNKNOWN must never render as zero.',
        },
      ),
    }),
    metric({
      key: 'nj_dobi_unique_orders',
      label: 'New Jersey DOBI unique orders (acquired)',
      value: input.njDobiUniqueOrders,
      valueState: 'PARTIAL',
      grain: 'nj_dobi_unique_order',
      denominator: 'Acquired NJDOBI enforcement order identifiers in the published NJ snapshot',
      description: 'Acquired unique orders. Later OCF years remain SOURCE_NOT_ACQUIRED and are not zero.',
      coverage: 'New Jersey — acquired DOBI years only',
      contributingSourceSystems: ['nj_dobi'],
      sourceAsOf: input.njDobiSourceAsOf.slice(0, 10),
      generatedAt,
      publicationStatus: 'PUBLIC_PARTIAL',
      trace: commonTrace(
        'Unique acquired DOBI order identifiers.',
        'Not the RMLA roster. Not 2023–2026 OCF years. Not a statewide lender count.',
        ['nj_dobi'],
        'New Jersey',
        `NJ DOBI FI list ${input.njDobiSourceAsOf.slice(0, 10)}; later OCF years not acquired`,
      ),
    }),
    metric({
      key: 'ca_crmla_live_roster',
      label: 'California CRMLA live licensee universe',
      value: null,
      valueState: 'NOT_ACQUIRED',
      grain: 'ca_crmla_live_roster',
      denominator: 'Live CRMLA roster — SOURCE_NOT_ACQUIRED',
      description: 'No bulk live CRMLA roster was acquired. Complete licensed-lender count is UNKNOWN, not zero.',
      coverage: 'California',
      contributingSourceSystems: ['ca_dfpi_crmla'],
      sourceAsOf: input.caCalhfaSourceAsOf.slice(0, 10),
      generatedAt,
      publicationStatus: 'PUBLIC_UNKNOWN',
      trace: commonTrace(
        'Nothing numeric is published for the live CRMLA universe.',
        'Not CalHFA directory rows. Not CA HMDA applications. Not the 2024 CRMLA annual report.',
        ['ca_dfpi_crmla'],
        'California',
        'live_crmla_roster SOURCE_NOT_ACQUIRED',
        {
          whyUnknown:
            'Live CRMLA roster was not bulk-acquired. CalHFA directory rows are program-participation observations, not the licensed universe.',
        },
      ),
    }),
    metric({
      key: 'ca_calhfa_directory_rows',
      label: 'CalHFA approved-lender directory rows',
      value: input.caCalhfaDirectoryRows,
      valueState: 'KNOWN',
      grain: 'ca_calhfa_directory_row',
      denominator: 'Official CalHFA approved-lender HTML directory rows',
      description: 'Program directory observations. Not California-licensed mortgage companies and not HMDA.',
      coverage: 'California CalHFA directory',
      contributingSourceSystems: ['calhfa'],
      sourceAsOf: input.caCalhfaSourceAsOf.slice(0, 10),
      generatedAt,
      publicationStatus: 'PUBLIC',
      trace: commonTrace(
        'HTML directory rows on the official CalHFA approved-lender listing.',
        'Not CRMLA licenses. Not NMLS. Identity bar is REVIEW_REQUIRED.',
        ['calhfa'],
        'California',
        `CalHFA directory retrieved ${input.caCalhfaSourceAsOf.slice(0, 10)}`,
      ),
    }),
    metric({
      key: 'tx_sml_live_roster',
      label: 'Texas live mortgage-company roster',
      value: null,
      valueState: 'NOT_ACQUIRED',
      grain: 'tx_sml_live_roster',
      denominator: 'Live Texas mortgage-company roster — SOURCE_NOT_ACQUIRED',
      description: 'No bulk live Texas mortgage-company roster was acquired. Complete licensed-company count is UNKNOWN, not zero.',
      coverage: 'Texas',
      contributingSourceSystems: ['tx_sml_nmls'],
      sourceAsOf: input.txSmlSourceAsOf.slice(0, 10),
      generatedAt,
      publicationStatus: 'PUBLIC_UNKNOWN',
      trace: commonTrace(
        'Nothing numeric is published for the live Texas mortgage-company universe.',
        'Not SML order rows. Not Texas HMDA applications. Not the 2024 SML dated entity count.',
        ['tx_sml_nmls'],
        'Texas',
        'CURRENT_TEXAS_MORTGAGE_COMPANY_BULK_ROSTER SOURCE_NOT_ACQUIRED',
        {
          whyUnknown:
            'Texas does not currently publish a Florida-OFR-style free complete mortgage-company bulk roster. NMLS Consumer Access was not scraped. Missing is not zero.',
        },
      ),
    }),
    metric({
      key: 'tx_sml_orders',
      label: 'Texas SML enforcement orders (acquired)',
      value: input.txSmlOrders,
      valueState: 'KNOWN',
      grain: 'tx_sml_order',
      denominator: 'SML enforcement-order CSV rows in the published Texas snapshot',
      description: 'Acquired SML orders. Order count is not quality. Name-only rows are not a live roster.',
      coverage: 'Texas — SML orders file',
      contributingSourceSystems: ['tx_sml'],
      sourceAsOf: input.txSmlSourceAsOf.slice(0, 10),
      generatedAt,
      publicationStatus: 'PUBLIC',
      trace: commonTrace(
        'SML enforcement CSV order rows.',
        'Not the live licensed-company universe. Not HMDA. Not CFPB complaints.',
        ['tx_sml'],
        'Texas',
        `SML orders file ${input.txSmlSourceAsOf.slice(0, 10)}`,
      ),
    }),
    metric({
      key: 'wa_dfi_live_roster',
      label: 'Washington live mortgage-company roster',
      value: null,
      valueState: 'NOT_ACQUIRED',
      grain: 'wa_dfi_live_roster',
      denominator: 'Live Washington mortgage-company roster — SOURCE_NOT_ACQUIRED',
      description: 'No bulk live Washington mortgage-company roster was acquired. Complete licensed-company count is UNKNOWN, not zero.',
      coverage: 'Washington',
      contributingSourceSystems: ['wa_dfi_nmls'],
      sourceAsOf: input.waDfiSourceAsOf.slice(0, 10),
      generatedAt,
      publicationStatus: 'PUBLIC_UNKNOWN',
      trace: commonTrace(
        'Nothing numeric is published for the live Washington mortgage-company universe.',
        'Not DFI HTML table rows. Not Washington HMDA applications. Not DFI year-end reported entities.',
        ['wa_dfi_nmls'],
        'Washington',
        'WASHINGTON_LIVE_COMPANY_ROSTER SOURCE_NOT_ACQUIRED',
        {
          whyUnknown:
            'Washington DFI company verification is search-only. NMLS Consumer Access was not scraped. Missing is not zero.',
        },
      ),
    }),
    metric({
      key: 'wa_dfi_enforcement_rows',
      label: 'Washington DFI Consumer Services enforcement rows (acquired)',
      value: input.waDfiEnforcementRows,
      valueState: 'KNOWN',
      grain: 'wa_dfi_enforcement_row',
      denominator: 'DFI enforcement HTML table rows in the published Washington snapshot',
      description: 'Acquired DFI table rows. Order count is not quality. Name-only rows are not a live roster.',
      coverage: 'Washington — DFI Consumer Services enforcement table',
      contributingSourceSystems: ['wa_dfi'],
      sourceAsOf: input.waDfiSourceAsOf.slice(0, 10),
      generatedAt,
      publicationStatus: 'PUBLIC',
      trace: commonTrace(
        'DFI Consumer Services bounded HTML table rows.',
        'Not the live licensed-company universe. Not HMDA. Not CFPB complaints. Not the 2025 year-end 91-action statistic.',
        ['wa_dfi'],
        'Washington',
        `DFI enforcement table retrieved ${input.waDfiSourceAsOf.slice(0, 10)}`,
      ),
    }),
    metric({
      key: 'published_state_intelligence_pages',
      label: 'Published state mortgage-intelligence pages',
      value: input.publishedStateIntelligencePaths.length,
      valueState: 'KNOWN',
      grain: 'published_state_intelligence_page',
      denominator: 'Indexable specialist state intelligence routes currently published',
      description: 'Florida, New Jersey, California, Texas, and Washington state intelligence pages. Not a count of lenders.',
      coverage: input.publishedStateIntelligencePaths.join(', '),
      contributingSourceSystems: ['lender-state-intel'],
      sourceAsOf: newestDocumentedSourceAsOf,
      generatedAt,
      publicationStatus: 'PUBLIC',
      trace: commonTrace(
        'Published /florida, /new-jersey, /california, /texas, and /washington intelligence routes.',
        'Not NJ county pages and not national directory rows.',
        ['lender-state-intel'],
        input.publishedStateIntelligencePaths.join(', '),
        'Publication gates in specialist catalogs',
      ),
    }),
  ];

  const canonical = {
    institutions: input.institutions,
    branches: input.branches,
    personMlo: input.personMlo,
    ppc: input.personPublicCandidate,
    nmlsInstitution: input.nmlsInstitution,
    nmlsBranch: input.nmlsBranch,
    nmlsPerson: input.nmlsPerson,
    lei: input.lei,
    fdic: input.fdicCert,
    ncua: input.ncuaCharter,
    lpi: input.lpiSnapshots,
    hmdaApps: input.hmdaApplications,
    hmdaOrig: input.hmdaOriginations,
    hmdaDen: input.hmdaDenials,
    complaints: input.complaints,
    attached: input.complaintsAttached,
    enf: input.federalEnforcementEvents,
    flCred: input.flApprovedCredentials,
    flNmls: input.flConfirmedNmls,
    flHeld: input.flHeldNmls,
    flPub: input.floridaPublic,
    render: input.publicRender,
    index: input.publicIndex,
    njApps: input.njHmdaApplications,
    njOrders: input.njDobiUniqueOrders,
    njRoster: input.njRmlaRosterCoverage,
    caApps: input.caHmdaApplications,
    caCalhfa: input.caCalhfaDirectoryRows,
    caRoster: input.caCrmlaRosterCoverage,
    txApps: input.txHmdaApplications,
    txOrders: input.txSmlOrders,
    txRoster: input.txLiveRosterCoverage,
    waApps: input.waHmdaApplications,
    waOrders: input.waDfiEnforcementRows,
    waRoster: input.waLiveRosterCoverage,
    paths: input.publishedStateIntelligencePaths,
    njCounties: input.njCountyIntelligencePages,
  };
  const sourceFingerprint = createHash('sha256').update(JSON.stringify(canonical)).digest('hex');

  return {
    schemaVersion: LENDER_NETWORK_METRICS_VERSION,
    generatedAt,
    newestDocumentedSourceAsOf,
    newestDocumentedSourceAsOfNote:
      'Newest documented official source-effective date among metrics that carry a calendar sourceAsOf. Not the as-of date of every identity row, not Git time, and not deploy time.',
    sourceFingerprint,
    identity: {
      institutions: input.institutions,
      branches: input.branches,
      personMlo: input.personMlo,
      personPublicCandidate: input.personPublicCandidate,
      nmlsInstitution: input.nmlsInstitution,
      nmlsBranch: input.nmlsBranch,
      nmlsPerson: input.nmlsPerson,
      lei: input.lei,
      fdicCert: input.fdicCert,
      ncuaCharter: input.ncuaCharter,
      rssd: input.rssd,
      lpiSnapshots: input.lpiSnapshots,
    },
    hmda: {
      year: 2025,
      grain: 'county',
      rows: input.hmdaRows,
      applications: input.hmdaApplications,
      originations: input.hmdaOriginations,
      denials: input.hmdaDenials,
      stateGrainApplicationsExcluded: input.hmdaStateGrainApplications,
    },
    cfpb: {
      complaints: input.complaints,
      attached: input.complaintsAttached,
      unattached: input.complaintsUnattached,
      labels: input.cfpbLabels,
      confirmedBridges: input.cfpbBridges,
      observed: input.cfpbObserved.slice(0, 10),
    },
    enforcement: { federalEvents: input.federalEnforcementEvents },
    florida: {
      approvedCredentials: input.flApprovedCredentials,
      confirmedNmls: input.flConfirmedNmls,
      heldNmls: input.flHeldNmls,
      unresolvedSourceCompanyNmls: input.flUnresolvedSourceCompanyNmls,
      stateRegulatoryEvents: input.flSre,
      publicProfiles: input.floridaPublic,
      ofrSourceAsOf: input.flOfrSourceAsOf.slice(0, 10),
    },
    newJersey: {
      hmdaApplications: input.njHmdaApplications,
      hmdaOriginations: input.njHmdaOriginations,
      dobiUniqueOrders: input.njDobiUniqueOrders,
      rmlaRosterCoverage: input.njRmlaRosterCoverage,
      statewideRmlaUniverse: null,
      countyIntelligencePages: input.njCountyIntelligencePages,
    },
    california: {
      hmdaApplications: input.caHmdaApplications,
      hmdaOriginations: input.caHmdaOriginations,
      calhfaDirectoryRows: input.caCalhfaDirectoryRows,
      crmlaRosterCoverage: input.caCrmlaRosterCoverage,
      liveCrmlaUniverse: null,
    },
    texas: {
      hmdaApplications: input.txHmdaApplications,
      hmdaOriginations: input.txHmdaOriginations,
      smlOrders: input.txSmlOrders,
      liveRosterCoverage: input.txLiveRosterCoverage,
      liveLicensedCompanyUniverse: null,
    },
    washington: {
      hmdaApplications: input.waHmdaApplications,
      hmdaOriginations: input.waHmdaOriginations,
      dfiEnforcementRows: input.waDfiEnforcementRows,
      liveRosterCoverage: input.waLiveRosterCoverage,
      liveLicensedCompanyUniverse: null,
    },
    publication: {
      nationalRender: input.publicRender,
      nationalIndex: input.publicIndex,
      floridaPublic: input.floridaPublic,
      searchUnion,
      searchUnionIsNotNationalHeadline: true,
    },
    network: {
      publishedStateIntelligencePages: input.publishedStateIntelligencePaths.length,
      publishedStateIntelligencePaths: input.publishedStateIntelligencePaths,
      njCountyIntelligencePages: input.njCountyIntelligencePages,
    },
    rejectedTotals: [
      {
        total: `${searchUnion} combined public search`,
        reason: '181 national-searchable plus 130 Florida-public. Not a national lender census.',
      },
      {
        total: `${input.personMlo} person_mlo identities`,
        reason: 'Internal graph. Not a public MLO directory.',
      },
      {
        total: `${input.flUnresolvedSourceCompanyNmls} unresolved OFR source-company NMLS`,
        reason: 'Different grain from held_nmls=22 and from confirmed institution joins.',
      },
      {
        total: `${input.branches} branch entities`,
        reason: 'Not additional lenders.',
      },
      {
        total: `${input.hmdaStateGrainApplications} state-grain HMDA applications`,
        reason: 'Must not be added to county-grain 11,529,787.',
      },
      {
        total: 'CA CRMLA live roster = 0',
        reason: 'SOURCE_NOT_ACQUIRED. Missing is not zero.',
      },
      {
        total: 'TX live mortgage-company roster = 0',
        reason: 'SOURCE_NOT_ACQUIRED. Missing is not zero.',
      },
      {
        total: 'NJ RMLA roster = 0',
        reason: 'SOURCE_AVAILABLE_BY_REQUEST. Missing is not zero.',
      },
      {
        total: 'complaints per HMDA applications',
        reason: 'Incompatible universes. Not published.',
      },
    ],
    homeProjection: {
      snapshotVersion: 'lender-home-intel-snapshot-v2',
      homepagePublicationVersion: 'intel-004-v1',
      generated_at: generatedAt,
      retrievedAt: generatedAt.slice(0, 10),
      hmdaOfficialAsOf: '2025',
      hmdaSourceVintage: 'HMDA 2025 reporting vintage',
      hmdaGrain: 'county',
      institutions: input.institutions,
      lpiSnapshots: input.lpiSnapshots,
      nmlsInstitution: input.nmlsInstitution,
      publicRender: input.publicRender,
      publicIndex: input.publicIndex,
      floridaPublic: input.floridaPublic,
      floridaInternal: input.flConfirmedNmls,
      applications: input.hmdaApplications,
      originations: input.hmdaOriginations,
      denials: input.hmdaDenials,
      complaints: input.complaints,
      complaintsAttached: input.complaintsAttached,
      complaintsUnattached: input.complaintsUnattached,
      cfpbLabels: input.cfpbLabels,
      cfpbConfirmedBridges: input.cfpbBridges,
      depository: input.depository,
      geography: input.geography,
      graph: {
        branch_entities: input.branches,
        person_mlo_entities: input.personMlo,
        nmls_branch: input.nmlsBranch,
        nmls_person: input.nmlsPerson,
        person_public_candidate: input.personPublicCandidate,
      },
      grains: {
        institutions: 'canonical institution entity (lender_national_entities.entity_kind=institution)',
        lpiSnapshots: 'lender_profile_intelligence row; not the identity universe',
        nmlsInstitution: 'NMLS_INSTITUTION identifier slot; not an institution count',
        publicRender: 'file-backed lend-nat-014 national render cohort',
        publicIndex: 'file-backed lend-nat-014 national index cohort',
        floridaPublic: 'file-backed Florida Phase 1+2 public company cohort',
        floridaInternal: 'distinct Approved FL MBR/MLD NMLS with confirmed institution_id',
        applications: 'HMDA 2025 county-grain LEI observation, summed nationally; exclude state grain',
        originations: 'same county-grain 2025 rows as applications',
        denials: 'same county-grain 2025 rows as applications',
        complaints: 'lender_cfpb_complaints mortgage observation row',
        depository: 'exclusive profile.roles.depository on LPI snapshots',
        branch_entities: 'canonical branch entity; not a branch license row',
        person_mlo_entities: 'canonical person_mlo entity; not an LO license row',
      },
      source_as_of: {
        identity: 'production graph observation',
        hmda: '2025',
        cfpb_observed: input.cfpbObserved.slice(0, 10),
        florida_ofr: input.flOfrSourceAsOf.slice(0, 10),
        publication: 'file-backed INTEL-004 / FL-LEND-006+008',
      },
      fingerprint: sourceFingerprint,
    },
    metrics,
  };
}
