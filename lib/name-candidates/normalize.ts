/**
 * TH-SEARCH-R1-019C: name normalization for CANDIDATE discovery only.
 *
 * Nothing here is an identity or evidence rule. Exact institution resolution and complaint
 * attachment keep their own exact matcher (lib/specialist-execution/identity-execution.ts).
 * Pure module: no source, network or framework import.
 */

/** Case / spacing / punctuation. Apostrophes join ("O'Neil" -> "oneil"); hyphens and other marks separate. Digits are kept. */
export function normalizeCandidateName(raw: string): string {
  return (raw ?? '')
    .toLowerCase()
    .replace(/[‘’']/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function candidateTokens(raw: string): string[] {
  const normalized = normalizeCandidateName(raw);
  return normalized ? normalized.split(' ') : [];
}

/** TERMINAL legal-form words. Removed only from the END of a name, never from the middle. */
const LEGAL_SUFFIX_SEQUENCES: string[][] = [
  ['national', 'association'], ['n', 'a'], ['l', 'l', 'c'], ['l', 'p'], ['l', 'l', 'p'],
  ['llc'], ['inc'], ['incorporated'], ['corp'], ['corporation'], ['lp'], ['llp'], ['ltd'], ['limited'], ['pllc'], ['na'], ['fsb'], ['ssb'], ['co'], ['company'],
];

export function stripTerminalLegalSuffix(tokens: readonly string[]): string[] {
  let out = [...tokens];
  for (let pass = 0; pass < 2; pass++) {
    const hit = LEGAL_SUFFIX_SEQUENCES.find((seq) => out.length > seq.length && seq.every((word, i) => out[out.length - seq.length + i] === word));
    if (!hit) break;
    out = out.slice(0, out.length - hit.length);
  }
  return out;
}

/**
 * Search-form equivalences. "FCU" and "Federal Credit Union" are the same SEARCH form; this is a
 * tested normalization rule, not a documented legal alias and never evidence of identity.
 */
const ABBREVIATION_EXPANSIONS: Array<{ short: string[]; long: string[] }> = [
  { short: ['fcu'], long: ['federal', 'credit', 'union'] },
  { short: ['f', 'c', 'u'], long: ['federal', 'credit', 'union'] },
];

export function expandSearchAbbreviations(tokens: readonly string[]): { tokens: string[]; expanded: boolean } {
  const out: string[] = []; let expanded = false;
  for (let i = 0; i < tokens.length; i++) {
    const rule = ABBREVIATION_EXPANSIONS.find((r) => r.short.every((word, k) => tokens[i + k] === word));
    if (rule) { out.push(...rule.long); i += rule.short.length - 1; expanded = true; } else out.push(tokens[i]!);
  }
  return { tokens: out, expanded };
}

/**
 * Words that cannot, alone, distinguish one lender from another. They are KEPT inside names (a full
 * name made only of these words still matches its exact source record); they are only prevented
 * from driving partial/token candidates, so "Mortgage" or "Bank" never returns a directory.
 */
export const GENERIC_NAME_TOKENS: ReadonlySet<string> = new Set([
  'bank', 'banks', 'banking', 'bancorp', 'mortgage', 'mortgages', 'credit', 'union', 'federal', 'national', 'association', 'financial', 'finance',
  'lending', 'lender', 'lenders', 'loan', 'loans', 'home', 'homes', 'funding', 'capital', 'company', 'companies', 'co', 'corp', 'corporation', 'inc',
  'incorporated', 'llc', 'lp', 'llp', 'ltd', 'limited', 'pllc', 'na', 'fsb', 'ssb', 'services', 'service', 'servicing', 'group', 'trust', 'savings',
  'the', 'of', 'and', 'a', 'an', 'for', 'fcu', 'cu',
]);

export function distinctiveTokens(tokens: readonly string[]): string[] {
  return tokens.filter((token) => !GENERIC_NAME_TOKENS.has(token));
}
