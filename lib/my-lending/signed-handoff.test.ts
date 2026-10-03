import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
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

type Handoff = typeof import('./signed-handoff');
type Form = typeof import('./handoff-form');
type Source = typeof import('./source-callback');
type Assertion = typeof import('./lender-assertion');
type Manifest = typeof import('./manifest');
type Catalog = typeof import('../lenders');
type Store = typeof import('./storage');
type OneClick = typeof import('./one-click');

let handoff: Handoff;
let form: Form;
let source: Source;
let assertion: Assertion;
let manifest: Manifest;
let catalog: Catalog;
let store: Store;
let oneClick: OneClick;

test.before(async () => {
  handoff = await import('./signed-handoff');
  form = await import('./handoff-form');
  source = await import('./source-callback');
  assertion = await import('./lender-assertion');
  manifest = await import('./manifest');
  catalog = await import('../lenders');
  store = await import('./storage');
  oneClick = await import('./one-click');
});

const gate = { broad: false, canary: true };
const browser = 'b'.repeat(43);

function keys() {
  const pair = generateKeyPairSync('ed25519');
  return {
    privateKey: { kid: 'lender-test', pem: pair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString() },
    publicKey: { kid: 'lender-test', pem: pair.publicKey.export({ type: 'spki', format: 'pem' }).toString() },
  };
}

function nonces() {
  const seen = new Set<string>();
  return { claim: async (key: string) => { if (seen.has(key)) return false; seen.add(key); return true; } };
}

function parentMock(now: number) {
  const calls: Array<{ operation: string; body: string; assertion: string }> = [];
  const saved = new Set<string>();
  return {
    calls,
    saved,
    parent: async (call: { operation: string; body: string; assertion: string }) => {
      calls.push(call);
      if (!call.assertion) return { ok: false as const };
      const body = JSON.parse(call.body) as { operation: string; input: { returnTask?: { profile: { nativeId: string } }; manifestDigest?: string } };
      if (body.operation === 'prepareGuestProfileTransfer') {
        const digest = manifest.manifestDigest(body.input as Parameters<Manifest['manifestDigest']>[0]);
        return { ok: true as const, operation: body.operation, result: { transferRef: 't'.repeat(43), manifestDigest: digest, expiresAt: now + 60_000 } };
      }
      const native = JSON.parse(call.body).input as { manifestDigest?: string };
      saved.add(String(native.manifestDigest));
      return { ok: true as const, operation: body.operation, result: { continuationRef: 'c'.repeat(43), expiresAt: now + 60_000 } };
    },
  };
}

test('A/H eligible marketplace company creates one signed handoff for the catalog NMLS', async () => {
  const now = Date.now();
  const pair = keys();
  const mock = parentMock(now);
  const slug = 'pacific-trust-mortgage';
  const staged = await handoff.stageParentHandoff({
    slug, intent: 'save', pageOpen: true, signedIn: true, gate,
    claimedNmls: '0000000', claimedReturnPath: '/lenders/other', claimedEntityId: 'uuid', claimedName: 'Other',
  }, { catalog: catalog.lenders, now: () => now, key: pair.privateKey, parent: mock.parent, browserBinding: browser });
  assert.equal(staged.state, 'local_only');
  const clean = await handoff.stageParentHandoff({
    slug, intent: 'save', pageOpen: true, signedIn: true, gate,
  }, { catalog: catalog.lenders, now: () => now, key: pair.privateKey, parent: mock.parent, browserBinding: browser });
  assert.equal(clean.state, 'continue');
  if (clean.state !== 'continue') return;
  assert.equal(clean.target, 'https://www.asktrusthub.com/my/profile-save');
  assert.equal(clean.intent, 'save');
  assert.equal(clean.watchCreated, false);
  assert.equal(mock.calls.length, 2);
  const body = JSON.parse(mock.calls[0]!.body) as { input: { returnTask: { returnPath: string; profile: { nativeId: string } } } };
  assert.equal(body.input.returnTask.profile.nativeId, 'nmls:1984721');
  assert.equal(body.input.returnTask.returnPath, '/lenders/pacific-trust-mortgage');
  const request = new Request('https://www.asktrusthub.com/api/my-trusthub/profile-save', {
    method: 'POST', headers: { [assertion.ASSERTION_HEADER]: mock.calls[0]!.assertion }, body: mock.calls[0]!.body,
  });
  const claims = await assertion.verifyLenderAssertion(request, Buffer.from(mock.calls[0]!.body), pair.publicKey, 'lender', 'transfer:stage', nonces(), now);
  assert.equal(claims.lender_origin, 'https://www.lendertrusthub.com');
  assert.equal(mock.saved.size, 1);
});

