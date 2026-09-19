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
