/**
 * TH-SEARCH-R1-019C: network-facing institution name-candidate operation.
 *
 * A SEPARATE, separately versioned contract. trusthub-specialist-execution-v2 (exact identity,
 * exact/DBA-bound CFPB evidence, HMDA cohorts) is untouched: same files, same fingerprints, same
 * semantics. Consumers opt in to candidates by calling this operation; nothing here can attach
 * evidence, and no v2 caller starts receiving partial matches.
 */
import { createHash } from 'node:crypto';
import { CATALOG_SCOPE, GLEIF_RECORD_URL, loadCandidateCatalog, type CandidateCatalog } from './catalog';
import { CANDIDATE_DEFAULT_LIMIT, CANDIDATE_MAX_LIMIT, CANDIDATE_MAX_PAGE, CANDIDATE_NAME_MAX_LENGTH, MATCH_METHODS, searchNameCandidates, type NameCandidate } from './engine';

export const NAME_CANDIDATES_CONTRACT = 'lender-name-candidates-v1' as const;
export const NAME_CANDIDATES_VERSION = '1.0.0' as const;
export const NAME_CANDIDATES_PATH = '/api/specialist-execution/name-candidates/v1' as const;
export const LENDER_ORIGIN = 'https://www.lendertrusthub.com' as const;

export const NAME_CANDIDATE_RESULT_STATES = ['CANDIDATES', 'AMBIGUOUS_EXACT_NAME', 'NO_MATCH', 'RESTRICTED_SCOPE', 'SOURCE_UNAVAILABLE', 'INVALID_REQUEST'] as const;
export type NameCandidateResultState = (typeof NAME_CANDIDATE_RESULT_STATES)[number];

const schema = {
  request: ['operation', 'name', 'page', 'limit'],
  response: ['contract', 'contractVersion', 'schemaFingerprint', 'resultState', 'name', 'scope', 'source', 'candidates', 'pagination', 'continuation', 'limitations', 'diagnostics'],
  candidate: ['stableKey', 'displayName', 'entityType', 'match', 'identifiers', 'publicationState', 'action', 'source'],
  match: ['method', 'field', 'value', 'sourceLabel', 'explanation', 'isDocumentedSourceName'],
  resultStates: NAME_CANDIDATE_RESULT_STATES,
  matchMethods: Object.keys(MATCH_METHODS),
} as const;
export const NAME_CANDIDATES_SCHEMA_FINGERPRINT = createHash('sha256').update(JSON.stringify(schema)).digest('hex');

export type NameCandidatesRequest = { operation?: unknown; name?: unknown; page?: unknown; limit?: unknown; [key: string]: unknown };

