/**
 * Multi-state stabilize QA: HMDA evidence + analyzer integrity.
 * FL · TX · GA · CA · NC · SC · NJ · NY · PA
 *
 *   npx tsx scripts/qa-stabilize-fl-tx-ga.ts
 */
import { getLenderBySlug } from '../lib/lenders';
import {
  MAJOR_CALIFORNIA_COUNTY_SLUGS,
  MAJOR_FLORIDA_COUNTY_SLUGS,
  MAJOR_GEORGIA_COUNTY_SLUGS,
  MAJOR_NEW_JERSEY_COUNTY_SLUGS,
  MAJOR_NEW_YORK_COUNTY_SLUGS,
  MAJOR_NORTH_CAROLINA_COUNTY_SLUGS,
  MAJOR_PENNSYLVANIA_COUNTY_SLUGS,
  MAJOR_SOUTH_CAROLINA_COUNTY_SLUGS,
  MAJOR_TEXAS_COUNTY_SLUGS,
  type HmdaStateCode,
  getHmdaCountyEvidence,
  getHmdaLenderEvidenceBySlug,
  loadAllHmdaStateData,
  loadHmdaStateData,
} from '../lib/hmda';
import { getCfpbComplaintEvidenceBySlug } from '../lib/cfpb';
import { analyzeLoanEstimate } from '../lib/tools/loan-estimate-analyzer/analyze';
import { emptyLoanEstimateInputs } from '../lib/tools/loan-estimate-analyzer/defaults';
import {
  getAnalyzerCountyOptions,
  getAnalyzerLenderOptions,
} from '../lib/tools/loan-estimate-analyzer/options';
import {
  analyzerCountyOptionSlug,
  parseAnalyzerCountyOption,
} from '../lib/tools/loan-estimate-analyzer/county-option';
import { getHmdaCountyEvidence as getCounty } from '../lib/hmda';

