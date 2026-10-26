import assert from 'node:assert/strict';
import sitemap from '../app/sitemap';

const sitemapFn = typeof sitemap === 'function'
  ? sitemap
  : (sitemap as unknown as { default: typeof sitemap }).default;
const entries = sitemapFn();
const urls = new Set(entries.map((entry) => entry.url));

assert.ok(entries.length > 0, 'sitemap should retain its public routes');
for (const path of ['/', '/about', '/compare', '/auto-loan-companies']) {
  assert.ok(urls.has(`https://www.lendertrusthub.com${path === '/' ? '' : path}`), `${path} stays in sitemap`);
}
assert.ok(entries.every((entry) => entry.lastModified === undefined), 'do not publish fabricated build-time lastmod dates');

console.log(`L3 sitemap checks passed (${entries.length} entries retained, no lastmod values)`);
