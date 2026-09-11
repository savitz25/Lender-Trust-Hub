import assert from 'node:assert/strict';
import test, { type TestContext } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { executeAskQuery } from './execute-query';
import { parseLenderAsk } from './parse';
import { lenderIdentitySource, type IdentitySnapshot } from './identity-lookup';
import { SEARCH_POOL, type DiscoveryRecord } from '../national-profile/discovery';
import { AskResultView } from '../../components/ask-lender/ask-result-view';
import { AskTrustHubSearch } from '../../components/home-intel/ask-trust-hub-search';
import AskPage from '../../app/ask/page';
import { GET } from '../../app/api/ask/route';
import type { AskExecution } from './types';

Object.assign(globalThis, { React });
const LEI = '549300FGXN1K3HLB1R50';
const OTHER_LEI = '1234567890ABCDEFGHIJ';
const template = SEARCH_POOL.find(row => row.nmls === '3030')!;
function record(nmls: string, lei: string | null = null): DiscoveryRecord {
  return { ...template, institution_id: `fixture-${nmls}`, stable_key: `nmls-inst:${nmls}`, slug: `fixture-${nmls}`, nmls, lei, canonical_name: `Fixture institution ${nmls}`, display_name: `Fixture institution ${nmls}`, historical_names: [] };
}
function fixtures(t: TestContext, records = [record('3251', LEI), record('32'), record('3030', OTHER_LEI), record('30')]) {
  const snapshot: IdentitySnapshot = { expectedCount: records.length, entries: records.map(row => ({ record: row, permitted: true, sourceReference: 'fixture-only publication snapshot', sourceAsOf: '2026-09-10' })) };
  t.mock.method(lenderIdentitySource, 'load', () => snapshot);
  return snapshot;
}
const run = (q: string) => executeAskQuery({ q });
function exact(q: string, id: string) {
  const result = run(q);
  assert.equal(result.terminalState, 'FOUND', q);
  assert.equal(result.totalRows, 1, q);
  assert.equal(result.rows?.[0]?.nmls, id, q);
  return result;
}
function findResult(node: unknown): AskExecution | undefined {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) return node.map(findResult).find(Boolean);
  const props = (node as { props?: { result?: AskExecution; children?: unknown } }).props;
  return props?.result ?? findResult(props?.children);
}