/** Prompt-required high-volume spots + deepen samples */
const SPOT_COUNTIES: { state: string; county: string }[] = [
  // FL
  { state: 'florida', county: 'miami-dade' },
  { state: 'florida', county: 'broward' },
  { state: 'florida', county: 'palm-beach' },
  { state: 'florida', county: 'hillsborough' },
  { state: 'florida', county: 'orange' },
  // TX
  { state: 'texas', county: 'harris' },
  { state: 'texas', county: 'dallas' },
  { state: 'texas', county: 'tarrant' },
  { state: 'texas', county: 'travis' },
  { state: 'texas', county: 'bexar' },
  // GA
  { state: 'georgia', county: 'fulton' },
  { state: 'georgia', county: 'gwinnett' },
  { state: 'georgia', county: 'cobb' },
  { state: 'georgia', county: 'dekalb' },
  { state: 'georgia', county: 'chatham' },
  // CA
  { state: 'california', county: 'los-angeles' },
  { state: 'california', county: 'san-diego' },
  { state: 'california', county: 'orange' },
  { state: 'california', county: 'santa-clara' },
  { state: 'california', county: 'sacramento' },
  // NC
  { state: 'north-carolina', county: 'wake' },
  { state: 'north-carolina', county: 'mecklenburg' },
  { state: 'north-carolina', county: 'guilford' },
  { state: 'north-carolina', county: 'durham' },
  { state: 'north-carolina', county: 'buncombe' },
  // SC
  { state: 'south-carolina', county: 'horry' },
  { state: 'south-carolina', county: 'greenville' },
  { state: 'south-carolina', county: 'charleston' },
  { state: 'south-carolina', county: 'richland' },
  { state: 'south-carolina', county: 'york' },
  // SC deepen / hygiene
  { state: 'south-carolina', county: 'sumter' },
  { state: 'south-carolina', county: 'pickens' },
  { state: 'south-carolina', county: 'oconee' },
  // NJ
  { state: 'new-jersey', county: 'bergen' },
  { state: 'new-jersey', county: 'middlesex' },
  { state: 'new-jersey', county: 'essex' },
  { state: 'new-jersey', county: 'hudson' },
  { state: 'new-jersey', county: 'monmouth' },
  { state: 'new-jersey', county: 'ocean' },
  { state: 'new-jersey', county: 'union' },
  { state: 'new-jersey', county: 'morris' },
  { state: 'new-jersey', county: 'passaic' },
  { state: 'new-jersey', county: 'somerset' },
  // NJ deepen
  { state: 'new-jersey', county: 'cumberland' },
  { state: 'new-jersey', county: 'warren' },
  { state: 'new-jersey', county: 'salem' },
  // NY
  { state: 'new-york', county: 'kings' },
  { state: 'new-york', county: 'queens' },
  { state: 'new-york', county: 'new-york-county' },
  { state: 'new-york', county: 'suffolk' },
  { state: 'new-york', county: 'nassau' },
  { state: 'new-york', county: 'westchester' },
  { state: 'new-york', county: 'erie' },
  { state: 'new-york', county: 'monroe' },
  { state: 'new-york', county: 'bronx' },
  { state: 'new-york', county: 'richmond' },
  // PA
  { state: 'pennsylvania', county: 'philadelphia' },
  { state: 'pennsylvania', county: 'allegheny' },
  { state: 'pennsylvania', county: 'montgomery' },
  { state: 'pennsylvania', county: 'bucks' },
  { state: 'pennsylvania', county: 'delaware' },
  { state: 'pennsylvania', county: 'lancaster' },
  { state: 'pennsylvania', county: 'chester' },
  { state: 'pennsylvania', county: 'york' },
  { state: 'pennsylvania', county: 'berks' },
  { state: 'pennsylvania', county: 'lehigh' },
  // PA deepen
  { state: 'pennsylvania', county: 'blair' },
  { state: 'pennsylvania', county: 'pike' },
  { state: 'pennsylvania', county: 'carbon' },
  { state: 'pennsylvania', county: 'lawrence' },
  { state: 'pennsylvania', county: 'indiana' },
  { state: 'pennsylvania', county: 'somerset' },
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
  'jpmorgan-chase-bank',
  'freedom-mortgage',
  'loandepot',
  'guild-mortgage-nj-suburbs',
  'citizens-bank',
  'td-bank',
  'pnc-bank',
  'silverton-mortgage-wayne-nj',
  'anniemac-home-mortgage',
  'oceanfirst-bank',
  'valley-national-bank',
  'mt-bank',
  'advisors-mortgage-group',
  'absolute-home-mortgage',
  'embrace-home-loans',
  'nfm-lending',
  'columbia-bank-nj',
  // PA deepen
  'fulton-bank',
  'first-national-bank-of-pennsylvania',
  'first-commonwealth-bank',
  'northwest-bank',
  'huntington-national-bank',
  'univest-bank',
  'wsfs-bank',
  'police-fire-federal-credit-union',
  'mortgage-america',
  'emm-loans',
  'hma-mortgage',
  'american-heritage-federal-credit-union',
];

