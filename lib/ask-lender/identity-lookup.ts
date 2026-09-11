import nationalFile from '@/docs/lend-nat-016-search-index.json';
import floridaFile from '@/docs/fl-lend-011-florida-search-index.json';
import { SEARCH_POOL, searchDiscovery, nationalPresentationName, type DiscoveryRecord } from '@/lib/national-profile/discovery';
import { getRenderRow } from '@/lib/national-profile/publication';
import { getPhase1Row } from '@/lib/florida-profile/phase1';
import { getPhase2Row } from '@/lib/florida-profile/phase2';
import { nationalProfilePath } from '@/lib/national-profile/cohort';
import type { AskExecution, ExactMatchEvidence, IdentityCondition, IdentityRequest, LenderResearchQuery, LookupState } from './types';
import { LENDER_ASK_CONTRACT } from './types';
import type { ValidAskInput } from './request';

const SCOPE = 'Published lender institution research index (national and permitted Florida profiles)';
export type IdentitySourceEntry = { record: DiscoveryRecord; permitted: boolean; sourceReference: string; sourceAsOf: string | null };
export type IdentitySnapshot = { expectedCount: number; entries: IdentitySourceEntry[] };
/** Local source seam: no request, environment flag, or browser can supply records. */
export const lenderIdentitySource = {
  load(): IdentitySnapshot {
    if (!Array.isArray(nationalFile.rows) || !Array.isArray(floridaFile.rows) || nationalFile.rows.length !== nationalFile.count || floridaFile.rows.length !== floridaFile.count) throw new Error('identity_index_contract');
    return { expectedCount: nationalFile.count + floridaFile.count, entries: SEARCH_POOL.map(record => {
      const national = getRenderRow(record.slug);
      const florida = getPhase1Row(record.slug) ?? getPhase2Row(record.slug);
      // Preserve the existing render-approved identity-only/noindex exception; never expand it.
      const permitted = Boolean((national && national.institution_id === record.institution_id && national.stable_key === record.stable_key) || (florida && florida.institution_id === record.institution_id && florida.nmls_id === record.nmls));
      return { record, permitted, sourceReference: national ? 'docs/lend-nat-016-search-index.json; ' + national.cohort_version : 'docs/fl-lend-011-florida-search-index.json; ' + floridaFile.contract, sourceAsOf: null };
    }) };
  },
};

function conditions(request: IdentityRequest, input: ValidAskInput): IdentityCondition[] {
  const out: IdentityCondition[] = [];
  if (request.remainingText) {
    const text = request.remainingText;
    const explanation = /licens|crmla|rmla|nmls status/i.test(text)
      ? 'Current state licensing was not checked. Institution identity does not establish this licensing condition; use official verification.'
      : /complaint|enforcement|violation/i.test(text) ? 'This lookup establishes identity only. It did not check the requested complaint or enforcement observation.'
      : /best|safe|rate|apr|approv/i.test(text) ? 'Identity does not establish quality, live rates, or a future approval outcome.'
      : 'This additional name, location, or condition was not established by exact identifier equality. The result is identity-only, not a match to this condition.';
    out.push({ text, state: 'UNSUPPORTED', explanation });
  }
  for (const [key, value] of Object.entries(input.overrides)) if (value) out.push({ text: `${key}: ${value}`, state: 'UNSUPPORTED', explanation: 'HMDA filters are preserved but not applied to an identity-only lookup. Edit the question to use the existing market-research mode.' });
  for (const key of ['geography', 'loanType', 'actionTaken', 'loanPurpose', 'lenderType', 'requestedMetric', 'evidenceFamilies'] as const) {
    const value = input.structuredQuery?.[key];
    if (value != null) out.push({ text: `Structured ${key}: ${JSON.stringify(value)}`, state: 'UNSUPPORTED', explanation: 'This structured condition was retained; an exact identity card does not execute an HMDA or evidence query.' });
  }
  return out;
}

