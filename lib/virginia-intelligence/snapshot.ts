import accepted from './accepted-snapshot.json';

export type VirginiaIntelligenceSnapshot = typeof accepted;

export const VA_SNAPSHOT_CONTRACT = 'lender-va-state-intel-v1' as const;
export const VA_PUBLIC_FINGERPRINT =
  '1d15e78c49d24827268c9e4064ba816cf6e7ea227db8fd58a01816fec751cba9';
export const VA_PUBLIC_PATH = '/virginia';

export const VIRGINIA_SNAPSHOT = accepted as VirginiaIntelligenceSnapshot;

export function fmtInt(n: number | null | undefined): string {
  return Number(n || 0).toLocaleString('en-US');
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${n.toFixed(2)}%`;
}

export function assertVirginiaIntelligence(
  value: VirginiaIntelligenceSnapshot = VIRGINIA_SNAPSHOT,
): VirginiaIntelligenceSnapshot {
  if (value.contract_name !== VA_SNAPSHOT_CONTRACT) {
    throw new Error(`Unexpected Virginia contract ${value.contract_name}`);
  }
  if (value.fingerprint !== VA_PUBLIC_FINGERPRINT) {
    throw new Error('Virginia public snapshot fingerprint drifted');
  }
  if (value.path !== VA_PUBLIC_PATH) {
    throw new Error('Virginia publication path must be /virginia');
  }
  if (value.scc_roster.source_as_of !== '2025-12-31') {
    throw new Error('SCC roster clock must remain 2025-12-31');
  }
  if (value.scc_roster.not_current_2026_status !== true) {
    throw new Error('Dated SCC roster is not current 2026 verification');
  }
  if (value.scc_roster.brokers !== 713) {
    throw new Error('Parsed SCC broker rows must remain 713');
  }
  if (value.scc_roster.scc_reported.brokers_companies !== 713) {
    throw new Error('SCC-reported broker companies must remain 713');
  }
  if (value.scc_roster.scc_reported.lenders_companies !== 180) {
    throw new Error('SCC-reported lender companies must remain 180');
  }
  if (value.scc_roster.scc_reported.lender_brokers_companies !== 364) {
    throw new Error('SCC-reported lender-broker companies must remain 364');
  }
  if (value.scc_roster.lenders === value.scc_roster.lender_brokers) {
    throw new Error('Lender rows must stay distinct from lender-and-broker rows');
  }
  if (value.scc_roster.brokers === value.scc_roster.lenders) {
    throw new Error('Broker rows must stay distinct from lender rows');
  }
  if (value.scc_roster.exact_va_to_nmls_crosswalks !== 1257) {
    throw new Error('Exact VA-MC to NMLS crosswalks drifted');
  }
  if (value.scc_roster.missing_nmls !== 0) {
    throw new Error('Do not name-match missing NMLS IDs; this list has none missing');
  }
  if (value.mlo_person.persons !== 24222 || value.mlo_person.grain !== 'PERSON') {
    throw new Error('MLO aggregate must remain person-grain 24,222');
  }
  if (value.mlo_person.persons === value.scc_roster.rows) {
    throw new Error('MLO persons must not equal company rows');
  }
  if (value.hmda.applications !== 340304 || value.hmda.originations !== 202417) {
    throw new Error('Virginia HMDA totals drifted');
  }
  if (value.hmda.county_count !== 133 || !value.hmda.all_133_geographies) {
    throw new Error('Virginia HMDA geography must include 133 county/city rows');
  }
  if (value.hmda.applications === value.scc_roster.rows) {
    throw new Error('HMDA applications must not equal SCC company rows');
  }
  if (value.cfpb.mortgage_complaint_rows !== 14563) {
    throw new Error('Virginia CFPB mortgage complaint total drifted');
  }
  if (value.cfpb.company_rate_published !== false) {
    throw new Error('Do not publish a CFPB company complaint rate');
  }
  if (value.live_roster.CURRENT_VIRGINIA_MORTGAGE_COMPANY_BULK_ROSTER !== 'SOURCE_NOT_ACQUIRED') {
    throw new Error('Do not invent a live 2026 Virginia mortgage-company roster');
  }
  if (value.live_roster.live_licensed_company_denominator !== 'UNKNOWN') {
    throw new Error('Live licensed-company denominator must remain UNKNOWN');
  }
  if (value.programs.not_a_license !== true || value.programs.not_an_endorsement !== true) {
    throw new Error('Virginia Housing programs are not licenses or endorsements');
  }
  if (value.expansion_ledger.NET_NEW_CANONICAL_ORGANIZATIONS !== 0) {
    throw new Error('Do not convert SCC rows into net-new organizations');
  }
  if (value.expansion_ledger.NET_NEW_PUBLIC_LENDER_PROFILES !== 0) {
    throw new Error('Zero net-new public lender profiles is required');
  }
  if (value.claimEligibilityBroadened !== false) {
    throw new Error('VA-LEND-001A must not broaden claim eligibility');
  }
  if (value.noCombinedDenominator !== true || value.noCountyRoutes !== true) {
    throw new Error('Virginia local routes and combined lender denominators are forbidden');
  }
  if (value.clock_reconciliation.scc_roster_source_as_of === value.generated_at) {
    throw new Error('sourceAsOf must remain distinct from generatedAt');
  }
  if (value.generated_at.includes('22:00:00')) {
    throw new Error('Do not invent 22:00Z as a generation clock');
  }
  return value;
}
