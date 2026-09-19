/**
 * TH-SEARCH-R1-019C: native Ask adapter over the shared candidate engine.
 *
 * Decides when an Ask input is an institution NAME, then formats engine results as the existing
 * AskExecution the page and /api/ask already render. Matching and scope live in engine.ts /
 * catalog.ts and are shared, unchanged, with the network operation.
 *
 * The decision is STRUCTURAL, not a word blacklist:
 *   - validated label + value identifiers keep strongest precedence (parser's identityRequest);
 *   - what the existing parser explicitly CAPTURED as a definition or evidence request is protected;
 *   - otherwise a text is a name attempt when the ENGINE itself says its distinctive words name an
 *     institution (or the whole text equals a source name), or when no other reading understood it.
 * Vocabulary alone ("Charter", "Branch", "Best", "First") never rejects or forces a name.
 * Every condition the customer supplied but a name search cannot apply is kept and shown.
 */
import type { AskExecution, AskInstitutionRow, LenderResearchQuery } from '@/lib/ask-lender/types';
import { LENDER_ASK_CONTRACT } from '@/lib/ask-lender/types';
import type { ValidAskInput } from '@/lib/ask-lender/request';
import type { AskUrlOverrides } from '@/lib/ask-lender/parse';
import { STATE_NAMES } from '@/lib/home-intel/states';
import { GLEIF_RECORD_URL, loadCandidateCatalog, type CandidateCatalog } from './catalog';
import { CANDIDATE_MAX_LIMIT, CANDIDATE_WINDOW, MATCH_METHODS, searchNameCandidates, type MatchMethod } from './engine';
import { candidateTokens, distinctiveTokens } from './normalize';
import { hasGenuineLabeledIdentifier, isIdentifierAttempt } from './request-shape';

export type NativeNameDecision = {
  name: string;
  basis: 'PARSER_ENTITY_NAME' | 'ONLY_READING' | 'QUOTED_NAME' | 'FULL_SOURCE_NAME' | 'DISTINCTIVE_WORDS_NAME_AN_INSTITUTION' | 'NAME_SHAPED_SOURCE_UNAVAILABLE';
  /** Conditions the customer supplied that a name search does not apply. Shown as NOT APPLIED, never silently dropped. */
  unresolvedConditions: string[];
};

const LEAD_VERB = /^(?:please\s+)?(?:find|research|look\s*up|lookup|search(?:\s+for)?|show(?:\s+me)?)\s+/i;
/** "<name> in|near|around|serving <place>": an explicit location CONDITION attached to a name. */
const LOCATIVE_SPLIT = /^(.+?)\s+(in|near|around|serving)\s+(.+)$/i;
const FULL_NAME_RANK = 4;
const MAX_NAME_WORDS = 10;

type Probe = 'full_name' | 'candidates' | 'none' | 'unavailable';
function probeEngine(text: string, catalog: () => CandidateCatalog): Probe {
  let institutions;
  try { institutions = catalog().institutions; } catch { return 'unavailable'; } // a failed source is NOT evidence that a text is not a name
  const top = searchNameCandidates(institutions, text, { limit: 1 }).candidates[0];
  return !top ? 'none' : top.rank <= FULL_NAME_RANK ? 'full_name' : 'candidates';
}

/** Words of the text that could distinguish an institution, excluding geography the parser already consumed as a place. */
function decisionDistinctive(text: string, parsed: LenderResearchQuery): string[] {
  const geo = parsed.geography;
  const place = new Set(candidateTokens([geo?.state ? STATE_NAMES[geo.state] : '', geo?.state ?? '', geo?.county ?? ''].join(' ')));
  return distinctiveTokens(candidateTokens(text)).filter((token) => !place.has(token));
}

function overrideConditions(overrides: AskUrlOverrides | undefined): string[] {
  const out: string[] = [];
  if (overrides?.action) out.push(`filter action: ${overrides.action}`);
  if (overrides?.loanType) out.push(`filter loan type: ${overrides.loanType}`);
  if (overrides?.geo) out.push(`filter geography: ${overrides.geo}`);
  return out;
}