export function lookupOutcome(state: LookupState, message: string, input: ValidAskInput, query: LenderResearchQuery, request?: IdentityRequest): AskExecution {
  const ids = request?.identifiers ?? [];
  const requestedConditions = request ? conditions(request, input) : [];
  const sourceLookup = request?.problem || state === 'INVALID' || !ids.length ? 'not_run' : state === 'UNAVAILABLE' ? 'attempted' : 'completed';
  const params = new URLSearchParams({ q: input.q });
  for (const [key, value] of Object.entries(input.overrides)) if (value) params.set(key, value);
  const headings: Record<LookupState, string> = { FOUND: 'Published institution identity found', NO_MATCH: 'No exact match in the published institution index', IDENTIFIER_REQUIRED: 'Enter an identifier to continue', NEEDS_CLARIFICATION: 'Clarify the identifier before searching', CONFLICT: 'The identifiers do not establish one institution', UNSUPPORTED: 'This subject requires a different verification path', INVALID: 'Edit this research request', UNAVAILABLE: 'Institution lookup is temporarily unavailable' };
  return {
    query: { ...query, coverageState: state === 'UNAVAILABLE' || state === 'NO_MATCH' || state === 'CONFLICT' ? 'UNKNOWN' : state === 'FOUND' && requestedConditions.length ? 'PARTIAL' : query.coverageState }, terminalState: state, headline: headings[state], body: message,
    interpretation: [{ label: 'Research scope', value: SCOPE }, ...ids.map(id => ({ label: `${sourceLookup === 'not_run' ? 'Unconfirmed ' : ''}${id.type === 'LEI' ? 'LEI' : 'NMLS identifier'}`, value: id.value }))],
    geographyWarning: 'Identifier equality establishes identity only. It does not establish current licensing, service territory, or lender quality.',
    rows: [], ...(state === 'UNAVAILABLE' ? {} : { totalRows: 0 }), page: 1, pageSize: input.pageSize, pageCount: 1,
    failClosed: state === 'INVALID' || state === 'UNAVAILABLE' || state === 'UNSUPPORTED',
    lookup: { sourceLookup, scope: SCOPE, requestedClass: request?.requestedClass ?? 'unknown', resolvedClass: 'unknown', identifiers: ids, conditions: requestedConditions, officialActions: (request?.families ?? []).map(family => ({
      family, href: family === 'LEI' ? 'https://search.gleif.org/' : 'https://www.nmlsconsumeraccess.org/', label: family === 'LEI' ? 'Verify with GLEIF' : 'Open NMLS Consumer Access', instruction: `Copy the full ${family === 'LEI' ? 'LEI' : 'NMLS'} identifier into the official search. This link is not a live status check.`,
    })) },
    period: 'Stored identity index; official identity effective/retrieval time is not supplied', grain: 'institution identity',
    sharePath: input.q.length <= 180 ? `/ask?${params}` : undefined,
    caveats: ['No match in this corpus does not mean an identifier is invalid or unlicensed. A miss does not establish whether it belongs to an institution, branch, or person.'],
    trace: { contract: LENDER_ASK_CONTRACT, sourceFiles: ['docs/lend-nat-016-search-index.json', 'docs/fl-lend-011-florida-search-index.json'], method: sourceLookup === 'not_run' ? 'No source lookup executed. Correct or clarify the request before institution lookup.' : sourceLookup === 'attempted' ? 'Lookup attempted, but source or match validation failed. No completed identity finding is reported.' : 'Validated complete labeled identifier; equality on the matching source field; publication gate; institution-key deduplication.', indexes: [SCOPE], identityPolicy: 'NMLS and LEI are separate fields. A pair must exist on the same verified institution. No name fallback.', publicationGate: 'Existing render-approved national and Florida publication manifests only.', cache: 'Committed identity snapshots; no live regulator retrieval', grain: 'institution identity', period: 'Identity effective/retrieval time not supplied by these snapshots' },
  };
}

