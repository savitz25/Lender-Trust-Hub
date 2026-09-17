import test from 'node:test';
import assert from 'node:assert/strict';
import snapshot from '../home-intel/accepted-snapshot.json';
import { executeAskQuery } from './execute-query';
import { executeLenderAsk } from './execute';
import { buildLenderHomeIntel } from '@/lib/home-intel/build';

const intel = buildLenderHomeIntel();
const njOriginations = snapshot.geography.find(r => r.state === 'NJ')!.originations;
const txOriginations = snapshot.geography.find(r => r.state === 'TX')!.originations;
const flOriginations = snapshot.geography.find(r => r.state === 'FL')!.originations;

// TH-DISCOVERY-PARITY-001A superseded this file's original R15 ground truth: a bare
// "[provider term] in <state>" query (e.g. "lenders in New Jersey", "mortgage companies
// in Florida") used to answer with a single scalar HMDA origination count. Per the new
// ticket's explicit product rule ("provider terms... must default to provider DISCOVERY
// ... aggregate/count mode requires actual aggregate wording"), these now default to
// DISCOVERY: a real, immediate, honestly-labeled institution list (entity mode), the
// same behavior "which lenders in New Jersey" already used. The scalar count is still
// reachable with explicit aggregate wording -- see th-discovery-gen-001.test.ts and
// parity-001a.test.ts for that coverage. njOriginations/txOriginations/flOriginations
// remain useful below as each state's real observedSum on the entity-mode result.

test('R15: "lenders in New Jersey" answers with real NJ institutions to browse, not a refusal', () => {
  const r = executeAskQuery({ q: 'lenders in New Jersey' });
  assert.notEqual(r.failClosed, true);
  assert.equal(r.query.mode, 'entity');
  assert.ok((r.totalRows ?? 0) > 0);
  assert.equal(r.volumeEvidence?.observedSum, njOriginations);
});

test('R15: bare "lender in new jersey" phrasing matches the same real answer', () => {
  const r = executeAskQuery({ q: 'lender in new jersey' });
  assert.notEqual(r.failClosed, true);
  assert.equal(r.query.mode, 'entity');
  assert.equal(r.volumeEvidence?.observedSum, njOriginations);
});

test('R15: the NJ RMLA roster limitation survives as a caveat on the real answer, not a refusal', () => {
  const r = executeAskQuery({ q: 'lenders in New Jersey' });
  assert.equal(r.query.coverageState, 'REQUEST_ONLY');
  assert.ok(r.caveats?.some(c => /RMLA-licensed lender roster is not acquired/.test(c)));
});

test('R15: "which lenders in New Jersey" returns a real institution ranking, not a refusal', () => {
  const r = executeAskQuery({ q: 'which lenders in New Jersey' });
  assert.notEqual(r.failClosed, true);
  assert.equal(r.query.mode, 'entity');
  assert.ok((r.totalRows ?? 0) > 0);
  assert.equal(r.volumeEvidence?.observedSum, njOriginations);
});

test('R15: "mortgage lenders in Texas" answers with real TX institutions to browse on /ask', () => {
  const r = executeAskQuery({ q: 'mortgage lenders in Texas' });
  assert.notEqual(r.failClosed, true);
  assert.equal(r.query.mode, 'entity');
  assert.equal(r.volumeEvidence?.observedSum, txOriginations);
});

test('R15/PARITY-001A: "mortgage companies in Florida" no longer fails closed on /ask (both-surfaces parity)', () => {
  const r = executeAskQuery({ q: 'mortgage companies in Florida' });
  assert.notEqual(r.failClosed, true);
  assert.equal(r.query.mode, 'entity');
  assert.equal(r.volumeEvidence?.observedSum, flOriginations);
});

test('PARITY-001A: explicit aggregate wording still returns the real scalar count, not a provider list', () => {
  const r = executeAskQuery({ q: 'how many mortgage applications in Florida' });
  assert.notEqual(r.failClosed, true);
  assert.equal(r.query.mode, 'count');
});

test('R15: the homepage native search box no longer silently substitutes the national total for a non-FL state count', () => {
  const home = executeLenderAsk('mortgage lenders in Texas', intel);
  // Before the fix this rendered the generic national HMDA snapshot (headline
  // "Current HMDA research universe...") instead of a Texas-specific answer or an
  // honest hand-off. It must now hand off to /ask, which resolves real TX providers.
  assert.doesNotMatch(home.headline, /Current HMDA research universe/);
  assert.equal(home.href, `/ask?q=${encodeURIComponent('mortgage lenders in Texas')}`);
});

test('R15: the homepage native search box hands NJ off to /ask instead of fail-closing locally', () => {
  const home = executeLenderAsk('lenders in New Jersey', intel);
  assert.notEqual(home.failClosed, true);
  assert.equal(home.href, `/ask?q=${encodeURIComponent('lenders in New Jersey')}`);
});

test('PARITY-001A: Florida\'s dedicated homepage branch now hands off to /ask like every other state, instead of a scalar-count-only local answer', () => {
  // Before TH-DISCOVERY-PARITY-001A this rendered a local '/florida' scalar-count-only
  // answer (the R1-015 addendum's original ground truth). Provider-category vocabulary
  // now defaults to discovery everywhere, including Florida, so this hands off to /ask
  // like every other state rather than keeping a FL-only scalar-count code path.
  const home = executeLenderAsk('mortgage companies in Florida', intel);
  assert.notEqual(home.failClosed, true);
  assert.equal(home.href, `/ask?q=${encodeURIComponent('mortgage companies in Florida')}`);
});
