// TH-SEARCH-R1-019C: headless browser proof. Fresh isolated context per viewport, deviceScaleFactor 1,
// REAL keyboard typing + Enter and REAL mouse clicks (Playwright input events are trusted).
// usage: node scripts/r19c-browser.mjs <path-to-playwright-module> <out.json>
// servers: 3131 real catalog | 3132 keyword-shapes | 3133 large-window | 3134 source-unavailable
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.argv[2]);
const OUT = process.argv[3] ?? 'docs/qa/th-search-r1-019c/browser-playwright.json';
const REAL = 'http://localhost:3131', KEYWORDS = 'http://localhost:3132', LARGE = 'http://localhost:3133', DOWN = 'http://localhost:3134';

const snapshot = () => {
  const root = document.querySelector('[data-name-candidates-state]');
  const rows = [...document.querySelectorAll('.hub-table tbody tr')].map((tr) => tr.querySelector('th').childNodes[0].textContent.trim());
  const notApplied = [...document.querySelectorAll('.intel-interpretation-grid dt')].filter((x) => x.textContent === 'Not applied').map((x) => x.nextElementSibling.textContent);
  return { state: root?.dataset.nameCandidatesState ?? null, searched: root?.dataset.searchedName ?? null, headline: document.querySelector('.intel-ask-result h3')?.textContent ?? null, rows, firstRow: document.querySelector('.hub-table tbody tr')?.innerText.replace(/\s+/g, ' ').slice(0, 220) ?? null, notApplied, pager: document.querySelector('.intel-ask-pager')?.innerText.replace(/\s+/g, ' ') ?? null, hasNext: [...document.querySelectorAll('.intel-ask-pager a')].some((a) => /next/i.test(a.textContent)), caveats: [...document.querySelectorAll('.intel-ask-result li')].map((li) => li.textContent).filter((t) => /NOT APPLIED|not exhaustive|searched sources/i.test(t)), input: document.querySelector('#ask-lender-input')?.value ?? null, overflow: document.documentElement.scrollWidth > window.innerWidth + 1 };
};

async function typeAndEnter(page, base, text) {
  await page.goto(`${base}/ask`, { waitUntil: 'load' });
  await page.evaluate(() => { window.__trusted = []; document.querySelector('#ask-lender-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') sessionStorage.setItem('enterTrusted', String(e.isTrusted)); }); });
  await page.click('#ask-lender-input');
  await page.keyboard.type(text, { delay: 5 });
  await Promise.all([page.waitForURL(/\/ask\?/), page.keyboard.press('Enter')]);
  await page.waitForSelector('.intel-ask-result', { timeout: 20000 });
  const enterTrusted = await page.evaluate(() => sessionStorage.getItem('enterTrusted'));
  return { typed: text, submittedBy: 'real keyboard Enter', enterEventTrusted: enterTrusted, ...(await page.evaluate(snapshot)) };
}

