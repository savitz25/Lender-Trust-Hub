/**
 * FL-LEND-006 — fl-lend-provider-v1 internal company profile contract.
 * Evidence presentation only. No scores, ranks, or public routes.
 */

export const FLORIDA_PROFILE_CONTRACT_VERSION = 'fl-lend-provider-v1' as const;

export const FORBIDDEN_FLORIDA_PROFILE_KEYS = [
  'trustScore',
  'riskScore',
  'regulatoryScore',
  'complaintScore',
  'denialScore',
  'rank',
  'ranking',
  'recommended',
  'best',
  'worst',
] as const;

export type ContactClass = 'public_candidate' | 'internal_only' | 'review_before_public';

export type FloridaCredential = {
  license_number: string;
  license_class: 'MBR' | 'MLD';
  license_class_label: 'Mortgage Broker' | 'Mortgage Lender';
  ofr_status: string;
  servicer_flag: string | null;
  firm_name: string | null;
  phone: string | null;
  phone_class: ContactClass;
  prim_address: Record<string, string | null>;
  mail_address: Record<string, string | null>;
  address_means: 'license_business_hq_evidence';
  not_service_territory: true;
};

export type FloridaProfile = {
  contract_version: typeof FLORIDA_PROFILE_CONTRACT_VERSION;
  public_projection_status: 'internal_only';
  scores: null;
  rankings: null;
  identity: {
    institution_id: string;
    nmls_id: string;
    stable_key: string;
    ofr_names: string[];
    canonical_name: string;
    slug: string;
  };
  floridaLicensing: {
    approved_credential_count: number;
    classes: string[];
    dual_mbr_mld: boolean;
  };
  credentialClasses: FloridaCredential[];
  servicerEvidence: {
    ofr_mld_servicer_yes_credentials: number;
    statement: string | null;
    blank_or_no_is_not_never_services: true;
  };
  contacts: {
    credentials: unknown[];
    canonical_summary: unknown;
    source: 'OFR_CH494_CREDENTIAL';
  };
  addresses: {
    semantics: 'license_business_hq_evidence';
    not_service_territory: true;
    not_operating_footprint: true;
    not_branch_footprint: true;
  };
  hmda: Record<string, unknown>;
  cfpb: Record<string, unknown>;
  federalRegulatory: Record<string, unknown>;
  floridaRegulatory: Record<string, unknown>;
  sources: Record<string, unknown>[];
  freshness: Record<string, unknown>;
  limitations: string[];
  publication: {
    status: 'internal_only';
    index: false;
    sitemap: false;
    national_render: boolean;
    national_index: boolean;
  };
};

export function floridaProfileHasForbiddenKeys(profile: unknown): string[] {
  const hits: string[] = [];
  const walk = (obj: unknown, path: string) => {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) {
      obj.forEach((v, i) => walk(v, `${path}[${i}]`));
      return;
    }
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if ((FORBIDDEN_FLORIDA_PROFILE_KEYS as readonly string[]).includes(k)) hits.push(`${path}.${k}`);
      walk(v, `${path}.${k}`);
    }
  };
  walk(profile, 'profile');
  return hits;
}
