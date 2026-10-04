import assert from 'node:assert/strict';
import test from 'node:test';

const memory = new Map<string, string>();
Object.assign(globalThis, {
  window: new EventTarget(),
  localStorage: {
    getItem: (key: string) => (memory.has(key) ? memory.get(key)! : null),
    setItem: (key: string, value: string) => { memory.set(key, String(value)); },
    removeItem: (key: string) => { memory.delete(key); },
    clear: () => { memory.clear(); },
    key: (index: number) => [...memory.keys()][index] ?? null,
    get length() { return memory.size; },
  },
});

type OneClick = typeof import('./one-click');
type Store = typeof import('./storage');
type Catalog = typeof import('../lenders');

let oneClick: OneClick;
let store: Store;
let catalog: Catalog;

test.before(async () => {
  oneClick = await import('./one-click');
  store = await import('./storage');
  catalog = await import('../lenders');
});

const gate = { broad: false, canary: true };

function canary() {
  return oneClick.LENDER_CANARIES[0]!;
}

function accepted() {
  const row = canary();
  return {
    id: 'binding-1',
    networkEntityId: 'entity-1',
    status: 'accepted' as const,
    profileClass: 'marketplace_company',
    nativeId: `nmls:${row.nmls}`,
    namespace: 'nmls',
    sourceIdentifier: row.nmls,
    jurisdiction: 'US',
    entityStatus: 'active',
  };
}

function reset() {
  memory.clear();
  store.setMyLendingStorageIdentity(null);
  oneClick.resetParentRows();
}

test.beforeEach(reset);

test('published NMLS profile is eligible and missing, unpublished, and wrong class are denied', () => {
  for (const candidate of oneClick.LENDER_CANARIES) {
    const candidateProfile = oneClick.assessMarketplaceProfile(candidate.slug, 'marketplace_company', catalog.lenders);
    assert.equal(candidateProfile.ok, true, candidate.slug);
    if (candidateProfile.ok) assert.equal(candidateProfile.nmls, candidate.nmls);
  }
  const row = canary();
  const published = oneClick.assessMarketplaceProfile(row.slug, 'marketplace_company', catalog.lenders);
  assert.equal(published.ok, true);
  if (published.ok) {
    assert.equal(published.nmls, row.nmls);
    assert.equal(published.nativeId, `nmls:${row.nmls}`);
    assert.equal(published.returnPath, `/lenders/${row.slug}`);
  }
  const found = catalog.getLenderBySlug(row.slug);
  assert.ok(found);
  const missingNmls = oneClick.assessMarketplaceProfile(row.slug, 'marketplace_company', [{ ...found!, nmlsId: '' }]);
  const unpublished = oneClick.assessMarketplaceProfile('not-a-published-lender', 'marketplace_company', catalog.lenders);
  const wrongClass = oneClick.assessMarketplaceProfile(row.slug, 'national_institution', catalog.lenders);
  assert.equal(missingNmls.ok, false);
  assert.equal(unpublished.ok, false);
  assert.equal(wrongClass.ok, false);
  if (!missingNmls.ok) assert.equal(missingNmls.reason, 'missing_nmls');
  if (!unpublished.ok) assert.equal(unpublished.reason, 'unpublished');
  if (!wrongClass.ok) assert.equal(wrongClass.reason, 'wrong_class');
  const binding = accepted();
  const missingBinding = oneClick.classifyAskBinding(binding.nativeId, []);
  const ambiguous = oneClick.classifyAskBinding(binding.nativeId, [binding, { ...binding, id: 'binding-2' }]);
  const review = oneClick.classifyAskBinding(binding.nativeId, [{ ...binding, status: 'review_required' }]);
  assert.equal(missingBinding.eligible, false);
  assert.equal(ambiguous.eligible, false);
  assert.equal(review.eligible, false);
  if (!missingBinding.eligible) assert.equal(missingBinding.reason, 'missing');
  if (!ambiguous.eligible) assert.equal(ambiguous.reason, 'ambiguous');
  if (!review.eligible) assert.equal(review.reason, 'review_required');
});

test('exact accepted binding saves one parent row and a repeat does not add another', () => {
  const first = oneClick.clickProfileSave({
    lenderSlug: canary().slug, lenderName: canary().name, nmlsId: canary().nmls, catalog: catalog.lenders,
    bindings: [accepted()], signedIn: true, pageOpen: true, gate,
  });
  const second = oneClick.clickProfileSave({
    lenderSlug: canary().slug, lenderName: canary().name, nmlsId: canary().nmls, catalog: catalog.lenders,
    bindings: [accepted()], signedIn: true, pageOpen: true, gate,
  });
  assert.equal(first.parent, 'saved');
  assert.equal(second.parent, 'already_saved');
  assert.equal(oneClick.listParentRows().length, 1);
  assert.equal(oneClick.listParentRows()[0]?.watchCreated, false);
  const state = store.loadState();
  assert.equal(state.savedLenders.filter((row) => row.lenderSlug === canary().slug).length, 1);
  assert.equal(state.plans.every((plan) => (plan.calculatorSnapshots ?? []).length === 0), true);
  assert.equal(state.plans.every((plan) => (plan.savedLoanEstimates ?? []).length === 0), true);
  assert.equal(state.plans.every((plan) => (plan.savedLeComparisons ?? []).length === 0), true);
});

