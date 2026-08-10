/**
 * Missouri + Kentucky HMDA smoke check.
 */
import {
  MAJOR_KENTUCKY_COUNTY_SLUGS,
  MAJOR_MISSOURI_COUNTY_SLUGS,
  getHmdaCountyEvidence,
  getHmdaLenderEvidenceBySlug,
  loadHmdaStateData,
} from '../lib/hmda';

for (const code of ['MO', 'KY'] as const) {
  const b = loadHmdaStateData(code);
  console.log(
    code,
    'mappings',
    b.mappings.length,
    'counties',
    b.countyMarkets.length,
    'activity',
    b.countyActivity.length
  );
}

const moCounties = [
  'st-louis',
  'jackson',
  'st-charles',
  'st-louis-city',
  'greene',
  'boone',
  'platte',
];
for (const slug of moCounties) {
  const e = getHmdaCountyEvidence('missouri', slug);
  if (!e) {
    console.error('FAIL MO county', slug);
    process.exitCode = 1;
  } else {
    console.log('OK MO', slug, e.originations);
  }
}

const kyCounties = [
  'jefferson',
  'fayette',
  'kenton',
  'boone',
  'warren',
  'hardin',
  'daviess',
];
for (const slug of kyCounties) {
  const e = getHmdaCountyEvidence('kentucky', slug);
  if (!e) {
    console.error('FAIL KY county', slug);
    process.exitCode = 1;
  } else {
    console.log('OK KY', slug, e.originations);
  }
}

console.log('MO majors config', MAJOR_MISSOURI_COUNTY_SLUGS.size);
console.log('KY majors config', MAJOR_KENTUCKY_COUNTY_SLUGS.size);

const lenders = [
  'rocket-mortgage',
  'united-wholesale-mortgage',
  'flat-branch-mortgage',
  'central-trust-bank',
  'communityamerica-federal-credit-union',
  'das-acquisition-company',
  'commerce-bank',
  'arvest-bank',
  'stockton-mortgage',
  'community-trust-bank',
  'stock-yards-bank-trust',
  'commonwealth-federal-credit-union',
  'republic-bank-trust-kentucky',
  'eagle-home-mortgage',
  'german-american-bank',
  'veterans-united-west-valley',
];
for (const slug of lenders) {
  const e = getHmdaLenderEvidenceBySlug(slug);
  if (!e) {
    console.error('FAIL lender', slug);
    process.exitCode = 1;
  } else {
    console.log('OK lender', slug, e.state, e.stateName, e.stateOriginations);
  }
}

console.log('done');
