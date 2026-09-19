// TH-SEARCH-R1-019C: freeze holdout samples BEFORE evaluating the new matcher against them.
//  1. The R1-019A frozen Lender sample, copied UNCHANGED from Ask (original keys and names).
//  2. An additional sample drawn by FIXED POSITIONS from the sources themselves (not from matcher output):
//     every 16th published profile by institution_id, every 37th named HMDA LEI by LEI.
// Expected identity = the record's own source key. Nothing here calls the matcher.
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { SEARCH_POOL } from '../lib/national-profile/discovery';
import { loadLeiIdentityIndex } from '../lib/ask-lender/identity';

const ASK_REPO = process.argv[2];
if (!ASK_REPO) throw new Error('usage: r19c-holdout-draw.mts <path to a Conumers-Trust-Hub checkout>');
const raw = execSync('git show origin/main:docs/qa/th-search-r1-019a/holdout-frozen.json', { cwd: ASK_REPO, encoding: 'utf8', maxBuffer: 1 << 26 });
const ask = JSON.parse(raw) as { frozenAt: string; method: string; hubs: { lender: { drawn: Array<{ key: string; name: string; scope: string; page: number; row: number }> } } };
const r19a = ask.hubs.lender.drawn.map(({ key, name, scope, page, row }) => ({ key, name, scope, page, row }));

const profiles = [...SEARCH_POOL].sort((a, b) => a.institution_id.localeCompare(b.institution_id)).filter((_, i) => i % 16 === 7)
  .map((r) => ({ key: r.stable_key, name: r.presentation_name, expect: { nmls: r.nmls, lei: r.lei, slug: r.slug }, source: 'published_profile' }));
const hmda = [...loadLeiIdentityIndex().byLei.values()].filter((i) => i.hmdaName).sort((a, b) => a.lei.localeCompare(b.lei)).filter((_, i) => i % 37 === 11)
  .map((i) => ({ key: `lei:${i.lei}`, name: i.hmdaName as string, expect: { lei: i.lei }, source: 'hmda_reporting_institution' }));

const out = {
  frozenAt: new Date().toISOString(),
  note: 'Frozen before any evaluation of the R1-019C matcher against these records. Small diagnostic samples; no statistical claim.',
  r19aLenderSample: { source: 'Conumers-Trust-Hub origin/main docs/qa/th-search-r1-019a/holdout-frozen.json (hubs.lender.drawn), copied unchanged', askFrozenAt: ask.frozenAt, askMethod: ask.method, sha256OfAskFile: createHash('sha256').update(raw).digest('hex'), records: r19a },
  additional: { method: 'Fixed positions over the sources: published profiles sorted by institution_id, index % 16 === 7; named HMDA LEIs sorted by LEI, index % 37 === 11.', records: [...profiles, ...hmda] },
};
writeFileSync('docs/qa/th-search-r1-019c/holdout-frozen.json', JSON.stringify(out, null, 1));
console.log('r19a', r19a.length, 'additional', out.additional.records.length, `(profiles ${profiles.length}, hmda ${hmda.length})`);
