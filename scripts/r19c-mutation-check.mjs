// TH-SEARCH-R1-019C mutation checks. Each mutation re-introduces a defect this milestone removes or must
// never allow; the gate MUST go red. Files are restored byte-for-byte from memory (never git checkout).
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const PASS = new RegExp('ℹ pass (' + '[0-9]+)');
const FAIL = new RegExp('ℹ fail (' + '[0-9]+)');
const FAILED_TEST = new RegExp('^✖ ([0-9][0-9]) ', 'gm');
const run = () => {
  const r = spawnSync('npx', ['tsx', '--test', 'lib/name-candidates/th-search-r1-019c.test.ts'], { encoding: 'utf8', shell: true });
  const out = r.stdout + r.stderr;
  return { pass: Number(PASS.exec(out)?.[1] ?? -1), fail: Number(FAIL.exec(out)?.[1] ?? -1), failing: [...out.matchAll(FAILED_TEST)].map((m) => m[1]).filter((v, i, a) => a.indexOf(v) === i) };
};
const sha = (file) => createHash('sha1').update(readFileSync(file)).digest('hex');
const CR = String.fromCharCode(13);

const mutations = [
  { id: 'A_EXACT_ONLY_CANDIDATES', file: 'lib/name-candidates/engine.ts', why: 'Candidate matching is exact-only again (the R1-019A 5/20 defect).',
    find: "  if (name.field === 'derived_slug_form') return null;", replace: '  if (name.field.length > 0) return null;' },
  { id: 'B_NAME_FILTER_DROPPED', file: 'lib/name-candidates/engine.ts', why: 'The name predicate is dropped: every institution becomes a candidate (an unfiltered directory).',
    find: '    if (!hit) continue;', replace: "    if (!hit) { seen.add(institution.institutionKey); all.push({ institution, method: 'DISTINCTIVE_TOKENS', rank: 6, matchedName: institution.names[0], explanation: 'mutation' }); continue; }" },
  // First occurrence of this line is inside executeComplaintEvidence.
  { id: 'C_CANDIDATES_ATTACH_COMPLAINTS', file: 'lib/specialist-execution/identity-execution.ts', why: 'Complaint evidence attaches on a loose (prefix) name match instead of the exact accepted identity.',
    find: '  const matches = matchNames(requestedName);', replace: "  const matches = matchNames(requestedName).length ? matchNames(requestedName) : SEARCH_POOL.filter((r) => normalizeName(r.presentation_name).startsWith(normalizeName(requestedName).split(' ')[0] ?? '~')).slice(0, 1);" },
];

const report = { generatedAt: new Date().toISOString(), cleanBefore: run(), mutations: [], cleanAfter: null };
if (report.cleanBefore.fail !== 0) throw new Error('gate is not clean before mutation');
for (const m of mutations) {
  const original = readFileSync(m.file); const before = sha(m.file);
  const text = original.toString('utf8').split(CR).join('');
  if (!text.includes(m.find)) throw new Error('anchor missing for ' + m.id);
  let result;
  try { writeFileSync(m.file, text.replace(m.find, m.replace)); result = run(); }
  finally { writeFileSync(m.file, original); }
  report.mutations.push({ id: m.id, why: m.why, detected: result.fail > 0, failedTests: result.failing, restoredByteIdentical: sha(m.file) === before });
}
report.cleanAfter = run();
writeFileSync('docs/qa/th-search-r1-019c/mutation-report.json', JSON.stringify(report, null, 1));
for (const m of report.mutations) console.log((m.detected ? 'DETECTED ' : 'MISSED   ') + m.id + ' -> failing tests ' + m.failedTests.join(',') + ' | restored byte-identical: ' + m.restoredByteIdentical);
console.log('clean before ' + report.cleanBefore.pass + '/' + report.cleanBefore.fail + ' | clean after ' + report.cleanAfter.pass + '/' + report.cleanAfter.fail);
if (report.mutations.some((m) => !m.detected || !m.restoredByteIdentical) || report.cleanAfter.fail !== 0) process.exit(1);
