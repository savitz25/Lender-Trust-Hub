/** Deliberately mutate local source, require behavioral failures, then restore bytes. */
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
const cases = [
  { name: 'first-group truncation', file: 'lib/ask-lender/identifier.ts', before: "token.replace(/\\s/g, '')", after: "token.match(/^\\d+/)[0]" },
  { name: 'false source explanation', file: 'lib/ask-lender/identity-lookup.ts', before: 'record lists ${e.returnedValue}.', after: 'record lists 32.' },
  { name: 'person/branch class bypass', file: 'lib/ask-lender/identifier.ts', before: "if (requestedClass === 'person' || requestedClass === 'branch')", after: 'if (false)' },
];
const report = { utc: new Date().toISOString(), checks: [] };
for (const item of cases) {
  const original = readFileSync(item.file);
  const text = original.toString('utf8');
  assert.ok(text.includes(item.before), `mutation target missing: ${item.name}`);
  try {
    writeFileSync(item.file, text.replace(item.before, item.after));
    const result = spawnSync(process.execPath, ['node_modules/tsx/dist/cli.mjs', '--test', 'lib/ask-lender/r1-behavior.test.ts'], { encoding: 'utf8' });
    assert.notEqual(result.status, 0, `tests did not detect ${item.name}`);
    assert.match(result.stdout + result.stderr, /AssertionError/);
    report.checks.push({ mutation: item.name, detected: true, exit: result.status });
  } finally {
    writeFileSync(item.file, original);
    assert.ok(readFileSync(item.file).equals(original));
  }
}
writeFileSync('docs/qa/th-search-r1-002/sensitivity.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
