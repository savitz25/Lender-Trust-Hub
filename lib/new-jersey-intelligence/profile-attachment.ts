import exactIndex from './exact-attachment-index.json';

export type NjAttachmentDecision =
  | { status: 'EXACT'; identifierType: 'NMLS_INSTITUTION' | 'FDIC_CERT' | 'NJ_STATE_REFERENCE'; identifierValue: string }
  | { status: 'WITHHELD'; reason: string }
  | { status: 'NONE' };

const NMLS = new Set(exactIndex.nmls_institution);
const FDIC = new Set(exactIndex.fdic_cert);
const REFS = new Set(exactIndex.nj_state_reference);

export function attachNjProfileEvidence(input: {
  nmlsInstitutionId?: string | null;
  fdicCert?: string | null;
  njStateReference?: string | null;
  isIndividual?: boolean;
  matchStatus?: string | null;
}): NjAttachmentDecision {
  if (input.isIndividual) {
    return { status: 'WITHHELD', reason: 'Individual evidence is not copied onto a company profile.' };
  }
  const match = (input.matchStatus || '').toUpperCase();
  if (match === 'REVIEW_REQUIRED' || match === 'UNRESOLVED' || match === 'UNSAFE_REJECTED') {
    return { status: 'WITHHELD', reason: 'Review-required, unresolved, and name-only matches are not attached.' };
  }
  const nmls = (input.nmlsInstitutionId || '').trim();
  if (nmls && NMLS.has(nmls)) {
    return { status: 'EXACT', identifierType: 'NMLS_INSTITUTION', identifierValue: nmls };
  }
  const fdic = (input.fdicCert || '').trim();
  if (fdic && FDIC.has(fdic)) {
    return { status: 'EXACT', identifierType: 'FDIC_CERT', identifierValue: fdic };
  }
  const ref = (input.njStateReference || '').trim();
  if (ref && REFS.has(ref)) {
    return { status: 'EXACT', identifierType: 'NJ_STATE_REFERENCE', identifierValue: ref };
  }
  return { status: 'NONE' };
}
