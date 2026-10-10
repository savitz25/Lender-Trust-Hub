// Real React control + real browser storage. API responses, analytics and form
// navigation are isolated fixtures; no account or production endpoint is used.
// Setup: install playwright-core@1.49.1 in LENDER_BROWSER_TOOLS and its Chromium.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { build } = createRequire(require.resolve('tsx'))('esbuild');
if (!process.env.LENDER_BROWSER_TOOLS) throw new Error('Set LENDER_BROWSER_TOOLS to the isolated playwright-core installation prefix.');
const { chromium } = createRequire(join(process.env.LENDER_BROWSER_TOOLS, 'package.json'))('playwright-core');
const profile = { lenderSlug: 'freedom-mortgage', lenderName: 'Freedom Mortgage', nmlsId: '2767' };
let server, browser, context, page, origin;
let admitted, failure, posts, pageErrors;

test.before(async () => {
  const bundle = await build({
    absWorkingDir: process.cwd(), bundle: true, write: false, format: 'iife', platform: 'browser',
    define: { 'process.env.NODE_ENV': '"test"' },
    stdin: {
      resolveDir: process.cwd(), loader: 'tsx', contents: `
        import React from 'react';
        import { createRoot } from 'react-dom/client';
        import { SaveLenderButton } from './components/my-lending/save-lender-button';
        import * as storage from './lib/my-lending/storage';
        import * as adapter from './lib/my-lending/parent-adapter';
        const root = createRoot(document.getElementById('root'));
        window.fixture = { storage, adapter, unmount: () => root.unmount() };
        root.render(<SaveLenderButton {...${JSON.stringify(profile)}} parentHandoff={true} />);
      `,
    },
    plugins: [{ name: 'isolated-display-and-analytics', setup(b) {
      b.onResolve({ filter: /^next\/link$/ }, () => ({ path: 'link', namespace: 'fixture' }));
      b.onResolve({ filter: /lib\/analytics\/ga-events$/ }, () => ({ path: 'analytics', namespace: 'fixture' }));
      b.onLoad({ filter: /.*/, namespace: 'fixture' }, ({ path }) => ({
        loader: 'tsx', resolveDir: process.cwd(), contents: path === 'link'
          ? 'import React from "react"; export default function Link(p) { return <a {...p} />; }'
          : 'export function trackMyLendingSave() {}',
      }));
    } }],
  });
  server = createServer((req, res) => {
    res.setHeader('content-type', req.url === '/bundle.js' ? 'text/javascript' : 'text/html');
    res.end(req.url === '/bundle.js' ? bundle.outputFiles[0].contents
      : '<!doctype html><html><body><div id="root"></div><script src="/bundle.js"></script></body></html>');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, executablePath: process.env.LENDER_BROWSER_EXECUTABLE || undefined });
});

test.beforeEach(async () => {
  admitted = false; failure = null; posts = []; pageErrors = [];
  context = await browser.newContext();
  await context.route('**/*', (route) => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
  await context.addInitScript(() => {
    window.storageFailure = null;
    window.submittedIntents = [];
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (window.storageFailure === 'all' || window.storageFailure === key || (window.storageFailure === 'session' && this === sessionStorage)) {
        throw new DOMException('Fixture blocked storage', 'QuotaExceededError');
      }
      return setItem.call(this, key, value);
    };
    HTMLFormElement.prototype.submit = function () {
      window.submittedIntents.push(new FormData(this).get('intent'));
    };
  });
  page = await context.newPage();
  page.setDefaultTimeout(5_000);
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.route('**/api/my-lending/profile-save**', async (route) => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { admitted } });
    const input = route.request().postDataJSON();
    posts.push(input.intent);
    if (failure === 'network') return route.abort();
    if (failure === 'timeout') return; // Browser AbortController must end this request.
    if (failure === 'http') return route.fulfill({ status: 503, json: { state: 'continue' } });
    if (failure === 'json') return route.fulfill({ contentType: 'application/json', body: '{' });
    if (failure === 'closed') return route.fulfill({ json: { state: 'local_only' } });
    return route.fulfill({ json: {
      state: 'continue', target: failure === 'target' ? 'https://invalid.test/my/profile-save' : 'https://www.asktrusthub.com/my/profile-save',
      continuationRef: 'f'.repeat(43), intent: input.intent === 'save' ? 'save_signin' : input.intent,
    } });
  });
});

test.afterEach(async () => {
  await context?.close();
  assert.deepEqual(pageErrors, [], 'No uncaught component errors');
});
test.after(async () => {
  await browser?.close();
  if (server) await new Promise((resolve) => server.close(resolve));
});

async function open(parentEnabled = false) {
  admitted = parentEnabled;
  await page.goto(origin);
  await page.getByRole('button', { name: '♡ Save', exact: true }).waitFor();
  if (parentEnabled) await page.getByRole('link', { name: 'Sign in to My TrustHub', exact: true }).waitFor();
}
const save = () => page.getByRole('button', { name: '♡ Save', exact: true }).click();
const unsave = () => page.getByRole('button', { name: '♥ Saved', exact: true }).click();
const count = () => page.evaluate(() => window.fixture.storage.loadState().savedLenders.length);
const block = (value) => page.evaluate((v) => { window.storageFailure = v; }, value);
async function seed() {
  await page.evaluate((p) => window.fixture.adapter.deviceFirstProfileSave(p), profile);
  await page.getByRole('button', { name: '♥ Saved', exact: true }).waitFor();
}

