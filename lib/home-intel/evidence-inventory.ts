import { ARIZONA_SNAPSHOT } from '@/lib/arizona-intelligence/snapshot';
import { CALIFORNIA_SNAPSHOT } from '@/lib/california-intelligence/snapshot';
import { FLORIDA_SNAPSHOT } from '@/lib/florida-intelligence/snapshot';
import { NEW_JERSEY_SNAPSHOT } from '@/lib/new-jersey-intelligence/snapshot';
import { TEXAS_SNAPSHOT } from '@/lib/texas-intelligence/snapshot';
import { WASHINGTON_SNAPSHOT } from '@/lib/washington-intelligence/snapshot';
import type { LenderNetworkMetricsV1 } from '@/lib/metrics/lender-network-metrics-v1';
import type { HomepageEvidenceMeasure, HomepageStateCard, LenderEvidenceFamily } from './types';

export const LENDER_EVIDENCE_FAMILY_LABELS: Record<LenderEvidenceFamily, string> = {
  INSTITUTION_IDENTITY_LICENSING: 'Institution identity & licensing',
  MORTGAGE_MARKET_ACTIVITY: 'Mortgage market activity',
  CONSUMER_COMPLAINTS: 'Consumer complaint evidence',
  REGULATORY_ENFORCEMENT: 'Regulatory & enforcement history',
  DEPOSITORY_BANK: 'Depository & bank context',
  HOMEBUYER_PROGRAMS: 'Homebuyer & program intelligence',
  BUSINESS_RELATIONSHIPS: 'Business & relationship evidence',
  PUBLIC_RESEARCH_SURFACES: 'Public research surfaces',
};

const fmt = (value: number | null) => (value == null ? 'Not acquired' : value.toLocaleString('en-US'));

type MeasureInput = Omit<HomepageEvidenceMeasure, 'display' | 'publicationStatus' | 'sourceClockLabel' | 'sourceClock' | 'retrievedAt' | 'generatedAt'> & {
  sourceAsOf: string;
  retrievedAt?: string | null;
  generatedAt?: string | null;
  publicationStatus?: HomepageEvidenceMeasure['publicationStatus'];
};

function measure(input: MeasureInput): HomepageEvidenceMeasure {
  const { sourceAsOf, retrievedAt = null, generatedAt = null, ...rest } = input;
  const descriptiveClock = /varies|accepted .*snapshot|observed|retrieved|not reported|source_not_acquired|not_harvested|acquired through/i.test(sourceAsOf);
  const vintageClock = /^(?:HMDA )?\d{4}$/.test(sourceAsOf);
  return {
    ...rest,
    display: fmt(input.value),
    sourceClockLabel: descriptiveClock ? 'Source clock' : vintageClock ? 'Vintage' : 'Source as of',
    sourceClock: sourceAsOf,
    retrievedAt,
    generatedAt,
    publicationStatus: input.publicationStatus ?? 'PUBLIC',
  };
}