/** What the customer typed besides the name, for a name the parser extracted on its own ("Rocket Mortgage company in Texas"). */
function residualCondition(original: string, name: string): string | null {
  const index = original.toLowerCase().indexOf(name.toLowerCase());
  if (index < 0) return null;
  const rest = `${original.slice(0, index)} ${original.slice(index + name.length)}`.replace(LEAD_VERB, ' ').replace(/[.!?\s]+$/, '').trim().replace(/\s+/g, ' ');
  const words = rest.split(' ').filter(Boolean);
  while (words.length && distinctiveTokens(candidateTokens(words[0]!)).length === 0 && !/^(?:in|near|around|serving)$/i.test(words[0]!)) words.shift();
  return words.length ? words.join(' ') : null;
}

export function decideNativeNameSearch(
  raw: string, parsed: LenderResearchQuery,
  catalog: () => CandidateCatalog = loadCandidateCatalog, overrides?: AskUrlOverrides,
): NativeNameDecision | null {
  // Protected captures of the existing parser.
  // Validated label + value syntax is an identifier request. A label WORD with no valid value ("LEI Financial Group",
  // "NMLS Lending Corp") is not: it may still be a name, but only if the engine actually finds that institution.
  if (isIdentifierAttempt(raw ?? '')) return null; // genuine OR malformed identifier input: existing handling, catalog untouched
  const labelWordOnly = Boolean(parsed.identityRequest || parsed.identifier);
  if (parsed.evidenceFamilies?.length || parsed.mode === 'definition' || parsed.mode === 'evidence') return null;
  if (parsed.mode === 'fail_closed' && (parsed.failClosedKind === 'malformed' || parsed.failClosedKind === 'empty')) return null;

  const original = (raw ?? '').trim().replace(/\s+/g, ' ');
  const filters = overrideConditions(overrides);
  const decide = (name: string, basis: NativeNameDecision['basis'], conditions: string[]): NativeNameDecision => {
    const all = [...conditions];
    // Geography the parser resolved from the text but that is neither part of the name nor already listed.
    const state = parsed.geography?.state ? STATE_NAMES[parsed.geography.state] : null;
    const place = parsed.geography?.county ?? state;
    if (place && !name.toLowerCase().includes(place.toLowerCase()) && !all.some((c) => c.toLowerCase().includes(place.toLowerCase()))) all.push(`location: ${place}`);
    return { name, basis, unresolvedConditions: [...all, ...filters] };
  };

  // The parser itself extracted an institution name. Conditions come from the ORIGINAL text, not from the parser's name.
  if (parsed.mode === 'entity' && parsed.identityQuery && !labelWordOnly) {
    const residual = residualCondition(original, parsed.identityQuery);
    return decide(parsed.identityQuery, 'PARSER_ENTITY_NAME', residual ? [residual] : []);
  }

  const quoted = original.match(/^["“]([^"”]{2,120})["”]$/)?.[1]?.trim();
  if (quoted) return hasGenuineLabeledIdentifier(quoted) ? null : decide(quoted, 'QUOTED_NAME', []);

  let text = original.replace(LEAD_VERB, '').replace(/[.!\s]+$/, '').trim();
  if (text.length < 2 || text.length > 120 || text.includes('?') || text.split(' ').length > MAX_NAME_WORDS + 4) return null;

  const conditions: string[] = [];
  const split = text.match(LOCATIVE_SPLIT);
  if (split) {
    const left = probeEngine(split[1]!, catalog);
    const leftDistinctive = decisionDistinctive(split[1]!, { ...parsed, geography: undefined }).length > 0;
    // Only a name on the left makes this "<name> in <place>"; otherwise it is ordinary location research ("lenders in Texas").
    if (left === 'full_name' || ((left === 'candidates' || left === 'unavailable') && leftDistinctive)) { text = split[1]!.trim(); conditions.push(`${split[2]} ${split[3]}`); }
    else return null;
  }
  if (text.split(' ').length > MAX_NAME_WORDS) return null;

  const probe = probeEngine(text, catalog);
  const distinctive = decisionDistinctive(text, parsed).length > 0;
  const onlyReading = parsed.mode === 'fail_closed' && parsed.failClosedKind === 'unsupported';
  if (probe === 'full_name') return decide(text, 'FULL_SOURCE_NAME', conditions);
  if (probe === 'candidates' && distinctive) return decide(text, 'DISTINCTIVE_WORDS_NAME_AN_INSTITUTION', conditions);
  if (labelWordOnly) return null; // no institution carries these words: the existing identifier-input guidance applies
  // The source failed. An organization-shaped text is still a NAME request: it fails as SOURCE_UNAVAILABLE with
  // the name kept -- it is never quietly re-run as an unrelated cohort.
  if (probe === 'unavailable' && (distinctive || onlyReading)) return decide(text, 'NAME_SHAPED_SOURCE_UNAVAILABLE', conditions);
  // Nothing else understood the text: search it as a name; a miss keeps the name for refinement.
  if (onlyReading) return decide(text, 'ONLY_READING', conditions);
  return null;
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
  const conditionCaveats = decision.unresolvedConditions.map((value) => `NOT APPLIED: "${value}". Candidates are matched by name only. HMDA geography is the property location, not where a lender is located or licensed, so no institution location, loan type or action filter was inferred.`);

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
  const pageCount = Math.max(1, Math.ceil(result.reachable / result.limit)); // the SAME bounded window the network operation pages over
  const found = result.total > 0;
  return {
    query, interpretation,
    geographyWarning: 'Names are matched against institution source names. A similar name is not proof of the same institution.',
    headline: found
      ? `${result.total} institution ${result.total === 1 ? 'record' : 'records'} with a name like “${decision.name}”${result.exactNameAmbiguous ? ' — more than one institution carries this name' : ''}`
      : `No institution name matched “${decision.name}”`,
    body: found
      ? 'These are name candidates from published lender profiles and HMDA reporting institutions. Similarly named records are separate institutions unless an identifier says otherwise. Counts here are candidate records, not market activity.'
      : 'Your name was kept. Nothing matched within the searched sources: published lender profiles and HMDA reporting institutions. That is not a finding that no such institution exists. Check the spelling, try a shorter distinctive part of the name, or research a labeled NMLS or LEI.',
    rows, totalRows: result.total, page: result.page, pageSize: result.limit, pageCount, sharePath,
    nameCandidates: { suppliedName: decision.name, state: found ? (result.exactNameAmbiguous ? 'AMBIGUOUS_EXACT_NAME' : 'CANDIDATES') : 'NO_MATCH', total: result.total, unresolvedConditions: decision.unresolvedConditions, reachable: result.reachable, truncated: result.truncated },
    period: 'Committed identity files (no as-of date supplied by the source)', grain: 'lender institution name candidates',
    caveats: [...conditionCaveats,
      ...(result.truncated ? [`More than ${CANDIDATE_WINDOW} institutions matched. Only the ${CANDIDATE_WINDOW} strongest matches can be paged through; add a distinctive word to narrow the name. This list is not exhaustive.`] : []),
      ...(result.outOfRange ? ['This page is past the end of the reachable candidates. No records were repeated.'] : []),
      'A miss or a short list applies only to the searched sources (published lender profiles and HMDA reporting institutions). It is not a finding that no such institution exists.',
      'NMLS institution IDs, branch IDs, and person/MLO IDs are separate identity classes. People and branches are not searchable by name.'],
    trace: trace('Name predicate applied to the whole institution catalog before paging: exact/normalized, historical, legal-form and FCU search forms, then word-prefix and distinctive-word candidates.', [catalog.sourceVersion.profiles, 'lib/ask-lender/generated/gleif.json', 'lib/ask-lender/generated/mappings.csv.json']),
    elapsedMs: Date.now() - started,
  };
}
