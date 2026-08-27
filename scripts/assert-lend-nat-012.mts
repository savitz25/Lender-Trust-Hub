/**
 * LEND-NAT-012 source + contract assertions (LPI).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import cohort from '../docs/lend-nat-011-cohort.json';
import { runLpiContractTests } from '../lib/national-profile/lpi-tests';
import type { ProfileIntelligence } from '../lib/identity/profile-intelligence';

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), 'utf8');
const failures: string[] = [];
const assert = (id: string, cond: boolean, detail: string) => {
  if (!cond) failures.push(`${id}: ${detail}`);
  else console.log(`PASS ${id} ${detail}`);
};

const results = runLpiContractTests(cohort as unknown as Record<string, ProfileIntelligence>);
for (const r of results) {
  assert(r.id, r.pass, r.detail);
}

const page = read('app/lender/[slug]/page.tsx');
const view = read('components/national-profile/national-lender-profile.tsx').replace(/\s+/g, ' ');
const fetchSrc = read('lib/national-profile/fetch.ts');
const nextCfg = read('next.config.ts');
const vercel = read('vercel.json');
const robots = read('app/robots.ts');
const sitemap = read('app/sitemap.ts');
const builtLd = JSON.stringify(
  (await import('../lib/national-profile/jsonld.ts')).buildNationalProfileJsonLd({
    name: 'Rocket Mortgage',
    slug: 'rocket-mortgage',
    identifiers: [{ identifier_type: 'NMLS_INSTITUTION', identifier_value: '3030' }],
  })
);

assert('LPI7', view.includes('HMDA activity observed') && view.includes('not licensed') && view.includes('branch'), 'geo not branch/licensing');
assert('LPI12-ui', view.includes('not proof that no enforcement history exists') || view.includes('not proof that no history exists'), 'NONE OBSERVED language');
assert('LPI19-ui', view.includes('No lender score') || view.includes('No Trust Hub lender score'), 'hero rejects score');
assert('LPI19b', !view.includes('best lender') && !view.includes('top lender'), 'no ranking copy');
assert('LPI20-src', !builtLd.includes('aggregateRating') && !builtLd.includes('reviewRating') && !builtLd.includes('ratingValue'), 'jsonld no ratings');
assert('LPI24', view.includes('<h1') && (read('components/embed/site-chrome.tsx').includes('id="main-content"')) && read('components/Navbar.tsx').includes('Skip to content'), 'a11y shell');
assert('LPI25-src', robots.includes("'/lender'") && page.includes('nationalProfileRobots') && !sitemap.includes('/lender/'), 'noindex / not in sitemap');
assert('LPI26', fetchSrc.includes('lender_profile_intelligence') && !fetchSrc.includes('lender_cfpb_complaints') && !fetchSrc.includes('lender_hmda_observations'), 'snapshot PK not live scans');
assert('PREV8-src', !fetchSrc.includes('lend-nat-011-cohort.json') && !fetchSrc.includes('gated_fixture'), 'fetch never loads fixture JSON');
{
  const { allowNationalProfileFixtures } = await import('../lib/national-profile/fixture-policy.ts');
  const prod = { VERCEL_ENV: 'production', NODE_ENV: 'production', VERCEL: '1' } as NodeJS.ProcessEnv;
  const prev = { VERCEL_ENV: 'preview', NODE_ENV: 'production', VERCEL: '1' } as NodeJS.ProcessEnv;
  const localTest = { NATIONAL_PROFILE_ALLOW_FIXTURES: '1', NODE_ENV: 'test' } as NodeJS.ProcessEnv;
  assert('PREV8-prod', allowNationalProfileFixtures(prod) === false, 'production never allows fixtures');
  assert('PREV8-preview', allowNationalProfileFixtures(prev) === false, 'preview never allows fixtures');
  assert('PREV8-local', allowNationalProfileFixtures(localTest) === true, 'local tests may use fixtures');
}
assert('LPI21-css', view.includes('overflow-x-clip') && view.includes('min-w-0') && view.includes('overflow-x-auto'), 'mobile overflow containment');
assert('LPI28', view.includes('Sources & methodology') && view.includes('not ingest dates') || view.includes('not “verified today”') || view.includes('not "verified today"') || view.includes('Snapshot rebuild dates'), 'freshness');
assert('route', !nextCfg.includes("source: '/lender/:path*'") && !vercel.includes('/lender/:path*'), 'legacy /lender redirect removed');
assert('LPI10-ui', view.includes('Consumer complaint evidence') && view.includes('Regulatory & Enforcement History'), 'separate sections');
assert('LPI5-ui', view.includes('2025 reporting vintage') && view.includes('not 2026'), 'HMDA period');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`OK ${results.length} contract tests + source assertions`);
