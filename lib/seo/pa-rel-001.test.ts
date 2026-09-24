import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { normalizedPublishedStatePath } from './published-state-path';

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), 'utf8');

test('PA-REL-001 mixed-case statewide paths normalize', () => {
  assert.equal(normalizedPublishedStatePath('/Pennsylvania'), '/pennsylvania');
  assert.equal(normalizedPublishedStatePath('/PENNSYLVANIA'), '/pennsylvania');
  assert.equal(normalizedPublishedStatePath('/PeNnSyLvAnIa'), '/pennsylvania');
  assert.equal(normalizedPublishedStatePath('/pennsylvania'), null);
  assert.equal(normalizedPublishedStatePath('/Pennsylvania/philadelphia'), null);
});

test('PA-REL-001 middleware issues 308', () => {
  const mw = read('middleware.ts');
  assert.match(mw, /normalizedPublishedStatePath/);
  assert.match(mw, /308/);
});

test('OH-LEND-001 mixed-case statewide paths normalize', () => {
  assert.equal(normalizedPublishedStatePath('/Ohio'), '/ohio');
  assert.equal(normalizedPublishedStatePath('/OHIO'), '/ohio');
  assert.equal(normalizedPublishedStatePath('/oHiO'), '/ohio');
  assert.equal(normalizedPublishedStatePath('/ohio'), null);
  assert.equal(normalizedPublishedStatePath('/Ohio/columbus'), null);
  // TN-LEND-001: Tennessee, plus the earlier Georgia and Massachusetts pages that were missing here.
  assert.equal(normalizedPublishedStatePath('/Tennessee'), '/tennessee');
  assert.equal(normalizedPublishedStatePath('/TENNESSEE'), '/tennessee');
  assert.equal(normalizedPublishedStatePath('/tennessee'), null);
  assert.equal(normalizedPublishedStatePath('/Tennessee/nashville'), null);
  assert.equal(normalizedPublishedStatePath('/Massachusetts'), '/massachusetts');
  assert.equal(normalizedPublishedStatePath('/Georgia'), '/georgia');
});
