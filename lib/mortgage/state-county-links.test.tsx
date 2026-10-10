import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import sitemap from '@/app/sitemap';
import { StateCountyLinks, stateCountyLinks } from '@/components/mortgage/state-county-links';
import { PUBLISHED_STATES } from '@/lib/home-intel/published-states';
import { PUBLISHED_STATEWIDE_SLUGS } from '@/lib/seo/published-state-path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function pageSource(slug: string): string {
  return readFileSync(path.join(root, 'app', slug, 'page.tsx'), 'utf8');
}

test('sitemap counties for New Jersey and Florida are linked by name', () => {
  const nj = stateCountyLinks('new-jersey');
  const fl = stateCountyLinks('florida');
  assert.ok(nj.length >= 7, `NJ sitemap counties ${nj.length}`);
  assert.ok(fl.length >= 8, `FL sitemap counties ${fl.length}`);
  assert.deepEqual(
    nj.map((row) => row.name),
    [...nj.map((row) => row.name)].sort((a, b) => a.localeCompare(b, 'en')),
  );
  assert.ok(nj.some((row) => row.href === '/local-lenders/new-jersey/hudson'));
  assert.ok(fl.every((row) => row.href.startsWith('/local-lenders/florida/')));
  const html = renderToStaticMarkup(
    <StateCountyLinks stateSlug="new-jersey" stateName="New Jersey" />,
  );
  for (const row of nj) assert.ok(html.includes(`href="${row.href}"`), row.href);
  assert.match(html, /New Jersey counties/);
  assert.match(html, /href="\/local-lenders\/new-jersey"/);
  const flHtml = renderToStaticMarkup(
    <StateCountyLinks stateSlug="florida" stateName="Florida" />,
  );
  for (const row of fl) assert.ok(flHtml.includes(`href="${row.href}"`), row.href);
  assert.equal(renderToStaticMarkup(<StateCountyLinks stateSlug="zz-no-counties" stateName="Nowhere" />), '');
});

test('every top-level state page renders the county links, including unavailable branches', () => {
  const slugs = [...PUBLISHED_STATEWIDE_SLUGS, 'iowa', 'kansas'];
  const dirs = new Set(
    readdirSync(path.join(root, 'app'), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name),
  );
  for (const slug of slugs) {
    assert.ok(dirs.has(slug), slug);
    const source = pageSource(slug);
    const uses = source.split('StateCountyLinks').length - 1;
    assert.match(source, new RegExp(`stateSlug="${slug}"`), slug);
    if (source.includes('reason={loaded.reason}')) {
      assert.equal(uses, 3, `${slug} unavailable and ready branches`);
    } else {
      assert.equal(uses, 2, slug);
    }
  }
});

test('/states lists every published state, including Iowa and Kansas', () => {
  const source = readFileSync(path.join(root, 'app', 'states', 'page.tsx'), 'utf8');
  assert.match(source, /const PATH = '\/states'/);
  assert.match(source, /canonical: `\$\{SITE_URL\}\$\{PATH\}`/);
  assert.match(source, /PUBLISHED_STATES/);
  const hrefs = PUBLISHED_STATES.map((state) => state.href).sort();
  assert.deepEqual(hrefs, PUBLISHED_STATEWIDE_SLUGS.map((slug) => `/${slug}`).sort());
  const published = PUBLISHED_STATEWIDE_SLUGS as readonly string[];
  assert.equal(published.includes('iowa'), true);
  assert.equal(published.includes('kansas'), true);
});

test('sitemap and footer expose /states for every published state', () => {
  const paths = sitemap().map((entry) => new URL(entry.url).pathname);
  assert.ok(paths.includes('/states'));
  for (const state of PUBLISHED_STATES) assert.ok(paths.includes(state.href), state.href);
  assert.ok(paths.includes('/iowa'));
  assert.ok(paths.includes('/kansas'));
  const footer = readFileSync(path.join(root, 'lib', 'design', 'lender-design-system.ts'), 'utf8');
  assert.match(footer, /href: '\/states', label: 'All states'/);
});
