import { FLORIDA_PHASE1_COPY } from './copy';
import type { Phase1Cohort, Phase1Kind } from './phase1';
import type { Phase2Cohort } from './phase2';

export type FloridaPubCohort = Phase1Cohort | Phase2Cohort;

const LEAK_KEYS = [
  'raw_metadata',
  'internal_only',
  'review_before_public',
  'content_sha256',
  'match_method',
  'identity-resolution',
  'attribution_confidence',
];

export type PublicAddress = {
  address1: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
};

export type PublicCredential = {
  license_number: string;
  license_class: 'MBR' | 'MLD';
  license_class_label: string;
  ofr_status: string | null;
  servicer_flag: string | null;
  firm_name: string | null;
  phone: string | null;
  prim_address: PublicAddress | null;
  mail_address: PublicAddress | null;
};

export type PublicOfrEvent = {
  event_date: string | null;
  event_type_normalized: string;
  finding_type: string | null;
  license_action: string | null;
  amount: number | null;
  document_url: string | null;
  case_number: string | null;
};

export type FloridaPublicProfile = {
  name: string;
  nmls_id: string;
  slug: string;
  cohort: FloridaPubCohort;
  kind: Phase1Kind;
  credentials: PublicCredential[];
  dual_mbr_mld: boolean;
  servicer_statement: string | null;
  ofr: {
    confirmed_event_observations: number;
    event_types: Record<string, number>;
    finding_types: Record<string, number>;
    fine_bearing_observations: number;
    parsed_fine_dollars: number;
    explicit_revocation: number;
    explicit_suspension: number;
    emergency_order: number;
    recent_events: PublicOfrEvent[];
    recent_fine_bearing: PublicOfrEvent[];
    recent_final_orders: PublicOfrEvent[];
    official_document_links: { url: string; title: string | null }[];
    no_event_copy: string | null;
  };
  hmda: { applications: number; originations: number; vintages: string[] } | null;
  cfpb: { confirmed_rows: number } | null;
  sources: { id: string; name: string; as_of?: string | null; coverage_start?: string | null; role?: string | null }[];
  freshness: {
    ofr_licensing_as_of: string | null;
    flaio_coverage_start: string | null;
    flaio_coverage_end: string | null;
    hmda_vintage: string[] | null;
    cfpb_present: boolean;
  };
  limitations: string[];
  independent: string;
};

function rec(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v : null;
}

function publicAddress(v: unknown): PublicAddress | null {
  const a = rec(v);
  const out: PublicAddress = {
    address1: str(a.address1),
    address2: str(a.address2),
    city: str(a.city),
    state: str(a.state),
    zip: str(a.zip),
  };
  if (!out.address1 && !out.city && !out.state && !out.zip) return null;
  return out;
}

function slimEvent(v: unknown): PublicOfrEvent {
  const e = rec(v);
  return {
    event_date: str(e.event_date),
    event_type_normalized: str(e.event_type_normalized) || 'OTHER',
    finding_type: str(e.finding_type),
    license_action: str(e.license_action),
    amount: typeof e.amount === 'number' ? e.amount : e.amount != null ? Number(e.amount) : null,
    document_url: str(e.document_url),
    case_number: str(e.case_number),
  };
}

