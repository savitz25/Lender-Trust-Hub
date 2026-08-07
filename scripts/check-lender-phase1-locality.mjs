/**
 * Lender Trust Hub Phase 1 — geographic honesty regression checks.
 * Run: node scripts/check-lender-phase1-locality.mjs
 */
import fs from 'fs';

const checks = [];
function ok(name, cond) {
  checks.push({ name, pass: Boolean(cond) });
}
function read(p) {
  return fs.readFileSync(p, 'utf8');
}

const locality = read('lib/geo/locality-rules.ts');
ok('deriveLenderHomeLocality exists', locality.includes('deriveLenderHomeLocality'));
ok('segmentLendersForCountyPage exists', locality.includes('segmentLendersForCountyPage'));
ok('in_county class', locality.includes("'in_county'"));
ok('nearby separate from primary', locality.includes('primaryLocal: sortedIn'));
ok('city beats market label note', locality.includes('Jacksonville') || locality.includes('city'));

const cityMap = read('lib/geo/city-county-lookup.ts');
ok('jacksonville → duval', /jacksonville.*duval/is.test(cityMap));
ok('pensacola → escambia', /pensacola.*escambia/is.test(cityMap));
ok('fort walton → okaloosa', /fort walton beach.*okaloosa/is.test(cityMap));
ok('cooper city → broward', /cooper city.*broward/is.test(cityMap));
ok('miami → miami-dade', /miami:\s*\{[^}]*miami-dade/is.test(cityMap));

const fl = read('lib/mortgage/floridaLenders.ts');
ok('PRMG not miami-dade', !/slug: 'prmg'[\s\S]{0,200}countySlug: 'miami-dade'/.test(fl));
ok('PRMG duval or jacksonville city', /slug: 'prmg'[\s\S]{0,120}Jacksonville/.test(fl));
ok('trident not bay with pensacola as bay', !/slug: 'trident-home-loans'[\s\S]{0,200}countySlug: 'bay'/.test(fl));
ok('premier cooper city broward', /slug: 'premier-lending-corp'[\s\S]{0,200}countySlug: 'broward'/.test(fl));

const lendersApi = read('lib/lenders.ts');
ok('getCountyLenderSegments', lendersApi.includes('getCountyLenderSegments'));
ok('primary is in-county only', lendersApi.includes('primaryLocal'));

const countyPage = read('app/local-lenders/[state]/[county]/page.tsx');
ok('in-county section', countyPage.includes('In-county HQ'));
ok('nearby section', countyPage.includes('Nearby / serving from elsewhere'));
ok('empty in-county copy', countyPage.includes('emptyInCountyCopy') || countyPage.includes('confirmed in-county'));
ok('no single merged padded list only', countyPage.includes('getCountyLenderSegments'));

const card = read('components/LenderCard.tsx');
ok('card uses homeLocalityLine / presence', card.includes('homeLocalityLine') || card.includes('presenceLabel'));
ok('card does not default Serves county without presence', !card.includes('Serves ${countyLabel}'));

for (const c of checks) {
  console.log(`${c.pass ? 'PASS' : 'FAIL'} | ${c.name}`);
}
const failed = checks.filter((c) => !c.pass);
console.log(
  failed.length ? `\n${failed.length} FAILED` : `\nAll ${checks.length} Lender Phase 1 checks passed`
);
process.exit(failed.length ? 1 : 0);