export const LENDER_HOMEPAGE_STATE_CARDS: HomepageStateCard[] = [
  {
    code: 'FL',
    name: 'Florida',
    href: '/florida',
    regulators: 'Florida OFR · HMDA/FFIEC · CFPB',
    sourceClocks: [
      { label: 'Florida OFR roster', sourceAsOf: FLORIDA_SNAPSHOT.licensing.source_as_of, retrievedAt: null },
      { label: 'HMDA vintage', sourceAsOf: '2025', retrievedAt: null },
      { label: 'CFPB complaints through', sourceAsOf: FLORIDA_SNAPSHOT.cfpb.date_max, retrievedAt: FLORIDA_SNAPSHOT.cfpb.observed },
    ],
    evidence: ['Chapter 494 company credentials', 'HMDA market activity', 'OFR final-agency-action observations', 'CFPB mortgage complaints'],
    identityNote: `${fmt(FLORIDA_SNAPSHOT.licensing.confirmed_nmls)} exact confirmed NMLS identities; credential rows remain distinct from companies.`,
    limitation: 'An approved credential is not an endorsement. Unresolved OFR observations are not attached to current profiles.',
    highlights: [
      { label: 'Approved company credentials', value: fmt(FLORIDA_SNAPSHOT.licensing.approved_credentials), grain: 'credential rows' },
      { label: 'OFR written observations', value: fmt(FLORIDA_SNAPSHOT.ofr.written_observations), grain: 'regulatory observations' },
      { label: 'Mortgage complaints reported from FL', value: fmt(FLORIDA_SNAPSHOT.cfpb.rows), grain: 'CFPB complaint observations' },
    ],
  },
  {
    code: 'NJ',
    name: 'New Jersey',
    href: '/new-jersey',
    regulators: 'NJ DOBI · NJHMFA · HMDA/FFIEC',
    sourceClocks: [
      { label: 'HMDA vintage', sourceAsOf: '2025', retrievedAt: null },
      { label: 'DOBI financial-institution list', sourceAsOf: NEW_JERSEY_SNAPSHOT.source_as_of.dobi_fi_list, retrievedAt: null },
      { label: 'DOBI enforcement corpus', sourceAsOf: null, sourceClock: NEW_JERSEY_SNAPSHOT.source_as_of.dobi_enforcement, retrievedAt: null },
    ],
    evidence: ['HMDA market activity', 'DOBI orders', 'financial-institution classes', 'NJHMFA program and participating-lender research'],
    identityNote: `${fmt(NEW_JERSEY_SNAPSHOT.dobi.identity.exact_nmls_institution)} exact NMLS-institution references and ${fmt(NEW_JERSEY_SNAPSHOT.dobi.identity.exact_fdic)} exact FDIC references in the accepted order corpus.`,
    limitation: 'The statewide RMLA roster is available by request, not acquired. Name-only adverse evidence stays off profiles.',
    highlights: [
      { label: 'HMDA applications', value: fmt(NEW_JERSEY_SNAPSHOT.hmda.applications), grain: '2025 applications' },
      { label: 'DOBI unique orders', value: fmt(NEW_JERSEY_SNAPSHOT.dobi.unique_orders), grain: 'unique orders, acquired through 2022 pages' },
      { label: 'NJHMFA program families', value: fmt(NEW_JERSEY_SNAPSHOT.njhmfa.programs.length), grain: 'source-native program families' },
    ],
  },
  {
    code: 'CA',
    name: 'California',
    href: '/california',
    regulators: 'DFPI · DRE · CalHFA · HMDA/FFIEC · CFPB',
    sourceClocks: [
      { label: 'HMDA vintage', sourceAsOf: '2025', retrievedAt: null },
      { label: 'CalHFA directory', sourceAsOf: null, retrievedAt: CALIFORNIA_SNAPSHOT.calhfa_directory.retrieved_at },
      { label: 'CFPB complaints', sourceAsOf: null, retrievedAt: CALIFORNIA_SNAPSHOT.generated_at },
    ],
    evidence: ['HMDA market activity', 'CalHFA directory and programs', 'dated CRMLA regulatory report', 'CFPB mortgage complaints'],
    identityNote: 'CalHFA directory rows, CRMLA licensees, branches, NMLS IDs, and HMDA LEIs are separate identity grains.',
    limitation: 'The current CRMLA bulk roster was not acquired. CalHFA participation is not a license or TrustHub endorsement.',
    highlights: [
      { label: 'HMDA applications', value: fmt(CALIFORNIA_SNAPSHOT.hmda.applications), grain: '2025 applications' },
      { label: 'CalHFA directory rows', value: fmt(CALIFORNIA_SNAPSHOT.calhfa_directory.directory_rows), grain: 'approved-lender location rows' },
      { label: 'CFPB mortgage complaints', value: fmt(CALIFORNIA_SNAPSHOT.cfpb.mortgage_complaint_rows), grain: 'complaint observations' },
    ],
  },
  {
    code: 'TX',
    name: 'Texas',
    href: '/texas',
    regulators: 'Texas SML · TDHCA · TSAHC · HMDA/FFIEC · CFPB',
    sourceClocks: [
      { label: 'HMDA vintage', sourceAsOf: '2025', retrievedAt: null },
      { label: 'SML orders', sourceAsOf: TEXAS_SNAPSHOT.source_as_of.sml_orders, retrievedAt: TEXAS_SNAPSHOT.sml_orders.retrieved_at },
      { label: 'CFPB complaints', sourceAsOf: null, retrievedAt: TEXAS_SNAPSHOT.cfpb.retrieved_at },
    ],
    evidence: ['HMDA market activity', 'SML order corpus', 'dated regulator entity classes', 'state program families', 'CFPB complaints'],
    identityNote: `${fmt(TEXAS_SNAPSHOT.sml_orders.exact_nmls_rows)} order rows print an exact NMLS identifier; ${fmt(TEXAS_SNAPSHOT.sml_orders.name_only_rows)} name-only rows remain state-level evidence.`,
    limitation: 'Texas regulators and license classes are not collapsed into one lender universe; the live bulk company roster was not acquired.',
    highlights: [
      { label: 'HMDA applications', value: fmt(TEXAS_SNAPSHOT.hmda.applications), grain: '2025 applications' },
      { label: 'SML order rows', value: fmt(TEXAS_SNAPSHOT.sml_orders.order_rows), grain: 'source-native order rows' },
      { label: 'Verified program families', value: fmt(TEXAS_SNAPSHOT.programs.verified_family_count), grain: 'program families' },
    ],
  },
  {
    code: 'WA',
    name: 'Washington',
    href: '/washington',
    regulators: 'Washington DFI · WSHFC · HMDA/FFIEC · CFPB',
    sourceClocks: [
      { label: 'HMDA vintage', sourceAsOf: '2025', retrievedAt: null },
      { label: 'DFI enforcement table', sourceAsOf: null, retrievedAt: WASHINGTON_SNAPSHOT.dfi_enforcement.retrieved_at },
      { label: 'CFPB complaints', sourceAsOf: null, retrievedAt: WASHINGTON_SNAPSHOT.cfpb.retrieved_at },
    ],
    evidence: ['HMDA market activity', 'DFI enforcement rows', 'exact NMLS event attribution', 'WSHFC programs', 'CFPB and FDIC context'],
    identityNote: `${fmt(WASHINGTON_SNAPSHOT.dfi_enforcement.order_rows)} DFI source rows and ${fmt(WASHINGTON_SNAPSHOT.dfi_enforcement.exact_nmls_rows)} exact-NMLS rows are different measures, not a funnel.`,
    limitation: 'The current live company roster was not acquired. Name-only enforcement rows are not attached to profiles.',
    highlights: [
      { label: 'HMDA applications', value: fmt(WASHINGTON_SNAPSHOT.hmda.applications), grain: '2025 applications' },
      { label: 'DFI enforcement rows', value: fmt(WASHINGTON_SNAPSHOT.dfi_enforcement.order_rows), grain: 'enforcement-order rows' },
      { label: 'Exact-NMLS order rows', value: fmt(WASHINGTON_SNAPSHOT.dfi_enforcement.exact_nmls_rows), grain: 'order rows with printed NMLS ID' },
    ],
  },
  {
    code: 'AZ',
    name: 'Arizona',
    href: '/arizona',
    regulators: 'Arizona DIFI · Arizona IDA · HMDA/FFIEC · CFPB',
    sourceClocks: [
      { label: 'HMDA vintage', sourceAsOf: '2025', retrievedAt: null },
      { label: 'CFPB API last updated', sourceAsOf: ARIZONA_SNAPSHOT.cfpb.api_last_updated, retrievedAt: ARIZONA_SNAPSHOT.cfpb.retrieved_at },
      { label: 'DIFI enforcement', sourceAsOf: null, retrievedAt: null },
    ],
    evidence: ['HMDA market activity', 'CFPB complaint observations', 'statewide program families', 'FDIC depository overlay', 'DIFI access limitations'],
    identityNote: `${fmt(ARIZONA_SNAPSHOT.hmda.lei_reporter_rows)} HMDA LEI state rows; no current DIFI/NMLS company denominator was acquired.`,
    limitation: 'DIFI roster and enforcement harvests were blocked or search-only. Their counts remain unknown, not zero.',
    highlights: [
      { label: 'HMDA applications', value: fmt(ARIZONA_SNAPSHOT.hmda.applications), grain: '2025 applications' },
      { label: 'CFPB mortgage complaints', value: fmt(ARIZONA_SNAPSHOT.cfpb.mortgage_complaint_rows), grain: 'complaint observations' },
      { label: 'Statewide program families', value: fmt(ARIZONA_SNAPSHOT.programs.verified_family_count), grain: 'program families' },
    ],
  },
];

