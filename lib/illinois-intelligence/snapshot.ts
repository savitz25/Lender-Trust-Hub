import accepted from './accepted-snapshot.json';

export type IllinoisIntelligenceSnapshot = typeof accepted;

export const IL_SNAPSHOT_CONTRACT = 'lender-il-state-intel-v1' as const;
export const IL_PUBLIC_FINGERPRINT =
  'c6da4761a11c6fccff22fbadb1eac1d2158b2756bfcf6823d622454ddbc5c03d';
export const IL_PUBLIC_PATH = '/illinois';

export const ILLINOIS_SNAPSHOT = accepted as IllinoisIntelligenceSnapshot;

export function fmtInt(n: number | null | undefined): string {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-US');
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${n.toFixed(2)}%`;
}

export function assertIllinoisIntelligence(
  value: IllinoisIntelligenceSnapshot = ILLINOIS_SNAPSHOT,
): IllinoisIntelligenceSnapshot {
  if (value.contract_name !== IL_SNAPSHOT_CONTRACT) throw new Error(`Unexpected Illinois contract ${value.contract_name}`);
  if (value.fingerprint !== IL_PUBLIC_FINGERPRINT) throw new Error('Illinois public snapshot fingerprint drifted');
  if (value.path !== IL_PUBLIC_PATH) throw new Error('Illinois publication path must be /illinois');
  if (value.hmda.applications !== 394488 || value.hmda.originations !== 231788) {
    throw new Error('Illinois HMDA totals drifted');
  }
  if (value.hmda.county_count !== 102) throw new Error('Illinois HMDA county rows drifted');
  if (value.hmda.denials !== 66742) throw new Error('Illinois HMDA denials drifted');
  if (value.hero.universe_value === value.fdic.institution_rows) {
    throw new Error('Do not headline FDIC banks as HMDA applications');
  }
  if (value.current_roster.count != null) throw new Error('Do not invent a current mortgage-company roster count');
  if (value.current_roster.coverage_state !== 'OPEN_SEARCH_ONLY') throw new Error('Current roster must remain search-only');
  if (value.cfpb.mortgage_complaint_rows != null) throw new Error('Do not invent a CFPB Illinois bulk count');
  if (value.fdic.institution_rows !== 387) throw new Error('FDIC Illinois overlay drifted');
  if (value.expansion_ledger.NET_NEW_CANONICAL_ORGANIZATIONS !== 0) throw new Error('no canonical writes');
  if (value.claim_eligibility.broadened !== false) throw new Error('claim eligibility unchanged');
  if (value.no_local_illinois_routes !== true) throw new Error('no local Illinois routes');
  if (!value.no_ranking || !value.no_trust_score) throw new Error('no ranking or Trust Score');
  if (value.hmda.application_is_not_lender !== true) throw new Error('HMDA application is not a lender');
  return value;
}
