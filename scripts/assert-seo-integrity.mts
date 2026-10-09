import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { NextRequest } from 'next/server';
import { middleware } from '../middleware';
import { US_STATES } from '../lib/fdic/states';
import { buildHubTitle, buildStateTitle } from '../lib/fdic/seo';
import { buildAutoHubTitle, buildAutoStateTitle } from '../lib/auto/seo';
import {
  buildMortgageHubTitle,
  buildMortgageStateTitle,
  buildMortgageCountyTitle,
  buildLenderProfileTitle,
} from '../lib/mortgage/seo';

const { default: sitemap } = createRequire(import.meta.url)('../app/sitemap') as typeof import('../app/sitemap');

const fdicPaths = sitemap()
  .map(({ url }) => new URL(url).pathname)
  .filter((path) => path.startsWith('/fdic-insured-banks/'));
assert.deepEqual(
  fdicPaths.sort(),
  US_STATES.filter((state) => state.hasData)
    .map((state) => `/fdic-insured-banks/${state.slug}`)
    .sort(),
);
assert.equal(fdicPaths.length, 51);
assert.equal(fdicPaths.filter((path) => /\/[A-Z]{2}$/.test(path)).length, 0);
console.log('FDIC_UPPERCASE_SITEMAP_URLS = 0');
console.log('FDIC_CANONICAL_SLUG_URLS = 51');

for (const state of US_STATES) {
  for (const code of [state.code, state.code.toLowerCase()]) {
    for (const suffix of ['', '/']) {
      const request = new NextRequest(`https://example.com/fdic-insured-banks/${code}${suffix}?ref=test`);
      const response = await middleware(request);
      assert.equal(response.status, 301);
      assert.equal(response.headers.get('location'), `https://example.com/fdic-insured-banks/${state.slug}?ref=test`);
    }
  }
}
for (const path of ['/fdic-insured-banks/ZZ', '/fdic-insured-banks/NJJ', '/fdic-insured-banks/NJ/extra', '/fdic-insured-banks/new-jersey']) {
  const response = await middleware(new NextRequest(`https://example.com${path}`));
  assert.equal(response.headers.get('location'), null, path);
}
console.log('OLD_FDIC_CODE_REDIRECT = PASS');

for (const title of [
  buildHubTitle(), buildStateTitle('New Jersey', 10),
  buildAutoHubTitle(), buildAutoStateTitle('Florida', 10),
  buildMortgageHubTitle(), buildMortgageStateTitle('New Jersey'),
  buildMortgageCountyTitle('Hudson'), buildLenderProfileTitle('Example Bank', '123'),
]) {
  assert.doesNotMatch(title, /\|\s*Lender\s*Trust\s*Hub$/i);
}

// Optional integration checks against a running local server. The generated
// sitemap is used directly because the repository also has a public sitemap.
const base = process.argv[2];
if (base) {
  const get = (path: string) => fetch(new URL(path, base), {
    redirect: 'manual', headers: { 'User-Agent': 'Googlebot' },
  });
  for (const path of fdicPaths) {
    const response = await get(path);
    assert.equal(response.status, 200, path);
    await response.text();
  }
  console.log('FDIC_SLUG_URLS_HTTP_200 = PASS');
  for (const [path, canonical, status] of [
    ['/fdic-insured-banks/NJ', '/fdic-insured-banks/new-jersey', 301],
    ['/fdic-insured-banks/fl', '/fdic-insured-banks/florida', 301],
    ['/local-lenders/new-jersey/nj-hudson', '/local-lenders/new-jersey/hudson', 308],
    ['/local-lenders/florida/fl-miami-dade', '/local-lenders/florida/miami-dade', 308],
  ] as const) {
    const response = await get(path);
    assert.equal(response.status, status, path);
    assert.equal(new URL(response.headers.get('location')!, base).pathname, canonical);
    const destination = await get(canonical);
    assert.equal(destination.status, 200, canonical);
    await destination.text();
  }
  console.log('NJ_HUDSON_REDIRECT = PASS');
  console.log('FL_MIAMI_DADE_REDIRECT = PASS');
  console.log('CANONICAL_COUNTY_STAYS_200 = PASS');
  for (const path of [
    '/', '/fdic-insured-banks', '/fdic-insured-banks/new-jersey',
    '/local-lenders', '/local-lenders/new-jersey', '/local-lenders/new-jersey/hudson',
    '/auto-loan-companies', '/new-jersey', '/new-jersey/monmouth-county',
    '/florida', '/iowa', '/programs', '/programs/fha', '/methodology',
    '/tools/program-finder', '/tools/loan-estimate-analyzer', '/tools/compare-loan-estimates',
  ]) {
    const response = await get(path);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
    assert.ok(title, path);
    assert.equal((title.match(/Lender\s*Trust\s*Hub/gi) ?? []).length, 1, `${path}: ${title}`);
  }
  console.log('DOUBLE_BRAND_SAMPLE = 0');
}
console.log('SEO integrity assertions passed');
