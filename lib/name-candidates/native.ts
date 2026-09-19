/**
 * TH-SEARCH-R1-019C: native Ask adapter over the shared candidate engine.
 *
 * Decides when an Ask input is an institution NAME, then formats engine results as the existing
 * AskExecution the page and /api/ask already render. Matching and scope live in engine.ts /
 * catalog.ts and are shared, unchanged, with the network operation.
 *
 * Protected and untouched: labeled identifiers (strongest precedence), HMDA counts, property
 * geography, definitions, licensing and evidence questions, personal-advice refusals. A name result
 * never carries complaint or status evidence.
 */
import type { AskExecution, AskInstitutionRow, LenderResearchQuery } from '@/lib/ask-lender/types';
import { LENDER_ASK_CONTRACT } from '@/lib/ask-lender/types';
import type { ValidAskInput } from '@/lib/ask-lender/request';
import { GLEIF_RECORD_URL, loadCandidateCatalog, type CandidateCatalog } from './catalog';
import { CANDIDATE_MAX_LIMIT, MATCH_METHODS, searchNameCandidates, type MatchMethod } from './engine';

export type NativeNameDecision = {
  name: string;
  basis: 'PARSER_ENTITY_NAME' | 'BARE_NAME' | 'QUOTED_NAME' | 'FULL_SOURCE_NAME_OVER_OTHER_READING';
  /** Explicit conditions the customer typed that a name search does not apply. Shown, never silently dropped. */
  unresolvedConditions: string[];
};

