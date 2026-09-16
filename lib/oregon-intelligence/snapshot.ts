import accepted from './accepted-snapshot.json';

export type OregonIntelligenceSnapshot = typeof accepted;

export const OR_SNAPSHOT_CONTRACT = 'lender-or-state-intel-v1' as const;
export const OR_PUBLIC_FINGERPRINT =
  '8e67c1dced6a6b6e39d291899722baa3d5c4dae91f156b8239f37c0bbc269d66';
export const OR_PUBLIC_PATH = '/oregon';

export const OREGON_SNAPSHOT = accepted as OregonIntelligenceSnapshot;

export function fmtInt(n: number | null | undefined): string {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-US');
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${n.toFixed(2)}%`;
}

export function assertOregonIntelligence(
  value: OregonIntelligenceSnapshot = OREGON_SNAPSHOT,
): OregonIntelligenceSnapshot {
  if (value.contract_name !== OR_SNAPSHOT_CONTRACT) throw new Error(`Unexpected Oregon contract ${value.contract_name}`);
  if (value.fingerprint !== OR_PUBLIC_FINGERPRINT) throw new Error('Oregon public snapshot fingerprint drifted');
  if (value.path !== OR_PUBLIC_PATH) throw new Error('Oregon publication path must be /oregon');
  if (value.hmda.applications !== 146902 || value.hmda.originations !== 89073) {
    throw new Error('Oregon HMDA totals drifted');
  }
  if (value.hmda.county_count !== 36) throw new Error('Oregon HMDA county rows drifted');
  if (value.hmda.denials !== 22290) throw new Error('Oregon HMDA denials drifted');
  if (value.retrieved_at != null) throw new Error('HMDA/FDIC retrieval instant is UNKNOWN; do not use ticket build time');
  if (value.hmda.retrieved_at != null || value.fdic.retrieved_at != null) {
    throw new Error('Do not invent a retrieval timestamp for reused HMDA/FDIC artifacts');
  }
  if ('denial_rate_pct' in value.hmda) throw new Error('denial_rate_pct is too broad');
  if (value.hmda.denials_as_pct_of_total_applications !== 15.17) {
    throw new Error('Oregon denials-as-pct-of-total-applications drifted');
  }
  if (value.hmda.denial_pct_numerator_denial_observations !== 22290) throw new Error('denial numerator drifted');
  if (value.hmda.denial_pct_denominator_total_applications !== 146902) throw new Error('denial denominator drifted');
  if (value.hero.universe_value === value.fdic.institution_rows) {
    throw new Error('Do not headline FDIC banks as HMDA applications');
  }
  if (value.current_roster.count != null) throw new Error('Do not invent a current mortgage-company roster count');
  if (value.current_roster.coverage_state !== 'OPEN_SEARCH_ONLY') throw new Error('Current roster must remain search-only');
  if (value.cfpb.mortgage_complaint_rows != null) throw new Error('Do not invent a CFPB Oregon bulk count');
  if (value.fdic.institution_rows !== 14) throw new Error('FDIC Oregon overlay drifted');
  if (value.expansion_ledger.NET_NEW_CANONICAL_ORGANIZATIONS !== 0) throw new Error('no canonical writes');
  if (value.claim_eligibility.broadened !== false) throw new Error('claim eligibility unchanged');
  if (value.no_local_oregon_routes !== true) throw new Error('no local Oregon routes');
  if (!value.no_ranking || !value.no_trust_score) throw new Error('no ranking or Trust Score');
  if (value.hmda.application_is_not_lender !== true) throw new Error('HMDA application is not a lender');
  if (value.hmda.distinct_leis !== 629) throw new Error('Oregon HMDA distinct LEIs drifted');
  if (value.dfr_orders.OR_DFR_MORTGAGE_ORDER_ROWS !== 10) throw new Error('DFR mortgage document rows drifted');
  if (value.dfr_orders.OR_DFR_MORTGAGE_UNIQUE_MATTERS !== 10) throw new Error('DFR mortgage matters drifted');
  if (value.ohcs.OR_OHCS_APPROVED_LENDER_ROWS !== 23) throw new Error('OHCS rows drifted');
  if (value.expansion_ledger.GRAPH_WRITES !== 0) throw new Error('no graph writes');
  if (value.expansion_ledger.CLAIM_ELIGIBILITY_BROADENED !== false) throw new Error('claim eligibility unchanged');
  return value;
}