/** National lenders expected to have both HMDA + CFPB when snapshot present */
const COEXIST_LENDERS = [
  'rocket-mortgage',
  'united-wholesale-mortgage',
  'wells-fargo-bank',
  'truist-bank',
  'freedom-mortgage',
  'loandepot',
  'jpmorgan-chase-bank',
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
  code: HmdaStateCode,
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
  console.log('=== County majors (9 states) ===');
  checkMajors('FL', 'florida', MAJOR_FLORIDA_COUNTY_SLUGS);
  checkMajors('TX', 'texas', MAJOR_TEXAS_COUNTY_SLUGS);
  checkMajors('GA', 'georgia', MAJOR_GEORGIA_COUNTY_SLUGS);
  checkMajors('CA', 'california', MAJOR_CALIFORNIA_COUNTY_SLUGS);
  checkMajors('NC', 'north-carolina', MAJOR_NORTH_CAROLINA_COUNTY_SLUGS);
  checkMajors('SC', 'south-carolina', MAJOR_SOUTH_CAROLINA_COUNTY_SLUGS);
  checkMajors('NJ', 'new-jersey', MAJOR_NEW_JERSEY_COUNTY_SLUGS);
  checkMajors('NY', 'new-york', MAJOR_NEW_YORK_COUNTY_SLUGS);
  checkMajors('PA', 'pennsylvania', MAJOR_PENNSYLVANIA_COUNTY_SLUGS);

  console.log('\n=== Mapping slugs in catalog ===');
  let mapMiss = 0;
  for (const b of loadAllHmdaStateData()) {
    for (const m of b.mappings) {
      if (m.ourLenderSlug && !getLenderBySlug(m.ourLenderSlug)) {
        fail(`catalog missing ${b.config.code} ${m.ourLenderSlug}`);
        mapMiss++;
      }
    }
  }
  if (mapMiss === 0) ok('all HMDA mapping slugs resolve in directory catalog');

  console.log('\n=== Spot counties (prompt matrix) ===');
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
    for (const l of e.topMatchedLenders) {
      if (l.slug && !getLenderBySlug(l.slug)) {
        fail(`${state}/${county} top lender slug missing in catalog: ${l.slug}`);
      }
    }
    ok(`${state}/${county} apps=${e.applications} top=${e.topMatchedLenders.length}`);
  }

  // Orange collision: bare = FL, ca: = California
  const flOrange = parseAnalyzerCountyOption('orange');
  const caOrange = parseAnalyzerCountyOption('ca:orange');
  if (flOrange?.stateSlug !== 'florida' || flOrange.countySlug !== 'orange') {
    fail('bare orange should parse as Florida');
  } else ok('bare orange → Florida (no CA bleed)');
  if (caOrange?.stateSlug !== 'california' || caOrange.countySlug !== 'orange') {
    fail('ca:orange should parse as California');
  } else ok('ca:orange → California');

  console.log('\n=== Spot lenders ===');
  for (const slug of SPOT_LENDERS) {
    const e = getHmdaLenderEvidenceBySlug(slug);
    if (!e) {
      fail(`lender ${slug} no evidence`);
      continue;
    }
    if (!['FL', 'TX', 'GA', 'CA', 'NC', 'SC', 'NJ', 'NY', 'PA'].includes(e.state)) {
      fail(`lender ${slug} unexpected state ${e.state}`);
      continue;
    }
    for (const c of e.countyShares) {
      const ce = getHmdaCountyEvidence(e.stateSlug, c.countySlug);
      if (!ce) {
        if (
          (e.stateSlug === 'florida' && MAJOR_FLORIDA_COUNTY_SLUGS.has(c.countySlug)) ||
          (e.stateSlug === 'texas' && MAJOR_TEXAS_COUNTY_SLUGS.has(c.countySlug)) ||
          (e.stateSlug === 'georgia' && MAJOR_GEORGIA_COUNTY_SLUGS.has(c.countySlug)) ||
          (e.stateSlug === 'california' && MAJOR_CALIFORNIA_COUNTY_SLUGS.has(c.countySlug)) ||
          (e.stateSlug === 'north-carolina' &&
            MAJOR_NORTH_CAROLINA_COUNTY_SLUGS.has(c.countySlug)) ||
          (e.stateSlug === 'south-carolina' &&
            MAJOR_SOUTH_CAROLINA_COUNTY_SLUGS.has(c.countySlug)) ||
          (e.stateSlug === 'new-jersey' && MAJOR_NEW_JERSEY_COUNTY_SLUGS.has(c.countySlug)) ||
          (e.stateSlug === 'new-york' && MAJOR_NEW_YORK_COUNTY_SLUGS.has(c.countySlug)) ||
          (e.stateSlug === 'pennsylvania' && MAJOR_PENNSYLVANIA_COUNTY_SLUGS.has(c.countySlug))
        ) {
          fail(`lender ${slug} county share link broken ${e.stateSlug}/${c.countySlug}`);
        }
      }
    }
    ok(
      `lender ${slug} primary=${e.stateName} orig=${e.stateOriginations} others=${e.otherStates?.length ?? 0}`
    );
  }

  console.log('\n=== CFPB + HMDA coexistence ===');
  for (const slug of COEXIST_LENDERS) {
    const h = getHmdaLenderEvidenceBySlug(slug);
    if (!h) {
      fail(`coexist hmda missing ${slug}`);
      continue;
    }
    const catalog = getLenderBySlug(slug);
    const c = getCfpbComplaintEvidenceBySlug(slug, { nmlsId: catalog?.nmlsId });
    if (!c) {
      // Snapshot may be incomplete for some names — soft fail only if mapped national
      fail(`coexist cfpb missing for ${slug} (mapping or snapshot gap)`);
    } else {
      ok(`coexist ${slug} hmda=${h.state} cfpb companies=${c.companiesMatched.length}`);
    }
  }

  console.log('\n=== Analyzer options + multi-state county parse ===');
  const lenders = getAnalyzerLenderOptions();
  const counties = getAnalyzerCountyOptions();
  if (lenders.length < 20) fail(`few lenders: ${lenders.length}`);
  else ok(`lenders=${lenders.length}`);
  if (counties.length < 140) fail(`few counties: ${counties.length}`);
  else ok(`counties=${counties.length}`);

  const seenOpts = new Set<string>();
  for (const o of counties) {
    if (seenOpts.has(o.slug)) fail(`duplicate county option ${o.slug}`);
    seenOpts.add(o.slug);
  }
  ok('county option slugs unique');

  for (const key of [
    'miami-dade',
    'tx:harris',
    'ga:fulton',
    'ca:los-angeles',
    'ca:sacramento',
    'nc:wake',
    'nc:mecklenburg',
    'sc:horry',
    'sc:york',
    'nj:bergen',
    'nj:ocean',
    'nj:hudson',
    'ny:kings',
    'ny:suffolk',
    'pa:philadelphia',
    'pa:allegheny',
    'pa:montgomery',
    'ca:orange',
    'orange',
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
  for (const key of ['rocket-mortgage', 'synovus-bank', 'first-citizens-bank', 'southstate-bank']) {
    if (!lenders.some((l) => l.slug === key)) fail(`options missing lender ${key}`);
    else ok(`options lender ${key}`);
  }

  // County page prefill helper
  if (analyzerCountyOptionSlug('florida', 'orange') !== 'orange') {
    fail('prefill FL orange');
  } else ok('prefill FL orange = bare slug');
  if (analyzerCountyOptionSlug('california', 'orange') !== 'ca:orange') {
    fail('prefill CA orange');
  } else ok('prefill CA orange = ca:orange');
  if (analyzerCountyOptionSlug('north-carolina', 'wake') !== 'nc:wake') {
    fail('prefill NC wake');
  } else ok('prefill NC wake = nc:wake');
  if (analyzerCountyOptionSlug('south-carolina', 'york') !== 'sc:york') {
    fail('prefill SC york');
  } else ok('prefill SC york = sc:york');
  if (analyzerCountyOptionSlug('new-jersey', 'bergen') !== 'nj:bergen') {
    fail('prefill NJ bergen');
  } else ok('prefill NJ bergen = nj:bergen');
  if (analyzerCountyOptionSlug('new-york', 'kings') !== 'ny:kings') {
    fail('prefill NY kings');
  } else ok('prefill NY kings = ny:kings');
  if (analyzerCountyOptionSlug('pennsylvania', 'philadelphia') !== 'pa:philadelphia') {
    fail('prefill PA philadelphia');
  } else ok('prefill PA philadelphia = pa:philadelphia');
  if (analyzerCountyOptionSlug('pennsylvania', 'allegheny') !== 'pa:allegheny') {
    fail('prefill PA allegheny');
  } else ok('prefill PA allegheny = pa:allegheny');
  if (analyzerCountyOptionSlug('tennessee', 'davidson') !== undefined) {
    fail('prefill non-product state should be undefined');
  } else ok('prefill non-product state = undefined');

  console.log('\n=== analyzeLoanEstimate multi-state paths ===');
  const cases: { county: string; expect: string; label: string }[] = [
    { county: 'ga:fulton', expect: 'georgia', label: 'ga:fulton' },
    { county: 'tx:harris', expect: 'texas', label: 'tx:harris' },
    { county: 'ca:los-angeles', expect: 'california', label: 'ca:los-angeles' },
    { county: 'ca:sacramento', expect: 'california', label: 'ca:sacramento' },
    { county: 'nc:wake', expect: 'north-carolina', label: 'nc:wake' },
    { county: 'nc:buncombe', expect: 'north-carolina', label: 'nc:buncombe' },
    { county: 'sc:horry', expect: 'south-carolina', label: 'sc:horry' },
    { county: 'sc:york', expect: 'south-carolina', label: 'sc:york' },
    { county: 'nj:bergen', expect: 'new-jersey', label: 'nj:bergen' },
    { county: 'nj:ocean', expect: 'new-jersey', label: 'nj:ocean' },
    { county: 'nj:middlesex', expect: 'new-jersey', label: 'nj:middlesex' },
    { county: 'ny:kings', expect: 'new-york', label: 'ny:kings' },
    { county: 'ny:suffolk', expect: 'new-york', label: 'ny:suffolk' },
    { county: 'ny:new-york-county', expect: 'new-york', label: 'ny:new-york-county' },
    { county: 'pa:philadelphia', expect: 'pennsylvania', label: 'pa:philadelphia' },
    { county: 'pa:allegheny', expect: 'pennsylvania', label: 'pa:allegheny' },
    { county: 'pa:montgomery', expect: 'pennsylvania', label: 'pa:montgomery' },
    { county: 'pa:lancaster', expect: 'pennsylvania', label: 'pa:lancaster' },
    { county: 'miami-dade', expect: 'florida', label: 'miami-dade' },
    { county: 'orange', expect: 'florida', label: 'orange (FL bare)' },
    { county: 'ca:orange', expect: 'california', label: 'ca:orange' },
  ];
  for (const c of cases) {
    const analysis = analyzeLoanEstimate({
      ...emptyLoanEstimateInputs(),
      loanAmount: 300000,
      interestRate: 6.5,
      countySlug: c.county,
    });
    if (!analysis.hmdaCounty || analysis.hmdaCounty.stateSlug !== c.expect) {
      fail(
        `analyzeLoanEstimate ${c.label} expected ${c.expect} got ${analysis.hmdaCounty?.stateSlug}`
      );
    } else ok(`analyzeLoanEstimate ${c.label} → ${c.expect}`);
  }

  const gaAnalysis = analyzeLoanEstimate({
    ...emptyLoanEstimateInputs(),
    loanAmount: 300000,
    interestRate: 6.5,
    countySlug: 'ga:fulton',
    lenderSlug: 'synovus-bank',
  });
  if (!gaAnalysis.hmdaLender) fail('analyzeLoanEstimate synovus missing');
  else ok(`analyzeLoanEstimate synovus primary=${gaAnalysis.hmdaLender.primaryStateCode}`);

  console.log(`\n=== Result: ${failures === 0 ? 'PASS' : `FAIL (${failures})`} ===`);
  process.exit(failures === 0 ? 0 : 1);
}

try {
  main();
} catch (e) {
  console.error(e);
  process.exit(1);
}