test('B/C/D missing NMLS, unpublished, and wrong class stay on the device', async () => {
  const now = Date.now();
  const pair = keys();
  let called = false;
  const parent = async () => { called = true; return { ok: false as const }; };
  const row = catalog.getLenderBySlug('pacific-trust-mortgage');
  assert.ok(row);
  const missing = await handoff.stageParentHandoff({
    slug: row!.slug, intent: 'save', pageOpen: true, signedIn: true, gate,
  }, { catalog: [{ ...row!, nmlsId: '' }], now: () => now, key: pair.privateKey, parent });
  const unpublished = await handoff.stageParentHandoff({
    slug: 'pacific-trust-mortgage', intent: 'save', pageOpen: true, signedIn: true, gate,
  }, { catalog: catalog.lenders.filter((item) => item.slug !== 'pacific-trust-mortgage'), now: () => now, key: pair.privateKey, parent });
  const wrong = await handoff.stageParentHandoff({
    slug: row!.slug, intent: 'save', pageOpen: true, signedIn: true, gate, profileClass: 'national_institution',
  }, { catalog: catalog.lenders, now: () => now, key: pair.privateKey, parent });
  assert.equal(missing.state, 'local_only');
  assert.equal(unpublished.state, 'local_only');
  assert.equal(wrong.state, 'local_only');
  if (missing.state === 'local_only') assert.equal(missing.reason, 'missing_nmls');
  if (unpublished.state === 'local_only') assert.equal(unpublished.reason, 'unpublished');
  if (wrong.state === 'local_only') assert.equal(wrong.reason, 'wrong_class');
  assert.equal(called, false);
});

test('E/F tampered NMLS and return path are rejected before signing', async () => {
  const now = Date.now();
  const pair = keys();
  let called = false;
  const parent = async () => { called = true; return { ok: false as const }; };
  const nmls = await handoff.stageParentHandoff({
    slug: 'pacific-trust-mortgage', intent: 'save', pageOpen: true, signedIn: true, gate, claimedNmls: '3030',
  }, { catalog: catalog.lenders, now: () => now, key: pair.privateKey, parent });
  const path = await handoff.stageParentHandoff({
    slug: 'pacific-trust-mortgage', intent: 'save', pageOpen: true, signedIn: true, gate, claimedReturnPath: '/lender/pacific-trust-mortgage',
  }, { catalog: catalog.lenders, now: () => now, key: pair.privateKey, parent });
  assert.equal(nmls.state, 'local_only');
  assert.equal(path.state, 'local_only');
  if (nmls.state === 'local_only') assert.equal(nmls.reason, 'tampered_nmls');
  if (path.state === 'local_only') assert.equal(path.reason, 'tampered_return');
  assert.equal(called, false);
});

test('G unsigned manifest is rejected and an absent signer does not call Ask', async () => {
  const now = Date.now();
  let called = false;
  const parent = async () => { called = true; return { ok: false as const }; };
  const unsigned = await handoff.stageParentHandoff({
    slug: 'pacific-trust-mortgage', intent: 'save', pageOpen: true, signedIn: true, gate,
  }, { catalog: catalog.lenders, now: () => now, parent });
  assert.equal(unsigned.state, 'local_only');
  if (unsigned.state === 'local_only') assert.equal(unsigned.reason, 'unsigned');
  assert.equal(called, false);
  const request = new Request('https://www.asktrusthub.com/api/my-trusthub/profile-save', { method: 'POST', body: '{}' });
  await assert.rejects(() => assertion.verifyLenderAssertion(request, Buffer.from('{}'), keys().publicKey, 'lender', 'transfer:stage', nonces(), now));
});

test('I/J source publication fails closed for a missing or review-only identity', () => {
  assert.equal(source.lenderPublication('nmls:0000001', catalog.lenders), null);
  assert.equal(source.lenderPublication('nmls:1984721', catalog.lenders)?.canonicalSlug, 'pacific-trust-mortgage');
  assert.equal(oneClick.classifyAskBinding('nmls:1984721', []).eligible, false);
  const accepted = {
    id: 'binding-1', networkEntityId: 'entity-1', status: 'review_required', profileClass: 'marketplace_company',
    nativeId: 'nmls:1984721', namespace: 'nmls', sourceIdentifier: '1984721', jurisdiction: 'US', entityStatus: 'active',
  };
  const review = oneClick.classifyAskBinding('nmls:1984721', [accepted]);
  assert.equal(review.eligible, false);
  if (!review.eligible) assert.equal(review.reason, 'review_required');
  const ambiguous = oneClick.classifyAskBinding('nmls:1984721', [accepted, { ...accepted, id: 'binding-2', status: 'accepted' }]);
  assert.equal(ambiguous.eligible, false);
});

