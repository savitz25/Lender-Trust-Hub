// Generator-only source adapters. The homepage reads the generated contract.
import { ARIZONA_SNAPSHOT } from '@/lib/arizona-intelligence/snapshot';
import { COLORADO_SNAPSHOT } from '@/lib/colorado-intelligence/snapshot';
import { VIRGINIA_SNAPSHOT } from '@/lib/virginia-intelligence/snapshot';
import { NEW_YORK_SNAPSHOT } from '@/lib/new-york-intelligence/snapshot';
import { ILLINOIS_SNAPSHOT } from '@/lib/illinois-intelligence/snapshot';
import { OREGON_SNAPSHOT } from '@/lib/oregon-intelligence/snapshot';
import { PENNSYLVANIA_SNAPSHOT } from '@/lib/pennsylvania-intelligence/snapshot';
import { NORTH_CAROLINA_SNAPSHOT } from '@/lib/north-carolina-intelligence/snapshot';
import { CALIFORNIA_SNAPSHOT } from '@/lib/california-intelligence/snapshot';
import { FLORIDA_SNAPSHOT } from '@/lib/florida-intelligence/snapshot';
import { NEW_JERSEY_SNAPSHOT } from '@/lib/new-jersey-intelligence/snapshot';
import { TEXAS_SNAPSHOT } from '@/lib/texas-intelligence/snapshot';
import { WASHINGTON_SNAPSHOT } from '@/lib/washington-intelligence/snapshot';
import type { LenderNetworkMetricsV1 } from '@/lib/metrics/lender-network-metrics-v1';
import type { HomepageEvidenceMeasure, HomepageStateCard, LenderEvidenceFamily } from '../home-intel/types';

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

