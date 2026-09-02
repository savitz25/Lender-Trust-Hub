import { createHash } from 'node:crypto';

export const SPECIALIST_CONTRACT = 'trusthub-specialist-execution-v2' as const;
export const SPECIALIST_CONTRACT_VERSION = '2.1.0' as const;

const schema = {
  request: ['contract', 'queryType', 'entityClass', 'geography', 'action', 'loanType', 'loanPurpose', 'requestedMetric', 'identifier', 'identityName', 'requestedEvidence', 'page', 'limit'],
  response: ['contract', 'contractVersion', 'schemaFingerprint', 'contractFingerprint', 'queryInterpretation', 'appliedFilters', 'resultState', 'identity', 'evidenceState', 'rows', 'total', 'pagination', 'availableRefinements', 'provenance', 'limitations', 'destinations', 'diagnostics'],
  resultStates: ['SUPPORTED_RESULTS', 'ZERO_MATCHING_ROWS', 'CLARIFICATION_REQUIRED', 'UNSUPPORTED_CAPABILITY', 'PUBLICATION_RESTRICTED', 'INVALID_QUERY', 'BACKEND_UNAVAILABLE', 'TIMEOUT', 'NO_CONFIDENT_MATCH', 'AMBIGUOUS_IDENTITIES', 'IDENTITY_COLLISION', 'EXACT_IDENTITY'],
} as const;

function fingerprint(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export const SPECIALIST_SCHEMA_FINGERPRINT = fingerprint(schema);
export const SPECIALIST_CONTRACT_FINGERPRINT = fingerprint({
  contract: SPECIALIST_CONTRACT,
  version: SPECIALIST_CONTRACT_VERSION,
  schema,
  semantics: 'HMDA 2025 property-market LEI grain plus exact NMLS/LEI and exact/DBA-bound CFPB evidence; no fuzzy attachment or publication expansion',
});

export type SpecialistResultState =
  | 'SUPPORTED_RESULTS'
  | 'ZERO_MATCHING_ROWS'
  | 'CLARIFICATION_REQUIRED'
  | 'UNSUPPORTED_CAPABILITY'
  | 'PUBLICATION_RESTRICTED'
  | 'INVALID_QUERY'
  | 'BACKEND_UNAVAILABLE'
  | 'TIMEOUT'
  | 'NO_CONFIDENT_MATCH'
  | 'AMBIGUOUS_IDENTITIES'
  | 'IDENTITY_COLLISION'
  | 'EXACT_IDENTITY';
