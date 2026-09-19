/**
 * TH-SEARCH-R1-019C: what makes a supplied text an IDENTIFIER request rather than a name.
 *
 * Only validated label + value syntax counts (the existing parseIdentityRequest contract): "NMLS 3030",
 * "LEI 549300FGXN1K3HLB1R50". A word alone never does -- "Charter Bank", "Branch River Bank",
 * "LEI Financial Group", a 20-letter company name and bare digits are all searched as names. The
 * institution / person / branch boundary is enforced by the catalog projection (institutions only),
 * not by guessing from vocabulary.
 */
import { parseIdentityRequest } from '@/lib/ask-lender/identifier';

export function hasGenuineLabeledIdentifier(text: string): boolean {
  const request = parseIdentityRequest(text);
  if (!request) return false;
  return request.identifiers.some((id) => (id.type === 'LEI'
    ? /^[A-Z0-9]{20}$/.test(id.value) && /[0-9]/.test(id.value)
    : /^[0-9]{2,12}$/.test(id.value)));
}

/**
 * A label followed by something numeric or signed ("NMLS 32.51", "NMLS -3251", "NMLS 3e3") is a MALFORMED
 * IDENTIFIER ATTEMPT: it keeps the existing identifier-input handling and never touches the name catalog.
 * A label word followed only by words ("LEI Financial Group", "NMLS Lending Corp") is not an attempt.
 */
export function isIdentifierAttempt(text: string): boolean {
  const request = parseIdentityRequest(text);
  if (!request) return false;
  if (request.identifiers.some((id) => /[0-9]/.test(id.value))) return true;
  return request.identifiers.length === 0 && request.problem?.state === 'INVALID';
}
