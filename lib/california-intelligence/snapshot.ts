import accepted from './accepted-snapshot.json';

export type CaliforniaIntelligenceSnapshot = typeof accepted;

export const CA_SNAPSHOT_CONTRACT = 'lender-ca-state-intel-v1' as const;
export const CA_PUBLIC_FINGERPRINT =
  '7dad44de48dc08f82d582dc3c2fc455d1f2fa4ee5618198d6b199adc483c5a36';
export const CA_PUBLIC_PATH = '/california';

export const CALIFORNIA_SNAPSHOT = accepted as CaliforniaIntelligenceSnapshot;

export function fmtInt(n: number | null | undefined): string {
  return Number(n || 0).toLocaleString('en-US');
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${n.toFixed(2)}%`;
}

export function assertCaliforniaIntelligence(
  value: CaliforniaIntelligenceSnapshot = CALIFORNIA_SNAPSHOT,
): CaliforniaIntelligenceSnapshot {
  if (value.contract_name !== CA_SNAPSHOT_CONTRACT) {
    throw new Error(`Unexpected California contract ${value.contract_name}`);
  }
  if (value.fingerprint !== CA_PUBLIC_FINGERPRINT) {
    throw new Error('California public snapshot fingerprint drifted');
  }
  if (value.hmda.applications !== 1014489 || value.hmda.originations !== 569218) {
    throw new Error('California HMDA totals drifted');
  }
  if (value.hmda.county_count !== 58 || !value.hmda.all_58_counties) {
    throw new Error('California HMDA geography must include all 58 counties');
  }
  if (value.crmla_annual_report.licensees !== 389 || value.crmla_annual_report.branches !== 5104) {
    throw new Error('CRMLA 2024 report figures drifted');
  }
  if (value.live_roster.CURRENT_CRMLA_BULK_ROSTER !== 'SOURCE_NOT_ACQUIRED') {
    throw new Error('Do not invent a live CRMLA roster');
  }
  return value;
}
