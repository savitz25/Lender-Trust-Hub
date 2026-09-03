import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const migration = readFileSync('supabase/migrations/20260903160000_nj_lend_002_state_authority_program_market.sql', 'utf8');
const runner = readFileSync('scripts/nj-lend-002.py', 'utf8');
const tests = readFileSync('scripts/nj-lend-002-tests.py', 'utf8');
const rosterReq = readFileSync('docs/nj-lend-002-rmla-license-roster-request.md', 'utf8');
const servicerReq = readFileSync('docs/nj-lend-002-mortgage-servicer-annual-report-request.md', 'utf8');
const complaintReq = readFileSync('docs/nj-lend-002-dobi-complaint-aggregate-request.md', 'utf8');
const contract = readFileSync('docs/nj-lend-002-public-metric-contract.md', 'utf8');
const runbook = readFileSync('docs/nj-lend-002-production-runbook.md', 'utf8');
const recon = readFileSync('docs/sql/nj-lend-002-reconciliation.sql', 'utf8');
const gitignore = readFileSync('.gitignore', 'utf8');
const sitemap = readFileSync('app/sitemap.ts', 'utf8');
const robots = readFileSync('app/robots.ts', 'utf8');
const vercel = readFileSync('vercel.json', 'utf8');
const pkg = readFileSync('package.json', 'utf8');
const snapshot = existsSync('data/reports/nj-lend-002-audited-state-snapshot.json')
  ? readFileSync('data/reports/nj-lend-002-audited-state-snapshot.json', 'utf8')
  : '';

assert.match(runner, /RESIDENTIAL_MORTGAGE_LENDER/);
assert.match(runner, /CORRESPONDENT_RESIDENTIAL_MORTGAGE_LENDER/);
assert.match(runner, /RESIDENTIAL_MORTGAGE_BROKER/);
assert.match(runner, /EXEMPT_COMPANY_REGISTRANT/);
assert.match(runner, /REGISTERED_DEPOSITORY_INSTITUTION/);
assert.match(runner, /NJ_MORTGAGE_SERVICER_LICENSE/);
assert.match(runner, /RMLA_LICENSED_MORTGAGE_SERVICER_REGISTRATION/);
assert.match(runner, /SOURCE_AVAILABLE_BY_REQUEST/);
assert.match(runner, /OPEN_SEARCH_ONLY/);
assert.match(runner, /SOURCE_ACCESS_BLOCKED/);
assert.match(runner, /internal_only/);
assert.match(runner, /baseline_only/);
assert.match(runner, /Incapsula|CAPTCHA|SOURCE_ACCESS_BLOCKED/);
assert.doesNotMatch(runner, /levenshtein/i);
assert.match(migration, /lender_program_catalog/);
assert.match(migration, /lender_program_participations/);
assert.match(migration, /lender_program_limit_observations/);
assert.match(migration, /lender_policy_bulletins/);
assert.match(migration, /lender_state_market_observations/);
assert.match(migration, /lender_monitoring_events/);
assert.match(migration, /force row level security/i);
assert.doesNotMatch(migration, /nj_rmla_companies|nj_lenders|nj_servicers/);
assert.doesNotMatch(migration, /grant\s+select.*(?:anon|authenticated)/i);
assert.match(rosterReq, /2018/);
assert.match(servicerReq, /delinquent loan is not servicer misconduct/i);
assert.match(complaintReq, /complaint is not a violation/i);
assert.match(contract, /publication planning only/i);
assert.match(runbook, /hidcrbexurginnuqgipx/);
assert.match(recon, /lender_program_participations/);
assert.match(gitignore, /data\/nj-raw\//);
assert.doesNotMatch(robots, /disallow:\s*['"]\/new-jersey/);
for (const countyPath of [
  '/new-jersey/monmouth-county',
  '/new-jersey/middlesex-county',
  '/new-jersey/somerset-county',
  '/new-jersey/union-county',
]) {
  assert.match(sitemap, new RegExp(countyPath));
}
assert.equal(existsSync('.vercel/project.json'), false);
assert.match(tests, /broker_ne_lender/);
assert.match(tests, /qi_not_company/);
assert.match(pkg, /assert:nj-lend-002/);
assert.match(vercel, /redirects/);
if (snapshot) {
  assert.match(snapshot, /"new_jersey_route": false/);
  assert.match(snapshot, /"ranking": false/);
  assert.match(snapshot, /"trust_score": false/);
}

console.log('NJ-LEND-002 assertions: PASS');
