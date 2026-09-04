import accepted from './accepted-snapshot.json';

export type ArizonaIntelligenceSnapshot = typeof accepted;

export const AZ_SNAPSHOT_CONTRACT = 'lender-az-state-intel-v1' as const;
export const AZ_PUBLIC_FINGERPRINT =
  '70ea63ce8cfc2d5dfcdc04f992c3a852d2de5aa89795cc26adf6438351720f8e';
export const AZ_PUBLIC_PATH = '/arizona';

export const ARIZONA_SNAPSHOT = accepted as ArizonaIntelligenceSnapshot;

export function fmtInt(n: number | null | undefined): string {
  return Number(n || 0).toLocaleString('en-US');
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${n.toFixed(2)}%`;
}

export function assertArizonaIntelligence(
  value: ArizonaIntelligenceSnapshot = ARIZONA_SNAPSHOT,
): ArizonaIntelligenceSnapshot {
  if (value.contract_name !== AZ_SNAPSHOT_CONTRACT) {
    throw new Error(`Unexpected Arizona contract ${value.contract_name}`);
  }
  if (value.fingerprint !== AZ_PUBLIC_FINGERPRINT) {
    throw new Error('Arizona public snapshot fingerprint drifted');
  }
  if (value.hmda.applications !== 308338 || value.hmda.originations !== 183374) {
    throw new Error('Arizona HMDA totals drifted');
  }
  if (value.hmda.denials !== 49721 || value.hmda.denial_rate_pct !== 16.13) {
    throw new Error('Arizona HMDA denial figures drifted');
  }
  if (value.hmda.county_count !== 15 || !value.hmda.all_15_counties) {
    throw new Error('Arizona HMDA geography must include all 15 counties');
  }
  if (value.hmda.purchase_applications !== 133513) {
    throw new Error('Arizona purchase applications drifted');
  }
  if (value.hmda.apps_conventional !== 224912) {
    throw new Error('Arizona conventional applications drifted');
  }
  if (value.live_roster.CURRENT_ARIZONA_MORTGAGE_COMPANY_BULK_ROSTER !== 'SOURCE_NOT_ACQUIRED') {
    throw new Error('Do not invent a live Arizona mortgage-company roster');
  }
  if (value.live_roster.live_licensed_company_denominator !== 'UNKNOWN') {
    throw new Error('Live licensed-company denominator must remain UNKNOWN');
  }
  if (value.difi_enforcement.name_only_identity !== 'UNSAFE_FOR_ADVERSE_PROFILE_ATTACH') {
    throw new Error('Name-only DIFI orders must remain unsafe for adverse attach');
  }
  if (value.cfpb.company_rate_published !== false) {
    throw new Error('Do not publish a CFPB company complaint rate without an exposure denominator');
  }
  if (value.cfpb.mortgage_complaint_rows !== 10365) {
    throw new Error('Arizona CFPB mortgage complaint total drifted');
  }
  if (value.expansion_ledger.NET_NEW_CANONICAL_ORGANIZATIONS !== 0) {
    throw new Error('Do not convert HMDA or CFPB rows into net-new organizations');
  }
  if (value.expansion_ledger.NET_NEW_STATE_IDENTITIES !== 0) {
    throw new Error('No DIFI/NMLS bulk identities were acquired');
  }
  if (value.foreclosure.STATEWIDE_STRUCTURED_FORECLOSURE_SOURCE_NOT_ACQUIRED !== true) {
    throw new Error('Do not invent a statewide foreclosure source');
  }
  if (value.programs.items.length < 1) {
    throw new Error('At least one current Arizona program family must be verified');
  }
  if (value.growth_classification !== 'INTELLIGENCE_GROWTH_HEAVY') {
    throw new Error('Arizona Lender remains intelligence-growth-heavy');
  }
  return value;
}
