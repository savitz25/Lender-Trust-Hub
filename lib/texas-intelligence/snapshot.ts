import accepted from './accepted-snapshot.json';

export type TexasIntelligenceSnapshot = typeof accepted;

export const TX_SNAPSHOT_CONTRACT = 'lender-tx-state-intel-v1' as const;
export const TX_PUBLIC_FINGERPRINT =
  '879ebd3bcf3eb587882cd94b6e7fc25d22d149aa7c6fa5b4130c1610420bc48e';
export const TX_PUBLIC_PATH = '/texas';

export const TEXAS_SNAPSHOT = accepted as TexasIntelligenceSnapshot;

export function fmtInt(n: number | null | undefined): string {
  return Number(n || 0).toLocaleString('en-US');
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${n.toFixed(2)}%`;
}

export function assertTexasIntelligence(
  value: TexasIntelligenceSnapshot = TEXAS_SNAPSHOT,
): TexasIntelligenceSnapshot {
  if (value.contract_name !== TX_SNAPSHOT_CONTRACT) {
    throw new Error(`Unexpected Texas contract ${value.contract_name}`);
  }
  if (value.fingerprint !== TX_PUBLIC_FINGERPRINT) {
    throw new Error('Texas public snapshot fingerprint drifted');
  }
  if (value.hmda.applications !== 954534 || value.hmda.originations !== 524257) {
    throw new Error('Texas HMDA totals drifted');
  }
  if (value.hmda.county_count !== 253 || value.hmda.counties.length !== 253) {
    throw new Error('Texas HMDA geography must reconcile to the committed county extract');
  }
  if (value.hmda.all_254_counties) {
    throw new Error('Do not invent the missing Texas county as present');
  }
  if (value.hmda.counties.some((c) => !c.county_name || c.county_name.startsWith('48'))) {
    throw new Error('Texas county labels must be names, not FIPS');
  }
  if (value.sml_orders.order_rows !== 3981 || value.sml_orders.exact_nmls_rows !== 2493) {
    throw new Error('SML order dataset drifted');
  }
  if (value.sml_orders.name_only_rows !== 1488) {
    throw new Error('SML name-only rows drifted');
  }
  if (value.sml_orders.name_only_identity !== 'UNSAFE_FOR_ADVERSE_PROFILE_ATTACH') {
    throw new Error('Name-only SML orders must remain unsafe for adverse attach');
  }
  if (value.live_roster.CURRENT_TEXAS_MORTGAGE_COMPANY_BULK_ROSTER !== 'SOURCE_NOT_ACQUIRED') {
    throw new Error('Do not invent a live Texas mortgage-company roster');
  }
  if (value.live_roster.live_licensed_company_denominator !== 'UNKNOWN') {
    throw new Error('Live licensed-company denominator must remain UNKNOWN');
  }
  if (value.programs.items.length < 1) {
    throw new Error('At least one current Texas program family must be verified');
  }
  if (value.foreclosure.STATEWIDE_STRUCTURED_FORECLOSURE_SOURCE_NOT_ACQUIRED !== true) {
    throw new Error('Do not invent a statewide foreclosure source');
  }
  return value;
}
