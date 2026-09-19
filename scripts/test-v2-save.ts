import assert from 'node:assert/strict';
import { test, beforeEach } from 'node:test';
import { shortlistLender, loadState, setMyLendingStorageIdentity, registerMyLendingCloudPush } from '../lib/my-lending/storage';

const data = new Map<string, string>();
let blocked = false;
Object.defineProperty(globalThis, 'window', { value: new EventTarget(), configurable: true });
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: (key: string) => data.get(key) ?? null,
  setItem: (key: string, value: string) => { if (blocked) throw new DOMException('blocked', 'QuotaExceededError'); data.set(key, value); },
  removeItem: (key: string) => data.delete(key),
} });
beforeEach(() => { blocked = false; data.clear(); registerMyLendingCloudPush(null); setMyLendingStorageIdentity(null); });
const input = { lenderSlug: 'b3-fixture', lenderName: 'B3 fixture', notes: 'Keep private notes' };
test('B3-L01/02/03 immediate local save persists; duplicates preserve identity and notes', () => {
  assert.equal(shortlistLender(input).ok, true);
  const first = loadState().savedLenders[0];
  assert.equal(shortlistLender({ lenderSlug: input.lenderSlug, lenderName: input.lenderName }).ok, true);
  const state = loadState();
  assert.equal(state.savedLenders.length, 1);
  assert.equal(state.savedLenders[0].id, first.id);
  assert.equal(state.savedLenders[0].notes, input.notes);
  assert.equal(state.savedLenders[0].profilePath, '/lenders/b3-fixture');
  assert.equal(JSON.parse(data.get('lth:my-lending:v1')!).savedLenders.length, 1);
});
test('B3-L08 fresh blocked storage returns recoverable failure without throwing or success', () => {
  blocked = true;
  const result = shortlistLender(input);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /storage|save/i);
  assert.equal(data.size, 0);
});
test('B3-L06 mocked ownership keeps guest and existing account namespaces separate', () => {
  shortlistLender(input);
  const guest = data.get('lth:my-lending:v1');
  setMyLendingStorageIdentity('local-test-owner');
  shortlistLender({ lenderSlug: 'account-only', lenderName: 'Account only' });
  assert.equal(loadState().savedLenders.length, 2);
  assert.equal(data.get('lth:my-lending:v1'), guest);
  setMyLendingStorageIdentity(null);
  assert.equal(loadState().savedLenders.length, 1);
});
