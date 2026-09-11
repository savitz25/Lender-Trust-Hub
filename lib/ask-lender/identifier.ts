import type { IdentityRequest, IdentifierSpan } from './types';

/** Existing Ask corpus input contract: NMLS 2–12 decimal digits; LEI 20 alphanumerics.
 * These bounds are product support, not a claim about every number assigned by NMLS.
 * Formatting-only grouping: a 1–4 digit first group and 2–3 digit subsequent groups.
 * A four-digit trailing year is ambiguous. Never choose grouping by database hits.
 */
export function parseIdentityRequest(raw: string): IdentityRequest | undefined {
  const labels = [...raw.matchAll(/\b(nmls(?:\s+(?:institution|company|organization|branch|person|individual))?(?:\s+id)?|lei(?:\s+id)?)\b\s*[:#]?\s*/gi)];
  if (!labels.length) return undefined;
  if (/^\s*(?:what is|how do i (?:check|verify))\b/i.test(raw) && !/\d/.test(raw)) return undefined;
  const requestedClass = /\b(?:persons?|people|individuals?|mlos?|loan officers?|mortgage loan originators?)\b/i.test(raw)
    ? 'person' : /\bbranch(?:es)?\b/i.test(raw) ? 'branch' : /\b(?:institution|company|organization)\b/i.test(raw) ? 'institution' : 'unknown';
  const result: IdentityRequest = { rawQuestion: raw, families: [...new Set(labels.map(label => /^lei/i.test(label[1]) ? 'LEI' as const : 'NMLS_INSTITUTION' as const))], identifiers: [], requestedClass, remainingText: raw };
  for (const label of labels) {
    const type = /^lei/i.test(label[1]) ? 'LEI' : 'NMLS_INSTITUTION';
    const start = label.index!;
    const valueStart = start + label[0].length;
    const rest = raw.slice(valueStart);
    const found = type === 'LEI' ? rest.match(/^([a-z0-9]+)/i) : rest.match(/^(\d+(?:\s+\d+)*)/);
    if (!found) {
      result.problem = /^[+\-.]\s*\d/.test(rest) ? { state: 'INVALID', message: 'Use an identifier string without a sign or decimal point.' } : { state: 'IDENTIFIER_REQUIRED', message: `Enter a complete ${type === 'LEI' ? 'LEI' : 'NMLS'} identifier.` };
      continue;
    }
    const token = found[1];
    const value = type === 'LEI' ? token.toUpperCase() : token.replace(/\s/g, '');
    const tail = rest.slice(token.length);
    const span: IdentifierSpan = { type, value, rawSpan: raw.slice(start, valueStart + token.length), start, end: valueStart + token.length, normalization: [] };
    if (type === 'LEI' && value !== token) span.normalization.push('LEI letter case normalized to uppercase');
    if (type === 'NMLS_INSTITUTION' && value !== token) span.normalization.push('Whitespace removed within the explicitly labeled NMLS span');
    result.identifiers.push(span);
    if ((type === 'LEI' ? !/^[A-Z0-9]{20}$/.test(value) : !/^\d{2,12}$/.test(value)) || /^[a-z0-9]|^\s*\.\s*\d|^[.\-]\d/i.test(tail)) {
      result.problem = { state: 'INVALID', message: 'Use the complete supported identifier without decimals, exponents, or a partial number.' };
    } else if (type === 'NMLS_INSTITUTION' && (/^0/.test(value) || /\s/.test(token) && !/^\d{1,4}(?:\s+\d{2,3})+$/.test(token))) {
      result.problem = { state: 'NEEDS_CLARIFICATION', message: 'Confirm the exact identifier without ambiguous numeric groups or leading-zero transformations.' };
    } else if (/^\s*(?:[,/;:+&-]|and\b|or\b)\s*\d/i.test(tail)) {
      result.problem = { state: 'NEEDS_CLARIFICATION', message: 'Separate numbers are ambiguous. Enter one complete identifier, or a labeled NMLS and LEI pair.' };
    }
  }
  for (const type of ['NMLS_INSTITUTION', 'LEI']) {
    if (result.identifiers.filter(id => id.type === type).length > 1) result.problem = { state: 'NEEDS_CLARIFICATION', message: 'Enter one identifier per family. Multiple institutions are not silently combined.' };
  }
  for (const id of [...result.identifiers].reverse()) result.remainingText = result.remainingText.slice(0, id.start) + ' ' + result.remainingText.slice(id.end);
  result.remainingText = result.remainingText.replace(/\b(?:find|lookup|look up|search for|research|please|and)\b/gi, ' ').replace(/^[\s,;:?]+|[\s,;:?]+$/g, '').replace(/\s+/g, ' ').trim();
  if (requestedClass === 'person' || requestedClass === 'branch') result.problem = { state: 'UNSUPPORTED', message: 'This search covers published lender institutions. Person/MLO and branch requests must be verified separately in NMLS Consumer Access.' };
  return result;
}
