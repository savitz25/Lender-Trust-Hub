/**
 * Idaho + Montana + Wyoming HMDA smoke check.
 */
import {
  MAJOR_IDAHO_COUNTY_SLUGS,
  MAJOR_MONTANA_COUNTY_SLUGS,
  MAJOR_WYOMING_COUNTY_SLUGS,
  getHmdaCountyEvidence,
  getHmdaLenderEvidenceBySlug,
  loadHmdaStateData,
} from '../lib/hmda';

for (const code of ['ID', 'MT', 'WY'] as const) {
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

for (const slug of ['ada', 'canyon', 'kootenai', 'bonneville', 'twin-falls', 'bannock']) {
  const e = getHmdaCountyEvidence('idaho', slug);
  if (!e) {
    console.error('FAIL ID', slug);
    process.exitCode = 1;
  } else console.log('OK ID', slug, e.originations);
}

for (const slug of [
  'yellowstone',
  'gallatin',
  'missoula',
  'flathead',
  'cascade',
  'lewis-and-clark',
]) {
  const e = getHmdaCountyEvidence('montana', slug);
  if (!e) {
    console.error('FAIL MT', slug);
    process.exitCode = 1;
  } else console.log('OK MT', slug, e.originations);
}

for (const slug of ['laramie', 'natrona', 'teton', 'campbell', 'sweetwater']) {
  const e = getHmdaCountyEvidence('wyoming', slug);
  if (!e) {
    console.error('FAIL WY', slug);
    process.exitCode = 1;
  } else console.log('OK WY', slug, e.originations);
}

console.log(
  'majors',
  MAJOR_IDAHO_COUNTY_SLUGS.size,
  MAJOR_MONTANA_COUNTY_SLUGS.size,
  MAJOR_WYOMING_COUNTY_SLUGS.size
);

const lenders = [
  'idaho-central-credit-union',
  'premier-mortgage-resources',
  'westmark-credit-union',
  'glacier-bank',
  'first-interstate-bank',
  'stockman-bank-of-montana',
  'opportunity-bank-of-montana',
  'jonah-bank-of-wyoming',
  'uniwyo-federal-credit-union',
  'meridian-trust-federal-credit-union',
  'blue-federal-credit-union',
  'rocket-mortgage',
  'united-wholesale-mortgage',
  'guild-mortgage-metrowest',
  'mountain-america-federal-credit-union',
];
for (const slug of lenders) {
  const e = getHmdaLenderEvidenceBySlug(slug);
  if (!e) {
    console.error('FAIL lender', slug);
    process.exitCode = 1;
  } else console.log('OK lender', slug, e.state, e.stateOriginations);
}

console.log('done');
