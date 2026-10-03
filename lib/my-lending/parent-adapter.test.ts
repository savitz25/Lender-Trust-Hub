import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { cleanNmlsId } from '../verification/nmls';
import { lenderEntityKey } from '../verification/entity-identity';
import { nationalProfilePath } from '../national-profile/cohort';
import {
  lendingAccountPresentation,
  lenderMyTrustHubAccountEntryEnabled,
  PROFILE_SAVE_LABEL,
  PROFILE_SAVED_LABEL,
} from './account-presentation';

const memory = new Map<string, string>();
const storageShim = {
  getItem(key: string) {
    return memory.has(key) ? memory.get(key)! : null;
  },
  setItem(key: string, value: string) {
    memory.set(key, String(value));
  },
  removeItem(key: string) {
    memory.delete(key);
  },
  clear() {
    memory.clear();
  },
  key(index: number) {
    return [...memory.keys()][index] ?? null;
  },
  get length() {
    return memory.size;
  },
};

type AdapterModule = typeof import('./parent-adapter');
type StoreModule = typeof import('./storage');

let adapter: AdapterModule;
let lendingStore: StoreModule;

test.before(async () => {
  Object.assign(globalThis, {
    window: new EventTarget(),
    localStorage: storageShim,
  });
  adapter = await import('./parent-adapter.ts');
  lendingStore = await import('./storage.ts');
});

const profile = {
  lenderSlug: 'rocket-mortgage',
  lenderName: 'Rocket Mortgage',
  nmlsId: '3030',
  profilePath: '/lenders/rocket-mortgage',
};

function resetDevice() {
  memory.clear();
  lendingStore.setMyLendingStorageIdentity(null);
}

test.beforeEach(() => {
  resetDevice();
  delete process.env.NEXT_PUBLIC_LENDER_MY_TRUSTHUB_ACCOUNT_ENTRY;
});

test('profile control is one Save / Saved toggle and does not create a watch', () => {
  const source = readFileSync(join(process.cwd(), 'components', 'my-lending', 'save-lender-button.tsx'), 'utf8');
  assert.match(source, /profileSaveLabel\(saved\)/);
  assert.equal(source.includes('Trash2'), false);
  assert.equal(source.includes('>Remove<'), false);
  assert.equal(source.includes('Watch'), false);
  assert.equal(source.includes('Alert'), false);
  assert.equal(PROFILE_SAVE_LABEL, '♡ Save');
  assert.equal(PROFILE_SAVED_LABEL, '♥ Saved');
  assert.match(source, /♡ Save|profileSaveLabel/);
});

test('Save then Saved stays one local row and queues one parent acknowledgement', () => {
  const first = adapter.deviceFirstProfileSave(profile);
  const second = adapter.deviceFirstProfileSave(profile);
  assert.equal(first.device.ok, true);
  assert.equal(first.watchCreated, false);
  assert.equal(second.device.ok && second.device.alreadySaved, true);
  assert.equal(adapter.localSavedCountForSlug(profile.lenderSlug), 1);
  assert.equal(lendingStore.isLenderSaved(profile.lenderSlug), true);
  const pending = adapter.listPendingParentOps();
  assert.equal(pending.length, 1);
  assert.equal(pending[0]?.action, 'save');
  assert.equal(pending[0]?.nativeId, '3030');
  assert.equal(pending[0]?.namespace, 'nmls');
  assert.equal(pending[0]?.returnPath, '/lenders/rocket-mortgage');
  assert.equal(pending[0]?.watchCreated, false);
  assert.equal(pending[0]?.parentSync, 'off');
  assert.equal(JSON.stringify(lendingStore.loadState()).toLowerCase().includes('watch'), false);
  assert.equal(JSON.stringify(pending).toLowerCase().includes('alert'), false);
});

test('Saved click removes the local row and acknowledges unsave', () => {
  adapter.deviceFirstProfileSave(profile);
  const removed = adapter.deviceFirstProfileUnsave(profile);
  assert.equal(removed.removed, true);
  assert.equal(removed.watchCreated, false);
  assert.equal(removed.parent.ok, true);
  if (removed.parent.ok) assert.equal(removed.parent.acknowledged, 'unsave');
  assert.equal(lendingStore.isLenderSaved(profile.lenderSlug), false);
  assert.equal(adapter.localSavedCountForSlug(profile.lenderSlug), 0);
  const pending = adapter.listPendingParentOps();
  assert.equal(pending.length, 1);
  assert.equal(pending[0]?.action, 'unsave');
});

