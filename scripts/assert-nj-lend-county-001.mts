import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fingerprintSnapshotPayload } from '../lib/intel-snapshots/fingerprint';
import {
  NJ_COUNTY_INTELLIGENCE_GATES,
  NJ_COUNTY_SLUGS,
  NJ_COUNTY_SNAPSHOTS,
  countyPassesPublicationGate,
  countyRobots,
} from '../lib/new-jersey-intelligence/counties';
import { NEW_JERSEY_SNAPSHOT } from '../lib/new-jersey-intelligence/snapshot';
import { buildNjCountyIntelligenceJsonLd, njCountyJsonLdHasForbiddenRatings } from '../lib/new-jersey-intelligence/counties/jsonld';

const sitemap = readFileSync('app/sitemap.ts', 'utf8');
const robots = readFileSync('app/robots.ts', 'utf8');
const stateUi = readFileSync('components/new-jersey/new-jersey-state-intelligence.tsx', 'utf8');
const countyUi = readFileSync('components/new-jersey/new-jersey-county-intelligence.tsx', 'utf8');
const pkg = readFileSync('package.json', 'utf8');
const csv = readFileSync('data/hmda/new-jersey/county_market_summary_nj.csv', 'utf8').trim().split(/\r?\n/);
const header = csv[0].split(',');
const idx = (name: string) => header.indexOf(name);
const csvByFips = new Map(
  csv.slice(1).map((line) => {
    const parts = line.split(',');
    return [
      parts[idx('county_fips')],
      {
        county_name: parts[idx('county_name')],
        applications: Number(parts[idx('total_applications')]),
        originations: Number(parts[idx('total_originations')]),
        denials: Number(parts[idx('denial_count')]),
        purchase: Number(parts[idx('purchase_count')]),
        refinance: Number(parts[idx('refinance_count')]),
        conventional: Number(parts[idx('apps_conventional')]),
        fha: Number(parts[idx('apps_fha')]),
        va: Number(parts[idx('apps_va')]),
        usda: Number(parts[idx('apps_usda_other')]),
      },
    ] as const;
  }),
);

const highDpa = new Set(NEW_JERSEY_SNAPSHOT.njhmfa.dpa.high.counties);
const standardDpa = new Set(NEW_JERSEY_SNAPSHOT.njhmfa.dpa.standard.counties);
const forbidden = /best lenders in|worst county|Trust Score is/;

assert.match(pkg, /assert:nj-lend-county-001/);
assert.doesNotMatch(robots, /\/new-jersey/);
assert.match(stateUi, /\/new-jersey\/monmouth-county/);
assert.match(stateUi, /\/new-jersey\/middlesex-county/);
assert.match(stateUi, /\/new-jersey\/somerset-county/);
assert.match(stateUi, /\/new-jersey\/union-county/);
assert.doesNotMatch(countyUi, forbidden);
assert.match(countyUi, /Eligible borrowers may qualify for up to/);
assert.match(countyUi, /not a quality score/i);
assert.match(countyUi, /not a title report/i);
assert.match(countyUi, /SOURCE_NOT_ACQUIRED/);
assert.doesNotMatch(countyUi, /Residents of this county receive/);

for (const slug of NJ_COUNTY_SLUGS) {
  const s = NJ_COUNTY_SNAPSHOTS[slug];
  const gate = NJ_COUNTY_INTELLIGENCE_GATES[slug];
  const page = `app/new-jersey/${slug}/page.tsx`;
  assert.equal(existsSync(page), true, page);
  assert.match(readFileSync(page, 'utf8'), /index:\s*true|generateNjCountyMetadata/);
  assert.equal(s.county_slug, slug);
  assert.equal(s.path, gate.path);
  assert.equal(s.contract_name, 'lender-nj-county-intel-v1');
  assert.equal(s.parent_state_fingerprint, NEW_JERSEY_SNAPSHOT.fingerprint);
  assert.equal(s.ask_research_sha, 'f0407c3c659886ba46522a4e023989c1641cab7d');
  assert.equal(s.fingerprint.length, 64);
  assert.equal(s.fingerprint, fingerprintSnapshotPayload(s));
  assert.equal(countyPassesPublicationGate(s), true, slug);
  assert.deepEqual(countyRobots(slug), { index: true, follow: true });
  assert.equal(gate.robotsIndex, true);
  assert.equal(gate.sitemap, true);
  assert.match(sitemap, /indexedNjCountyGates/);
  assert.match(sitemap, new RegExp(gate.path.replaceAll('/', '\\/')));
  assert.doesNotMatch(gate.title, /best lender/i);
  assert.doesNotMatch(JSON.stringify(s), /"defendant"\s*:/);
  assert.doesNotMatch(JSON.stringify(s), /"property_address"\s*:/);
  assert.equal(s.property.owner_names_published, false);

  const row = csvByFips.get(s.county_fips);
  assert.ok(row, s.county_fips);
  assert.equal(row!.county_name, s.county_name);
  assert.equal(s.hmda.applications, row!.applications);
  assert.equal(s.hmda.originations, row!.originations);
  assert.equal(s.hmda.denials, row!.denials);
  assert.equal(s.hmda.denial_rate_pct, Number(((row!.denials / row!.applications) * 100).toFixed(2)));
  assert.equal(s.hmda.purchase_applications, row!.purchase);
  assert.equal(s.hmda.refinance_applications, row!.refinance);
  assert.equal(s.hmda.apps_conventional, row!.conventional);
  assert.equal(s.hmda.apps_fha, row!.fha);
  assert.equal(s.hmda.apps_va, row!.va);
  assert.equal(s.hmda.apps_usda_other, row!.usda);
  assert.equal(s.hmda.usda_other_pct, Number(((row!.usda / row!.applications) * 100).toFixed(2)));

  const stateCounty = NEW_JERSEY_SNAPSHOT.hmda.counties.find((c) => c.county_fips === s.county_fips);
  assert.ok(stateCounty);
  assert.equal(stateCounty!.applications, s.hmda.applications);
  assert.equal(stateCounty!.originations, s.hmda.originations);
  assert.equal(stateCounty!.denials, s.hmda.denials);

  assert.equal(highDpa.has(s.county_name), true);
  assert.equal(standardDpa.has(s.county_name), false);
  assert.equal(s.njhmfa.dpa_group, '12_county');
  assert.equal(s.njhmfa.standard_dpa, 15000);
  assert.equal(s.njhmfa.first_generation, 7000);
  assert.equal(s.njhmfa.combined, 22000);
  assert.match(s.njhmfa.copy, /Eligible borrowers may qualify for up to/);
  assert.match(s.njhmfa.caveat, /does not by itself qualify/);
  assert.equal(s.findings.length >= 2, true);
  assert.equal(s.land_records.scrape_status, 'NOT_SCRAPED');
  assert.equal(s.land_records.not_a_title_report, true);
  assert.equal(s.land_records.mortgage_recording_ne_current_balance, true);
  assert.equal(s.lender_discovery.mlo_publication, false);
  assert.equal(s.lender_discovery.hq_in_county_ne_serves_only_county, true);
  assert.equal(s.property.owner_names_published, false);

  const jsonld = buildNjCountyIntelligenceJsonLd(s);
  assert.equal(njCountyJsonLdHasForbiddenRatings(jsonld), false);
  assert.match(JSON.stringify(jsonld), /WebPage/);
}