/** An identifier, a person or a branch is not an institution-name search. Those keep their own protected operations. */
const IDENTIFIER_SHAPED = /^(?:\s*(?:nmls|lei|fdic|ncua|charter|cert)\b|[\d\s#-]+$|[A-Za-z0-9]{20}$)/i;
const PERSON_OR_BRANCH = /\b(?:loan officer|mlo|branch(?:es)?|originator)\b/i;

function candidateView(candidate: NameCandidate) {
  const { institution, matchedName } = candidate;
  const profile = institution.publicationState === 'public_profile' && institution.profilePath;
  const identifiers = [
    institution.nmls ? { label: 'NMLS', value: institution.nmls } : null,
    institution.lei ? { label: 'LEI', value: institution.lei } : null,
  ].filter(Boolean);
  return {
    stableKey: `lender:${institution.institutionKey}`,
    displayName: institution.displayName,
    entityType: institution.entityType,
    match: {
      method: candidate.method,
      field: matchedName.field,
      /** The actual source text that matched -- so a consumer never has to infer an alias from a display-name difference. */
      value: matchedName.value,
      sourceLabel: matchedName.sourceLabel,
      explanation: candidate.explanation,
      isDocumentedSourceName: matchedName.field !== 'derived_slug_form',
    },
    identifiers,
    publicationState: institution.publicationState,
    action: profile
      ? { type: 'PROFILE', label: 'Open LenderTrustHub profile', url: `${LENDER_ORIGIN}${profile}` }
      // No profile exists, so none is linked or invented. The record's own LEI can be verified at its official registry.
      : institution.lei
        ? { type: 'OFFICIAL_IDENTIFIER_VERIFICATION', label: 'Verify this LEI with GLEIF (official registry)', url: `${GLEIF_RECORD_URL}${institution.lei}` }
        : null,
    source: { reference: institution.sourceReference, clock: { label: 'Source as-of date', value: null as string | null } },
  };
}

function base(resultState: NameCandidateResultState, status: number, name: { supplied: string; normalized: string; predicateApplied: boolean }, extra: Record<string, unknown>, catalog?: CandidateCatalog) {
  return {
    status,
    body: {
      contract: NAME_CANDIDATES_CONTRACT, contractVersion: NAME_CANDIDATES_VERSION, schemaFingerprint: NAME_CANDIDATES_SCHEMA_FINGERPRINT,
      resultState,
      name: { ...name, predicate: 'Institution source names equal to, beginning with, or containing every distinctive word of the supplied name (case, punctuation, terminal legal form and FCU normalized). Applied to the whole catalog before paging.' },
      scope: CATALOG_SCOPE,
      source: catalog ? { version: catalog.sourceVersion, counts: catalog.counts, clock: { label: 'Source as-of date', value: null, note: 'The committed identity files do not carry an as-of date; none is invented.' } } : null,
      candidates: [], pagination: null, continuation: null,
      limitations: [] as string[],
      diagnostics: { executionEngine: 'lender-name-candidates-v1', dbReads: 0, dbWrites: 0, networkCalls: 0 },
      ...extra,
    },
  };
}

export function executeNameCandidates(request: NameCandidatesRequest, loadCatalog: () => CandidateCatalog = loadCandidateCatalog) {
  const blank = { supplied: '', normalized: '', predicateApplied: false };
  const invalid = (message: string, supplied = '') => base('INVALID_REQUEST', 400, { ...blank, supplied }, { limitations: [message] });
  if (!request || typeof request !== 'object' || Array.isArray(request)) return invalid('A JSON object is required.');
  const allowed = new Set(['operation', 'name', 'page', 'limit']);
  // A consumer can never supply records, names to trust, URLs, SQL or scope.
  if (Object.keys(request).some((key) => !allowed.has(key))) return invalid('Only operation, name, page and limit are accepted.');
  if (request.operation !== undefined && request.operation !== 'name_candidates') return invalid('operation must be "name_candidates".');
  if (typeof request.name !== 'string') return invalid('name must be a string.');
  const supplied = request.name.trim();
  if (supplied.length < 2 || supplied.length > CANDIDATE_NAME_MAX_LENGTH) return invalid(`name must be 2-${CANDIDATE_NAME_MAX_LENGTH} characters.`, supplied.slice(0, CANDIDATE_NAME_MAX_LENGTH));
  for (const [key, max] of [['page', CANDIDATE_MAX_PAGE], ['limit', CANDIDATE_MAX_LIMIT]] as const) {
    const value = request[key];
    if (value !== undefined && (!Number.isInteger(value) || (value as number) < 1 || (value as number) > max)) return invalid(`${key} must be an integer from 1 to ${max}.`, supplied);
  }
  if (IDENTIFIER_SHAPED.test(supplied) || PERSON_OR_BRANCH.test(supplied)) {
    return base('RESTRICTED_SCOPE', 422, { ...blank, supplied }, {
      limitations: ['This operation searches institution NAMES only. Identifiers use the exact-identifier operation; NMLS person/MLO and branch records are not searchable by name.'],
    });
  }

  let catalog: CandidateCatalog;
  try { catalog = loadCatalog(); } catch {
    // Deliberately no exception text. A failed source is never a miss.
    return base('SOURCE_UNAVAILABLE', 503, { ...blank, supplied }, { limitations: ['The institution name sources could not be verified. This is not a "no match" result; retry.'] });
  }

  const result = searchNameCandidates(catalog.institutions, supplied, { page: request.page as number | undefined, limit: (request.limit as number | undefined) ?? CANDIDATE_DEFAULT_LIMIT });
  const name = { supplied: result.suppliedName, normalized: result.normalizedName, predicateApplied: result.predicateApplied };
  if (!result.predicateApplied) return invalid('name has no searchable letters or digits.', supplied);
  const pagination = { page: result.page, limit: result.limit, returned: result.candidates.length, total: result.total, hasMore: result.hasMore, truncated: false, maxPage: CANDIDATE_MAX_PAGE };
  const continuation = { label: 'Search this name on LenderTrustHub', url: `${LENDER_ORIGIN}/ask?q=${encodeURIComponent(result.suppliedName)}` };
  const common = [
    'A candidate is a name match. It is not a verified identity relationship, a license or status finding, a recommendation, or complaint evidence.',
    'Institutions known to LenderTrustHub only through an exact NMLS/LEI research lookup are not searchable by name; a miss here does not mean an identifier is invalid.',
    'total counts candidate records for this name. It is not market activity.',
  ];
  if (result.total === 0) {
    return base('NO_MATCH', 200, name, { pagination, continuation, limitations: ['No institution name in the searched scope matched. Nothing was substituted.', ...common.slice(1)] }, catalog);
  }
  return base(result.exactNameAmbiguous ? 'AMBIGUOUS_EXACT_NAME' : 'CANDIDATES', 200, name, {
    candidates: result.candidates.map(candidateView), pagination, continuation,
    limitations: result.exactNameAmbiguous ? ['More than one distinct institution carries this exact name. They are separate records; choose by identifier.', ...common] : common,
  }, catalog);
}