test('missing NMLS still saves on the device and fails the parent closed', () => {
  const saved = adapter.deviceFirstProfileSave({
    lenderSlug: 'local-only-lender',
    lenderName: 'Local Only',
    nmlsId: 'SEE-NMLS',
  });
  assert.equal(saved.device.ok, true);
  assert.equal(saved.parent.ok, false);
  if (!saved.parent.ok) assert.equal(saved.parent.reason, 'identity_unresolved');
  assert.equal(saved.parent.pendingSync, false);
  assert.equal(adapter.listPendingParentOps().length, 0);
  assert.equal(adapter.localSavedCountForSlug('local-only-lender'), 1);

  const removed = adapter.deviceFirstProfileUnsave({
    lenderSlug: 'local-only-lender',
    nmlsId: 'not-an-id',
  });
  assert.equal(removed.removed, true);
  assert.equal(removed.parent.ok, false);
  if (!removed.parent.ok) assert.equal(removed.parent.reason, 'identity_unresolved');
  assert.equal(adapter.listPendingParentOps().length, 0);
  assert.equal(adapter.resolveMarketplaceSaveIdentity({ lenderSlug: 'rocket-mortgage', nmlsId: '00000000-0000-4000-8000-000000000000' }), null);
});

test('native identity is the numeric NMLS, not the slug or display name', () => {
  const identity = adapter.resolveMarketplaceSaveIdentity({
    lenderSlug: 'rocket-mortgage',
    nmlsId: 'NMLS #3030',
  });
  assert.ok(identity);
  assert.equal(identity?.nativeId, '3030');
  assert.equal(identity?.namespace, 'nmls');
  assert.equal(identity?.jurisdiction, 'US');
  assert.equal(identity?.publicationSource, 'lender_trust_hub_catalog');
  assert.equal(identity?.publicationGrain, 'company_nmls');
  assert.notEqual(identity?.nativeId, 'rocket-mortgage');
  assert.equal(identity?.returnPath, '/lenders/rocket-mortgage');
  assert.equal(adapter.PRODUCTION_PARENT_SYNC, false);
  assert.equal(adapter.NATIONAL_PROFILE_SAVE, 'not_in_scope');
  const source = readFileSync(join(process.cwd(), 'lib', 'my-lending', 'parent-adapter.ts'), 'utf8');
  assert.equal(source.includes('fetch('), false);
  assert.equal(source.includes('asktrusthub'), false);
});

test('My TrustHub entry is prepared and stays off unless the flag is exactly 1', () => {
  assert.equal(lenderMyTrustHubAccountEntryEnabled(), false);
  assert.equal(lendingAccountPresentation().mode, 'legacy');
  process.env.NEXT_PUBLIC_LENDER_MY_TRUSTHUB_ACCOUNT_ENTRY = '1';
  const on = lendingAccountPresentation();
  assert.equal(on.mode, 'my_trusthub');
  if (on.mode === 'my_trusthub') {
    assert.equal(on.accountLabel, 'My TrustHub');
    assert.equal(on.workspaceLabel, 'My Lending');
    assert.match(on.signInBody, /does not ask you to open a separate Lender account/);
    assert.equal(on.signInBody.includes('Sign in to save this lender to My Lending'), false);
  }
  process.env.NEXT_PUBLIC_LENDER_MY_TRUSTHUB_ACCOUNT_ENTRY = 'true';
  assert.equal(lenderMyTrustHubAccountEntryEnabled(), false);
});

test('search, national profile path, calculator, and compare surfaces stay in place', () => {
  assert.equal(cleanNmlsId('NMLS 3030'), '3030');
  assert.equal(lenderEntityKey({ nmlsId: '3030', id: 'row-1', slug: 'rocket-mortgage' }), 'nmls:3030');
  assert.equal(nationalProfilePath('rocket-mortgage'), '/lender/rocket-mortgage');
  const root = join(process.cwd(), 'components');
  const calc = readFileSync(join(root, 'calculators', 'shared', 'CalcShell.tsx'), 'utf8');
  const compare = readFileSync(join(process.cwd(), 'app', 'compare', 'page.tsx'), 'utf8');
  const card = readFileSync(join(root, 'LenderCard.tsx'), 'utf8');
  assert.match(calc, /SaveCalculatorSnapshotButton/);
  assert.match(compare, /NMLS/);
  assert.match(card, /SaveLenderButton/);
});
