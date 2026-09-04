import accepted from './accepted-snapshot.json';

export type WashingtonIntelligenceSnapshot = typeof accepted;

export const WA_SNAPSHOT_CONTRACT = 'lender-wa-state-intel-v1' as const;
export const WA_PUBLIC_FINGERPRINT =
  'f882a6ec7be37fd53c0c13e269578952f942ce2fc0acd0a5a731397ab1eec69d';
export const WA_PUBLIC_PATH = '/washington';

export const WASHINGTON_SNAPSHOT = accepted as WashingtonIntelligenceSnapshot;

export function fmtInt(n: number | null | undefined): string {
  return Number(n || 0).toLocaleString('en-US');
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${n.toFixed(2)}%`;
}

export function assertWashingtonIntelligence(
  value: WashingtonIntelligenceSnapshot = WASHINGTON_SNAPSHOT,
): WashingtonIntelligenceSnapshot {
  if (value.contract_name !== WA_SNAPSHOT_CONTRACT) {
    throw new Error(`Unexpected Washington contract ${value.contract_name}`);
  }
  if (value.fingerprint !== WA_PUBLIC_FINGERPRINT) {
    throw new Error('Washington public snapshot fingerprint drifted');
  }
  if (value.hmda.applications !== 286871 || value.hmda.originations !== 174653) {
    throw new Error('Washington HMDA totals drifted');
  }
  if (value.hmda.denials !== 44562 || value.hmda.denial_rate_pct !== 15.53) {
    throw new Error('Washington HMDA denial figures drifted');
  }
  if (value.hmda.county_count !== 39 || !value.hmda.all_39_counties) {
    throw new Error('Washington HMDA geography must include all 39 counties');
  }
  if (value.hmda.counties.some((c) => !c.county_name || c.county_name.startsWith('53'))) {
    throw new Error('Washington county labels must be names, not FIPS');
  }
  if (value.live_roster.CURRENT_WASHINGTON_MORTGAGE_COMPANY_BULK_ROSTER !== 'SOURCE_NOT_ACQUIRED') {
    throw new Error('Do not invent a live Washington mortgage-company roster');
  }
  if (value.live_roster.live_licensed_company_denominator !== 'UNKNOWN') {
    throw new Error('Live licensed-company denominator must remain UNKNOWN');
  }
  if (value.dfi_aggregates.not_a_live_roster !== true) {
    throw new Error('DFI year-end aggregates must remain labeled not a live roster');
  }
  if (value.dfi_aggregates.mortgage_brokers !== 354) {
    throw new Error('DFI year-end mortgage broker count drifted');
  }
  if (value.dfi_aggregates.consumer_loan_companies !== 1104) {
    throw new Error('DFI year-end consumer loan company count drifted');
  }
  if (value.dfi_enforcement.name_only_identity !== 'UNSAFE_FOR_ADVERSE_PROFILE_ATTACH') {
    throw new Error('Name-only DFI orders must remain unsafe for adverse attach');
  }
  if (value.dfi_enforcement.exact_nmls_rows + value.dfi_enforcement.name_only_rows !== value.dfi_enforcement.order_rows) {
    throw new Error('DFI exact and name-only rows must sum to order rows');
  }
  if (value.programs.items.length < 1) {
    throw new Error('At least one current Washington program family must be verified');
  }
  if (value.foreclosure.STATEWIDE_STRUCTURED_FORECLOSURE_SOURCE_NOT_ACQUIRED !== true) {
    throw new Error('Do not invent a statewide foreclosure source');
  }
  if (value.cfpb.company_rate_published !== false) {
    throw new Error('Do not publish a CFPB company complaint rate without an exposure denominator');
  }
  return value;
}