test('fresh blocked Save shows an error, retries once, and survives reload without parent transport', async () => {
  await open(); await block('all'); await save();
  assert.match(await page.getByRole('alert').textContent(), /could not save/i);
  assert.equal(await count(), 0);
  assert.equal(await page.getByRole('status').count(), 0);
  await block(null); await save();
  await page.getByRole('button', { name: '♥ Saved', exact: true }).waitFor();
  assert.equal(await count(), 1);
  assert.equal(await page.getByRole('alert').count(), 0);
  await page.reload();
  await page.getByRole('button', { name: '♥ Saved', exact: true }).waitFor();
  assert.equal(await count(), 1);
  assert.deepEqual(posts, []);
});

test('failed Unsave never shows Removed, preserves the row, and does not call parent until local retry succeeds', async () => {
  await open(true); await seed(); await block('lth:my-lending:v1'); await unsave();
  assert.match(await page.getByRole('alert').textContent(), /Could not remove/);
  assert.equal(await page.getByRole('status').count(), 0);
  assert.equal(await count(), 1);
  assert.deepEqual(posts, []);
  await block(null); await unsave();
  await page.waitForFunction(() => window.submittedIntents.length === 1);
  assert.equal(await count(), 0);
  assert.deepEqual(posts, ['unsave']);
});

for (const mode of ['http', 'json', 'closed', 'network', 'target']) {
  test(`parent ${mode} failure is visible and explicit Save retry does not toggle or duplicate the local row`, async () => {
    await open(true); failure = mode; await save();
    const retry = page.getByRole('button', { name: 'Retry My TrustHub', exact: true });
    await retry.waitFor();
    assert.match(await page.getByRole('alert').textContent(), /could not continue/i);
    assert.equal(await count(), 1);
    assert.equal(await page.getByRole('status').count(), 0);
    failure = null; await retry.click();
    await page.waitForFunction(() => window.submittedIntents.length === 1);
    assert.deepEqual(posts, ['save', 'save']);
    assert.equal(await count(), 1);
    assert.equal(await page.getByRole('alert').count(), 0);
  });
}

test('parent Unsave retry retains removal intent after the local row is already gone', async () => {
  await open(true); await seed(); failure = 'http'; await unsave();
  const retry = page.getByRole('button', { name: 'Retry My TrustHub removal', exact: true });
  await retry.waitFor();
  assert.match(await page.getByRole('alert').textContent(), /Removal from My TrustHub is not confirmed/);
  assert.equal(await count(), 0);
  failure = null; await retry.click();
  await page.waitForFunction(() => window.submittedIntents.length === 1);
  assert.deepEqual(posts, ['unsave', 'unsave']);
  assert.deepEqual(await page.evaluate(() => window.submittedIntents), ['unsave']);
  assert.equal(await count(), 0);
});

test('sign-in handoff failure stays visible instead of navigating away; retry retains sign-in intent', async () => {
  await open(true); failure = 'http';
  await page.getByRole('link', { name: 'Sign in to My TrustHub', exact: true }).click();
  await page.getByRole('button', { name: 'Retry My TrustHub', exact: true }).waitFor();
  assert.equal(new URL(page.url()).origin, origin);
  assert.equal(await count(), 0);
  failure = null; await page.getByRole('button', { name: 'Retry My TrustHub', exact: true }).click();
  await page.waitForFunction(() => window.submittedIntents.length === 1);
  assert.deepEqual(posts, ['save_signin', 'save_signin']);
});

test('blocked handoff ticket storage shows a recoverable error and preserves the local Save', async () => {
  await open(true); await block('session'); await save();
  await page.getByRole('button', { name: 'Retry My TrustHub', exact: true }).waitFor();
  assert.equal(await count(), 1);
  assert.deepEqual(await page.evaluate(() => window.submittedIntents), []);
  await block(null); await page.getByRole('button', { name: 'Retry My TrustHub', exact: true }).click();
  await page.waitForFunction(() => window.submittedIntents.length === 1);
});

test('a pending handoff blocks duplicate clicks and times out into a retryable error', async () => {
  await open(true); await page.clock.install(); failure = 'timeout'; await save();
  await page.waitForFunction(() => document.querySelector('button[aria-pressed]')?.disabled);
  await page.evaluate(() => {
    document.querySelector('button[aria-pressed]').click();
    document.querySelector('a').click();
  });
  await page.clock.fastForward(15_001);
  await page.getByRole('button', { name: 'Retry My TrustHub', exact: true }).waitFor();
  assert.deepEqual(posts, ['save']);
  assert.equal(await count(), 1);
});

test('shortlist alternative storage failure shows no success toast and preserves existing research', async () => {
  await open();
  await page.evaluate(() => {
    for (let i = 0; i < 3; i++) window.fixture.storage.shortlistLender({ lenderSlug: `fixture-${i}`, lenderName: `Fixture ${i}` });
  });
  await save();
  await page.getByRole('dialog').waitFor();
  await block('lth:my-lending:v1');
  await page.getByRole('button', { name: 'Save as Researching only', exact: true }).click();
  assert.match(await page.getByRole('alert').textContent(), /could not save/i);
  assert.equal(await page.getByRole('status').count(), 0);
  assert.equal(await count(), 3);
});
