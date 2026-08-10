/**
 * Stabilize QA: multi-state HMDA evidence + analyzer option integrity.
 *
 *   npx tsx scripts/qa-stabilize-fl-tx-ga.ts
 */
import { getLenderBySlug } from '../lib/lenders';
import {
  MAJOR_CALIFORNIA_COUNTY_SLUGS,
  MAJOR_FLORIDA_COUNTY_SLUGS,
  MAJOR_GEORGIA_COUNTY_SLUGS,
  MAJOR_NORTH_CAROLINA_COUNTY_SLUGS,
  MAJOR_SOUTH_CAROLINA_COUNTY_SLUGS,
  MAJOR_TEXAS_COUNTY_SLUGS,
  getHmdaCountyEvidence,
  getHmdaLenderEvidenceBySlug,
  loadHmdaStateData,
} from '../lib/hmda';
import { analyzeLoanEstimate } from '../lib/tools/loan-estimate-analyzer/analyze';
import { emptyLoanEstimateInputs } from '../lib/tools/loan-estimate-analyzer/defaults';
import {
  getAnalyzerCountyOptions,
  getAnalyzerLenderOptions,
} from '../lib/tools/loan-estimate-analyzer/options';
import { parseAnalyzerCountyOption } from '../lib/tools/loan-estimate-analyzer/county-option';
import { getHmdaCountyEvidence as getCounty } from '../lib/hmda';

const SPOT_COUNTIES: { state: string; county: string }[] = [
  { state: 'florida', county: 'miami-dade' },
  { state: 'florida', county: 'broward' },
  { state: 'florida', county: 'palm-beach' },
  { state: 'florida', county: 'hillsborough' },
  { state: 'florida', county: 'orange' },
  { state: 'texas', county: 'harris' },
  { state: 'texas', county: 'dallas' },
  { state: 'texas', county: 'tarrant' },
  { state: 'texas', county: 'travis' },
  { state: 'texas', county: 'bexar' },
  { state: 'georgia', county: 'fulton' },
  { state: 'georgia', county: 'gwinnett' },
  { state: 'georgia', county: 'cobb' },
  { state: 'georgia', county: 'dekalb' },
  { state: 'georgia', county: 'chatham' },
  { state: 'california', county: 'los-angeles' },
  { state: 'california', county: 'san-diego' },
  { state: 'california', county: 'orange' },
  { state: 'california', county: 'riverside' },
  { state: 'california', county: 'santa-clara' },
  { state: 'california', county: 'el-dorado' },
  { state: 'california', county: 'merced' },
  { state: 'california', county: 'santa-cruz' },
  { state: 'south-carolina', county: 'horry' },
  { state: 'south-carolina', county: 'greenville' },
  { state: 'south-carolina', county: 'charleston' },
  { state: 'south-carolina', county: 'spartanburg' },
  { state: 'south-carolina', county: 'richland' },
  { state: 'south-carolina', county: 'sumter' },
  { state: 'south-carolina', county: 'pickens' },
  { state: 'south-carolina', county: 'oconee' },
  { state: 'south-carolina', county: 'orangeburg' },
  { state: 'south-carolina', county: 'greenwood' },
];

const SPOT_LENDERS = [
  'rocket-mortgage',
  'united-wholesale-mortgage',
  'synovus-bank',
  'truist-bank',
  'regions-bank',
  'ameris-bank',
  'wells-fargo-bank',
  'guild-mortgage-silicon-valley',
  'sun-west-mortgage',
  'kind-lending',
  'amwest-funding',
  'american-financial-network',
  'movement-mortgage-myrtle-beach',
  'southstate-bank',
  'silverton-mortgage-myrtle-beach',
  'atlantic-bay-mortgage-charleston',
  'first-citizens-bank',
  'lower',
  'nvr-mortgage',
  'carolina-one-mortgage',
  'gateway-mortgage-myrtle-beach',
];

let failures = 0;
function ok(label: string) {
  console.log(`  OK  ${label}`);
}
function fail(label: string) {
  failures++;
  console.log(`  FAIL ${label}`);
}

