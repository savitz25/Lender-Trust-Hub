// TH-ARCH-P0-002: identity-execution.ts is the real network-facing identity executor bound to
// POST /api/specialist-execution/v2 (via executeSpecialistV2Request -> executeIdentityOrEvidence)
// for any request carrying an identifier, an identity name, or CFPB evidence request. Phase 1
// inventory found this module -- the actual capability LEND-CAP-002 shipped -- had zero direct
// regression coverage of its own; the R1/R3/R4/R15 suites cover a separate identity mechanism
// (ask-lender/identifier.ts + identity-lookup.ts) that backs this repo's own /ask UI, not the
// network contract. This file closes that gap and locks in "NMLS/LEI network execution truth" per
// ticket section 26.
import assert from 'node:assert/strict';
import test from 'node:test';
import { executeIdentityOrEvidence as executeIdentityOrEvidenceRaw, type IdentityExecutionDependencies, type IdentityExecutionRequest } from './identity-execution';
import type { ExactIdentityRecord, ExactIdentityStore } from './identity-store';
import { SEARCH_POOL, type DiscoveryRecord } from '../national-profile/discovery';

type IdentityResultBody = {
  resultState: string;
  total: number;
  limitations: string[];
  identity?: { entityClass?: string; nmls?: string | null; lei?: string | null; currentStatus?: string | null } | null;
};
async function executeIdentityOrEvidence(input: IdentityExecutionRequest, dependencies?: IdentityExecutionDependencies): Promise<{ status: number; body: IdentityResultBody }> {
  return executeIdentityOrEvidenceRaw(input, dependencies) as unknown as Promise<{ status: number; body: IdentityResultBody }>;
}

const template = SEARCH_POOL.find((row) => row.nmls === '3030')!;
function publicRecord(nmls: string, lei: string | null = null): DiscoveryRecord {
  return { ...template, institution_id: `fixture-${nmls}`, stable_key: `nmls-inst:${nmls}`, slug: `fixture-${nmls}`, nmls, lei, canonical_name: `Fixture Institution ${nmls}`, display_name: `Fixture Institution ${nmls}`, historical_names: [] };
}

function storeReturning(records: ExactIdentityRecord[]): ExactIdentityStore {
  return {
    lookupNmls: async () => records,
    lookupLei: async () => records,
  };
}

const institutionRecord = (overrides: Partial<ExactIdentityRecord> = {}): ExactIdentityRecord => ({
  entityId: 'entity-3030', identifierType: 'NMLS_INSTITUTION', identifierValue: '3030', entityKind: 'institution',
  legalName: 'Fixture Institution 3030 LLC', displayName: 'Fixture Institution 3030', currentStatus: 'active',
  publicProjectionStatus: 'projected', reviewStatus: 'accepted', sourceDataset: 'nmls-2025', observedAt: '2026-09-01',
  relatedNmls: '3030', relatedLei: null, ...overrides,
});

test('ARCH-P0-002: exact NMLS institution match resolves to EXACT_IDENTITY with real data, not fabricated', async () => {
  // institutionRecord()'s default relatedNmls ('3030') matches a real existing SEARCH_POOL entry
  // (the same fixture the R1 suites use), so publicRecordFor() resolves a genuine public
  // destination without needing to mock the module-level SEARCH_POOL constant.
  const store = storeReturning([institutionRecord()]);
  const result = await executeIdentityOrEvidence({ identifier: { type: 'NMLS', value: '3030' } }, { store });
  assert.equal(result.body.resultState, 'EXACT_IDENTITY');
  assert.equal(result.body.identity?.nmls, '3030');
  assert.equal(result.body.identity?.currentStatus, 'active');
  assert.equal(result.body.total, 1);
});

test('ARCH-P0-002: no exact match is NO_CONFIDENT_MATCH, never a fuzzy substitute or a false zero', async () => {
  const store = storeReturning([]);
  const result = await executeIdentityOrEvidence({ identifier: { type: 'NMLS', value: '9999999' } }, { store });
  assert.equal(result.body.resultState, 'NO_CONFIDENT_MATCH');
  assert.notEqual(result.body.resultState, 'ZERO_MATCHING_ROWS');
  assert.equal(result.body.total, 0);
  assert.match(result.body.limitations[0] ?? '', /not a fuzzy name result/i);
});

