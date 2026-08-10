/**
 * Oregon + Washington HMDA smoke check.
 */
import {
  MAJOR_OREGON_COUNTY_SLUGS,
  MAJOR_WASHINGTON_COUNTY_SLUGS,
  getHmdaCountyEvidence,
  getHmdaLenderEvidenceBySlug,
  loadHmdaStateData,
} from '../lib/hmda';

for (const code of ['OR', 'WA'] as const) {
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

const orCounties = [
  'multnomah',
  'washington',
  'clackamas',
  'lane',
  'deschutes',
  'jackson',
  'marion',
];
for (const slug of orCounties) {
  const e = getHmdaCountyEvidence('oregon', slug);
  if (!e) {
    console.error('FAIL OR county', slug);
    process.exitCode = 1;
  } else {
    console.log('OK OR', slug, e.originations);
  }
}

const waCounties = [
  'king',
  'pierce',
  'snohomish',
  'spokane',
  'clark',
  'thurston',
  'whatcom',
];
for (const slug of waCounties) {
  const e = getHmdaCountyEvidence('washington', slug);
  if (!e) {
    console.error('FAIL WA county', slug);
    process.exitCode = 1;
  } else {
    console.log('OK WA', slug, e.originations);
  }
}

console.log('OR majors config', MAJOR_OREGON_COUNTY_SLUGS.size);
console.log('WA majors config', MAJOR_WASHINGTON_COUNTY_SLUGS.size);

const lenders = [
  'rocket-mortgage',
  'united-wholesale-mortgage',
  'onpoint-community-credit-union',
  'boeing-employees-credit-union',
  'columbia-bank-pnw',
  'banner-bank',
  'washington-state-employees-credit-union',
  'gesa-credit-union',
  'spokane-teachers-credit-union',
  'rogue-credit-union',
  'first-tech-federal-credit-union',
  'selco-community-credit-union',
  'oregon-state-credit-union',
  'evergreen-moneysource-mortgage',
  'guild-mortgage-metrowest',
  'movement-mortgage-myrtle-beach',
  'bank-of-america-mortgage-west-valley',
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
