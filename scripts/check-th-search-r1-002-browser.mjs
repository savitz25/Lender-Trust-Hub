/** Operator-only, bounded settled-browser checks; never part of live CI. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const [cdp, origin, label, sha, deployment] = process.argv.slice(2);
const browser = await chromium.connectOverCDP(cdp);
const page = await browser.contexts()[0].newPage();
page.setDefaultTimeout(20000);
const folder = 'docs/qa/th-search-r1-002';
const report = { utc: new Date().toISOString(), surface: 'Persistent Chrome via local CDP; ordinary page interactions', origin, sha, deployment, checks: [] };
const api = q => page.evaluate(async q => { const r = await fetch('/api/ask?' + new URLSearchParams({ q })); return { status: r.status, data: await r.json() }; }, q);
async function settled() {
  await page.locator('.intel-ask-result h3').first().waitFor({ state: 'visible' });
  await page.waitForFunction(() => { const input = document.querySelector('input[name=q]'); return input && Object.keys(input).some(key => key.startsWith('__reactProps')); });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  return page.evaluate(() => ({ text: document.querySelector('main').innerText, width: innerWidth, scroll: document.documentElement.scrollWidth, robots: document.querySelector('meta[name=robots]')?.content }));
}
async function capture(q, started) {
  const ui = await settled(), response = await api(q), data = response.data;
  assert.equal(response.status, 200, q); assert.ok(ui.scroll <= ui.width, `overflow ${q}`); assert.match(ui.robots, /noindex/);
  assert.ok(ui.text.includes(data.headline), q);
  for (const id of data.lookup?.identifiers ?? []) assert.ok(ui.text.includes(id.value));
  for (const row of data.rows ?? []) { assert.ok(ui.text.includes(row.displayName)); assert.ok(ui.text.includes(row.whyMatched[0])); }
  for (const row of data.rows ?? []) for (const evidence of row.matchEvidence ?? []) { assert.equal(evidence.returnedValue, row[evidence.matchedField]); assert.equal(evidence.requestedValue, evidence.returnedValue); assert.ok(row.whyMatched.some(why => why.includes(`record lists ${evidence.returnedValue}.`))); }
  if (data.lookup?.sourceLookup === 'not_run') { assert.ok(ui.text.includes('No institution lookup was run')); assert.ok(!ui.text.includes('Complete NMLS:')); }
  for (const condition of data.lookup?.conditions ?? []) assert.ok(ui.text.includes(condition.text));
  for (const action of data.lookup?.officialActions ?? []) assert.ok(await page.locator(`a[href="${action.href}"]`).count());
  const elapsedMs = Date.now() - started; assert.ok(elapsedMs < 25000, `completion budget ${q}: ${elapsedMs}`);
  report.checks.push({ q, elapsedMs, ui, api: response }); return data;
}
try {
  const positives = [];
  for (const [width, q] of [[1280, 'NMLS 3030'], [390, 'NMLS 30 30']]) {
    await page.setViewportSize({ width, height: 900 }); await page.goto(origin + '/', { waitUntil: 'domcontentloaded' }); await page.locator('input[name=q]').waitFor(); await page.waitForFunction(() => { const e = document.querySelector('input[name=q]'); return e && Object.keys(e).some(k => k.startsWith('__reactProps')); });
    const input = page.getByLabel('Lender research question, institution name, NMLS ID, market, county or state');
    const element = await input.elementHandle(); await input.click(); assert.ok(await element.evaluate(e => e.isConnected));
    await input.fill(q); const started = Date.now(); await input.press('Enter'); await page.waitForURL('**/ask?*');
    const data = await capture(q, started); assert.equal(data.terminalState, 'FOUND'); assert.equal(data.totalRows, 1); assert.equal(data.rows[0].nmls, '3030'); positives.push(data.rows[0].institutionKey);
    const summary = page.locator('summary').filter({ hasText: 'Trace this result' }).first(); const original = await summary.elementHandle();
    await summary.scrollIntoViewIfNeeded(); await summary.click(); assert.ok(await original.evaluate(e => e.isConnected)); assert.ok(await summary.evaluate(e => e.parentElement.open));
    await summary.press('Enter'); assert.equal(await summary.evaluate(e => e.parentElement.open), false);
    await summary.press('Enter'); assert.ok(await summary.evaluate(e => e.parentElement.open));
    await page.screenshot({ path: resolve(folder, `${label}-positive-${width}.png`) });
  }
  assert.equal(positives[0], positives[1]);
  await page.setViewportSize({ width: 320, height: 844 }); const narrow = await settled(); assert.ok(narrow.scroll <= 320);
  await page.screenshot({ path: resolve(folder, `${label}-positive-320.png`) }); report.checks.push({ name: '320-overflow', ui: narrow });
  const questions = ['NMLS 3251', 'nmls 32 51', 'NMLS 32, 51', 'NMLS lookup', 'NMLS person 3030', 'NMLS branch 3030', 'NMLS 3030 licensed in California', 'LEI 549300FGXN1K3HLB1R50'];
  const outcomes = [];
  for (const [i, q] of questions.entries()) {
    await page.setViewportSize({ width: i % 2 ? 1280 : 390, height: 900 }); const started = Date.now();
    await page.goto(origin + '/ask?' + new URLSearchParams({ q }), { waitUntil: 'domcontentloaded' }); const data = await capture(q, started); outcomes.push(data);
    if (i < 2) assert.equal(data.query.identifier.value, '3251');
    if (i === 2) assert.equal(data.terminalState, 'NEEDS_CLARIFICATION');
    if (i === 3) assert.equal(data.terminalState, 'IDENTIFIER_REQUIRED');
    if (i === 4 || i === 5) { assert.equal(data.terminalState, 'UNSUPPORTED'); assert.equal(data.rows.length, 0); assert.equal(data.lookup.resolvedClass, 'unknown'); }
    if (i === 6) { assert.equal(data.terminalState, 'FOUND'); assert.equal(data.rows[0].nmls, '3030'); assert.ok(data.lookup.conditions.some(c => c.state === 'UNSUPPORTED' && /licensing/.test(c.explanation))); }
    if (i === 7) { assert.equal(data.terminalState, 'FOUND'); assert.equal(data.rows[0].institutionKey, positives[0]); }
    if ([1, 2, 4, 6].includes(i)) await page.screenshot({ path: resolve(folder, `${label}-case-${i}.png`) });
  }
  assert.equal(outcomes[0].terminalState, outcomes[1].terminalState); assert.deepEqual(outcomes[0].rows?.map(r => r.institutionKey), outcomes[1].rows?.map(r => r.institutionKey));
  const market = 'Which lenders originated the most mortgages in Florida?';
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(origin + '/ask?' + new URLSearchParams({ q: market, action: 'application', loanType: 'FHA', geo: 'broward' })); await settled();
    await page.getByText('Advanced filters', { exact: true }).click();
    assert.equal(await page.locator('select[name=geo]').inputValue(), 'broward'); assert.equal(await page.locator('select[name=action]').inputValue(), 'application'); assert.equal(await page.locator('select[name=loanType]').inputValue(), 'FHA');
    await page.locator('select[name=geo]').focus(); const focus = await page.locator('select[name=geo]').evaluate(e => ({ focused: document.activeElement === e, outline: getComputedStyle(e).outlineStyle }));
    assert.ok(focus.focused); assert.notEqual(focus.outline, 'none');
    const input = page.locator('input[name=q]'); await input.fill(market + ' '); await input.press('Enter'); await page.locator('input[name=q]').waitFor(); await page.waitForFunction(() => { const e = document.querySelector('input[name=q]'); return e && Object.keys(e).some(k => k.startsWith('__reactProps')); });
    const url = new URL(page.url()); for (const [key, value] of Object.entries({ action: 'application', loanType: 'FHA', geo: 'broward' })) assert.equal(url.searchParams.get(key), value);
    await page.reload(); const ui = await settled(); assert.ok(ui.scroll <= width);
    const data = await page.evaluate(async () => (await fetch('/api/ask' + location.search)).json());
    assert.equal(data.query.geography.countyFips, '12011'); assert.equal(data.query.actionTaken[0], 'application'); assert.equal(data.query.loanType[0], 'FHA'); assert.ok(data.rows.length); assert.ok(ui.text.includes(data.rows[0].displayName));
    await page.screenshot({ path: resolve(folder, `${label}-filters-${width}.png`) }); report.checks.push({ name: 'structured HMDA edit/reload', width, focus, query: data.query, firstIdentity: data.rows[0].lei });
  }
  await page.goBack(); await settled(); assert.equal(await page.locator('select[name=geo]').inputValue(), 'broward'); await page.goForward(); await settled(); assert.equal(await page.locator('select[name=loanType]').inputValue(), 'FHA');
  report.status = 'PASS';
} catch (error) { report.status = 'FAIL'; report.error = error.message; throw error; }
finally { writeFileSync(resolve(folder, `${label}-browser.json`), JSON.stringify(report, null, 2)); await browser.close(); }
console.log(JSON.stringify({ status: report.status, checks: report.checks.length, artifact: `${folder}/${label}-browser.json` }));