test('K/L/M repeated Save is one identity and Unsave is a separate signed intent', async () => {
  const now = Date.now();
  const pair = keys();
  const mock = parentMock(now);
  const deps = { catalog: catalog.lenders, now: () => now, key: pair.privateKey, parent: mock.parent, browserBinding: browser };
  const first = await handoff.stageParentHandoff({ slug: 'metro-home-finance', intent: 'save', pageOpen: true, signedIn: true, gate }, deps);
  const second = await handoff.stageParentHandoff({ slug: 'metro-home-finance', intent: 'save', pageOpen: true, signedIn: true, gate }, deps);
  const removed = await handoff.stageParentHandoff({ slug: 'metro-home-finance', intent: 'unsave', pageOpen: true, signedIn: true, gate }, deps);
  assert.equal(first.state, 'continue');
  assert.equal(second.state, 'continue');
  assert.equal(removed.state, 'continue');
  if (removed.state === 'continue') assert.equal(removed.intent, 'unsave');
  assert.equal(mock.saved.size, 1);
  assert.equal(first.watchCreated, false);
  assert.equal(removed.watchCreated, false);
});

test('N no Watch field is staged', async () => {
  const now = Date.now();
  const pair = keys();
  const mock = parentMock(now);
  await handoff.stageParentHandoff({
    slug: 'lone-star-lending', intent: 'save', pageOpen: true, signedIn: true, gate,
  }, { catalog: catalog.lenders, now: () => now, key: pair.privateKey, parent: mock.parent, browserBinding: browser });
  assert.equal(mock.calls.some((call) => call.body.includes('watch')), false);
});

test('O signed-out Save stages save_signin and does not require a second identity', async () => {
  const now = Date.now();
  const pair = keys();
  const mock = parentMock(now);
  const deps = { catalog: catalog.lenders, now: () => now, key: pair.privateKey, parent: mock.parent, browserBinding: browser };
  const guest = await handoff.stageParentHandoff({
    slug: 'pacific-trust-mortgage', intent: 'save', pageOpen: true, signedIn: false, gate,
  }, deps);
  assert.equal(guest.state, 'continue');
  if (guest.state === 'continue') assert.equal(guest.intent, 'save_signin');
  const after = await handoff.stageParentHandoff({
    slug: 'pacific-trust-mortgage', intent: 'save', pageOpen: true, signedIn: true, gate,
  }, deps);
  assert.equal(after.state, 'continue');
  if (after.state === 'continue') assert.equal(after.intent, 'save');
  const identities = mock.calls.filter((call) => call.body.includes('prepareGuestProfileTransfer')).map((call) => JSON.parse(call.body).input.returnTask.profile.nativeId);
  assert.deepEqual(identities, ['nmls:1984721', 'nmls:1984721']);
});

test('P abandoned handoff resumes once and a sent ticket does not navigate again', () => {
  const store = { getItem: (k: string) => memory.get(k) ?? null, setItem: (k: string, v: string) => { memory.set(k, v); }, removeItem: (k: string) => { memory.delete(k); } };
  const ticket = {
    slug: 'pacific-trust-mortgage',
    target: 'https://www.asktrusthub.com/my/profile-save',
    continuationRef: 'c'.repeat(43),
    intent: 'save_signin' as const,
    phase: 'staged' as const,
    expiresAt: Date.now() + 60_000,
  };
  form.rememberHandoff(store, ticket);
  assert.equal(form.resumeDecision(form.readHandoff(store, ticket.slug, Date.now()), 'visible'), 'submit');
  assert.equal(form.resumeDecision(form.readHandoff(store, ticket.slug, Date.now()), 'hidden'), 'hold');
  form.markHandoffSent(store, ticket);
  assert.equal(form.resumeDecision(form.readHandoff(store, ticket.slug, Date.now()), 'visible'), 'hold');
  assert.equal(form.handoffForm('https://evil.example/my/profile-save', ticket.continuationRef, 'save'), null);
  assert.equal(form.handoffForm(ticket.target + '?next=/', ticket.continuationRef, 'save'), null);
  assert.equal(form.handoffForm(ticket.target, ticket.continuationRef, 'watch'), null);
});

