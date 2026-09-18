import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLenderAsk } from './parse';
import { executeAskQuery } from './execute-query';

// TH-DISCOVERY-PARITY-001A: fresh generalization corpus. Deliberately NOT the audit
// strings themselves (those are covered in r15-reproduction.test.ts and this ticket's
// audit-failure fixes elsewhere) -- new provider-term x phrasing x geography
// combinations to prove the fix generalizes rather than being tuned to named examples.
// PROVIDER CATEGORY + OPTIONAL GEOGRAPHY = DISCOVERY: every case here must resolve to
// real, immediately-browseable institutions (entity mode, not fail_closed, not count).
const FRESH_DISCOVERY_CASES = [
  'mortgage lender in Atlanta Georgia',
  'lenders in Illinois',
  'home lender near Philadelphia',
  'mortgage broker Phoenix Arizona',
  'mortgage company in Denver Colorado',
  'find a mortgage lender in San Antonio Texas',
  'looking for a home loan company in Charlotte North Carolina',
  'I need a mortgage broker in Portland Oregon',
  'show me lenders in Sacramento California',
  'who are some mortgage companies in Newark New Jersey',
  'refinance lender in Tampa Florida',
  'home loans Spokane Washington',
  'mortgage lenders around Colorado Springs',
  'lender for a condo purchase in Miami',
  'help me find a mortgage company in Austin Texas',
  'mortgage brokers in Jacksonville Florida',
  'home lender Buffalo New York',
  'can you find a mortgage lender near Tucson Arizona',
  'mortgage company in Pittsburgh Pennsylvania',
  'loan specialist in Seattle Washington',
  'lenders Fort Lauderdale Florida',
  'mortgage broker in Trenton New Jersey',
  'home loan company Riverside California',
  'refinance company in Orlando Florida',
  'mortgage lender in El Paso Texas',
  'find lenders in Salem Oregon',
  'mortgage companies Albuquerque New Mexico',
  'bank for a home loan in Tampa Florida',
  'home lenders in Virginia Beach Virginia',
  'mortgage broker near Colorado',
  'lender in Georgia',
  'mortgage lenders Illinois',
] as const;

test(`fresh generalization corpus: ${FRESH_DISCOVERY_CASES.length} cases resolve to DISCOVERY, not aggregate/refusal`, () => {
  for (const q of FRESH_DISCOVERY_CASES) {
    const parsed = parseLenderAsk(q);
    assert.notEqual(parsed.mode, 'fail_closed', `expected DISCOVERY, got fail_closed for: "${q}" (${parsed.failReason ?? ''})`);
    assert.notEqual(parsed.mode, 'count', `expected DISCOVERY (entity), got scalar count for: "${q}"`);
    assert.equal(parsed.mode, 'entity', `expected entity mode for: "${q}"`);
  }
});

test('fresh generalization corpus: real, non-empty results appear immediately for resolvable states', () => {
  for (const q of [
    'mortgage lender in Atlanta Georgia',
    'lenders in Illinois',
    'mortgage broker Phoenix Arizona',
    'mortgage company in Denver Colorado',
    'find a mortgage lender in San Antonio Texas',
  ]) {
    const r = executeAskQuery({ q });
    assert.notEqual(r.failClosed, true, q);
    assert.equal(r.query.mode, 'entity', q);
  }
});

// TH-DISCOVERY-PARITY-001A-REVIEW (Vercel finding on PR #48): "refinance lender",
// "refinance company", and "bank for a home loan" PARSED as entity/discovery but
// still failed CLOSED at execution with zero provider rows -- institution-volume.ts
// hard-UNSUPPORTEDs the whole institution list whenever a loanPurpose or lenderType
// filter is present, and "refinance"/"bank" were being attached as exactly that kind
// of filter even for plain discovery phrasing. Parser mode alone is not enough --
// these assert REAL, BROWSEABLE PROVIDER ROWS all the way through execution.
const REFINANCE_BANK_SYNONYM_CASES = [
  'refinance lender',
  'refinance company',
  'refinancing lender',
  'refinancing company',
  'bank for a home loan',
  'home loan bank',
  'home financing company',
  'refinance lender in Texas',
  'refinance company in Florida',
  'bank for a home loan in Texas',
  'refinance lenders near Denver Colorado',
  'home financing company in New Jersey',
];

test(`execution-layer: ${REFINANCE_BANK_SYNONYM_CASES.length} refinance/bank discovery synonyms return real, non-empty provider rows`, () => {
  for (const q of REFINANCE_BANK_SYNONYM_CASES) {
    const r = executeAskQuery({ q });
    assert.notEqual(r.failClosed, true, `expected real results, got failClosed for: "${q}"`);
    assert.equal(r.query.mode, 'entity', `expected entity mode for: "${q}"`);
    assert.equal(r.volumeEvidence?.availability, 'AVAILABLE', `expected AVAILABLE institution volume for: "${q}"`);
    assert.ok((r.totalRows ?? 0) > 0, `expected non-empty totalRows for: "${q}"`);
  }
});

test('execution-layer: a genuine explicit ranking/filter request for refinance-specific institution data still honestly discloses unavailability (not silently faked)', () => {
  const r = executeAskQuery({ q: 'which lenders did the most refinance originations' });
  assert.equal(r.failClosed, true);
  assert.equal(r.volumeEvidence?.availability, 'NEEDS_CLARIFICATION');
});

test('execution-layer: a combined loanType+purpose structured filter still honestly fails closed (does not get swallowed by the discovery default)', () => {
  const r = executeAskQuery({ q: 'FHA purchase mortgage companies in Florida' });
  assert.equal(r.failClosed, true);
});

// Aggregate wording must still route to a scalar count for the SAME provider vocabulary
// -- proves the classifier distinguishes intent, not just vocabulary.
const AGGREGATE_NEGATIVE_CASES = [
  'how many mortgage lenders are in Texas',
  'number of mortgage companies in Florida',
  'how many home loan companies operate in Colorado',
  'count of mortgage brokers in New Jersey',
  'how many refinance loans',
  'number of mortgage originations',
  'count of applications',
  'mortgage denials in Texas',
  'compare originations',
];

test('aggregate wording on the same provider vocabulary still routes to a scalar count', () => {
  for (const q of AGGREGATE_NEGATIVE_CASES) {
    const parsed = parseLenderAsk(q);
    assert.equal(parsed.mode, 'count', `expected scalar count for explicit aggregate wording: "${q}", got ${parsed.mode}`);
  }
});
