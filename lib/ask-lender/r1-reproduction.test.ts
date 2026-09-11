import assert from 'node:assert/strict';
import test from 'node:test';
import { parseLenderAsk } from './parse';
import { executeAskQuery } from './execute-query';
import { GET } from '../../app/api/ask/route';

test('R1: full spaced NMLS reaches the same parsed identifier', () => {
  assert.equal(parseLenderAsk('nmls 32 51').identifier?.value, '3251');
});
test('R1: verified published positive survives grouped formatting', () => {
  const clean = executeAskQuery({ q: 'NMLS 3030' });
  const spaced = executeAskQuery({ q: 'NMLS 30 30' });
  assert.ok(clean.rows?.length);
  assert.deepEqual(spaced.rows?.map(r => r.nmls), clean.rows?.map(r => r.nmls));
});
test('R1: licensing coverage does not erase explicit identity', () => {
  const result = executeAskQuery({ q: 'NMLS 3030 licensed in California' });
  assert.equal(result.rows?.[0]?.nmls, '3030');
});
test('R1: API cannot truncate away a conflicting suffix', async () => {
  const q = 'NMLS 3030' + ' '.repeat(180) + 'NMLS 3251';
  const response = await GET(new Request('https://www.lendertrusthub.com/api/ask?' + new URLSearchParams({ q })));
  assert.equal(response.status, 400);
});