test('ARCH-P0-002: branch-grain NMLS is restricted, never silently substituted with the parent institution', async () => {
  const store = storeReturning([institutionRecord({ identifierType: 'NMLS_BRANCH', entityKind: 'branch', relatedNmls: null })]);
  const result = await executeIdentityOrEvidence({ identifier: { type: 'NMLS', value: '1001618' } }, { store });
  assert.equal(result.body.resultState, 'PUBLICATION_RESTRICTED');
  assert.equal(result.body.identity?.entityClass, 'branch');
  assert.notEqual(result.body.identity?.entityClass, 'institution');
});

test('ARCH-P0-002: person/MLO-grain NMLS is restricted, never returns name or contact data', async () => {
  const store = storeReturning([institutionRecord({ identifierType: 'NMLS_PERSON', entityKind: 'person_mlo', relatedNmls: null, legalName: 'A Real Person Name' })]);
  const result = await executeIdentityOrEvidence({ identifier: { type: 'NMLS', value: '1005784' } }, { store });
  assert.equal(result.body.resultState, 'PUBLICATION_RESTRICTED');
  assert.equal(result.body.identity?.entityClass, 'person_mlo');
  assert.equal(JSON.stringify(result.body).includes('A Real Person Name'), false, 'the person legal name must never leak into the response');
});

test('ARCH-P0-002: an identifier value spanning multiple incompatible identity classes is an IDENTITY_COLLISION, not an arbitrary pick', async () => {
  const store = storeReturning([
    institutionRecord({ entityId: 'entity-a', identifierType: 'NMLS_INSTITUTION' }),
    institutionRecord({ entityId: 'entity-b', identifierType: 'NMLS_BRANCH' }),
  ]);
  const result = await executeIdentityOrEvidence({ identifier: { type: 'NMLS', value: '5555555' } }, { store });
  assert.equal(result.body.resultState, 'IDENTITY_COLLISION');
});

test('ARCH-P0-002: an exact-identity store failure is BACKEND_UNAVAILABLE, never a false zero or fuzzy fallback', async () => {
  const store: ExactIdentityStore = {
    lookupNmls: async () => { throw new Error('connection refused'); },
    lookupLei: async () => { throw new Error('connection refused'); },
  };
  const result = await executeIdentityOrEvidence({ identifier: { type: 'NMLS', value: '3030' } }, { store });
  assert.equal(result.body.resultState, 'BACKEND_UNAVAILABLE');
  assert.notEqual(result.body.resultState, 'NO_CONFIDENT_MATCH');
  assert.equal(result.body.total, 0);
});

test('ARCH-P0-002: malformed NMLS/LEI values are rejected as invalid, never coerced into a lookup', async () => {
  const store = storeReturning([institutionRecord()]);
  const bareLabel = await executeIdentityOrEvidence({ identifier: { type: 'NMLS', value: '' } }, { store });
  assert.equal(bareLabel.body.resultState, 'INVALID_QUERY');
  const tooShort = await executeIdentityOrEvidence({ identifier: { type: 'NMLS', value: '12' } }, { store });
  assert.equal(tooShort.body.resultState, 'INVALID_QUERY');
  const badLei = await executeIdentityOrEvidence({ identifier: { type: 'LEI', value: 'TOOSHORT' } }, { store });
  assert.equal(badLei.body.resultState, 'INVALID_QUERY');
});

test('ARCH-P0-002: named identity lookup distinguishes exact match, no match, and ambiguous match', async () => {
  const exactPool = [publicRecord('3030')];
  const exact = await executeIdentityOrEvidence({ queryType: 'identity', identityName: 'Fixture Institution 3030' }, { store: storeReturning([]), nameMatches: () => exactPool });
  assert.equal(exact.body.resultState, 'EXACT_IDENTITY');
  assert.equal(exact.body.identity?.nmls, '3030');

  const none = await executeIdentityOrEvidence({ queryType: 'identity', identityName: 'No Such Lender Anywhere' }, { store: storeReturning([]), nameMatches: () => [] });
  assert.equal(none.body.resultState, 'NO_CONFIDENT_MATCH');

  const ambiguous = await executeIdentityOrEvidence({ queryType: 'identity', identityName: 'Ambiguous Name' }, { store: storeReturning([]), nameMatches: () => [publicRecord('1111'), publicRecord('2222')] });
  assert.equal(ambiguous.body.resultState, 'AMBIGUOUS_IDENTITIES');
});
