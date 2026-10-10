import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import * as store from './storage';
import * as adapter from './parent-adapter';
import * as oneClick from './one-click';
import { MY_LENDING_STORE_KEY } from './types';

const memory = new Map<string, string>();
let blocked: 'all' | string | null = null;
Object.assign(globalThis, {
  window: new EventTarget(),
  localStorage: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (blocked === 'all' || blocked === key) throw new DOMException('Fixture quota', 'QuotaExceededError');
      memory.set(key, value);
    },
    removeItem: (key: string) => memory.delete(key),
  },
});
const profile = { lenderSlug: 'freedom-mortgage', lenderName: 'Freedom Mortgage', nmlsId: '2767' };

test.beforeEach(() => {
  blocked = null;
  memory.clear();
  store.setMyLendingStorageIdentity(null);
  oneClick.resetParentRows();
  mock.method(console, 'warn', () => {});
});
test.afterEach(() => mock.restoreAll());

test('first Save with blocked storage returns a failure instead of a null-plan exception; retry persists once', () => {
  blocked = 'all';
  const failed = adapter.deviceFirstProfileSave(profile);
  assert.equal(failed.device.ok, false);
  assert.equal(failed.parent.pendingSync, false);
  assert.equal(adapter.localSavedCountForSlug(profile.lenderSlug), 0);
  blocked = null;
  assert.equal(adapter.deviceFirstProfileSave(profile).device.ok, true);
  assert.equal(adapter.deviceFirstProfileSave(profile).device.ok, true);
  assert.equal(adapter.localSavedCountForSlug(profile.lenderSlug), 1);
});

test('failed Save on an existing plan reports the storage error, with no parent success or pending claim', () => {
  store.ensureActivePlan();
  blocked = MY_LENDING_STORE_KEY;
  const result = oneClick.clickProfileSave({ ...profile, catalog: [], bindings: [], signedIn: false, pageOpen: true });
  assert.equal(result.device.ok, false);
  assert.equal(result.denyReason, 'device_save_blocked');
  assert.match(result.message, /could not save/i);
  assert.doesNotMatch(result.message, /^Saved on this device/);
  assert.equal(result.pending, false);
  assert.equal(oneClick.listParentRows().length, 0);
});

test('blocked Unsave reports failure, preserves the row and does not replace its Save acknowledgement', () => {
  adapter.deviceFirstProfileSave(profile);
  const before = memory.get(MY_LENDING_STORE_KEY);
  blocked = MY_LENDING_STORE_KEY; // Queue writes still work: do not falsely queue removal.
  const result = adapter.deviceFirstProfileUnsave(profile);
  assert.equal(result.removed, false);
  assert.ok(result.error);
  assert.equal(result.parent.ok, false);
  assert.equal(result.parent.pendingSync, false);
  assert.equal(memory.get(MY_LENDING_STORE_KEY), before);
  assert.equal(adapter.listPendingParentOps()[0]?.action, 'save');
  blocked = null;
  assert.equal(adapter.deviceFirstProfileUnsave(profile).removed, true);
  assert.equal(store.isLenderSaved(profile.lenderSlug), false);
  assert.equal(adapter.listPendingParentOps()[0]?.action, 'unsave');
});

test('blocked Unsave with all storage unavailable returns an error without throwing', () => {
  adapter.deviceFirstProfileSave(profile);
  blocked = 'all';
  assert.equal(adapter.deviceFirstProfileUnsave(profile).removed, false);
  assert.equal(store.isLenderSaved(profile.lenderSlug), true);
});

test('missing local row does not report a removal or queue an Unsave', () => {
  assert.deepEqual(store.removeSavedLender(profile.lenderSlug), { ok: true, removed: false });
  assert.equal(adapter.deviceFirstProfileUnsave(profile).removed, false);
  assert.equal(adapter.listPendingParentOps().length, 0);
});

for (const action of ['save', 'unsave'] as const) {
  test(`pending storage failure preserves a successful device ${action} outcome`, () => {
    if (action === 'unsave') adapter.deviceFirstProfileSave(profile);
    blocked = adapter.PARENT_PENDING_KEY;
    const result = action === 'save' ? adapter.deviceFirstProfileSave(profile) : adapter.deviceFirstProfileUnsave(profile);
    if ('device' in result) assert.equal(result.device.ok, true);
    else assert.equal(result.removed, true);
    assert.equal(result.parent.ok, false);
    if (!result.parent.ok) assert.equal(result.parent.reason, 'pending_storage_blocked');
    assert.equal(result.parent.pendingSync, false);
    assert.equal(store.isLenderSaved(profile.lenderSlug), action === 'save');
  });
}

test('local preparation explicitly reports queued locally, never active synchronization while off', () => {
  const result = adapter.deviceFirstProfileSave(profile);
  assert.equal(result.parent.ok, true);
  assert.equal(result.parent.localQueued, true);
  assert.equal(result.parent.parentSync, 'off');
  assert.equal(result.parent.pendingSync, false);
  const click = oneClick.clickProfileSave({ ...profile, catalog: [], bindings: [], signedIn: false, pageOpen: true });
  assert.equal(click.pending, false);
  assert.equal(click.watchCreated, false);
});

test('failed duplicate Save preserves prior research and can retry without duplicate rows', () => {
  adapter.deviceFirstProfileSave({ ...profile, notes: 'Fixture research' });
  const before = memory.get(MY_LENDING_STORE_KEY);
  blocked = MY_LENDING_STORE_KEY;
  assert.equal(adapter.deviceFirstProfileSave(profile).device.ok, false);
  assert.equal(memory.get(MY_LENDING_STORE_KEY), before);
  blocked = null;
  assert.equal(adapter.deviceFirstProfileSave(profile).device.ok, true);
  assert.equal(store.loadState().savedLenders.length, 1);
  assert.equal(store.loadState().savedLenders[0]?.notes, 'Fixture research');
});
