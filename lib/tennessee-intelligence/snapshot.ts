import accepted from './accepted-snapshot.json';

export type TennesseeIntelligenceSnapshot = typeof accepted;

export const TN_SNAPSHOT_CONTRACT = 'lender-tn-state-intel-v1' as const;
export const TN_PUBLIC_FINGERPRINT =
  'cb713c0a555163348f74e4679e66182cd55739b079178a469dd5d39e9ce1d66a';
export const TN_PUBLIC_PATH = '/tennessee';

export const TENNESSEE_SNAPSHOT = accepted as TennesseeIntelligenceSnapshot;

export function fmtInt(n: number | null | undefined): string {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-US');
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${n.toFixed(2)}%`;
}

export function assertTennesseeIntelligence(
  value: TennesseeIntelligenceSnapshot = TENNESSEE_SNAPSHOT,
): TennesseeIntelligenceSnapshot {
  const E = value.enforcement;
  if (value.contract_name !== TN_SNAPSHOT_CONTRACT) throw new Error(`Unexpected Tennessee contract ${value.contract_name}`);
  if (value.fingerprint !== TN_PUBLIC_FINGERPRINT) throw new Error('Tennessee public snapshot fingerprint drifted');
  if (value.path !== TN_PUBLIC_PATH) throw new Error('Tennessee publication path must be /tennessee');
  const ids = value.licenses.classes.map((c) => c.id).join(',');
  if (ids !== 'lender,broker,servicer,mlo,branch') throw new Error('Tennessee license grains must stay separate');
  if (value.licenses.classes.some((c) => c.rows !== null)) throw new Error('No Tennessee roster was acquired; rows stay null, not zero');
  if (value.licenses.consumerAccessScraped !== false) throw new Error('NMLS Consumer Access is not scraped');
  if (!value.licenses.no_combined_total || !value.noCombinedDenominator) throw new Error('No combined Tennessee lender total');
  if (E.ordersListed !== 10 || E.mortgageRelatedOrders !== 1) throw new Error('TDFI enforcement index drifted');
  if (E.exactNmlsAttachments !== 0 || E.nameOnlyAttachments !== 0) throw new Error('No NMLS or name-only attachments');
  if (E.personNamesPublished !== false) throw new Error('Individual respondents are not named');
  for (const o of E.orders) {
    if (o.respondentClass !== 'COMPANY' && (o.respondent !== null || o.titleAsPublished !== null)) {
      throw new Error(`Respondent leaked in ${o.id}`);
    }
    if (o.attachment !== 'STANDALONE') throw new Error('TDFI orders stay standalone');
  }
  if (!E.yearsListedWithoutPages.includes(2026)) throw new Error('2024-2026 must stay unknown, not zero');
  if (value.hmda.applications !== 302219 || value.hmda.originations !== 175419) throw new Error('Tennessee HMDA drifted');
  if (value.hmda.application_is_not_lender !== true || value.hmda.lei_is_not_tn_license !== true) throw new Error('HMDA is not a license census');
  if (value.complaints.capability !== 'REQUEST_ONLY' || value.complaints.historicalConsumersStatementUsedAsCount !== false) {
    throw new Error('Complaint rows are request-only; the historical consumer figure is not a count');
  }
  if (value.expansion_ledger.NET_NEW_CANONICAL_ORGANIZATIONS !== 0) throw new Error('No new canonical organizations');
  if (value.expansion_ledger.NET_NEW_PUBLIC_PERSON_PAGES !== 0) throw new Error('No person pages');
  if (!value.no_ranking || !value.no_trust_score || !value.noLocalRoutes) throw new Error('No ranking, Trust Score, or local routes');
  return value;
}