export function executeIdentityLookup(input: ValidAskInput, query: LenderResearchQuery, request: IdentityRequest): AskExecution {
  if (request.problem) return lookupOutcome(request.problem.state, request.problem.message, input, query, request);
  try {
    const snapshot = lenderIdentitySource.load();
    if (!snapshot || !Array.isArray(snapshot.entries) || snapshot.expectedCount < 1 || snapshot.entries.length !== snapshot.expectedCount) throw new Error('identity_index_unavailable');
    const permitted = snapshot.entries.filter(entry => entry.permitted);
    const seen = new Map<string, DiscoveryRecord>();
    for (const { record, sourceReference } of permitted) {
      if (!record?.institution_id || !record.stable_key || !record.slug || !record.canonical_name || !Array.isArray(record.historical_names) || !record.evidence || (record.nmls != null && !/^\d{2,12}$/.test(record.nmls)) || (record.lei != null && !/^[A-Z0-9]{20}$/.test(record.lei))) throw new Error('identity_record_contract');
      if (!sourceReference || (record.stable_key.startsWith('nmls-inst:') && record.stable_key.slice(10) !== record.nmls) || (record.stable_key.startsWith('lei:') && record.stable_key.slice(4) !== record.lei)) throw new Error('identity_key_contract');
      const prior = seen.get(record.institution_id);
      if (prior && (prior.nmls !== record.nmls || prior.lei !== record.lei || prior.stable_key !== record.stable_key)) throw new Error('identity_duplicate_conflict');
      seen.set(record.institution_id, record);
    }
    const hits = request.identifiers.map(id => searchDiscovery(`${id.type === 'LEI' ? 'LEI' : 'NMLS'} ${id.value}`, null, [...seen.values()]));
    // Exact field checks independently defend against a resolver or malformed-source regression.
    hits.forEach((group, index) => group.forEach(hit => {
      const id = request.identifiers[index], field = id.type === 'LEI' ? 'lei' : 'nmls';
      if (hit.match !== 'identifier' || hit.matchedIdentifier !== field || hit.record[field] !== id.value) throw new Error('identity_match_contradiction');
    }));
    const matched = (hits[0] ?? []).filter(hit => hits.every(group => group.some(other => other.record.institution_id === hit.record.institution_id)));
    if (!matched.length) return lookupOutcome(hits.length > 1 ? 'CONFLICT' : 'NO_MATCH', hits.length > 1 ? 'The supplied identifiers do not have a verified relationship in this published index. Confirm each identifier.' : 'The full identifier was searched exactly and is absent from this published institution corpus. Its real-world class and license status remain unknown.', input, query, request);
    if (matched.length > 1) return lookupOutcome('NEEDS_CLARIFICATION', 'Multiple distinct published institution keys carry this identifier. No institution was selected automatically; confirm the identity through official verification.', input, query, request);
    const hit = matched[0], record = hit.record;
    const source = permitted.find(entry => entry.record.institution_id === record.institution_id)!;
    const evidence: ExactMatchEvidence[] = request.identifiers.map(id => ({ method: 'exact_identifier', family: id.type, requestedValue: id.value, matchedField: id.type === 'LEI' ? 'lei' : 'nmls', returnedValue: (id.type === 'LEI' ? record.lei : record.nmls)!, institutionKey: record.institution_id, sourceReference: source.sourceReference, sourceAsOf: source.sourceAsOf, normalization: id.normalization }));
    const result = lookupOutcome('FOUND', 'The published source records this exact institution identity. Additional requested conditions below remain separate from identity resolution.', input, query, request);
    result.lookup!.resolvedClass = 'institution';
    result.lookup!.conditions.unshift(...evidence.map(e => ({ text: `${e.family === 'LEI' ? 'LEI' : 'NMLS'} ${e.returnedValue}`, state: 'APPLIED' as const, explanation: 'Exact equality against the published institution identifier field.' })));
    result.totalRows = 1;
    result.rows = [{ rank: 1, lei: record.lei ?? '', displayName: nationalPresentationName(record.canonical_name, record.display_name), metric: 0, metricLabel: 'Exact institution identifier', applications: null, originations: null, denials: null, identityStatus: 'public_profile', identityNote: 'Institution class is established by the permitted publication source, not by number length.', href: nationalProfilePath(record.slug), hrefLabel: 'Research this lender', nmls: record.nmls, institutionKey: record.institution_id, resolvedClass: 'institution', matchEvidence: evidence, whyMatched: evidence.map(e => `Exact ${e.family === 'LEI' ? 'LEI' : 'NMLS institution'} identifier: the published record lists ${e.returnedValue}.`), evidenceAvailable: ['Published institution identity; other evidence was not checked by this lookup'] }];
    return result;
  } catch {
    // Deliberately omit raw queries, source records, identifiers and exception text.
    console.error('lender_identity_lookup_unavailable', { stage: 'source_or_match_contract' });
    return lookupOutcome('UNAVAILABLE', 'The identity source could not be verified. This is not a zero-result finding. Retry this lookup or use official verification.', input, query, request);
  }
}