test('production gate and a closed page do not call Ask', async () => {
  const now = Date.now();
  const pair = keys();
  let called = false;
  const parent = async () => { called = true; return { ok: false as const }; };
  const deps = { catalog: catalog.lenders, now: () => now, key: pair.privateKey, parent, browserBinding: browser };
  const production = await handoff.stageParentHandoff({
    slug: 'pacific-trust-mortgage', intent: 'save', pageOpen: true, signedIn: true, gate: oneClick.productionParentGate(),
  }, deps);
  const closed = await handoff.stageParentHandoff({
    slug: 'pacific-trust-mortgage', intent: 'save', pageOpen: false, signedIn: true, gate,
  }, deps);
  assert.equal(production.state, 'local_only');
  if (production.state === 'local_only') assert.equal(production.reason, 'sync_off');
  if (closed.state === 'local_only') assert.equal(closed.reason, 'page_closed');
  assert.equal(oneClick.LENDER_CANARY_ACTIVE, false);
  assert.equal(oneClick.LENDER_PARENT_SYNC_BROAD, false);
  assert.equal(called, false);
});

test('R My Lending plans are unchanged by a parent stage', async () => {
  memory.clear();
  store.setMyLendingStorageIdentity(null);
  const before = store.loadState();
  const now = Date.now();
  const pair = keys();
  const mock = parentMock(now);
  await handoff.stageParentHandoff({
    slug: 'pacific-trust-mortgage', intent: 'save', pageOpen: true, signedIn: true, gate,
  }, { catalog: catalog.lenders, now: () => now, key: pair.privateKey, parent: mock.parent, browserBinding: browser });
  const after = store.loadState();
  assert.equal(after.plans.every((plan) => (plan.calculatorSnapshots ?? []).length === 0), true);
  assert.equal(after.plans.every((plan) => (plan.savedLoanEstimates ?? []).length === 0), true);
  assert.equal(after.plans.every((plan) => (plan.savedLeComparisons ?? []).length === 0), true);
  assert.equal(after.savedLenders.length, before.savedLenders.length);
});

test('source rejects a tampered NMLS and accepts the catalog profile', async () => {
  const now = Date.now();
  const pair = keys();
  const ask = { kid: 'ask-test', pem: pair.privateKey.pem };
  const verify = { kid: 'ask-test', pem: pair.publicKey.pem };
  const publication = source.lenderPublication('nmls:1984721', catalog.lenders, now);
  assert.ok(publication);
  const rebuilt = manifest.lenderManifest(publication!.canonicalSlug, publication!.identity.nativeId);
  const goodBody = JSON.stringify({
    action: 'source', continuationRef: 'c'.repeat(43), transferRef: 't'.repeat(43),
    manifest: rebuilt, manifestDigest: manifest.manifestDigest(rebuilt), expiresAt: now + 60_000,
  });
  const tampered = manifest.lenderManifest(publication!.canonicalSlug, 'nmls:3030');
  const badBody = JSON.stringify({
    action: 'source', continuationRef: 'c'.repeat(43), transferRef: 't'.repeat(43),
    manifest: tampered, manifestDigest: manifest.manifestDigest(rebuilt), expiresAt: now + 60_000,
  });
  const target = 'https://www.lendertrusthub.com/api/my-trusthub/profile-save/source';
  const goodToken = assertion.signLenderAssertion(ask, 'ask', target, 'source:read', Buffer.from(goodBody), browser, null, null, now);
  const badToken = assertion.signLenderAssertion(ask, 'ask', target, 'source:read', Buffer.from(badBody), browser, null, null, now);
  const good = await source.handleLenderSource(new Request(target, { method: 'POST', headers: { 'content-type': 'application/json', [assertion.ASSERTION_HEADER]: goodToken }, body: goodBody }), {
    catalog: catalog.lenders, key: verify, nonces: nonces(), now: () => now,
  });
  const bad = await source.handleLenderSource(new Request(target, { method: 'POST', headers: { 'content-type': 'application/json', [assertion.ASSERTION_HEADER]: badToken }, body: badBody }), {
    catalog: catalog.lenders, key: verify, nonces: nonces(), now: () => now,
  });
  assert.equal(good.status, 200);
  assert.equal(bad.status, 403);
  const unsigned = await source.handleLenderSource(new Request(target, { method: 'POST', headers: { 'content-type': 'application/json' }, body: goodBody }), {
    catalog: catalog.lenders, key: verify, nonces: nonces(), now: () => now,
  });
  assert.equal(unsigned.status, 403);
});
