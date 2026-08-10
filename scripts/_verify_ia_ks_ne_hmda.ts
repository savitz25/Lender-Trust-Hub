/**
 * Iowa + Kansas + Nebraska HMDA smoke check.
 */
import {
  MAJOR_IOWA_COUNTY_SLUGS,
  MAJOR_KANSAS_COUNTY_SLUGS,
  MAJOR_NEBRASKA_COUNTY_SLUGS,
  getHmdaCountyEvidence,
  getHmdaLenderEvidenceBySlug,
  loadHmdaStateData,
} from '../lib/hmda';

for (const code of ['IA', 'KS', 'NE'] as const) {
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

for (const slug of ['polk', 'linn', 'scott', 'johnson', 'black-hawk', 'woodbury', 'dallas']) {
  const e = getHmdaCountyEvidence('iowa', slug);
  if (!e) {
    console.error('FAIL IA', slug);
    process.exitCode = 1;
  } else console.log('OK IA', slug, e.originations);
}

for (const slug of ['johnson', 'sedgwick', 'shawnee', 'douglas', 'wyandotte', 'leavenworth']) {
  const e = getHmdaCountyEvidence('kansas', slug);
  if (!e) {
    console.error('FAIL KS', slug);
    process.exitCode = 1;
  } else console.log('OK KS', slug, e.originations);
}

for (const slug of ['douglas', 'lancaster', 'sarpy', 'hall', 'buffalo', 'scotts-bluff']) {
  const e = getHmdaCountyEvidence('nebraska', slug);
  if (!e) {
    console.error('FAIL NE', slug);
    process.exitCode = 1;
  } else console.log('OK NE', slug, e.originations);
}

console.log('majors', MAJOR_IOWA_COUNTY_SLUGS.size, MAJOR_KANSAS_COUNTY_SLUGS.size, MAJOR_NEBRASKA_COUNTY_SLUGS.size);

const lenders = [
  'greenstate-credit-union',
  'veridian-credit-union',
  'hills-bank-and-trust',
  'dupaco-community-credit-union',
  'iowa-bankers-mortgage',
  'capitol-federal-savings-bank',
  'credit-union-of-america',
  'meritrust-federal-credit-union',
  'pinnacle-bank-nebraska',
  'first-national-bank-of-omaha',
  'west-gate-bank',
  'union-bank-and-trust-nebraska',
  'centris-federal-credit-union',
  'rocket-mortgage',
  'communityamerica-federal-credit-union',
  'flat-branch-mortgage',
];
for (const slug of lenders) {
  const e = getHmdaLenderEvidenceBySlug(slug);
  if (!e) {
    console.error('FAIL lender', slug);
    process.exitCode = 1;
  } else console.log('OK lender', slug, e.state, e.stateOriginations);
}

console.log('done');