const browser = await chromium.launch({ headless: true });
const report = { ranAt: new Date().toISOString(), tool: 'Playwright headless Chromium; fresh context per viewport; deviceScaleFactor 1; real keyboard + mouse events', viewports: {} };
const consoleErrors = [];
for (const [label, viewport] of [['1280', { width: 1280, height: 900 }], ['390', { width: 390, height: 844 }]]) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(`${label}: ${m.text().slice(0, 160)}`); });
  const v = {};
  v.bmoPositive = await typeAndEnter(page, REAL, 'BMO Bank');
  // result action: REAL click. Locally there is no database, so every profile page 404s -- recorded, not claimed as a working destination.
  const href = await page.getAttribute('.hub-table tbody tr a[data-specialist-event="profile_open"]', 'href');
  await Promise.all([page.waitForURL(/\/lender\//), page.click('.hub-table tbody tr a[data-specialist-event="profile_open"]')]);
  v.resultActionClick = { clickedBy: 'real mouse click', navigatedTo: new URL(page.url()).pathname, href, localStatusNote: 'local build has no database credentials; see canonicalLinkCheck for the separate production check' };
  await page.goBack({ waitUntil: 'load' });
  v.afterHistoryBack = await page.evaluate(snapshot);
  await page.reload({ waitUntil: 'load' });
  v.afterRefresh = await page.evaluate(snapshot);
  v.keywordShapedOrganization = await typeAndEnter(page, KEYWORDS, 'Branch River Bank');
  v.keywordShapedCharter = await typeAndEnter(page, KEYWORDS, 'Charter Bank');
  v.keywordPartial = await typeAndEnter(page, KEYWORDS, 'Branch River');
  v.retainedCondition = await typeAndEnter(page, REAL, 'Rocket Mortgage company in Texas');
  v.miss = await typeAndEnter(page, REAL, 'Zzqx Nonexistent Lending');
  v.editAfterMiss = await typeAndEnter(page, REAL, 'Alliant Credit Union');
  v.sourceUnavailable = await typeAndEnter(page, DOWN, 'BMO Bank');
  v.sourceUnavailableApiStatus = (await page.request.get(`${DOWN}/api/ask?q=BMO%20Bank`)).status();
  // multi-page search through its reachable cap, by REAL clicks on Next
  const first = await typeAndEnter(page, LARGE, 'Summit Ridge');
  const seen = new Set(first.rows); let pages = 1; let last = first;
  while (last.hasNext && pages < 20) {
    const target = pages + 1;
    await Promise.all([page.waitForURL((url) => new URL(url).searchParams.get('page') === String(target)), page.click('.intel-ask-pager a:has-text("Next")')]);
    await page.waitForFunction((n) => (document.querySelector('.intel-ask-pager')?.textContent ?? '').includes('Page ' + n + ' of'), target, { timeout: 20000 }); last = await page.evaluate(snapshot); last.rows.forEach((r) => seen.add(r)); pages += 1;
  }
  v.multiPageToCap = { headline: first.headline, pagesWalkedByClickingNext: pages, distinctRecordsSeen: seen.size, lastPager: last.pager, lastPageRows: last.rows.length, nextOfferedOnLastPage: last.hasNext, truncationDisclosed: last.caveats.some((c) => /not exhaustive/i.test(c)) };
  v.protectedPaths = {};
  for (const q of ['NMLS 3030', 'mortgage lenders in Texas', 'What is an NMLS ID?']) { const r = await typeAndEnter(page, REAL, q); v.protectedPaths[q] = { nameSearch: r.state !== null, headline: r.headline }; }
  report.viewports[label] = v;
  await context.close();
}
// 320px overflow check
{
  const context = await browser.newContext({ viewport: { width: 320, height: 700 }, deviceScaleFactor: 1 });
  const page = await context.newPage(); const out = {};
  for (const [name, url] of [['candidates74', `${REAL}/ask?q=First`], ['cappedWindow', `${LARGE}/ask?q=Summit+Ridge`], ['miss', `${REAL}/ask?q=Zzqx+Nonexistent+Lending`], ['unavailable', `${DOWN}/ask?q=BMO+Bank`], ['condition', `${REAL}/ask?q=Rocket+Mortgage+company+in+Texas`]]) {
    await page.goto(url, { waitUntil: 'load' });
    out[name] = await page.evaluate(() => ({ innerWidth: window.innerWidth, docScrollWidth: document.documentElement.scrollWidth, pageOverflows: document.documentElement.scrollWidth > window.innerWidth + 1, tableInsideOwnScroller: Boolean(document.querySelector('.hub-table-scroll')) }));
  }
  report.overflow320 = out; await context.close();
}
report.consoleErrors = consoleErrors;
await browser.close();
writeFileSync(OUT, JSON.stringify(report, null, 1));
const v = report.viewports['1280'];
console.log(JSON.stringify({ enterTrusted: v.bmoPositive.enterEventTrusted, bmo: v.bmoPositive.firstRow, keyword: [v.keywordShapedOrganization.state, v.keywordShapedOrganization.rows[0]], charter: [v.keywordShapedCharter.state, v.keywordShapedCharter.rows[0]], partial: v.keywordPartial.rows, condition: v.retainedCondition.notApplied, miss: [v.miss.state, v.miss.input], unavailable: [v.sourceUnavailable.state, v.sourceUnavailable.headline, v.sourceUnavailableApiStatus], cap: v.multiPageToCap, protectedPaths: v.protectedPaths, back: v.afterHistoryBack.searched, refresh: v.afterRefresh.searched, m390: { bmo: report.viewports['390'].bmoPositive.state, cap: report.viewports['390'].multiPageToCap.pagesWalkedByClickingNext, overflow: report.viewports['390'].bmoPositive.overflow }, overflow320: report.overflow320, consoleErrors }, null, 1));
