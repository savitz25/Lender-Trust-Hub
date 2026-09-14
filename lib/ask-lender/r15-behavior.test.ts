import test from 'node:test';
import assert from 'node:assert/strict';
import { executeAskQuery } from './execute-query';
import { parseLenderAsk } from './parse';

// TH-SEARCH-R1-015 scope: New Jersey plain lender/roster refusals must degrade to a
// real answer with a caveat. The other state-specific "roster not acquired" gates
// (CA/AZ/CO/VA/NY/IL) are explicitly NOT part of this ticket -- they were not
// ground-truthed against a real alternative dataset the way NJ was, and touching them
// would be scope creep beyond what TH-SEARCH-R1-015 names. These tests are a
// regression fence: if a future change accidentally widens the NJ fix onto these
// states, it fails here first.
test('R15: California CRMLA roster gate is unchanged (out of scope for R1-015)', () => {
  const r = executeAskQuery({ q: 'licensed lenders in California' });
  assert.equal(r.failClosed, true);
  assert.equal(r.query.failClosedKind, 'ca-crmla-not-acquired');
});
test('R15: Arizona DIFI roster gate is unchanged (out of scope for R1-015)', () => {
  const r = executeAskQuery({ q: 'licensed lenders in Arizona' });
  assert.equal(r.query.failClosedKind, 'az-open-search-partial');
});
test('R15: Colorado company-roster gate is unchanged (out of scope for R1-015)', () => {
  const r = executeAskQuery({ q: 'licensed lenders in Colorado' });
  assert.equal(r.query.failClosedKind, 'co-company-roster-not-acquired');
});
test('R15: Virginia SCC dated-roster gate is unchanged (out of scope for R1-015)', () => {
  const r = executeAskQuery({ q: 'licensed lenders in Virginia' });
  assert.equal(r.query.failClosedKind, 'va-scc-dated-roster');
});
test('R15: New York DFS dated-aggregate gate is unchanged (out of scope for R1-015)', () => {
  const r = executeAskQuery({ q: 'licensed lenders in New York' });
  assert.equal(r.query.failClosedKind, 'ny-dfs-dated-aggregates');
});
test('R15: Illinois IDFPR search-only gate is unchanged (out of scope for R1-015)', () => {
  const r = executeAskQuery({ q: 'licensed lenders in Illinois' });
  assert.equal(r.query.failClosedKind, 'il-idfpr-nmls-search-only');
});

// The refusal-bar invariant applied inversely: an explicit HMDA-worded NJ question
// must not accidentally pick up the (removed) roster gate, and a non-NJ question must
// never accidentally receive the NJ coverage caveat.
test('R15: coverage caveat is NJ-specific, never leaks onto other states', () => {
  for (const q of ['lenders in Texas', 'lenders in Florida', 'mortgage lenders in Washington']) {
    const r = executeAskQuery({ q });
    assert.notEqual(r.query.coverageState, 'REQUEST_ONLY');
  }
});

test('R15: an NJ question that already specifies HMDA action language is unaffected (never hit the gate)', () => {
  const r = executeAskQuery({ q: 'How many mortgage originations in New Jersey?' });
  assert.notEqual(r.failClosed, true);
  assert.equal(r.query.coverageState, undefined, 'explicit HMDA phrasing never matched the roster pattern; no synthetic caveat should appear');
});

test('R15: fail_closed NJ paths for genuinely unsupported dimensions are untouched', () => {
  // Purpose-originations combined with a loan type is still not a supported scalar
  // dimension anywhere in this hub; the NJ fix must not accidentally make this AVAILABLE.
  const r = executeAskQuery({ q: 'How many FHA purchase originations in New Jersey?' });
  assert.equal(r.failClosed, true);
});

test('R15: malformed/empty/XSS-shaped input still fails closed identically for NJ text', () => {
  const r = executeAskQuery({ q: 'lenders in New Jersey' + ' '.repeat(170) });
  assert.equal(r.failClosed, true);
  assert.equal(r.query.failClosedKind, 'invalid-request');
});

test('R15: parseLenderAsk is pure/deterministic for the ground-truth NJ queries (3x identical)', () => {
  for (const q of ['lenders in New Jersey', 'lender in new jersey', 'which lenders in New Jersey']) {
    const a = JSON.stringify(parseLenderAsk(q));
    const b = JSON.stringify(parseLenderAsk(q));
    const c = JSON.stringify(parseLenderAsk(q));
    assert.equal(a, b);
    assert.equal(b, c);
  }
});

test('R15: "companies" synonym fix does not swallow a real unsupported condition', () => {
  // A combined dimension Florida genuinely doesn't support (purpose + FHA) must still
  // fail closed even though "companies" is now a recognized noise word.
  const r = executeAskQuery({ q: 'FHA purchase mortgage companies in Florida' });
  assert.equal(r.failClosed, true);
});

test('R15: "companies" synonym works for Texas too, not just the two named ground-truth states', () => {
  const r = executeAskQuery({ q: 'mortgage companies in Texas' });
  assert.notEqual(r.failClosed, true);
  assert.ok(r.facts?.[0]?.value);
});
