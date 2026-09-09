import accepted from './accepted-snapshot.json';

export type ColoradoIntelligenceSnapshot = typeof accepted;

export const CO_SNAPSHOT_CONTRACT = 'lender-co-state-intel-v1' as const;
export const CO_PUBLIC_FINGERPRINT =
  '05fb30ca6da066d774b7ed3178e57acb9518c5b722def266f5f4449fedc8cb44';
export const CO_PUBLIC_PATH = '/colorado';

export const COLORADO_SNAPSHOT = accepted as ColoradoIntelligenceSnapshot;

export function fmtInt(n: number | null | undefined): string {
  return Number(n || 0).toLocaleString('en-US');
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${n.toFixed(2)}%`;
}

export function assertColoradoIntelligence(
  value: ColoradoIntelligenceSnapshot = COLORADO_SNAPSHOT,
): ColoradoIntelligenceSnapshot {
  if (value.contract_name !== CO_SNAPSHOT_CONTRACT) {
    throw new Error(`Unexpected Colorado contract ${value.contract_name}`);
  }
  if (value.fingerprint !== CO_PUBLIC_FINGERPRINT) {
    throw new Error('Colorado public snapshot fingerprint drifted');
  }
  if (value.path !== CO_PUBLIC_PATH) {
    throw new Error('Colorado publication path must be /colorado');
  }
  if (value.hmda.applications !== 260212 || value.hmda.originations !== 156145) {
    throw new Error('Colorado HMDA totals drifted');
  }
  if (value.hmda.denials !== 40435 || value.hmda.county_count !== 64 || !value.hmda.all_64_counties) {
    throw new Error('Colorado HMDA geography must include all 64 counties');
  }
  if (value.mlo_roster.grain !== 'PERSON' || value.mlo_roster.not_a_lender_count !== true) {
    throw new Error('MLO rows must remain person-grain and not a lender count');
  }
  if (value.mlo_roster.rows !== 21865 || value.mlo_roster.active !== 21584) {
    throw new Error('DRE MLO overlay drifted');
  }
  if (value.mlo_roster.publication !== 'NO_PERSON_PAGES') {
    throw new Error('MLO rows must not mint person pages');
  }
  if (value.mlo_roster.nmls_individual_id_coverage !== 'NOT_SOURCE_NATIVE') {
    throw new Error('Do not infer NMLS Individual ID from DRE license numbers');
  }
  if (value.live_roster.CURRENT_COLORADO_MORTGAGE_COMPANY_BULK_ROSTER !== 'SOURCE_NOT_ACQUIRED') {
    throw new Error('Do not invent a live Colorado mortgage-company roster');
  }
  if (value.live_roster.live_licensed_company_denominator !== 'UNKNOWN') {
    throw new Error('Live licensed-company denominator must remain UNKNOWN');
  }
  if (value.cfpb.company_rate_published !== false) {
    throw new Error('Do not publish a CFPB company complaint rate');
  }
  if (value.cfpb.mortgage_complaint_rows !== 8627) {
    throw new Error('Colorado CFPB mortgage complaint total drifted');
  }
  if (value.programs.not_an_endorsement !== true || value.programs.not_a_license !== true) {
    throw new Error('CHFA participation is not licensure or endorsement');
  }
  if (value.expansion_ledger.NET_NEW_CANONICAL_ORGANIZATIONS !== 0) {
    throw new Error('Do not convert MLO, HMDA, or CFPB rows into net-new organizations');
  }
  if (value.expansion_ledger.NET_NEW_PUBLIC_LENDER_PROFILES !== 0) {
    throw new Error('Zero net-new public lender profiles is required');
  }
  if (value.claimEligibilityBroadened !== false) {
    throw new Error('CO-LEND-001A must not broaden claim eligibility');
  }
  if (value.noCombinedDenominator !== true || value.noDenverPage !== true || value.noCountyRoutes !== true) {
    throw new Error('Colorado local routes and combined denominators are forbidden');
  }
  const mloRows: number = value.mlo_roster.rows;
  const hmdaApps: number = value.hmda.applications;
  if (mloRows === hmdaApps) {
    throw new Error('MLO rows must not equal HMDA applications');
  }
  const combined = value.mlo_roster.rows + value.hmda.applications + (value.cfpb.mortgage_complaint_rows || 0);
  if (JSON.stringify(value).includes(`coloradoLenders":${combined}`)) {
    throw new Error('Combined Colorado lender denominator is forbidden');
  }
  return value;
}