test('01: grouped 3251 selects full fixture, never the 32 distractor', t => {
  fixtures(t); assert.equal(exact('NMLS 3251', '3251').rows?.[0]?.institutionKey, exact('nmls 32 51', '3251').rows?.[0]?.institutionKey);
});
test('02: grouped 3030 retains the institution, not the 30 distractor', t => {
  fixtures(t); exact('NMLS 3030', '3030'); exact('NMLS 30 30', '3030'); exact('NMLS 30', '30');
});
test('03: allowed labels, case, # and whitespace preserve complete values', t => {
  fixtures(t);
  for (const q of ['NMLS ID 3251', 'nMlS #3251', 'NMLS institution ID 3251', 'NMLS\t32\t51', 'NMLS\n32\n51', 'find NMLS: 3251']) exact(q, '3251');
  assert.match(exact('NMLS 32 51', '3251').lookup!.identifiers[0].normalization.join(' '), /Whitespace/);
});
test('04: company, ZIP, year, amount and state text are separate conditions', t => {
  fixtures(t);
  for (const suffix of ['in ZIP 33441', 'Other Company', 'in year 2025', 'for $300000', 'in California']) {
    const result = exact('NMLS 32 51 ' + suffix, '3251');
    assert.ok(result.lookup?.conditions.some(c => c.text.includes(suffix) && c.state !== 'APPLIED'));
  }
});
test('05: independent numeric tokens require clarification before source lookup', t => {
  const source = t.mock.method(lenderIdentitySource, 'load', () => { throw Error('must not run'); });
  for (const q of ['NMLS 32, 51', 'NMLS 32 / 51', 'NMLS 32 and 51', 'NMLS 32 51 2025', 'NMLS 32 - 51', 'NMLS 32 or 51']) assert.equal(run(q).terminalState, 'NEEDS_CLARIFICATION', q);
  assert.equal(source.mock.callCount(), 0);
  const result = run('NMLS 32, 51');
  assert.equal(result.lookup?.sourceLookup, 'not_run');
  assert.match(result.trace!.method, /No source lookup executed/);
  const html = renderToStaticMarkup(React.createElement(AskResultView, { result, question: 'NMLS 32, 51' }));
  assert.match(html, /Unconfirmed span/);
  assert.doesNotMatch(html, /Complete NMLS/);
});
test('06: verified pairs, conflicting pairs and repeated labels remain distinct', t => {
  fixtures(t);
  assert.equal(exact(`NMLS 3251 and LEI ${LEI}`, '3251').rows?.[0]?.matchEvidence?.length, 2);
  assert.equal(run(`NMLS 3251 and LEI ${OTHER_LEI}`).terminalState, 'CONFLICT');
  for (const q of ['NMLS 3251 NMLS 32', `LEI ${LEI} LEI ${OTHER_LEI}`]) assert.equal(run(q).terminalState, 'NEEDS_CLARIFICATION');
});
test('07: malformed, overlong, leading-zero or partial IDs never execute', t => {
  const source = t.mock.method(lenderIdentitySource, 'load', () => { throw Error('must not run'); });
  for (const q of ['NMLS 32.51', 'NMLS 32 .51', 'NMLS -3251', 'NMLS +3251', 'NMLS 3e3', 'NMLS 3251abc', 'NMLS 1234567890123', 'NMLS 3030' + ' '.repeat(175) + 'NMLS 32']) assert.equal(run(q).terminalState, 'INVALID', q);
  const zeros = run('NMLS 003251'); assert.equal(zeros.terminalState, 'NEEDS_CLARIFICATION'); assert.equal(zeros.lookup?.identifiers[0].rawSpan, 'NMLS 003251');
  assert.equal(source.mock.callCount(), 0);
});
test('08: LEI remains case-normalized alphanumeric and never numeric NMLS', t => {
  fixtures(t); const result = exact(`lei ${LEI.toLowerCase()}`, '3251');
  assert.equal(result.query.identifier?.type, 'LEI'); assert.equal(result.query.identifier?.value, LEI);
  assert.equal(run('LEI 3251').terminalState, 'INVALID');
});
test('09: person and branch traps do not return the institution fixture', t => {
  fixtures(t);
  for (const q of ['NMLS person 3251', 'NMLS 3251 loan officer', 'mortgage loan originator NMLS 3251', 'NMLS branch 3251', 'branch NMLS 3251']) {
    const result = run(q); assert.equal(result.terminalState, 'UNSUPPORTED', q); assert.equal(result.rows?.length, 0); assert.notEqual(result.lookup?.requestedClass, 'institution'); assert.equal(result.lookup?.resolvedClass, 'unknown');
  }
});
test('10: exact misses and unpublished holds never fall back or expose a profile', t => {
  const snap = fixtures(t); snap.entries[0].permitted = false;
  for (const q of ['NMLS 3251', 'NMLS 325', 'NMLS 999999']) { const result = run(q); assert.equal(result.terminalState, 'NO_MATCH'); assert.equal(result.rows?.length, 0); assert.equal(result.lookup?.resolvedClass, 'unknown'); }
});
test('11: verified duplicate observations deduplicate; distinct keys need clarification', t => {
  const snap = fixtures(t, [record('3251'), record('3251')]); exact('NMLS 3251', '3251');
  snap.entries[1].record = { ...record('3251'), institution_id: 'unresolved-other', stable_key: 'other-source-key' };
  assert.equal(run('NMLS 3251').terminalState, 'NEEDS_CLARIFICATION');
});
test('12: source fields, explanations and exact-match evidence agree', t => {
  const snap = fixtures(t); const result = exact('NMLS 32 51', '3251'); const row = result.rows![0], evidence = row.matchEvidence![0];
  assert.equal(evidence.method, 'exact_identifier'); assert.equal(evidence.requestedValue, row.nmls); assert.equal(evidence.returnedValue, row.nmls); assert.equal(evidence.institutionKey, row.institutionKey); assert.match(row.whyMatched[0], /record lists 3251\./); assert.doesNotMatch(row.whyMatched.join(' '), /record lists 32\./);
  snap.entries.push({ ...snap.entries[0], record: { ...record('32'), institution_id: 'fixture-3251' } }); snap.expectedCount++;
  assert.equal(run('NMLS 3251').terminalState, 'UNAVAILABLE');
});
test('13: identifier-bearing California and New Jersey licensing remain partial', t => {
  fixtures(t);
  for (const state of ['California', 'New Jersey']) { const result = exact(`NMLS 3251 licensed in ${state}`, '3251'); assert.equal(result.query.coverageState, 'PARTIAL'); assert.ok(result.lookup?.conditions.some(c => /licensing was not checked/.test(c.explanation))); }
});
test('14: additional names, locations, pricing and typed HMDA overrides are accounted for', t => {
  fixtures(t);
  const result = executeAskQuery({ q: 'NMLS 3251 Other Company best rates in Miami', overrides: { action: 'application', geo: 'broward', loanType: 'FHA' } });
  assert.equal(result.terminalState, 'FOUND'); assert.equal(result.lookup?.conditions.filter(c => c.state === 'UNSUPPORTED').length, 4); assert.match(result.sharePath!, /geo=broward/);
  assert.equal(executeAskQuery({ q: 'NMLS 3251', structuredQuery: { mode: 'entity', identifier: { type: 'NMLS_INSTITUTION', value: '32' } } }).terminalState, 'INVALID');
  assert.equal(executeAskQuery({ q: 'NMLS person 3251', structuredQuery: { mode: 'entity' } }).terminalState, 'UNSUPPORTED');
});
test('15: actual native page and API have identical fixture identity contracts', async t => {
  fixtures(t);
  for (const q of ['NMLS 32 51', 'NMLS 9999', 'NMLS lookup', 'NMLS branch 3251', 'NMLS 3251 licensed in California']) {
    const native = findResult(await AskPage({ searchParams: Promise.resolve({ q }) }));
    const api = await (await GET(new Request('https://www.lendertrusthub.com/api/ask?' + new URLSearchParams({ q })))).json();
    assert.ok(native); assert.deepEqual(JSON.parse(JSON.stringify(native)), api);
  }
});
test('16: homepage and query edit form preserve raw identifiers and typed selections', () => {
  const html = renderToStaticMarkup(React.createElement(AskTrustHubSearch, { initialQuery: 'NMLS 32 51', overrides: { action: 'denial', loanType: 'FHA', geo: 'palm-beach' } }));
  assert.match(html, /action="\/ask"/); assert.match(html, /value="NMLS 32 51"/);
  for (const v of ['denial', 'FHA', 'palm-beach']) assert.match(html, new RegExp(`value="${v}" selected=""`));
  assert.doesNotMatch(html, /maxLength=/i);
});
test('17: every lookup terminal panel has useful text, edit and official actions', t => {
  fixtures(t);
  for (const q of ['NMLS 3251', 'NMLS 9999', 'NMLS lookup', 'NMLS 32, 51', 'NMLS branch 3251']) {
    const result = run(q); const html = renderToStaticMarkup(React.createElement(AskResultView, { result, question: q }));
    assert.ok(result.headline && result.body); assert.match(html, /Identifier lookup outcome/); assert.match(html, /Edit or retry/); assert.match(html, /NMLS Consumer Access/); assert.doesNotMatch(html, /This question is fail-closed/);
  }
});
test('18: official action never invents COMPANY or other unresolved class', t => {
  fixtures(t);
  for (const q of ['NMLS 3251', 'NMLS 9999', 'NMLS branch 3251']) { const action = run(q).lookup!.officialActions[0]; assert.equal(action.href, 'https://www.nmlsconsumeraccess.org/'); assert.doesNotMatch(action.href, /COMPANY|INDIVIDUAL|3251|9999/); }
  assert.equal(run(`LEI ${LEI}`).lookup!.officialActions[0].href, 'https://search.gleif.org/');
  assert.equal(run('LEI lookup').lookup!.officialActions[0].href, 'https://search.gleif.org/');
});
test('19: missing/corrupt source or load failure completes unavailable, never zero', async t => {
  const snap = fixtures(t); snap.expectedCount++; assert.equal(run('NMLS 3251').terminalState, 'UNAVAILABLE');
  snap.expectedCount = 0; snap.entries = []; assert.equal(run('NMLS 3251').totalRows, undefined);
  t.mock.method(lenderIdentitySource, 'load', () => { throw new Error('timeout or missing file'); });
  const response = await GET(new Request('https://www.lendertrusthub.com/api/ask?q=NMLS%203251')); assert.equal(response.status, 503);
  const data = await response.json(); assert.equal(data.terminalState, 'UNAVAILABLE'); assert.equal(data.totalRows, undefined); assert.doesNotMatch(JSON.stringify(data), /timeout or missing file/);
});
test('20: non-identity HMDA, comparisons, definitions and input validation remain distinct', async () => {
  assert.equal(run('what is an NMLS ID').query.mode, 'definition');
  assert.equal(run('Compare Broward and Palm Beach mortgage activity').query.mode, 'comparison');
  const market = executeAskQuery({ q: 'Which lenders originated the most mortgages in Florida?', overrides: { geo: 'broward', action: 'application', loanType: 'FHA' } });
  assert.ok(market.rows?.length); assert.equal(market.query.geography?.countyFips, '12011'); assert.equal(market.lookup, undefined);
  for (const extra of ['&q=NMLS%2032', '&page=1.5', '&page=-1', '&pageSize=51', '&action=unknown', '&geo=ZZ', '&loanType=FHA&loanType=VA']) {
    const response = await GET(new Request('https://www.lendertrusthub.com/api/ask?q=NMLS%203251' + extra)); assert.equal(response.status, 400, extra);
  }
  assert.equal(parseLenderAsk('NMLS 32 51 in ZIP 33441').identifier?.value, '3251');
});
