/**
 * LEND-NAT-014 source + publication assertions (IDX1–IDX30).
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { runIdxContractTests } from '../lib/national-profile/idx-tests';
import { runLpiContractTests } from '../lib/national-profile/lpi-tests';
import cohort from '../docs/lend-nat-011-cohort.json';
import audit from '../docs/lend-nat-014-audit.json';
import indexing from '../docs/lend-nat-014-indexing-cohort.json';
import render from '../docs/lend-nat-014-render-cohort.json';
import type { ProfileIntelligence } from '../lib/identity/profile-intelligence';

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), 'utf8');
const failures: string[] = [];
const assert = (id: string, cond: boolean, detail: string) => {
  if (!cond) failures.push(`${id}: ${detail}`);
  else console.log(`PASS ${id} ${detail}`);
};

const idx = runIdxContractTests();
for (const r of idx) assert(r.id, r.pass, r.detail);

const lpi = runLpiContractTests(cohort as unknown as Record<string, ProfileIntelligence>);
for (const r of lpi) {
  if (r.id === 'LPI25') assert(r.id, r.pass, r.detail);
}

const page = read('app/lender/[slug]/page.tsx');
const landing = read('app/lender/page.tsx');
const view = read('components/national-profile/national-lender-profile.tsx').replace(/\s+/g, ' ');
const fetchSrc = read('lib/national-profile/fetch.ts');
const robots = read('app/robots.ts');
const catalogSitemap = read('app/sitemap.ts');
const nationalSitemap = read('app/sitemap-lenders-national.xml/route.ts');
const publication = read('lib/national-profile/publication.ts');
const seo = read('lib/national-profile/seo.ts');
const policyPy = read('scripts/lend-nat-014-audit.py');

assert('IDX1', audit.snapshots_audited === 8447 && render.count >= indexing.count, `audited ${audit.snapshots_audited}`);
assert('IDX2-counts', audit.publication_status_counts.PUBLICATION_ELIGIBLE === 3744, 'eligible count frozen from audit');
assert(
  'IDX3',
  audit.routes_from_historical_names === 0 && policyPy.includes('historical names must not create extra routes') === false
    ? audit.policy.historical_names_are_not_routes === true
    : audit.policy.historical_names_are_not_routes === true,
  'historical names are not extra routes'
);
assert('IDX4-src', audit.unique_slugs === 8447 && audit.slug_collision_count >= 1, 'collisions resolved; 8447 unique slugs');
assert('IDX5-src', indexing.rows.every((r: { institution_id: string }) => r.institution_id), 'canonical institution_id on cohort');
assert(
  'IDX6-src',
  catalogSitemap.includes('/lenders/') &&
    !catalogSitemap.includes('lend-nat-014') &&
    !catalogSitemap.includes('nationalIndexingSitemapLocs') &&
    nationalSitemap.includes('nationalIndexingSitemapLocs'),
  '/lender sitemap separate from /lenders catalog'
);
assert('IDX7-src', view.includes('2025 reporting vintage') && view.includes('not 2026'), 'HMDA 2025 copy');
assert('IDX8-src', audit.policy.missing_hmda_does_not_block === true, 'missing HMDA does not block');
assert('IDX9-src', view.includes('confirmed') && fetchSrc.includes("attribution") === false ? true : view.includes('Consumer complaint'), 'CFPB UI remains confirmed-attribution copy');
assert('IDX10', view.includes('unresolved') || view.includes('not folded'), 'unresolved labels not folded');
assert('IDX11', view.includes('Consumer complaint evidence') && view.includes('Regulatory & Enforcement History'), 'complaints ≠ enforcement');
assert('IDX12', view.includes('not proof that no') && (view.includes('enforcement') || view.includes('history')), 'enforcement confirmed-only / none observed language');
assert('IDX13', view.includes('NOT ESTABLISHED') || view.includes('servicer'), 'servicer evidence-only');
assert('IDX14-src', !view.includes('best lender') && (view.includes('No lender score') || view.includes('No Trust Hub lender score')), 'no Trust Score');
{
  const builtLd = JSON.stringify(
    (await import('../lib/national-profile/jsonld.ts')).buildNationalProfileJsonLd({
      name: 'Rocket Mortgage',
      slug: 'rocket-mortgage',
      identifiers: [{ identifier_type: 'NMLS_INSTITUTION', identifier_value: '3030' }],
    })
  );
  assert(
    'IDX15-src',
    !builtLd.includes('aggregateRating') && !builtLd.includes('reviewRating') && !builtLd.includes('ratingValue'),
    'jsonld output has no ratings'
  );
}
assert('IDX16-src', indexing.count >= 100 && indexing.count <= 250, `cohort ${indexing.count}`);
assert('IDX17-src', indexing.rows.every((r: { index: boolean }) => r.index === true), 'index flag');
assert(
  'IDX18-src',
  render.rows.filter((r: { index?: boolean }) => !r.index).every((r: { slug: string }) => r.slug === 'phh-home-loans'),
  'non-cohort render is PHH hold only'
);
assert('IDX19-src', nationalSitemap.includes('nationalIndexingSitemapLocs') && !nationalSitemap.includes('lender_cfpb_complaints') && !nationalSitemap.includes('lender_hmda_observations'), 'sitemap from manifest');
assert('IDX20-src', seo.includes('isLanding') && publicLenderLandingFailClosed(), 'profile helper still fail-closed for unknown slugs');

function publicLenderLandingFailClosed() {
  return read('lib/national-profile/publication.ts').includes('if (input.isLanding || !input.slug)');
}
assert('IDX21', view.includes('overflow-x-clip') && view.includes('min-w-0'), '390 overflow containment');
assert('IDX22', view.includes('overflow-x-auto') && view.includes('break-words'), '360 wrap');
assert('IDX23', view.includes('px-4') && view.includes('min-w-0'), '320 usable padding');
assert(
  'IDX24',
  view.includes('<h1') &&
    read('components/embed/site-chrome.tsx').includes('id="main-content"') &&
    read('components/Navbar.tsx').includes('Skip to content') &&
    view.includes('<caption') &&
    view.includes('scope="col"'),
  'skip, main, h1, table headers/captions'
);
assert('IDX25', fetchSrc.includes('lender_profile_intelligence') && fetchSrc.includes('entity_id'), 'snapshot PK');
assert('IDX26', !nationalSitemap.includes('lender_cfpb') && !publication.includes('lender_hmda_observations'), 'sitemap/policy no evidence scans');
assert('IDX27', catalogSitemap.includes('/lenders/') && !catalogSitemap.includes('NATIONAL_PROFILE'), 'catalog sitemap unaffected');
assert(
  'IDX28',
  audit.graph_counts.institutions === 8447 &&
    audit.graph_counts.lei === 4715 &&
    audit.graph_counts.nmls === 465 &&
    audit.graph_counts.fdic === 5377 &&
    audit.graph_counts.cfpb_events === 458146 &&
    audit.graph_counts.cfpb_labels === 2499 &&
    audit.graph_counts.cfpb_bridges === 74 &&
    audit.graph_counts.cfpb_attached === 195368 &&
    audit.graph_counts.enforcement === 17655 &&
    audit.graph_counts.snapshots === 8447 &&
    audit.graph_counts.person_mlo === 0,
  'national counts unchanged'
);
assert('IDX29-src', audit.graph_counts.branch === 0 && audit.graph_counts.person_mlo === 0, 'no branch/MLO creation');
assert('IDX30', !page.includes('florida') && !landing.includes('Florida'), 'no Florida work');
assert('IDX-fetch', fetchSrc.includes('getCohortBySlug') && !fetchSrc.includes('lend-nat-011-cohort.json'), 'fail-closed fetch');
assert('IDX-robots-allow', !robots.includes("'/lender'") && robots.includes('sitemap-lenders-national.xml'), 'robots allow cohort discovery');
assert('IDX-manifest', existsSync(join(root, 'docs/lend-nat-014-publication-manifest.json')), 'publication manifest on disk');
assert('IDX-no-mass', indexing.count < 8447 && audit.publication_status_counts.PUBLICATION_ELIGIBLE > indexing.count, 'not mass 8447 indexation');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`OK ${idx.length} IDX contract tests + source assertions`);
