import accepted from './accepted-snapshot.json';

export type MassachusettsIntelligenceSnapshot = typeof accepted;

export const MA_SNAPSHOT_CONTRACT = 'lender-ma-state-intel-v1' as const;
export const MA_PUBLIC_FINGERPRINT =
  'efd41b02e75a7a0891bc433b50ddd19b5ba3c4095b96521739f20012188aaebe';
export const MA_PUBLIC_PATH = '/massachusetts';

export const MASSACHUSETTS_SNAPSHOT = accepted as MassachusettsIntelligenceSnapshot;

export function fmtInt(n: number | null | undefined): string {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-US');
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${n.toFixed(2)}%`;
}

export function assertMassachusettsIntelligence(
  value: MassachusettsIntelligenceSnapshot = MASSACHUSETTS_SNAPSHOT,
): MassachusettsIntelligenceSnapshot {
  const L = value.licenses;
  const E = value.enforcement;
  if (value.contract_name !== MA_SNAPSHOT_CONTRACT) throw new Error(`Unexpected Massachusetts contract ${value.contract_name}`);
  if (value.fingerprint !== MA_PUBLIC_FINGERPRINT) throw new Error('Massachusetts public snapshot fingerprint drifted');
  if (value.path !== MA_PUBLIC_PATH) throw new Error('Massachusetts publication path must be /massachusetts');
  if (L.source_as_of !== '2026-06-30') throw new Error('DOB licensee files are as of 2026-06-30');
  if (L.retrieved_at.startsWith('2026-06-30')) throw new Error('Retrieval time is not the file date');
  if (value.generated_at.startsWith(L.source_as_of)) throw new Error('generated_at must differ from source_as_of');
  if (L.lender.distinct_company_nmls_ids !== 298 || L.lender.total_rows !== 1614) throw new Error('DOB lender file drifted');
  if (L.lender.branch_license_rows !== 1205 || L.lender.trade_name_rows !== 111) throw new Error('DOB lender branch/trade-name rows drifted');
  if (L.broker.distinct_company_nmls_ids !== 453 || L.broker.total_rows !== 1669) throw new Error('DOB broker file drifted');
  if (L.broker.branch_license_rows !== 1133 || L.broker.trade_name_rows !== 83) throw new Error('DOB broker branch/trade-name rows drifted');
  if (L.mlo.rows !== 10397 || L.mlo.distinct_person_nmls_ids !== 10395 || L.mlo.grain !== 'PERSON') throw new Error('DOB MLO person file drifted');
  if (L.cross_file.distinct_company_nmls_ids_any_file !== 559 || L.cross_file.companies_holding_lender_and_broker !== 192) {
    throw new Error('Company identity reconciliation drifted');
  }
  if (Number(L.lender.distinct_company_nmls_ids) === Number(L.broker.distinct_company_nmls_ids)) throw new Error('lender and broker must stay distinct');
  if (L.mlo.sponsor_company_join !== 'UNSUPPORTED' || L.mlo.public_person_pages !== 'NONE') throw new Error('MLO person grain must not be published or name-joined');
  if (L.mlo.source_file_committed !== false) throw new Error('MLO person roster must not be committed');
  if (!L.no_combined_total || !value.noCombinedDenominator) throw new Error('No combined Massachusetts lender total');
  if (E.mortgage_related_events !== 33 || E.coverage_state !== 'PARTIAL') throw new Error('DOB enforcement window drifted');
  if (E.name_only_attachments !== 0) throw new Error('No name-only enforcement attachments');
  if (E.person_names_published !== false) throw new Error('Individual respondents are not named');
  for (const e of E.events) {
    for (const p of e.parties) {
      if (p.respondent_class === 'PERSON' && (p.name_as_published != null || p.nmls_printed != null)) {
        throw new Error(`Person respondent identity leaked in ${e.event_id}`);
      }
      if (p.attached_identity && p.attachment !== 'EXACT_NMLS_PRINTED') throw new Error('Only printed NMLS numbers attach');
    }
  }
  if (value.hmda.applications !== 216396 || value.hmda.originations !== 135275) throw new Error('Massachusetts HMDA totals drifted');
  if (value.hmda.application_is_not_lender !== true || value.hmda.lei_is_not_ma_license !== true) throw new Error('HMDA is not a license census');
  if (Number(value.hmda.applications) === Number(L.lender.total_rows)) throw new Error('HMDA applications are not license rows');
  if (value.complaints.public_provider_level_dataset !== 'NOT_ACQUIRED' || value.complaints.cfpb_substituted !== false) {
    throw new Error('DOB complaints are not public; CFPB is not a substitute');
  }
  if (value.expansion_ledger.NET_NEW_CANONICAL_ORGANIZATIONS !== 0) throw new Error('Do not mint canonical organizations from DOB rows');
  if (value.expansion_ledger.NET_NEW_PUBLIC_LENDER_PROFILES !== 0) throw new Error('No net-new public lender profiles');
  if (value.expansion_ledger.NET_NEW_PUBLIC_PERSON_PAGES !== 0) throw new Error('No public person pages');
  if (value.expansion_ledger.CLAIM_ELIGIBILITY_BROADENED !== false) throw new Error('Claim eligibility unchanged');
  if (!value.no_ranking || !value.no_trust_score || !value.noLocalRoutes) throw new Error('No ranking, Trust Score, or local routes');
  return value;
}
