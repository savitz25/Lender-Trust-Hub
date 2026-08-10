/**
 * Wisconsin + Minnesota HMDA smoke check (wave 1 + deepen).
 */
import {
  MAJOR_MINNESOTA_COUNTY_SLUGS,
  MAJOR_WISCONSIN_COUNTY_SLUGS,
  getHmdaCountyEvidence,
  getHmdaLenderEvidenceBySlug,
  loadHmdaStateData,
} from '../lib/hmda';

for (const code of ['WI', 'MN'] as const) {
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

const wiCounties = [
  'milwaukee',
  'dane',
  'jefferson',
  'wood',
  'door',
  'dunn',
  'shawano',
];
for (const slug of wiCounties) {
  const e = getHmdaCountyEvidence('wisconsin', slug);
  if (!e) {
    console.error('FAIL WI county', slug);
    process.exitCode = 1;
  } else {
    console.log('OK WI', slug, e.originations);
  }
}

const mnCounties = [
  'hennepin',
  'goodhue',
  'itasca',
  'mcleod',
  'benton',
  'steele',
  'nicollet',
];
for (const slug of mnCounties) {
  const e = getHmdaCountyEvidence('minnesota', slug);
  if (!e) {
    console.error('FAIL MN county', slug);
    process.exitCode = 1;
  } else {
    console.log('OK MN', slug, e.originations);
  }
}

console.log('WI majors config', MAJOR_WISCONSIN_COUNTY_SLUGS.size);
console.log('MN majors config', MAJOR_MINNESOTA_COUNTY_SLUGS.size);

const lenders = [
  'united-wholesale-mortgage',
  'rocket-mortgage',
  'summit-credit-union',
  'university-of-wisconsin-credit-union',
  'landmark-credit-union',
  'associated-bank',
  'bell-bank',
  'trustone-financial-credit-union',
  'affinity-plus-federal-credit-union',
  'wings-financial-credit-union',
  'blaze-credit-union',
  'johnson-bank',
  'nicolet-national-bank',
  'royal-credit-union',
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