function checkMajors(
  code: 'FL' | 'TX' | 'GA' | 'CA' | 'NC' | 'SC',
  stateSlug: string,
  majors: ReadonlySet<string>
) {
  const bundle = loadHmdaStateData(code);
  const marketSlugs = new Set(bundle.countyMarkets.map((c) => c.countySlug));
  let missing = 0;
  for (const slug of majors) {
    if (!marketSlugs.has(slug)) {
      fail(`${code} major ${slug} missing from county markets`);
      missing++;
    }
  }
  if (missing === 0) ok(`${code} all ${majors.size} major counties present in markets`);

  for (const slug of majors) {
    const e = getHmdaCountyEvidence(stateSlug, slug);
    if (!e) {
      fail(`${stateSlug}/${slug} evidence null`);
      continue;
    }
    if (e.stateSlug !== stateSlug) {
      fail(`${stateSlug}/${slug} wrong stateSlug=${e.stateSlug}`);
    }
    if (e.applications <= 0 || e.originations <= 0) {
      fail(`${stateSlug}/${slug} non-positive apps/orig`);
    }
  }
  ok(`${code} getHmdaCountyEvidence for all majors`);
}

function main() {
  console.log('=== County majors ===');
  checkMajors('FL', 'florida', MAJOR_FLORIDA_COUNTY_SLUGS);
  checkMajors('TX', 'texas', MAJOR_TEXAS_COUNTY_SLUGS);
  checkMajors('GA', 'georgia', MAJOR_GEORGIA_COUNTY_SLUGS);
  checkMajors('CA', 'california', MAJOR_CALIFORNIA_COUNTY_SLUGS);
  checkMajors('NC', 'north-carolina', MAJOR_NORTH_CAROLINA_COUNTY_SLUGS);
  checkMajors('SC', 'south-carolina', MAJOR_SOUTH_CAROLINA_COUNTY_SLUGS);

  console.log('\n=== Spot counties ===');
  for (const { state, county } of SPOT_COUNTIES) {
    const e = getHmdaCountyEvidence(state, county);
    if (!e) {
      fail(`${state}/${county} no evidence`);
      continue;
    }
    if (e.stateSlug !== state) {
      fail(`${state}/${county} state bleed: ${e.stateSlug}`);
      continue;
    }
    // Linked top lenders must exist in catalog
    for (const l of e.topMatchedLenders) {
      if (l.slug && !getLenderBySlug(l.slug)) {
        fail(`${state}/${county} top lender slug missing in catalog: ${l.slug}`);
      }
    }
    ok(`${state}/${county} apps=${e.applications} top=${e.topMatchedLenders.length}`);
  }

  console.log('\n=== Spot lenders ===');
  for (const slug of SPOT_LENDERS) {
    const e = getHmdaLenderEvidenceBySlug(slug);
    if (!e) {
      fail(`lender ${slug} no evidence`);
      continue;
    }
    if (!['FL', 'TX', 'GA', 'CA', 'NC', 'SC'].includes(e.state)) {
      fail(`lender ${slug} unexpected state ${e.state}`);
      continue;
    }
    for (const c of e.countyShares) {
      const ce = getHmdaCountyEvidence(e.stateSlug, c.countySlug);
      if (!ce) {
        // county may be major but share from activity — should still resolve if major
        if (
          (e.stateSlug === 'florida' && MAJOR_FLORIDA_COUNTY_SLUGS.has(c.countySlug)) ||
          (e.stateSlug === 'texas' && MAJOR_TEXAS_COUNTY_SLUGS.has(c.countySlug)) ||
          (e.stateSlug === 'georgia' && MAJOR_GEORGIA_COUNTY_SLUGS.has(c.countySlug)) ||
          (e.stateSlug === 'california' && MAJOR_CALIFORNIA_COUNTY_SLUGS.has(c.countySlug)) ||
          (e.stateSlug === 'north-carolina' &&
            MAJOR_NORTH_CAROLINA_COUNTY_SLUGS.has(c.countySlug)) ||
          (e.stateSlug === 'south-carolina' &&
            MAJOR_SOUTH_CAROLINA_COUNTY_SLUGS.has(c.countySlug))
        ) {
          fail(`lender ${slug} county share link broken ${e.stateSlug}/${c.countySlug}`);
        }
      }
    }
    ok(
      `lender ${slug} primary=${e.stateName} orig=${e.stateOriginations} others=${e.otherStates?.length ?? 0}`
    );
  }

  console.log('\n=== Analyzer options + multi-state county parse ===');
  const lenders = getAnalyzerLenderOptions();
  const counties = getAnalyzerCountyOptions();
  if (lenders.length < 20) fail(`few lenders: ${lenders.length}`);
  else ok(`lenders=${lenders.length}`);
  if (counties.length < 40) fail(`few counties: ${counties.length}`);
  else ok(`counties=${counties.length}`);

  for (const key of [
    'miami-dade',
    'tx:harris',
    'ga:fulton',
    'ca:los-angeles',
    'sc:horry',
  ]) {
    const found = counties.find((c) => c.slug === key);
    if (!found) fail(`options missing county ${key}`);
    else {
      const p = parseAnalyzerCountyOption(key);
      const e = p ? getCounty(p.stateSlug, p.countySlug) : null;
      if (!e) fail(`options county ${key} evidence null`);
      else ok(`options county ${key} → ${e.stateSlug}`);
    }
  }
  for (const key of ['rocket-mortgage', 'synovus-bank']) {
    if (!lenders.some((l) => l.slug === key)) fail(`options missing lender ${key}`);
    else ok(`options lender ${key}`);
  }

  // analyze.ts multi-state county path
  const gaAnalysis = analyzeLoanEstimate({
    ...emptyLoanEstimateInputs(),
    loanAmount: 300000,
    interestRate: 6.5,
    countySlug: 'ga:fulton',
    lenderSlug: 'synovus-bank',
  });
  if (!gaAnalysis.hmdaCounty || gaAnalysis.hmdaCounty.stateSlug !== 'georgia') {
    fail('analyzeLoanEstimate ga:fulton did not resolve Georgia');
  } else ok('analyzeLoanEstimate ga:fulton → Georgia');
  if (!gaAnalysis.hmdaLender || gaAnalysis.hmdaLender.primaryStateCode !== 'GA') {
    // primary may still be GA for synovus
    if (!gaAnalysis.hmdaLender) fail('analyzeLoanEstimate synovus missing');
    else ok(`analyzeLoanEstimate synovus primary=${gaAnalysis.hmdaLender.primaryStateCode}`);
  } else ok('analyzeLoanEstimate synovus primary=GA');

  const txAnalysis = analyzeLoanEstimate({
    ...emptyLoanEstimateInputs(),
    loanAmount: 300000,
    interestRate: 6.5,
    countySlug: 'tx:harris',
  });
  if (!txAnalysis.hmdaCounty || txAnalysis.hmdaCounty.stateSlug !== 'texas') {
    fail('analyzeLoanEstimate tx:harris did not resolve Texas');
  } else ok('analyzeLoanEstimate tx:harris → Texas');

  const caAnalysis = analyzeLoanEstimate({
    ...emptyLoanEstimateInputs(),
    loanAmount: 300000,
    interestRate: 6.5,
    countySlug: 'ca:los-angeles',
  });
  if (!caAnalysis.hmdaCounty || caAnalysis.hmdaCounty.stateSlug !== 'california') {
    fail('analyzeLoanEstimate ca:los-angeles did not resolve California');
  } else ok('analyzeLoanEstimate ca:los-angeles → California');

  const scAnalysis = analyzeLoanEstimate({
    ...emptyLoanEstimateInputs(),
    loanAmount: 300000,
    interestRate: 6.5,
    countySlug: 'sc:horry',
  });
  if (!scAnalysis.hmdaCounty || scAnalysis.hmdaCounty.stateSlug !== 'south-carolina') {
    fail('analyzeLoanEstimate sc:horry did not resolve South Carolina');
  } else ok('analyzeLoanEstimate sc:horry → South Carolina');

  console.log(`\n=== Result: ${failures === 0 ? 'PASS' : `FAIL (${failures})`} ===`);
  process.exit(failures === 0 ? 0 : 1);
}

try {
  main();
} catch (e) {
  console.error(e);
  process.exit(1);
}
