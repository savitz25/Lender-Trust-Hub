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

test('R15: "lenders in New Jersey" answers with real NJ HMDA originations, not a refusal', () => {
  const r = executeAskQuery({ q: 'lenders in New Jersey' });
  assert.notEqual(r.failClosed, true);
  assert.equal(r.query.mode, 'count');
  assert.equal(r.facts?.[0]?.value, njOriginations.toLocaleString('en-US'));
});

test('R15: bare "lender in new jersey" phrasing matches the same real answer', () => {
  const r = executeAskQuery({ q: 'lender in new jersey' });
  assert.notEqual(r.failClosed, true);
  assert.equal(r.facts?.[0]?.value, njOriginations.toLocaleString('en-US'));
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

test('R15: "mortgage lenders in Texas" answers with real TX HMDA originations on /ask', () => {
  const r = executeAskQuery({ q: 'mortgage lenders in Texas' });
  assert.notEqual(r.failClosed, true);
  assert.equal(r.facts?.[0]?.value, txOriginations.toLocaleString('en-US'));
});

test('R15: "mortgage companies in Florida" no longer fails closed on /ask (both-surfaces parity)', () => {
  const r = executeAskQuery({ q: 'mortgage companies in Florida' });
  assert.notEqual(r.failClosed, true);
  assert.equal(r.facts?.[0]?.value, flOriginations.toLocaleString('en-US'));
});

test('R15: the homepage native search box no longer silently substitutes the national total for a non-FL state count', () => {
  const home = executeLenderAsk('mortgage lenders in Texas', intel);
  // Before the fix this rendered the generic national HMDA snapshot (headline
  // "Current HMDA research universe...") instead of a Texas-specific answer or an
  // honest hand-off. It must now hand off to /ask, which resolves the real TX value.
  assert.doesNotMatch(home.headline, /Current HMDA research universe/);
  assert.equal(home.href, `/ask?q=${encodeURIComponent('mortgage lenders in Texas')}`);
});

test('R15: the homepage native search box hands NJ off to /ask instead of fail-closing locally', () => {
  const home = executeLenderAsk('lenders in New Jersey', intel);
  assert.notEqual(home.failClosed, true);
  assert.equal(home.href, `/ask?q=${encodeURIComponent('lenders in New Jersey')}`);
});

test('R15: Florida\'s dedicated homepage branch is unaffected (still answers locally, no regression)', () => {
  // Note: "mortgage companies in Florida", matching the actual ground-truth phrasing
  // from the R1-015 addendum -- literal "lenders in Florida" hits a separate,
  // pre-existing, unrelated FL-specific location/headquarters gate (parse.ts's
  // lender-location FAIL pattern) that is not part of this ticket's scope.
  const home = executeLenderAsk('mortgage companies in Florida', intel);
  assert.equal(home.href, '/florida');
  assert.equal(home.facts?.[0]?.value, flOriginations.toLocaleString('en-US'));
});
