import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { NEW_JERSEY_INTELLIGENCE_GATE } from '../lib/new-jersey-intelligence/publication';
import { NEW_JERSEY_SNAPSHOT } from '../lib/new-jersey-intelligence/snapshot';
import { attachNjProfileEvidence } from '../lib/new-jersey-intelligence/profile-attachment';
import { buildNewJerseyIntelligenceJsonLd, njJsonLdHasForbiddenRatings } from '../lib/new-jersey-intelligence/jsonld';
const sitemap = readFileSync('app/sitemap.ts', 'utf8');
const robots = readFileSync('app/robots.ts', 'utf8');
const page = readFileSync('app/new-jersey/page.tsx', 'utf8');
const ui = readFileSync('components/new-jersey/new-jersey-state-intelligence.tsx', 'utf8');
const dpaUi = ui;
const pkg = readFileSync('package.json', 'utf8');
const footer = readFileSync('lib/design/lender-design-system.ts', 'utf8');
const csv = readFileSync('data/hmda/new-jersey/county_market_summary_nj.csv', 'utf8').trim().split(/\r?\n/);
const header = csv[0].split(',');
const idx = (name: string) => header.indexOf(name);
const rows = csv.slice(1).map((line) => {
  const parts = line.split(',');
  return {
    total_applications: parts[idx('total_applications')],
    total_originations: parts[idx('total_originations')],
    denial_count: parts[idx('denial_count')],
    purchase_count: parts[idx('purchase_count')],
    refinance_count: parts[idx('refinance_count')],
    apps_conventional: parts[idx('apps_conventional')],
  };
});

const s = NEW_JERSEY_SNAPSHOT;
const apps = rows.reduce((n, r) => n + Number(r.total_applications), 0);
const orig = rows.reduce((n, r) => n + Number(r.total_originations), 0);
const den = rows.reduce((n, r) => n + Number(r.denial_count), 0);
const purch = rows.reduce((n, r) => n + Number(r.purchase_count), 0);
const refi = rows.reduce((n, r) => n + Number(r.refinance_count), 0);
const conv = rows.reduce((n, r) => n + Number(r.apps_conventional), 0);

assert.equal(existsSync('app/new-jersey/page.tsx'), true);
assert.equal(NEW_JERSEY_INTELLIGENCE_GATE.path, '/new-jersey');
assert.equal(NEW_JERSEY_INTELLIGENCE_GATE.robotsIndex, true);
assert.equal(NEW_JERSEY_INTELLIGENCE_GATE.sitemap, true);
assert.match(page, /index:\s*true/);
assert.match(page, /follow:\s*true/);
assert.match(page, /canonical/);
assert.match(sitemap, /\/new-jersey/);
assert.doesNotMatch(robots, /\/new-jersey/);
assert.match(footer, /\/new-jersey/);
assert.match(pkg, /assert:nj-lend-003/);

assert.equal(s.hmda.applications, apps);
assert.equal(s.hmda.originations, orig);
assert.equal(s.hmda.denials, den);
assert.equal(s.hmda.denial_rate_pct, Number(((den / apps) * 100).toFixed(2)));
assert.equal(s.hmda.purchase_pct_of_apps, Number(((purch / apps) * 100).toFixed(2)));
assert.equal(s.hmda.refinance_pct_of_apps, Number(((refi / apps) * 100).toFixed(2)));
assert.equal(s.hmda.conventional_pct, Number(((conv / apps) * 100).toFixed(2)));
assert.equal(s.hmda.county_count, 21);
assert.equal(s.hmda.all_21_counties, true);
assert.equal(s.hmda.counties.length, 21);
assert.equal(s.hmda.omitted.median_loan_amount.includes('Not present'), true);

assert.equal(s.njhmfa.dpa.high.counties.length, 12);
assert.equal(s.njhmfa.dpa.standard.counties.length, 9);
assert.match(s.njhmfa.dpa.high.copy, /up to/);
assert.match(s.njhmfa.dpa.standard.copy, /up to/);
assert.match(dpaUi, /eligible borrowers may qualify for[\s\S]*up to/i);
assert.doesNotMatch(dpaUi, /Residents of this county receive/);

assert.equal(s.njhmfa.participating_lenders.count, 89);
assert.match(s.njhmfa.participating_lenders.consumer_safe_label, /April 2026 participating-lender activity list/);
assert.match(s.njhmfa.participating_lenders.grain, /not the complete current approved-lender universe/i);
assert.match(s.njhmfa.participating_lenders.caveat, /not an endorsement/i);
assert.equal(s.njhmfa.participating_lenders.exact_nmls_printed, 0);
assert.equal(s.njhmfa.participating_lenders.names.every((n) => !('nmls_id' in n)), true);

assert.match(ui, /SOURCE_NOT_ACQUIRED/);
assert.match(ui, /not a finding[\s\S]*zero actions/i);
assert.match(s.rmla.copy, /not a bulk licensee roster/i);
assert.match(s.servicer.caveat, /zero servicers/i);
assert.match(s.complaints.caveat, /not a violation/i);
assert.match(s.hmda.caveat, /does not prove discrimination/i);
assert.doesNotMatch(ui, /Trust Score is/);
assert.doesNotMatch(ui, /best lender|worst county/i);
assert.doesNotMatch(sitemap, /\/new-jersey\/[a-z]/);

const withheld = attachNjProfileEvidence({ matchStatus: 'REVIEW_REQUIRED', nmlsInstitutionId: '3029' });
assert.equal(withheld.status, 'WITHHELD');
const individual = attachNjProfileEvidence({ isIndividual: true, nmlsInstitutionId: s.profile_modules.exact_nmls_institution_ids ? '3030' : '1' });
assert.equal(individual.status, 'WITHHELD');
const sampleExact = attachNjProfileEvidence({ nmlsInstitutionId: '176743' });
if (sampleExact.status === 'EXACT') {
  assert.equal(sampleExact.identifierType, 'NMLS_INSTITUTION');
}

const jsonld = buildNewJerseyIntelligenceJsonLd(s);
assert.equal(njJsonLdHasForbiddenRatings(jsonld), false);
assert.match(JSON.stringify(jsonld), /WebPage/);
assert.equal(existsSync('app/new-jersey'), true);
assert.equal(existsSync('.vercel/project.json'), false);
assert.ok(s.fingerprint.length === 64);
assert.equal(s.hero.universe_label.includes('HMDA'), true);
assert.notEqual(s.hero.universe_value, 0);
assert.ok(!s.rmla.bulk_roster);

console.log('NJ-LEND-003 assertions: PASS');
console.log(`  HMDA ${s.hmda.applications} apps / ${s.hmda.originations} orig / ${s.hmda.denial_rate_pct}%`);
console.log(`  fingerprint ${s.fingerprint}`);