export function toFloridaPublicProfile(
  raw: Record<string, unknown>,
  meta: { cohort: FloridaPubCohort; kind: Phase1Kind; slug: string }
): FloridaPublicProfile {
  const identity = rec(raw.identity);
  const licensing = rec(raw.floridaLicensing);
  const servicer = rec(raw.servicerEvidence);
  const ofr = rec(raw.floridaRegulatory);
  const hmda = rec(raw.hmda);
  const cfpb = rec(raw.cfpb);
  const freshness = rec(raw.freshness);
  const credsIn = Array.isArray(raw.credentialClasses) ? raw.credentialClasses : [];
  const credentials: PublicCredential[] = credsIn.map((c) => {
    const row = rec(c);
    const phoneOk = row.phone_class === 'public_candidate' && row.contact_class !== 'review_before_public';
    const addrOk = row.contact_class === 'public_candidate' || row.contact_class == null;
    return {
      license_number: str(row.license_number) || '',
      license_class: row.license_class === 'MLD' ? 'MLD' : 'MBR',
      license_class_label: str(row.license_class_label) || (row.license_class === 'MLD' ? 'Mortgage Lender' : 'Mortgage Broker'),
      ofr_status: str(row.ofr_status),
      servicer_flag: str(row.servicer_flag),
      firm_name: str(row.firm_name),
      phone: phoneOk ? str(row.phone) : null,
      prim_address: addrOk ? publicAddress(row.prim_address) : null,
      mail_address: addrOk ? publicAddress(row.mail_address) : null,
    };
  });

  const grain = rec(hmda.florida_state_grain);
  const hmdaPub =
    grain.applications != null
      ? {
          applications: Number(grain.applications) || 0,
          originations: Number(grain.originations) || 0,
          vintages: Array.isArray(grain.vintages) ? grain.vintages.map(String) : [],
        }
      : null;
  const cfpbN = Number(cfpb.confirmed_rows) || 0;

  const sourcesIn = Array.isArray(raw.sources) ? raw.sources : [];
  const sources = sourcesIn.map((s) => {
    const row = rec(s);
    return {
      id: str(row.id) || '',
      name: str(row.name) || '',
      as_of: str(row.as_of),
      coverage_start: str(row.coverage_start),
      role: str(row.role),
    };
  });

  const ofrCount = Number(ofr.confirmed_event_observations) || 0;
  return {
    name: str(identity.canonical_name) || meta.slug,
    nmls_id: str(identity.nmls_id) || '',
    slug: meta.slug,
    cohort: meta.cohort,
    kind: meta.kind,
    credentials,
    dual_mbr_mld: Boolean(licensing.dual_mbr_mld),
    servicer_statement: Number(servicer.ofr_mld_servicer_yes_credentials) > 0 ? FLORIDA_PHASE1_COPY.servicerYes : null,
    ofr: {
      confirmed_event_observations: ofrCount,
      event_types: rec(ofr.event_types) as Record<string, number>,
      finding_types: rec(ofr.finding_types) as Record<string, number>,
      fine_bearing_observations: Number(ofr.fine_bearing_observations) || 0,
      parsed_fine_dollars: Number(ofr.parsed_fine_dollars) || 0,
      explicit_revocation: Number(ofr.explicit_revocation) || 0,
      explicit_suspension: Number(ofr.explicit_suspension) || 0,
      emergency_order: Number(ofr.emergency_order) || 0,
      recent_events: Array.isArray(ofr.recent_events) ? ofr.recent_events.map(slimEvent) : [],
      recent_fine_bearing: Array.isArray(ofr.recent_fine_bearing) ? ofr.recent_fine_bearing.map(slimEvent) : [],
      recent_final_orders: Array.isArray(ofr.recent_final_orders) ? ofr.recent_final_orders.map(slimEvent) : [],
      official_document_links: Array.isArray(ofr.official_document_links)
        ? ofr.official_document_links
            .map((d) => ({ url: str(rec(d).url) || '', title: str(rec(d).title) }))
            .filter((d) => d.url)
        : [],
      no_event_copy: ofrCount === 0 ? FLORIDA_PHASE1_COPY.noEvent : null,
    },
    hmda: hmdaPub,
    cfpb: cfpbN > 0 ? { confirmed_rows: cfpbN } : null,
    sources,
    freshness: {
      ofr_licensing_as_of: str(freshness.ofr_licensing_as_of),
      flaio_coverage_start: str(freshness.flaio_coverage_start),
      flaio_coverage_end: str(freshness.flaio_coverage_end),
      hmda_vintage: Array.isArray(freshness.hmda_vintage) ? freshness.hmda_vintage.map(String) : hmdaPub?.vintages || null,
      cfpb_present: Boolean(freshness.cfpb_present) || cfpbN > 0,
    },
    limitations: [
      FLORIDA_PHASE1_COPY.currentApproved,
      FLORIDA_PHASE1_COPY.addressNotTerritory,
      FLORIDA_PHASE1_COPY.flaioStart,
      FLORIDA_PHASE1_COPY.unattached607,
      FLORIDA_PHASE1_COPY.cfpbNotFindings,
      FLORIDA_PHASE1_COPY.hmdaNotQuality,
      FLORIDA_PHASE1_COPY.noMloBranch,
      FLORIDA_PHASE1_COPY.notCleanRecord,
      FLORIDA_PHASE1_COPY.consentNotAdmission,
      FLORIDA_PHASE1_COPY.ofrNotFederal,
    ],
    independent: FLORIDA_PHASE1_COPY.independent,
  };
}

export function publicProfileLeakHits(obj: unknown): string[] {
  const raw = JSON.stringify(obj);
  return LEAK_KEYS.filter((k) => raw.includes(k));
}
