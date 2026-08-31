import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync('supabase/migrations/20260831160000_fl_lend_002f_observation_ledger.sql', 'utf8');
const runner = readFileSync('scripts/fl-lend-002f.py', 'utf8');

assert.match(runner, /EXACT_NMLS_INSTITUTION/, 'company identity uses exact NMLS');
assert.match(runner, /UNRESOLVED_SOURCE_COMPANY_NMLS/, 'unresolved companies remain held');
assert.match(runner, /CREDENTIAL_MULTI_OWNER_COLLISION/, 'MLDB7594 collision is explicit');
assert.match(runner, /license_number<>'MLDB7594'/, 'collision is excluded from canonical attachment');
assert.match(runner, /MLO_PENDING/, 'pending MLOs are represented separately');
assert.match(runner, /person_mlo/, 'MLO entity kind remains person');
assert.match(runner, /entity_kind.*branch/s, 'branch remains a branch');
assert.match(runner, /Requested remains observation-only/, 'requested sponsorship cannot become accepted');
assert.doesNotMatch(runner, /fuzzy|levenshtein|similarity\(/i, 'no fuzzy identity join exists');
assert.match(runner, /internal_only/, 'MLO contacts are internal only');
assert.match(runner, /review_before_public/, 'company contacts require review');
assert.match(runner, /BRANCH_MANAGER/, 'branch manager relationship is separate');
assert.match(runner, /REVIEW_REQUIRED/, 'branch manager remains review gated');
assert.match(runner, /raw_record/, 'raw source values are retained');
assert.match(runner, /normalized_record/, 'normalized values are separate');
assert.match(runner, /COUNTRY_ANOMALIES/, 'country anomalies have an explicit classification set');
assert.match(runner, /person_public_candidate/, 'public-person invariant is checked');
assert.match(runner, /institutions_minted_002f/, 'institution minting is checked');
assert.match(runner, /on conflict.*do nothing/is, 'source and observation inserts are idempotent');
assert.match(migration, /force row level security/gi, 'new internal tables force RLS');
assert.doesNotMatch(migration, /grant\s+select.*(?:anon|authenticated)/i, 'no customer Data API grants');
assert.doesNotMatch(runner, /public_projection_status[^\n]*projected/, 'no public projection promotion');
assert.doesNotMatch(runner, /lender_profile_intelligence\s*(?:set|values|\()/i, 'no profile publication mutation');

console.log('FL-LEND-002F assertions: PASS');
