/**
 * LEND-NAT-016 discovery assertions (DISC).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runDiscContractTests } from '../lib/national-profile/disc-tests';
import indexing from '../docs/lend-nat-014-indexing-cohort.json';
import searchIndex from '../docs/lend-nat-016-search-index.json';

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), 'utf8');
const failures: string[] = [];
const assert = (id: string, cond: boolean, detail: string) => {
  if (!cond) failures.push(`${id}: ${detail}`);
  else console.log(`PASS ${id} ${detail}`);
};

for (const r of runDiscContractTests()) assert(r.id, r.pass, r.detail);

const landing = read('app/lender/page.tsx');
const view = read('components/national-profile/national-lender-discovery.tsx');
const hero = read('components/lender-hero.tsx');
const ds = read('lib/design/lender-design-system.ts');
const discovery = read('lib/national-profile/discovery.ts');
const catalogSitemap = read('app/sitemap.ts');
const nationalSitemap = read('app/sitemap-lenders-national.xml/route.ts');
const profile = read('components/national-profile/national-lender-profile.tsx');
const fetchSrc = read('lib/national-profile/fetch.ts');

assert('DISC1', landing.includes('NationalLenderDiscovery') && view.includes('National lender research'), 'substantive /lender');
assert('DISC21', ds.includes("href: '/lender'") && hero.includes('/lender'), 'homepage national entry');
assert('DISC22', hero.includes('SearchBar') && ds.includes('Explore lenders by location'), 'ZIP/local preserved');
assert('DISC23', view.includes('HMDA 2025') && view.includes('not 2026'), 'HMDA education');
assert('DISC24', view.includes('deterministically attributed') || view.includes('Unresolved'), 'CFPB education');
assert('DISC25', view.includes('Regulatory') && view.includes('separate from consumer complaints'), 'complaints ≠ enforcement');
assert('DISC26', view.includes('Not established') && view.includes('not a quality'), 'servicer education');
assert('DISC27-src', !view.includes('top 180') && !view.includes('best lender') && !view.includes('Trust Score'), 'no ranking copy');
assert('DISC28-src', !read('lib/national-profile/discovery-jsonld.ts').includes('aggregateRating'), 'jsonld source');
assert('DISC29', landing.includes('index: false') && landing.includes('sp.q'), 'query/facet noindex');
assert('DISC18-src', indexing.count === 180 && searchIndex.indexable_count === 180, '180 frozen');
assert('DISC19-src', nationalSitemap.includes('nationalIndexingSitemapLocs') && !nationalSitemap.includes("'/lender'"), 'national sitemap still cohort-only');
assert('DISC20-src', catalogSitemap.includes("path: '/lender'") && catalogSitemap.includes('/lenders/'), '/lender in catalog sitemap; catalog routes remain');
assert('DISC34', discovery.includes('DISCOVERY_RECORDS') && !discovery.includes('lender_cfpb_complaints') && !fetchSrc.includes('searchDiscovery'), 'bounded search index');
assert('DISC15-src', view.includes('nationalProfilePath') === false && view.includes('hit.href'), 'result href from discovery');
assert('DISC-no-places', !view.includes('Google Places') && !hero.includes('Places'), 'no Google Places');
assert('DISC36', searchIndex.rows.every((r: { stable_key: string }) => !r.stable_key.includes('person') && !r.stable_key.includes('branch')), 'no person/branch keys');
assert('DISC37', !landing.toLowerCase().includes('florida enrichment') && !view.includes('Start Florida'), 'no Florida work');
assert('DISC38', searchIndex.count === 181 && searchIndex.hold_count === 1, 'PHH in search, not extra indexables');
assert('DISC-hygiene-src', profile.includes('nationalPresentationName') && profile.includes('headingName'), 'profile H1 uses presentation name');
assert('DISC-a11y', view.includes('htmlFor="lender-q"') && view.includes('<legend') && view.includes('aria-live') && view.includes('<h1'), 'search a11y');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('OK DISC contract + source assertions');
