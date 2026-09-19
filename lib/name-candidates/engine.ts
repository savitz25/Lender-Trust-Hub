/**
 * TH-SEARCH-R1-019C: the ONE Lender-owned institution name-candidate engine.
 *
 * Used by BOTH the native Ask name flow and the network candidate operation, so matching rules and
 * eligible scope cannot diverge. It returns CANDIDATES -- never a verified identity, never evidence.
 * Complaint/status attachment keeps its own exact matcher and accepted bridges; nothing in this
 * module is imported by that path.
 *
 * Pure: the catalog is an argument. The name predicate is applied to the WHOLE catalog before any
 * limit or page is taken; a miss returns nothing (never an unfiltered directory).
 */
import { candidateTokens, distinctiveTokens, expandSearchAbbreviations, normalizeCandidateName, stripTerminalLegalSuffix } from './normalize';

export type CandidateNameField = 'canonical_name' | 'presentation_name' | 'historical_name' | 'hmda_reporter_name' | 'derived_slug_form';

export type CatalogName = {
  value: string;
  field: CandidateNameField;
  /** Human label of where this exact text comes from. */
  sourceLabel: string;
};

export type PublicationState = 'public_profile' | 'unpublished_research_identity' | 'identity_hold';

export type CatalogInstitution = {
  /** Stable, verified institution key. Distinct keys are NEVER merged on name similarity. */
  institutionKey: string;
  displayName: string;
  entityType: string;
  names: CatalogName[];
  nmls: string | null;
  lei: string | null;
  publicationState: PublicationState;
  /** Existing profile path, or null. Never constructed for a record that has no profile. */
  profilePath: string | null;
  sourceReference: string;
};

/** Strongest first. `rank` orders results; it is relevance to the TEXT, not a quality ranking of lenders. */
export const MATCH_METHODS = {
  EXACT_NORMALIZED_NAME: { rank: 1, explanation: 'The entered name equals this source name after case, spacing and punctuation normalization.' },
  DOCUMENTED_HISTORICAL_NAME: { rank: 2, explanation: 'The entered name equals a historical name recorded in the source for this institution.' },
  LEGAL_SUFFIX_NORMALIZED: { rank: 3, explanation: 'The names are equal once a terminal legal-form word (LLC, Inc., N.A. ...) is ignored.' },
  ABBREVIATION_NORMALIZED: { rank: 3, explanation: 'The names are equal under a search-form rule (FCU = Federal Credit Union). This is not a documented legal alias.' },
  DERIVED_SLUG_FORM: { rank: 4, explanation: "The entered name equals a search form derived from this profile's URL slug. This is not an official alias." },
  WORD_PREFIX: { rank: 5, explanation: 'The source name begins with the entered words.' },
  DISTINCTIVE_TOKENS: { rank: 6, explanation: 'Every distinctive word entered appears as a whole word in this source name.' },
} as const;

export type MatchMethod = keyof typeof MATCH_METHODS;

export type NameCandidate = {
  institution: CatalogInstitution;
  method: MatchMethod;
  rank: number;
  matchedName: CatalogName;
  explanation: string;
};

