/**
 * Identifier namespaces. Values are never comparable across types.
 */

import type { IdentifierType } from './types';

export const IDENTIFIER_TYPES: readonly IdentifierType[] = [
  'NMLS_INSTITUTION',
  'NMLS_BRANCH',
  'NMLS_PERSON',
  'LEI',
  'FDIC_CERT',
  'NCUA_CHARTER',
  'RSSD',
  'FHA_ID',
  'HUD_ID',
  'SBA_ID',
  'STATE_LICENSE',
  'OTHER_AUTHORITATIVE',
] as const;

const NMLS_TYPES = new Set<IdentifierType>([
  'NMLS_INSTITUTION',
  'NMLS_BRANCH',
  'NMLS_PERSON',
]);

export function identifierKey(type: IdentifierType, value: string): string {
  return `${type}:${value}`;
}

export function normalizeNmlsValue(raw: string): string | null {
  const digits = (raw || '').replace(/\D/g, '');
  if (!/^\d{3,12}$/.test(digits) || /^0+$/.test(digits)) return null;
  return digits;
}

export function normalizeLeiValue(raw: string): string | null {
  const v = (raw || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{20}$/.test(v)) return null;
  return v;
}

export function normalizeNumericAgencyId(raw: string): string | null {
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits || /^0+$/.test(digits)) return null;
  return digits;
}

export class IdentifierNamespaceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IdentifierNamespaceError';
  }
}

/**
 * Refuse silent substitution across namespaces.
 * Branch/person NMLS must never be written as NMLS_INSTITUTION.
 */
export function assertIdentifierValue(type: IdentifierType, value: string): string {
  if (NMLS_TYPES.has(type)) {
    const n = normalizeNmlsValue(value);
    if (!n) {
      throw new IdentifierNamespaceError(`${type} requires 3-12 digit NMLS, got ${value}`);
    }
    return n;
  }
  if (type === 'LEI') {
    const lei = normalizeLeiValue(value);
    if (!lei) {
      throw new IdentifierNamespaceError(`LEI requires 20-char ISO 17442 value, got ${value}`);
    }
    return lei;
  }
  if (type === 'FDIC_CERT' || type === 'NCUA_CHARTER' || type === 'RSSD') {
    const n = normalizeNumericAgencyId(value);
    if (!n) {
      throw new IdentifierNamespaceError(`${type} requires a numeric value, got ${value}`);
    }
    return n;
  }
  const v = (value || '').trim();
  if (!v) throw new IdentifierNamespaceError(`${type} value is empty`);
  return v;
}

export function refuseCrossNamespaceWrite(opts: {
  intendedType: IdentifierType;
  candidateType: IdentifierType;
  value: string;
}): void {
  if (opts.intendedType === opts.candidateType) return;
  throw new IdentifierNamespaceError(
    `Refused to write ${opts.value} as ${opts.intendedType}; classified as ${opts.candidateType}`
  );
}

export function nmlsTypeForSlot(
  slot: 'CONFIRMED_INSTITUTION_NMLS' | 'LIKELY_BRANCH_NMLS' | 'LIKELY_PERSON_OR_TEAM_NMLS'
): IdentifierType {
  if (slot === 'LIKELY_BRANCH_NMLS') return 'NMLS_BRANCH';
  if (slot === 'LIKELY_PERSON_OR_TEAM_NMLS') return 'NMLS_PERSON';
  return 'NMLS_INSTITUTION';
}
