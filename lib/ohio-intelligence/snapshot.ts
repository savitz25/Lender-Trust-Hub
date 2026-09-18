import accepted from './accepted-snapshot.json';

export type OhioIntelligenceSnapshot = typeof accepted;

export const OH_SNAPSHOT_CONTRACT = 'lender-oh-state-intel-v1' as const;
export const OH_PUBLIC_FINGERPRINT =
  'c2f9a94cb644a32ff91d98d5c4e338096ac23bdc3e0f2a18464b9b1bc0df3fb8';
export const OH_PUBLIC_PATH = '/ohio';

export const OHIO_SNAPSHOT = accepted as OhioIntelligenceSnapshot;

export function fmtInt(n: number | null | undefined): string {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-US');
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${n.toFixed(2)}%`;
}

export function assertOhioIntelligence(
  value: OhioIntelligenceSnapshot = OHIO_SNAPSHOT,
): OhioIntelligenceSnapshot {
  if (value.contract_name !== OH_SNAPSHOT_CONTRACT) throw new Error(`Unexpected Ohio contract ${value.contract_name}`);
  if (value.fingerprint !== OH_PUBLIC_FINGERPRINT) throw new Error('Ohio public snapshot fingerprint drifted');
  if (value.path !== OH_PUBLIC_PATH) throw new Error('Ohio publication path must be /ohio');
  if (value.hmda.applications !== 460825 || value.hmda.originations !== 276279) {
    throw new Error('Ohio HMDA totals drifted');
  }
  if (value.hmda.county_count !== 88) throw new Error('Ohio HMDA county rows drifted');
  if (value.hmda.denials !== 80708) throw new Error('Ohio HMDA denials drifted');
  if (value.hmda.retrieved_at != null || value.fdic.retrieved_at != null) {
    throw new Error('Do not invent a retrieval timestamp for reused HMDA/FDIC artifacts');
  }
  if ('denial_rate_pct' in value.hmda) throw new Error('denial_rate_pct is too broad');
  if (value.hmda.denials_as_pct_of_total_applications !== 17.51) {
    throw new Error('Ohio denials-as-pct-of-total-applications drifted');
  }
  if (value.hero.universe_value === value.fdic.institution_rows) {
    throw new Error('Do not headline FDIC banks as HMDA applications');
  }
  if (value.hero.universe_value === value.ohfa.OH_OHFA_DISTINCT_LENDER_NAMES) {
    throw new Error('Do not headline OHFA names as HMDA applications');
  }
  if (value.current_roster.count != null) throw new Error('Do not invent a combined current RMLA company count');
  if (value.current_roster.live_licensed_company_universe != null) {
    throw new Error('Search-only RMLA is not a live licensed-company universe');
  }
  if (value.current_roster.OH_RMLA_COMPANY_ROWS != null) throw new Error('RMLA company rows must stay null');
  if (value.mlo.OH_MLO_ROWS != null) throw new Error('MLO rows must stay search-only null');
  if (value.cfpb.OH_CFPB_2025_MORTGAGE_COMPLAINT_ROWS !== 610) throw new Error('CFPB 2025 OH mortgage rows drifted');
  if (value.fdic.institution_rows !== 157) throw new Error('FDIC Ohio overlay drifted');
  if (value.hmda.distinct_leis !== 981) throw new Error('Ohio HMDA distinct LEIs drifted');
  if (value.ohfa.OH_OHFA_LENDER_OBSERVATION_ROWS !== 2095) throw new Error('OHFA observation rows drifted');
  if (value.ohfa.OH_OHFA_DISTINCT_LENDER_NAMES !== 85) throw new Error('OHFA distinct names drifted');
  if (value.dfi_complaints.OH_DFI_MORTGAGE_COMPLAINT_ROWS != null) {
    throw new Error('DFI mortgage complaints must stay bulk-not-public');
  }
  if (value.dfi_enforcement.OH_DFI_ENFORCEMENT_ROWS != null) {
    throw new Error('DFI enforcement must stay search-only');
  }
  if (value.crosswalks.EXACT_OH_DFI_TO_NMLS_CROSSWALKS !== 0) throw new Error('Do not invent DFI↔NMLS bridges');
  if (value.crosswalks.EXACT_OHFA_NMLS_ATTACHMENTS !== 0) throw new Error('Do not invent OHFA NMLS attachments');
  if (value.expansion_ledger.NET_NEW_CANONICAL_ORGANIZATIONS !== 0) throw new Error('no canonical writes');
  if (value.claim_eligibility.broadened !== false) throw new Error('claim eligibility unchanged');
  if (value.no_local_ohio_routes !== true) throw new Error('no local Ohio routes');
  if (!value.no_ranking || !value.no_trust_score) throw new Error('no ranking or Trust Score');
  if (value.hmda.application_is_not_lender !== true) throw new Error('HMDA application is not a lender');
  if (value.expansion_ledger.GRAPH_WRITES !== 0) throw new Error('no graph writes');
  if (value.expansion_ledger.CLAIM_ELIGIBILITY_BROADENED !== false) throw new Error('claim eligibility unchanged');
  if (value.local_work_needed_now !== 'NO') throw new Error('local work must stay NO');
  return value;
}