test('Saved removes the local row and the parent row', () => {
  oneClick.clickProfileSave({
    lenderSlug: canary().slug, lenderName: canary().name, nmlsId: canary().nmls, catalog: catalog.lenders,
    bindings: [accepted()], signedIn: true, pageOpen: true, gate,
  });
  const removed = oneClick.clickProfileUnsave({
    lenderSlug: canary().slug, nmlsId: canary().nmls, signedIn: true, gate,
  });
  assert.equal(removed.removed, true);
  assert.equal(removed.parentRemoved, true);
  assert.equal(removed.watchCreated, false);
  assert.equal(oneClick.listParentRows().length, 0);
  assert.equal(store.isLenderSaved(canary().slug), false);
});

test('project conflict keeps the save and does not create a watch', () => {
  const saved = oneClick.clickProfileSave({
    lenderSlug: canary().slug, lenderName: canary().name, nmlsId: canary().nmls, catalog: catalog.lenders,
    bindings: [accepted()], signedIn: true, pageOpen: true, projectConflict: true, gate,
  });
  assert.equal(saved.parent, 'saved');
  assert.equal(oneClick.listParentRows()[0]?.projectConflict, true);
  assert.equal(oneClick.listParentRows()[0]?.projectRef, null);
  assert.equal(oneClick.listParentRows()[0]?.watchCreated, false);
});

test('signed-out save stays on the device and sign-in completes it without a second parent row', () => {
  const guest = oneClick.clickProfileSave({
    lenderSlug: canary().slug, lenderName: canary().name, nmlsId: canary().nmls, catalog: catalog.lenders,
    bindings: [accepted()], signedIn: false, pageOpen: true, gate,
  });
  assert.equal(guest.parent, 'off');
  assert.match(guest.message, /Sign in to My TrustHub/);
  assert.equal(oneClick.listParentRows().length, 0);
  assert.equal(store.isLenderSaved(canary().slug), true);
  const synced = oneClick.completePendingAfterSignIn({
    lenderSlug: canary().slug, lenderName: canary().name, nmlsId: canary().nmls, catalog: catalog.lenders,
    bindings: [accepted()], pageOpen: true, gate,
  });
  assert.equal(synced.parent, 'saved');
  assert.equal(oneClick.listParentRows().length, 1);
  assert.equal(store.loadState().savedLenders.filter((row) => row.lenderSlug === canary().slug).length, 1);
});

test('production gate and a closed page do not write a parent row', () => {
  const absent = oneClick.productionParentGate({});
  assert.equal(absent.parentSync, 'off');
  assert.equal(absent.canary, false);
  assert.equal(absent.broad, false);
  const production = oneClick.clickProfileSave({
    lenderSlug: canary().slug, lenderName: canary().name, nmlsId: canary().nmls, catalog: catalog.lenders,
    bindings: [accepted()], signedIn: true, pageOpen: true, gate: absent,
  });
  assert.equal(production.parent, 'off');
  assert.equal(oneClick.listParentRows().length, 0);
  const closed = oneClick.clickProfileSave({
    lenderSlug: canary().slug, lenderName: canary().name, nmlsId: canary().nmls, catalog: catalog.lenders,
    bindings: [accepted()], signedIn: true, pageOpen: false, gate,
  });
  assert.equal(closed.denyReason, 'page_closed');
  assert.equal(oneClick.listParentRows().length, 0);
  const broad = oneClick.clickProfileSave({
    lenderSlug: canary().slug, lenderName: canary().name, nmlsId: canary().nmls, catalog: catalog.lenders,
    bindings: [accepted()], signedIn: true, pageOpen: true, gate: { broad: true, canary: true },
  });
  assert.equal(broad.parent, 'off');
  assert.equal(oneClick.listParentRows().length, 0);
});

const CANARY_ENV = {
  NEXT_PUBLIC_LENDER_PARENT_SAVE_ENABLED: '1',
  MTH_LENDER_PARENT_SAVE_MODE: 'production',
  NEXT_PUBLIC_LENDER_PARENT_SAVE_CANARY_SLUGS: 'freedom-mortgage,loandepot,guaranteed-rate',
};

