/**
 * ASK-SEARCH-LENDER-001 — Lender → NetworkDiscoveryEntity projection.
 * Compatible with ask-network-discovery-v1 (Ask FIND contract).
 */

export type LenderDiscoveryEntityType =
  | 'mortgage_company'
  | 'mortgage_broker'
  | 'bank'
  | 'auto_loan_company';

export type DiscoveryStatus = 'active' | 'held' | 'disabled';

/**
 * Service / activity geography.
 * Physical HQ lives on city/state/zip entity fields — never confuse the two.
 */
export type DiscoveryServiceArea =
  | { kind: 'city'; city: string; state: string }
  | { kind: 'county'; county: string; state: string }
  | { kind: 'state'; state: string; label?: 'physical_hq' | 'hmda_activity' }
  | { kind: 'zip'; zip: string }
  | { kind: 'nationwide'; label?: string };

export type NetworkDiscoveryEntity = {
  network_entity_id: string;
  hub: 'lender';
  source_entity_id: string;
  entity_type: LenderDiscoveryEntityType;
  display_name: string;
  legal_name?: string;
  /** Physical HQ locality */
  city?: string;
  county?: string;
  state?: string;
  zip?: string;
  categories?: string[];
  service_areas?: DiscoveryServiceArea[];
  regulatory_status_summary?: string;
  trust_report_available: boolean;
  canonical_profile_url: string;
  canonical_search_url?: string;
  search_terms?: string[];
  discovery_status: DiscoveryStatus;
  source_version?: string;
  updated_at?: string;
};

export type EligibilityFailureReason =
  | 'missing_slug'
  | 'missing_display_name'
  | 'missing_nmls'
  | 'nmls_unverified'
  | 'insufficient_geography'
  | 'unsupported_entity_type'
  | 'invalid_canonical_url'
  | 'deferred_vertical';

export type PilotExportManifest = {
  schema_version: 'ask-network-discovery-v1';
  hub: 'lender';
  generated_at: string;
  source_version: string;
  source_path: string;
  pilot_label: 'PILOT / NOT YET CONSUMED BY ASK PRODUCTION';
  pilot_artifact: string;
  task: 'ASK-SEARCH-LENDER-001';
  entity_count: number;
  content_fingerprint: string;
  eligibility: {
    considered: number;
    eligible: number;
    ineligible: number;
    ineligible_reasons: Record<string, number>;
    pilot_selected: number;
  };
  entity_type_breakdown: Record<string, number>;
  geography: {
    physical_states: Record<string, number>;
    with_city: number;
    with_zip: number;
    with_county: number;
    with_hmda_service_state: number;
    with_hmda_service_county: number;
  };
  deferred: {
    loan_officer: 'UNSUPPORTED';
    auto_loan_company: 'SOFT_SEED_DEFERRED';
    fdic_bank_vertical: 'NO_PER_ENTITY_PROFILE_DEFERRED';
  };
  query_readiness?: Record<string, unknown>;
  entities: NetworkDiscoveryEntity[];
};
