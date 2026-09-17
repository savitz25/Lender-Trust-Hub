import accepted from './accepted-snapshot.json';

export type NorthCarolinaIntelligenceSnapshot = typeof accepted;

export const NC_SNAPSHOT_CONTRACT = 'lender-nc-state-intel-v1' as const;
export const NC_PUBLIC_FINGERPRINT =
  '95cc55e2092335c30698c676c67eb6ca0559a7a4dc33a68ce8e82bf4cfe6c10d';
export const NC_PUBLIC_PATH = '/north-carolina';

export const NORTH_CAROLINA_SNAPSHOT = accepted as NorthCarolinaIntelligenceSnapshot;

export function fmtInt(n: number | null | undefined): string {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-US');
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${n.toFixed(2)}%`;
}

export function assertNorthCarolinaIntelligence(
  value: NorthCarolinaIntelligenceSnapshot = NORTH_CAROLINA_SNAPSHOT,
): NorthCarolinaIntelligenceSnapshot {
  if (value.contract_name !== NC_SNAPSHOT_CONTRACT) throw new Error(`Unexpected North Carolina contract ${value.contract_name}`);
  if (value.fingerprint !== NC_PUBLIC_FINGERPRINT) throw new Error('North Carolina public snapshot fingerprint drifted');
  if (value.path !== NC_PUBLIC_PATH) throw new Error('North Carolina publication path must be /north-carolina');
  if (value.hmda.applications !== 484454 || value.hmda.originations !== 279735) {
    throw new Error('North Carolina HMDA totals drifted');
  }
  if (value.hmda.county_count !== 100) throw new Error('North Carolina HMDA county rows drifted');
  if (value.hmda.denials !== 86923) throw new Error('North Carolina HMDA denials drifted');
  if (value.hmda.retrieved_at != null || value.fdic.retrieved_at != null) {
    throw new Error('Do not invent a retrieval timestamp for reused HMDA/FDIC artifacts');
  }
  if ('denial_rate_pct' in value.hmda) throw new Error('denial_rate_pct is too broad');
  if (value.hmda.denials_as_pct_of_total_applications !== 17.94) {
    throw new Error('North Carolina denials-as-pct-of-total-applications drifted');
  }
  if (value.hero.universe_value === value.fdic.institution_rows) {
    throw new Error('Do not headline FDIC banks as HMDA applications');
  }
  if (value.hero.universe_value === 1380) throw new Error('Do not headline the mixed NCCOB current-entity figure');
  if (value.hero.universe_value === 640) throw new Error('Do not headline Mortgage Lender licenses as HMDA applications');
  if (value.current_roster.count != null) throw new Error('Do not invent a combined current mortgage-company roster count');
  if (value.current_roster.live_licensed_company_universe != null) {
    throw new Error('Mixed current entities are not a live licensed-company universe');
  }
  if (value.current_roster.NC_MORTGAGE_LENDER_ROWS !== 640) throw new Error('NCCOB Mortgage Lender class drifted');
  if (value.broker.NC_MORTGAGE_BROKER_ROWS !== 574) throw new Error('NCCOB Mortgage Broker class drifted');
  if (value.servicer.NC_MORTGAGE_SERVICER_ROWS !== 62) throw new Error('NCCOB Mortgage Servicer class drifted');
  if (value.mosr.NC_MOSR_ROWS !== 104) throw new Error('NCCOB MOSR class drifted');
  if (value.mixed_nccob_denominator.NC_CURRENT_LICENSED_ENTITY_ROWS !== 1380) {
    throw new Error('Mixed current licensed-entity rows drifted');
  }
  if (value.cfpb.NC_CFPB_2025_MORTGAGE_COMPLAINT_ROWS !== 920) throw new Error('CFPB 2025 NC mortgage rows drifted');
  if (value.fdic.institution_rows !== 91) throw new Error('FDIC North Carolina overlay drifted');
  if (value.hmda.distinct_leis !== 1121) throw new Error('North Carolina HMDA distinct LEIs drifted');
  if (value.nccob_orders.NC_NCCOB_MORTGAGE_ORDER_DOCUMENTS !== 723) throw new Error('NCCOB order documents drifted');
  if (value.nccob_orders.NC_NCCOB_MORTGAGE_DISTINCT_DOCKETS !== 693) throw new Error('NCCOB distinct dockets drifted');
  if (value.nccob_orders.NC_NCCOB_MORTGAGE_UNIQUE_MATTERS !== 693) throw new Error('NCCOB unique matters drifted');
  if (value.nccob_complaints.NC_NCCOB_MORTGAGE_COMPLAINT_ROWS != null) {
    throw new Error('NCCOB mortgage complaints must stay bulk-not-public');
  }
  if (value.nchfa.NC_NCHFA_PARTICIPATING_LENDER_ROWS != null) {
    throw new Error('NCHFA participating lenders must stay search-only');
  }
  if (value.nccob_orders.EXACT_ENFORCEMENT_NMLS_ATTACHMENTS !== 0) {
    throw new Error('Do not invent enforcement NMLS attachments');
  }
  if (value.expansion_ledger.NET_NEW_CANONICAL_ORGANIZATIONS !== 0) throw new Error('no canonical writes');
  if (value.claim_eligibility.broadened !== false) throw new Error('claim eligibility unchanged');
  if (value.no_local_north_carolina_routes !== true) throw new Error('no local North Carolina routes');
  if (!value.no_ranking || !value.no_trust_score) throw new Error('no ranking or Trust Score');
  if (value.hmda.application_is_not_lender !== true) throw new Error('HMDA application is not a lender');
  if (value.expansion_ledger.GRAPH_WRITES !== 0) throw new Error('no graph writes');
  if (value.expansion_ledger.CLAIM_ELIGIBILITY_BROADENED !== false) throw new Error('claim eligibility unchanged');
  if (value.local_work_needed_now !== 'NO') throw new Error('local work must stay NO');
  if (value.mixed_nccob_denominator.is_not_mortgage_company_count !== true) {
    throw new Error('1380 must stay separated from mortgage company counts');
  }
  return value;
}