test('A absent flags stay off', () => {
  const gate = oneClick.productionParentGate({});
  assert.equal(gate.enabled, false);
  assert.equal(gate.parentSync, 'off');
  assert.equal(gate.canary, false);
  assert.equal(gate.broad, false);
  assert.equal(oneClick.releaseAdmits('freedom-mortgage', gate), false);
});

test('B enabled production with the three slugs is canary and not broad', () => {
  const gate = oneClick.productionParentGate(CANARY_ENV);
  assert.equal(gate.parentSync, 'production');
  assert.equal(gate.canary, true);
  assert.equal(gate.broad, false);
  assert.equal(gate.enabled, true);
});

test('C D E the three approved slugs are admitted', () => {
  const gate = oneClick.productionParentGate(CANARY_ENV);
  assert.equal(oneClick.releaseAdmits('freedom-mortgage', gate), true);
  assert.equal(oneClick.releaseAdmits('loandepot', gate), true);
  assert.equal(oneClick.releaseAdmits('guaranteed-rate', gate), true);
});

test('F an unrelated lender is not admitted', () => {
  const gate = oneClick.productionParentGate(CANARY_ENV);
  assert.equal(oneClick.releaseAdmits('rocket-mortgage', gate), false);
  assert.equal(oneClick.releaseAdmits('windy-city-mortgage', gate), false);
});

test('G empty slug list with enabled production is broad', () => {
  const gate = oneClick.productionParentGate({
    NEXT_PUBLIC_LENDER_PARENT_SAVE_ENABLED: '1',
    MTH_LENDER_PARENT_SAVE_MODE: 'production',
    NEXT_PUBLIC_LENDER_PARENT_SAVE_CANARY_SLUGS: '',
  });
  assert.equal(gate.parentSync, 'production');
  assert.equal(gate.canary, false);
  assert.equal(gate.broad, true);
  assert.equal(oneClick.releaseAdmits('rocket-mortgage', gate), true);
  const denied = oneClick.clickProfileSave({
    lenderSlug: 'freedom-mortgage', lenderName: 'Freedom Mortgage', nmlsId: '2767', catalog: catalog.lenders,
    bindings: [], signedIn: true, pageOpen: true, gate,
  });
  assert.equal(denied.parent, 'denied');
  if (denied.parent === 'denied') assert.equal(denied.denyReason, 'missing');
});

test('H bad mode or slug config fails closed', () => {
  const cases = [
    { NEXT_PUBLIC_LENDER_PARENT_SAVE_ENABLED: '1', MTH_LENDER_PARENT_SAVE_MODE: 'preview', NEXT_PUBLIC_LENDER_PARENT_SAVE_CANARY_SLUGS: 'freedom-mortgage' },
    { NEXT_PUBLIC_LENDER_PARENT_SAVE_ENABLED: '1', MTH_LENDER_PARENT_SAVE_MODE: 'Production', NEXT_PUBLIC_LENDER_PARENT_SAVE_CANARY_SLUGS: 'freedom-mortgage' },
    { NEXT_PUBLIC_LENDER_PARENT_SAVE_ENABLED: 'true', MTH_LENDER_PARENT_SAVE_MODE: 'production', NEXT_PUBLIC_LENDER_PARENT_SAVE_CANARY_SLUGS: 'freedom-mortgage' },
    { NEXT_PUBLIC_LENDER_PARENT_SAVE_ENABLED: '1', MTH_LENDER_PARENT_SAVE_MODE: 'production', NEXT_PUBLIC_LENDER_PARENT_SAVE_CANARY_SLUGS: 'Freedom Mortgage' },
    { NEXT_PUBLIC_LENDER_PARENT_SAVE_ENABLED: '1', MTH_LENDER_PARENT_SAVE_MODE: 'production', NEXT_PUBLIC_LENDER_PARENT_SAVE_CANARY_SLUGS: 'freedom-mortgage,freedom-mortgage' },
    { NEXT_PUBLIC_LENDER_PARENT_SAVE_ENABLED: '1', MTH_LENDER_PARENT_SAVE_MODE: 'production', NEXT_PUBLIC_LENDER_PARENT_SAVE_CANARY_SLUGS: '../freedom-mortgage' },
    { NEXT_PUBLIC_LENDER_PARENT_SAVE_ENABLED: '1', NEXT_PUBLIC_LENDER_PARENT_SAVE_CANARY_SLUGS: 'freedom-mortgage,loandepot,guaranteed-rate' },
  ];
  for (const env of cases) {
    const gate = oneClick.productionParentGate(env);
    assert.equal(gate.parentSync, 'off', JSON.stringify(env));
    assert.equal(gate.canary, false);
    assert.equal(gate.broad, false);
    assert.equal(oneClick.releaseAdmits('freedom-mortgage', gate), false);
  }
});
