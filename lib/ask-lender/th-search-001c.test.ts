import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseLenderAsk } from './parse';
import { executeAskQuery } from './execute-query';
import { LENDER_GOLDEN_QUESTIONS } from './golden-questions';
import { LENDER_SEARCH_CAPABILITIES } from '../specialist-search/capabilities';
import { SPECIALIST_SEARCH_ANALYTICS_EVENTS, SPECIALIST_SEARCH_VERSION } from '../specialist-search/contract';

test('portable contract and Lender capability states are frozen', () => {
  assert.equal(SPECIALIST_SEARCH_VERSION, 'trusthub-specialist-search-v1');
  assert.equal(SPECIALIST_SEARCH_ANALYTICS_EVENTS.length, 7);
  assert.deepEqual(new Set(LENDER_SEARCH_CAPABILITIES.map((c) => c.supportState)), new Set(['KNOWN', 'PARTIAL', 'REQUEST_ONLY', 'NOT_ACQUIRED', 'UNSUPPORTED']));
});

test('65+ golden questions remain deterministic and fail safely', () => {
  assert.ok(LENDER_GOLDEN_QUESTIONS.length >= 65);
  for (const item of LENDER_GOLDEN_QUESTIONS) {
    const parsed = parseLenderAsk(item.query);
    assert.notEqual(item.expected, 'FAIL', item.query);
    if (item.expected === 'PASS') assert.notEqual(parsed.mode, 'fail_closed', item.query);
    if (item.expected === 'UNSUPPORTED_SAFE') assert.equal(parsed.mode, 'fail_closed', item.query);
    if (item.expected === 'PARTIAL') assert.ok(parsed.coverageState === 'PARTIAL' || parsed.coverageState === 'REQUEST_ONLY' || parsed.coverageState === 'NOT_ACQUIRED', item.query);
  }
});

test('identity and market semantics are enforced by real projection paths', () => {
  const nmls = executeAskQuery({ q: 'NMLS 3030' });
  assert.equal(nmls.rows?.[0]?.displayName, 'Rocket Mortgage');
  assert.equal(nmls.rows?.[0]?.nmls, '3030');
  assert.match(nmls.rows?.[0]?.whyMatched.join(' ') ?? '', /Exact NMLS institution/i);
  assert.equal(parseLenderAsk('NMLS person 123456').failClosedKind, 'unsupported-identity-grain');
  assert.equal(parseLenderAsk('lenders headquartered in Broward County').failClosedKind, 'lender-location');
  assert.equal(parseLenderAsk('licensed mortgage lenders in New Jersey').coverageState, 'REQUEST_ONLY');
  assert.equal(parseLenderAsk('California CRMLA lenders').coverageState, 'NOT_ACQUIRED');
  assert.equal(parseLenderAsk('licensed mortgage lenders in Colorado').coverageState, 'NOT_ACQUIRED');
  assert.equal(parseLenderAsk('licensed mortgage lenders in Virginia').coverageState, 'PARTIAL');
  assert.equal(parseLenderAsk('Is Rocket licensed in Virginia?').failClosedKind, 'va-scc-dated-roster');
  assert.equal(parseLenderAsk('How many mortgage lenders are in Virginia?').failClosedKind, 'va-scc-dated-roster');
  assert.equal(parseLenderAsk('Mortgage brokers in Virginia').failClosedKind, 'va-scc-dated-roster');
  assert.notEqual(parseLenderAsk('mortgage applications in Virginia').mode, 'fail_closed');
  assert.equal(parseLenderAsk('Virginia first-time buyer assistance').failClosedKind, 'va-housing-programs');
  assert.equal(parseLenderAsk('Complaints against a Virginia lender').failClosedKind, 'va-cfpb-observations');
  assert.equal(parseLenderAsk('Colorado mortgage lenders').coverageState, 'NOT_ACQUIRED');
  assert.equal(parseLenderAsk('Colorado MLO lenders').failClosedKind, 'unsupported-identity-grain');
  assert.equal(parseLenderAsk('who approves the most mortgage applications').failClosedKind, 'personalized-approval');
});

test('shared shell, result trace, privacy analytics, and noindex contract are present', () => {
  const root = join(__dirname, '..', '..');
  const shell = readFileSync(join(root, 'components/home-intel/ask-trust-hub-search.tsx'), 'utf8');
  const result = readFileSync(join(root, 'components/ask-lender/ask-result-view.tsx'), 'utf8');
  const page = readFileSync(join(root, 'app/ask/page.tsx'), 'utf8');
  const analytics = readFileSync(join(root, 'components/specialist-search/SearchAnalytics.tsx'), 'utf8');
  assert.match(shell, /What do you want to find out/);
  assert.match(shell, /Advanced filters/);
  assert.match(shell, /Research/);
  assert.match(result, /Why this matched/);
  assert.match(result, /Trace this result/);
  assert.match(result, /Research this lender/);
  assert.match(page, /index: false/);
  assert.doesNotMatch(analytics, /rawQuery|\bq:/);
  assert.doesNotMatch(shell + result, /best lender result|trusted lender|quality rank/i);
});
