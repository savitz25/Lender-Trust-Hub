import accepted from './accepted-snapshot.json';

export type PennsylvaniaIntelligenceSnapshot = typeof accepted;

export const PA_SNAPSHOT_CONTRACT = 'lender-pa-state-intel-v1' as const;
export const PA_PUBLIC_FINGERPRINT =
  '32c420aaf3dd2672a6b73774df8f567ddf6fdb08de9a29b9d95e5f948fe698c2';
export const PA_PUBLIC_PATH = '/pennsylvania';

export const PENNSYLVANIA_SNAPSHOT = accepted as PennsylvaniaIntelligenceSnapshot;

export function fmtInt(n: number | null | undefined): string {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-US');
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${n.toFixed(2)}%`;
}

export function assertPennsylvaniaIntelligence(
  value: PennsylvaniaIntelligenceSnapshot = PENNSYLVANIA_SNAPSHOT,
): PennsylvaniaIntelligenceSnapshot {
  if (value.contract_name !== PA_SNAPSHOT_CONTRACT) throw new Error(`Unexpected Pennsylvania contract ${value.contract_name}`);
  if (value.fingerprint !== PA_PUBLIC_FINGERPRINT) throw new Error('Pennsylvania public snapshot fingerprint drifted');
  if (value.path !== PA_PUBLIC_PATH) throw new Error('Pennsylvania publication path must be /pennsylvania');
  if (value.hmda.applications !== 444887 || value.hmda.originations !== 271254) {
    throw new Error('Pennsylvania HMDA totals drifted');
  }
  if (value.hmda.county_count !== 67) throw new Error('Pennsylvania HMDA county rows drifted');
  if (value.hmda.denials !== 80570) throw new Error('Pennsylvania HMDA denials drifted');
  if (value.hmda.retrieved_at != null || value.fdic.retrieved_at != null) {
    throw new Error('Do not invent a retrieval timestamp for reused HMDA/FDIC artifacts');
  }
  if ('denial_rate_pct' in value.hmda) throw new Error('denial_rate_pct is too broad');
  if (value.hmda.denials_as_pct_of_total_applications !== 18.11) {
    throw new Error('Pennsylvania denials-as-pct-of-total-applications drifted');
  }
  if (value.hero.universe_value === value.fdic.institution_rows) {
    throw new Error('Do not headline FDIC banks as HMDA applications');
  }
  if (value.hero.universe_value === 28450) throw new Error('Do not headline the mixed DoBS non-bank figure');
  if (value.current_roster.count != null) throw new Error('Do not invent a current NMLS mortgage-company roster count');
  if (value.current_roster.coverage_state !== 'OPEN_SEARCH_ONLY') throw new Error('NMLS current roster must remain search-only');
  if (value.cfpb.PA_CFPB_2025_MORTGAGE_COMPLAINT_ROWS !== 849) throw new Error('CFPB 2025 PA mortgage rows drifted');
  if (value.fdic.institution_rows !== 110) throw new Error('FDIC Pennsylvania overlay drifted');
  if (value.hmda.distinct_leis !== 994) throw new Error('Pennsylvania HMDA distinct LEIs drifted');
  if (value.dobs_orders.PA_DOBS_MORTGAGE_ENFORCEMENT_CENSUS !== 'NOT_ACQUIRED') {
    throw new Error('DoBS mortgage enforcement census must stay not acquired');
  }
  if (value.expansion_ledger.NET_NEW_CANONICAL_ORGANIZATIONS !== 0) throw new Error('no canonical writes');
  if (value.claim_eligibility.broadened !== false) throw new Error('claim eligibility unchanged');
  if (value.no_local_pennsylvania_routes !== true) throw new Error('no local Pennsylvania routes');
  if (!value.no_ranking || !value.no_trust_score) throw new Error('no ranking or Trust Score');
  if (value.hmda.application_is_not_lender !== true) throw new Error('HMDA application is not a lender');
  if (value.phfa.PA_PHFA_DISTINCT_LENDER_NAMES !== 102) throw new Error('PHFA distinct names drifted');
  if (value.expansion_ledger.GRAPH_WRITES !== 0) throw new Error('no graph writes');
  if (value.expansion_ledger.CLAIM_ELIGIBILITY_BROADENED !== false) throw new Error('claim eligibility unchanged');
  if (value.local_work_needed_now !== 'NO') throw new Error('local work must stay NO');
  if (value.mixed_dobs_denominator.is_not_mortgage_company_count !== true) {
    throw new Error('28,450 must stay separated from mortgage company counts');
  }
  return value;
}