export function buildLenderHomepageStateCards(metrics: LenderNetworkMetricsV1): HomepageStateCard[] { return [
  {
    code: 'FL',
    name: 'Florida',
    href: '/florida',
    regulators: 'Florida OFR · HMDA/FFIEC · CFPB',
    sourceClocks: [
      { label: 'Florida OFR roster', sourceAsOf: metrics.florida.ofrSourceAsOf, retrievedAt: null },
      { label: 'HMDA vintage', sourceAsOf: '2025', retrievedAt: null },
      { label: 'CFPB complaints through', sourceAsOf: FLORIDA_SNAPSHOT.cfpb.date_max, retrievedAt: FLORIDA_SNAPSHOT.cfpb.observed },
    ],
    evidence: ['Chapter 494 company credentials', 'HMDA market activity', 'OFR final-agency-action observations', 'CFPB mortgage complaints'],
    identityNote: `${fmt(metrics.florida.confirmedNmls)} exact confirmed NMLS identities; credential rows remain distinct from companies.`,
    limitation: 'An approved credential is not an endorsement. Unresolved OFR observations are not attached to current profiles.',
    highlights: [
      { label: 'Approved company credentials', value: fmt(metrics.florida.approvedCredentials), grain: 'credential rows' },
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
  {
    code: 'CO',
    name: 'Colorado',
    href: '/colorado',
    regulators: 'Colorado DRE · NMLS · CHFA · HMDA/FFIEC · CFPB',
    sourceClocks: [
      { label: 'HMDA vintage', sourceAsOf: '2025', retrievedAt: null },
      { label: 'DRE MLO extract', sourceAsOf: COLORADO_SNAPSHOT.mlo_roster.source_as_of, retrievedAt: COLORADO_SNAPSHOT.mlo_roster.retrieved_at },
      { label: 'CFPB complaints', sourceAsOf: null, retrievedAt: COLORADO_SNAPSHOT.cfpb.retrieved_at },
    ],
    evidence: ['HMDA market activity', 'DRE MLO person licenses', 'NMLS company-registration search path', 'CHFA program resources', 'CFPB complaints'],
    identityNote: `${fmt(COLORADO_SNAPSHOT.mlo_roster.rows)} DRE MLO person rows; no current mortgage-company bulk roster was acquired.`,
    limitation: 'MLO rows are people, not lenders. Company registration remains search-only. CHFA participation is not licensure or endorsement.',
    highlights: [
      { label: 'HMDA applications', value: fmt(COLORADO_SNAPSHOT.hmda.applications), grain: '2025 applications' },
      { label: 'DRE MLO license rows', value: fmt(COLORADO_SNAPSHOT.mlo_roster.rows), grain: 'person license rows' },
      { label: 'CFPB mortgage complaints', value: fmt(COLORADO_SNAPSHOT.cfpb.mortgage_complaint_rows), grain: 'complaint observations' },
    ],
  },
  {
    code: 'VA',
    name: 'Virginia',
    href: '/virginia',
    regulators: 'Virginia SCC BFI · NMLS · Virginia Housing · HMDA/FFIEC · CFPB',
    sourceClocks: [
      { label: 'SCC dated roster', sourceAsOf: VIRGINIA_SNAPSHOT.scc_roster.source_as_of, retrievedAt: VIRGINIA_SNAPSHOT.scc_roster.retrieved_at },
      { label: 'HMDA vintage', sourceAsOf: '2025', retrievedAt: null },
      { label: 'CFPB complaints', sourceAsOf: null, retrievedAt: VIRGINIA_SNAPSHOT.cfpb.retrieved_at },
    ],
    evidence: ['SCC 2025 dated mortgage-company list', 'exact MC/NMLS crosswalks', 'HMDA market activity', 'CFPB complaints', 'Virginia Housing programs'],
    identityNote: `${fmt(VIRGINIA_SNAPSHOT.scc_roster.exact_va_to_nmls_crosswalks)} exact VA-MC to NMLS crosswalks; dated 2025-12-31 rows are not current 2026 licenses.`,
    limitation: 'Broker, lender, and lender-broker stay separate. The live 2026 roster is search-only. MLOs are people, not companies.',
    highlights: [
      { label: 'SCC brokers as of 2025-12-31', value: fmt(VIRGINIA_SNAPSHOT.scc_roster.scc_reported.brokers_companies), grain: 'dated company licensees' },
      { label: 'HMDA applications', value: fmt(VIRGINIA_SNAPSHOT.hmda.applications), grain: '2025 applications' },
      { label: 'CFPB mortgage complaints', value: fmt(VIRGINIA_SNAPSHOT.cfpb.mortgage_complaint_rows), grain: 'complaint observations' },
    ],
  },
  {
    code: 'NY',
    name: 'New York',
    href: '/new-york',
    regulators: 'NYDFS · NMLS · HMDA/FFIEC · CFPB · FDIC',
    sourceClocks: [
      { label: 'DFS annual aggregates', sourceAsOf: NEW_YORK_SNAPSHOT.dfs_2024_aggregates.source_as_of, retrievedAt: NEW_YORK_SNAPSHOT.retrieved_at },
      { label: 'HMDA vintage', sourceAsOf: '2025', retrievedAt: null },
      { label: 'Enforcement table', sourceAsOf: NEW_YORK_SNAPSHOT.enforcement.date_max, retrievedAt: NEW_YORK_SNAPSHOT.retrieved_at },
    ],
    evidence: ['DFS 2024 dated class aggregates', '2026 Weekly Bulletin activity', 'Mortgage enforcement actions', 'HMDA market activity', 'FDIC depository overlay'],
    identityNote: 'Current NYDFS/NMLS company roster is search-only. 2024 aggregates are not current 2026 licenses.',
    limitation: 'Banker, broker, servicer, and MLO stay separate. Do not add banker and broker classes. MLOs are people, not companies.',
    highlights: [
      { label: 'DFS bankers end of 2024', value: fmt(NEW_YORK_SNAPSHOT.dfs_2024_aggregates.licensed_mortgage_bankers), grain: 'dated class aggregate' },
      { label: 'HMDA applications', value: fmt(NEW_YORK_SNAPSHOT.hmda.applications), grain: '2025 applications' },
      { label: 'DFS enforcement observations', value: fmt(NEW_YORK_SNAPSHOT.enforcement.observation_rows), grain: 'action observations' },
    ],
  },
  {
    code: 'IL',
    name: 'Illinois',
    href: '/illinois',
    regulators: 'IDFPR · NMLS · HMDA/FFIEC · FDIC · CFPB',
    sourceClocks: [
      { label: 'HMDA vintage', sourceAsOf: '2025', retrievedAt: null },
      { label: 'FDIC overlay', sourceAsOf: ILLINOIS_SNAPSHOT.fdic.source_as_of, retrievedAt: ILLINOIS_SNAPSHOT.fdic.retrieved_at },
      { label: 'Current mortgage-company roster', sourceAsOf: null, retrievedAt: null },
    ],
    evidence: ['HMDA 2025 Illinois market activity', 'FDIC depository overlay', 'IDFPR/NMLS search-only current licensing'],
    identityNote: 'Current IDFPR/NMLS company roster is search-only. HMDA applications are not lenders. FDIC banks are not IDFPR mortgage bankers.',
    limitation: 'No Chicago/Cook intelligence routes. Missing roster is not zero companies.',
    highlights: [
      { label: 'HMDA applications', value: fmt(ILLINOIS_SNAPSHOT.hmda.applications), grain: '2025 applications' },
      { label: 'HMDA originations', value: fmt(ILLINOIS_SNAPSHOT.hmda.originations), grain: '2025 originations' },
      { label: 'FDIC depositories', value: fmt(ILLINOIS_SNAPSHOT.fdic.institution_rows), grain: 'existing overlay institutions' },
    ],
  },
  {
    code: 'OR',
    name: 'Oregon',
    href: '/oregon',
    regulators: 'DFR · NMLS · HMDA/FFIEC · FDIC · OHCS · CFPB',
    sourceClocks: [
      { label: 'HMDA vintage', sourceAsOf: '2025', retrievedAt: null },
      { label: 'FDIC overlay', sourceAsOf: OREGON_SNAPSHOT.fdic.source_as_of, retrievedAt: OREGON_SNAPSHOT.fdic.retrieved_at },
      { label: 'Current mortgage-company roster', sourceAsOf: null, retrievedAt: null },
    ],
    evidence: ['HMDA 2025 Oregon market activity', 'FDIC depository overlay', 'DFR mortgage orders', 'OHCS Flex Lending approved lenders', 'DFR/NMLS search-only current licensing'],
    identityNote: 'Current DFR/NMLS company roster is search-only. HMDA applications are not lenders. OHCS Flex lenders are not the license universe.',
    limitation: 'No Portland/Multnomah intelligence routes. Missing roster is not zero companies.',
    highlights: [
      { label: 'HMDA applications', value: fmt(OREGON_SNAPSHOT.hmda.applications), grain: '2025 applications' },
      { label: 'HMDA originations', value: fmt(OREGON_SNAPSHOT.hmda.originations), grain: '2025 originations' },
      { label: 'FDIC depositories', value: fmt(OREGON_SNAPSHOT.fdic.institution_rows), grain: 'existing overlay institutions' },
    ],
  },
  {
    code: 'PA',
    name: 'Pennsylvania',
    href: '/pennsylvania',
    regulators: 'DoBS · NMLS · HMDA/FFIEC · FDIC · CFPB · PHFA',
    sourceClocks: [
      { label: 'HMDA vintage', sourceAsOf: '2025', retrievedAt: null },
      { label: 'CFPB 2025 complaints', sourceAsOf: PENNSYLVANIA_SNAPSHOT.cfpb.period, retrievedAt: PENNSYLVANIA_SNAPSHOT.cfpb.retrieved_at },
      { label: 'Current NMLS roster', sourceAsOf: null, retrievedAt: null },
    ],
    evidence: ['HMDA 2025 Pennsylvania market activity', 'CFPB 2025 mortgage complaints', 'PHFA participating lenders', 'DoBS/NMLS search-only current licensing'],
    identityNote: 'Current DoBS/NMLS company roster is search-only. Open Data class rows are not an NMLS census. HMDA applications are not lenders. PHFA participants are not the license universe.',
    limitation: 'No Philadelphia/Pittsburgh intelligence routes. Missing NMLS roster is not zero companies. Do not headline the mixed DoBS 28,450 non-bank figure.',
    highlights: [
      { label: 'HMDA applications', value: fmt(PENNSYLVANIA_SNAPSHOT.hmda.applications), grain: '2025 applications' },
      { label: 'HMDA originations', value: fmt(PENNSYLVANIA_SNAPSHOT.hmda.originations), grain: '2025 originations' },
      { label: 'CFPB 2025 mortgage complaints', value: fmt(PENNSYLVANIA_SNAPSHOT.cfpb.PA_CFPB_2025_MORTGAGE_COMPLAINT_ROWS), grain: 'calendar-year complaint IDs' },
    ],
  },
  {
    code: 'NC',
    name: 'North Carolina',
    href: '/north-carolina',
    regulators: 'NCCOB · NMLS · HMDA/FFIEC · FDIC · CFPB · NCHFA',
    sourceClocks: [
      { label: 'HMDA vintage', sourceAsOf: '2025', retrievedAt: null },
      { label: 'CFPB 2025 complaints', sourceAsOf: NORTH_CAROLINA_SNAPSHOT.cfpb.period, retrievedAt: NORTH_CAROLINA_SNAPSHOT.cfpb.retrieved_at },
      { label: 'NCCOB current company Show All', sourceAsOf: NORTH_CAROLINA_SNAPSHOT.source_as_of.nccob_current_companies, retrievedAt: NORTH_CAROLINA_SNAPSHOT.retrieved_at },
    ],
    evidence: ['HMDA 2025 North Carolina market activity', 'NCCOB current license classes', 'CFPB 2025 mortgage complaints', 'NCCOB mortgage enforcement', 'NCHFA program finder (search-only)'],
    identityNote: 'Current NCCOB Show All is class-separated. 640 Mortgage Lender licenses are not 574 brokers, 62 servicers, 104 MOSR, or the mixed 1,380 current entities. HMDA applications are not lenders. NCHFA participants are not the license universe.',
    limitation: 'No Charlotte/Raleigh intelligence routes. Do not headline the mixed 1,380 current-entity figure. NCHFA preferred/top language is the Agency’s, not a TrustHub ranking.',
    highlights: [
      { label: 'HMDA applications', value: fmt(NORTH_CAROLINA_SNAPSHOT.hmda.applications), grain: '2025 applications' },
      { label: 'HMDA originations', value: fmt(NORTH_CAROLINA_SNAPSHOT.hmda.originations), grain: '2025 originations' },
      { label: 'CFPB 2025 mortgage complaints', value: fmt(NORTH_CAROLINA_SNAPSHOT.cfpb.NC_CFPB_2025_MORTGAGE_COMPLAINT_ROWS), grain: 'calendar-year complaint IDs' },
    ],
  },
]; }

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
    measure({ key: 'fl_credentials', label: 'Florida approved company credentials', value: metrics.florida.approvedCredentials, family: 'INSTITUTION_IDENTITY_LICENSING', grain: 'approved MBR/MLD credential row', entityClass: 'Florida Chapter 494 company credential', geography: 'Florida', sourceSystem: 'Florida Office of Financial Regulation', acceptedArtifact: 'data/home/lender-metric-census-r2-03.json', sourceAsOf: metrics.florida.ofrSourceAsOf, generatedAt: FLORIDA_SNAPSHOT.generated_at, definition: 'Current approved Chapter 494 company credential rows.', counts: 'Approved MBR and MLD credential rows.', doesNotCount: 'Unique companies, branches, MLOs, service areas, or endorsements.', researchDestination: '/florida', identityRule: 'State credential rows join to institutions only through confirmed NMLS identity.' }),
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
    measure({ key: 'co_dre_mlo', label: 'Colorado DRE Mortgage Loan Originator rows', value: COLORADO_SNAPSHOT.mlo_roster.rows, family: 'INSTITUTION_IDENTITY_LICENSING', grain: 'person MLO license row', entityClass: 'Colorado individual mortgage loan originator', geography: 'Colorado', sourceSystem: 'Colorado Division of Real Estate', acceptedArtifact: 'lib/colorado-intelligence/accepted-snapshot.json', sourceAsOf: COLORADO_SNAPSHOT.mlo_roster.source_as_of ?? 'Source date not reported', retrievedAt: COLORADO_SNAPSHOT.mlo_roster.retrieved_at, definition: 'Person-grain DRE MLO license rows in the accepted CIM extract.', counts: 'MLO license rows, separately from companies, HMDA, and complaints.', doesNotCount: 'Lenders, branches, NMLS Individual IDs, or a public person directory.', researchDestination: '/colorado', identityRule: 'CO-DORA:MLO:{licenseNumber}. License number is not inferred as NMLS Individual ID.' }),
    measure({ key: 'co_cfpb', label: 'Colorado CFPB mortgage complaints', value: COLORADO_SNAPSHOT.cfpb.mortgage_complaint_rows, family: 'CONSUMER_COMPLAINTS', grain: 'CFPB mortgage complaint observation', entityClass: 'consumer-reported mortgage complaint', geography: 'Colorado', sourceSystem: 'CFPB', acceptedArtifact: 'lib/colorado-intelligence/accepted-snapshot.json', sourceAsOf: 'Source date not reported', retrievedAt: COLORADO_SNAPSHOT.cfpb.retrieved_at, definition: 'Mortgage complaint observations reported from Colorado.', counts: 'CFPB complaint observations.', doesNotCount: 'Proven violations, DRE complaints, complaint rates, or lender quality.', researchDestination: '/colorado', identityRule: 'No new fuzzy adverse matching.' }),
    measure({ key: 'co_company_roster_unacquired', label: 'Colorado mortgage-company registration roster', value: null, family: 'INSTITUTION_IDENTITY_LICENSING', grain: 'potential NMLS company registration', entityClass: 'Colorado mortgage-company registration', geography: 'Colorado', sourceSystem: 'Colorado DRE / NMLS', acceptedArtifact: 'lib/colorado-intelligence/accepted-snapshot.json', sourceAsOf: 'SOURCE_NOT_ACQUIRED', generatedAt: COLORADO_SNAPSHOT.generated_at, definition: 'No current public bulk company-registration roster was acquired.', counts: 'No numeric evidence total; this is an explicit coverage limitation.', doesNotCount: 'Zero companies, MLO people, or a lender census.', publicationStatus: 'PUBLIC_LIMITATION', researchDestination: '/colorado', identityRule: 'Future company attachment requires exact NMLS Company ID.' }),
    measure({ key: 'va_scc_dated_rows', label: 'Virginia SCC 2025 dated mortgage-company rows', value: VIRGINIA_SNAPSHOT.scc_roster.rows, family: 'INSTITUTION_IDENTITY_LICENSING', grain: 'dated SCC company-licensee row', entityClass: 'Virginia mortgage broker, lender, or lender-broker', geography: 'Virginia', sourceSystem: 'Virginia SCC Bureau of Financial Institutions', acceptedArtifact: 'lib/virginia-intelligence/accepted-snapshot.json', sourceAsOf: VIRGINIA_SNAPSHOT.scc_roster.source_as_of, retrievedAt: VIRGINIA_SNAPSHOT.scc_roster.retrieved_at, definition: 'Dated official company-licensee rows as of 2025-12-31.', counts: 'List rows with exact MC and NMLS identifiers.', doesNotCount: 'Current 2026 licenses, unique consumer lenders, MLOs, or offices.', researchDestination: '/virginia', identityRule: 'VA-SCC-BFI:{MC} and NMLS:{id} when SCC prints both. Name-only fill is forbidden.' }),
    measure({ key: 'va_cfpb', label: 'Virginia CFPB mortgage complaints', value: VIRGINIA_SNAPSHOT.cfpb.mortgage_complaint_rows, family: 'CONSUMER_COMPLAINTS', grain: 'CFPB mortgage complaint observation', entityClass: 'consumer-reported mortgage complaint', geography: 'Virginia', sourceSystem: 'CFPB', acceptedArtifact: 'lib/virginia-intelligence/accepted-snapshot.json', sourceAsOf: 'Source date not reported', retrievedAt: VIRGINIA_SNAPSHOT.cfpb.retrieved_at, definition: 'Mortgage complaint observations reported from Virginia.', counts: 'CFPB complaint observations.', doesNotCount: 'Proven violations, SCC enforcement, complaint rates, or lender quality.', researchDestination: '/virginia', identityRule: 'No new fuzzy adverse matching.' }),
    measure({ key: 'va_live_roster_unacquired', label: 'Virginia current 2026 mortgage-company roster', value: null, family: 'INSTITUTION_IDENTITY_LICENSING', grain: 'potential current NMLS company registration', entityClass: 'Virginia mortgage-company registration', geography: 'Virginia', sourceSystem: 'NMLS Consumer Access', acceptedArtifact: 'lib/virginia-intelligence/accepted-snapshot.json', sourceAsOf: 'SOURCE_NOT_ACQUIRED', generatedAt: VIRGINIA_SNAPSHOT.generated_at, definition: 'Current 2026 license status was not bulk-acquired. SCC points current records to NMLS Consumer Access.', counts: 'No numeric evidence total; this is an explicit coverage limitation.', doesNotCount: 'Zero companies or that the 2025 dated list is current.', publicationStatus: 'PUBLIC_LIMITATION', researchDestination: '/virginia', identityRule: 'Current verification requires an exact NMLS Company ID search.' }),
    measure({ key: 'ny_dfs_2024_bankers', label: 'New York DFS 2024 licensed mortgage bankers', value: NEW_YORK_SNAPSHOT.dfs_2024_aggregates.licensed_mortgage_bankers, family: 'INSTITUTION_IDENTITY_LICENSING', grain: 'dated DFS class aggregate', entityClass: 'New York licensed mortgage banker', geography: 'New York', sourceSystem: 'NYDFS 2024 Annual Report', acceptedArtifact: 'lib/new-york-intelligence/accepted-snapshot.json', sourceAsOf: NEW_YORK_SNAPSHOT.dfs_2024_aggregates.source_as_of, retrievedAt: NEW_YORK_SNAPSHOT.retrieved_at, definition: 'Dated end-of-2024 licensed mortgage banker aggregate.', counts: 'One DFS class aggregate, not brokers, servicers, or MLOs.', doesNotCount: 'Current 2026 licensees, unique consumer lenders, or 151+439.', researchDestination: '/new-york', identityRule: 'NMLS Company ID when source-native. Name-only fill is forbidden.' }),
    measure({ key: 'ny_enforcement', label: 'New York DFS mortgage enforcement observations', value: NEW_YORK_SNAPSHOT.enforcement.observation_rows, family: 'REGULATORY_ENFORCEMENT', grain: 'enforcement-action observation', entityClass: 'company, person, or mixed subject', geography: 'New York', sourceSystem: 'NYDFS Mortgage Banking Enforcement Actions', acceptedArtifact: 'lib/new-york-intelligence/accepted-snapshot.json', sourceAsOf: NEW_YORK_SNAPSHOT.enforcement.date_max, retrievedAt: NEW_YORK_SNAPSHOT.retrieved_at, definition: 'Rows in the official Mortgage Banking Enforcement Actions HTML table.', counts: 'Dated action observations.', doesNotCount: 'Unique companies, convictions, or a quality score.', researchDestination: '/new-york', identityRule: 'No NAIC/NMLS column; name-only adverse attachment is UNSAFE.' }),
    measure({ key: 'ny_live_roster_unacquired', label: 'New York current 2026 mortgage-company roster', value: null, family: 'INSTITUTION_IDENTITY_LICENSING', grain: 'potential current NMLS company registration', entityClass: 'New York mortgage banker, broker, or servicer', geography: 'New York', sourceSystem: 'NYDFS / NMLS Consumer Access', acceptedArtifact: 'lib/new-york-intelligence/accepted-snapshot.json', sourceAsOf: 'SOURCE_NOT_ACQUIRED', generatedAt: NEW_YORK_SNAPSHOT.generated_at, definition: 'No clean official bulk current company roster was acquired.', counts: 'No numeric evidence total; this is an explicit coverage limitation.', doesNotCount: 'Zero companies or that the 2024 aggregates are current.', publicationStatus: 'PUBLIC_LIMITATION', researchDestination: '/new-york', identityRule: 'Current verification requires NYDFS + NMLS Consumer Access.' }),
    measure({ key: 'il_hmda_apps', label: 'Illinois HMDA 2025 applications', value: ILLINOIS_SNAPSHOT.hmda.applications, family: 'MORTGAGE_MARKET_ACTIVITY', grain: 'county-grain HMDA application observation', entityClass: 'mortgage application', geography: 'Illinois property location', sourceSystem: 'CFPB HMDA', acceptedArtifact: 'lib/illinois-intelligence/accepted-snapshot.json', sourceAsOf: '2025', retrievedAt: ILLINOIS_SNAPSHOT.hmda.retrieved_at, definition: 'Applications for properties in Illinois.', counts: 'HMDA applications, not lenders.', doesNotCount: 'Illinois mortgage companies, FDIC banks, or current licenses.', researchDestination: '/illinois', identityRule: 'Property geography is not headquarters or license jurisdiction.' }),
    measure({ key: 'il_fdic', label: 'Illinois FDIC depository institutions', value: ILLINOIS_SNAPSHOT.fdic.institution_rows, family: 'DEPOSITORY_BANK', grain: 'FDIC-insured depository overlay row', entityClass: 'depository institution', geography: 'Illinois', sourceSystem: 'FDIC', acceptedArtifact: 'lib/fdic/data/illinois.json', sourceAsOf: ILLINOIS_SNAPSHOT.fdic.source_as_of, retrievedAt: ILLINOIS_SNAPSHOT.fdic.retrieved_at, definition: 'Existing FDIC Illinois overlay.', counts: 'Depository institutions in the overlay.', doesNotCount: 'IDFPR mortgage bankers or HMDA lenders.', researchDestination: '/illinois', identityRule: 'FDIC CERT is not an IDFPR mortgage license.' }),
    measure({ key: 'il_live_roster_unacquired', label: 'Illinois current mortgage-company roster', value: null, family: 'INSTITUTION_IDENTITY_LICENSING', grain: 'potential current NMLS company registration', entityClass: 'Illinois mortgage company', geography: 'Illinois', sourceSystem: 'IDFPR / NMLS Consumer Access', acceptedArtifact: 'lib/illinois-intelligence/accepted-snapshot.json', sourceAsOf: 'SOURCE_NOT_ACQUIRED', generatedAt: ILLINOIS_SNAPSHOT.generated_at, definition: 'No bulk current Illinois mortgage-company roster was acquired.', counts: 'No numeric evidence total; this is an explicit coverage limitation.', doesNotCount: 'Zero companies or that HMDA/FDIC counts are that census.', publicationStatus: 'PUBLIC_LIMITATION', researchDestination: '/illinois', identityRule: 'Current verification requires IDFPR + NMLS Consumer Access.' }),
    measure({ key: 'or_hmda_apps', label: 'Oregon HMDA 2025 applications', value: OREGON_SNAPSHOT.hmda.applications, family: 'MORTGAGE_MARKET_ACTIVITY', grain: 'county-grain HMDA application observation', entityClass: 'mortgage application', geography: 'Oregon property location', sourceSystem: 'CFPB HMDA', acceptedArtifact: 'lib/oregon-intelligence/accepted-snapshot.json', sourceAsOf: '2025', retrievedAt: OREGON_SNAPSHOT.hmda.retrieved_at, definition: 'Applications for properties in Oregon.', counts: 'HMDA applications, not lenders.', doesNotCount: 'Oregon mortgage companies, FDIC banks, OHCS Flex lenders, or current licenses.', researchDestination: '/oregon', identityRule: 'Property geography is not headquarters or license jurisdiction.' }),
    measure({ key: 'or_fdic', label: 'Oregon FDIC depository institutions', value: OREGON_SNAPSHOT.fdic.institution_rows, family: 'DEPOSITORY_BANK', grain: 'FDIC-insured depository overlay row', entityClass: 'depository institution', geography: 'Oregon', sourceSystem: 'FDIC', acceptedArtifact: 'lib/fdic/data/oregon.json', sourceAsOf: OREGON_SNAPSHOT.fdic.source_as_of, retrievedAt: OREGON_SNAPSHOT.fdic.retrieved_at, definition: 'Existing FDIC Oregon overlay.', counts: 'Depository institutions in the overlay.', doesNotCount: 'DFR mortgage bankers or HMDA lenders.', researchDestination: '/oregon', identityRule: 'FDIC CERT is not a DFR mortgage license.' }),
    measure({ key: 'or_live_roster_unacquired', label: 'Oregon current mortgage-company roster', value: null, family: 'INSTITUTION_IDENTITY_LICENSING', grain: 'potential current NMLS company registration', entityClass: 'Oregon mortgage company', geography: 'Oregon', sourceSystem: 'DFR / NMLS Consumer Access', acceptedArtifact: 'lib/oregon-intelligence/accepted-snapshot.json', sourceAsOf: 'SOURCE_NOT_ACQUIRED', generatedAt: OREGON_SNAPSHOT.generated_at, definition: 'No bulk current Oregon mortgage-company roster was acquired.', counts: 'No numeric evidence total; this is an explicit coverage limitation.', doesNotCount: 'Zero companies or that HMDA/FDIC/OHCS counts are that census.', publicationStatus: 'PUBLIC_LIMITATION', researchDestination: '/oregon', identityRule: 'Current verification requires DFR + NMLS Consumer Access.' }),
    measure({ key: 'pa_hmda_apps', label: 'Pennsylvania HMDA 2025 applications', value: PENNSYLVANIA_SNAPSHOT.hmda.applications, family: 'MORTGAGE_MARKET_ACTIVITY', grain: 'county-grain HMDA application observation', entityClass: 'mortgage application', geography: 'Pennsylvania property location', sourceSystem: 'CFPB HMDA', acceptedArtifact: 'lib/pennsylvania-intelligence/accepted-snapshot.json', sourceAsOf: '2025', retrievedAt: PENNSYLVANIA_SNAPSHOT.hmda.retrieved_at, definition: 'Applications for properties in Pennsylvania.', counts: 'HMDA applications, not lenders.', doesNotCount: 'Pennsylvania mortgage companies, FDIC banks, PHFA participants, or current NMLS licenses.', researchDestination: '/pennsylvania', identityRule: 'Property geography is not headquarters or license jurisdiction.' }),
    measure({ key: 'pa_cfpb', label: 'Pennsylvania CFPB 2025 mortgage complaints', value: PENNSYLVANIA_SNAPSHOT.cfpb.PA_CFPB_2025_MORTGAGE_COMPLAINT_ROWS, family: 'CONSUMER_COMPLAINTS', grain: 'CFPB mortgage complaint ID', entityClass: 'consumer complaint', geography: 'Pennsylvania', sourceSystem: 'CFPB', acceptedArtifact: 'lib/pennsylvania-intelligence/accepted-snapshot.json', sourceAsOf: PENNSYLVANIA_SNAPSHOT.cfpb.period, retrievedAt: PENNSYLVANIA_SNAPSHOT.cfpb.retrieved_at, definition: 'Calendar-year 2025 CFPB mortgage complaints with state PA.', counts: 'Complaint IDs, not findings or licensed companies.', doesNotCount: 'DoBS orders or NMLS identities.', publicationStatus: 'PUBLIC', researchDestination: '/pennsylvania', identityRule: 'Company name is not an NMLS identity.' }),
    measure({ key: 'pa_live_roster_unacquired', label: 'Pennsylvania current NMLS mortgage-company roster', value: null, family: 'INSTITUTION_IDENTITY_LICENSING', grain: 'potential current NMLS company registration', entityClass: 'Pennsylvania mortgage company', geography: 'Pennsylvania', sourceSystem: 'DoBS / NMLS Consumer Access', acceptedArtifact: 'lib/pennsylvania-intelligence/accepted-snapshot.json', sourceAsOf: 'SOURCE_NOT_ACQUIRED', generatedAt: PENNSYLVANIA_SNAPSHOT.generated_at, definition: 'No bulk current NMLS mortgage-company roster was acquired.', counts: 'No numeric evidence total; this is an explicit coverage limitation.', doesNotCount: 'Zero companies or that HMDA/Open Data/PHFA/FDIC counts are that census.', publicationStatus: 'PUBLIC_LIMITATION', researchDestination: '/pennsylvania', identityRule: 'Current verification requires DoBS + NMLS Consumer Access.' }),
    measure({ key: 'nc_hmda_apps', label: 'North Carolina HMDA 2025 applications', value: NORTH_CAROLINA_SNAPSHOT.hmda.applications, family: 'MORTGAGE_MARKET_ACTIVITY', grain: 'county-grain HMDA application observation', entityClass: 'mortgage application', geography: 'North Carolina property location', sourceSystem: 'CFPB HMDA', acceptedArtifact: 'lib/north-carolina-intelligence/accepted-snapshot.json', sourceAsOf: '2025', retrievedAt: NORTH_CAROLINA_SNAPSHOT.hmda.retrieved_at, definition: 'Applications for properties in North Carolina.', counts: 'HMDA applications, not lenders.', doesNotCount: 'North Carolina mortgage companies, FDIC banks, NCHFA participants, or current NCCOB licenses.', researchDestination: '/north-carolina', identityRule: 'Property geography is not headquarters or license jurisdiction.' }),
    measure({ key: 'nc_cfpb', label: 'North Carolina CFPB 2025 mortgage complaints', value: NORTH_CAROLINA_SNAPSHOT.cfpb.NC_CFPB_2025_MORTGAGE_COMPLAINT_ROWS, family: 'CONSUMER_COMPLAINTS', grain: 'CFPB mortgage complaint ID', entityClass: 'consumer complaint', geography: 'North Carolina', sourceSystem: 'CFPB', acceptedArtifact: 'lib/north-carolina-intelligence/accepted-snapshot.json', sourceAsOf: NORTH_CAROLINA_SNAPSHOT.cfpb.period, retrievedAt: NORTH_CAROLINA_SNAPSHOT.cfpb.retrieved_at, definition: 'Calendar-year 2025 CFPB mortgage complaints with state NC.', counts: 'Complaint IDs, not findings or licensed companies.', doesNotCount: 'NCCOB orders or NMLS identities.', publicationStatus: 'PUBLIC', researchDestination: '/north-carolina', identityRule: 'Company name is not an NMLS identity.' }),
    measure({ key: 'nc_nccob_mortgage_lenders', label: 'North Carolina current NCCOB Mortgage Lender licenses', value: NORTH_CAROLINA_SNAPSHOT.current_roster.NC_MORTGAGE_LENDER_ROWS, family: 'INSTITUTION_IDENTITY_LICENSING', grain: 'current NCCOB Mortgage Lender license row', entityClass: 'North Carolina mortgage lender', geography: 'North Carolina', sourceSystem: 'NCCOB Licensee Search Show All', acceptedArtifact: 'lib/north-carolina-intelligence/accepted-snapshot.json', sourceAsOf: NORTH_CAROLINA_SNAPSHOT.source_as_of.nccob_current_companies, retrievedAt: NORTH_CAROLINA_SNAPSHOT.retrieved_at, definition: 'Current NCCOB Mortgage Lender licenses in Show All.', counts: 'One NCCOB class, not brokers, servicers, MOSR, or MLOs.', doesNotCount: 'The mixed 1,380 current entities, HMDA applications, FDIC banks, or NCHFA participants.', publicationStatus: 'PUBLIC', researchDestination: '/north-carolina', identityRule: 'NC-NCCOB-LICENSE:{licenseNumber} and source-native NMLS:{id}. Name-only fill is forbidden.' }),
    measure({ key: 'state_pages', label: 'Published state intelligence pages', value: metrics.network.publishedStateIntelligencePages, family: 'PUBLIC_RESEARCH_SURFACES', grain: 'published state intelligence page', entityClass: 'public research surface', geography: 'FL, NJ, CA, TX, WA, AZ, CO, VA, NY, IL, OR, PA, NC', sourceSystem: 'Accepted state publication contracts', acceptedArtifact: 'LENDER_HOMEPAGE_STATE_CARDS', sourceAsOf: 'varies by state and evidence family', generatedAt: generated, definition: 'Live state intelligence destinations in the homepage state model.', counts: 'Published state pages derived from the same model rendered below.', doesNotCount: 'States with only national search results or a rating of research depth.', researchDestination: '#states', identityRule: null }),
    measure({ key: 'nj_county_pages', label: 'Published New Jersey county intelligence pages', value: metrics.network.njCountyIntelligencePages, family: 'PUBLIC_RESEARCH_SURFACES', grain: 'published county intelligence page', entityClass: 'public local research surface', geography: 'New Jersey', sourceSystem: 'Accepted network publication contract', acceptedArtifact: nationalArtifact, sourceAsOf: 'varies by county evidence module', generatedAt: generated, definition: 'Published New Jersey county research surfaces in the accepted network contract.', counts: 'County intelligence pages.', doesNotCount: 'County license systems, lenders, applications, or statewide coverage.', researchDestination: '/new-jersey', identityRule: null }),
  ];
}

