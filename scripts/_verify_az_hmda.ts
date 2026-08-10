/**
 * Arizona HMDA smoke check (wave 1 + deepen).
 */
import {
  MAJOR_ARIZONA_COUNTY_SLUGS,
  getHmdaCountyEvidence,
  getHmdaLenderEvidenceBySlug,
  loadHmdaStateData,
} from '../lib/hmda';

const az = loadHmdaStateData('AZ');
console.log('AZ code', az.code);
console.log('mappings', az.mappings.length);
console.log('county markets', az.countyMarkets.length);
console.log('county activity rows', az.countyActivity.length);
console.log('majors config', MAJOR_ARIZONA_COUNTY_SLUGS.size);

const mustCounties = [
  'maricopa',
  'pima',
  'pinal',
  'yavapai',
  'apache',
  'la-paz',
  'greenlee',
];
for (const slug of mustCounties) {
  const e = getHmdaCountyEvidence('arizona', slug);
  if (!e) {
    console.error('FAIL missing county', slug);
    process.exitCode = 1;
  } else {
    console.log('OK county', slug, e.originations, e.countyName);
  }
}

const lenders: Array<{ slug: string; expectAzPrimary?: boolean }> = [
  { slug: 'united-wholesale-mortgage' },
  { slug: 'rocket-mortgage' },
  { slug: 'desert-financial-credit-union', expectAzPrimary: true },
  { slug: 'nova-home-loans-west-valley', expectAzPrimary: true },
  { slug: 'oneaz-credit-union-east-valley', expectAzPrimary: true },
  { slug: 'guild-mortgage-west-valley' },
  { slug: 'crosscountry-mortgage-west-valley' },
  { slug: 'dhi-mortgage-buckeye' },
  { slug: 'lennar-mortgage-queen-creek' },
  { slug: 'bank-of-america-mortgage-west-valley' },
  { slug: 'veterans-united-west-valley' },
  { slug: 'freedom-mortgage' },
  { slug: 'pennymac' },
  { slug: 'loandepot' },
  { slug: 'sun-american-mortgage-queen-creek' },
  { slug: 'silverton-mortgage-west-valley' },
  { slug: 'new-american-funding-west-valley' },
];

for (const { slug, expectAzPrimary } of lenders) {
  const e = getHmdaLenderEvidenceBySlug(slug);
  if (!e) {
    console.error('FAIL lender', slug);
    process.exitCode = 1;
    continue;
  }
  const azOrig =
    e.state === 'AZ'
      ? e.stateOriginations
      : e.otherStates?.find((s) => s.state === 'AZ')?.originations;
  console.log(
    'OK lender',
    slug,
    'primary',
    e.state,
    e.stateName,
    'primaryOrig',
    e.stateOriginations,
    'azOrig',
    azOrig ?? 'n/a'
  );
  if (expectAzPrimary && e.state !== 'AZ') {
    console.error('WARN expected AZ primary for', slug, 'got', e.state);
  }
}

// Sanity: deepen re-ids should not show wrong institution labels on AZ primary
const guild = getHmdaLenderEvidenceBySlug('guild-mortgage-west-valley');
if (guild?.state === 'AZ' && guild.stateOriginations < 3000) {
  console.error('WARN guild AZ volume unexpectedly low', guild.stateOriginations);
}

console.log('done');
