/**
 * Quick Arizona HMDA smoke check (run with tsx / project node).
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

const must = ['maricopa', 'pima', 'pinal', 'yavapai', 'mohave', 'yuma', 'coconino'];
for (const slug of must) {
  const e = getHmdaCountyEvidence('arizona', slug);
  if (!e) {
    console.error('FAIL missing county', slug);
    process.exitCode = 1;
  } else {
    console.log('OK county', slug, e.originations, e.countyName);
  }
}

const lenders = [
  'united-wholesale-mortgage',
  'rocket-mortgage',
  'desert-financial-credit-union',
  'nova-home-loans-west-valley',
  'oneaz-credit-union-east-valley',
  'guild-mortgage-west-valley',
];
for (const slug of lenders) {
  const e = getHmdaLenderEvidenceBySlug(slug);
  if (!e) {
    console.error('FAIL lender', slug);
    process.exitCode = 1;
  } else {
    const azSlice = e.otherStates?.find((s) => s.state === 'AZ') || (e.state === 'AZ' ? e : null);
    console.log(
      'OK lender',
      slug,
      'primary',
      e.state,
      e.stateName,
      'orig',
      e.stateOriginations,
      azSlice ? `has AZ context` : ''
    );
  }
}

console.log('done');
