/**
 * Lender Trust Hub Phase 4 — county quality + sitemap/indexation checks.
 */
import fs from 'fs';

const checks = [];
function ok(name, cond) {
  checks.push({ name, pass: Boolean(cond) });
}
function read(p) {
  return fs.readFileSync(p, 'utf8');
}

const score = read('lib/mortgage/county-quality-score.ts');
ok('scoreCountyQuality', score.includes('scoreCountyQuality'));
ok('tier 1/2/3', score.includes('tier1MinScore') && score.includes('tier2MinScore'));
ok('min in-county gate', score.includes('minInCountyForIndex'));
ok('no population scoring', !score.includes('population'));
ok('promotion policy notes', score.includes('COUNTY_TIER_MOVEMENT_POLICY'));

const tiers = read('lib/mortgage/county-quality-tiers.ts');
ok('noindex tier 3 robots', tiers.includes('index: false'));
ok('sitemap counties helper', tiers.includes('getSitemapCounties'));

const sitemap = read('app/sitemap.ts');
ok('sitemap uses getSitemapCounties', sitemap.includes('getSitemapCounties'));
ok('sitemap filters verified profiles', sitemap.includes('nmlsVerified'));

const countyPage = read('app/local-lenders/[state]/[county]/page.tsx');
ok('county metadata uses quality robots', countyPage.includes('countyRobotsForTier'));
ok('intelligence modules', countyPage.includes('CountyIntelligenceModules'));
ok('generateStaticParams', countyPage.includes('generateStaticParams'));

const intel = read('components/mortgage/county-intelligence-modules.tsx');
ok('no invented rates', !intel.includes('average rate') && !intel.includes('today\'s rates'));
ok('NMLS handoff', intel.includes('nmlsconsumeraccess.org'));
ok('loan program educational only', intel.includes('not a live rate quote') || intel.includes('Educational'));

const stateHub = read('components/mortgage/state-research-sections.tsx');
ok('state research sections', stateHub.includes('Honest inventory'));
ok('premium counties', stateHub.includes('Premium county'));

const housing = read('lib/mortgage/state-housing-resources.ts');
ok('official housing sources only', housing.includes('floridahousing.org'));

for (const c of checks) {
  console.log(`${c.pass ? 'PASS' : 'FAIL'} | ${c.name}`);
}
const failed = checks.filter((c) => !c.pass);
console.log(
  failed.length ? `\n${failed.length} FAILED` : `\nAll ${checks.length} Lender Phase 4 checks passed`
);
process.exit(failed.length ? 1 : 0);