const LEAD_VERB = /^(?:please\s+)?(?:find|research|look\s*up|lookup|search(?:\s+for)?|show(?:\s+me)?)\s+/i;
const SENTENCE_START = /^(?:how|what|which|who|whom|whose|where|when|why|is|are|was|were|does|do|did|can|could|should|would|will|i|im|i'm|we|my|our|need|want|looking|compare|list|tell|help|best|top|cheapest|lowest)\b/i;
const NOT_A_NAME = /\b(?:how many|number of|counts?|applications?|originations?|originated|denials?|denied|market share|rates?|apr|complaints?|enforcement|violations?|lawsuits?|licens\w*|reviews?|near me|my area|my county|vs|versus)\b/i;
const IDENTIFIER_SHAPED = /\b(?:nmls|lei|fdic|ncua)\b|^[\d\s#-]+$|^[A-Za-z0-9]{20}$/i;
const LOCATIVE_SPLIT = /^(.+?)\s+(in|near|around|serving)\s+(.+)$/i;
const FULL_NAME_RANK = 4;

function nameShaped(text: string): boolean {
  if (text.length < 2 || text.length > 120 || text.includes('?')) return false;
  if (SENTENCE_START.test(text) || NOT_A_NAME.test(text) || IDENTIFIER_SHAPED.test(text)) return false;
  return text.split(/\s+/).length <= 10;
}

/**
 * `parsed` is the existing parser's reading. It wins unless (a) nothing else understood the text, or
 * (b) the WHOLE text is an institution's source name. A category or place reading is never overridden
 * by a partial match, so "Texas mortgage lenders" stays a cohort question.
 */
export function decideNativeNameSearch(raw: string, parsed: LenderResearchQuery, catalog: () => CandidateCatalog = loadCandidateCatalog): NativeNameDecision | null {
  if (parsed.identityRequest || parsed.identifier) return null; // exact identifiers keep strongest precedence
  if (parsed.evidenceFamilies?.length || parsed.mode === 'definition' || parsed.mode === 'evidence') return null;
  if (parsed.mode === 'entity' && parsed.identityQuery) return { name: parsed.identityQuery, basis: 'PARSER_ENTITY_NAME', unresolvedConditions: [] };
  if (parsed.mode === 'fail_closed' && parsed.failClosedKind === 'malformed') return null;

  const trimmed = (raw ?? '').trim().replace(/\s+/g, ' ');
  const quoted = trimmed.match(/^["“]([^"”]{2,120})["”]$/)?.[1]?.trim();
  if (quoted && !IDENTIFIER_SHAPED.test(quoted)) return { name: quoted, basis: 'QUOTED_NAME', unresolvedConditions: [] };

  const text = trimmed.replace(LEAD_VERB, '').replace(/[.!\s]+$/, '').trim();
  const fullName = (candidate: string) => {
    try { return searchNameCandidates(catalog().institutions, candidate, { limit: 1 }).candidates.some((c) => c.rank <= FULL_NAME_RANK); } catch { return false; }
  };

  // "<institution name> in <place>": a name with an explicit location condition. The name is searched; the
  // condition stays visible as not applied (HMDA geography is property location, not lender location).
  const split = text.match(LOCATIVE_SPLIT);
  if (split && nameShaped(split[1]!) && fullName(split[1]!)) {
    return { name: split[1]!.trim(), basis: 'FULL_SOURCE_NAME_OVER_OTHER_READING', unresolvedConditions: [`${split[2]} ${split[3]}`] };
  }
  if (!nameShaped(text) || /\s(?:in|near|around|serving)\s/i.test(` ${text} `)) return null;

  const nothingElseUnderstoodIt = parsed.mode === 'fail_closed' && parsed.failClosedKind === 'unsupported';
  if (nothingElseUnderstoodIt) return { name: text, basis: 'BARE_NAME', unresolvedConditions: [] };
  return fullName(text) ? { name: text, basis: 'FULL_SOURCE_NAME_OVER_OTHER_READING', unresolvedConditions: [] } : null;
}

const METHOD_LABEL: Record<MatchMethod, string> = {
  EXACT_NORMALIZED_NAME: 'Same name', DOCUMENTED_HISTORICAL_NAME: 'Historical name in source', LEGAL_SUFFIX_NORMALIZED: 'Same name (legal form ignored)',
  ABBREVIATION_NORMALIZED: 'Same name (FCU search form)', DERIVED_SLUG_FORM: 'Profile search form', WORD_PREFIX: 'Name begins with', DISTINCTIVE_TOKENS: 'Name contains',
};
const IDENTITY_NOTE = {
  public_profile: 'Published lender institution profile. Branch and MLO records are excluded.',
  unpublished_research_identity: 'HMDA reporting institution. Not a public LenderTrustHub research profile; no profile link exists.',
  identity_hold: 'HMDA reporting institution whose LEI is also carried by a differently named published profile. No profile link or borrowed identifier is attached.',
} as const;

export function executeNativeNameCandidates(input: ValidAskInput, parsed: LenderResearchQuery, decision: NativeNameDecision, loadCatalog: () => CandidateCatalog = loadCandidateCatalog): AskExecution {
  const started = Date.now();
  const params = new URLSearchParams({ q: input.q });
  const sharePath = input.q.length <= 180 ? `/ask?${params}` : undefined;
  const query: LenderResearchQuery = { ...parsed, mode: 'entity', identityQuery: decision.name, requestedMetric: null, failClosedKind: undefined, failReason: undefined, geography: undefined, coverageState: decision.unresolvedConditions.length ? 'PARTIAL' : 'KNOWN' };
  const trace = (method: string, sourceFiles: string[]) => ({
    contract: LENDER_ASK_CONTRACT, sourceFiles, method, indexes: ['in-memory institution name catalog'],
    identityPolicy: 'A candidate is a name match only. Exact identity and complaint evidence use separate exact matching.',
    publicationGate: 'Published profiles pass the existing render gate; HMDA reporting institutions without a profile are shown inline with no profile link.',
    cache: 'process memory', grain: 'lender institution name candidates', period: 'Committed identity files',
  });
  const interpretation = [
    { label: 'Research type', value: 'Institution name search' },
    { label: 'Institution name', value: decision.name },
    { label: 'Entity grain', value: 'Lender institution — not branch or MLO' },
    ...decision.unresolvedConditions.map((value) => ({ label: 'Not applied', value })),
  ];
  const conditionCaveats = decision.unresolvedConditions.map((value) => `"${value}" was not applied. Candidates are matched by name only; HMDA geography is the property location, not where a lender is located or licensed.`);

  let catalog: CandidateCatalog;
  try { catalog = loadCatalog(); } catch {
    console.error('lender_name_candidates_unavailable', { stage: 'catalog' });
    return {
      query: { ...query, coverageState: 'UNKNOWN' }, terminalState: 'UNAVAILABLE', failClosed: true, interpretation,
      geographyWarning: 'The institution name sources could not be verified.',
      headline: `We could not search for “${decision.name}” right now`,
      body: 'The institution name sources could not be verified. This is not a “no match” result. Your name was kept — retry, or research a labeled NMLS or LEI.',
      rows: [], page: 1, pageSize: input.pageSize, pageCount: 1, sharePath,
      nameCandidates: { suppliedName: decision.name, state: 'UNAVAILABLE', total: null, unresolvedConditions: decision.unresolvedConditions },
      caveats: ['A source failure does not establish that no institution has this name.'],
      trace: trace('Institution name catalog failed its source contract. No search was executed.', []), elapsedMs: Date.now() - started,
    };
  }

  const limit = Math.min(input.pageSize, CANDIDATE_MAX_LIMIT);
  const result = searchNameCandidates(catalog.institutions, decision.name, { page: input.page, limit });
  const offset = (result.page - 1) * result.limit;
  const rows: AskInstitutionRow[] = result.candidates.map((candidate, index) => {
    const { institution } = candidate;
    const profile = institution.publicationState === 'public_profile' ? institution.profilePath : null;
    return {
      rank: offset + index + 1, lei: institution.lei ?? '', displayName: institution.displayName, nmls: institution.nmls,
      metric: 0, metricLabel: METHOD_LABEL[candidate.method], applications: null, originations: null, denials: null,
      identityStatus: institution.publicationState, identityNote: IDENTITY_NOTE[institution.publicationState],
      href: profile ?? undefined, hrefLabel: profile ? 'Research this lender' : undefined,
      officialHref: !profile && institution.lei ? `${GLEIF_RECORD_URL}${institution.lei}` : undefined,
      officialLabel: !profile && institution.lei ? 'Verify LEI with GLEIF' : undefined,
      institutionKey: institution.institutionKey,
      whyMatched: [
        `${MATCH_METHODS[candidate.method].explanation} Matched ${candidate.matchedName.sourceLabel}: “${candidate.matchedName.value}”.`,
        'A name match is a candidate, not a verified identity, a license or status finding, a recommendation, or complaint evidence.',
      ],
      evidenceAvailable: [institution.entityType],
    };
  });
  const pageCount = Math.max(1, Math.ceil(result.total / result.limit));
  const found = result.total > 0;
  return {
    query, interpretation,
    geographyWarning: 'Names are matched against institution source names. A similar name is not proof of the same institution.',
    headline: found
      ? `${result.total} institution ${result.total === 1 ? 'record' : 'records'} with a name like “${decision.name}”${result.exactNameAmbiguous ? ' — more than one institution carries this name' : ''}`
      : `No institution name matched “${decision.name}”`,
    body: found
      ? 'These are name candidates from published lender profiles and HMDA reporting institutions. Similarly named records are separate institutions unless an identifier says otherwise. Counts here are candidate records, not market activity.'
      : 'Your name was kept. Check the spelling, try a shorter distinctive part of the name, or research a labeled NMLS or LEI. Institutions known only through an exact identifier lookup are not searchable by name, so a miss does not mean an institution does not exist.',
    rows, totalRows: result.total, page: result.page, pageSize: result.limit, pageCount, sharePath,
    nameCandidates: { suppliedName: decision.name, state: found ? (result.exactNameAmbiguous ? 'AMBIGUOUS_EXACT_NAME' : 'CANDIDATES') : 'NO_MATCH', total: result.total, unresolvedConditions: decision.unresolvedConditions },
    period: 'Committed identity files (no as-of date supplied by the source)', grain: 'lender institution name candidates',
    caveats: [...conditionCaveats, 'NMLS institution IDs, branch IDs, and person/MLO IDs are separate identity classes. People and branches are not searchable by name.'],
    trace: trace('Name predicate applied to the whole institution catalog before paging: exact/normalized, historical, legal-form and FCU search forms, then word-prefix and distinctive-word candidates.', [catalog.sourceVersion.profiles, 'lib/ask-lender/generated/gleif.json', 'lib/ask-lender/generated/mappings.csv.json']),
    elapsedMs: Date.now() - started,
  };
}
