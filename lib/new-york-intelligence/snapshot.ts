import accepted from './accepted-snapshot.json';

export type NewYorkIntelligenceSnapshot = typeof accepted;

export const NY_SNAPSHOT_CONTRACT = 'lender-ny-state-intel-v1' as const;
export const NY_PUBLIC_FINGERPRINT =
  'd3a07f5b5d7114e54917ef0aa0d338e81f90f87e2bb0fc9eddabe2fa75eb6b82';
export const NY_PUBLIC_PATH = '/new-york';

export const NEW_YORK_SNAPSHOT = accepted as NewYorkIntelligenceSnapshot;

export function fmtInt(n: number | null | undefined): string {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-US');
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${n.toFixed(2)}%`;
}

export function assertNewYorkIntelligence(
  value: NewYorkIntelligenceSnapshot = NEW_YORK_SNAPSHOT,
): NewYorkIntelligenceSnapshot {
  if (value.contract_name !== NY_SNAPSHOT_CONTRACT) {
    throw new Error(`Unexpected New York contract ${value.contract_name}`);
  }
  if (value.fingerprint !== NY_PUBLIC_FINGERPRINT) {
    throw new Error('New York public snapshot fingerprint drifted');
  }
  if (value.path !== NY_PUBLIC_PATH) {
    throw new Error('New York publication path must be /new-york');
  }
  if (value.dfs_2024_aggregates.licensed_mortgage_bankers !== 151) {
    throw new Error('2024 DFS bankers must remain 151');
  }
  if (value.dfs_2024_aggregates.registered_mortgage_brokers !== 439) {
    throw new Error('2024 DFS brokers must remain 439');
  }
  if (value.dfs_2024_aggregates.registered_mortgage_loan_servicers !== 36) {
    throw new Error('2024 DFS servicers must remain 36');
  }
  if (value.dfs_2024_aggregates.licensed_mortgage_loan_originators !== 9769) {
    throw new Error('2024 DFS MLOs must remain 9,769');
  }
  if (value.dfs_2024_aggregates.not_current_2026_roster !== true) {
    throw new Error('2024 aggregates are not a current roster');
  }
  if (value.dfs_2024_aggregates.banker_is_not_broker !== true) {
    throw new Error('Banker must stay distinct from broker');
  }
  if (value.dfs_2024_aggregates.servicer_is_not_banker !== true) {
    throw new Error('Servicer must stay distinct from banker');
  }
  if (value.dfs_2024_aggregates.mlo_is_not_company !== true) {
    throw new Error('MLO must stay person grain');
  }
  if (value.current_roster.count != null) {
    throw new Error('Do not invent a current company roster count');
  }
  if (value.current_roster.coverage_state !== 'OPEN_SEARCH_ONLY') {
    throw new Error('Current roster must remain search-only');
  }
  if (value.enforcement.observation_rows !== 198) {
    throw new Error('Enforcement rows drifted');
  }
  if (value.enforcement.action_is_not_violation_count !== true) {
    throw new Error('Enforcement is not a violation count');
  }
  if (value.enforcement.settlement_is_not_conviction !== true) {
    throw new Error('Settlement is not a conviction');
  }
  if (value.enforcement.name_only_join !== 'UNSAFE') {
    throw new Error('Name-only enforcement join must remain unsafe');
  }
  if (value.hmda.applications !== 388207 || value.hmda.originations !== 231331) {
    throw new Error('New York HMDA totals drifted');
  }
  if (value.hmda.denials !== 76045) {
    throw new Error('New York HMDA denials drifted');
  }
  if (value.hmda.county_count !== 62) {
    throw new Error('New York HMDA county rows must remain 62');
  }
  if (value.hmda.application_is_not_lender !== true) {
    throw new Error('HMDA application is not a lender');
  }
  if (value.weekly_bulletins.event_is_not_current_roster !== true) {
    throw new Error('Bulletin events are not a roster');
  }
  if (value.weekly_bulletins.mlo_approval_is_not_current_mlo_population !== true) {
    throw new Error('MLO approvals are not the current MLO population');
  }
  if (value.mlo_person.grain !== 'PERSON') {
    throw new Error('MLO grain must remain PERSON');
  }
  if (value.mlo_person.no_public_person_profiles !== true) {
    throw new Error('No public MLO profiles');
  }
  if (value.fdic.depository_is_not_mortgage_banker !== true) {
    throw new Error('FDIC is not a mortgage banker');
  }
  if (value.identity.name_only !== 'UNSAFE') {
    throw new Error('Name-only joins must remain unsafe');
  }
  if (value.expansion_ledger.NET_NEW_CANONICAL_ORGANIZATIONS !== 0) {
    throw new Error('Do not mint organizations');
  }
  if (value.expansion_ledger.NET_NEW_PUBLIC_LENDER_PROFILES !== 0) {
    throw new Error('Do not mint profiles');
  }
  if (value.expansion_ledger.EXISTING_ORGANIZATIONS_ENRICHED !== 0) {
    throw new Error('Do not write graph enrichment');
  }
  if (value.claimEligibilityBroadened !== false) {
    throw new Error('Claim eligibility must stay unchanged');
  }
  if (value.noCountyRoutes !== true || value.statewideOnly !== true) {
    throw new Error('Statewide /new-york only');
  }
  if (value.no_trust_score !== true || value.no_paid_ranking !== true) {
    throw new Error('Trust Score / ranking forbidden');
  }
  const combined =
    value.dfs_2024_aggregates.licensed_mortgage_bankers +
    value.dfs_2024_aggregates.registered_mortgage_brokers;
  if (combined === value.hmda.applications) {
    throw new Error('Do not mix dated company aggregates with HMDA applications');
  }
  return value;
}