const monmouth = NJ_COUNTY_SNAPSHOTS['monmouth-county'];
assert.equal(monmouth.land_records.access_class, 'OPEN_SEARCH_ONLY');
assert.equal(monmouth.sheriff.listing_count, 99);
assert.equal(monmouth.sheriff.status_class_counts?.SCHEDULED_NOT_COMPLETED, 34);
assert.equal(monmouth.sheriff.status_class_counts?.ADJOURNED_NOT_COMPLETED, 62);
assert.equal(monmouth.sheriff.status_class_counts?.BANKRUPTCY_NOT_COMPLETED, 3);
assert.equal(monmouth.sheriff.completed_sale_count, 0);
assert.equal(
  34 + 62 + 3,
  99,
);
assert.equal(monmouth.property.feature_count, 249796);

const middlesex = NJ_COUNTY_SNAPSHOTS['middlesex-county'];
assert.equal(middlesex.land_records.access_class, 'OPEN_SEARCH_ONLY');
assert.equal(middlesex.sheriff.listing_count, 175);
assert.equal(middlesex.sheriff.status_class_counts?.SCHEDULED_NOT_COMPLETED, 72);
assert.equal(middlesex.sheriff.status_class_counts?.COMPLETED_SALE, 43);
assert.equal(middlesex.sheriff.status_class_counts?.ADJOURNED_NOT_COMPLETED, 53);
assert.equal(middlesex.sheriff.status_class_counts?.REDEEMED_NOT_COMPLETED, 5);
assert.equal(middlesex.sheriff.status_class_counts?.BANKRUPTCY_NOT_COMPLETED, 2);
assert.equal(72 + 43 + 53 + 5 + 2, 175);
assert.equal(middlesex.property.feature_count, 243019);

const somerset = NJ_COUNTY_SNAPSHOTS['somerset-county'];
assert.equal(somerset.land_records.access_class, 'FREE_ACCOUNT_REQUIRED');
assert.equal(somerset.sheriff.coverage_state, 'SOURCE_NOT_ACQUIRED');
assert.equal(somerset.sheriff.listing_count, null);
assert.equal(somerset.property.feature_count, 132911);
assert.equal(somerset.local_housing_resources, null);
  assert.equal(
    somerset.findings.every((f) => !/senior housing inventory/i.test(`${f.title} ${f.body}`)),
    true,
  );

const union = NJ_COUNTY_SNAPSHOTS['union-county'];
assert.equal(union.land_records.access_class, 'OPEN_SEARCH_ONLY');
assert.equal(union.sheriff.coverage_state, 'SOURCE_NOT_ACQUIRED');
assert.equal(union.property.coverage_state, 'SOURCE_NOT_ACQUIRED');
assert.equal(union.property.feature_count, null);
assert.ok(union.local_housing_resources);
assert.equal(union.local_housing_resources?.not_mortgage_products, true);
assert.match(JSON.stringify(union.local_housing_resources), /2026-01-14/);

const publicIndex = readFileSync('public/sitemap.xml', 'utf8');
const publicNj = readFileSync('public/sitemaps/new-jersey-research.xml', 'utf8');
assert.match(publicIndex, /sitemaps\/new-jersey-research\.xml/);
assert.match(publicNj, /\/new-jersey\/monmouth-county/);
assert.match(publicNj, /\/new-jersey\/middlesex-county/);
assert.match(publicNj, /\/new-jersey\/somerset-county/);
assert.match(publicNj, /\/new-jersey\/union-county/);
assert.match(publicNj, /\/new-jersey</);

assert.equal(existsSync('.vercel/project.json'), false);
assert.equal(existsSync('app/new-jersey/freehold-township/page.tsx'), false);

console.log('NJ-LEND-COUNTY-001 assertions: PASS');
for (const slug of NJ_COUNTY_SLUGS) {
  const s = NJ_COUNTY_SNAPSHOTS[slug];
  console.log(`  ${s.county_name} ${s.hmda.applications} apps / ${s.hmda.originations} orig / ${s.fingerprint.slice(0, 12)}`);
}