export type CandidateSearchResult = {
  suppliedName: string;
  normalizedName: string;
  /** False only when the input was unusable; a usable input ALWAYS filters the catalog. */
  predicateApplied: boolean;
  candidates: NameCandidate[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  /** More than one DISTINCT institution key matched at full-name strength. */
  exactNameAmbiguous: boolean;
  catalogSize: number;
};

export const CANDIDATE_DEFAULT_LIMIT = 10;
export const CANDIDATE_MAX_LIMIT = 25;
export const CANDIDATE_MAX_PAGE = 40;
export const CANDIDATE_NAME_MAX_LENGTH = 120;
const MIN_PARTIAL_TOKEN = 3;

type Prepared = { tokens: string[]; stripped: string[]; expanded: string[]; expandedStripped: string[] };
function prepare(raw: string): Prepared {
  const tokens = candidateTokens(raw);
  const expanded = expandSearchAbbreviations(tokens).tokens;
  return { tokens, stripped: stripTerminalLegalSuffix(tokens), expanded, expandedStripped: stripTerminalLegalSuffix(expanded) };
}
const same = (a: readonly string[], b: readonly string[]) => a.length > 0 && a.length === b.length && a.every((token, i) => token === b[i]);

function matchOneName(query: Prepared, name: CatalogName): MatchMethod | null {
  const source = prepare(name.value);
  if (!source.tokens.length) return null;
  if (same(query.tokens, source.tokens)) return name.field === 'historical_name' ? 'DOCUMENTED_HISTORICAL_NAME' : name.field === 'derived_slug_form' ? 'DERIVED_SLUG_FORM' : 'EXACT_NORMALIZED_NAME';
  // A derived slug form is only ever an exact search form; it never drives partial candidates.
  if (name.field === 'derived_slug_form') return null;
  if (same(query.stripped, source.stripped)) return 'LEGAL_SUFFIX_NORMALIZED';
  if (same(query.expandedStripped, source.expandedStripped)) return 'ABBREVIATION_NORMALIZED';

  // Partial candidates need a distinctive word: "Bank" or "Mortgage LLC" alone never lists a directory.
  const distinctive = distinctiveTokens(query.expandedStripped);
  if (!distinctive.length) return null;
  const q = query.expandedStripped; const s = source.expanded;
  if (q.length <= s.length) {
    const lead = q.slice(0, -1); const last = q[q.length - 1]!;
    const leadOk = lead.every((token, i) => token === s[i]);
    const tail = s[q.length - 1]!;
    if (leadOk && (tail === last || (last.length >= MIN_PARTIAL_TOKEN && tail.startsWith(last)))) return 'WORD_PREFIX';
  }
  const words = new Set(s);
  if (distinctive.every((token) => words.has(token))) return 'DISTINCTIVE_TOKENS';
  return null;
}

/** Best (strongest) match of one institution against the supplied name, across all its source names. */
function matchInstitution(query: Prepared, institution: CatalogInstitution): { method: MatchMethod; name: CatalogName } | null {
  let best: { method: MatchMethod; name: CatalogName } | null = null;
  for (const name of institution.names) {
    const method = matchOneName(query, name);
    if (method && (!best || MATCH_METHODS[method].rank < MATCH_METHODS[best.method].rank)) best = { method, name };
  }
  return best;
}

/** Shared generic-word overlap: a secondary, text-only tie-break inside one rank. */
function overlap(query: Prepared, name: CatalogName): number {
  const words = new Set(candidateTokens(name.value));
  return query.tokens.filter((token) => words.has(token)).length;
}

export function searchNameCandidates(
  catalog: readonly CatalogInstitution[],
  rawName: string,
  options: { page?: number; limit?: number } = {},
): CandidateSearchResult {
  const suppliedName = (rawName ?? '').trim();
  const limit = Math.min(Math.max(1, Math.trunc(options.limit ?? CANDIDATE_DEFAULT_LIMIT)), CANDIDATE_MAX_LIMIT);
  const page = Math.min(Math.max(1, Math.trunc(options.page ?? 1)), CANDIDATE_MAX_PAGE);
  const normalizedName = normalizeCandidateName(suppliedName);
  const empty = { suppliedName, normalizedName, candidates: [], total: 0, page, limit, hasMore: false, exactNameAmbiguous: false, catalogSize: catalog.length };
  if (!normalizedName || suppliedName.length > CANDIDATE_NAME_MAX_LENGTH) return { ...empty, predicateApplied: false };

  const query = prepare(suppliedName);
  const seen = new Set<string>();
  const all: NameCandidate[] = [];
  for (const institution of catalog) {
    // Deduplicate ONLY on the verified institution key.
    if (seen.has(institution.institutionKey)) continue;
    const hit = matchInstitution(query, institution);
    if (!hit) continue;
    seen.add(institution.institutionKey);
    all.push({ institution, method: hit.method, rank: MATCH_METHODS[hit.method].rank, matchedName: hit.name, explanation: MATCH_METHODS[hit.method].explanation });
  }
  all.sort((a, b) =>
    a.rank - b.rank
    || overlap(query, b.matchedName) - overlap(query, a.matchedName)
    || a.institution.displayName.localeCompare(b.institution.displayName, 'en')
    || a.institution.institutionKey.localeCompare(b.institution.institutionKey, 'en'));

  const start = (page - 1) * limit;
  const fullNameKeys = new Set(all.filter((c) => c.rank <= 3).map((c) => c.institution.institutionKey));
  return {
    suppliedName, normalizedName, predicateApplied: true,
    candidates: all.slice(start, start + limit),
    total: all.length, page, limit, hasMore: start + limit < all.length,
    exactNameAmbiguous: fullNameKeys.size > 1,
    catalogSize: catalog.length,
  };
}
