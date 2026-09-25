import accepted from './accepted-snapshot.json';

export type NevadaIntelligenceSnapshot = typeof accepted;

export const NV_SNAPSHOT_CONTRACT = 'lender-nv-state-intel-v1' as const;
export const NV_PUBLIC_FINGERPRINT =
  'a38a2aa9b3929f04c4cbea42a435866e6f1f31e41dc570e0b7ec1a7145ac6400';
export const NV_PUBLIC_PATH = '/nevada';

export const NEVADA_SNAPSHOT = accepted as NevadaIntelligenceSnapshot;

export function fmtInt(n: number | null | undefined): string {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-US');
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${n.toFixed(2)}%`;
}

export function assertNevadaIntelligence(
  value: NevadaIntelligenceSnapshot = NEVADA_SNAPSHOT,
): NevadaIntelligenceSnapshot {
  const E = value.enforcement;
  if (value.contract_name !== NV_SNAPSHOT_CONTRACT) throw new Error(`Unexpected Nevada contract ${value.contract_name}`);
  if (value.fingerprint !== NV_PUBLIC_FINGERPRINT) throw new Error('Nevada public snapshot fingerprint drifted');
  if (value.path !== NV_PUBLIC_PATH) throw new Error('Nevada publication path must be /nevada');
  const nmlsIds = value.licenses.nmls_classes.map((c) => c.id).join(',');
  if (nmlsIds !== 'mortgage_company,mlo,mortgage_servicer,supplemental_mortgage_servicer,nmls_exempt_registration') {
    throw new Error('Nevada NMLS license grains must stay separate');
  }
  const srsIds = value.licenses.srs_classes.map((c) => c.id).join(',');
  if (!srsIds.startsWith('commercial_only_mortgage_company,commercial_only_mlo,escrow_agency,escrow_agent')) {
    throw new Error('Nevada SRS license grains must stay separate');
  }
  if ([...value.licenses.nmls_classes, ...value.licenses.srs_classes].some((c) => c.rows !== null)) {
    throw new Error('No Nevada roster was acquired; rows stay null, not zero');
  }
  if (value.licenses.consumerAccessScraped !== false || value.licenses.srsScraped !== false) throw new Error('NMLS Consumer Access and SRS are not scraped');
  if (!value.licenses.no_combined_total || !value.noCombinedDenominator) throw new Error('No combined Nevada lender total');
  if (E.indexRows !== 189 || E.documentsLinked !== 188) throw new Error('MLD enforcement index drifted');
  if (E.nameOnlyAttachments !== 0) throw new Error('No name-only attachments');
  if (E.personNamesPublished !== false) throw new Error('Individual respondents are not named');
  for (const o of E.orders) {
    if (o.respondentClass === 'PERSON' && o.respondentAsPublished !== null) throw new Error(`Respondent leaked in ${o.id}`);
    if (o.respondentClass !== 'COMPANY' && o.documents.some((d) => d.url !== null)) throw new Error(`Document link leaked in ${o.id}`);
    if (o.attachment !== 'STANDALONE' && o.attachment !== 'EXACT_NMLS') throw new Error(`Unexpected attachment in ${o.id}`);
  }
  if (value.proposed_consent_orders.proposed_is_not_final !== true) throw new Error('Proposed consent orders are not final discipline');
  if (value.hmda.applications !== 119768 || value.hmda.originations !== 69135) throw new Error('Nevada HMDA drifted');
  if (value.hmda.application_is_not_lender !== true || value.hmda.lei_is_not_nv_license !== true) throw new Error('HMDA is not a license census');
  if (value.complaints.outcomes !== 'REQUEST_ONLY' || value.complaints.capability !== 'NOT_ACQUIRED') {
    throw new Error('Complaint rows are not acquired; outcomes are request-only');
  }
  if (value.expansion_ledger.NET_NEW_CANONICAL_ORGANIZATIONS !== 0) throw new Error('No new canonical organizations');
  if (value.expansion_ledger.NET_NEW_PUBLIC_PERSON_PAGES !== 0) throw new Error('No person pages');
  if (!value.no_ranking || !value.no_trust_score || !value.noLocalRoutes) throw new Error('No ranking, Trust Score, or local routes');
  return value;
}
