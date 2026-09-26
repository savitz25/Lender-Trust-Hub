import accepted from './accepted-snapshot.json';

export type MinnesotaIntelligenceSnapshot = typeof accepted;

export const MN_SNAPSHOT_CONTRACT = 'lender-mn-state-intel-v1' as const;
export const MN_PUBLIC_FINGERPRINT =
  'e1c89c65a4d4b87497ef267f122dc7d53be9583e5e51e78a77f5f4847a6872c8';
export const MN_PUBLIC_PATH = '/minnesota';

export const MINNESOTA_SNAPSHOT = accepted as MinnesotaIntelligenceSnapshot;

export function fmtInt(n: number | null | undefined): string {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-US');
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${n.toFixed(2)}%`;
}

export function assertMinnesotaIntelligence(
  value: MinnesotaIntelligenceSnapshot = MINNESOTA_SNAPSHOT,
): MinnesotaIntelligenceSnapshot {
  const E = value.enforcement;
  if (value.contract_name !== MN_SNAPSHOT_CONTRACT) throw new Error(`Unexpected Minnesota contract ${value.contract_name}`);
  if (value.fingerprint !== MN_PUBLIC_FINGERPRINT) throw new Error('Minnesota public snapshot fingerprint drifted');
  if (value.path !== MN_PUBLIC_PATH) throw new Error('Minnesota publication path must be /minnesota');
  const ids = value.licenses.classes.map((c) => c.id).join(',');
  if (ids !== 'residential_mortgage_originator,residential_mortgage_servicer,mortgage_loan_originator,branch,exempt_certificate') {
    throw new Error('Minnesota license grains must stay separate');
  }
  if (value.licenses.classes.some((c) => c.rows !== null)) throw new Error('No Minnesota roster was acquired; rows stay null, not zero');
  if (value.licenses.consumerAccessScraped !== false) throw new Error('NMLS Consumer Access is not scraped');
  if (!value.licenses.no_combined_total || !value.noCombinedDenominator) throw new Error('No combined Minnesota lender total');
  if (E.rows !== 50 || E.companyRows + E.personRows !== E.rows) throw new Error('Commerce enforcement index drifted');
  if (E.nameOnlyAttachments !== 0 || E.personNamesPublished !== false) throw new Error('No name-only attachments or person names');
  for (const o of E.orders) {
    if (o.respondentClass === 'PERSON' && (o.respondentAsPublished !== null || o.documentUrl !== null || o.allegationAsPublished !== null)) {
      throw new Error(`Individual detail leaked in ${o.id}`);
    }
    if (o.attachment !== 'STANDALONE' && o.attachment !== 'EXACT_NMLS') throw new Error(`Unexpected attachment in ${o.id}`);
  }
  if (value.hmda.application_is_not_lender !== true || value.hmda.lei_is_not_mn_license !== true) throw new Error('HMDA is not a license census');
  if (value.complaints.outcomes !== 'REQUEST_ONLY' || value.complaints.capability !== 'NOT_ACQUIRED') {
    throw new Error('Complaint rows are not acquired; outcomes are request-only');
  }
  if (value.expansion_ledger.NET_NEW_CANONICAL_ORGANIZATIONS !== 0) throw new Error('No new canonical organizations');
  if (value.expansion_ledger.NET_NEW_PUBLIC_PERSON_PAGES !== 0) throw new Error('No person pages');
  if (!value.no_ranking || !value.no_trust_score || !value.noLocalRoutes) throw new Error('No ranking, Trust Score, or local routes');
  return value;
}