export function buildLenderHomepageEvidenceInventory(metrics: LenderNetworkMetricsV1): HomepageEvidenceMeasure[] {
  const generated = metrics.generatedAt;
  const nationalArtifact = 'data/home/lender-network-metrics-v1.json';
  const national = (key: string, label: string, value: number, family: LenderEvidenceFamily, grain: string, source: string, sourceAsOf: string, counts: string, doesNotCount: string, destination = '/lender'): HomepageEvidenceMeasure =>
    measure({ key, label, value, family, grain, entityClass: 'multi-class mortgage evidence', geography: 'United States and reported jurisdictions', sourceSystem: source, acceptedArtifact: nationalArtifact, sourceAsOf, generatedAt: generated, definition: counts, counts, doesNotCount, researchDestination: destination, identityRule: null });

  return [
    national('national_institutions', 'Lending institution entities', metrics.identity.institutions, 'INSTITUTION_IDENTITY_LICENSING', 'canonical institution entity', 'LenderTrustHub identity graph', 'varies by contributing source', 'Canonical institution entities in the accepted identity graph.', 'Branches, MLO people, applications, or a census of every licensed company.'),
    national('national_nmls_ids', 'NMLS institution identifiers', metrics.identity.nmlsInstitution, 'INSTITUTION_IDENTITY_LICENSING', 'NMLS institution identifier', 'NMLS-derived accepted identity graph', 'varies by contributing source', 'Distinct institution-level NMLS identifiers in the accepted graph.', 'Branch NMLS IDs, MLO NMLS IDs, state license rows, or unique corporate organizations.'),
    national('hmda_applications', 'HMDA applications', metrics.hmda.applications, 'MORTGAGE_MARKET_ACTIVITY', 'county-grain HMDA application observation', 'HMDA / FFIEC', 'HMDA 2025', 'Reported 2025 applications aggregated from the accepted county-grain extract.', 'Lenders, approvals, offers, or a quality measure.', '/mortgage-data'),
    national('hmda_originations', 'HMDA originations', metrics.hmda.originations, 'MORTGAGE_MARKET_ACTIVITY', 'county-grain HMDA origination observation', 'HMDA / FFIEC', 'HMDA 2025', 'Reported 2025 originations in the accepted county-grain extract.', 'Unique borrowers, lenders, or evidence that a lender is better.', '/mortgage-data'),
    national('hmda_denials', 'HMDA denials', metrics.homeProjection.denials, 'MORTGAGE_MARKET_ACTIVITY', 'county-grain HMDA denial observation', 'HMDA / FFIEC', 'HMDA 2025', 'Reported 2025 denial observations in the accepted county-grain extract.', 'Misconduct, borrower eligibility, or lender quality.', '/mortgage-data'),
    national('cfpb_complaints', 'CFPB mortgage complaints', metrics.cfpb.complaints, 'CONSUMER_COMPLAINTS', 'CFPB mortgage complaint observation', 'CFPB Consumer Complaint Database', `Snapshot observed ${metrics.cfpb.observed}`, 'Mortgage-scoped consumer complaint observations in the accepted snapshot.', 'Proven violations, findings, complaint rates, or a risk score.'),
    national('federal_enforcement', 'Federal enforcement events', metrics.enforcement.federalEvents, 'REGULATORY_ENFORCEMENT', 'federal enforcement event', 'Accepted federal enforcement sources', 'varies by source event', 'Source-native federal enforcement events in the accepted network contract.', 'Criminal convictions, complaints, or proof of present license status.'),
    national('fdic_cert', 'FDIC CERT identifiers', metrics.identity.fdicCert, 'DEPOSITORY_BANK', 'FDIC CERT identifier', 'FDIC', 'accepted identity snapshot', 'Distinct FDIC CERT identifiers in the accepted identity graph.', 'NMLS IDs, all mortgage lenders, branches, or proof of mortgage quality.', '/fdic-insured-banks'),
    measure({ key: 'fl_credentials', label: 'Florida approved company credentials', value: FLORIDA_SNAPSHOT.licensing.approved_credentials, family: 'INSTITUTION_IDENTITY_LICENSING', grain: 'approved MBR/MLD credential row', entityClass: 'Florida Chapter 494 company credential', geography: 'Florida', sourceSystem: 'Florida Office of Financial Regulation', acceptedArtifact: 'lib/florida-intelligence/accepted-snapshot.json', sourceAsOf: FLORIDA_SNAPSHOT.licensing.source_as_of, generatedAt: FLORIDA_SNAPSHOT.generated_at, definition: 'Current approved Chapter 494 company credential rows.', counts: 'Approved MBR and MLD credential rows.', doesNotCount: 'Unique companies, branches, MLOs, service areas, or endorsements.', researchDestination: '/florida', identityRule: 'State credential rows join to institutions only through confirmed NMLS identity.' }),
    measure({ key: 'fl_ofr_observations', label: 'Florida OFR written observations', value: FLORIDA_SNAPSHOT.ofr.written_observations, family: 'REGULATORY_ENFORCEMENT', grain: 'written regulatory observation', entityClass: 'company, person MLO, branch, or mixed source observation', geography: 'Florida', sourceSystem: 'DOAH FLAIO / Florida OFR', acceptedArtifact: 'lib/florida-intelligence/accepted-snapshot.json', sourceAsOf: '2026-08-25', generatedAt: FLORIDA_SNAPSHOT.generated_at, definition: 'Written observations in the accepted FLAIO/OFR corpus.', counts: 'Source observations across explicitly separate respondent grains.', doesNotCount: 'Criminal convictions, current quality, or clean-record determinations.', researchDestination: '/florida', identityRule: 'Only confirmed identifiers attach adverse evidence; unresolved company observations stay aggregate.' }),
    measure({ key: 'fl_cfpb', label: 'Florida CFPB mortgage complaints', value: FLORIDA_SNAPSHOT.cfpb.rows, family: 'CONSUMER_COMPLAINTS', grain: 'CFPB mortgage complaint observation', entityClass: 'consumer-reported mortgage complaint', geography: 'Florida', sourceSystem: 'CFPB', acceptedArtifact: 'lib/florida-intelligence/accepted-snapshot.json', sourceAsOf: FLORIDA_SNAPSHOT.cfpb.date_max, retrievedAt: FLORIDA_SNAPSHOT.cfpb.observed, definition: 'Mortgage complaint observations reported from Florida.', counts: 'CFPB complaint observations at state-reporting geography.', doesNotCount: 'Proven violations, findings, rates, or lender quality.', researchDestination: '/florida', identityRule: 'Unresolved complaint company labels remain unattached.' }),
    measure({ key: 'nj_dobi_orders', label: 'New Jersey DOBI unique orders', value: NEW_JERSEY_SNAPSHOT.dobi.unique_orders, family: 'REGULATORY_ENFORCEMENT', grain: 'unique DOBI order', entityClass: 'source-native regulatory order', geography: 'New Jersey', sourceSystem: 'New Jersey DOBI', acceptedArtifact: 'lib/new-jersey-intelligence/accepted-snapshot.json', sourceAsOf: NEW_JERSEY_SNAPSHOT.source_as_of.dobi_enforcement, generatedAt: NEW_JERSEY_SNAPSHOT.generated_at, definition: 'Deduplicated orders acquired from bounded DOBI OCF year pages.', counts: 'Unique orders, separately from index occurrences and documents.', doesNotCount: 'Violations, complaints, unique lenders, or later unacquired years.', researchDestination: '/new-jersey', identityRule: 'Exact official identifiers only for profile attribution; name-only evidence remains withheld.' }),
    measure({ key: 'nj_financial_institutions', label: 'New Jersey financial-institution list rows', value: NEW_JERSEY_SNAPSHOT.financial_institutions.source_rows, family: 'DEPOSITORY_BANK', grain: 'official institution-list row', entityClass: 'source-native bank, thrift, credit union, or trust class', geography: 'New Jersey', sourceSystem: 'New Jersey DOBI', acceptedArtifact: 'lib/new-jersey-intelligence/accepted-snapshot.json', sourceAsOf: NEW_JERSEY_SNAPSHOT.financial_institutions.source_as_of, generatedAt: NEW_JERSEY_SNAPSHOT.generated_at, definition: 'Rows in the accepted DOBI financial-institution list.', counts: 'Official list rows across source-native charter classes.', doesNotCount: 'Mortgage licenses, brokers, NJHMFA participants, or recommendations.', researchDestination: '/new-jersey', identityRule: 'FDIC and state references remain distinct identifiers.' }),
    measure({ key: 'nj_programs', label: 'New Jersey NJHMFA program families', value: NEW_JERSEY_SNAPSHOT.njhmfa.programs.length, family: 'HOMEBUYER_PROGRAMS', grain: 'source-native program family', entityClass: 'state housing-finance program', geography: 'New Jersey', sourceSystem: 'NJHMFA', acceptedArtifact: 'lib/new-jersey-intelligence/accepted-snapshot.json', sourceAsOf: NEW_JERSEY_SNAPSHOT.source_as_of.njhmfa_programs_limits, generatedAt: NEW_JERSEY_SNAPSHOT.generated_at, definition: 'Accepted NJHMFA first-mortgage and assistance program families.', counts: 'Distinct documented program families.', doesNotCount: 'Eligible borrowers, approvals, products, or guarantees.', researchDestination: '/new-jersey', identityRule: null }),
    measure({ key: 'ca_calhfa_rows', label: 'California CalHFA directory rows', value: CALIFORNIA_SNAPSHOT.calhfa_directory.directory_rows, family: 'BUSINESS_RELATIONSHIPS', grain: 'CalHFA approved-lender directory location row', entityClass: 'participating lender location', geography: 'California and listed out-of-state locations', sourceSystem: 'California Housing Finance Agency', acceptedArtifact: 'lib/california-intelligence/accepted-snapshot.json', sourceAsOf: 'Source date not reported', retrievedAt: CALIFORNIA_SNAPSHOT.calhfa_directory.retrieved_at, definition: 'Rows in the live official CalHFA approved-lender directory snapshot.', counts: 'Directory location rows with public address/phone evidence where present.', doesNotCount: 'Unique companies, California licenses, endorsements, or NMLS matches.', researchDestination: '/california', identityRule: 'No name-only NMLS attachment; the source prints no NMLS ID.' }),
    measure({ key: 'ca_cfpb', label: 'California CFPB mortgage complaints', value: CALIFORNIA_SNAPSHOT.cfpb.mortgage_complaint_rows, family: 'CONSUMER_COMPLAINTS', grain: 'CFPB mortgage complaint observation', entityClass: 'consumer-reported mortgage complaint', geography: 'California', sourceSystem: 'CFPB', acceptedArtifact: 'lib/california-intelligence/accepted-snapshot.json', sourceAsOf: 'Source date not reported', retrievedAt: CALIFORNIA_SNAPSHOT.generated_at, definition: 'Mortgage complaint observations reported from California.', counts: 'CFPB complaint observations.', doesNotCount: 'Proven violations, findings, complaint rates, or lender quality.', researchDestination: '/california', identityRule: 'No new fuzzy adverse matching.' }),
    measure({ key: 'ca_programs', label: 'California CalHFA program families', value: CALIFORNIA_SNAPSHOT.calhfa_programs.items.length, family: 'HOMEBUYER_PROGRAMS', grain: 'source-native program family', entityClass: 'state housing-finance program', geography: 'California', sourceSystem: 'CalHFA', acceptedArtifact: 'lib/california-intelligence/accepted-snapshot.json', sourceAsOf: CALIFORNIA_SNAPSHOT.source_as_of.calhfa_programs, retrievedAt: CALIFORNIA_SNAPSHOT.calhfa_programs.retrieved_at, definition: 'Accepted CalHFA program families.', counts: 'Documented program families.', doesNotCount: 'Eligible borrowers, approvals, individual products, or guaranteed funds.', researchDestination: '/california', identityRule: null }),
    measure({ key: 'tx_sml_orders', label: 'Texas SML order rows', value: TEXAS_SNAPSHOT.sml_orders.order_rows, family: 'REGULATORY_ENFORCEMENT', grain: 'source-native SML order row', entityClass: 'Texas SML regulatory order', geography: 'Texas', sourceSystem: 'Texas Department of Savings and Mortgage Lending', acceptedArtifact: 'lib/texas-intelligence/accepted-snapshot.json', sourceAsOf: TEXAS_SNAPSHOT.sml_orders.source_as_of, retrievedAt: TEXAS_SNAPSHOT.sml_orders.retrieved_at, definition: 'Rows in the accepted SML order dataset.', counts: 'Order rows with source-native titles.', doesNotCount: 'Complaints, unique lenders, criminal convictions, or a quality score.', researchDestination: '/texas', identityRule: `${fmt(TEXAS_SNAPSHOT.sml_orders.exact_nmls_rows)} rows print an exact NMLS ID; name-only rows remain statewide evidence.` }),
    measure({ key: 'tx_programs', label: 'Texas verified program families', value: TEXAS_SNAPSHOT.programs.verified_family_count, family: 'HOMEBUYER_PROGRAMS', grain: 'source-native program family', entityClass: 'state housing-finance program', geography: 'Texas', sourceSystem: 'TDHCA and TSAHC', acceptedArtifact: 'lib/texas-intelligence/accepted-snapshot.json', sourceAsOf: 'Source date not reported', retrievedAt: TEXAS_SNAPSHOT.programs.retrieved_at, definition: 'Distinct accepted statewide program families.', counts: 'Documented program families, not individual loan products.', doesNotCount: 'Eligible borrowers, approvals, available funds, or program generosity.', researchDestination: '/texas', identityRule: null }),
    measure({ key: 'tx_cfpb', label: 'Texas CFPB mortgage complaints', value: TEXAS_SNAPSHOT.cfpb.mortgage_complaint_rows, family: 'CONSUMER_COMPLAINTS', grain: 'CFPB mortgage complaint observation', entityClass: 'consumer-reported mortgage complaint', geography: 'Texas', sourceSystem: 'CFPB', acceptedArtifact: 'lib/texas-intelligence/accepted-snapshot.json', sourceAsOf: 'Source date not reported', retrievedAt: TEXAS_SNAPSHOT.cfpb.retrieved_at, definition: 'Mortgage complaint observations reported from Texas.', counts: 'CFPB complaint observations.', doesNotCount: 'Proven violations, findings, complaint rates, or quality.', researchDestination: '/texas', identityRule: 'No new fuzzy adverse matching.' }),
    measure({ key: 'wa_dfi_orders', label: 'Washington DFI enforcement rows', value: WASHINGTON_SNAPSHOT.dfi_enforcement.order_rows, family: 'REGULATORY_ENFORCEMENT', grain: 'enforcement-order row', entityClass: 'DFI Consumer Services enforcement row', geography: 'Washington', sourceSystem: 'Washington DFI', acceptedArtifact: 'lib/washington-intelligence/accepted-snapshot.json', sourceAsOf: 'Source date not reported', retrievedAt: WASHINGTON_SNAPSHOT.dfi_enforcement.retrieved_at, definition: 'Rows in the bounded DFI enforcement-actions HTML table.', counts: 'Source-native enforcement rows.', doesNotCount: 'Unique lenders, complaints, violations, or a complete historical bulk file.', researchDestination: '/washington', identityRule: 'Exact NMLS is required for adverse attachment; name-only rows stay at event grain.' }),
    measure({ key: 'wa_exact_nmls_orders', label: 'Washington exact-NMLS enforcement rows', value: WASHINGTON_SNAPSHOT.dfi_enforcement.exact_nmls_rows, family: 'REGULATORY_ENFORCEMENT', grain: 'enforcement-order row with printed NMLS identifier', entityClass: 'DFI enforcement row', geography: 'Washington', sourceSystem: 'Washington DFI', acceptedArtifact: 'lib/washington-intelligence/accepted-snapshot.json', sourceAsOf: 'Source date not reported', retrievedAt: WASHINGTON_SNAPSHOT.dfi_enforcement.retrieved_at, definition: 'DFI order rows carrying an exact printed NMLS identifier.', counts: 'Rows with exact NMLS evidence.', doesNotCount: 'A sequential funnel stage, unique companies, or proof every printed NMLS is institution-level.', researchDestination: '/washington', identityRule: 'Source does not type printed NMLS as institution versus person; preserve event grain.' }),
    measure({ key: 'wa_programs', label: 'Washington verified program families', value: WASHINGTON_SNAPSHOT.programs.verified_family_count, family: 'HOMEBUYER_PROGRAMS', grain: 'source-native program family', entityClass: 'state housing-finance program', geography: 'Washington', sourceSystem: 'Washington State Housing Finance Commission', acceptedArtifact: 'lib/washington-intelligence/accepted-snapshot.json', sourceAsOf: 'Source date not reported', retrievedAt: WASHINGTON_SNAPSHOT.programs.retrieved_at, definition: 'Accepted WSHFC and Here to Home program families.', counts: 'Documented program families.', doesNotCount: 'Borrower eligibility, approvals, funding guarantees, or rankings.', researchDestination: '/washington', identityRule: null }),
    measure({ key: 'wa_cfpb', label: 'Washington CFPB mortgage complaints', value: WASHINGTON_SNAPSHOT.cfpb.mortgage_complaint_rows, family: 'CONSUMER_COMPLAINTS', grain: 'CFPB mortgage complaint observation', entityClass: 'consumer-reported mortgage complaint', geography: 'Washington', sourceSystem: 'CFPB', acceptedArtifact: 'lib/washington-intelligence/accepted-snapshot.json', sourceAsOf: 'Source date not reported', retrievedAt: WASHINGTON_SNAPSHOT.cfpb.retrieved_at, definition: 'Mortgage complaint observations reported from Washington.', counts: 'CFPB complaint observations.', doesNotCount: 'Proven violations, findings, complaint rates, or quality.', researchDestination: '/washington', identityRule: 'No new fuzzy adverse matching.' }),
    measure({ key: 'az_cfpb', label: 'Arizona CFPB mortgage complaints', value: ARIZONA_SNAPSHOT.cfpb.mortgage_complaint_rows, family: 'CONSUMER_COMPLAINTS', grain: 'CFPB mortgage complaint observation', entityClass: 'consumer-reported mortgage complaint', geography: 'Arizona', sourceSystem: 'CFPB', acceptedArtifact: 'lib/arizona-intelligence/accepted-snapshot.json', sourceAsOf: ARIZONA_SNAPSHOT.cfpb.api_last_updated, retrievedAt: ARIZONA_SNAPSHOT.cfpb.retrieved_at, definition: 'Mortgage complaint observations reported from Arizona.', counts: 'CFPB complaint observations.', doesNotCount: 'Proven violations, complaint rates, risk, or lender quality.', researchDestination: '/arizona', identityRule: 'No new fuzzy adverse matching.' }),
    measure({ key: 'az_programs', label: 'Arizona statewide program families', value: ARIZONA_SNAPSHOT.programs.verified_family_count, family: 'HOMEBUYER_PROGRAMS', grain: 'source-native program family', entityClass: 'statewide housing-finance program', geography: 'Arizona', sourceSystem: 'Arizona IDA / Arizona Department of Housing', acceptedArtifact: 'lib/arizona-intelligence/accepted-snapshot.json', sourceAsOf: 'Source date not reported', retrievedAt: ARIZONA_SNAPSHOT.programs.retrieved_at, definition: 'Accepted statewide Arizona homebuyer program families.', counts: 'Documented program families.', doesNotCount: 'Eligible borrowers, approvals, local-only programs, or available funding.', researchDestination: '/arizona', identityRule: null }),
    measure({ key: 'az_difi_enforcement_unacquired', label: 'Arizona DIFI enforcement harvest', value: null, family: 'REGULATORY_ENFORCEMENT', grain: 'potential DIFI enforcement order', entityClass: 'mixed-domain DIFI enforcement publication', geography: 'Arizona', sourceSystem: 'Arizona DIFI', acceptedArtifact: 'lib/arizona-intelligence/accepted-snapshot.json', sourceAsOf: 'Source date not reported', generatedAt: ARIZONA_SNAPSHOT.generated_at, definition: 'The official table is documented, but the accepted automated acquisition was blocked.', counts: 'No numeric evidence total; this is an explicit coverage limitation.', doesNotCount: 'Zero orders, acquired lender actions, or a live license roster.', publicationStatus: 'PUBLIC_LIMITATION', researchDestination: '/arizona', identityRule: 'Future adverse attachment requires exact NMLS or DIFI license identity.' }),
    measure({ key: 'state_pages', label: 'Published state intelligence pages', value: LENDER_HOMEPAGE_STATE_CARDS.length, family: 'PUBLIC_RESEARCH_SURFACES', grain: 'published state intelligence page', entityClass: 'public research surface', geography: 'FL, NJ, CA, TX, WA, AZ', sourceSystem: 'Accepted state publication contracts', acceptedArtifact: 'LENDER_HOMEPAGE_STATE_CARDS', sourceAsOf: 'varies by state and evidence family', generatedAt: generated, definition: 'Live state intelligence destinations in the homepage state model.', counts: 'Published state pages derived from the same model rendered below.', doesNotCount: 'States with only national search results or a rating of research depth.', researchDestination: '#states', identityRule: null }),
    measure({ key: 'nj_county_pages', label: 'Published New Jersey county intelligence pages', value: metrics.network.njCountyIntelligencePages, family: 'PUBLIC_RESEARCH_SURFACES', grain: 'published county intelligence page', entityClass: 'public local research surface', geography: 'New Jersey', sourceSystem: 'Accepted network publication contract', acceptedArtifact: nationalArtifact, sourceAsOf: 'varies by county evidence module', generatedAt: generated, definition: 'Published New Jersey county research surfaces in the accepted network contract.', counts: 'County intelligence pages.', doesNotCount: 'County license systems, lenders, applications, or statewide coverage.', researchDestination: '/new-jersey', identityRule: null }),
  ];
}

export function assertPublicHomepageInventory(inventory: HomepageEvidenceMeasure[]): void {
  const allowedPublicationStatuses = new Set<HomepageEvidenceMeasure['publicationStatus']>(['PUBLIC', 'PUBLIC_LIMITATION']);
  const keys = new Set(inventory.map((item) => item.key));
  if (keys.size !== inventory.length) throw new Error('Homepage evidence inventory keys must be unique');
  if (inventory.some((item) => !allowedPublicationStatuses.has(item.publicationStatus))) throw new Error('Homepage evidence inventory contains a non-public publication status');
  if (LENDER_HOMEPAGE_STATE_CARDS.length !== 6) throw new Error('Homepage must publish exactly the six accepted state intelligence cards');
  if (!inventory.some((item) => item.key === 'wa_dfi_orders') || !inventory.some((item) => item.key === 'az_difi_enforcement_unacquired')) throw new Error('State enforcement semantics missing');
  if (inventory.some((item) => /person_mlo|branch_entities|private/i.test(item.key))) throw new Error('Internal person, branch, or private counts cannot publish');
  if (inventory.some((item) => /grand total|mortgage records/i.test(item.label))) throw new Error('Cross-grain totals cannot publish');
}
